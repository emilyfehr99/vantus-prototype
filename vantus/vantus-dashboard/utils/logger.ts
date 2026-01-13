/**
 * LOGGING SERVICE (TypeScript/Next.js)
 * Centralized logging with levels and structured output
 * Replaces console.log statements throughout the dashboard
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

let currentLogLevel: LogLevel = LogLevel.INFO;

/**
 * Set log level
 */
export function setLogLevel(level: 'debug' | 'info' | 'warn' | 'error' | 'none'): void {
  const levelMap: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
    none: LogLevel.NONE,
  };
  currentLogLevel = levelMap[level.toLowerCase()] || LogLevel.INFO;
}

/**
 * Get current log level
 */
export function getLogLevel(): string {
  const entries = Object.entries(LogLevel);
  const entry = entries.find(([_, value]) => value === currentLogLevel);
  return entry ? entry[0].toLowerCase() : 'info';
}

/**
 * Get timestamp string
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Log debug message
 */
export function debug(message: string, data?: any): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    const output = data ? { message, data } : message;
    console.debug(`[${getTimestamp()}] [DEBUG]`, output);
  }
}

/**
 * Log info message
 */
export function info(message: string, data?: any): void {
  if (currentLogLevel <= LogLevel.INFO) {
    const output = data ? { message, data } : message;
    console.log(`[${getTimestamp()}] [INFO]`, output);
  }
}

/**
 * Log warning message
 */
export function warn(message: string, data?: any): void {
  if (currentLogLevel <= LogLevel.WARN) {
    const output = data ? { message, data } : message;
    console.warn(`[${getTimestamp()}] [WARN]`, output);
  }
}

/**
 * Log error message
 */
export function error(message: string, err?: Error | any): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    if (err instanceof Error) {
      console.error(`[${getTimestamp()}] [ERROR]`, message, err.message, err.stack);
    } else if (err) {
      console.error(`[${getTimestamp()}] [ERROR]`, message, err);
    } else {
      console.error(`[${getTimestamp()}] [ERROR]`, message);
    }
  }
}

/**
 * Log with context (for service-specific logging)
 */
export function logWithContext(
  service: string,
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  data?: any
): void {
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
