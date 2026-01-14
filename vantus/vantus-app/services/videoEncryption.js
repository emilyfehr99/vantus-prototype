/**
 * Video Encryption Service
 * AES-256 encryption for video clips
 */

import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import logger from '../utils/logger';

class VideoEncryption {
  constructor() {
    this.algorithm = 'AES-256-GCM';
    this.keyLength = 32; // 256 bits
    this.ivLength = 12; // 96 bits for GCM
    this.tagLength = 16; // 128 bits for GCM tag
  }

  /**
   * Generate encryption key
   * In production, this should be stored securely (keychain/keystore)
   */
  async generateKey() {
    try {
      const keyBytes = await Crypto.getRandomBytesAsync(this.keyLength);
      return Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      logger.error('Error generating encryption key', error);
      throw error;
    }
  }

  /**
   * Generate initialization vector (IV)
   */
  async generateIV() {
    try {
      const ivBytes = await Crypto.getRandomBytesAsync(this.ivLength);
      return Array.from(ivBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      logger.error('Error generating IV', error);
      throw error;
    }
  }

  /**
   * Encrypt video file
   * @param {string} videoUri - URI of video file to encrypt
   * @param {string} encryptionKey - Encryption key (hex string)
   * @returns {Promise<{encryptedUri: string, iv: string, tag: string}>}
   */
  async encryptVideo(videoUri, encryptionKey) {
    try {
      // Read video file as base64
      const videoBase64 = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to bytes
      const videoBytes = this.base64ToBytes(videoBase64);

      // Generate IV
      const iv = await this.generateIV();
      const ivBytes = this.hexToBytes(iv);

      // For React Native, we'll use a simplified encryption approach
      // In production, use react-native-crypto or native modules for AES-GCM
      // For now, we'll use XOR encryption as a placeholder (NOT SECURE - replace with proper AES)
      const encrypted = this.xorEncrypt(videoBytes, this.hexToBytes(encryptionKey), ivBytes);

      // Convert encrypted bytes to base64
      const encryptedBase64 = this.bytesToBase64(encrypted);

      // Save encrypted file
      const encryptedUri = videoUri.replace('.mp4', '.enc.mp4');
      await FileSystem.writeAsStringAsync(encryptedUri, encryptedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate authentication tag (simplified - use proper HMAC in production)
      const tag = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        encryptedBase64 + iv
      );

      logger.info('Video encrypted', {
        originalUri: videoUri,
        encryptedUri,
        size: encrypted.length,
      });

      return {
        encryptedUri,
        iv,
        tag: tag.substring(0, 32), // First 32 chars of hash as tag
      };
    } catch (error) {
      logger.error('Video encryption error', error);
      throw error;
    }
  }

  /**
   * Decrypt video file
   * @param {string} encryptedUri - URI of encrypted video file
   * @param {string} encryptionKey - Encryption key (hex string)
   * @param {string} iv - Initialization vector (hex string)
   * @param {string} tag - Authentication tag
   * @returns {Promise<string>} Decrypted video URI
   */
  async decryptVideo(encryptedUri, encryptionKey, iv, tag) {
    try {
      // Read encrypted file
      const encryptedBase64 = await FileSystem.readAsStringAsync(encryptedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Verify tag
      const computedTag = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        encryptedBase64 + iv
      );
      if (computedTag.substring(0, 32) !== tag) {
        throw new Error('Authentication tag mismatch - file may be corrupted');
      }

      // Convert to bytes
      const encryptedBytes = this.base64ToBytes(encryptedBase64);
      const ivBytes = this.hexToBytes(iv);

      // Decrypt (XOR - replace with proper AES in production)
      const decrypted = this.xorDecrypt(encryptedBytes, this.hexToBytes(encryptionKey), ivBytes);

      // Convert to base64
      const decryptedBase64 = this.bytesToBase64(decrypted);

      // Save decrypted file
      const decryptedUri = encryptedUri.replace('.enc.mp4', '.decrypted.mp4');
      await FileSystem.writeAsStringAsync(decryptedUri, decryptedBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      logger.info('Video decrypted', { encryptedUri, decryptedUri });

      return decryptedUri;
    } catch (error) {
      logger.error('Video decryption error', error);
      throw error;
    }
  }

  /**
   * XOR encryption (placeholder - NOT SECURE)
   * Replace with proper AES-256-GCM in production
   */
  xorEncrypt(data, key, iv) {
    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    return encrypted;
  }

  /**
   * XOR decryption (placeholder - NOT SECURE)
   * Replace with proper AES-256-GCM in production
   */
  xorDecrypt(data, key, iv) {
    return this.xorEncrypt(data, key, iv); // XOR is symmetric
  }

  /**
   * Convert base64 to bytes
   */
  base64ToBytes(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Convert bytes to base64
   */
  bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert hex string to bytes
   */
  hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Store encryption key securely
   * In production, use expo-secure-store or react-native-keychain
   */
  async storeKey(keyId, key) {
    // TODO: Implement secure storage
    // await SecureStore.setItemAsync(keyId, key);
    logger.warn('Key storage not implemented - use secure storage in production');
  }

  /**
   * Retrieve encryption key securely
   */
  async retrieveKey(keyId) {
    // TODO: Implement secure storage retrieval
    // return await SecureStore.getItemAsync(keyId);
    logger.warn('Key retrieval not implemented - use secure storage in production');
    return null;
  }
}

export default new VideoEncryption();
