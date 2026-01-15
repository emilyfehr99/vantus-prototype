/**
 * Session Manager Service
 * Handles secure session tokens, expiration, and renewal
 * Uses secure storage for token persistence
 */

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { SECURITY_CONFIG, isSessionExpired } from '../utils/securityConfig';
import logger from '../utils/logger';

class SessionManager {
    constructor() {
        this.currentSession = null;
        this.activityTimer = null;
    }

    /**
     * Generate a secure random session token
     * @returns {Promise<string>}
     */
    async generateToken() {
        const tokenLength = SECURITY_CONFIG.session.tokenLength;
        const randomBytes = await Crypto.getRandomBytesAsync(tokenLength);
        return Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Create a new session for an authenticated officer
     * @param {string} badgeNumber - Officer badge number
     * @param {string} role - Officer role (officer, supervisor, admin)
     * @param {Object} metadata - Additional session metadata
     * @returns {Promise<Object>} Session data
     */
    async createSession(badgeNumber, role = 'officer', metadata = {}) {
        try {
            const token = await this.generateToken();
            const now = new Date();

            const session = {
                token,
                badgeNumber,
                role,
                createdAt: now.toISOString(),
                lastActivity: now.toISOString(),
                renewalCount: 0,
                metadata: {
                    ...metadata,
                    deviceId: metadata.deviceId || 'unknown',
                    platform: metadata.platform || 'unknown',
                },
            };

            // Store session in secure storage
            await SecureStore.setItemAsync(
                SECURITY_CONFIG.storageKeys.sessionToken,
                JSON.stringify(session)
            );

            this.currentSession = session;

            // Start activity tracking
            this.startActivityTracking();

            logger.info('Session created', {
                badgeNumber,
                role,
                sessionId: token.substring(0, 8) + '...',
            });

            return {
                success: true,
                session: {
                    ...session,
                    token: undefined, // Don't return full token
                    tokenPrefix: token.substring(0, 8),
                },
            };
        } catch (error) {
            logger.error('Failed to create session', error);
            return {
                success: false,
                error: 'Failed to create session',
            };
        }
    }

    /**
     * Get the current session
     * @returns {Promise<Object|null>}
     */
    async getCurrentSession() {
        // Return cached session if available
        if (this.currentSession) {
            const expiry = isSessionExpired(
                this.currentSession.createdAt,
                this.currentSession.lastActivity
            );

            if (expiry.expired) {
                await this.destroySession(expiry.reason);
                return null;
            }

            return this.currentSession;
        }

        // Try to load from secure storage
        try {
            const stored = await SecureStore.getItemAsync(
                SECURITY_CONFIG.storageKeys.sessionToken
            );

            if (stored) {
                const session = JSON.parse(stored);

                const expiry = isSessionExpired(
                    session.createdAt,
                    session.lastActivity
                );

                if (expiry.expired) {
                    await this.destroySession(expiry.reason);
                    return null;
                }

                this.currentSession = session;
                this.startActivityTracking();
                return session;
            }
        } catch (error) {
            logger.error('Failed to retrieve session', error);
        }

        return null;
    }

    /**
     * Validate a session token
     * @param {string} token - Session token to validate
     * @returns {Promise<{valid: boolean, session?: Object, error?: string}>}
     */
    async validateSession(token) {
        const session = await this.getCurrentSession();

        if (!session) {
            return { valid: false, error: 'No active session' };
        }

        if (session.token !== token) {
            logger.warn('Invalid session token attempted', {
                providedPrefix: token?.substring(0, 8),
                expectedPrefix: session.token?.substring(0, 8),
            });
            return { valid: false, error: 'Invalid session token' };
        }

        return { valid: true, session };
    }

    /**
     * Update the last activity timestamp
     * @returns {Promise<void>}
     */
    async updateActivity() {
        if (!this.currentSession) {
            return;
        }

        this.currentSession.lastActivity = new Date().toISOString();

        try {
            await SecureStore.setItemAsync(
                SECURITY_CONFIG.storageKeys.sessionToken,
                JSON.stringify(this.currentSession)
            );
        } catch (error) {
            logger.error('Failed to update session activity', error);
        }
    }

    /**
     * Renew the session (extends expiration)
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async renewSession() {
        const session = await this.getCurrentSession();

        if (!session) {
            return { success: false, error: 'No active session to renew' };
        }

        const maxRenewals = SECURITY_CONFIG.session.maxRenewals;
        if (session.renewalCount >= maxRenewals) {
            await this.destroySession('Maximum renewals exceeded');
            return { success: false, error: 'Maximum session renewals exceeded. Please re-authenticate.' };
        }

        session.renewalCount += 1;
        session.lastActivity = new Date().toISOString();

        // Generate new token for security
        session.token = await this.generateToken();

        try {
            await SecureStore.setItemAsync(
                SECURITY_CONFIG.storageKeys.sessionToken,
                JSON.stringify(session)
            );

            this.currentSession = session;

            logger.info('Session renewed', {
                badgeNumber: session.badgeNumber,
                renewalCount: session.renewalCount,
            });

            return { success: true };
        } catch (error) {
            logger.error('Failed to renew session', error);
            return { success: false, error: 'Failed to renew session' };
        }
    }

    /**
     * Destroy the current session (logout)
     * @param {string} reason - Reason for session destruction
     * @returns {Promise<void>}
     */
    async destroySession(reason = 'user_logout') {
        const session = this.currentSession;

        this.stopActivityTracking();
        this.currentSession = null;

        try {
            await SecureStore.deleteItemAsync(SECURITY_CONFIG.storageKeys.sessionToken);

            logger.info('Session destroyed', {
                badgeNumber: session?.badgeNumber,
                reason,
            });
        } catch (error) {
            logger.error('Failed to destroy session', error);
        }
    }

    /**
     * Start tracking user activity for inactivity timeout
     */
    startActivityTracking() {
        this.stopActivityTracking();

        const inactivityMs = SECURITY_CONFIG.session.inactivityTimeoutMinutes * 60 * 1000;

        this.activityTimer = setInterval(async () => {
            const session = this.currentSession;
            if (session) {
                const expiry = isSessionExpired(session.createdAt, session.lastActivity);
                if (expiry.expired) {
                    await this.destroySession(expiry.reason);
                }
            }
        }, 60000); // Check every minute
    }

    /**
     * Stop activity tracking
     */
    stopActivityTracking() {
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
    }

    /**
     * Check if user has a specific permission
     * @param {string} permission - Permission to check
     * @returns {Promise<boolean>}
     */
    async hasPermission(permission) {
        const session = await this.getCurrentSession();
        if (!session) {
            return false;
        }

        const { hasPermission: checkPerm } = require('../utils/securityConfig');
        return checkPerm(session.role, permission);
    }

    /**
     * Get session status for display
     * @returns {Promise<Object>}
     */
    async getSessionStatus() {
        const session = await this.getCurrentSession();

        if (!session) {
            return { active: false };
        }

        const createdAt = new Date(session.createdAt);
        const lastActivity = new Date(session.lastActivity);
        const now = new Date();

        const sessionAgeMinutes = Math.floor((now - createdAt) / (1000 * 60));
        const inactiveMinutes = Math.floor((now - lastActivity) / (1000 * 60));
        const remainingSessionMinutes = (SECURITY_CONFIG.session.sessionTimeoutHours * 60) - sessionAgeMinutes;
        const remainingInactivityMinutes = SECURITY_CONFIG.session.inactivityTimeoutMinutes - inactiveMinutes;

        return {
            active: true,
            badgeNumber: session.badgeNumber,
            role: session.role,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
            renewalCount: session.renewalCount,
            sessionAgeMinutes,
            inactiveMinutes,
            remainingSessionMinutes: Math.max(0, remainingSessionMinutes),
            remainingInactivityMinutes: Math.max(0, remainingInactivityMinutes),
        };
    }
}

// Export singleton instance
export default new SessionManager();
