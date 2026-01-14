/**
 * ERROR CODES & CONSTANTS
 * Centralized error codes for consistent error handling across the application
 */

// Error Categories
export const ERROR_CATEGORIES = {
  AUTHENTICATION: 'AUTHENTICATION',
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  CONFIGURATION: 'CONFIGURATION',
  MODEL: 'MODEL',
  DATABASE: 'DATABASE',
  PERMISSION: 'PERMISSION',
  SYSTEM: 'SYSTEM',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE',
};

// Authentication Errors
export const AUTH_ERRORS = {
  INVALID_BADGE: 'AUTH_001',
  INVALID_PIN: 'AUTH_002',
  ACCOUNT_LOCKED: 'AUTH_003',
  BIOMETRIC_FAILED: 'AUTH_004',
  SESSION_EXPIRED: 'AUTH_005',
  UNAUTHORIZED: 'AUTH_006',
};

// Network Errors
export const NETWORK_ERRORS = {
  CONNECTION_FAILED: 'NET_001',
  TIMEOUT: 'NET_002',
  SERVER_ERROR: 'NET_003',
  BRIDGE_DISCONNECTED: 'NET_004',
  API_ERROR: 'NET_005',
};

// Validation Errors
export const VALIDATION_ERRORS = {
  INVALID_GPS: 'VAL_001',
  INVALID_TIMESTAMP: 'VAL_002',
  INVALID_OFFICER_ID: 'VAL_003',
  INVALID_SESSION_ID: 'VAL_004',
  MISSING_REQUIRED_FIELD: 'VAL_005',
  INVALID_DATA_TYPE: 'VAL_006',
  OUT_OF_RANGE: 'VAL_007',
};

// Configuration Errors
export const CONFIG_ERRORS = {
  MISSING_CONFIG: 'CFG_001',
  INVALID_CONFIG: 'CFG_002',
  CONFIG_NOT_LOADED: 'CFG_003',
  ENV_VAR_MISSING: 'CFG_004',
};

// Model Errors
export const MODEL_ERRORS = {
  MODEL_NOT_LOADED: 'MOD_001',
  MODEL_LOAD_FAILED: 'MOD_002',
  INFERENCE_FAILED: 'MOD_003',
  MODEL_NOT_READY: 'MOD_004',
  INVALID_MODEL_PATH: 'MOD_005',
};

// Database Errors
export const DATABASE_ERRORS = {
  CONNECTION_FAILED: 'DB_001',
  QUERY_FAILED: 'DB_002',
  TRANSACTION_FAILED: 'DB_003',
  MIGRATION_FAILED: 'DB_004',
  DATA_NOT_FOUND: 'DB_005',
};

// Permission Errors
export const PERMISSION_ERRORS = {
  LOCATION_DENIED: 'PERM_001',
  CAMERA_DENIED: 'PERM_002',
  MICROPHONE_DENIED: 'PERM_003',
  STORAGE_DENIED: 'PERM_004',
  NOTIFICATIONS_DENIED: 'PERM_005',
};

// System Errors
export const SYSTEM_ERRORS = {
  UNKNOWN_ERROR: 'SYS_001',
  OUT_OF_MEMORY: 'SYS_002',
  FILE_SYSTEM_ERROR: 'SYS_003',
  CRYPTO_ERROR: 'SYS_004',
  INITIALIZATION_FAILED: 'SYS_005',
};

// External Service Errors
export const EXTERNAL_SERVICE_ERRORS = {
  ROSTER_API_ERROR: 'EXT_001',
  CAD_API_ERROR: 'EXT_002',
  GEOCODING_API_ERROR: 'EXT_003',
  WEARABLE_API_ERROR: 'EXT_004',
};

/**
 * Create standardized error object
 * @param {string} code - Error code (e.g., AUTH_001)
 * @param {string} message - Human-readable error message
 * @param {string} category - Error category
 * @param {Error} originalError - Original error object (optional)
 * @param {Object} context - Additional context data (optional)
 * @returns {Object} Standardized error object
 */
export function createError(code, message, category, originalError = null, context = {}) {
  return {
    code,
    message,
    category,
    timestamp: new Date().toISOString(),
    originalError: originalError ? {
      message: originalError.message,
      stack: originalError.stack,
      name: originalError.name,
    } : null,
    context,
  };
}

/**
 * Get error message for error code
 * @param {string} code - Error code
 * @returns {string} Human-readable error message
 */
