/**
 * Billplz API Helper
 * 
 * Provides functions for interacting with Billplz payment gateway API v3.
 * Documentation: https://www.billplz.com/api
 */

// API endpoints
const BILLPLZ_API_PROD = 'https://www.billplz.com/api/v3';
const BILLPLZ_API_SANDBOX = 'https://www.billplz-sandbox.com/api/v3';

/**
 * Get the appropriate API base URL based on environment
 */
function getApiBase(env) {
    // Use sandbox if explicitly set, otherwise use production
    const useSandbox = env.BILLPLZ_SANDBOX === 'true' || env.BILLPLZ_SANDBOX === true;
    return useSandbox ? BILLPLZ_API_SANDBOX : BILLPLZ_API_PROD;
}

/**
 * Create authorization header for Billplz API
 */
function getAuthHeader(env) {
    // Billplz uses Basic Auth with API key as username and empty password
    const credentials = btoa(`${env.BILLPLZ_API_KEY}:`);
    return `Basic ${credentials}`;
}

/**
 * Create a new bill in Billplz
 * 
 * @param {Object} env - Environment variables
 * @param {Object} options - Bill options
 * @param {string} options.name - Customer name
 * @param {string} options.email - Customer email
 * @param {number} options.amount - Amount in cents (e.g., 9900 = RM99.00)
 * @param {string} options.description - Bill description
 * @param {string} options.orderRef - Your order reference
 * @param {string} [options.mobile] - Customer mobile number (optional)
 * @returns {Promise<Object>} - Bill object with id and url
 */
