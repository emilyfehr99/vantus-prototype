/**
 * Security Configuration
 * Centralized security settings and policies for Vantus
 */

import logger from './logger';

// Security configuration constants
export const SECURITY_CONFIG = {
    // Authentication settings
    authentication: {
        // Maximum login attempts before lockout
        maxLoginAttempts: 5,
        // Lockout duration in minutes (exponential backoff applied)
        baseLockoutMinutes: 15,
        // PIN requirements
        minPinLength: 4,
        maxPinLength: 8,
        // Biometric authentication timeout (ms)
        biometricTimeout: 30000,
    },

    // Session settings
    session: {
        // Session timeout in hours (typical shift length)
        sessionTimeoutHours: 8,
        // Inactivity timeout in minutes
        inactivityTimeoutMinutes: 30,
        // Session token length (bytes, converted to hex = 2x length)
        tokenLength: 32,
        // Enable session renewal on activity
        autoRenew: true,
        // Maximum session renewals before requiring re-authentication
        maxRenewals: 3,
    },

    // Rate limiting settings
    rateLimiting: {
        // Requests per minute per badge number
        authAttemptsPerMinute: 10,
        // Requests per minute per IP (API endpoints)
        apiRequestsPerMinute: 100,
        // Enable exponential backoff for failed attempts
        exponentialBackoff: true,
        // Backoff multiplier
        backoffMultiplier: 2,
    },

    // Encryption settings
    encryption: {
        // Algorithm for data at rest
        algorithm: 'AES-256-GCM',
        // Key derivation iterations (PBKDF2)
        keyDerivationIterations: 100000,
        // Salt length (bytes)
        saltLength: 16,
        // IV length (bytes)
        ivLength: 12,
        // Auth tag length (bytes)
        authTagLength: 16,
    },

    // Audit settings
    audit: {
        // Enable security event logging
        logSecurityEvents: true,
        // Enable tamper detection (checksums)
        tamperDetection: true,
        // Log retention days
        retentionDays: 365,
        // Events to always log
        criticalEvents: [
            'AUTH_FAILURE',
            'RATE_LIMIT_TRIGGERED',
            'SUSPICIOUS_ACTIVITY',
            'SESSION_HIJACK_ATTEMPT',
            'ADMIN_ACCESS',
            'DATA_EXPORT',
        ],
    },

    // Role-based access control
    rbac: {
        roles: ['officer', 'supervisor', 'admin'],
        defaultRole: 'officer',
        permissions: {
            officer: [
                'view_own_data',
                'start_session',
                'end_session',
                'create_marker',
                'request_welfare_check',
            ],
            supervisor: [
                'view_own_data',
                'view_all_officers',
                'veto_dispatch',
                'view_live_feed',
                'generate_reports',
                'flag_signals',
            ],
            admin: [
                'view_own_data',
                'view_all_officers',
                'veto_dispatch',
                'view_live_feed',
                'generate_reports',
                'flag_signals',
                'configure_system',
                'manage_users',
                'view_audit_logs',
                'export_data',
            ],
        },
    },

    // Secure storage keys (prefixes for secure storage)
    storageKeys: {
        sessionToken: 'vantus_session_token',
        encryptionKey: 'vantus_encryption_key',
        pinHash: 'vantus_pin_hash',
        lastActivity: 'vantus_last_activity',
        loginAttempts: 'vantus_login_attempts',
    },
};

/**
 * Check if a role has a specific permission
 * @param {string} role - Role name
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
    const rolePermissions = SECURITY_CONFIG.rbac.permissions[role];
    if (!rolePermissions) {
        logger.warn('Unknown role requested', { role });
        return false;
    }
    return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a role
 * @param {string} role - Role name
 * @returns {string[]}
 */
export function getRolePermissions(role) {
    return SECURITY_CONFIG.rbac.permissions[role] || [];
}

/**
 * Validate PIN format
 * @param {string} pin - PIN to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validatePinFormat(pin) {
    if (!pin || typeof pin !== 'string') {
        return { valid: false, error: 'PIN is required' };
    }

    if (pin.length < SECURITY_CONFIG.authentication.minPinLength) {
        return {
            valid: false,
            error: `PIN must be at least ${SECURITY_CONFIG.authentication.minPinLength} digits`
        };
    }

    if (pin.length > SECURITY_CONFIG.authentication.maxPinLength) {
        return {
            valid: false,
            error: `PIN must be at most ${SECURITY_CONFIG.authentication.maxPinLength} digits`
        };
    }

    if (!/^\d+$/.test(pin)) {
        return { valid: false, error: 'PIN must contain only digits' };
    }

    // Check for common weak PINs
    const weakPins = ['0000', '1111', '1234', '4321', '0123', '9999'];
    if (weakPins.includes(pin)) {
        return { valid: false, error: 'PIN is too common. Please choose a stronger PIN' };
    }

    return { valid: true };
}

/**
 * Calculate lockout duration with exponential backoff
 * @param {number} attempts - Number of failed attempts
 * @returns {number} Lockout duration in milliseconds
 */
export function calculateLockoutDuration(attempts) {
    const baseMinutes = SECURITY_CONFIG.authentication.baseLockoutMinutes;
    const multiplier = SECURITY_CONFIG.rateLimiting.backoffMultiplier;

    // Exponential backoff: base * 2^(attempts - maxAttempts)
    const exponent = Math.max(0, attempts - SECURITY_CONFIG.authentication.maxLoginAttempts);
    const minutes = baseMinutes * Math.pow(multiplier, exponent);

    // Cap at 24 hours
    const cappedMinutes = Math.min(minutes, 24 * 60);

    return cappedMinutes * 60 * 1000; // Convert to milliseconds
}

/**
 * Check if session is expired
 * @param {Date} sessionStart - Session start time
 * @param {Date} lastActivity - Last activity time
 * @returns {{expired: boolean, reason?: string}}
 */
export function isSessionExpired(sessionStart, lastActivity) {
    const now = new Date();
    const sessionStartTime = new Date(sessionStart);
    const lastActivityTime = new Date(lastActivity);

    // Check absolute session timeout
    const sessionAgeHours = (now - sessionStartTime) / (1000 * 60 * 60);
    if (sessionAgeHours >= SECURITY_CONFIG.session.sessionTimeoutHours) {
        return { expired: true, reason: 'Session timeout (shift length exceeded)' };
    }

    // Check inactivity timeout
    const inactivityMinutes = (now - lastActivityTime) / (1000 * 60);
    if (inactivityMinutes >= SECURITY_CONFIG.session.inactivityTimeoutMinutes) {
        return { expired: true, reason: 'Inactivity timeout' };
    }

    return { expired: false };
}

export default SECURITY_CONFIG;
