/**
 * Password Utilities
 * Secure password hashing and verification using Web Crypto API
 */

/**
 * Generate a random salt
 * @returns {string} Random UUID as salt
 */
function generateSalt() {
    return crypto.randomUUID();
}

/**
 * Hash a password using SHA-256 with salt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password in format "salt:hash"
 */
export async function hashPassword(password) {
    const salt = generateSalt();
    const data = new TextEncoder().encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${salt}:${hashHex}`;
}

/**
 * Verify a password against a stored hash
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash in format "salt:hash"
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, storedHash) {
    // Handle legacy plaintext passwords (for migration)
    if (!storedHash.includes(':')) {
        // This is a plaintext password - compare directly
        // After first successful login, we should update to hashed
        return password === storedHash;
    }

    const [salt, hash] = storedHash.split(':');
    const data = new TextEncoder().encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === hash;
}

/**
 * Check if a password hash is in the new format
 * @param {string} storedHash - The stored password hash
 * @returns {boolean} True if hash is in new format
 */
export function isHashedPassword(storedHash) {
    return storedHash && storedHash.includes(':') && storedHash.split(':').length === 2;
}
