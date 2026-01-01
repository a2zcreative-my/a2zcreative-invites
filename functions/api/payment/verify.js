/**
 * POST /api/payment/verify
 * Verify a payment (manual or admin)
 */

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

    const { orderRef, receiptUrl, adminId } = data;

    if (!orderRef) {
        return new Response(JSON.stringify({ error: 'Order reference required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
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

        // Create/update event access
        const pkg = {
            basic: { maxGuests: 100, maxViews: 500, maxRsvps: 100, qr: 1, checkin: 0, export: 0 },
            premium: { maxGuests: 300, maxViews: 2000, maxRsvps: 300, qr: 1, checkin: 1, export: 1 },
            business: { maxGuests: 1000, maxViews: 10000, maxRsvps: 1000, qr: 1, checkin: 1, export: 1 }
        }[order.package_id] || { maxGuests: 100, maxViews: 500, maxRsvps: 100, qr: 1, checkin: 0, export: 0 };

        // Calculate expiry (90 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        await env.DB.prepare(`
            INSERT INTO event_access (
                event_id, payment_order_id, package_id, package_name,
                max_guests, max_views, max_rsvps,
                qr_enabled, checkin_enabled, export_enabled, remove_watermark,
                paid_at, activated_at, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
            ON CONFLICT(event_id) DO UPDATE SET
                payment_order_id = excluded.payment_order_id,
                package_id = excluded.package_id,
                package_name = excluded.package_name,
                max_guests = excluded.max_guests,
                max_views = excluded.max_views,
                max_rsvps = excluded.max_rsvps,
                qr_enabled = excluded.qr_enabled,
                checkin_enabled = excluded.checkin_enabled,
                export_enabled = excluded.export_enabled,
                remove_watermark = excluded.remove_watermark,
                paid_at = CURRENT_TIMESTAMP,
                activated_at = CURRENT_TIMESTAMP,
                expires_at = excluded.expires_at,
                updated_at = CURRENT_TIMESTAMP
        `).bind(
            order.event_id,
            order.id,
            order.package_id,
            order.package_id.charAt(0).toUpperCase() + order.package_id.slice(1),
            pkg.maxGuests,
            pkg.maxViews,
            pkg.maxRsvps,
            pkg.qr,
            pkg.checkin,
            pkg.export,
            expiresAt.toISOString()
        ).run();

        // CRITICAL: Upgrade user role to 'admin' (paid client)
        if (order.user_id) {
            await env.DB.prepare(`
                UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND role = 'user'
            `).bind(order.user_id).run();
            console.log(`[Payment Verify] User ${order.user_id} upgraded to admin role`);
        }

        // Log audit
        await env.DB.prepare(`
            INSERT INTO audit_logs (event_id, user_id, action, details)
            VALUES (?, ?, 'payment_verified', ?)
        `).bind(
            order.event_id,
            adminId || null,
            JSON.stringify({ orderRef, packageId: order.package_id, method: 'manual' })
        ).run();

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
