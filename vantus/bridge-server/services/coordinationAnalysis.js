/**
 * Coordination Analysis Service
 * Analyzes multi-officer coordination patterns
 * All analysis is non-diagnostic and provides contextual indicators only
 */

const logger = require('../utils/logger');

class CoordinationAnalysis {
  constructor() {
    this.officerPositions = new Map(); // officerName -> { lat, lng, timestamp }
    this.backupRequests = new Map(); // officerName -> [{ timestamp, location, ... }]
  }

  /**
   * Analyze officer proximity
   * @param {string} officerName - Officer name
   * @param {number} lat - Current latitude
   * @param {number} lng - Current longitude
   * @param {Array} otherOfficers - Array of { name, lat, lng, timestamp }
   * @param {Object} options - Options
   * @returns {Object} Proximity analysis
   */
  analyzeOfficerProximity(officerName, lat, lng, otherOfficers = [], options = {}) {
    if (!lat || !lng || !otherOfficers || otherOfficers.length === 0) {
      return {
        detected: false,
        category: 'officer_proximity',
        confidence: 0,
        nearbyOfficers: [],
        proximityDistance: 0,
        pattern: null,
        description: 'No other officers in range',
        model: 'local',
        source: 'local',
      };
    }

    try {
      const proximityThreshold = options.proximityThreshold || 50; // meters
      const nearbyOfficers = [];
      
      for (const other of otherOfficers) {
        if (other.name === officerName) continue;
        if (!other.lat || !other.lng) continue;
        
        const distance = this.calculateDistance(lat, lng, other.lat, other.lng);
        if (distance <= proximityThreshold) {
          nearbyOfficers.push({
            name: other.name,
            distance: distance,
            timestamp: other.timestamp || new Date().toISOString(),
          });
        }
      }
      
      // Detect patterns
      let pattern = null;
      if (nearbyOfficers.length >= 3) {
        pattern = 'tactical_formation';
      } else if (nearbyOfficers.length === 2) {
        pattern = 'pair_coordination';
      } else if (nearbyOfficers.length === 1) {
        pattern = 'backup_present';
      }
      
      // Update position history
      this.officerPositions.set(officerName, { lat, lng, timestamp: new Date().toISOString() });
      
      return {
        detected: nearbyOfficers.length > 0,
        category: 'officer_proximity',
        confidence: nearbyOfficers.length > 0 ? Math.min(0.8, 0.4 + nearbyOfficers.length * 0.1) : 0.2,
        nearbyOfficers: nearbyOfficers.map(o => o.name),
        proximityDistance: nearbyOfficers.length > 0 
          ? Math.min(...nearbyOfficers.map(o => o.distance))
          : 0,
        pattern,
        description: nearbyOfficers.length > 0
          ? `${nearbyOfficers.length} officer(s) within ${proximityThreshold}m (${pattern || 'proximity'})`
          : 'No officers in proximity',
        model: 'local',
        source: 'local',
      };
    } catch (error) {
      logger.error('Officer proximity analysis error', error);
      return {
        detected: false,
        category: 'officer_proximity',
        confidence: 0,
        nearbyOfficers: [],
        proximityDistance: 0,
        pattern: null,
        model: 'local',
        source: 'local',
        error: error.message,
      };
    }
  }

  /**
   * Analyze backup request patterns
   * @param {string} officerName - Officer name
   * @param {Object} requestData - Request data { timestamp, location, type }
   * @param {Object} options - Options
   * @returns {Object} Backup pattern analysis
   */
  analyzeBackupPatterns(officerName, requestData, options = {}) {
    if (!requestData) {
      return {
        detected: false,
        category: 'backup_pattern',
        confidence: 0,
        requestCount: 0,
        frequency: null,
        responseTime: null,
        description: 'No backup request data',
        model: 'local',
        source: 'local',
      };
    }

    try {
      // Get request history
      if (!this.backupRequests.has(officerName)) {
        this.backupRequests.set(officerName, []);
      }
      
      const requests = this.backupRequests.get(officerName);
      requests.push({
        ...requestData,
        timestamp: requestData.timestamp || new Date().toISOString(),
      });
      
      // Keep last 20 requests
      if (requests.length > 20) {
        requests.splice(0, requests.length - 20);
      }
      
      // Analyze patterns
      const recentRequests = requests.slice(-10); // Last 10 requests
      const timeWindow = options.timeWindow || 300; // 5 minutes
      const now = new Date();
      
      // Count requests in time window
      const recentCount = recentRequests.filter(req => {
        const reqTime = new Date(req.timestamp);
        return (now - reqTime) / 1000 <= timeWindow;
      }).length;
      
      // Calculate frequency
      let frequency = null;
      if (recentCount >= 3) {
        frequency = 'high';
      } else if (recentCount >= 2) {
        frequency = 'moderate';
      } else if (recentCount === 1) {
        frequency = 'low';
      }
      
      // Calculate average response time (if available)
      let avgResponseTime = null;
      const requestsWithResponse = recentRequests.filter(req => req.responseTime);
      if (requestsWithResponse.length > 0) {
        avgResponseTime = requestsWithResponse.reduce((sum, req) => sum + req.responseTime, 0) / requestsWithResponse.length;
      }
      
      return {
        detected: recentCount > 0,
        category: 'backup_pattern',
        confidence: recentCount > 0 ? Math.min(0.8, 0.3 + recentCount * 0.1) : 0.2,
        requestCount: recentCount,
        frequency,
        responseTime: avgResponseTime,
        description: recentCount > 0
          ? `${recentCount} backup request(s) in last ${timeWindow}s (${frequency} frequency)`
          : 'No recent backup requests',
        model: 'local',
        source: 'local',
      };
    } catch (error) {
      logger.error('Backup pattern analysis error', error);
      return {
        detected: false,
        category: 'backup_pattern',
        confidence: 0,
        requestCount: 0,
        frequency: null,
        responseTime: null,
        model: 'local',
        source: 'local',
        error: error.message,
      };
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get all officer positions
   */
  getAllOfficerPositions() {
    return Array.from(this.officerPositions.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }
}

module.exports = new CoordinationAnalysis();
