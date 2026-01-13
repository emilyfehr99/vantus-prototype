/**
 * LOGGING SERVICE
 * Centralized logging with levels and structured output
 * Replaces console.log statements throughout the codebase
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

let currentLogLevel = LOG_LEVELS.INFO;

/**
 * Set log level
 * @param {string} level - 'debug' | 'info' | 'warn' | 'error' | 'none'
 */
export function setLogLevel(level) {
  const levelMap = {
    debug: LOG_LEVELS.DEBUG,
    info: LOG_LEVELS.INFO,
    warn: LOG_LEVELS.WARN,
    error: LOG_LEVELS.ERROR,
    none: LOG_LEVELS.NONE,
  };
  currentLogLevel = levelMap[level.toLowerCase()] || LOG_LEVELS.INFO;
}

/**
 * Get current log level
 * @returns {string} Current log level name
 */
export function getLogLevel() {
  const entries = Object.entries(LOG_LEVELS);
  const entry = entries.find(([_, value]) => value === currentLogLevel);
  return entry ? entry[0].toLowerCase() : 'info';
}

/**
 * Log debug message
 * @param {string} message - Log message
 * @param {Object} data - Additional data (optional)
 */
export function debug(message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.DEBUG) {
    const output = data ? { message, data } : message;
    console.debug('[DEBUG]', output);
  }
}

/**
 * Log info message
 * @param {string} message - Log message
 * @param {Object} data - Additional data (optional)
 */
export function info(message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.INFO) {
    const output = data ? { message, data } : message;
    console.log('[INFO]', output);
  }
}

/**
 * Log warning message
 * @param {string} message - Log message
 * @param {Object} data - Additional data (optional)
 */
export function warn(message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.WARN) {
    const output = data ? { message, data } : message;
    console.warn('[WARN]', output);
  }
}

/**
 * Log error message
 * @param {string} message - Log message
 * @param {Error|Object} error - Error object or additional data
 */
export function error(message, error = null) {
  if (currentLogLevel <= LOG_LEVELS.ERROR) {
    if (error instanceof Error) {
      console.error('[ERROR]', message, error.message, error.stack);
    } else if (error) {
      console.error('[ERROR]', message, error);
    } else {
      console.error('[ERROR]', message);
    }
  }
}

/**
 * Log with context (for service-specific logging)
 * @param {string} service - Service name
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data (optional)
 */
export function logWithContext(service, level, message, data = null) {
  const timestamp = new Date().toISOString();
  const context = { service, timestamp };
  
  const logData = data ? { ...context, ...data } : context;
  const fullMessage = `[${service}] ${message}`;
  
  switch (level.toLowerCase()) {
    case 'debug':
      debug(fullMessage, logData);
      break;
    case 'info':
      info(fullMessage, logData);
      break;
    case 'warn':
      warn(fullMessage, logData);
      break;
    case 'error':
      error(fullMessage, logData);
      break;
    default:
      info(fullMessage, logData);
  }
}

// Export default logger instance
const logger = {
  debug,
  info,
  warn,
  error,
  logWithContext,
  setLogLevel,
  getLogLevel,
};

export default logger;
