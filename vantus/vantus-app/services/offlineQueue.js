/**
 * Offline Queue Service
 * SQLite-based local storage for offline operation and sync
 */

import * as SQLite from 'expo-sqlite';
import logger from '../utils/logger';

const DB_NAME = 'vantus_offline.db';
const QUEUE_TABLE = 'offline_queue';
const BASELINE_TABLE = 'baselines';
const SESSION_TABLE = 'sessions';

class OfflineQueueService {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    /**
     * Initialize the SQLite database
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.db = await SQLite.openDatabaseAsync(DB_NAME);

            // Create tables
            await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${QUEUE_TABLE} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          payload TEXT NOT NULL,
          priority INTEGER DEFAULT 0,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          created_at TEXT NOT NULL,
          scheduled_for TEXT,
          status TEXT DEFAULT 'pending',
          last_error TEXT,
          synced_at TEXT
        );

        CREATE TABLE IF NOT EXISTS ${BASELINE_TABLE} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          officer_id TEXT NOT NULL UNIQUE,
          baseline_data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          version INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS ${SESSION_TABLE} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id TEXT NOT NULL UNIQUE,
          officer_id TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          telemetry_data TEXT,
          marker_events TEXT,
          audio_transcripts TEXT,
          status TEXT DEFAULT 'active',
          synced INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_queue_status ON ${QUEUE_TABLE}(status);
        CREATE INDEX IF NOT EXISTS idx_queue_priority ON ${QUEUE_TABLE}(priority DESC, created_at ASC);
        CREATE INDEX IF NOT EXISTS idx_session_officer ON ${SESSION_TABLE}(officer_id);
      `);

            this.initialized = true;
            logger.info('Offline queue service initialized');
        } catch (error) {
            logger.error('Failed to initialize offline queue', error);
            throw error;
        }
    }

    /**
     * Add event to offline queue
     * @param {string} eventType - Type of event (e.g., 'SIGNAL', 'DETECTION', 'DISPATCH')
     * @param {Object} payload - Event payload
     * @param {number} priority - Priority (higher = more important)
     */
    async enqueue(eventType, payload, priority = 0) {
        await this.initialize();

        const now = new Date().toISOString();

        try {
            const result = await this.db.runAsync(
                `INSERT INTO ${QUEUE_TABLE} (event_type, payload, priority, created_at, status) VALUES (?, ?, ?, ?, ?)`,
                [eventType, JSON.stringify(payload), priority, now, 'pending']
            );

            logger.debug('Event queued', { id: result.lastInsertRowId, eventType, priority });

            return result.lastInsertRowId;
        } catch (error) {
            logger.error('Failed to enqueue event', error);
            throw error;
        }
    }

    /**
     * Get pending events from queue
     * @param {number} limit - Max events to retrieve
     */
    async getPendingEvents(limit = 50) {
        await this.initialize();

        try {
            const events = await this.db.getAllAsync(
                `SELECT * FROM ${QUEUE_TABLE} 
         WHERE status = 'pending' AND retry_count < max_retries
         ORDER BY priority DESC, created_at ASC
         LIMIT ?`,
                [limit]
            );

            return events.map(event => ({
                ...event,
                payload: JSON.parse(event.payload),
            }));
        } catch (error) {
            logger.error('Failed to get pending events', error);
            return [];
        }
    }

    /**
     * Mark event as synced
     * @param {number} eventId - Event ID
     */
    async markSynced(eventId) {
        await this.initialize();

        try {
            await this.db.runAsync(
                `UPDATE ${QUEUE_TABLE} SET status = 'synced', synced_at = ? WHERE id = ?`,
                [new Date().toISOString(), eventId]
            );
        } catch (error) {
            logger.error('Failed to mark event as synced', error);
        }
    }

    /**
     * Mark event as failed
     * @param {number} eventId - Event ID
     * @param {string} error - Error message
     */
    async markFailed(eventId, error) {
        await this.initialize();

        try {
            await this.db.runAsync(
                `UPDATE ${QUEUE_TABLE} 
         SET status = CASE WHEN retry_count + 1 >= max_retries THEN 'failed' ELSE 'pending' END,
             retry_count = retry_count + 1,
             last_error = ?
         WHERE id = ?`,
                [error, eventId]
            );
        } catch (error) {
            logger.error('Failed to mark event as failed', error);
        }
    }

    /**
     * Process and sync pending events
     * @param {Function} syncFunction - Function to sync each event
     */
    async syncPendingEvents(syncFunction) {
        const events = await this.getPendingEvents();
        let synced = 0;
        let failed = 0;

        for (const event of events) {
            try {
                await syncFunction(event.event_type, event.payload);
                await this.markSynced(event.id);
                synced++;
            } catch (error) {
                await this.markFailed(event.id, error.message);
                failed++;
            }
        }

        logger.info('Sync complete', { synced, failed, total: events.length });

        return { synced, failed, total: events.length };
    }

