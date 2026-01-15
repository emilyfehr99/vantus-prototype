/**
 * Rate Limiter Service
 * Protects against brute-force attacks on authentication
 * Implements exponential backoff for failed login attempts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SECURITY_CONFIG, calculateLockoutDuration } from '../utils/securityConfig';
import logger from '../utils/logger';

// In-memory cache for rate limiting (faster than AsyncStorage)
const attemptCache = new Map();

class RateLimiter {
    constructor() {
        this.storagePrefix = 'vantus_rate_limit_';
    }

    /**
     * Get the storage key for a badge number
     * @param {string} badgeNumber - Officer badge number
     * @returns {string}
     */
    getStorageKey(badgeNumber) {
        return `${this.storagePrefix}${badgeNumber}`;
    }

    /**
     * Get current attempt data for a badge number
     * @param {string} badgeNumber - Officer badge number
     * @returns {Promise<{attempts: number, lastAttempt: Date, lockedUntil: Date|null}>}
     */
    async getAttemptData(badgeNumber) {
        const key = this.getStorageKey(badgeNumber);

        // Check in-memory cache first
        if (attemptCache.has(key)) {
            return attemptCache.get(key);
        }

        try {
            const stored = await AsyncStorage.getItem(key);
            if (stored) {
                const data = JSON.parse(stored);
                data.lastAttempt = new Date(data.lastAttempt);
                data.lockedUntil = data.lockedUntil ? new Date(data.lockedUntil) : null;
                attemptCache.set(key, data);
                return data;
            }
        } catch (error) {
            logger.error('Error reading rate limit data', error);
        }

        const defaultData = {
            attempts: 0,
            lastAttempt: new Date(),
            lockedUntil: null,
        };
        attemptCache.set(key, defaultData);
        return defaultData;
    }

    /**
     * Save attempt data for a badge number
     * @param {string} badgeNumber - Officer badge number
     * @param {Object} data - Attempt data
     */
    async saveAttemptData(badgeNumber, data) {
        const key = this.getStorageKey(badgeNumber);
        attemptCache.set(key, data);

        try {
            await AsyncStorage.setItem(key, JSON.stringify({
                ...data,
                lastAttempt: data.lastAttempt.toISOString(),
                lockedUntil: data.lockedUntil ? data.lockedUntil.toISOString() : null,
            }));
        } catch (error) {
            logger.error('Error saving rate limit data', error);
        }
    }

    /**
     * Check if a badge number is currently locked out
     * @param {string} badgeNumber - Officer badge number
     * @returns {Promise<{locked: boolean, remainingMs?: number, reason?: string}>}
     */
    async isLockedOut(badgeNumber) {
        const data = await this.getAttemptData(badgeNumber);

        if (data.lockedUntil && new Date() < data.lockedUntil) {
            const remainingMs = data.lockedUntil.getTime() - Date.now();
            const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

            return {
                locked: true,
                remainingMs,
                reason: `Account locked. Try again in ${remainingMinutes} minute(s).`,
            };
        }

        // Clear lockout if expired
        if (data.lockedUntil && new Date() >= data.lockedUntil) {
            data.lockedUntil = null;
            data.attempts = 0;
            await this.saveAttemptData(badgeNumber, data);
        }

        return { locked: false };
    }

    /**
     * Record a failed login attempt
     * @param {string} badgeNumber - Officer badge number
     * @returns {Promise<{attemptNumber: number, locked: boolean, lockoutDuration?: number}>}
     */
    async recordFailedAttempt(badgeNumber) {
        const data = await this.getAttemptData(badgeNumber);

        data.attempts += 1;
        data.lastAttempt = new Date();

        const maxAttempts = SECURITY_CONFIG.authentication.maxLoginAttempts;

        // Check if we should lock the account
        if (data.attempts >= maxAttempts) {
            const lockoutDuration = calculateLockoutDuration(data.attempts);
            data.lockedUntil = new Date(Date.now() + lockoutDuration);

            logger.warn('Account locked due to too many failed attempts', {
                badgeNumber,
                attempts: data.attempts,
                lockedUntil: data.lockedUntil.toISOString(),
            });

            await this.saveAttemptData(badgeNumber, data);

            return {
                attemptNumber: data.attempts,
                locked: true,
                lockoutDuration,
                remainingAttempts: 0,
            };
        }

        await this.saveAttemptData(badgeNumber, data);

        return {
            attemptNumber: data.attempts,
            locked: false,
            remainingAttempts: maxAttempts - data.attempts,
        };
    }

    /**
     * Record a successful login (resets attempts)
     * @param {string} badgeNumber - Officer badge number
     */
    async recordSuccessfulLogin(badgeNumber) {
        const data = {
            attempts: 0,
            lastAttempt: new Date(),
            lockedUntil: null,
        };
        await this.saveAttemptData(badgeNumber, data);

        logger.info('Login successful, rate limit reset', { badgeNumber });
    }

    /**
     * Get the number of remaining attempts before lockout
     * @param {string} badgeNumber - Officer badge number
     * @returns {Promise<number>}
     */
    async getRemainingAttempts(badgeNumber) {
        const data = await this.getAttemptData(badgeNumber);
        const maxAttempts = SECURITY_CONFIG.authentication.maxLoginAttempts;
        return Math.max(0, maxAttempts - data.attempts);
    }

    /**
     * Clear rate limit data for a badge number (admin use)
     * @param {string} badgeNumber - Officer badge number
     */
    async clearRateLimit(badgeNumber) {
        const key = this.getStorageKey(badgeNumber);
        attemptCache.delete(key);

        try {
            await AsyncStorage.removeItem(key);
            logger.info('Rate limit cleared by admin', { badgeNumber });
        } catch (error) {
            logger.error('Error clearing rate limit', error);
        }
    }

    /**
     * Get rate limit status for display
     * @param {string} badgeNumber - Officer badge number
     * @returns {Promise<Object>}
     */
    async getStatus(badgeNumber) {
        const data = await this.getAttemptData(badgeNumber);
        const lockoutStatus = await this.isLockedOut(badgeNumber);
        const maxAttempts = SECURITY_CONFIG.authentication.maxLoginAttempts;

        return {
            attempts: data.attempts,
            maxAttempts,
            remainingAttempts: Math.max(0, maxAttempts - data.attempts),
            lastAttempt: data.lastAttempt,
            locked: lockoutStatus.locked,
            lockedUntil: data.lockedUntil,
            remainingMs: lockoutStatus.remainingMs || 0,
        };
    }
}

// Export singleton instance
export default new RateLimiter();
