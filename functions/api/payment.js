/**
 * Payment API
 * POST /api/payment/create - Create payment order
 * POST /api/payment/verify - Verify payment (webhook or manual)
 * GET /api/payment/status/:order_ref - Check payment status
 */

import { upgradeAccess, logAudit } from '../lib/access-control.js';

// Generate unique order reference
function generateOrderRef() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
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
    let data;
    try {
        data = await request.json();
    } catch (e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { eventId, packageId, paymentMethod, userId = 1 } = data;

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
            paymentMethod || 'pending',
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

        if (paymentMethod === 'billplz') {
            // TODO: Integrate with Billplz API
            // For now, return placeholder
            paymentUrl = `https://www.billplz.com/bills/${orderRef}`;
        } else if (paymentMethod === 'duitnow') {
            // Return DuitNow QR info
            duitnowQr = {
                accountNo: '1234567890',  // Your DuitNow ID
                accountName: 'A2Z CREATIVE SDN BHD',
                amount: pkg.price / 100,
                reference: orderRef,
                whatsappLink: `https://wa.me/60123456789?text=Pembayaran%20${orderRef}%20-%20RM${pkg.price / 100}`
            };
        }

        return new Response(JSON.stringify({
            success: true,
            orderRef,
            amount: pkg.price,
            amountDisplay: `RM${(pkg.price / 100).toFixed(2)}`,
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
    // Parse form data from Billplz webhook
    const formData = await request.formData();
    const billId = formData.get('id');
    const paid = formData.get('paid') === 'true';
    const paidAt = formData.get('paid_at');

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
        amountDisplay: `RM${(order.amount_cents / 100).toFixed(2)}`,
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
