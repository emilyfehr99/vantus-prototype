/**
 * Location Intelligence Service
 * Provides location type classification and route analysis
 * All analysis is non-diagnostic and provides contextual indicators only
 */

const logger = require('../utils/logger');
const geocodingService = require('./geocodingService');

class LocationIntelligence {
  constructor() {
    this.locationTypeCache = new Map();
    this.routeHistory = new Map(); // officerName -> route history
  }

  /**
   * Classify location type from coordinates
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {Object} options - Options
   * @returns {Promise<Object>} Location classification
   */
  async classifyLocationType(lat, lng, options = {}) {
    if (!lat || !lng) {
      return {
        detected: false,
        category: 'location_type',
        confidence: 0,
        locationType: null,
        address: null,
        description: 'Invalid coordinates',
        model: 'geocoding',
        source: 'geocoding',
      };
    }

    try {
      // Get address from geocoding service
      const address = await geocodingService.reverseGeocode(lat, lng);
      
      // Classify location type from address
      const locationType = this.classifyFromAddress(address);
      
      return {
        detected: locationType !== null,
        category: 'location_type',
        confidence: locationType ? 0.7 : 0.2,
        locationType,
        address: address || null,
        description: locationType ? `Location classified as ${locationType}` : 'Location type unknown',
        model: 'geocoding',
        source: 'geocoding',
      };
    } catch (error) {
      logger.error('Location classification error', error);
      return {
        detected: false,
        category: 'location_type',
        confidence: 0,
        locationType: null,
        address: null,
        model: 'geocoding',
        source: 'geocoding',
        error: error.message,
      };
    }
  }

  /**
   * Classify location type from address string
   */
  classifyFromAddress(address) {
    if (!address) return null;
    
    const lowerAddress = address.toLowerCase();
    
    // Residential indicators
    if (lowerAddress.match(/\b(street|avenue|road|drive|lane|way|court|place|boulevard)\b/i) &&
        (lowerAddress.match(/\b(house|home|residential|apartment|condo)\b/i) || 
         !lowerAddress.match(/\b(business|commercial|industrial|mall|plaza|center)\b/i))) {
      return 'residential';
    }
    
    // Commercial indicators
    if (lowerAddress.match(/\b(store|shop|mall|plaza|center|market|restaurant|retail|commercial)\b/i)) {
      return 'commercial';
    }
    
    // Industrial indicators
    if (lowerAddress.match(/\b(industrial|factory|warehouse|plant|facility|manufacturing)\b/i)) {
      return 'industrial';
    }
    
    // Public space indicators
    if (lowerAddress.match(/\b(park|school|hospital|library|government|public|community|recreation)\b/i)) {
      return 'public';
    }
    
    // Highway/road indicators
    if (lowerAddress.match(/\b(highway|freeway|interstate|route|parkway)\b/i)) {
      return 'highway';
    }
    
    return null;
  }

  /**
   * Analyze route deviation
   * @param {string} officerName - Officer name
   * @param {Array} currentRoute - Current GPS positions
   * @param {Array} plannedRoute - Planned route (optional)
   * @param {Object} options - Options
   * @returns {Object} Route deviation analysis
   */
  analyzeRouteDeviation(officerName, currentRoute, plannedRoute = null, options = {}) {
    if (!currentRoute || currentRoute.length < 2) {
      return {
        detected: false,
        category: 'route_deviation',
        confidence: 0,
        deviationDistance: 0,
        deviationDuration: 0,
        description: 'Insufficient route data',
        model: 'local',
        source: 'local',
      };
    }

    try {
      // If no planned route, compare to historical patterns
      if (!plannedRoute) {
        const historicalRoute = this.routeHistory.get(officerName);
        if (historicalRoute) {
          return this.compareToHistorical(currentRoute, historicalRoute, options);
        }
        return {
          detected: false,
          category: 'route_deviation',
          confidence: 0,
          deviationDistance: 0,
          deviationDuration: 0,
          description: 'No historical route data for comparison',
          model: 'local',
          source: 'local',
        };
      }

      // Compare to planned route
      return this.compareToPlanned(currentRoute, plannedRoute, options);
    } catch (error) {
      logger.error('Route deviation analysis error', error);
      return {
        detected: false,
        category: 'route_deviation',
        confidence: 0,
        deviationDistance: 0,
        deviationDuration: 0,
        model: 'local',
        source: 'local',
        error: error.message,
      };
    }
  }

