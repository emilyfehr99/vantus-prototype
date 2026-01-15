/**
 * Rate Limiter Middleware for Express
 * Server-side protection against brute-force attacks
 */

const logger = require('../utils/logger');
const auditLogger = require('./auditLogger');

// In-memory store for rate limiting
// In production, use Redis for distributed rate limiting
const rateLimitStore = new Map();

// Configuration
const RATE_LIMIT_CONFIG = {
    // Auth endpoints
    auth: {
        windowMs: 60 * 1000, // 1 minute
        maxAttempts: 10,
        blockDuration: 15 * 60 * 1000, // 15 minutes
    },
    // General API endpoints
    api: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
    },
    // Sensitive endpoints (data export, config change)
    sensitive: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
    },
};

/**
 * Get client identifier from request
 * @param {Object} req - Express request
 * @returns {string}
 */
function getClientId(req) {
    // Use badge number if authenticated, otherwise IP
    if (req.user && req.user.badgeNumber) {
        return `user:${req.user.badgeNumber}`;
    }

    // Get IP address (handle proxies)
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    return `ip:${ip}`;
}

/**
 * Get or create rate limit entry
 * @param {string} key - Rate limit key
 * @param {number} windowMs - Time window in ms
 * @returns {Object}
 */
function getRateLimitEntry(key, windowMs) {
    const now = Date.now();
    let entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
        entry = {
            windowStart: now,
            count: 0,
            blockedUntil: entry?.blockedUntil || null,
        };
        rateLimitStore.set(key, entry);
    }

    return entry;
}

/**
 * Rate limiter for authentication endpoints
 * @returns {Function} Express middleware
 */
function authRateLimiter() {
    const config = RATE_LIMIT_CONFIG.auth;

    return (req, res, next) => {
        const clientId = getClientId(req);
        const key = `auth:${clientId}`;
        const entry = getRateLimitEntry(key, config.windowMs);
        const now = Date.now();

        // Check if blocked
        if (entry.blockedUntil && now < entry.blockedUntil) {
            const remainingMs = entry.blockedUntil - now;
            const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

            // Log the attempt
            auditLogger.logRateLimitTriggered(
                req.body?.badgeNumber || clientId,
                entry.count,
                remainingMs
            );

            logger.warn('Rate limit: blocked request', {
                clientId,
                endpoint: req.path,
                remainingMinutes,
            });

            return res.status(429).json({
                error: 'Too many requests',
                code: 'RATE_LIMITED',
                blockedFor: remainingMinutes,
                message: `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`,
            });
        }

        // Clear block if expired
        if (entry.blockedUntil && now >= entry.blockedUntil) {
            entry.blockedUntil = null;
            entry.count = 0;
            entry.windowStart = now;
        }

        // Increment count
        entry.count++;
        rateLimitStore.set(key, entry);

        // Check if should block
        if (entry.count > config.maxAttempts) {
            entry.blockedUntil = now + config.blockDuration;
            rateLimitStore.set(key, entry);

            const blockMinutes = Math.ceil(config.blockDuration / (1000 * 60));

            auditLogger.logRateLimitTriggered(
                req.body?.badgeNumber || clientId,
                entry.count,
                config.blockDuration
            );

            logger.warn('Rate limit: blocking client', {
                clientId,
                endpoint: req.path,
                attemptCount: entry.count,
                blockMinutes,
            });

            return res.status(429).json({
                error: 'Too many requests',
                code: 'RATE_LIMITED',
                blockedFor: blockMinutes,
                message: `Too many failed attempts. Please try again in ${blockMinutes} minutes.`,
            });
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxAttempts);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxAttempts - entry.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil((entry.windowStart + config.windowMs) / 1000));

        next();
    };
}

/**
 * General API rate limiter
 * @returns {Function} Express middleware
 */
