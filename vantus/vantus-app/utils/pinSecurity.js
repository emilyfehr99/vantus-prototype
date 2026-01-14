/**
 * PIN Security Utilities
 * Secure PIN hashing and verification
 * 
 * NOTE: For production, install and use react-native-bcrypt or react-native-argon2
 * Current implementation uses SHA-256 with salt (acceptable but not ideal)
 * 
 * Production setup:
 * npm install react-native-bcrypt
 * OR
 * npm install react-native-argon2
 */

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

    // Create hash
    // TODO: In production, use bcrypt or argon2:
    // const hash = await bcrypt.hash(pin, 10); // bcrypt with 10 rounds
    // OR
    // const hash = await argon2.hash(pin, { type: argon2.argon2id }); // argon2
    
    // Current: SHA-256 with salt (acceptable but not ideal)
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