  /**
   * Compare current route to planned route
   */
  compareToPlanned(currentRoute, plannedRoute, options) {
    // Calculate average distance from planned route
    let totalDeviation = 0;
    let deviationCount = 0;
    
    for (const currentPos of currentRoute) {
      let minDistance = Infinity;
      for (const plannedPos of plannedRoute) {
        const distance = this.calculateDistance(
          currentPos.lat,
          currentPos.lng,
          plannedPos.lat,
          plannedPos.lng
        );
        minDistance = Math.min(minDistance, distance);
      }
      if (minDistance < Infinity) {
        totalDeviation += minDistance;
        deviationCount++;
      }
    }
    
    const avgDeviation = deviationCount > 0 ? totalDeviation / deviationCount : 0;
    const threshold = options.deviationThreshold || 100; // meters
    
    return {
      detected: avgDeviation > threshold,
      category: 'route_deviation',
      confidence: avgDeviation > threshold ? Math.min(0.8, 0.3 + (avgDeviation / threshold) * 0.1) : 0.2,
      deviationDistance: avgDeviation,
      deviationDuration: currentRoute.length * 5, // Assuming 5 seconds per point
      description: avgDeviation > threshold 
        ? `Route deviation detected: ${avgDeviation.toFixed(0)}m average distance from planned route`
        : 'Route follows planned path',
      model: 'local',
      source: 'local',
    };
  }

  /**
   * Compare current route to historical patterns
   */
  compareToHistorical(currentRoute, historicalRoute, options) {
    // Simplified: compare general direction and area
    const currentArea = this.getRouteArea(currentRoute);
    const historicalArea = this.getRouteArea(historicalRoute);
    
    const areaOverlap = this.calculateAreaOverlap(currentArea, historicalArea);
    const threshold = options.overlapThreshold || 0.5; // 50% overlap
    
    return {
      detected: areaOverlap < threshold,
      category: 'route_deviation',
      confidence: areaOverlap < threshold ? Math.min(0.7, 0.3 + (1 - areaOverlap) * 0.4) : 0.2,
      deviationDistance: 0, // Not calculated for historical comparison
      deviationDuration: currentRoute.length * 5,
      description: areaOverlap < threshold
        ? `Route differs from historical patterns (${(areaOverlap * 100).toFixed(0)}% overlap)`
        : 'Route matches historical patterns',
      model: 'local',
      source: 'local',
    };
  }

  /**
   * Get bounding area of route
   */
  getRouteArea(route) {
    if (!route || route.length === 0) return null;
    
    const lats = route.map(p => p.lat);
    const lngs = route.map(p => p.lng);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    };
  }

  /**
   * Calculate area overlap (simplified)
   */
  calculateAreaOverlap(area1, area2) {
    if (!area1 || !area2) return 0;
    
    const overlapLat = Math.max(0, Math.min(area1.maxLat, area2.maxLat) - Math.max(area1.minLat, area2.minLat));
    const overlapLng = Math.max(0, Math.min(area1.maxLng, area2.maxLng) - Math.max(area1.minLng, area2.minLng));
    
    const area1Size = (area1.maxLat - area1.minLat) * (area1.maxLng - area1.minLng);
    const area2Size = (area2.maxLat - area2.minLat) * (area2.maxLng - area2.minLng);
    const overlapSize = overlapLat * overlapLng;
    
    return overlapSize / Math.max(area1Size, area2Size);
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
   * Update route history for officer
   */
  updateRouteHistory(officerName, route) {
    if (!this.routeHistory.has(officerName)) {
      this.routeHistory.set(officerName, []);
    }
    
    const history = this.routeHistory.get(officerName);
    history.push(...route);
    
    // Keep last 100 positions
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
  }
}

module.exports = new LocationIntelligence();
