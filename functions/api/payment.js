/**
 * Payment API
 * POST /api/payment/create - Create payment order
 * POST /api/payment/verify - Verify payment (webhook or manual)
 * GET /api/payment/status/:order_ref - Check payment status
 */

import { upgradeAccess, logAudit } from '../lib/access-control.js';
import { requireAuth } from '../lib/auth.js';
import { generateSecureString } from '../lib/security.js';

// Generate unique order reference
function generateOrderRef() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = generateSecureString(8, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    return `ORD-${date}-${random}`;
}

// Package pricing
const PACKAGES = {
    basic: { price: 4900, name: 'Asas' },
    premium: { price: 9900, name: 'Premium' },
    business: { price: 19900, name: 'Bisnes' }
};

/**
 * POST /api/payment/create
 * Create a new payment order
 */
export async function onRequestPost(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // Route to appropriate handler
    if (path.endsWith('/create')) {
        return handleCreatePayment(request, env);
    } else if (path.endsWith('/verify')) {
        return handleVerifyPayment(request, env);
    } else if (path.endsWith('/webhook/billplz')) {
        return handleBillplzWebhook(request, env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function handleCreatePayment(request, env) {
    // Verify user authentication
    const { user, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) {
        // Return JSON error for frontend
        return new Response(JSON.stringify({
            error: 'Unauthorized',
            message: 'Sila log masuk semula'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const userId = user.id;

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { eventId, packageId, paymentMethod } = data;

    // Enforce known payment methods to prevent arbitrary values being stored/used
    const allowedMethods = ['billplz', 'duitnow', 'manual'];
    const sanitizedMethod = paymentMethod && allowedMethods.includes(paymentMethod)
        ? paymentMethod
        : 'billplz';

    // Validate package
    const pkg = PACKAGES[packageId];
    if (!pkg) {
        return new Response(JSON.stringify({ error: 'Invalid package' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Validate event exists
    const event = await env.DB.prepare(`
        SELECT id, event_name FROM events WHERE id = ?
    `).bind(eventId).first();

    if (!event) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Check for existing pending/verified payment
    const existingPayment = await env.DB.prepare(`
        SELECT id, status FROM payment_orders 
        WHERE event_id = ? AND status IN ('pending', 'verified')
        ORDER BY created_at DESC LIMIT 1
    `).bind(eventId).first();

    if (existingPayment?.status === 'verified') {
        return new Response(JSON.stringify({
            error: 'Event already has active payment',
            existingOrderId: existingPayment.id
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Generate order reference
    const orderRef = generateOrderRef();

    // Set expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
        // Create payment order
        const result = await env.DB.prepare(`
            INSERT INTO payment_orders (
                event_id, user_id, order_ref, amount_cents, package_id, 
                payment_method, status, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
        `).bind(
            eventId,
            userId,
            orderRef,
            pkg.price,
            packageId,
            sanitizedMethod,
            expiresAt.toISOString()
        ).run();

        // Log audit
        await logAudit(env, 'payment_created', {
            eventId,
            userId,
            orderRef,
            packageId,
            amount: pkg.price
        });

        // Prepare response based on payment method
        let paymentUrl = null;
        let duitnowQr = null;
        let gatewayRef = null;

        if (sanitizedMethod === 'billplz') {
            // Create Billplz bill using the helper
            try {
                const { createBill } = await import('../lib/billplz.js');

                // Get user and event details
                const user = await env.DB.prepare('SELECT name, email FROM users WHERE id = ?')
                    .bind(userId).first();

                const bill = await createBill(env, {
                    name: user?.name || user?.email?.split('@')[0] || 'Customer',
                    email: user?.email || 'customer@example.com',
                    amount: pkg.price,
                    description: `Pakej ${pkg.name} - ${event?.event_name || 'Jemputan Digital'}`,
                    orderRef: orderRef
                });

                paymentUrl = bill.url;
                gatewayRef = bill.id;

                // Update order with gateway_ref
                await env.DB.prepare('UPDATE payment_orders SET gateway_ref = ?, gateway_url = ? WHERE order_ref = ?')
                    .bind(bill.id, bill.url, orderRef).run();

                console.log(`[Payment] Billplz bill created: ${bill.id}`);
            } catch (billplzError) {
                console.error('[Payment] Billplz error:', billplzError);
                return new Response(JSON.stringify({
                    error: 'Failed to create payment',
                    details: billplzError.message
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        } else if (sanitizedMethod === 'duitnow') {
            // Require configured DuitNow account from environment
            if (!env.DUITNOW_ACCOUNT_NO || !env.DUITNOW_ACCOUNT_NAME) {
                return new Response(JSON.stringify({
                    error: 'DuitNow tidak dikonfigurasi. Sila hubungi pentadbir.'
                }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Return DuitNow QR info from secure env vars
            duitnowQr = {
                accountNo: env.DUITNOW_ACCOUNT_NO,
                accountName: env.DUITNOW_ACCOUNT_NAME,
                amount: pkg.price / 100,
                reference: orderRef,
                // Only include WhatsApp link if configured
                whatsappLink: env.DUITNOW_WHATSAPP
                    ? `https://wa.me/${env.DUITNOW_WHATSAPP}?text=${encodeURIComponent(`Pembayaran ${orderRef} - RM ${(pkg.price / 100).toFixed(2)}`)}`
                    : null
            };
        }

        return new Response(JSON.stringify({
            success: true,
            orderRef,
            amount: pkg.price,
            amountDisplay: `RM ${(pkg.price / 100).toFixed(2)}`,
            packageId,
            packageName: pkg.name,
            expiresAt: expiresAt.toISOString(),
            paymentMethod,
            paymentUrl,
            duitnowQr
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create payment error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to create payment order',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleVerifyPayment(request, env) {
    // Verify admin access
    const { user, errorResponse } = await requireAuth(request, env.DB);
    if (errorResponse) return errorResponse;

    if (user.role !== 'super_admin') {
        return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { orderRef, receiptUrl, adminId } = data;

    // Get payment order
    const order = await env.DB.prepare(`
        SELECT * FROM payment_orders WHERE order_ref = ?
    `).bind(orderRef).first();

    if (!order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (order.status === 'verified') {
        return new Response(JSON.stringify({
            error: 'Order already verified',
            paidAt: order.paid_at
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // Update payment order
        await env.DB.prepare(`
            UPDATE payment_orders SET
                status = 'verified',
                paid_at = CURRENT_TIMESTAMP,
                receipt_image_url = ?,
                receipt_verified_at = CURRENT_TIMESTAMP,
                verified_by = ?
            WHERE order_ref = ?
        `).bind(receiptUrl || null, adminId || null, orderRef).run();

        // Upgrade event access
        await upgradeAccess(env, order.event_id, order.package_id, order.id);

        // Update event status
        await env.DB.prepare(`
            UPDATE events SET status = 'paid' WHERE id = ?
        `).bind(order.event_id).run();

        // Update user role to 'admin' (paid client) if currently NULL
        await env.DB.prepare(`
            UPDATE users SET role = 'admin' 
            WHERE id = ? AND (role IS NULL OR role = '')
        `).bind(order.user_id).run();

        // Log audit
        await logAudit(env, 'payment_verified', {
            eventId: order.event_id,
            userId: adminId,
            orderRef,
            packageId: order.package_id,
            method: 'manual'
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Payment verified successfully',
            eventId: order.event_id,
            packageId: order.package_id
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Verify payment error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to verify payment',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleBillplzWebhook(request, env) {
    // 1. Signature Verification
    const signature = request.headers.get('X-Signature');
    if (!signature) {
        return new Response('Missing X-Signature header', { status: 401 });
    }

    if (!env.BILLPLZ_SECRET) {
        console.error('BILLPLZ_SECRET not configured');
        return new Response('Server Error', { status: 500 });
    }

    const rawBody = await request.text();

    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(env.BILLPLZ_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        // Convert hex signature to Uint8Array safely
        if (!signature.match(/^[0-9a-fA-F]+$/)) {
            throw new Error('Invalid signature format');
        }
        const signatureBytes = new Uint8Array(signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBytes,
            encoder.encode(rawBody)
        );

        if (!isValid) {
            console.error('Webhook signature verification failed');
            return new Response('Invalid Signature', { status: 401 });
        }
    } catch (error) {
        console.error('Signature verification error:', error);
        return new Response('Signature Error', { status: 400 });
    }

    // 2. Parse Data
    const params = new URLSearchParams(rawBody);
    const billId = params.get('id');
    const paid = params.get('paid') === 'true';
    const paidAt = params.get('paid_at');

    if (!billId || !paid) {
        return new Response('Invalid webhook', { status: 400 });
    }

    // Find order by gateway ref
    const order = await env.DB.prepare(`
        SELECT * FROM payment_orders WHERE gateway_ref = ?
    `).bind(billId).first();

    if (!order) {
        console.error('Webhook: Order not found for bill', billId);
        return new Response('Order not found', { status: 404 });
    }

    if (order.status === 'verified') {
        return new Response('Already verified', { status: 200 });
    }

    try {
        // Update payment order
        await env.DB.prepare(`
            UPDATE payment_orders SET
                status = 'verified',
                paid_at = ?
            WHERE gateway_ref = ?
        `).bind(paidAt, billId).run();

        // Upgrade event access
        await upgradeAccess(env, order.event_id, order.package_id, order.id);

        // Update event status
        await env.DB.prepare(`
            UPDATE events SET status = 'paid' WHERE id = ?
        `).bind(order.event_id).run();

        // Update user role to 'admin' (paid client) if currently NULL
        await env.DB.prepare(`
            UPDATE users SET role = 'admin' 
            WHERE id = ? AND (role IS NULL OR role = '')
        `).bind(order.user_id).run();

        // Log audit
        await logAudit(env, 'payment_verified', {
            eventId: order.event_id,
            orderRef: order.order_ref,
            packageId: order.package_id,
            method: 'billplz_webhook',
            billId
        });

        return new Response('OK', { status: 200 });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return new Response('Error', { status: 500 });
    }
}

/**
 * GET /api/payment/status/:order_ref
 */
export async function onRequestGet(context) {
    const { params, env } = context;
    const url = new URL(context.request.url);
    const orderRef = url.searchParams.get('order_ref');

    if (!orderRef) {
        return new Response(JSON.stringify({ error: 'Order reference required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const order = await env.DB.prepare(`
        SELECT 
            order_ref, status, amount_cents, package_id,
            payment_method, created_at, paid_at, expires_at
        FROM payment_orders WHERE order_ref = ?
    `).bind(orderRef).first();

    if (!order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        orderRef: order.order_ref,
        status: order.status,
        amount: order.amount_cents,
        amountDisplay: `RM ${(order.amount_cents / 100).toFixed(2)}`,
        packageId: order.package_id,
        paymentMethod: order.payment_method,
        createdAt: order.created_at,
        paidAt: order.paid_at,
        expiresAt: order.expires_at,
        isExpired: new Date(order.expires_at) < new Date()
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
