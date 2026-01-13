/**
 * GPS & COORDINATE UTILITY FUNCTIONS
 * GPS calculations and coordinate transformations
 */

import { calculateDistance, toRadians } from './mathUtils';

/**
 * Calculate distance between two GPS points
 * @param {Object} point1 - { lat, lng }
 * @param {Object} point2 - { lat, lng }
 * @returns {number} Distance in meters
 */
export function getDistanceBetweenPoints(point1, point2) {
  if (!point1 || !point2 || !point1.lat || !point1.lng || !point2.lat || !point2.lng) {
    return 0;
  }
  return calculateDistance(point1.lat, point1.lng, point2.lat, point2.lng);
}

/**
 * Calculate speed from GPS points
 * @param {Object} point1 - { lat, lng, timestamp }
 * @param {Object} point2 - { lat, lng, timestamp }
 * @returns {number} Speed in m/s
 */
export function calculateSpeedFromGPS(point1, point2) {
  if (!point1 || !point2 || !point1.timestamp || !point2.timestamp) {
    return 0;
  }
  
  const distance = getDistanceBetweenPoints(point1, point2);
  const timeDiff = (new Date(point2.timestamp) - new Date(point1.timestamp)) / 1000; // seconds
  
  if (timeDiff === 0) return 0;
  return distance / timeDiff;
}

/**
 * Calculate heading (bearing) between two GPS points
 * @param {Object} point1 - { lat, lng }
 * @param {Object} point2 - { lat, lng }
 * @returns {number} Heading in degrees (0-360)
 */
export function calculateHeading(point1, point2) {
  if (!point1 || !point2) return 0;
  
  const lat1 = toRadians(point1.lat);
  const lat2 = toRadians(point2.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  const bearing = Math.atan2(y, x);
  const degrees = (bearing * 180 / Math.PI + 360) % 360;
  
  return degrees;
}

/**
 * Check if point is within radius of center point
 * @param {Object} center - { lat, lng }
 * @param {Object} point - { lat, lng }
 * @param {number} radiusMeters - Radius in meters
 * @returns {boolean} True if point is within radius
 */
export function isWithinRadius(center, point, radiusMeters) {
  const distance = getDistanceBetweenPoints(center, point);
  return distance <= radiusMeters;
}

/**
 * Calculate average position from array of GPS points
 * @param {Array<Object>} points - Array of { lat, lng }
 * @returns {Object|null} Average position { lat, lng } or null
 */
export function calculateAveragePosition(points) {
  if (!points || points.length === 0) return null;
  
  const validPoints = points.filter(p => p && p.lat && p.lng);
  if (validPoints.length === 0) return null;
  
  const sumLat = validPoints.reduce((sum, p) => sum + p.lat, 0);
  const sumLng = validPoints.reduce((sum, p) => sum + p.lng, 0);
  
  return {
    lat: sumLat / validPoints.length,
    lng: sumLng / validPoints.length,
  };
}

/**
 * Calculate bounding box from array of GPS points
 * @param {Array<Object>} points - Array of { lat, lng }
 * @returns {Object|null} Bounding box { north, south, east, west } or null
 */
export function calculateBoundingBox(points) {
  if (!points || points.length === 0) return null;
  
  const validPoints = points.filter(p => p && p.lat && p.lng);
  if (validPoints.length === 0) return null;
  
  const lats = validPoints.map(p => p.lat);
  const lngs = validPoints.map(p => p.lng);
  
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}

/**
 * Format GPS coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal places (default: 4)
 * @returns {string} Formatted string
 */
export function formatCoordinates(lat, lng, precision = 4) {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}
