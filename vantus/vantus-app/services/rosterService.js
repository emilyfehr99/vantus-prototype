/**
 * ROSTER SERVICE
 * Interface for department roster API integration
 * 
 * This is a stub implementation that will be replaced with actual API calls
 * when the department roster API is available.
 */

class RosterService {
  constructor() {
    this.apiUrl = null; // Will be set from config
    this.apiKey = null; // Will be set from environment variables
  }

  /**
   * Initialize the service with API configuration
   * @param {string} apiUrl - Department roster API URL
   * @param {string} apiKey - API key for authentication
   */
  initialize(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Verify officer badge number and PIN
   * @param {string} badgeNumber - Officer badge number
   * @param {string} pin - Officer PIN
   * @returns {Promise<Object>} Officer data if valid, null if invalid
   * 
   * Expected response:
   * {
   *   valid: true,
   *   officer: {
   *     badgeNumber: "12345",
   *     name: "John Doe",
   *     unit: "Patrol-7",
   *     rank: "Officer",
   *     department: "WVPS",
   *     id: "WVPS-12345"
   *   }
   * }
   */
  async verifyOfficer(badgeNumber, pin) {
    if (!this.apiUrl) {
      // Fallback to demo validation if API not configured
      console.warn('Roster API not configured, using demo validation');
      return this._demoVerify(badgeNumber, pin);
    }

    try {
      const response = await fetch(`${this.apiUrl}/officers/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ badgeNumber, pin }),
      });

      if (!response.ok) {
        throw new Error(`Roster API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Roster verification error:', error);
      throw error;
    }
  }

  /**
   * Get officer metadata by badge number
   * @param {string} badgeNumber - Officer badge number
   * @returns {Promise<Object>} Officer metadata
   */
  async getOfficerMetadata(badgeNumber) {
    if (!this.apiUrl) {
      return null;
    }

    try {
      const response = await fetch(`${this.apiUrl}/officers/${badgeNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Roster API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get officer metadata error:', error);
      return null;
    }
  }

  /**
   * Demo verification (fallback when API not available)
   * @private
   */
  _demoVerify(badgeNumber, pin) {
    const DEMO_BADGES = ['12345', '67890', '11111', '22222'];
    
    if (DEMO_BADGES.includes(badgeNumber) && pin && pin.length >= 4) {
      return {
        valid: true,
        officer: {
          badgeNumber: badgeNumber,
          name: null, // Would come from roster
          unit: null, // Would come from roster
          rank: 'Officer',
          department: 'DEMO',
          id: `OFFICER_${badgeNumber}`,
        },
      };
    }
    
    return { valid: false };
  }
}

// Export singleton instance
const rosterService = new RosterService();
export default rosterService;
