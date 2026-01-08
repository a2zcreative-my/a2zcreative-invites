/**
 * Access Control Middleware
 * Checks payment status and feature access for protected endpoints
 * 
 * IMPORTANT: Uses packageRules.js as the single source of truth.
 * Never duplicate package rules here.
 */

import { PACKAGE_RULES, parseFeatures, hasFeature } from './packageRules.js';

/**
 * Get package features by package ID
 * Falls back to free tier if package not found
 */
function getPackageFeatures(packageId) {
    const pkg = PACKAGE_RULES[packageId];
    if (!pkg) {
        return {
            guestLimit: PACKAGE_RULES.free.guestLimit,
            viewLimit: PACKAGE_RULES.free.viewLimit,
            watermark: PACKAGE_RULES.free.watermark,
            ...PACKAGE_RULES.free.features
        };
    }
    return {
        guestLimit: pkg.guestLimit,
        viewLimit: pkg.viewLimit,
        watermark: pkg.watermark,
        ...pkg.features
    };
}

/**
 * Check if user has access to a specific feature for an event
 * @param {object} env - Environment with DB binding
 * @param {number} eventId - Event ID
 * @param {string|null} feature - Feature to check (qr, qrScanner, exportCsv, etc.)
 * @returns {Promise<object>} Access check result
 */
export async function checkAccess(env, eventId, feature = null) {
    try {
        // Get event access record with all relevant data
        const access = await env.DB.prepare(`
            SELECT 
                ea.*,
                e.status as event_status,
                e.created_by
            FROM event_access ea
            JOIN events e ON ea.event_id = e.id
            WHERE ea.event_id = ?
        `).bind(eventId).first();

        // No access record = fall back to free tier defaults
        if (!access) {
            const freeFeatures = getPackageFeatures('free');

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
                    maxGuests: freeFeatures.guestLimit,
                    maxViews: freeFeatures.viewLimit,
                    guestLimit: freeFeatures.guestLimit,
                    viewLimit: freeFeatures.viewLimit
                },
                isPaid: false
            };
        }

        const packageId = access.package_id || 'free';
        
        // Parse features from features_json (authoritative source from DB)
        const featuresFromDb = parseFeatures(access.features_json);
        
        // Merge with package defaults for any missing features
        const packageDefaults = getPackageFeatures(packageId);
        const features = {
            ...packageDefaults,
            ...featuresFromDb,
            // Always use DB values for limits if present
            guestLimit: access.guest_limit ?? access.max_guests ?? packageDefaults.guestLimit,
            viewLimit: access.view_limit ?? access.max_views ?? packageDefaults.viewLimit
        };

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
                maxGuests: features.guestLimit,
                maxViews: features.viewLimit,
                guestLimit: features.guestLimit,
                viewLimit: features.viewLimit,
                currentGuests: access.guest_count ?? access.current_guests ?? 0,
                currentViews: access.view_count ?? access.current_views ?? 0,
                guestCount: access.guest_count ?? access.current_guests ?? 0,
                viewCount: access.view_count ?? access.current_views ?? 0
            },
            isPaid: isPaid,
            hasWatermark: access.has_watermark === 1,
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
 * Uses features_json from event_access as the source of truth
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

        case 'qrScanner':
        case 'checkin':
            if (!features.qrScanner) {
                return {
                    allowed: false,
                    reason: 'QR Scanner requires Popular package or higher',
                    reasonMs: 'Pengimbas QR memerlukan pakej Popular atau lebih tinggi',
                    code: 'UPGRADE_REQUIRED',
                    requiredPackage: 'popular'
                };
            }
            break;

        case 'exportCsv':
        case 'export':
            if (!features.exportCsv) {
                return {
                    allowed: false,
                    reason: 'CSV Export requires Popular package or higher',
                    reasonMs: 'Eksport CSV memerlukan pakej Popular atau lebih tinggi',
                    code: 'UPGRADE_REQUIRED',
                    requiredPackage: 'popular'
                };
            }
            break;

        case 'multipleEvents':
            if (!features.multipleEvents) {
                return {
                    allowed: false,
                    reason: 'Multiple events requires Business package',
                    reasonMs: 'Majlis berganda memerlukan pakej Bisnes',
                    code: 'UPGRADE_REQUIRED',
                    requiredPackage: 'business'
                };
            }
            break;

        case 'guests':
            // Check guest count limit
            const guestCount = access?.guest_count ?? access?.current_guests ?? 0;
            const guestLimit = features.guestLimit;
            if (guestCount >= guestLimit) {
                return {
                    allowed: false,
                    reason: `Guest limit reached (${guestLimit})`,
                    reasonMs: `Had tetamu dicapai (${guestLimit})`,
                    code: 'LIMIT_REACHED',
                    limit: guestLimit,
                    current: guestCount
                };
            }
            break;

        case 'views':
            // Check view count limit
            const viewCount = access?.view_count ?? access?.current_views ?? 0;
            const viewLimit = features.viewLimit;
            if (viewCount >= viewLimit) {
                return {
                    allowed: false,
                    reason: `View limit reached (${viewLimit})`,
                    reasonMs: `Had paparan dicapai (${viewLimit})`,
                    code: 'LIMIT_REACHED',
                    limit: viewLimit,
                    current: viewCount
                };
            }
            break;

        case 'rsvp':
            // Alias for guests check
            const rsvpGuestCount = access?.guest_count ?? access?.current_guests ?? 0;
            const rsvpGuestLimit = features.guestLimit;
            if (rsvpGuestCount >= rsvpGuestLimit) {
                return {
                    allowed: false,
                    reason: `RSVP limit reached (${rsvpGuestLimit})`,
                    reasonMs: `Had RSVP dicapai (${rsvpGuestLimit})`,
                    code: 'LIMIT_REACHED',
                    limit: rsvpGuestLimit,
                    current: rsvpGuestCount
                };
            }
            break;
    }

    return { allowed: true };
}

