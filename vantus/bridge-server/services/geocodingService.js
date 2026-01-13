/**
 * GEOCODING SERVICE
 * Interface for reverse geocoding (coordinates to address)
 * 
 * This is a stub implementation that will be replaced with actual API calls
 * when the geocoding service is configured.
 */

const logger = require('../utils/logger');

class GeocodingService {
  constructor() {
    this.apiUrl = null; // Will be set from config
    this.apiKey = null; // Will be set from environment variables
    this.cache = new Map(); // Simple in-memory cache
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initialize the service with API configuration
   * @param {string} apiUrl - Geocoding API URL
   * @param {string} apiKey - API key for authentication
   */
  initialize(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  /**
   * Reverse geocode coordinates to address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string|null>} Formatted address or null if not found
   */
  async reverseGeocode(lat, lng) {
    if (!lat || !lng) {
      return null;
    }

    // Check cache first
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.address;
    }

    if (!this.apiUrl) {
      // No geocoding service configured
      return null;
    }

    try {
      let address = null;

      // Try different geocoding services based on configuration
      if (this.apiUrl.includes('googleapis.com')) {
        address = await this._googleGeocode(lat, lng);
      } else if (this.apiUrl.includes('nominatim')) {
        address = await this._nominatimGeocode(lat, lng);
      } else {
        // Generic API call
        address = await this._genericGeocode(lat, lng);
      }

      // Cache the result
      if (address) {
        this.cache.set(cacheKey, {
          address,
          timestamp: Date.now(),
        });
      }

      return address;
    } catch (error) {
      logger.error('Reverse geocoding error', error);
      return null;
    }
  }

  /**
   * Google Maps Geocoding API
   * @private
   */
  async _googleGeocode(lat, lng) {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    return null;
  }

  /**
   * OpenStreetMap Nominatim API
   * @private
   */
  async _nominatimGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VantusApp/1.0',
      },
    });
    const data = await response.json();

    if (data.address) {
      // Format address from components
      const parts = [];
      if (data.address.house_number) parts.push(data.address.house_number);
      if (data.address.road) parts.push(data.address.road);
      if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
      if (data.address.state) parts.push(data.address.state);
      if (data.address.postcode) parts.push(data.address.postcode);
      return parts.join(', ');
    }

    return null;
  }

  /**
   * Generic geocoding API call
   * @private
   */
  async _genericGeocode(lat, lng) {
    const response = await fetch(`${this.apiUrl}?lat=${lat}&lng=${lng}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.address || data.formatted_address || null;
  }

  /**
   * Clear geocoding cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const geocodingService = new GeocodingService();
module.exports = geocodingService;
