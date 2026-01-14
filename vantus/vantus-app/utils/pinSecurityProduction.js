/**
 * PIN Security Utilities - Production Version
 * Uses react-native-bcrypt or react-native-argon2 for secure hashing
 * 
 * Installation:
 * npm install react-native-bcrypt
 * OR
 * npm install react-native-argon2
 * 
 * Then use this file instead of pinSecurity.js
 */

// Try to import bcrypt first, fallback to argon2, then to basic implementation
let bcrypt = null;
let argon2 = null;
let useBcrypt = false;
let useArgon2 = false;

try {
  // Try bcrypt first (most common)
  bcrypt = require('react-native-bcrypt');
  useBcrypt = true;
} catch (e) {
  try {
    // Fallback to argon2
    argon2 = require('react-native-argon2');
    useArgon2 = true;
  } catch (e2) {
    // Fallback to basic implementation
    const Crypto = require('expo-crypto');
  }
}

import logger from './logger';

/**
 * Hash a PIN securely using bcrypt or argon2
 * @param {string} pin - Plain text PIN
 * @returns {Promise<{hash: string, salt?: string}>}
 */
export async function hashPIN(pin) {
  try {
    if (useBcrypt) {
      // Use bcrypt (10 rounds recommended)
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(pin, salt);
      return {
        hash: hash,
        // bcrypt includes salt in hash
      };
    } else if (useArgon2) {
      // Use argon2 (argon2id variant recommended)
      const hash = await argon2.hash({
        pass: pin,
        type: argon2.argon2id,
        time: 3, // 3 iterations
        mem: 65536, // 64 MB memory
        parallelism: 4, // 4 threads
      });
      return {
        hash: hash.encoded,
        // argon2 includes salt in encoded string
      };
    } else {
      // Fallback to basic implementation
      const Crypto = require('expo-crypto').default;
      const salt = await Crypto.getRandomBytesAsync(16);
      const saltHex = Array.from(salt)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const hashInput = pin + saltHex;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        hashInput
      );
      return {
        hash: hash,
        salt: saltHex,
      };
    }
  } catch (error) {
    logger.error('PIN hashing error', error);
    throw new Error('Failed to hash PIN');
  }
}

/**
 * Verify a PIN against a hash
 * @param {string} pin - Plain text PIN to verify
 * @param {string} storedHash - Stored hash
 * @param {string} salt - Stored salt (only needed for basic implementation)
 * @returns {Promise<boolean>}
 */
export async function verifyPIN(pin, storedHash, salt = null) {
  try {
    if (useBcrypt) {
      // bcrypt includes salt in hash
      return bcrypt.compareSync(pin, storedHash);
    } else if (useArgon2) {
      // argon2 includes salt in encoded string
      const result = await argon2.verify({
        pass: pin,
        encoded: storedHash,
      });
      return result;
    } else {
      // Fallback to basic implementation
      const Crypto = require('expo-crypto').default;
      const hashInput = pin + (salt || '');
      const computedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        hashInput
      );
      return computedHash === storedHash;
    }
  } catch (error) {
    logger.error('PIN verification error', error);
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

/**
 * Get the hashing method currently in use
 * @returns {string} 'bcrypt' | 'argon2' | 'sha256'
 */
export function getHashingMethod() {
  if (useBcrypt) return 'bcrypt';
  if (useArgon2) return 'argon2';
  return 'sha256';
}
