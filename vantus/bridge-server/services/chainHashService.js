/**
 * Chain Hash Verification Service
 * Provides immutable, tamper-evident logging with blockchain-like integrity
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ChainHashService {
    constructor() {
        this.chainFile = path.join(__dirname, '../logs/hash_chain.jsonl');
        this.lastHash = null;
        this.entryCount = 0;
        this.initialized = false;
    }

    /**
     * Initialize the chain from existing file
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const logDir = path.dirname(this.chainFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            // Load last hash from chain
            if (fs.existsSync(this.chainFile)) {
                const lines = fs.readFileSync(this.chainFile, 'utf8').trim().split('\n');
                if (lines.length > 0 && lines[0]) {
                    const lastEntry = JSON.parse(lines[lines.length - 1]);
                    this.lastHash = lastEntry.hash;
                    this.entryCount = lines.length;
                }
            }

            this.initialized = true;
            logger.info('Chain hash service initialized', { entryCount: this.entryCount });
        } catch (error) {
            logger.error('Failed to initialize chain hash service', error);
            this.lastHash = null;
            this.entryCount = 0;
            this.initialized = true;
        }
    }

    /**
     * Calculate SHA-256 hash of content
     * @param {string|Object} content - Content to hash
     * @param {string} previousHash - Previous hash in chain
     * @returns {string} 64-character hex hash
     */
    calculateHash(content, previousHash = null) {
        const dataToHash = {
            content: typeof content === 'string' ? content : JSON.stringify(content),
            previousHash: previousHash || 'GENESIS',
            timestamp: Date.now(),
        };

        return crypto
            .createHash('sha256')
            .update(JSON.stringify(dataToHash))
            .digest('hex');
    }

    /**
     * Add entry to the chain with integrity hash
     * @param {Object} entry - Entry to add
     * @param {string} entryType - Type of entry (e.g., 'DETECTION', 'DISPATCH', 'SESSION')
     * @returns {Object} Entry with chain metadata
     */
    async addEntry(entry, entryType = 'EVENT') {
        await this.initialize();

        const timestamp = new Date().toISOString();
        const index = this.entryCount;

        // Create chain entry
        const chainEntry = {
            index,
            timestamp,
            type: entryType,
            data: entry,
            previousHash: this.lastHash || 'GENESIS',
        };

        // Calculate hash including previous hash (creates chain)
        const hash = this.calculateHash(chainEntry, this.lastHash);
        chainEntry.hash = hash;

        // Update chain state
        this.lastHash = hash;
        this.entryCount++;

        // Append to chain file
        try {
            fs.appendFileSync(this.chainFile, JSON.stringify(chainEntry) + '\n');
        } catch (error) {
            logger.error('Failed to write chain entry', error);
        }

        return chainEntry;
    }

    /**
     * Verify integrity of a single entry
     * @param {Object} entry - Entry to verify
     * @param {string} expectedPreviousHash - Expected previous hash
     * @returns {Object} Verification result
     */
    verifyEntry(entry, expectedPreviousHash) {
        const entryWithoutHash = { ...entry };
        delete entryWithoutHash.hash;

        const calculatedHash = this.calculateHash(entryWithoutHash, entry.previousHash);

        const isValid = calculatedHash === entry.hash;
        const chainLinksCorrectly = entry.previousHash === expectedPreviousHash || entry.previousHash === 'GENESIS';

        return {
            valid: isValid && chainLinksCorrectly,
            hashValid: isValid,
            chainValid: chainLinksCorrectly,
            index: entry.index,
            calculatedHash,
            storedHash: entry.hash,
        };
    }

    /**
     * Verify entire chain integrity
     * @param {string} chainFilePath - Optional path to chain file
     * @returns {Object} Verification result
     */
    async verifyChain(chainFilePath = null) {
        const filePath = chainFilePath || this.chainFile;

        if (!fs.existsSync(filePath)) {
            return { valid: true, entriesVerified: 0, message: 'No chain file found' };
        }

        try {
            const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
            if (!lines[0]) {
                return { valid: true, entriesVerified: 0, message: 'Empty chain' };
            }

            let previousHash = 'GENESIS';
            const errors = [];

            for (let i = 0; i < lines.length; i++) {
                const entry = JSON.parse(lines[i]);
                const result = this.verifyEntry(entry, previousHash);

                if (!result.valid) {
                    errors.push({
                        index: i,
                        type: entry.type,
                        timestamp: entry.timestamp,
                        hashValid: result.hashValid,
                        chainValid: result.chainValid,
                    });
                }

                previousHash = entry.hash;
            }

            return {
                valid: errors.length === 0,
                entriesVerified: lines.length,
                errors,
                message: errors.length === 0
                    ? `✓ Chain verified: ${lines.length} entries, all valid`
                    : `✗ Chain integrity compromised at ${errors.length} point(s)`,
            };
        } catch (error) {
            logger.error('Chain verification failed', error);
            return {
                valid: false,
                entriesVerified: 0,
                error: error.message,
                message: 'Chain verification failed',
            };
        }
    }

    /**
     * Get chain statistics
     */
    async getStats() {
        await this.initialize();

        return {
            entryCount: this.entryCount,
            lastHash: this.lastHash ? this.lastHash.substring(0, 12) + '...' : null,
            chainFile: this.chainFile,
            initialized: this.initialized,
        };
    }

    /**
     * Get entries by type
     * @param {string} entryType - Type to filter by
     * @param {number} limit - Max entries to return
     */
    getEntriesByType(entryType, limit = 100) {
        if (!fs.existsSync(this.chainFile)) {
            return [];
        }

        const lines = fs.readFileSync(this.chainFile, 'utf8').trim().split('\n');
        const entries = [];

        for (let i = lines.length - 1; i >= 0 && entries.length < limit; i--) {
            if (!lines[i]) continue;
            const entry = JSON.parse(lines[i]);
            if (entry.type === entryType || !entryType) {
                entries.push(entry);
            }
        }

        return entries;
    }

    /**
     * Get proof of integrity for a specific entry
     * Creates a verification path from entry back to genesis
     */
    getProofOfIntegrity(entryIndex) {
        if (!fs.existsSync(this.chainFile)) {
            return null;
        }

        const lines = fs.readFileSync(this.chainFile, 'utf8').trim().split('\n');
        if (entryIndex >= lines.length) {
            return null;
        }

        const proof = [];
        for (let i = 0; i <= entryIndex; i++) {
            const entry = JSON.parse(lines[i]);
            proof.push({
                index: entry.index,
                hash: entry.hash,
                previousHash: entry.previousHash,
                timestamp: entry.timestamp,
                type: entry.type,
            });
        }

        return {
            entryIndex,
            entryHash: proof[entryIndex].hash,
            chainLength: lines.length,
            proof,
            verifiable: true,
            verificationUrl: `vantus.io/verify/${proof[entryIndex].hash.substring(0, 12)}`,
        };
    }

    /**
     * Log detection event with chain integrity
     */
    async logDetection(detection) {
        return this.addEntry({
            category: detection.category,
            confidence: detection.confidence,
            officerName: detection.officerName,
            location: detection.location,
            metadata: detection.metadata,
        }, 'DETECTION');
    }

    /**
     * Log dispatch event with chain integrity
     */
    async logDispatch(dispatch) {
        return this.addEntry({
            dispatchType: dispatch.type,
            officerName: dispatch.officerName,
            location: dispatch.location,
            trigger: dispatch.trigger,
            cadReference: dispatch.cadReference,
        }, 'DISPATCH');
    }

    /**
     * Log session event with chain integrity
     */
    async logSession(sessionEvent) {
        return this.addEntry({
            eventType: sessionEvent.type,
            sessionId: sessionEvent.sessionId,
            officerName: sessionEvent.officerName,
            metadata: sessionEvent.metadata,
        }, 'SESSION');
    }
}

module.exports = new ChainHashService();
