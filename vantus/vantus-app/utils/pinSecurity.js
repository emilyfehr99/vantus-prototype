/**
 * PIN Security Utilities
 * Secure PIN hashing and verification
 */

// For React Native, we'll use a simple bcrypt-like approach
// In production, use expo-crypto or react-native-bcrypt
import * as Crypto from 'expo-crypto';

/**
 * Hash a PIN securely
 * @param {string} pin - Plain text PIN
 * @param {string} salt - Optional salt (will generate if not provided)
 * @returns {Promise<{hash: string, salt: string}>}
 */
export async function hashPIN(pin) {
  try {
    // Generate a random salt
    const salt = await Crypto.getRandomBytesAsync(16);
    const saltHex = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Create hash (in production, use proper bcrypt)
    // For now, we'll use a simple SHA-256 with salt
    const hashInput = pin + saltHex;
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hashInput
    );

    return {
      hash: hash,
      salt: saltHex,
    };
  } catch (error) {
    console.error('PIN hashing error:', error);
    throw new Error('Failed to hash PIN');
  }
}

/**
 * Verify a PIN against a hash
 * @param {string} pin - Plain text PIN to verify
 * @param {string} storedHash - Stored hash
 * @param {string} salt - Stored salt
 * @returns {Promise<boolean>}
 */
export async function verifyPIN(pin, storedHash, salt) {
  try {
    const hashInput = pin + salt;
    const computedHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hashInput
    );

    return computedHash === storedHash;
  } catch (error) {
    console.error('PIN verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random PIN (for testing/admin use)
 * @param {number} length - PIN length
 * @returns {string}
 */
export function generateSecurePIN(length = 6) {
  const digits = '0123456789';
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return pin;
}
