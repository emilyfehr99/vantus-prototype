/**
 * CONFIGURATION SERVICE
 * Centralized configuration management
 * Loads from environment variables and client-config.js (if available)
 */

import * as Constants from './constants';
import logger from './logger';

// Try to load client-specific config (if exists)
let CLIENT_CONFIG = null;
try {
  // In production, this would load from client-config.js
  // For now, we'll use constants as defaults
  CLIENT_CONFIG = null; // Will be set when client-config.js is available
} catch (error) {
  // Client config not available, use defaults
  logger.debug('Client config not found, using defaults');
}

/**
 * Configuration Service
 * Provides access to all configuration values
 */
class ConfigService {
  constructor() {
    this.config = {
      // Server URLs
      servers: {
        bridge: process.env.BRIDGE_SERVER_URL || Constants.SERVER_URLS.BRIDGE_SERVER,
        departmentApi: process.env.DEPARTMENT_API_URL || Constants.SERVER_URLS.DEPARTMENT_API,
        cad: process.env.CAD_API_URL || Constants.SERVER_URLS.CAD_API,
        geocoding: process.env.GEOCODING_API_URL || Constants.SERVER_URLS.GEOCODING_API,
      },
      
      // Map configuration
      map: {
        center: CLIENT_CONFIG?.map?.center || Constants.MAP_CONFIG.DEFAULT_CENTER,
        projectionScale: CLIENT_CONFIG?.map?.projectionScale || Constants.MAP_CONFIG.PROJECTION_SCALE,
      },
      
      // Officer ID format
      officerId: {
        format: CLIENT_CONFIG?.officerId?.format || Constants.OFFICER_ID.format,
      },
      
      // Baseline configuration
      baseline: {
        vehicleSpeedThreshold: CLIENT_CONFIG?.baseline?.vehicleSpeedThreshold || Constants.BASELINE_CONFIG.VEHICLE_SPEED_THRESHOLD,
        dayTimeStart: CLIENT_CONFIG?.baseline?.dayTimeStart || Constants.BASELINE_CONFIG.DAY_TIME_START,
        dayTimeEnd: CLIENT_CONFIG?.baseline?.dayTimeEnd || Constants.BASELINE_CONFIG.DAY_TIME_END,
        minDataPoints: CLIENT_CONFIG?.baseline?.minDataPoints || Constants.BASELINE_CONFIG.MIN_DATA_POINTS,
        emaAlpha: CLIENT_CONFIG?.baseline?.emaAlpha || Constants.BASELINE_CONFIG.EMA_ALPHA,
        maxUpdatePercent: CLIENT_CONFIG?.baseline?.maxUpdatePercent || Constants.BASELINE_CONFIG.MAX_UPDATE_PERCENT,
        midTermDays: CLIENT_CONFIG?.baseline?.midTermDays || Constants.BASELINE_CONFIG.MID_TERM_DAYS,
        longTermDays: CLIENT_CONFIG?.baseline?.longTermDays || Constants.BASELINE_CONFIG.LONG_TERM_DAYS,
      },
      
      // Model thresholds
      models: {
        thresholds: {
          weapon: CLIENT_CONFIG?.models?.thresholds?.weapon || Constants.MODEL_THRESHOLDS.WEAPON,
          stance: CLIENT_CONFIG?.models?.thresholds?.stance || Constants.MODEL_THRESHOLDS.STANCE,
          hands: CLIENT_CONFIG?.models?.thresholds?.hands || Constants.MODEL_THRESHOLDS.HANDS,
          audio: CLIENT_CONFIG?.models?.thresholds?.audio || Constants.MODEL_THRESHOLDS.AUDIO,
          biometric: CLIENT_CONFIG?.models?.thresholds?.biometric || Constants.MODEL_THRESHOLDS.BIOMETRIC,
        },
        paths: {
          weapon: CLIENT_CONFIG?.models?.paths?.weapon || getModelPath('weapon'),
          stance: CLIENT_CONFIG?.models?.paths?.stance || getModelPath('stance'),
          hands: CLIENT_CONFIG?.models?.paths?.hands || getModelPath('hands'),
          audio: CLIENT_CONFIG?.models?.paths?.audio || getModelPath('audio'),
        },
      },
      
      // Auto-dispatch configuration
      autoDispatch: {
        elevatedHeartRate: CLIENT_CONFIG?.autoDispatch?.elevatedHeartRate || Constants.DISPATCH_CONFIG.ELEVATED_HEART_RATE,
        elevatedHeartRateDuration: CLIENT_CONFIG?.autoDispatch?.elevatedHeartRateDuration || Constants.DISPATCH_CONFIG.ELEVATED_HR_DURATION,
        noMovementElevatedHRDuration: CLIENT_CONFIG?.autoDispatch?.noMovementElevatedHRDuration || Constants.DISPATCH_CONFIG.NO_MOVEMENT_ELEVATED_HR_DURATION,
        criticalWeaponConfidence: CLIENT_CONFIG?.autoDispatch?.criticalWeaponConfidence || Constants.DISPATCH_CONFIG.CRITICAL_WEAPON_CONFIDENCE,
        criticalThreatCount: CLIENT_CONFIG?.autoDispatch?.criticalThreatCount || Constants.DISPATCH_CONFIG.CRITICAL_THREAT_COUNT,
      },
      
      // Welfare check configuration
      welfareCheck: {
        periodicCheckInterval: CLIENT_CONFIG?.welfareCheck?.periodicCheckInterval || Constants.WELFARE_CHECK_CONFIG.PERIODIC_CHECK_INTERVAL,
        responseWindowSeconds: CLIENT_CONFIG?.welfareCheck?.responseWindowSeconds || Constants.WELFARE_CHECK_CONFIG.RESPONSE_WINDOW_SECONDS,
      },
      
      // Video configuration
      video: {
        bufferDuration: CLIENT_CONFIG?.video?.bufferDuration || Constants.VIDEO_CONFIG.BUFFER_DURATION,
        postTriggerDuration: CLIENT_CONFIG?.video?.postTriggerDuration || Constants.VIDEO_CONFIG.POST_TRIGGER_DURATION,
        resolution: CLIENT_CONFIG?.video?.resolution || Constants.VIDEO_CONFIG.RESOLUTION,
        frameRate: CLIENT_CONFIG?.video?.frameRate || Constants.VIDEO_CONFIG.FRAME_RATE,
      },
      
      // Operational contexts
      operationalContexts: {
        markerEventTypes: CLIENT_CONFIG?.operationalContexts?.markerEventTypes || Object.values(Constants.MARKER_EVENT_TYPES),
        routineDurations: CLIENT_CONFIG?.operationalContexts?.routineDurations || Constants.ROUTINE_DURATIONS,
      },
      
      // Branding
      branding: {
        appName: CLIENT_CONFIG?.branding?.appName || Constants.BRANDING.APP_NAME,
        primaryColor: CLIENT_CONFIG?.branding?.primaryColor || Constants.BRANDING.PRIMARY_COLOR,
        secondaryColor: CLIENT_CONFIG?.branding?.secondaryColor || Constants.BRANDING.SECONDARY_COLOR,
        logo: CLIENT_CONFIG?.branding?.logo || Constants.BRANDING.LOGO_PATH,
      },
      
      // Data retention
      dataRetention: {
        defaultDays: CLIENT_CONFIG?.dataRetention?.defaultDays || Constants.DATA_RETENTION.DEFAULT_DAYS,
        minDays: CLIENT_CONFIG?.dataRetention?.minDays || Constants.DATA_RETENTION.MIN_DAYS,
        maxDays: CLIENT_CONFIG?.dataRetention?.maxDays || Constants.DATA_RETENTION.MAX_DAYS,
        autoDelete: CLIENT_CONFIG?.dataRetention?.autoDelete !== undefined ? CLIENT_CONFIG.dataRetention.autoDelete : Constants.DATA_RETENTION.AUTO_DELETE,
      },
      
      // LLM configuration for audio analysis
      llm: {
        provider: CLIENT_CONFIG?.llm?.provider || process.env.LLM_PROVIDER || null, // 'openrouter' | 'together' | 'deepseek'
        apiKey: CLIENT_CONFIG?.llm?.apiKey || process.env.LLM_API_KEY || null,
        model: CLIENT_CONFIG?.llm?.model || process.env.LLM_MODEL || null,
        enabled: !!(CLIENT_CONFIG?.llm?.apiKey || process.env.LLM_API_KEY),
      },
    };
  }
  
