const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const auditLogger = require('./services/auditLogger');
const cadService = require('./services/cadService');
const geocodingService = require('./services/geocodingService');
const videoProcessingService = require('./services/videoProcessingService');
const llmVisionService = require('./services/llmVisionService');
const enhancedAudioAnalysis = require('./services/enhancedAudioAnalysis');
const coordinationAnalysis = require('./services/coordinationAnalysis');
const locationIntelligence = require('./services/locationIntelligence');
const temporalAnalysis = require('./services/temporalAnalysis');
const signalCorrelation = require('./services/signalCorrelation');
const videoBatchProcessor = require('./services/videoBatchProcessor');
const integrationFramework = require('./services/integrationFramework');
const trainingMode = require('./services/trainingMode');
const patternLearning = require('./services/patternLearning');
const accuracyMonitoring = require('./services/accuracyMonitoring');
const peripheralOverwatch = require('./services/peripheralOverwatch');
const kinematicIntentPrediction = require('./services/kinematicIntentPrediction');
const deEscalationReferee = require('./services/deEscalationReferee');
const factAnchoring = require('./services/factAnchoring');
const dictationOverlay = require('./services/dictationOverlay');
const intelligentTriageGate = require('./services/intelligentTriageGate');
const silentDispatchOverride = require('./services/silentDispatchOverride');
const liveFeedHandoff = require('./services/liveFeedHandoff');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json()); // For JSON body parsing

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../temp/uploads'),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept video files - check both mimetype and extension
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
    
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isValidMime = allowedMimes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.includes(fileExtension);
    
    // Accept if either mimetype or extension is valid (curl might not send correct mimetype)
    if (isValidMime || isValidExtension) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only video files are allowed. Received: ${file.mimetype}, extension: ${fileExtension}`), false);
    }
  },
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../temp/uploads');
fs.ensureDirSync(uploadDir);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Initialize services with configuration
// CAD Service
if (process.env.CAD_API_URL && process.env.CAD_API_KEY) {
  cadService.initialize(process.env.CAD_API_URL, process.env.CAD_API_KEY);
  logger.info('CAD Service initialized and enabled');
} else {
  logger.info('CAD Service not configured (missing CAD_API_URL or CAD_API_KEY)');
}

// Geocoding Service
if (process.env.GEOCODING_API_URL) {
  geocodingService.initialize(
    process.env.GEOCODING_API_URL,
    process.env.GEOCODING_API_KEY || null
  );
  logger.info('Geocoding Service initialized');
} else {
  logger.info('Geocoding Service not configured (missing GEOCODING_API_URL)');
}

// LLM Vision Service (for image detection)
if (process.env.LLM_VISION_PROVIDER && process.env.LLM_VISION_API_KEY) {
  llmVisionService.initialize(
    process.env.LLM_VISION_PROVIDER,
    process.env.LLM_VISION_API_KEY,
    process.env.LLM_VISION_MODEL || null,
    process.env.LLM_VISION_API_URL || null
  );
  logger.info('LLM Vision Service initialized');
} else {
  logger.info('LLM Vision Service not configured (set LLM_VISION_PROVIDER and LLM_VISION_API_KEY)');
}

// Enhanced Audio Analysis (works without external APIs - uses local analysis)
enhancedAudioAnalysis.initialize(null); // Can pass LLM service if available
logger.info('Enhanced Audio Analysis initialized');

// Integration Framework
if (process.env.CAD_API_URL && process.env.CAD_API_KEY) {
  integrationFramework.initializeCAD({
    apiUrl: process.env.CAD_API_URL,
    apiKey: process.env.CAD_API_KEY,
  });
  logger.info('CAD Integration Framework initialized');
}

if (process.env.WEARABLE_API_URL) {
  integrationFramework.initializeWearable({
    apiUrl: process.env.WEARABLE_API_URL,
    apiKey: process.env.WEARABLE_API_KEY || null,
  });
  logger.info('Wearable Integration Framework initialized');
}

// Store active sessions and officers
const activeSessions = new Map(); // sessionId -> sessionData
const officerStates = new Map(); // officerName -> state

// Helper function to get timestamp (using logger's timestamp)
function getTimestamp() {
  return logger.getTimestamp();
}

// Log function with timestamp (using logger)
function log(message) {
  logger.info(message);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  log(`Client connected: ${socket.id}`);
  let clientType = 'unknown';
  let officerName = null;

  // Detect client type and log connection
  socket.on('SESSION_STARTED', (data) => {
    clientType = 'mobile';
    officerName = data.officerName;
    activeSessions.set(data.sessionId, {
      ...data,
      socketId: socket.id,
      startTime: new Date(),
    });
    
    officerStates.set(data.officerName, {
      sessionId: data.sessionId,
      lastContact: new Date(),
      signals: [],
      location: null,
    });

    auditLogger.logConnection(socket.id, 'mobile', { officerName: data.officerName });
    auditLogger.logSessionStart(data);
    log(`Session started: ${data.sessionId} for ${data.officerName}`);
  });

  // Listen for THREAT_DETECTED from mobile clients (legacy support)
  socket.on('THREAT_DETECTED', (data) => {
    log(`THREAT_DETECTED received from ${socket.id}`);
    log(`Threat data: ${JSON.stringify(data)}`);
    
    auditLogger.logTelemetry({
      officerName: data.officerName,
      type: 'threat_detected',
      data,
    });
    
    // Broadcast DASHBOARD_ALERT to all connected web clients (dashboards)
    io.emit('DASHBOARD_ALERT', data);
    log(`DASHBOARD_ALERT broadcasted to all connected clients`);
  });

  // Listen for contextual signals (new system)
  socket.on('CONTEXTUAL_SIGNALS', (data) => {
    log(`CONTEXTUAL_SIGNALS received from ${socket.id}`);
    
    const state = officerStates.get(data.officerName);
    if (state) {
      state.lastContact = new Date();
      state.signals = [...(state.signals || []), ...data.signals].slice(-50); // Keep last 50
    }

    auditLogger.logContextualSignals(data);
    
    // Broadcast to supervisor dashboards only (not to officers)
    io.emit('CONTEXTUAL_SIGNALS_UPDATE', {
      officerName: data.officerName,
      signals: data.signals,
      timestamp: data.timestamp,
    });
    
    log(`CONTEXTUAL_SIGNALS broadcasted to dashboards`);
  });

  // Listen for marker events
  socket.on('MARKER_EVENT', (data) => {
    log(`MARKER_EVENT received from ${socket.id}`);
    
    auditLogger.logMarkerEvent(data);
    
    // Broadcast to dashboards
    io.emit('MARKER_EVENT_UPDATE', data);
  });

  // Enhanced Audio Analysis
  socket.on('ENHANCED_AUDIO_ANALYSIS', async (data) => {
    try {
      const { officerName, transcript, options = {} } = data;
      
      const multiSpeaker = await enhancedAudioAnalysis.detectMultiSpeaker(transcript, options);
      const communication = await enhancedAudioAnalysis.analyzeCommunicationPatterns(transcript, options);
      const backgroundNoise = await enhancedAudioAnalysis.analyzeBackgroundNoise(transcript, options);

      // Emit signals if detected
      if (multiSpeaker.detected) {
        io.emit('ENHANCED_AUDIO_SIGNAL', {
          officerName,
          signalType: 'multi_speaker',
          signal: multiSpeaker,
          timestamp: new Date().toISOString(),
        });
      }

      if (communication.detected) {
        io.emit('ENHANCED_AUDIO_SIGNAL', {
          officerName,
          signalType: 'communication_pattern',
          signal: communication,
          timestamp: new Date().toISOString(),
        });
      }

      if (backgroundNoise.detected) {
        io.emit('ENHANCED_AUDIO_SIGNAL', {
          officerName,
          signalType: 'background_noise',
          signal: backgroundNoise,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Enhanced audio analysis socket error', error);
    }
  });

  // Coordination Analysis
  socket.on('COORDINATION_ANALYSIS', (data) => {
    try {
      const { officerName, lat, lng, otherOfficers = [], options = {} } = data;
      
      const proximity = coordinationAnalysis.analyzeOfficerProximity(
        officerName,
        lat,
        lng,
        otherOfficers,
        options
      );

      if (proximity.detected) {
        io.emit('COORDINATION_SIGNAL', {
          officerName,
          signalType: 'officer_proximity',
          signal: proximity,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Coordination analysis socket error', error);
    }
  });

  // Location Analysis
  socket.on('LOCATION_ANALYSIS', async (data) => {
    try {
      const { officerName, lat, lng, options = {} } = data;
      
      const classification = await locationIntelligence.classifyLocationType(lat, lng, options);
      
      if (classification.detected) {
        io.emit('LOCATION_SIGNAL', {
          officerName,
          signalType: 'location_type',
          signal: classification,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Location analysis socket error', error);
    }
  });

  // Signal Correlation
  socket.on('SIGNAL_CORRELATION_REQUEST', (data) => {
    try {
      const { officerName, currentSignals = [], options = {} } = data;
      
      const correlation = signalCorrelation.correlateSignals(
        officerName,
        currentSignals,
        options
      );

      if (correlation.detected) {
        io.emit('SIGNAL_CORRELATION', {
          officerName,
          signal: correlation,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Signal correlation socket error', error);
    }
  });

  // Video Batch Progress
  videoBatchProcessor.on('jobProgress', (data) => {
    io.emit('VIDEO_BATCH_PROGRESS', data);
  });

  videoBatchProcessor.on('jobCompleted', (jobId) => {
    io.emit('VIDEO_BATCH_COMPLETE', { jobId });
  });

  // Listen for session end
  socket.on('SESSION_ENDED', (data) => {
    log(`SESSION_ENDED received from ${socket.id}`);
    
    if (activeSessions.has(data.sessionId)) {
      activeSessions.delete(data.sessionId);
    }
    
    if (officerStates.has(data.officerName)) {
      const state = officerStates.get(data.officerName);
      state.sessionId = null;
      state.lastContact = new Date();
    }

    auditLogger.logSessionEnd(data);
    
    // Notify dashboards
    io.emit('SESSION_ENDED_UPDATE', {
      officerName: data.officerName,
      sessionId: data.sessionId,
      summary: data.summary,
    });
  });

  // Listen for alert clear from mobile clients
  socket.on('ALERT_CLEARED', () => {
    log(`ALERT_CLEARED received from ${socket.id}`);
    io.emit('DASHBOARD_CLEAR', {});
    log(`DASHBOARD_CLEAR broadcasted to all connected clients`);
  });

  // Listen for emergency dispatch
  socket.on('EMERGENCY_DISPATCH', async (dispatchPayload) => {
    log(`EMERGENCY_DISPATCH received from ${socket.id}`);
    log(`Dispatch payload: ${JSON.stringify(dispatchPayload)}`);
    
    const officerName = dispatchPayload.officer?.id || dispatchPayload.officerName;
    
    auditLogger.log({
      eventType: 'EMERGENCY_DISPATCH',
      officerName,
      dispatchPayload: dispatchPayload,
    });
    
    // Use Silent Dispatch Override: Check thresholds AND de-escalation
    // Get current detection results and telemetry state (would come from mobile app)
    // For now, use dispatchPayload data
    const detectionResults = dispatchPayload.detectionResults || {};
    const telemetryState = dispatchPayload.telemetryState || {};
    const audioTranscripts = dispatchPayload.audioTranscripts || [];
    
    // Check if should dispatch (thresholds crossed AND not de-escalated)
    const dispatchDecision = await silentDispatchOverride.shouldDispatch(
      officerName,
      dispatchPayload,
      detectionResults,
      telemetryState,
      audioTranscripts
    );

    // If triage gate initiated, emit to dashboard for supervisor review
    if (dispatchDecision.triageGate && dispatchDecision.triageGate.initiated) {
      const countdown = dispatchDecision.triageGate.countdown;
      
      // Emit triage gate countdown to dashboards
      io.emit('TRIAGE_GATE_COUNTDOWN', {
        officerName,
        countdownId: countdown.id,
        countdown,
        dispatchPayload: dispatchDecision.dispatchPayload,
        remaining: countdown.remaining,
        message: '10-second countdown - supervisor can veto',
      });
      
      log(`TRIAGE_GATE_COUNTDOWN emitted to dashboards for ${officerName}`);
      
      // Initiate live feed hand-off
      const tacticalIntent = dispatchDecision.dispatchPayload?.tacticalIntent || {};
      const handoff = liveFeedHandoff.initiateHandoff(
        officerName,
        dispatchPayload,
        tacticalIntent,
        null // Stream URL would come from mobile app
      );
      
      if (handoff.initiated) {
        io.emit('LIVE_FEED_HANDOFF', {
          officerName,
          streamId: handoff.streamId,
          stream: handoff.stream,
          tacticalIntent,
        });
        log(`LIVE_FEED_HANDOFF emitted to dashboards for ${officerName}`);
      }
      
      // Start countdown monitoring
      const countdownInterval = setInterval(async () => {
        const status = await intelligentTriageGate.checkCountdownStatus(
          officerName,
          detectionResults,
          telemetryState,
          audioTranscripts
        );
        
        if (!status.active) {
          clearInterval(countdownInterval);
          
          if (status.shouldDispatch && !status.autoVetoed) {
            // Countdown expired - proceed with dispatch
            await executeFinalDispatch(officerName, dispatchDecision.dispatchPayload);
          } else if (status.autoVetoed) {
            // Auto-vetoed due to de-escalation
            io.emit('TRIAGE_GATE_VETOED', {
              officerName,
              reason: status.reason,
              autoVetoed: true,
            });
            liveFeedHandoff.endHandoff(officerName, 'Situation stabilized');
          }
        } else {
          // Update countdown
          io.emit('TRIAGE_GATE_UPDATE', {
            officerName,
            remaining: status.remaining,
            countdown: status.countdown,
          });
        }
      }, 1000); // Check every second
      
      return; // Don't dispatch immediately - wait for countdown
    }
    
    // If should not dispatch (de-escalated or thresholds not crossed)
    if (!dispatchDecision.shouldDispatch) {
      log(`Dispatch prevented: ${dispatchDecision.reason}`, {
        officerName,
        reason: dispatchDecision.reason,
      });
      
      io.emit('DISPATCH_PREVENTED', {
        officerName,
        reason: dispatchDecision.reason,
        thresholds: dispatchDecision.thresholds,
        deEscalation: dispatchDecision.deEscalation,
      });
      
      return;
    }
    
    // Fallback: Direct dispatch (if triage gate not used)
    await executeFinalDispatch(officerName, dispatchDecision.dispatchPayload || dispatchPayload);
  });

  // Helper function to execute final dispatch
  async function executeFinalDispatch(officerName, dispatchPayload) {
    // Add address via reverse geocoding if not present
    if (dispatchPayload.location && !dispatchPayload.location.address) {
      try {
        const address = await geocodingService.reverseGeocode(
          dispatchPayload.location.lat,
          dispatchPayload.location.lng
        );
        if (address) {
          dispatchPayload.location.address = address;
        }
      } catch (error) {
        logger.error('Geocoding error', error);
      }
    }
    
    // Send to CAD system if configured
    if (cadService.isEnabled()) {
      try {
        await cadService.dispatchBackup(dispatchPayload);
        log('CAD dispatch sent successfully');
      } catch (error) {
        logger.error('CAD dispatch error', error);
        // Continue even if CAD fails - still emit to dashboards
      }
    } else {
      log('CAD service not enabled - dispatch not sent to CAD');
    }
    
    // Broadcast to dashboards
    io.emit('EMERGENCY_DISPATCH_UPDATE', dispatchPayload);
    log(`EMERGENCY_DISPATCH broadcasted to dashboards`);
  }

  // Handle disconnection
  socket.on('disconnect', () => {
    log(`Client disconnected: ${socket.id}`);
    
    if (clientType === 'mobile' && officerName) {
      auditLogger.logDisconnection(socket.id, 'mobile', { officerName });
    } else {
      auditLogger.logDisconnection(socket.id, clientType || 'unknown');
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: getTimestamp(),
    activeSessions: activeSessions.size,
    activeOfficers: officerStates.size,
  });
});

// Get active officers state (for dashboards)
app.get('/api/officers', (req, res) => {
  const officers = Array.from(officerStates.entries()).map(([name, state]) => ({
    officerName: name,
    sessionId: state.sessionId,
    lastContact: state.lastContact,
    signalCount: state.signals.length,
    location: state.location,
  }));
  
  res.json({ officers });
});

// Get audit logs (admin only)
app.get('/api/audit/logs', (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate required' });
  }
  
  const logs = auditLogger.exportLogs(startDate, endDate);
  res.json({ logs, count: logs.length });
});

// Get audit summary (admin only)
app.get('/api/audit/summary', (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate required' });
  }
  
  const summary = auditLogger.getAuditSummary(startDate, endDate);
  res.json(summary);
});

// Video processing endpoint
app.post('/api/video/process', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoPath = req.file.path;
    const { interval = 1, officerName = null, context = null } = req.body;

    logger.info('Video processing request', {
      filename: req.file.originalname,
      size: req.file.size,
      interval,
      officerName,
    });

    // Get video metadata
    const metadata = await videoProcessingService.getVideoMetadata(videoPath);
    logger.info('Video metadata', metadata);

    // Extract frames
    const frames = await videoProcessingService.extractFrames(videoPath, {
      interval: parseFloat(interval),
    });

    logger.info(`Extracted ${frames.length} frames`);

    // Convert frames to base64 for transmission
    const framesWithData = await Promise.all(
      frames.map(async (frame) => {
        const base64 = await videoProcessingService.frameToBase64(frame.path);
        return {
          ...frame,
          base64: `data:image/jpeg;base64,${base64}`,
        };
      })
    );

    // Clean up uploaded video file
    await fs.remove(videoPath);

    // Clean up frame files (after a delay to allow client to process)
    setTimeout(async () => {
      await videoProcessingService.cleanupFrames(frames.map(f => f.path));
    }, 60000); // Clean up after 1 minute

    res.json({
      success: true,
      metadata,
      frames: framesWithData,
      summary: {
        totalFrames: frames.length,
        duration: metadata.duration,
        interval: parseFloat(interval),
      },
    });
  } catch (error) {
    logger.error('Video processing error', error);
    
    // Clean up on error
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Video processing failed',
      message: error.message,
    });
  }
});

// Detection processing endpoint
app.post('/api/detections/process', async (req, res) => {
  try {
    const { frames, options = {} } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'Frames array required' });
    }

    logger.info('Detection processing request', {
      frameCount: frames.length,
      options,
    });

    const detectionProcessor = require('./api/detectionProcessor');
    
    const results = await detectionProcessor.processFrames(frames, {
      ...options,
      onProgress: (current, total, result) => {
        logger.debug(`Processing frame ${current}/${total}`);
      },
    });

    // Generate summary
    const summary = {
      totalFrames: frames.length,
      framesProcessed: results.length,
      detectionsFound: results.filter(r => 
        Object.values(r.detections || {}).some(d => d.detected)
      ).length,
      detectionTypes: {
        weapon: results.filter(r => r.detections?.weapon?.detected).length,
        stance: results.filter(r => r.detections?.stance?.detected).length,
        hands: results.filter(r => r.detections?.hands?.detected).length,
        audio: results.filter(r => r.detections?.audio?.detected).length,
      },
    };

    res.json({
      success: true,
      results,
      summary,
    });
  } catch (error) {
    logger.error('Detection processing error', error);
    res.status(500).json({
      error: 'Detection processing failed',
      message: error.message,
    });
  }
});

// Enhanced Audio Analysis
app.post('/api/audio/analyze', async (req, res) => {
  try {
    const { transcript, options = {} } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript required' });
    }

    const results = {
      multiSpeaker: await enhancedAudioAnalysis.detectMultiSpeaker(transcript, options),
      communication: await enhancedAudioAnalysis.analyzeCommunicationPatterns(transcript, options),
      backgroundNoise: await enhancedAudioAnalysis.analyzeBackgroundNoise(transcript, options),
    };

    res.json({ success: true, results });
  } catch (error) {
    logger.error('Audio analysis error', error);
    res.status(500).json({ error: error.message });
  }
});

// Coordination Analysis
app.post('/api/coordination/analyze', (req, res) => {
  try {
    const { officerName, lat, lng, otherOfficers = [], options = {} } = req.body;
    
    if (!officerName || !lat || !lng) {
      return res.status(400).json({ error: 'Officer name and location required' });
    }

    const proximity = coordinationAnalysis.analyzeOfficerProximity(
      officerName,
      lat,
      lng,
      otherOfficers,
      options
    );

    res.json({ success: true, proximity });
  } catch (error) {
    logger.error('Coordination analysis error', error);
    res.status(500).json({ error: error.message });
  }
});

// Location Intelligence
app.post('/api/location/classify', async (req, res) => {
  try {
    const { lat, lng, options = {} } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const classification = await locationIntelligence.classifyLocationType(lat, lng, options);
    res.json({ success: true, classification });
  } catch (error) {
    logger.error('Location classification error', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/location/route-deviation', (req, res) => {
  try {
    const { officerName, currentRoute, plannedRoute = null, options = {} } = req.body;
    
    if (!officerName || !currentRoute) {
      return res.status(400).json({ error: 'Officer name and current route required' });
    }

    const deviation = locationIntelligence.analyzeRouteDeviation(
      officerName,
      currentRoute,
      plannedRoute,
      options
    );

    locationIntelligence.updateRouteHistory(officerName, currentRoute);

    res.json({ success: true, deviation });
  } catch (error) {
    logger.error('Route deviation analysis error', error);
    res.status(500).json({ error: error.message });
  }
});

// Temporal Analysis
app.post('/api/temporal/analyze', (req, res) => {
  try {
    const { signals = [], options = {} } = req.body;
    
    const timeOfDay = temporalAnalysis.correlateTimeOfDay(signals, options);
    
    res.json({ success: true, timeOfDay });
  } catch (error) {
    logger.error('Temporal analysis error', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/temporal/trends', (req, res) => {
  try {
    const { officerName, currentSignals = [], options = {} } = req.body;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const trends = temporalAnalysis.analyzePatternTrends(officerName, currentSignals, options);
    res.json({ success: true, trends });
  } catch (error) {
    logger.error('Pattern trend analysis error', error);
    res.status(500).json({ error: error.message });
  }
});

// Signal Correlation
app.post('/api/signals/correlate', (req, res) => {
  try {
    const { officerName, currentSignals = [], options = {} } = req.body;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const correlation = signalCorrelation.correlateSignals(
      officerName,
      currentSignals,
      options
    );

    res.json({ success: true, correlation });
  } catch (error) {
    logger.error('Signal correlation error', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/signals/historical-match', (req, res) => {
  try {
    const { officerName, currentSignals = [], options = {} } = req.body;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const match = signalCorrelation.matchHistoricalPatterns(
      officerName,
      currentSignals,
      options
    );

    res.json({ success: true, match });
  } catch (error) {
    logger.error('Historical pattern matching error', error);
    res.status(500).json({ error: error.message });
  }
});

// Video Batch Processing
app.post('/api/video/batch', async (req, res) => {
  try {
    const { videoPaths, options = {} } = req.body;
    
    if (!videoPaths || !Array.isArray(videoPaths) || videoPaths.length === 0) {
      return res.status(400).json({ error: 'Video paths array required' });
    }

    const jobId = await videoBatchProcessor.processBatch(videoPaths, options);
    res.json({ success: true, jobId });
  } catch (error) {
    logger.error('Batch processing error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/video/batch/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const status = videoBatchProcessor.getJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ success: true, status });
  } catch (error) {
    logger.error('Batch status error', error);
    res.status(500).json({ error: error.message });
  }
});

// Training Mode
app.post('/api/training/start', (req, res) => {
  try {
    const { officerName, scenarioId } = req.body;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const session = trainingMode.startTrainingSession(officerName, scenarioId);
    res.json({ success: true, session });
  } catch (error) {
    logger.error('Training start error', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/training/end', (req, res) => {
  try {
    const { officerName } = req.body;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const summary = trainingMode.endTrainingSession(officerName);
    res.json({ success: true, summary });
  } catch (error) {
    logger.error('Training end error', error);
    res.status(500).json({ error: error.message });
  }
});

// Pattern Learning Feedback
app.post('/api/feedback', (req, res) => {
  try {
    const { signalId, feedback } = req.body;
    
    if (!signalId || !feedback) {
      return res.status(400).json({ error: 'Signal ID and feedback required' });
    }

    patternLearning.recordFeedback(signalId, feedback);
    
    // Record accuracy outcome if provided
    if (feedback.type && feedback.confidence !== undefined) {
      const wasCorrect = feedback.type === 'true_positive';
      accuracyMonitoring.recordOutcome(
        feedback.patternType || 'unknown',
        feedback.confidence,
        wasCorrect
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Feedback error', error);
    res.status(500).json({ error: error.message });
  }
});

// Accuracy Monitoring
app.get('/api/accuracy/metrics', (req, res) => {
  try {
    const metrics = accuracyMonitoring.getMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error('Accuracy metrics error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/accuracy/report', (req, res) => {
  try {
    const report = accuracyMonitoring.getAccuracyReport();
    res.json({ success: true, report });
  } catch (error) {
    logger.error('Accuracy report error', error);
    res.status(500).json({ error: error.message });
  }
});

// Peripheral Overwatch
app.post('/api/peripheral/scan', async (req, res) => {
  try {
    const { frameBase64, officerName, frameTime } = req.body;
    
    if (!frameBase64) {
      return res.status(400).json({ error: 'Frame data required' });
    }

    const result = await peripheralOverwatch.scanPeriphery(frameBase64, {
      officerName,
      frameTime,
    });

    res.json({ success: true, result });
  } catch (error) {
    logger.error('Peripheral scan error', error);
    res.status(500).json({ error: error.message });
  }
});

// Kinematic Intent Prediction
app.post('/api/kinematic/predict', (req, res) => {
  try {
    const { officerName, movementData, options } = req.body;
    
    if (!officerName || !movementData) {
      return res.status(400).json({ error: 'Officer name and movement data required' });
    }

    const prediction = kinematicIntentPrediction.predictIntent(officerName, movementData, options);
    res.json({ success: true, prediction });
  } catch (error) {
    logger.error('Kinematic prediction error', error);
    res.status(500).json({ error: error.message });
  }
});

// De-escalation Referee
app.post('/api/de-escalation/check', async (req, res) => {
  try {
    const { officerName, detectionResults, telemetryState, audioTranscripts } = req.body;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const result = await deEscalationReferee.checkStabilization(
      officerName,
      detectionResults,
      telemetryState,
      audioTranscripts
    );

    res.json({ success: true, result });
  } catch (error) {
    logger.error('De-escalation check error', error);
    res.status(500).json({ error: error.message });
  }
});

// Fact Anchoring
app.post('/api/facts/anchor', (req, res) => {
  try {
    const { officerName, fact, metadata } = req.body;
    
    if (!officerName || !fact) {
      return res.status(400).json({ error: 'Officer name and fact required' });
    }

    const factEntry = factAnchoring.anchorFact(officerName, fact, metadata);
    res.json({ success: true, fact: factEntry });
  } catch (error) {
    logger.error('Fact anchoring error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/facts/log', (req, res) => {
  try {
    const { officerName, startTime, endTime, limit } = req.query;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const log = factAnchoring.getFactLog(officerName, {
      startTime,
      endTime,
      limit: limit ? parseInt(limit) : null,
    });

    res.json({ success: true, log, count: log.length });
  } catch (error) {
    logger.error('Fact log retrieval error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/facts/timeline', (req, res) => {
  try {
    const { officerName } = req.query;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const timeline = factAnchoring.formatTimeline(officerName);
    res.json({ success: true, timeline });
  } catch (error) {
    logger.error('Fact timeline error', error);
    res.status(500).json({ error: error.message });
  }
});

// Dictation Overlay
app.post('/api/dictation/command', async (req, res) => {
  try {
    const { officerName, transcript, context } = req.body;
    
    if (!officerName || !transcript) {
      return res.status(400).json({ error: 'Officer name and transcript required' });
    }

    const result = await dictationOverlay.processCommand(officerName, transcript, context);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Dictation command error', error);
    res.status(500).json({ error: error.message });
  }
});

// Intelligent Triage Gate
app.post('/api/triage/veto', (req, res) => {
  try {
    const { officerName, supervisorId, reason } = req.body;
    
    if (!officerName || !supervisorId) {
      return res.status(400).json({ error: 'Officer name and supervisor ID required' });
    }

    const result = intelligentTriageGate.vetoDispatch(officerName, supervisorId, reason);
    
    // Emit veto to dashboards
    io.emit('TRIAGE_GATE_VETOED', {
      officerName,
      supervisorId,
      reason,
      timestamp: new Date().toISOString(),
    });
    
    // End live feed if active
    liveFeedHandoff.endHandoff(officerName, `Vetoed by supervisor: ${reason || 'No reason provided'}`);
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Triage veto error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/triage/countdowns', (req, res) => {
  try {
    const countdowns = intelligentTriageGate.getActiveCountdowns();
    res.json({ success: true, countdowns });
  } catch (error) {
    logger.error('Triage countdowns error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/triage/countdown/:officerName', (req, res) => {
  try {
    const { officerName } = req.params;
    const countdown = intelligentTriageGate.getCountdown(officerName);
    
    if (!countdown) {
      return res.status(404).json({ error: 'No active countdown found' });
    }
    
    res.json({ success: true, countdown });
  } catch (error) {
    logger.error('Triage countdown error', error);
    res.status(500).json({ error: error.message });
  }
});

// Silent Dispatch Override
app.post('/api/dispatch/check', async (req, res) => {
  try {
    const { officerName, threatData, detectionResults, telemetryState, audioTranscripts } = req.body;
    
    if (!officerName || !threatData) {
      return res.status(400).json({ error: 'Officer name and threat data required' });
    }

    const decision = await silentDispatchOverride.shouldDispatch(
      officerName,
      threatData,
      detectionResults || {},
      telemetryState || {},
      audioTranscripts || []
    );

    res.json({ success: true, decision });
  } catch (error) {
    logger.error('Silent dispatch check error', error);
    res.status(500).json({ error: error.message });
  }
});

// Live Feed Hand-off
app.post('/api/live-feed/initiate', (req, res) => {
  try {
    const { officerName, crisisData, tacticalIntent, streamUrl } = req.body;
    
    if (!officerName || !crisisData) {
      return res.status(400).json({ error: 'Officer name and crisis data required' });
    }

    const result = liveFeedHandoff.initiateHandoff(officerName, crisisData, tacticalIntent || {}, streamUrl);
    
    // Emit to dashboards
    io.emit('LIVE_FEED_HANDOFF', {
      officerName,
      streamId: result.streamId,
      stream: result.stream,
      tacticalIntent: tacticalIntent || {},
    });
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Live feed hand-off error', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/live-feed/end', (req, res) => {
  try {
    const { officerName, reason } = req.body;
    
    if (!officerName) {
      return res.status(400).json({ error: 'Officer name required' });
    }

    const result = liveFeedHandoff.endHandoff(officerName, reason || 'Crisis resolved');
    
    // Emit to dashboards
    io.emit('LIVE_FEED_ENDED', {
      officerName,
      reason: reason || 'Crisis resolved',
      timestamp: new Date().toISOString(),
    });
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Live feed end error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/live-feed/streams', (req, res) => {
  try {
    const streams = liveFeedHandoff.getActiveStreams();
    res.json({ success: true, streams });
  } catch (error) {
    logger.error('Live feed streams error', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/live-feed/stream/:officerName', (req, res) => {
  try {
    const { officerName } = req.params;
    const stream = liveFeedHandoff.getStream(officerName);
    
    if (!stream) {
      return res.status(404).json({ error: 'No active stream found' });
    }
    
    res.json({ success: true, stream });
  } catch (error) {
    logger.error('Live feed stream error', error);
    res.status(500).json({ error: error.message });
  }
});

// Video metadata endpoint (without processing)
app.post('/api/video/metadata', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoPath = req.file.path;
    const metadata = await videoProcessingService.getVideoMetadata(videoPath);

    // Clean up uploaded file
    await fs.remove(videoPath);

    res.json({
      success: true,
      metadata,
    });
  } catch (error) {
    logger.error('Video metadata error', error);
    
    // Clean up on error
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      error: 'Failed to get video metadata',
      message: error.message,
    });
  }
});

// Start server
server.listen(PORT, () => {
  log(`Bridge Server running on port ${PORT}`);
  log(`Waiting for connections...`);
});

