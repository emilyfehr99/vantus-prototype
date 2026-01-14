/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

const logger = require('./logger');

class ErrorHandler {
  constructor() {
    this.errorCodes = {
      // Validation errors
      VALIDATION_ERROR: 'VAL_001',
      INVALID_INPUT: 'VAL_002',
      MISSING_REQUIRED_FIELD: 'VAL_003',
      
      // Service errors
      SERVICE_UNAVAILABLE: 'SRV_001',
      SERVICE_TIMEOUT: 'SRV_002',
      SERVICE_ERROR: 'SRV_003',
      
      // Authentication errors
      AUTH_FAILED: 'AUTH_001',
      UNAUTHORIZED: 'AUTH_002',
      SESSION_EXPIRED: 'AUTH_003',
      
      // Data errors
      DATA_NOT_FOUND: 'DATA_001',
      DATA_INVALID: 'DATA_002',
      DATA_CONFLICT: 'DATA_003',
      
      // Processing errors
      PROCESSING_ERROR: 'PROC_001',
      PROCESSING_TIMEOUT: 'PROC_002',
      PROCESSING_FAILED: 'PROC_003',
    };
  }

  /**
   * Handle error and return formatted response
   */
  handleError(error, context = {}) {
    const errorInfo = {
      code: this.getErrorCode(error),
      message: error.message || 'An error occurred',
      context,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };

    logger.error('Error handled', errorInfo);

    return errorInfo;
  }

  /**
   * Get error code from error type
   */
  getErrorCode(error) {
    if (error.code) return error.code;
    
    if (error.name === 'ValidationError') return this.errorCodes.VALIDATION_ERROR;
    if (error.name === 'UnauthorizedError') return this.errorCodes.UNAUTHORIZED;
    if (error.name === 'TimeoutError') return this.errorCodes.SERVICE_TIMEOUT;
    if (error.name === 'NotFoundError') return this.errorCodes.DATA_NOT_FOUND;
    
    return this.errorCodes.SERVICE_ERROR;
  }

  /**
   * Create standardized error response for API
   */
  createErrorResponse(error, context = {}) {
    const errorInfo = this.handleError(error, context);
    
    return {
      success: false,
      error: {
        code: errorInfo.code,
        message: errorInfo.message,
        context: errorInfo.context,
      },
    };
  }

  /**
   * Create standardized success response for API
   */
  createSuccessResponse(data, message = null) {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate required fields
   */
  validateRequired(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }
}

module.exports = new ErrorHandler();