    /**
     * Get queue statistics
     */
    async getStats() {
        await this.initialize();

        try {
            const stats = await this.db.getFirstAsync(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'synced' THEN 1 ELSE 0 END) as synced,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM ${QUEUE_TABLE}
      `);

            return stats;
        } catch (error) {
            logger.error('Failed to get queue stats', error);
            return { total: 0, pending: 0, synced: 0, failed: 0 };
        }
    }

    /**
     * Clean up old synced events
     * @param {number} olderThanDays - Delete synced events older than this many days
     */
    async cleanup(olderThanDays = 7) {
        await this.initialize();

        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - olderThanDays);

            const result = await this.db.runAsync(
                `DELETE FROM ${QUEUE_TABLE} WHERE status = 'synced' AND synced_at < ?`,
                [cutoff.toISOString()]
            );

            logger.info('Queue cleanup complete', { deleted: result.changes });

            return result.changes;
        } catch (error) {
            logger.error('Failed to cleanup queue', error);
            return 0;
        }
    }

    // ==================== BASELINE STORAGE ====================

    /**
     * Save officer baseline data
     */
    async saveBaseline(officerId, baselineData) {
        await this.initialize();

        const now = new Date().toISOString();

        try {
            await this.db.runAsync(
                `INSERT INTO ${BASELINE_TABLE} (officer_id, baseline_data, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(officer_id) DO UPDATE SET 
           baseline_data = excluded.baseline_data,
           updated_at = excluded.updated_at,
           version = version + 1`,
                [officerId, JSON.stringify(baselineData), now, now]
            );

            logger.info('Baseline saved', { officerId });
        } catch (error) {
            logger.error('Failed to save baseline', error);
            throw error;
        }
    }

    /**
     * Get officer baseline data
     */
    async getBaseline(officerId) {
        await this.initialize();

        try {
            const baseline = await this.db.getFirstAsync(
                `SELECT * FROM ${BASELINE_TABLE} WHERE officer_id = ?`,
                [officerId]
            );

            if (baseline) {
                return {
                    ...baseline,
                    baseline_data: JSON.parse(baseline.baseline_data),
                };
            }

            return null;
        } catch (error) {
            logger.error('Failed to get baseline', error);
            return null;
        }
    }

    // ==================== SESSION STORAGE ====================

    /**
     * Save session data locally
     */
    async saveSession(sessionData) {
        await this.initialize();

        try {
            await this.db.runAsync(
                `INSERT INTO ${SESSION_TABLE} 
         (session_id, officer_id, start_time, end_time, telemetry_data, marker_events, audio_transcripts, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(session_id) DO UPDATE SET
           end_time = excluded.end_time,
           telemetry_data = excluded.telemetry_data,
           marker_events = excluded.marker_events,
           audio_transcripts = excluded.audio_transcripts,
           status = excluded.status`,
                [
                    sessionData.sessionId,
                    sessionData.officerId,
                    sessionData.startTime,
                    sessionData.endTime || null,
                    JSON.stringify(sessionData.telemetryData || []),
                    JSON.stringify(sessionData.markerEvents || []),
                    JSON.stringify(sessionData.audioTranscripts || []),
                    sessionData.status || 'active',
                ]
            );

            logger.debug('Session saved locally', { sessionId: sessionData.sessionId });
        } catch (error) {
            logger.error('Failed to save session', error);
            throw error;
        }
    }

    /**
     * Get local session data
     */
    async getSession(sessionId) {
        await this.initialize();

        try {
            const session = await this.db.getFirstAsync(
                `SELECT * FROM ${SESSION_TABLE} WHERE session_id = ?`,
                [sessionId]
            );

            if (session) {
                return {
                    ...session,
                    telemetry_data: JSON.parse(session.telemetry_data || '[]'),
                    marker_events: JSON.parse(session.marker_events || '[]'),
                    audio_transcripts: JSON.parse(session.audio_transcripts || '[]'),
                };
            }

            return null;
        } catch (error) {
            logger.error('Failed to get session', error);
            return null;
        }
    }

    /**
     * Get unsynced sessions
     */
    async getUnsyncedSessions() {
        await this.initialize();

        try {
            const sessions = await this.db.getAllAsync(
                `SELECT * FROM ${SESSION_TABLE} WHERE synced = 0 AND status = 'completed'`
            );

            return sessions.map(session => ({
                ...session,
                telemetry_data: JSON.parse(session.telemetry_data || '[]'),
                marker_events: JSON.parse(session.marker_events || '[]'),
                audio_transcripts: JSON.parse(session.audio_transcripts || '[]'),
            }));
        } catch (error) {
            logger.error('Failed to get unsynced sessions', error);
            return [];
        }
    }

    /**
     * Mark session as synced
     */
    async markSessionSynced(sessionId) {
        await this.initialize();

        try {
            await this.db.runAsync(
                `UPDATE ${SESSION_TABLE} SET synced = 1 WHERE session_id = ?`,
                [sessionId]
            );
        } catch (error) {
            logger.error('Failed to mark session synced', error);
        }
    }
}

export default new OfflineQueueService();
