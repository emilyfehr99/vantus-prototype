/**
 * Data Encryption Service
 * AES-256-GCM encryption for data at rest
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;
const KEY_LENGTH = 32; // 256 bits

class DataEncryptionService {
    constructor() {
        this.masterKey = null;
        this.keyFile = path.join(__dirname, '../.keys/master.key');
        this.initialized = false;
    }

    /**
     * Initialize encryption service with master key
     * In production, this should be loaded from a secure key vault
     */
    async initialize(masterKeyBase64 = null) {
        if (this.initialized) return;

        try {
            if (masterKeyBase64) {
                // Use provided key
                this.masterKey = Buffer.from(masterKeyBase64, 'base64');
            } else if (process.env.VANTUS_MASTER_KEY) {
                // Use environment variable
                this.masterKey = Buffer.from(process.env.VANTUS_MASTER_KEY, 'base64');
            } else if (fs.existsSync(this.keyFile)) {
                // Load from file (development only)
                this.masterKey = Buffer.from(fs.readFileSync(this.keyFile, 'utf8').trim(), 'base64');
            } else {
                // Generate new key (development only)
                this.masterKey = crypto.randomBytes(KEY_LENGTH);
                this.saveKey();
                logger.warn('Generated new master key - store this securely!', {
                    key: this.masterKey.toString('base64'),
                });
            }

            this.initialized = true;
            logger.info('Encryption service initialized');
        } catch (error) {
            logger.error('Failed to initialize encryption service', error);
            throw error;
        }
    }

    /**
     * Save master key to file (development only)
     */
    saveKey() {
        const keyDir = path.dirname(this.keyFile);
        if (!fs.existsSync(keyDir)) {
            fs.mkdirSync(keyDir, { recursive: true });
        }
        fs.writeFileSync(this.keyFile, this.masterKey.toString('base64'));
        fs.chmodSync(this.keyFile, 0o600); // Restrict access
    }

    /**
     * Derive encryption key from master key and purpose
     * @param {string} purpose - Key purpose (e.g., 'calibration', 'audio', 'video')
     * @param {Buffer} salt - Salt for key derivation
     */
    deriveKey(purpose, salt) {
        return crypto.pbkdf2Sync(
            this.masterKey,
            Buffer.concat([salt, Buffer.from(purpose)]),
            100000, // iterations
            KEY_LENGTH,
            'sha256'
        );
    }

    /**
     * Encrypt data
     * @param {string|Buffer|Object} data - Data to encrypt
     * @param {string} purpose - Encryption purpose for key derivation
     * @returns {Object} Encrypted data with IV, auth tag, and salt
     */
    async encrypt(data, purpose = 'general') {
        await this.initialize();

        // Convert data to buffer
        let dataBuffer;
        if (typeof data === 'object' && !Buffer.isBuffer(data)) {
            dataBuffer = Buffer.from(JSON.stringify(data), 'utf8');
        } else if (typeof data === 'string') {
            dataBuffer = Buffer.from(data, 'utf8');
        } else {
            dataBuffer = data;
        }

        // Generate IV and salt
        const iv = crypto.randomBytes(IV_LENGTH);
        const salt = crypto.randomBytes(SALT_LENGTH);

        // Derive purpose-specific key
        const key = this.deriveKey(purpose, salt);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt
        const encrypted = Buffer.concat([
            cipher.update(dataBuffer),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        // Return encrypted package
        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            salt: salt.toString('base64'),
            algorithm: ALGORITHM,
            purpose,
        };
    }

    /**
     * Decrypt data
     * @param {Object} encryptedPackage - Encrypted data package
     * @returns {Buffer} Decrypted data
     */
    async decrypt(encryptedPackage) {
        await this.initialize();

        const { encrypted, iv, authTag, salt, purpose = 'general' } = encryptedPackage;

        // Convert from base64
        const encryptedBuffer = Buffer.from(encrypted, 'base64');
        const ivBuffer = Buffer.from(iv, 'base64');
        const authTagBuffer = Buffer.from(authTag, 'base64');
        const saltBuffer = Buffer.from(salt, 'base64');

        // Derive the same key
        const key = this.deriveKey(purpose, saltBuffer);

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
        decipher.setAuthTag(authTagBuffer);

        // Decrypt
        const decrypted = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final(),
        ]);

        return decrypted;
    }

    /**
     * Decrypt to string
     */
    async decryptToString(encryptedPackage) {
        const buffer = await this.decrypt(encryptedPackage);
        return buffer.toString('utf8');
    }

    /**
     * Decrypt to JSON object
     */
    async decryptToJson(encryptedPackage) {
        const str = await this.decryptToString(encryptedPackage);
        return JSON.parse(str);
    }

    /**
     * Encrypt file
     * @param {string} inputPath - Path to file to encrypt
     * @param {string} outputPath - Path for encrypted file
     * @param {string} purpose - Encryption purpose
     */
    async encryptFile(inputPath, outputPath, purpose = 'file') {
        await this.initialize();

        const data = fs.readFileSync(inputPath);
        const encrypted = await this.encrypt(data, purpose);

        fs.writeFileSync(outputPath, JSON.stringify(encrypted));

        logger.info('File encrypted', { inputPath, outputPath, purpose });

        return outputPath;
    }

    /**
     * Decrypt file
     * @param {string} inputPath - Path to encrypted file
     * @param {string} outputPath - Path for decrypted file
     */
    async decryptFile(inputPath, outputPath) {
        await this.initialize();

        const encryptedPackage = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        const decrypted = await this.decrypt(encryptedPackage);

        fs.writeFileSync(outputPath, decrypted);

        logger.info('File decrypted', { inputPath, outputPath });

        return outputPath;
    }

    /**
     * Encrypt calibration data
     */
    async encryptCalibration(calibrationData) {
        return this.encrypt(calibrationData, 'calibration');
    }

    /**
     * Decrypt calibration data
     */
    async decryptCalibration(encryptedPackage) {
        return this.decryptToJson(encryptedPackage);
    }

    /**
     * Encrypt audio transcript
     */
    async encryptAudioTranscript(transcript) {
        return this.encrypt(transcript, 'audio');
    }

    /**
     * Decrypt audio transcript
     */
    async decryptAudioTranscript(encryptedPackage) {
        return this.decryptToJson(encryptedPackage);
    }

    /**
     * Encrypt video clip metadata
     */
    async encryptVideoMetadata(metadata) {
        return this.encrypt(metadata, 'video');
    }

    /**
     * Decrypt video clip metadata
     */
    async decryptVideoMetadata(encryptedPackage) {
        return this.decryptToJson(encryptedPackage);
    }

    /**
     * Get encryption status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            algorithm: ALGORITHM,
            keyLength: KEY_LENGTH * 8, // bits
            hasKey: !!this.masterKey,
        };
    }

    /**
     * Rotate master key
     * @param {string} newKeyBase64 - New master key in base64
     * @param {Function} reEncryptCallback - Callback to re-encrypt existing data
     */
    async rotateKey(newKeyBase64, reEncryptCallback) {
        const oldKey = this.masterKey;
        const newKey = Buffer.from(newKeyBase64, 'base64');

        logger.warn('Starting key rotation - this is a critical operation');

        // Temporarily set new key
        this.masterKey = newKey;

        try {
            // Call callback to re-encrypt existing data
            if (reEncryptCallback) {
                await reEncryptCallback(oldKey, newKey);
            }

            // Save new key
            this.saveKey();

            logger.info('Key rotation completed successfully');
        } catch (error) {
            // Rollback on failure
            this.masterKey = oldKey;
            logger.error('Key rotation failed, rolled back', error);
            throw error;
        }
    }
}

module.exports = new DataEncryptionService();
