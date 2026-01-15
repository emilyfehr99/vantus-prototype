/**
 * Audit & Compliance Layer
 * Immutable, time-stamped, exportable logging with security events
 * Includes tamper detection with checksums
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Security event types
const SECURITY_EVENTS = {
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  RATE_LIMIT_TRIGGERED: 'RATE_LIMIT_TRIGGERED',
  SESSION_CREATED: 'SESSION_CREATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_RENEWED: 'SESSION_RENEWED',
  SESSION_DESTROYED: 'SESSION_DESTROYED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ADMIN_ACCESS: 'ADMIN_ACCESS',
  DATA_EXPORT: 'DATA_EXPORT',
  SECURITY_CONFIG_CHANGE: 'SECURITY_CONFIG_CHANGE',
};

class AuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.securityLogDir = path.join(__dirname, '../logs/security');
    this.ensureLogDirectory();
    this.lastChecksum = null;
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    if (!fs.existsSync(this.securityLogDir)) {
      fs.mkdirSync(this.securityLogDir, { recursive: true });
    }
  }

  /**
   * Log an immutable audit entry
   */
  log(entry) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      ...entry,
      immutable: true, // Mark as immutable
    };

    // Write to daily log file
    const dateStr = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.logDir, `audit_${dateStr}.jsonl`);

    // Append to log file (JSON Lines format)
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

    // Also log to console for development
    logger.info(`[AUDIT] ${entry.eventType || 'UNKNOWN'}`);

    return logEntry;
  }

  /**
   * Log connection event
   */
  logConnection(clientId, clientType, metadata = {}) {
    return this.log({
      eventType: 'CONNECTION',
      clientId,
      clientType, // 'mobile' | 'dashboard' | 'admin'
      action: 'connected',
      ...metadata,
    });
  }

  /**
   * Log disconnection event
   */
  logDisconnection(clientId, clientType, metadata = {}) {
    return this.log({
      eventType: 'DISCONNECTION',
      clientId,
      clientType,
      action: 'disconnected',
      ...metadata,
    });
  }

  /**
   * Log session start
   */
  logSessionStart(sessionData) {
    return this.log({
      eventType: 'SESSION_START',
      ...sessionData,
    });
  }

  /**
   * Log session end
   */
  logSessionEnd(sessionData) {
    return this.log({
      eventType: 'SESSION_END',
      ...sessionData,
    });
  }

  /**
   * Log contextual signals
   */
  logContextualSignals(signalData) {
    return this.log({
      eventType: 'CONTEXTUAL_SIGNALS',
      ...signalData,
    });
  }

  /**
   * Log marker event
   */
  logMarkerEvent(markerData) {
    return this.log({
      eventType: 'MARKER_EVENT',
      ...markerData,
    });
  }

  /**
   * Log telemetry data
   */
  logTelemetry(telemetryData) {
    return this.log({
      eventType: 'TELEMETRY',
      ...telemetryData,
    });
  }

  /**
   * Log dashboard interaction
   */
  logDashboardInteraction(interaction) {
    return this.log({
      eventType: 'DASHBOARD_INTERACTION',
      ...interaction,
    });
  }

  /**
   * Log admin action
   */
  logAdminAction(action) {
    return this.log({
      eventType: 'ADMIN_ACTION',
      ...action,
    });
  }

  /**
   * Export audit logs for a date range
   */
  exportLogs(startDate, endDate) {
    const logs = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `audit_${dateStr}.jsonl`);

      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        lines.forEach(line => {
          try {
            logs.push(JSON.parse(line));
          } catch (e) {
            logger.error('Error parsing log line', e);
          }
        });
      }
    }

    return logs;
  }

  /**
   * Get audit summary for compliance reports
   */
  getAuditSummary(startDate, endDate) {
    const logs = this.exportLogs(startDate, endDate);

    const summary = {
      totalEvents: logs.length,
      eventTypes: {},
      sessions: {
        started: 0,
        ended: 0,
      },
      signals: {
        total: 0,
        byCategory: {},
      },
      connections: {
        mobile: 0,
        dashboard: 0,
        admin: 0,
      },
      timeRange: {
        start: startDate,
        end: endDate,
      },
    };

    logs.forEach(log => {
      // Count event types
      summary.eventTypes[log.eventType] = (summary.eventTypes[log.eventType] || 0) + 1;

      // Count sessions
      if (log.eventType === 'SESSION_START') summary.sessions.started++;
      if (log.eventType === 'SESSION_END') summary.sessions.ended++;

      // Count signals
      if (log.eventType === 'CONTEXTUAL_SIGNALS' && log.signals) {
        summary.signals.total += log.signals.length;
        log.signals.forEach(signal => {
          const category = signal.signalCategory || 'unknown';
          summary.signals.byCategory[category] = (summary.signals.byCategory[category] || 0) + 1;
        });
      }

      // Count connections
      if (log.eventType === 'CONNECTION' && log.clientType) {
        summary.connections[log.clientType] = (summary.connections[log.clientType] || 0) + 1;
      }
    });

    return summary;
  }

  // ============================================
  // SECURITY EVENT LOGGING
  // ============================================

  /**
   * Generate checksum for tamper detection
   * @param {Object} entry - Log entry
   * @returns {string}
   */
  generateChecksum(entry) {
    const content = JSON.stringify(entry) + (this.lastChecksum || '');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Log a security event (with tamper detection)
   * @param {string} eventType - Security event type
   * @param {Object} data - Event data
   */
  logSecurityEvent(eventType, data) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      eventType,
      ...data,
      immutable: true,
      securityEvent: true,
    };

    // Add checksum for tamper detection
    entry.checksum = this.generateChecksum(entry);
    this.lastChecksum = entry.checksum;

    // Write to security log file
    const dateStr = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.securityLogDir, `security_${dateStr}.jsonl`);

    fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');

    // Critical events also go to main log
    const criticalEvents = [
      SECURITY_EVENTS.AUTH_FAILURE,
      SECURITY_EVENTS.RATE_LIMIT_TRIGGERED,
      SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
      SECURITY_EVENTS.ADMIN_ACCESS,
    ];

    if (criticalEvents.includes(eventType)) {
      logger.warn(`[SECURITY] ${eventType}`, data);
    } else {
      logger.info(`[SECURITY] ${eventType}`);
    }

    return entry;
  }

  /**
   * Log successful authentication
   */
  logAuthSuccess(badgeNumber, metadata = {}) {
    return this.logSecurityEvent(SECURITY_EVENTS.AUTH_SUCCESS, {
      badgeNumber,
      action: 'login',
      ...metadata,
    });
  }

  /**
   * Log failed authentication
   */
  logAuthFailure(badgeNumber, reason, metadata = {}) {
    return this.logSecurityEvent(SECURITY_EVENTS.AUTH_FAILURE, {
      badgeNumber,
      reason,
      action: 'login_failed',
      ...metadata,
    });
  }

  /**
   * Log rate limit triggered
   */
  logRateLimitTriggered(badgeNumber, attemptCount, lockoutDuration) {
    return this.logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_TRIGGERED, {
      badgeNumber,
      attemptCount,
      lockoutDuration,
      action: 'account_locked',
    });
  }

  /**
   * Log session created
   */
  logSessionCreated(badgeNumber, sessionId, metadata = {}) {
    return this.logSecurityEvent(SECURITY_EVENTS.SESSION_CREATED, {
      badgeNumber,
      sessionId,
      action: 'session_start',
      ...metadata,
    });
  }

  /**
   * Log session expired
   */
  logSessionExpired(badgeNumber, sessionId, reason) {
    return this.logSecurityEvent(SECURITY_EVENTS.SESSION_EXPIRED, {
      badgeNumber,
      sessionId,
      reason,
      action: 'session_expired',
    });
  }

  /**
   * Log session renewed
   */
  logSessionRenewed(badgeNumber, sessionId, renewalCount) {
    return this.logSecurityEvent(SECURITY_EVENTS.SESSION_RENEWED, {
      badgeNumber,
      sessionId,
      renewalCount,
      action: 'session_renewed',
    });
  }

  /**
   * Log session destroyed (logout)
   */
  logSessionDestroyed(badgeNumber, sessionId, reason) {
    return this.logSecurityEvent(SECURITY_EVENTS.SESSION_DESTROYED, {
      badgeNumber,
      sessionId,
      reason,
      action: 'session_end',
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(description, metadata = {}) {
    return this.logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
      description,
      severity: 'high',
      action: 'suspicious_activity_detected',
      ...metadata,
    });
  }

  /**
   * Log permission denied
   */
  logPermissionDenied(badgeNumber, permission, resource) {
    return this.logSecurityEvent(SECURITY_EVENTS.PERMISSION_DENIED, {
      badgeNumber,
      permission,
      resource,
      action: 'access_denied',
    });
  }

  /**
   * Log admin access
   */
  logAdminAccess(adminId, action, target) {
    return this.logSecurityEvent(SECURITY_EVENTS.ADMIN_ACCESS, {
      adminId,
      action,
      target,
    });
  }

  /**
   * Log data export
   */
  logDataExport(userId, exportType, recordCount, metadata = {}) {
    return this.logSecurityEvent(SECURITY_EVENTS.DATA_EXPORT, {
      userId,
      exportType,
      recordCount,
      action: 'data_exported',
      ...metadata,
    });
  }

  /**
   * Verify log integrity (check for tampering)
   * @param {string} date - Date to verify (YYYY-MM-DD)
   * @returns {{valid: boolean, errors: string[]}}
   */
  verifyLogIntegrity(date) {
    const logFile = path.join(this.securityLogDir, `security_${date}.jsonl`);
    const errors = [];

    if (!fs.existsSync(logFile)) {
      return { valid: false, errors: ['Log file not found'] };
    }

    try {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());

      let previousChecksum = null;

      for (let i = 0; i < lines.length; i++) {
        const entry = JSON.parse(lines[i]);
        const storedChecksum = entry.checksum;

        // Recalculate checksum
        const entryWithoutChecksum = { ...entry };
        delete entryWithoutChecksum.checksum;

        const expectedContent = JSON.stringify(entryWithoutChecksum) + (previousChecksum || '');
        const expectedChecksum = crypto.createHash('sha256')
          .update(expectedContent)
          .digest('hex')
          .substring(0, 16);

        if (storedChecksum !== expectedChecksum) {
          errors.push(`Line ${i + 1}: Checksum mismatch (possible tampering)`);
        }

        previousChecksum = storedChecksum;
      }

      return {
        valid: errors.length === 0,
        errors,
        linesVerified: lines.length,
      };
    } catch (error) {
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * Get security audit summary
   */
  getSecuritySummary(startDate, endDate) {
    const summary = {
      authSuccess: 0,
      authFailure: 0,
      rateLimitTriggered: 0,
      sessionsCreated: 0,
      sessionsExpired: 0,
      suspiciousActivity: 0,
      permissionDenied: 0,
      adminAccess: 0,
      dataExports: 0,
    };

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const logFile = path.join(this.securityLogDir, `security_${dateStr}.jsonl`);

      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());

        lines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            switch (entry.eventType) {
              case SECURITY_EVENTS.AUTH_SUCCESS:
                summary.authSuccess++;
                break;
              case SECURITY_EVENTS.AUTH_FAILURE:
                summary.authFailure++;
                break;
              case SECURITY_EVENTS.RATE_LIMIT_TRIGGERED:
                summary.rateLimitTriggered++;
                break;
              case SECURITY_EVENTS.SESSION_CREATED:
                summary.sessionsCreated++;
                break;
              case SECURITY_EVENTS.SESSION_EXPIRED:
                summary.sessionsExpired++;
                break;
              case SECURITY_EVENTS.SUSPICIOUS_ACTIVITY:
                summary.suspiciousActivity++;
                break;
              case SECURITY_EVENTS.PERMISSION_DENIED:
                summary.permissionDenied++;
                break;
              case SECURITY_EVENTS.ADMIN_ACCESS:
                summary.adminAccess++;
                break;
              case SECURITY_EVENTS.DATA_EXPORT:
                summary.dataExports++;
                break;
            }
          } catch (e) {
            // Skip malformed lines
          }
        });
      }
    }

    return summary;
  }
}

// Export the instance and security event types
const auditLogger = new AuditLogger();
module.exports = auditLogger;
module.exports.SECURITY_EVENTS = SECURITY_EVENTS;
