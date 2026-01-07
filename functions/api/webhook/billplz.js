/**
 * POST /api/webhook/billplz
 * 
 * Billplz webhook handler for payment notifications
 * This is called by Billplz server when payment status changes
 * 
 * Webhook data is sent as application/x-www-form-urlencoded
 */

import { verifyWebhookSignature } from '../../lib/billplz.js';
import { upgradeAccess, logAudit } from '../../lib/access-control.js';
import { updatePaymentState } from '../../lib/state-enforcement.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    console.log('[Billplz Webhook] Received webhook request');

    // 1. Get raw body for signature verification
    const rawBody = await request.text();
    console.log('[Billplz Webhook] Body received');

    // 2. Get X-Signature header
    const signature = request.headers.get('X-Signature');

    // 3. Verify signature
    if (env.BILLPLZ_XSIGNATURE_KEY) {
        const isValid = await verifyWebhookSignature(env, rawBody, signature);
        if (!isValid) {
            console.error('[Billplz Webhook] Invalid signature');
            return new Response('Invalid signature', { status: 401 });
        }
        console.log('[Billplz Webhook] Signature verified');
    } else {
        console.warn('[Billplz Webhook] BILLPLZ_XSIGNATURE_KEY not configured, skipping verification');
    }

    // 4. Parse webhook data
    const params = new URLSearchParams(rawBody);
    const billId = params.get('id');
    const paid = params.get('paid') === 'true';
    const paidAt = params.get('paid_at');
    const collectionId = params.get('collection_id');
    const paidAmount = params.get('paid_amount');
    const state = params.get('state');
    const reference1 = params.get('reference_1'); // Our order reference

    console.log(`[Billplz Webhook] Bill: ${billId}, Paid: ${paid}, State: ${state}, Reference: ${reference1}`);

    if (!billId) {
        return new Response('Missing bill ID', { status: 400 });
    }

    // 5. Find payment order by gateway_ref or order_ref
    let order = await env.DB.prepare(`
        SELECT * FROM payment_orders WHERE gateway_ref = ?
    `).bind(billId).first();

    // If not found by gateway_ref, try by order_ref (reference_1)
    if (!order && reference1) {
        order = await env.DB.prepare(`
            SELECT * FROM payment_orders WHERE order_ref = ?
        `).bind(reference1).first();

        // Update gateway_ref if found
        if (order && !order.gateway_ref) {
            await env.DB.prepare(`
                UPDATE payment_orders SET gateway_ref = ? WHERE id = ?
            `).bind(billId, order.id).run();
        }
    }

    if (!order) {
        console.error(`[Billplz Webhook] Order not found for bill ${billId}`);
        // Return 200 to prevent Billplz from retrying
        return new Response('Order not found', { status: 200 });
    }

    // 6. Check if already verified (idempotency)
    if (order.status === 'verified') {
        console.log(`[Billplz Webhook] Order ${order.order_ref} already verified`);
        return new Response('OK', { status: 200 });
    }

    // 7. Handle payment status
    if (paid) {
        try {
            // Update payment order status
            await env.DB.prepare(`
                UPDATE payment_orders SET
                    status = 'verified',
                    paid_at = ?,
                    receipt_verified_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(paidAt || new Date().toISOString(), order.id).run();

            console.log(`[Billplz Webhook] Order ${order.order_ref} marked as verified`);

            // Upgrade event access if event_id exists
            if (order.event_id) {
                await upgradeAccess(env, order.event_id, order.package_id, order.id);
                console.log(`[Billplz Webhook] Event ${order.event_id} access upgraded`);

                // ===== UPDATE PAYMENT STATE (AUTHORITATIVE) =====
                // This sets payment_state = 'PAID' and lifecycle_state appropriately
                await updatePaymentState(env.DB, order.event_id, 'PAID');
                console.log(`[Billplz Webhook] Event ${order.event_id} payment state updated to PAID`);

                // Update event status (legacy field)
                await env.DB.prepare(`
                    UPDATE events SET status = 'paid' WHERE id = ?
                `).bind(order.event_id).run();
            }

            // Update user role to 'admin' (paid client) if currently NULL
            if (order.user_id) {
                await env.DB.prepare(`
                    UPDATE users SET role = 'admin' 
                    WHERE id = ? AND (role IS NULL OR role = '')
                `).bind(order.user_id).run();
            }

            // Log audit
            await logAudit(env, 'payment_verified', {
                eventId: order.event_id,
                userId: order.user_id,
                orderRef: order.order_ref,
                packageId: order.package_id,
                method: 'billplz_webhook',
                billId,
                paidAmount
            });

            console.log(`[Billplz Webhook] Payment ${order.order_ref} processed successfully`);

        } catch (error) {
            console.error('[Billplz Webhook] Error processing payment:', error);
            // Return 500 to trigger Billplz retry
            return new Response('Processing error', { status: 500 });
        }
    } else {
        console.log(`[Billplz Webhook] Bill ${billId} not paid yet (state: ${state})`);
    }

    return new Response('OK', { status: 200 });
}
