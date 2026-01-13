/**
 * Audit & Compliance Layer
 * Immutable, time-stamped, exportable logging
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
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
    console.log(`[AUDIT] ${timestamp} ${entry.eventType || 'UNKNOWN'}`);

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
            console.error('Error parsing log line:', e);
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
}

module.exports = new AuditLogger();
