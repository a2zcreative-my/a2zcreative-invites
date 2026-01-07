/**
 * Token Rotation Helper
 * Handles setting rotated session tokens in response cookies
 */

import { SESSION_COOKIE_NAME, createSessionCookie } from './session.js';

/**
 * Wrap a response to include rotated session token if applicable
 * @param {Response} response - Original response
 * @param {Object} authResult - Result from requireAuth with newSessionToken
 * @returns {Response} Response with updated Set-Cookie header if token was rotated
 */
export function wrapResponseWithTokenRotation(response, authResult) {
     if (!authResult?.newSessionToken) {
         // No token rotation needed
         return response;
     }

     // Clone the response and add Set-Cookie header for new token
     const newResponse = new Response(response.body, response);
     const cookieValue = createSessionCookie(
         authResult.newSessionToken,
         authResult.newSessionExpiry
     );

     newResponse.headers.append('Set-Cookie', cookieValue);
     return newResponse;
}

/**
 * Create a simple success response with token rotation support
 * @param {Object} data - Response data
 * @param {number} status - HTTP status
 * @param {Object} authResult - Result from requireAuth
 * @returns {Response}
 */
export function successResponseWithRotation(data, status, authResult) {
     const response = new Response(JSON.stringify(data), {
         status,
         headers: {
             'Content-Type': 'application/json'
         }
     });

     return wrapResponseWithTokenRotation(response, authResult);
}

export { SESSION_COOKIE_NAME };
