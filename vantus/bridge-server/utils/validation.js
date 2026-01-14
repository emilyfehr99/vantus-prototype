/**
 * Validation Utilities
 * Provides data validation functions
 */

const errorHandler = require('./errorHandler');

class Validation {
  /**
   * Validate coordinates
   */
  validateCoordinates(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }
    
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }
    
    if (lng < -180 || lng > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
    
    return true;
  }

  /**
   * Validate officer name
   */
  validateOfficerName(officerName) {
    if (!officerName || typeof officerName !== 'string') {
      throw new Error('Officer name is required and must be a string');
    }
    
    if (officerName.trim().length === 0) {
      throw new Error('Officer name cannot be empty');
    }
    
    return true;
  }

  /**
   * Validate signal data
   */
  validateSignal(signal) {
    if (!signal || typeof signal !== 'object') {
      throw new Error('Signal must be an object');
    }
    
    if (!signal.signalType || !signal.signalCategory) {
      throw new Error('Signal must have signalType and signalCategory');
    }
    
    if (typeof signal.probability !== 'number' || signal.probability < 0 || signal.probability > 1) {
      throw new Error('Signal probability must be a number between 0 and 1');
    }
    
    return true;
  }

  /**
   * Validate timestamp
   */
  validateTimestamp(timestamp) {
    if (!timestamp) {
      throw new Error('Timestamp is required');
    }
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid timestamp format');
    }
    
    return true;
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      return '';
    }
    
    // Remove null bytes and trim
    let sanitized = input.replace(/\0/g, '').trim();
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  }

  /**
   * Validate and sanitize request body
   */
  validateRequestBody(body, schema) {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }
        
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }
        
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} does not match required pattern`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = new Validation();
