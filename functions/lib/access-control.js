/**
 * Access Control Middleware
 * Checks payment status and feature access for protected endpoints
 */

// Package feature definitions
const PACKAGE_FEATURES = {
    free: {
        maxGuests: 10,
        maxViews: 50,
        maxRsvps: 10,
        qr: false,
        checkin: false,
        export: false,
        customSlug: false,
        watermark: true
    },
    basic: {
        maxGuests: 100,
        maxViews: 500,
        maxRsvps: 100,
        qr: true,
        checkin: false,
        export: false,
        customSlug: false,
        watermark: false
    },
    premium: {
        maxGuests: 300,
        maxViews: 2000,
        maxRsvps: 300,
        qr: true,
        checkin: true,
        export: true,
        customSlug: true,
        watermark: false
    },
    business: {
        maxGuests: 1000,
        maxViews: 10000,
        maxRsvps: 1000,
        qr: true,
        checkin: true,
        export: true,
        customSlug: true,
        watermark: false
    }
};

/**
 * Check if user has access to a specific feature for an event
 */
export async function checkAccess(env, eventId, feature = null) {
    try {
        // Get event access record
        const access = await env.DB.prepare(`
            SELECT 
                ea.*,
                e.status as event_status,
                e.created_by
            FROM event_access ea
            JOIN events e ON ea.event_id = e.id
            WHERE ea.event_id = ?
        `).bind(eventId).first();

        // No access record = free tier
        if (!access) {
            const freeFeatures = PACKAGE_FEATURES.free;

            // Check feature access for free tier
            if (feature) {
                const featureCheck = checkFeatureAccess(feature, 'free', freeFeatures, null);
                if (!featureCheck.allowed) {
                    return featureCheck;
                }
            }

            return {
                allowed: true,
                tier: 'free',
                features: freeFeatures,
                limits: {
                    maxGuests: freeFeatures.maxGuests,
                    maxViews: freeFeatures.maxViews,
                    maxRsvps: freeFeatures.maxRsvps
                },
                isPaid: false
            };
        }

        const packageId = access.package_id || 'free';
        const features = PACKAGE_FEATURES[packageId] || PACKAGE_FEATURES.free;

        // Check if payment is verified
        const isPaid = access.paid_at !== null;

        // Check expiry
        if (access.expires_at && new Date(access.expires_at) < new Date()) {
            return {
                allowed: false,
                reason: 'Access expired',
                reasonMs: 'Akses telah tamat tempoh',
                code: 'EXPIRED'
            };
        }

        // Check specific feature access
        if (feature) {
            const featureCheck = checkFeatureAccess(feature, packageId, features, access);
            if (!featureCheck.allowed) {
                return featureCheck;
            }
        }

        return {
            allowed: true,
            tier: packageId,
            features: features,
            limits: {
                maxGuests: access.max_guests,
                maxViews: access.max_views,
                maxRsvps: access.max_rsvps,
                currentGuests: access.current_guests,
                currentViews: access.current_views,
                currentRsvps: access.current_rsvps
            },
            isPaid: isPaid,
            expiresAt: access.expires_at
        };

    } catch (error) {
        console.error('Access check error:', error);
        return {
            allowed: false,
            reason: 'Access check failed',
            code: 'ERROR'
        };
    }
}

/**
 * Check access to a specific feature
 */
