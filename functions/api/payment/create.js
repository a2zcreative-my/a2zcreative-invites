/**
 * POST /api/payment/create
 * Create a new payment order
 * 
 * SECURITY: Requires authentication + event ownership verification
 */

import { requireAuth, requireEventOwnership } from '../../lib/auth.js';
import { createBill } from '../../lib/billplz.js';
import { generateSecureString } from '../../lib/security.js';

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

export async function onRequestPost(context) {
    const { request, env } = context;

    // Debug logging for payment creation
    console.log('[Payment Create] Request received');

    // 1. Authenticate user
    const { userId, user, errorResponse: authError } = await requireAuth(request, env.DB);
    if (authError) {
        console.error('[Payment Create] Auth failed - no valid session found');
        console.error('[Payment Create] Check if a2z_session cookie is being sent with the request');
        return authError;
    }

    console.log(`[Payment Create] User authenticated: userId=${userId}, email=${user?.email}`);

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

    // 2. Verify user owns the event
    let event = null;
    if (eventId) {
        const ownershipError = await requireEventOwnership(env.DB, eventId, userId);
        if (ownershipError) return ownershipError;

        // Get event details for Billplz description
        event = await env.DB.prepare('SELECT event_name FROM events WHERE id = ?')
            .bind(eventId).first();
    }

    // Validate package
    const pkg = PACKAGES[packageId];
    if (!pkg) {
        return new Response(JSON.stringify({ error: 'Invalid package' }), {
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
        // Prepare response based on payment method
        let paymentUrl = null;
        let duitnowQr = null;
        let gatewayRef = null;

        if (paymentMethod === 'billplz') {
            // Create Billplz bill
            try {
                const bill = await createBill(env, {
                    name: user?.name || user?.email?.split('@')[0] || 'Customer',
                    email: user?.email || 'customer@example.com',
                    amount: pkg.price, // Amount in cents
                    description: `Pakej ${pkg.name} - ${event?.event_name || 'Jemputan Digital'}`,
                    orderRef: orderRef,
                    mobile: user?.phone || null
                });

                paymentUrl = bill.url;
                gatewayRef = bill.id;
                console.log(`[Payment] Billplz bill created: ${bill.id} for order ${orderRef}`);
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
        } else if (paymentMethod === 'duitnow') {
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

        // Create payment order in database
        await env.DB.prepare(`
            INSERT INTO payment_orders (
                event_id, user_id, order_ref, amount_cents, package_id, 
                payment_method, gateway_ref, gateway_url, status, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `).bind(
            eventId || null,
            userId,
            orderRef,
            pkg.price,
            packageId,
            paymentMethod || 'pending',
            gatewayRef,
            paymentUrl,
            expiresAt.toISOString()
        ).run();

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