export function getErrorMessage(code) {
  const errorMessages = {
    // Authentication
    [AUTH_ERRORS.INVALID_BADGE]: 'Invalid badge number',
    [AUTH_ERRORS.INVALID_PIN]: 'Invalid PIN',
    [AUTH_ERRORS.ACCOUNT_LOCKED]: 'Account is locked. Please contact administrator',
    [AUTH_ERRORS.BIOMETRIC_FAILED]: 'Biometric authentication failed',
    [AUTH_ERRORS.SESSION_EXPIRED]: 'Session has expired. Please log in again',
    [AUTH_ERRORS.UNAUTHORIZED]: 'Unauthorized access',
    
    // Network
    [NETWORK_ERRORS.CONNECTION_FAILED]: 'Failed to connect to server',
    [NETWORK_ERRORS.TIMEOUT]: 'Request timed out',
    [NETWORK_ERRORS.SERVER_ERROR]: 'Server error occurred',
    [NETWORK_ERRORS.BRIDGE_DISCONNECTED]: 'Lost connection to bridge server',
    [NETWORK_ERRORS.API_ERROR]: 'API request failed',
    
    // Validation
    [VALIDATION_ERRORS.INVALID_GPS]: 'Invalid GPS coordinates',
    [VALIDATION_ERRORS.INVALID_TIMESTAMP]: 'Invalid timestamp',
    [VALIDATION_ERRORS.INVALID_OFFICER_ID]: 'Invalid officer ID format',
    [VALIDATION_ERRORS.INVALID_SESSION_ID]: 'Invalid session ID',
    [VALIDATION_ERRORS.MISSING_REQUIRED_FIELD]: 'Missing required field',
    [VALIDATION_ERRORS.INVALID_DATA_TYPE]: 'Invalid data type',
    [VALIDATION_ERRORS.OUT_OF_RANGE]: 'Value out of valid range',
    
    // Configuration
    [CONFIG_ERRORS.MISSING_CONFIG]: 'Configuration is missing',
    [CONFIG_ERRORS.INVALID_CONFIG]: 'Invalid configuration',
    [CONFIG_ERRORS.CONFIG_NOT_LOADED]: 'Configuration not loaded',
    [CONFIG_ERRORS.ENV_VAR_MISSING]: 'Required environment variable is missing',
    
    // Model
    [MODEL_ERRORS.MODEL_NOT_LOADED]: 'Model is not loaded',
    [MODEL_ERRORS.MODEL_LOAD_FAILED]: 'Failed to load model',
    [MODEL_ERRORS.INFERENCE_FAILED]: 'Model inference failed',
    [MODEL_ERRORS.MODEL_NOT_READY]: 'Model is not ready',
    [MODEL_ERRORS.INVALID_MODEL_PATH]: 'Invalid model path',
    
    // Database
    [DATABASE_ERRORS.CONNECTION_FAILED]: 'Database connection failed',
    [DATABASE_ERRORS.QUERY_FAILED]: 'Database query failed',
    [DATABASE_ERRORS.TRANSACTION_FAILED]: 'Database transaction failed',
    [DATABASE_ERRORS.MIGRATION_FAILED]: 'Database migration failed',
    [DATABASE_ERRORS.DATA_NOT_FOUND]: 'Data not found',
    
    // Permission
    [PERMISSION_ERRORS.LOCATION_DENIED]: 'Location permission denied',
    [PERMISSION_ERRORS.CAMERA_DENIED]: 'Camera permission denied',
    [PERMISSION_ERRORS.MICROPHONE_DENIED]: 'Microphone permission denied',
    [PERMISSION_ERRORS.STORAGE_DENIED]: 'Storage permission denied',
    [PERMISSION_ERRORS.NOTIFICATIONS_DENIED]: 'Notification permission denied',
    
    // System
    [SYSTEM_ERRORS.UNKNOWN_ERROR]: 'An unknown error occurred',
    [SYSTEM_ERRORS.OUT_OF_MEMORY]: 'Out of memory',
    [SYSTEM_ERRORS.FILE_SYSTEM_ERROR]: 'File system error',
    [SYSTEM_ERRORS.CRYPTO_ERROR]: 'Cryptography error',
    [SYSTEM_ERRORS.INITIALIZATION_FAILED]: 'Initialization failed',
    
    // External Service
    [EXTERNAL_SERVICE_ERRORS.ROSTER_API_ERROR]: 'Roster API error',
    [EXTERNAL_SERVICE_ERRORS.CAD_API_ERROR]: 'CAD API error',
    [EXTERNAL_SERVICE_ERRORS.GEOCODING_API_ERROR]: 'Geocoding API error',
    [EXTERNAL_SERVICE_ERRORS.WEARABLE_API_ERROR]: 'Wearable API error',
  };
  
  return errorMessages[code] || `Unknown error: ${code}`;
}

/**
 * Check if error is recoverable
 * @param {string} code - Error code
 * @returns {boolean} True if error is recoverable
 */
export function isRecoverableError(code) {
  const recoverableCodes = [
    NETWORK_ERRORS.CONNECTION_FAILED,
    NETWORK_ERRORS.TIMEOUT,
    NETWORK_ERRORS.BRIDGE_DISCONNECTED,
    DATABASE_ERRORS.CONNECTION_FAILED,
    EXTERNAL_SERVICE_ERRORS.ROSTER_API_ERROR,
    EXTERNAL_SERVICE_ERRORS.CAD_API_ERROR,
    EXTERNAL_SERVICE_ERRORS.GEOCODING_API_ERROR,
  ];
  
  return recoverableCodes.includes(code);
}

/**
 * Get error severity level
 * @param {string} code - Error code
 * @returns {string} Severity level: 'low' | 'medium' | 'high' | 'critical'
 */
export function getErrorSeverity(code) {
  const criticalCodes = [
    AUTH_ERRORS.ACCOUNT_LOCKED,
    SYSTEM_ERRORS.OUT_OF_MEMORY,
    SYSTEM_ERRORS.INITIALIZATION_FAILED,
    DATABASE_ERRORS.CONNECTION_FAILED,
  ];
  
  const highCodes = [
    AUTH_ERRORS.UNAUTHORIZED,
    NETWORK_ERRORS.SERVER_ERROR,
    MODEL_ERRORS.MODEL_LOAD_FAILED,
    DATABASE_ERRORS.QUERY_FAILED,
  ];
  
  if (criticalCodes.includes(code)) return 'critical';
  if (highCodes.includes(code)) return 'high';
  if (code.startsWith('NET_') || code.startsWith('EXT_')) return 'medium';
  return 'low';
}
