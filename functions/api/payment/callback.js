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
            // Payment successful - redirect to success page with order info
            const successUrl = new URL('https://a2zcreative.my/payment/success');
            successUrl.searchParams.set('order_ref', order.order_ref);
            successUrl.searchParams.set('package', order.package_id);
            successUrl.searchParams.set('event_id', order.event_id || '');

            console.log(`[Payment Callback] Payment successful, redirecting to success page`);
            return Response.redirect(successUrl.toString(), 302);
        } else {
            // Payment not completed - redirect to failed page
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
