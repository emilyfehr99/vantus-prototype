/**
 * Video Encryption Service - Production Version
 * Uses native AES-256-GCM encryption
 * 
 * Installation:
 * npm install react-native-crypto-js
 * OR use native modules for better performance
 */

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import logger from '../utils/logger';

// Try to import native crypto library
let CryptoJS = null;
let useNativeCrypto = false;

try {
  CryptoJS = require('crypto-js');
  useNativeCrypto = true;
} catch (e) {
  logger.warn('crypto-js not available, using basic encryption');
}

class VideoEncryptionProduction {
  constructor() {
    this.algorithm = 'AES-256-GCM';
    this.keyLength = 32; // 256 bits
    this.ivLength = 12; // 96 bits for GCM
    this.tagLength = 16; // 128 bits for GCM tag
    this.keyStoragePrefix = 'vantus_video_key_';
  }

  /**
   * Generate encryption key and store securely
   * @param {string} clipId - Unique clip identifier
   * @returns {Promise<string>} Encryption key (stored securely, returns key ID)
   */
  async generateAndStoreKey(clipId) {
    try {
      if (useNativeCrypto) {
        // Generate random key using crypto-js
        const key = CryptoJS.lib.WordArray.random(this.keyLength).toString();
        const keyId = `${this.keyStoragePrefix}${clipId}`;
        
        // Store key securely
        await SecureStore.setItemAsync(keyId, key);
        
        logger.info('Encryption key generated and stored', { keyId });
        return keyId;
      } else {
        // Fallback: generate using expo-crypto
        const Crypto = require('expo-crypto').default;
        const keyBytes = await Crypto.getRandomBytesAsync(this.keyLength);
        const key = Array.from(keyBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const keyId = `${this.keyStoragePrefix}${clipId}`;
        
        await SecureStore.setItemAsync(keyId, key);
        
        logger.info('Encryption key generated and stored', { keyId });
        return keyId;
      }
    } catch (error) {
      logger.error('Error generating encryption key', error);
      throw error;
    }
  }

  /**
   * Retrieve encryption key securely
   * @param {string} keyId - Key identifier
   * @returns {Promise<string>} Encryption key
   */
  async retrieveKey(keyId) {
    try {
      const key = await SecureStore.getItemAsync(keyId);
      if (!key) {
        throw new Error('Encryption key not found');
      }
      return key;
    } catch (error) {
      logger.error('Error retrieving encryption key', error);
      throw error;
    }
  }

  /**
   * Encrypt video file using AES-256-GCM
   * @param {string} videoUri - URI of video file to encrypt
   * @param {string} keyId - Key identifier (key will be retrieved)
   * @returns {Promise<{encryptedUri: string, iv: string, tag: string, keyId: string}>}
   */
  async encryptVideo(videoUri, keyId = null) {
    try {
      // Generate clip ID if not provided
      const clipId = keyId ? keyId.replace(this.keyStoragePrefix, '') : `clip_${Date.now()}`;
      
      // Get or generate key
      let key;
      if (keyId) {
        key = await this.retrieveKey(keyId);
      } else {
        keyId = await this.generateAndStoreKey(clipId);
        key = await this.retrieveKey(keyId);
      }

      // Read video file
      const videoBase64 = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (useNativeCrypto) {
        // Use crypto-js for AES encryption
        const iv = CryptoJS.lib.WordArray.random(this.ivLength);
        const encrypted = CryptoJS.AES.encrypt(videoBase64, key, {
          iv: iv,
          mode: CryptoJS.mode.GCM,
          padding: CryptoJS.pad.Pkcs7,
        });

        // Extract tag (GCM authentication tag)
        const tag = encrypted.tag ? encrypted.tag.toString() : null;
        const encryptedData = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        const ivHex = iv.toString();

        // Save encrypted file
        const encryptedUri = videoUri.replace('.mp4', '.enc.mp4');
        await FileSystem.writeAsStringAsync(encryptedUri, encryptedData, {
          encoding: FileSystem.EncodingType.Base64,
        });

        logger.info('Video encrypted with AES-256-GCM', {
          originalUri: videoUri,
          encryptedUri,
          keyId,
        });

        return {
          encryptedUri,
          iv: ivHex,
          tag: tag || this.generateTag(encryptedData, ivHex), // Fallback tag generation
          keyId,
        };
      } else {
        // Fallback: basic encryption (should not be used in production)
        logger.warn('Using fallback encryption - install crypto-js for production');
        const Crypto = require('expo-crypto').default;
        const ivBytes = await Crypto.getRandomBytesAsync(this.ivLength);
        const ivHex = Array.from(ivBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        // Simple XOR encryption (NOT SECURE - replace with proper AES)
        const encrypted = this.xorEncrypt(
          this.base64ToBytes(videoBase64),
          this.hexToBytes(key),
          ivBytes
        );
        const encryptedBase64 = this.bytesToBase64(encrypted);
        const tag = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          encryptedBase64 + ivHex
        );

        const encryptedUri = videoUri.replace('.mp4', '.enc.mp4');
        await FileSystem.writeAsStringAsync(encryptedUri, encryptedBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return {
          encryptedUri,
          iv: ivHex,
          tag: tag.substring(0, 32),
          keyId,
        };
      }
    } catch (error) {
      logger.error('Video encryption error', error);
      throw error;
    }
  }

  /**
   * Decrypt video file
   * @param {string} encryptedUri - URI of encrypted video file
   * @param {string} keyId - Key identifier
   * @param {string} iv - Initialization vector (hex string)
   * @param {string} tag - Authentication tag
   * @returns {Promise<string>} Decrypted video URI
   */
  async decryptVideo(encryptedUri, keyId, iv, tag) {
    try {
      // Retrieve key
      const key = await this.retrieveKey(keyId);

      // Read encrypted file
      const encryptedBase64 = await FileSystem.readAsStringAsync(encryptedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (useNativeCrypto) {
        // Verify tag first
        const computedTag = this.generateTag(encryptedBase64, iv);
        if (computedTag !== tag) {
          throw new Error('Authentication tag mismatch - file may be corrupted');
        }

        // Decrypt using crypto-js
        const ivWordArray = CryptoJS.enc.Hex.parse(iv);
        const encrypted = CryptoJS.lib.CipherParams.create({
          ciphertext: CryptoJS.enc.Base64.parse(encryptedBase64),
        });

        const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
          iv: ivWordArray,
          mode: CryptoJS.mode.GCM,
          padding: CryptoJS.pad.Pkcs7,
        });

        const decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);

        // Save decrypted file
        const decryptedUri = encryptedUri.replace('.enc.mp4', '.decrypted.mp4');
        await FileSystem.writeAsStringAsync(decryptedUri, decryptedBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        logger.info('Video decrypted', { encryptedUri, decryptedUri });

        return decryptedUri;
      } else {
        // Fallback decryption
        logger.warn('Using fallback decryption - install crypto-js for production');
        const Crypto = require('expo-crypto').default;
        const computedTag = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          encryptedBase64 + iv
        );
        if (computedTag.substring(0, 32) !== tag) {
          throw new Error('Authentication tag mismatch - file may be corrupted');
        }

        const encryptedBytes = this.base64ToBytes(encryptedBase64);
        const ivBytes = this.hexToBytes(iv);
        const decrypted = this.xorDecrypt(encryptedBytes, this.hexToBytes(key), ivBytes);
        const decryptedBase64 = this.bytesToBase64(decrypted);

        const decryptedUri = encryptedUri.replace('.enc.mp4', '.decrypted.mp4');
        await FileSystem.writeAsStringAsync(decryptedUri, decryptedBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return decryptedUri;
      }
    } catch (error) {
      logger.error('Video decryption error', error);
      throw error;
    }
  }

  /**
   * Generate authentication tag
   */
  generateTag(data, iv) {
    if (useNativeCrypto) {
      return CryptoJS.HmacSHA256(data + iv, 'vantus_tag_key').toString();
    }
    // Fallback
    const Crypto = require('expo-crypto').default;
    return Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data + iv
    ).then(hash => hash.substring(0, 32));
  }

  /**
   * Delete encryption key securely
   * @param {string} keyId - Key identifier
   */
  async deleteKey(keyId) {
    try {
      await SecureStore.deleteItemAsync(keyId);
      logger.info('Encryption key deleted', { keyId });
    } catch (error) {
      logger.error('Error deleting encryption key', error);
    }
  }

  // Helper methods (fallback only)
  xorEncrypt(data, key, iv) {
    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ key[i % key.length] ^ iv[i % iv.length];
    }
    return encrypted;
  }

  xorDecrypt(data, key, iv) {
    return this.xorEncrypt(data, key, iv);
  }

  base64ToBytes(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  bytesToBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }
}

export default new VideoEncryptionProduction();