/**
 * Increment usage counter (for backwards compatibility)
 * Note: For atomic enforcement, use direct UPDATE with WHERE condition instead
 */
export async function incrementUsage(env, eventId, field) {
    const columnMap = {
        guests: ['guest_count', 'current_guests'],
        views: ['view_count', 'current_views'],
        rsvps: ['guest_count', 'current_guests'] // rsvps alias to guests
    };

    const columns = columnMap[field];
    if (!columns) return;

    try {
        // Update both old and new column names for compatibility
        await env.DB.prepare(`
            UPDATE event_access 
            SET ${columns[0]} = ${columns[0]} + 1,
                ${columns[1]} = ${columns[1]} + 1,
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
 * Create initial access record for new event
 * Uses packageRules as the source of truth
 */
export async function createEventAccess(env, eventId, packageId) {
    const pkg = PACKAGE_RULES[packageId] || PACKAGE_RULES.free;
    const featuresJson = JSON.stringify(pkg.features);
    const isPaid = pkg.autoPublish;

    try {
        if (isPaid) {
            await env.DB.prepare(`
                INSERT OR IGNORE INTO event_access (
                    event_id, package_id, 
                    guest_limit, view_limit, has_watermark, features_json,
                    max_guests, max_views,
                    paid_at, guest_count, view_count, current_guests, current_views
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 0, 0, 0, 0)
            `).bind(
                eventId, packageId,
                pkg.guestLimit, pkg.viewLimit, pkg.watermark ? 1 : 0, featuresJson,
                pkg.guestLimit, pkg.viewLimit
            ).run();
        } else {
            await env.DB.prepare(`
                INSERT OR IGNORE INTO event_access (
                    event_id, package_id,
                    guest_limit, view_limit, has_watermark, features_json,
                    max_guests, max_views,
                    paid_at, guest_count, view_count, current_guests, current_views
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 0, 0, 0)
            `).bind(
                eventId, packageId,
                pkg.guestLimit, pkg.viewLimit, pkg.watermark ? 1 : 0, featuresJson,
                pkg.guestLimit, pkg.viewLimit
            ).run();
        }
    } catch (error) {
        console.error('Create event access error:', error);
    }
}

/**
 * Upgrade event access after payment
 * Uses packageRules as the source of truth
 */
export async function upgradeAccess(env, eventId, packageId, paymentOrderId) {
    const pkg = PACKAGE_RULES[packageId];
    if (!pkg) throw new Error('Invalid package');

    const featuresJson = JSON.stringify(pkg.features);

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
            event_id, payment_order_id, package_id,
            guest_limit, view_limit, has_watermark, features_json,
            max_guests, max_views, max_rsvps,
            qr_enabled, checkin_enabled, export_enabled, custom_slug, remove_watermark,
            paid_at, activated_at, expires_at,
            guest_count, view_count, current_guests, current_views
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 0, 0, 0, 0)
        ON CONFLICT(event_id) DO UPDATE SET
            payment_order_id = excluded.payment_order_id,
            package_id = excluded.package_id,
            guest_limit = excluded.guest_limit,
            view_limit = excluded.view_limit,
            has_watermark = excluded.has_watermark,
            features_json = excluded.features_json,
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
        pkg.guestLimit,
        pkg.viewLimit,
        pkg.watermark ? 1 : 0,
        featuresJson,
        pkg.guestLimit,
        pkg.viewLimit,
        pkg.guestLimit, // max_rsvps = guest_limit
        pkg.features.qr ? 1 : 0,
        pkg.features.qrScanner ? 1 : 0,
        pkg.features.exportCsv ? 1 : 0,
        0, // custom_slug - not in current requirements
        pkg.watermark ? 0 : 1, // remove_watermark is inverse
        expiresAt
    ).run();

    // Also update event status to published
    await env.DB.prepare(`
        UPDATE events SET status = 'published' WHERE id = ?
    `).bind(eventId).run();
}