  /**
   * Get server URL by type
   */
  getServerUrl(serverType) {
    return this.config.servers[serverType] || null;
  }
  
  /**
   * Get map center coordinates
   */
  getMapCenter() {
    return this.config.map.center;
  }
  
  /**
   * Get officer ID format function
   */
  getOfficerIdFormat() {
    return this.config.officerId.format;
  }
  
  /**
   * Get baseline configuration
   */
  getBaselineConfig() {
    return this.config.baseline;
  }
  
  /**
   * Get model threshold
   */
  getModelThreshold(modelType) {
    return this.config.models.thresholds[modelType] || null;
  }
  
  /**
   * Get model path
   */
  getModelPath(modelType) {
    return this.config.models.paths[modelType] || null;
  }
  
  /**
   * Get auto-dispatch configuration
   */
  getAutoDispatchConfig() {
    return this.config.autoDispatch;
  }
  
  /**
   * Get welfare check configuration
   */
  getWelfareCheckConfig() {
    return this.config.welfareCheck;
  }
  
  /**
   * Get video configuration
   */
  getVideoConfig() {
    return this.config.video;
  }
  
  /**
   * Get operational contexts
   */
  getOperationalContexts() {
    return this.config.operationalContexts;
  }
  
  /**
   * Get branding configuration
   */
  getBranding() {
    return this.config.branding;
  }
  
  /**
   * Get data retention configuration
   */
  getDataRetention() {
    return this.config.dataRetention;
  }
  
  /**
   * Get LLM configuration
   */
  getLLMConfig() {
    return this.config.llm;
  }
  
  /**
   * Validate configuration
   * Checks for required values and logs warnings
   */
  validate() {
    const warnings = [];
    
    if (!this.config.servers.bridge || this.config.servers.bridge.includes('localhost')) {
      warnings.push('Bridge server URL is using localhost - update for production');
    }
    
    if (this.config.map.center.lat === Constants.MAP_CONFIG.DEFAULT_CENTER.lat) {
      warnings.push('Map center is using default coordinates - update for client jurisdiction');
    }
    
    if (this.config.officerId.format === Constants.OFFICER_ID.format) {
      warnings.push('Officer ID format is using default - update for client format');
    }
    
    if (warnings.length > 0) {
      logger.warn('Configuration warnings', { warnings });
    }
    
    return warnings.length === 0;
  }
}

// Create singleton instance
const configService = new ConfigService();

// Validate on load
configService.validate();

// Re-export helper functions for convenience
export { getOfficerId, getServerUrl, getModelPath } from './constants';

// Export default instance
export default configService;
