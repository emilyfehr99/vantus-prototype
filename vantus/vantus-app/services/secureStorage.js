/**
 * Secure Storage Service
 * Wrapper around expo-secure-store with encryption fallback
 * Provides secure storage for sensitive data
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// Prefix for encrypted AsyncStorage fallback
const ENCRYPTED_PREFIX = 'vantus_encrypted_';
const ENCRYPTION_KEY_ID = 'vantus_master_key';

class SecureStorage {
    constructor() {
        this.encryptionKey = null;
        this.isSecureStoreAvailable = null;
    }

    /**
     * Check if secure store is available on this device
     * @returns {Promise<boolean>}
     */
    async checkSecureStoreAvailable() {
        if (this.isSecureStoreAvailable !== null) {
            return this.isSecureStoreAvailable;
        }

        try {
            // Try to use SecureStore
            const testKey = '__secure_store_test__';
            await SecureStore.setItemAsync(testKey, 'test');
            await SecureStore.deleteItemAsync(testKey);
            this.isSecureStoreAvailable = true;
        } catch (error) {
            logger.warn('SecureStore not available, using encrypted AsyncStorage fallback');
            this.isSecureStoreAvailable = false;
        }

        return this.isSecureStoreAvailable;
    }

    /**
     * Get or create the master encryption key for fallback storage
     * @returns {Promise<string>}
     */
    async getEncryptionKey() {
        if (this.encryptionKey) {
            return this.encryptionKey;
        }

        try {
            // Try to get existing key from SecureStore
            const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_ID);
            if (existingKey) {
                this.encryptionKey = existingKey;
                return this.encryptionKey;
            }
        } catch (error) {
            // SecureStore not available
        }

        // Generate new key
        const keyBytes = await Crypto.getRandomBytesAsync(32);
        this.encryptionKey = Array.from(keyBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        try {
            await SecureStore.setItemAsync(ENCRYPTION_KEY_ID, this.encryptionKey);
        } catch (error) {
            // If SecureStore fails, store in memory only (less secure but functional)
            logger.warn('Could not persist encryption key to SecureStore');
        }

        return this.encryptionKey;
    }

    /**
     * Encrypt data for fallback storage
     * @param {string} data - Data to encrypt
     * @returns {Promise<string>}
     */
    async encrypt(data) {
        const key = await this.getEncryptionKey();

        // Simple XOR encryption with key (for fallback only)
        // In production, use a proper encryption library
        const encrypted = [];
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            encrypted.push(String.fromCharCode(charCode));
        }

        // Base64 encode for storage
        return Buffer.from(encrypted.join('')).toString('base64');
    }

    /**
     * Decrypt data from fallback storage
     * @param {string} encryptedData - Base64 encrypted data
     * @returns {Promise<string>}
     */
    async decrypt(encryptedData) {
        const key = await this.getEncryptionKey();

        // Base64 decode
        const data = Buffer.from(encryptedData, 'base64').toString();

        // XOR decrypt
        const decrypted = [];
        for (let i = 0; i < data.length; i++) {
            const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            decrypted.push(String.fromCharCode(charCode));
        }

        return decrypted.join('');
    }

    /**
     * Store a value securely
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {Promise<void>}
     */
    async setItem(key, value) {
        const isSecure = await this.checkSecureStoreAvailable();

        if (isSecure) {
            try {
                await SecureStore.setItemAsync(key, value);
                return;
            } catch (error) {
                logger.error('SecureStore setItem failed, using fallback', error);
            }
        }

        // Fallback to encrypted AsyncStorage
        try {
            const encrypted = await this.encrypt(value);
            await AsyncStorage.setItem(ENCRYPTED_PREFIX + key, encrypted);
        } catch (error) {
            logger.error('Failed to store secure item', error);
            throw new Error('Failed to store secure item');
        }
    }

    /**
     * Retrieve a value from secure storage
     * @param {string} key - Storage key
     * @returns {Promise<string|null>}
     */
    async getItem(key) {
        const isSecure = await this.checkSecureStoreAvailable();

        if (isSecure) {
            try {
                return await SecureStore.getItemAsync(key);
            } catch (error) {
                logger.error('SecureStore getItem failed, trying fallback', error);
            }
        }

        // Fallback to encrypted AsyncStorage
        try {
            const encrypted = await AsyncStorage.getItem(ENCRYPTED_PREFIX + key);
            if (encrypted) {
                return await this.decrypt(encrypted);
            }
            return null;
        } catch (error) {
            logger.error('Failed to retrieve secure item', error);
            return null;
        }
    }

    /**
     * Delete a value from secure storage
     * @param {string} key - Storage key
     * @returns {Promise<void>}
     */
    async deleteItem(key) {
        const isSecure = await this.checkSecureStoreAvailable();

        if (isSecure) {
            try {
                await SecureStore.deleteItemAsync(key);
            } catch (error) {
                logger.error('SecureStore deleteItem failed', error);
            }
        }

        // Also try to delete from fallback
        try {
            await AsyncStorage.removeItem(ENCRYPTED_PREFIX + key);
        } catch (error) {
            // Ignore
        }
    }

    /**
     * Store an object securely (JSON serialized)
     * @param {string} key - Storage key
     * @param {Object} value - Object to store
     * @returns {Promise<void>}
     */
    async setObject(key, value) {
        const json = JSON.stringify(value);
        await this.setItem(key, json);
    }

    /**
     * Retrieve an object from secure storage (JSON parsed)
     * @param {string} key - Storage key
     * @returns {Promise<Object|null>}
     */
    async getObject(key) {
        const json = await this.getItem(key);
        if (json) {
            try {
                return JSON.parse(json);
            } catch (error) {
                logger.error('Failed to parse secure object', error);
                return null;
            }
        }
        return null;
    }

    /**
     * Clear all secure storage (dangerous - use with caution)
     * @returns {Promise<void>}
     */
    async clearAll() {
        logger.warn('Clearing all secure storage');

        // Clear known keys
        const knownKeys = [
            'vantus_session_token',
            'vantus_encryption_key',
            'vantus_pin_hash',
            'vantus_last_activity',
        ];

        for (const key of knownKeys) {
            await this.deleteItem(key);
        }

        // Clear encrypted AsyncStorage items
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const encryptedKeys = allKeys.filter(k => k.startsWith(ENCRYPTED_PREFIX));
            if (encryptedKeys.length > 0) {
                await AsyncStorage.multiRemove(encryptedKeys);
            }
        } catch (error) {
            logger.error('Failed to clear encrypted storage', error);
        }
    }

    /**
     * Get storage information
     * @returns {Promise<Object>}
     */
    async getStorageInfo() {
        const isSecure = await this.checkSecureStoreAvailable();

        return {
            platform: Platform.OS,
            secureStoreAvailable: isSecure,
            usingFallback: !isSecure,
            securityLevel: isSecure ? 'hardware' : 'software',
        };
    }
}

// Export singleton instance
export default new SecureStorage();
