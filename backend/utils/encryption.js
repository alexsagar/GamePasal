const crypto = require('crypto');

// The encryption key should be exactly 32 bytes (256 bits) for aes-256-cbc.
// Ideally, this should come from process.env.ENCRYPTION_KEY.
// We'll fall back to SHA256 of JWT_SECRET to derive a consistent 32-byte key if one isn't explicitly set.
const getEncryptionKey = () => {
    const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback_default_secret_key_1234';
    return crypto.createHash('sha256').update(secret).digest();
};

const algorithm = 'aes-256-cbc';

/**
 * Encrypts a plain text string.
 * @param {string} text The text to encrypt.
 * @returns {string|null} The encrypted string in format ipv:encryptedData (hex), or null if input is falsy.
 */
function encrypt(text) {
    if (!text) return null;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted string.
 * @param {string} encryptedText The encrypted string in format ipv:encryptedData.
 * @returns {string|null} The decrypted plain text, or null if input is falsy or invalid.
 */
function decrypt(encryptedText) {
    if (!encryptedText) return null;
    try {
        const textParts = encryptedText.split(':');
        if (textParts.length !== 2) return encryptedText; // Probably not encrypted data

        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedData = Buffer.from(textParts[1], 'hex');
        const decipher = crypto.createDecipheriv(algorithm, getEncryptionKey(), iv);

        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

module.exports = {
    encrypt,
    decrypt
};
