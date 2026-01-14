/**
 * Baseline Database Service
 * Replaces in-memory Map() storage with persistent database
 */

const logger = require('../utils/logger');
const { CLIENT_CONFIG } = require('../utils/client-config');

class BaselineDatabase {
  constructor(dbConnection = null) {
    this.db = dbConnection;
    this.useDatabase = dbConnection !== null;
  }

  /**
   * Save baseline to database
   */
  async saveBaseline(officerId, context, metricType, baselineValue, sampleCount = 0) {
    if (!this.useDatabase) {
      logger.warn('Database not configured, baseline not persisted');
      return null;
    }

    try {
      const query = `
        INSERT INTO baselines (officer_id, context, metric_type, baseline_value, sample_count)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (officer_id, context, metric_type) 
        DO UPDATE SET
          baseline_value = EXCLUDED.baseline_value,
          sample_count = EXCLUDED.sample_count,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await this.db.query(query, [
        officerId,
        context,
        metricType,
        JSON.stringify(baselineValue),
        sampleCount,
      ]);

      logger.info('Baseline saved to database', {
        officerId,
        context,
        metricType,
        id: result.rows[0].id,
      });

      return result.rows[0].id;
    } catch (error) {
      logger.error('Error saving baseline to database', error);
      throw error;
    }
  }

  /**
   * Get baseline from database
   */
  async getBaseline(officerId, context, metricType) {
    if (!this.useDatabase) {
      return null;
    }

    try {
      const query = `
        SELECT baseline_value, sample_count, calibration_date
        FROM baselines
        WHERE officer_id = $1 AND context = $2 AND metric_type = $3
        ORDER BY calibration_date DESC
        LIMIT 1
      `;

      const result = await this.db.query(query, [officerId, context, metricType]);

      if (result.rows.length === 0) {
        return null;
      }

      return {
        value: result.rows[0].baseline_value,
        sampleCount: result.rows[0].sample_count,
        calibrationDate: result.rows[0].calibration_date,
      };
    } catch (error) {
      logger.error('Error getting baseline from database', error);
      return null;
    }
  }

  /**
   * Get all baselines for an officer
   */
  async getOfficerBaselines(officerId) {
    if (!this.useDatabase) {
      return [];
    }

    try {
      const query = `
        SELECT context, metric_type, baseline_value, sample_count, calibration_date
        FROM baselines
        WHERE officer_id = $1
        ORDER BY context, metric_type, calibration_date DESC
      `;

      const result = await this.db.query(query, [officerId]);

      return result.rows.map(row => ({
        context: row.context,
        metricType: row.metric_type,
        value: row.baseline_value,
        sampleCount: row.sample_count,
        calibrationDate: row.calibration_date,
      }));
    } catch (error) {
      logger.error('Error getting officer baselines from database', error);
      return [];
    }
  }

  /**
   * Update baseline sample count
   */
  async updateSampleCount(officerId, context, metricType, sampleCount) {
    if (!this.useDatabase) {
      return;
    }

    try {
      const query = `
        UPDATE baselines
        SET sample_count = $1, updated_at = CURRENT_TIMESTAMP
        WHERE officer_id = $2 AND context = $3 AND metric_type = $4
      `;

      await this.db.query(query, [sampleCount, officerId, context, metricType]);
    } catch (error) {
      logger.error('Error updating baseline sample count', error);
    }
  }

  /**
   * Delete old baselines (cleanup)
   */
  async deleteOldBaselines(retentionDays = 365) {
    if (!this.useDatabase) {
      return;
    }

    try {
      const query = `
        DELETE FROM baselines
        WHERE calibration_date < NOW() - INTERVAL '${retentionDays} days'
      `;

      const result = await this.db.query(query);
      logger.info(`Deleted ${result.rowCount} old baselines`);
    } catch (error) {
      logger.error('Error deleting old baselines', error);
    }
  }
}

module.exports = BaselineDatabase;
