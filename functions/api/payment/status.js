/**
 * GET /api/payment/status
 * Check payment order status
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const orderRef = url.searchParams.get('order_ref');

    if (!orderRef) {
        return new Response(JSON.stringify({ error: 'Order reference required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
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
            isExpired: order.expires_at ? new Date(order.expires_at) < new Date() : false
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Payment status error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to get payment status',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
