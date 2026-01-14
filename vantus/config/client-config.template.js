/**
 * CLIENT CONFIGURATION TEMPLATE
 * Copy this file to client-config.js and fill in client-specific values
 * DO NOT commit client-config.js to version control
 */

export const CLIENT_CONFIG = {
  // ============================================
  // DEPARTMENT INFORMATION
  // ============================================
  department: {
    name: "DEPARTMENT_NAME", // e.g., "West Vancouver Police Service"
    abbreviation: "DEPT", // e.g., "WVPS"
    id: "DEPT_ID", // Unique department identifier
    jurisdiction: "CITY, PROVINCE", // e.g., "West Vancouver, BC"
  },

  // ============================================
  // OFFICER ID FORMAT
  // ============================================
  officerId: {
    // Format function: badgeNumber -> officer ID
    format: (badgeNumber) => `DEPT-${badgeNumber}`, // e.g., "WVPS-4472"
    // Or use pattern:
    // format: (badgeNumber) => `${CLIENT_CONFIG.department.abbreviation}-${badgeNumber}`,
  },

  // ============================================
  // SERVER URLS
  // ============================================
  servers: {
    bridge: process.env.BRIDGE_SERVER_URL || "https://bridge.vantus.example.com",
    departmentApi: process.env.DEPARTMENT_API_URL || "https://api.department.example.com",
    cad: process.env.CAD_API_URL || "https://cad.department.example.com",
    geocoding: process.env.GEOCODING_API_URL || "https://geocoding.example.com",
  },

  // ============================================
  // MAP CONFIGURATION
  // ============================================
  map: {
    center: {
      lat: 0.0, // REPLACE: Client's primary jurisdiction center
      lng: 0.0, // REPLACE: Client's primary jurisdiction center
    },
    // Map projection scale (may need adjustment for different latitudes)
    projectionScale: 0.1, // Default, adjust if needed
    // Jurisdiction boundaries (optional, for map bounds)
    bounds: {
      north: 0.0,
      south: 0.0,
      east: 0.0,
      west: 0.0,
    },
  },

  // ============================================
  // OPERATIONAL CONTEXTS
  // ============================================
  operationalContexts: {
    // Marker event types used by this department
    markerEventTypes: [
      "traffic_stop",
      "checkpoint",
      "suspicious_activity",
      "welfare_check",
      "backup_requested",
      // ADD: Client-specific event types
    ],
    
    // Expected durations for routine operations (seconds)
    routineDurations: {
      traffic_stop: 300, // 5 minutes average
      checkpoint: 600, // 10 minutes average
      suspicious_activity: 180, // 3 minutes average
      // ADD: Client-specific durations
    },
  },

  // ============================================
  // MODEL CONFIGURATION
  // ============================================
  models: {
    // Model file paths (when models are ready)
    paths: {
      weapon: process.env.WEAPON_MODEL_PATH || null,
      stance: process.env.STANCE_MODEL_PATH || null,
      hands: process.env.HANDS_MODEL_PATH || null,
      audio: process.env.AUDIO_MODEL_PATH || null,
    },
    
    // Confidence thresholds (adjust based on validation)
    thresholds: {
      weapon: 0.70, // 70%
      stance: 0.65, // 65%
      hands: 0.60, // 60%
      audio: 0.70, // 70%
      biometric: 0.40, // 40% above baseline
    },
  },

  // ============================================
  // BASELINE CALIBRATION
  // ============================================
  baseline: {
    // Minimum data points before generating signals
    minDataPoints: 20,
    
    // Baseline update parameters
    emaAlpha: 0.1, // Exponential moving average smoothing
    maxUpdatePercent: 0.10, // 10% cap per update
    
    // Context detection thresholds
    vehicleSpeedThreshold: 5.0, // m/s (18 km/h) - above this = in vehicle
    dayTimeStart: 6, // Hour (24-hour format)
    dayTimeEnd: 18, // Hour (24-hour format)
    
    // Data retention
    midTermDays: 14, // Primary baseline window
    longTermDays: 90, // Long-term window for drift detection
  },

  // ============================================
  // AUTO-DISPATCH THRESHOLDS
  // ============================================
  autoDispatch: {
    // Heart rate thresholds
    elevatedHeartRate: 160, // BPM
    elevatedHeartRateDuration: 10, // seconds
    
    // No movement + elevated HR
    noMovementElevatedHRDuration: 30, // seconds
    
    // Threat level critical
    criticalWeaponConfidence: 0.85, // 85%
    criticalThreatCount: 2, // Multiple threat indicators
  },

  // ============================================
  // WELFARE CHECK
  // ============================================
  welfareCheck: {
    // Start periodic checks after this many minutes of active session
    periodicCheckInterval: 10, // minutes
    
    // Response window
    responseWindowSeconds: 30,
  },

  // ============================================
  // VIDEO BUFFER
  // ============================================
  video: {
    bufferDuration: 30000, // 30 seconds (milliseconds)
    postTriggerDuration: 30000, // 30 seconds
    resolution: {
      width: 854,
      height: 480, // 480p
    },
    frameRate: 15, // FPS
  },

  // ============================================
  // BRANDING
  // ============================================
  branding: {
    appName: "VANTUS", // Or client-specific name
    logo: "/assets/logo.png", // Path to logo
    primaryColor: "#00FF41", // Green
    secondaryColor: "#FFAA00", // Orange
    // ADD: Client-specific colors
  },

  // ============================================
  // DATA RETENTION
  // ============================================
  dataRetention: {
    defaultDays: 90, // Default retention period
    minDays: 1,
    maxDays: 365,
    autoDelete: true, // Enable automatic deletion
  },

  // ============================================
  // API KEYS & SECRETS (Use environment variables)
  // ============================================
  apiKeys: {
    departmentApi: process.env.DEPARTMENT_API_KEY || "",
    cadApi: process.env.CAD_API_KEY || "",
    geocodingApi: process.env.GEOCODING_API_KEY || "",
    // ADD: Other API keys
  },

  // ============================================
  // LLM CONFIGURATION (For Audio Analysis)
  // ============================================
  llm: {
    // Provider: 'openrouter' | 'together' | 'deepseek'
    provider: process.env.LLM_PROVIDER || null,
    
    // API key for LLM provider
    apiKey: process.env.LLM_API_KEY || null,
    
    // Model name (optional - will use default for provider if not specified)
    model: process.env.LLM_MODEL || null,
    
    // Example configurations:
    // OpenRouter (free tier):
    //   provider: 'openrouter',
    //   apiKey: 'your-openrouter-api-key',
    //   model: 'meta-llama/llama-3.2-3b-instruct:free',
    //
    // Together AI:
    //   provider: 'together',
    //   apiKey: 'your-together-api-key',
    //   model: 'meta-llama/Llama-3-8b-chat-hf',
    //
    // DeepSeek:
    //   provider: 'deepseek',
    //   apiKey: 'your-deepseek-api-key',
    //   model: 'deepseek-chat',
  },
};

// Helper function to get officer ID
export const getOfficerId = (badgeNumber) => {
  return CLIENT_CONFIG.officerId.format(badgeNumber);
};

// Helper function to get server URL
export const getServerUrl = (serverType) => {
  return CLIENT_CONFIG.servers[serverType] || null;
};

// Helper function to get model path
export const getModelPath = (modelType) => {
  return CLIENT_CONFIG.models.paths[modelType] || null;
};