export async function createBill(env, options) {
    const { name, email, amount, description, orderRef, mobile } = options;

    const apiBase = getApiBase(env);
    const collectionId = env.BILLPLZ_COLLECTION_ID;

    if (!collectionId) {
        throw new Error('BILLPLZ_COLLECTION_ID not configured');
    }

    if (!env.BILLPLZ_API_KEY) {
        throw new Error('BILLPLZ_API_KEY not configured');
    }

    // Build callback URL (server-to-server webhook)
    const callbackUrl = env.BILLPLZ_CALLBACK_URL || 'https://a2zcreative.my/api/webhook/billplz';

    // Build redirect URL (where user goes after payment)
    // Redirect back to the creation wizard payment check step
    // We append the orderRef so the frontend can check status
    const redirectUrl = env.BILLPLZ_REDIRECT_URL
        ? env.BILLPLZ_REDIRECT_URL
        : `https://a2zcreative.my/create/payment-return.html?order_ref=${orderRef}`;

    console.log(`[Payment Create] Redirect URL set to: ${redirectUrl}`);

    // Prepare form data
    const formData = new URLSearchParams();
    formData.append('collection_id', collectionId);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('amount', amount.toString()); // Billplz expects amount in cents as string
    formData.append('description', description);
    formData.append('callback_url', callbackUrl);
    formData.append('redirect_url', redirectUrl);
    formData.append('reference_1_label', 'Order Ref');
    formData.append('reference_1', orderRef);

    if (mobile) {
        formData.append('mobile', mobile);
    }

    console.log(`[Billplz] Creating bill for order ${orderRef}, amount: ${amount} cents`);

    const response = await fetch(`${apiBase}/bills`, {
        method: 'POST',
        headers: {
            'Authorization': getAuthHeader(env),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('[Billplz] Create bill error:', data);
        throw new Error(data.error?.message?.[0] || data.error?.type || 'Failed to create Billplz bill');
    }

    console.log(`[Billplz] Bill created: ${data.id}, URL: ${data.url}`);

    return {
        id: data.id,
        url: data.url,
        collectionId: data.collection_id,
        paid: data.paid,
        state: data.state,
        amount: data.amount,
        paidAmount: data.paid_amount,
        dueAt: data.due_at,
        email: data.email,
        name: data.name,
        redirectUrl: data.redirect_url,
        callbackUrl: data.callback_url,
        description: data.description
    };
}

/**
 * Get bill status from Billplz
 * 
 * @param {Object} env - Environment variables
 * @param {string} billId - Billplz bill ID
 * @returns {Promise<Object>} - Bill status object
 */
export async function getBillStatus(env, billId) {
    const apiBase = getApiBase(env);

    const response = await fetch(`${apiBase}/bills/${billId}`, {
        method: 'GET',
        headers: {
            'Authorization': getAuthHeader(env)
        }
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('[Billplz] Get bill error:', data);
        throw new Error(data.error?.message?.[0] || 'Failed to get bill status');
    }

    return {
        id: data.id,
        collectionId: data.collection_id,
        paid: data.paid,
        state: data.state, // 'pending', 'due', 'deleted', 'void', 'completed'
        amount: data.amount,
        paidAmount: data.paid_amount,
        paidAt: data.paid_at,
        dueAt: data.due_at,
        email: data.email,
        name: data.name,
        url: data.url,
        reference1: data.reference_1,
        reference2: data.reference_2
    };
}

/**
 * Verify webhook signature from Billplz
 * 
 * Billplz sends X-Signature header with HMAC-SHA256 signature
 * 
 * @param {Object} env - Environment variables
 * @param {string} body - Raw request body
 * @param {string} signature - X-Signature header value
 * @returns {Promise<boolean>} - True if signature is valid
 */
export async function verifyWebhookSignature(env, body, signature) {
    if (!env.BILLPLZ_XSIGNATURE_KEY) {
        console.error('[Billplz] BILLPLZ_XSIGNATURE_KEY not configured');
        return false;
    }

    if (!signature) {
        console.error('[Billplz] No signature provided');
        return false;
    }

    try {
        const encoder = new TextEncoder();

        // Import the XSignature key
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(env.BILLPLZ_XSIGNATURE_KEY),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign', 'verify']
        );

        // For Billplz, we need to sort the params and concatenate them
        // The signature is computed from the sorted key-value pairs
        const params = new URLSearchParams(body);
        const sortedKeys = Array.from(params.keys()).sort();

        // Build the string to sign (exclude x_signature itself)
        const signatureData = sortedKeys
            .filter(k => k !== 'x_signature')
            .map(k => `${k}${params.get(k)}`)
            .join('|');

        // Compute HMAC-SHA256
        const signatureBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(signatureData)
        );

        // Convert to hex string
        const computedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Compare signatures (case-insensitive)
        const isValid = computedSignature.toLowerCase() === signature.toLowerCase();

        if (!isValid) {
            console.error('[Billplz] Signature mismatch');
            console.error('[Billplz] Expected:', computedSignature);
            console.error('[Billplz] Received:', signature);
        }

        return isValid;
    } catch (error) {
        console.error('[Billplz] Signature verification error:', error);
        return false;
    }
}

/**
 * Parse Billplz redirect callback parameters
 * 
 * After payment, Billplz redirects with query params:
 * ?billplz[id]=xxx&billplz[paid]=true&billplz[paid_at]=xxx&billplz[x_signature]=xxx
 * 
 * @param {URLSearchParams} params - URL search params
 * @returns {Object} - Parsed callback data
 */
export function parseCallbackParams(params) {
    return {
        billId: params.get('billplz[id]'),
        paid: params.get('billplz[paid]') === 'true',
        paidAt: params.get('billplz[paid_at]'),
        xSignature: params.get('billplz[x_signature]')
    };
}

/**
 * Verify redirect callback signature
 * 
 * @param {Object} env - Environment variables
 * @param {Object} callbackData - Parsed callback data from parseCallbackParams
 * @returns {Promise<boolean>} - True if signature is valid
 */
export async function verifyCallbackSignature(env, callbackData) {
    if (!env.BILLPLZ_XSIGNATURE_KEY) {
        console.error('[Billplz] BILLPLZ_XSIGNATURE_KEY not configured');
        return false;
    }

    if (!callbackData.xSignature) {
        console.error('[Billplz] No callback signature provided');
        return false;
    }

    try {
        const encoder = new TextEncoder();

        // Import the XSignature key
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(env.BILLPLZ_XSIGNATURE_KEY),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        // Build the string to sign: billplzid|billplzpaid_at|billplzpaid
        // Note: The order and format must match exactly what Billplz sends
        const signatureData = `billplzid${callbackData.billId}|billplzpaid_at${callbackData.paidAt || ''}|billplzpaid${callbackData.paid}`;

        // Compute HMAC-SHA256
        const signatureBuffer = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(signatureData)
        );

        // Convert to hex string
        const computedSignature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Compare signatures (case-insensitive)
        return computedSignature.toLowerCase() === callbackData.xSignature.toLowerCase();
    } catch (error) {
        console.error('[Billplz] Callback signature verification error:', error);
        return false;
    }
}
