/**
 * CAD SERVICE
 * Interface for Computer-Aided Dispatch (CAD) system integration
 * 
 * This is a stub implementation that will be replaced with actual API calls
 * when the CAD system API is available.
 */

const logger = require('../utils/logger');

class CADService {
  constructor() {
    this.apiUrl = null; // Will be set from config
    this.apiKey = null; // Will be set from environment variables
    this.enabled = false; // Disabled until configured
  }

  /**
   * Initialize the service with API configuration
   * @param {string} apiUrl - CAD API URL
   * @param {string} apiKey - API key for authentication
   */
  initialize(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.enabled = !!apiUrl && !!apiKey;
    
    if (this.enabled) {
      logger.info('CAD Service initialized and enabled');
    } else {
      logger.warn('CAD Service initialized but not enabled (missing API URL or key)');
    }
  }

  /**
   * Send dispatch payload to CAD system
   * @param {Object} dispatchPayload - Dispatch payload object
   * @returns {Promise<Object>} CAD system response
   * 
   * Expected dispatch payload:
   * {
   *   type: "EMERGENCY_BACKUP",
   *   timestamp: "2025-01-08T14:32:45Z",
   *   officer: { id, name, unit },
   *   location: { lat, lng, accuracy, address },
   *   situation: { threat_type, confidence, biometric_state, heart_rate, duration_seconds },
   *   context: { call_type, original_cad_id, time_on_scene }
   * }
   */
  async dispatchBackup(dispatchPayload) {
    if (!this.enabled) {
      logger.warn('CAD Service not enabled - dispatch not sent');
      return { success: false, error: 'CAD service not configured' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/dispatch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dispatchPayload),
      });

      if (!response.ok) {
        throw new Error(`CAD API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      logger.info('CAD dispatch successful', { data });
      return { success: true, data };
    } catch (error) {
      logger.error('CAD dispatch error', error);
      
      // Retry logic could be added here
      return { success: false, error: error.message };
    }
  }

  /**
   * Get dispatch status from CAD system
   * @param {string} dispatchId - CAD dispatch ID
   * @returns {Promise<Object>} Dispatch status
   */
  async getDispatchStatus(dispatchId) {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/dispatch/${dispatchId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`CAD API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('Get dispatch status error', error);
      return null;
    }
  }

  /**
   * Check if CAD service is enabled and configured
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
const cadService = new CADService();
module.exports = cadService;
