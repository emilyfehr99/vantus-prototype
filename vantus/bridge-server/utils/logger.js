/**
 * LOGGING SERVICE (Node.js)
 * Centralized logging with levels and structured output
 * Replaces console.log statements throughout the bridge-server
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
function setLogLevel(level) {
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
function getLogLevel() {
  const entries = Object.entries(LOG_LEVELS);
  const entry = entries.find(([_, value]) => value === currentLogLevel);
  return entry ? entry[0].toLowerCase() : 'info';
}

/**
 * Get timestamp string
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Log debug message
 * @param {string} message - Log message
 * @param {Object} data - Additional data (optional)
 */
function debug(message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.DEBUG) {
    const output = data ? { message, data } : message;
    console.debug(`[${getTimestamp()}] [DEBUG]`, output);
  }
}

/**
 * Log info message
 * @param {string} message - Log message
 * @param {Object} data - Additional data (optional)
 */
function info(message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.INFO) {
    const output = data ? { message, data } : message;
    console.log(`[${getTimestamp()}] [INFO]`, output);
  }
}

/**
 * Log warning message
 * @param {string} message - Log message
 * @param {Object} data - Additional data (optional)
 */
function warn(message, data = null) {
  if (currentLogLevel <= LOG_LEVELS.WARN) {
    const output = data ? { message, data } : message;
    console.warn(`[${getTimestamp()}] [WARN]`, output);
  }
}

/**
 * Log error message
 * @param {string} message - Log message
 * @param {Error|Object} error - Error object or additional data
 */
function error(message, error = null) {
  if (currentLogLevel <= LOG_LEVELS.ERROR) {
    if (error instanceof Error) {
      console.error(`[${getTimestamp()}] [ERROR]`, message, error.message, error.stack);
    } else if (error) {
      console.error(`[${getTimestamp()}] [ERROR]`, message, error);
    } else {
      console.error(`[${getTimestamp()}] [ERROR]`, message);
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
function logWithContext(service, level, message, data = null) {
  const timestamp = getTimestamp();
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

// Export logger instance
const logger = {
  debug,
  info,
  warn,
  error,
  logWithContext,
  setLogLevel,
  getLogLevel,
  getTimestamp, // Export for use in other files
};

module.exports = logger;
