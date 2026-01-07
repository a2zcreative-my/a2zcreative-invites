/**
 * GET /api/payment/callback
 * 
 * Handle Billplz redirect after payment
 * User is redirected here after completing/canceling payment on Billplz
 * 
 * Query params:
 * - billplz[id] - Bill ID
 * - billplz[paid] - true/false
 * - billplz[paid_at] - Payment timestamp
 * - billplz[x_signature] - Signature for verification
 */

import { parseCallbackParams, verifyCallbackSignature, getBillStatus } from '../../lib/billplz.js';

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);

    console.log('[Payment Callback] Received callback');

    // Parse callback parameters
    const callbackData = parseCallbackParams(url.searchParams);

    if (!callbackData.billId) {
        // No bill ID - redirect to dashboard with error
        return Response.redirect('https://a2zcreative.my/dashboard?payment=error&reason=no_bill_id', 302);
    }

    console.log(`[Payment Callback] Bill: ${callbackData.billId}, Paid: ${callbackData.paid}`);

    // Verify signature if we have the key
    if (env.BILLPLZ_XSIGNATURE_KEY && callbackData.xSignature) {
        const isValid = await verifyCallbackSignature(env, callbackData);
        if (!isValid) {
            console.error('[Payment Callback] Invalid signature');
            return Response.redirect('https://a2zcreative.my/dashboard?payment=error&reason=invalid_signature', 302);
        }
        console.log('[Payment Callback] Signature verified');
    }

    // Find the payment order
    let order = await env.DB.prepare(`
        SELECT po.*, e.event_name
        FROM payment_orders po
        LEFT JOIN events e ON po.event_id = e.id
        WHERE po.gateway_ref = ?
    `).bind(callbackData.billId).first();

    if (!order) {
        console.error(`[Payment Callback] Order not found for bill ${callbackData.billId}`);
        return Response.redirect('https://a2zcreative.my/dashboard?payment=error&reason=order_not_found', 302);
    }

    // Check payment status from Billplz API (more reliable than callback params)
    try {
        const billStatus = await getBillStatus(env, callbackData.billId);

        if (billStatus.paid) {
            // Payment successful - update database
            await env.DB.prepare(`
                UPDATE payment_orders SET status = 'verified', paid_at = CURRENT_TIMESTAMP
                WHERE gateway_ref = ?
            `).bind(callbackData.billId).run();

            // CRITICAL: Upgrade user role to 'admin' (paid client)
            if (order.user_id) {
                await env.DB.prepare(`
                    UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP
                    WHERE id = ? AND role = 'user'
                `).bind(order.user_id).run();
                console.log(`[Payment Callback] User ${order.user_id} upgraded to admin role`);
            }

            // Redirect to success page with order info
            const successUrl = new URL('https://a2zcreative.my/payment/success');
            successUrl.searchParams.set('order_ref', order.order_ref);
            successUrl.searchParams.set('package', order.package_id);
            successUrl.searchParams.set('event_id', order.event_id || '');

            console.log(`[Payment Callback] Payment successful, redirecting to success page`);
            return Response.redirect(successUrl.toString(), 302);
        } else {
            // Payment not completed - clean up the unpaid event to release the slug
            // This allows other users to use this URL
            console.log(`[Payment Callback] Payment not completed for event ${order.event_id}, cleaning up...`);

            // Update payment order status to failed
            await env.DB.prepare(`
                UPDATE payment_orders SET status = 'failed'\r
                WHERE gateway_ref = ?
            `).bind(callbackData.billId).run();

            // Delete related data to release the slug
            if (order.event_id) {
                // Delete invitation (releases the public_slug)
                await env.DB.prepare('DELETE FROM invitations WHERE event_id = ?').bind(order.event_id).run();
                // Delete schedule items
                await env.DB.prepare('DELETE FROM event_schedule WHERE event_id = ?').bind(order.event_id).run();
                // Delete contacts
                await env.DB.prepare('DELETE FROM event_contacts WHERE event_id = ?').bind(order.event_id).run();
                // Delete event settings
                await env.DB.prepare('DELETE FROM event_settings WHERE event_id = ?').bind(order.event_id).run();
                // Delete the event itself
                await env.DB.prepare('DELETE FROM events WHERE id = ?').bind(order.event_id).run();
                console.log(`[Payment Callback] Cleaned up event ${order.event_id} and released slug`);
            }

            // Redirect to failed page
            const failedUrl = new URL('https://a2zcreative.my/payment/failed');
            failedUrl.searchParams.set('order_ref', order.order_ref);
            failedUrl.searchParams.set('reason', 'payment_not_completed');

            console.log(`[Payment Callback] Payment not completed, redirecting to failed page`);
            return Response.redirect(failedUrl.toString(), 302);
        }
    } catch (error) {
        console.error('[Payment Callback] Error checking bill status:', error);

        // Fallback to callback params
        if (callbackData.paid) {
            const successUrl = new URL('https://a2zcreative.my/payment/success');
            successUrl.searchParams.set('order_ref', order.order_ref);
            return Response.redirect(successUrl.toString(), 302);
        } else {
            return Response.redirect('https://a2zcreative.my/payment/failed?reason=payment_failed', 302);
        }
    }
}