function apiRateLimiter() {
    const config = RATE_LIMIT_CONFIG.api;

    return (req, res, next) => {
        const clientId = getClientId(req);
        const key = `api:${clientId}`;
        const entry = getRateLimitEntry(key, config.windowMs);

        entry.count++;
        rateLimitStore.set(key, entry);

        if (entry.count > config.maxRequests) {
            const resetTime = Math.ceil((entry.windowStart + config.windowMs - Date.now()) / 1000);

            logger.warn('API rate limit exceeded', {
                clientId,
                endpoint: req.path,
                requestCount: entry.count,
            });

            return res.status(429).json({
                error: 'Rate limit exceeded',
                code: 'RATE_LIMITED',
                retryAfter: resetTime,
                message: `Too many requests. Please try again in ${resetTime} seconds.`,
            });
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil((entry.windowStart + config.windowMs) / 1000));

        next();
    };
}

/**
 * Sensitive endpoint rate limiter (stricter limits)
 * @returns {Function} Express middleware
 */
function sensitiveRateLimiter() {
    const config = RATE_LIMIT_CONFIG.sensitive;

    return (req, res, next) => {
        const clientId = getClientId(req);
        const key = `sensitive:${clientId}`;
        const entry = getRateLimitEntry(key, config.windowMs);

        entry.count++;
        rateLimitStore.set(key, entry);

        if (entry.count > config.maxRequests) {
            const resetTime = Math.ceil((entry.windowStart + config.windowMs - Date.now()) / 1000);

            logger.warn('Sensitive endpoint rate limit exceeded', {
                clientId,
                endpoint: req.path,
                requestCount: entry.count,
            });

            // Log to audit for sensitive endpoints
            auditLogger.logSuspiciousActivity('Sensitive endpoint rate limit exceeded', {
                clientId,
                endpoint: req.path,
                requestCount: entry.count,
            });

            return res.status(429).json({
                error: 'Rate limit exceeded',
                code: 'RATE_LIMITED',
                retryAfter: resetTime,
                message: `Too many requests to sensitive endpoint. Please try again in ${resetTime} seconds.`,
            });
        }

        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil((entry.windowStart + config.windowMs) / 1000));

        next();
    };
}

/**
 * Reset rate limit for a client (admin use)
 * @param {string} clientId - Client identifier to reset
 */
function resetRateLimit(clientId) {
    const keysToDelete = [];

    for (const key of rateLimitStore.keys()) {
        if (key.includes(clientId)) {
            keysToDelete.push(key);
        }
    }

    keysToDelete.forEach(key => rateLimitStore.delete(key));

    logger.info('Rate limit reset', { clientId, keysReset: keysToDelete.length });
}

/**
 * Record successful auth (reset auth rate limit)
 * @param {string} clientId - Client identifier
 */
function recordAuthSuccess(clientId) {
    const key = `auth:user:${clientId}`;
    rateLimitStore.delete(key);
}

/**
 * Get rate limit status for a client
 * @param {string} clientId - Client identifier
 * @returns {Object}
 */
function getRateLimitStatus(clientId) {
    const status = {
        auth: null,
        api: null,
        sensitive: null,
    };

    ['auth', 'api', 'sensitive'].forEach(type => {
        const key = `${type}:user:${clientId}`;
        const entry = rateLimitStore.get(key);
        if (entry) {
            const config = RATE_LIMIT_CONFIG[type];
            status[type] = {
                count: entry.count,
                limit: config.maxAttempts || config.maxRequests,
                remaining: Math.max(0, (config.maxAttempts || config.maxRequests) - entry.count),
                blockedUntil: entry.blockedUntil,
                windowReset: entry.windowStart + config.windowMs,
            };
        }
    });

    return status;
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.windowStart > maxAge && (!entry.blockedUntil || now > entry.blockedUntil)) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

module.exports = {
    authRateLimiter,
    apiRateLimiter,
    sensitiveRateLimiter,
    resetRateLimit,
    recordAuthSuccess,
    getRateLimitStatus,
    RATE_LIMIT_CONFIG,
};
