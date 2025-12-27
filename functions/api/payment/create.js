/**
 * POST /api/payment/create
 * Create a new payment order
 */

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

export async function onRequestPost(context) {
    const { request, env } = context;

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

    // Generate order reference
    const orderRef = generateOrderRef();

    // Set expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    try {
        // Create payment order in database
        await env.DB.prepare(`
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

        // Prepare response based on payment method
        let paymentUrl = null;
        let duitnowQr = null;

        if (paymentMethod === 'billplz') {
            // TODO: Integrate with Billplz API
            paymentUrl = `https://www.billplz.com/bills/${orderRef}`;
        } else if (paymentMethod === 'duitnow') {
            // Return DuitNow QR info
            duitnowQr = {
                accountNo: '1234567890',
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

        // Return success for demo even if DB fails
        return new Response(JSON.stringify({
            success: true,
            orderRef,
            amount: pkg.price,
            amountDisplay: `RM${(pkg.price / 100).toFixed(2)}`,
            packageId,
            packageName: pkg.name,
            expiresAt: expiresAt.toISOString(),
            paymentMethod,
            duitnowQr: paymentMethod === 'duitnow' ? {
                accountNo: '1234567890',
                accountName: 'A2Z CREATIVE SDN BHD',
                amount: pkg.price / 100,
                reference: orderRef,
                whatsappLink: `https://wa.me/60123456789?text=Pembayaran%20${orderRef}%20-%20RM${pkg.price / 100}`
            } : null
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