function checkFeatureAccess(feature, packageId, features, access) {
    switch (feature) {
        case 'qr':
            if (!features.qr) {
                return {
                    allowed: false,
                    reason: 'QR code requires Basic package or higher',
                    reasonMs: 'Kod QR memerlukan pakej Asas atau lebih tinggi',
                    code: 'UPGRADE_REQUIRED',
                    requiredPackage: 'basic'
                };
            }
            break;

        case 'checkin':
            if (!features.checkin) {
                return {
                    allowed: false,
                    reason: 'Check-in requires Premium package or higher',
                    reasonMs: 'Check-in memerlukan pakej Premium atau lebih tinggi',
                    code: 'UPGRADE_REQUIRED',
                    requiredPackage: 'premium'
                };
            }
            break;

        case 'export':
            if (!features.export) {
                return {
                    allowed: false,
                    reason: 'Export requires Premium package or higher',
                    reasonMs: 'Eksport memerlukan pakej Premium atau lebih tinggi',
                    code: 'UPGRADE_REQUIRED',
                    requiredPackage: 'premium'
                };
            }
            break;

        case 'guests':
            if (access && access.current_guests >= access.max_guests) {
                return {
                    allowed: false,
                    reason: `Guest limit reached (${access.max_guests})`,
                    reasonMs: `Had tetamu dicapai (${access.max_guests})`,
                    code: 'LIMIT_REACHED',
                    limit: access.max_guests
                };
            }
            break;

        case 'rsvp':
            if (access && access.current_rsvps >= access.max_rsvps) {
                return {
                    allowed: false,
                    reason: `RSVP limit reached (${access.max_rsvps})`,
                    reasonMs: `Had RSVP dicapai (${access.max_rsvps})`,
                    code: 'LIMIT_REACHED',
                    limit: access.max_rsvps
                };
            }
            break;
    }

    return { allowed: true };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(env, eventId, field) {
    const columnMap = {
        guests: 'current_guests',
        views: 'current_views',
        rsvps: 'current_rsvps'
    };

    const column = columnMap[field];
    if (!column) return;

    try {
        await env.DB.prepare(`
            UPDATE event_access 
            SET ${column} = ${column} + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = ?
        `).bind(eventId).run();
    } catch (error) {
        console.error('Usage increment error:', error);
    }
}

/**
 * Log an audit event
 */
export async function logAudit(env, action, details = {}) {
    try {
        await env.DB.prepare(`
            INSERT INTO audit_logs (event_id, user_id, action, resource_type, resource_id, details, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            details.eventId || null,
            details.userId || null,
            action,
            details.resourceType || null,
            details.resourceId || null,
            JSON.stringify(details),
            details.ip || null
        ).run();
    } catch (error) {
        console.error('Audit log error:', error);
    }
}

/**
 * Create initial free access for new event
 */
export async function createFreeAccess(env, eventId) {
    try {
        await env.DB.prepare(`
            INSERT OR IGNORE INTO event_access (event_id, package_id, package_name, max_guests, max_views, max_rsvps)
            VALUES (?, 'free', 'Free Trial', 10, 50, 10)
        `).bind(eventId).run();
    } catch (error) {
        console.error('Create free access error:', error);
    }
}

/**
 * Upgrade event access after payment
 */
export async function upgradeAccess(env, eventId, packageId, paymentOrderId) {
    const pkg = PACKAGE_FEATURES[packageId];
    if (!pkg) throw new Error('Invalid package');

    // Calculate expiry (30 days after event date or 90 days from now)
    const event = await env.DB.prepare(`
        SELECT event_date FROM events WHERE id = ?
    `).bind(eventId).first();

    let expiresAt;
    if (event?.event_date) {
        const eventDate = new Date(event.event_date);
        eventDate.setDate(eventDate.getDate() + 30);
        expiresAt = eventDate.toISOString();
    } else {
        const now = new Date();
        now.setDate(now.getDate() + 90);
        expiresAt = now.toISOString();
    }

    await env.DB.prepare(`
        INSERT INTO event_access (
            event_id, payment_order_id, package_id, package_name,
            max_guests, max_views, max_rsvps,
            qr_enabled, checkin_enabled, export_enabled, custom_slug, remove_watermark,
            paid_at, activated_at, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
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
            custom_slug = excluded.custom_slug,
            remove_watermark = excluded.remove_watermark,
            paid_at = CURRENT_TIMESTAMP,
            activated_at = CURRENT_TIMESTAMP,
            expires_at = excluded.expires_at,
            updated_at = CURRENT_TIMESTAMP
    `).bind(
        eventId,
        paymentOrderId,
        packageId,
        packageId.charAt(0).toUpperCase() + packageId.slice(1),
        pkg.maxGuests,
        pkg.maxViews,
        pkg.maxRsvps,
        pkg.qr ? 1 : 0,
        pkg.checkin ? 1 : 0,
        pkg.export ? 1 : 0,
        pkg.customSlug ? 1 : 0,
        pkg.watermark ? 0 : 1,
        expiresAt
    ).run();
}
