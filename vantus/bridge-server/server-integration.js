/**
 * Bridge Server Integration
 * Adds new service integrations to server.js
 * 
 * TO INTEGRATE: Copy the relevant sections into server.js
 */

// ============================================
// 1. SERVICE IMPORTS (Add to top of server.js)
// ============================================

const enhancedAudioAnalysis = require('./services/enhancedAudioAnalysis');
const coordinationAnalysis = require('./services/coordinationAnalysis');
const locationIntelligence = require('./services/locationIntelligence');
const temporalAnalysis = require('./services/temporalAnalysis');
const signalCorrelation = require('./services/signalCorrelation');
const videoBatchProcessor = require('./services/videoBatchProcessor');
const integrationFramework = require('./services/integrationFramework');
const trainingMode = require('./services/trainingMode');
const patternLearning = require('./services/patternLearning');

// ============================================
// 2. SERVICE INITIALIZATION (Add after existing service initialization)
// ============================================

// Enhanced Audio Analysis
if (process.env.LLM_PROVIDER && process.env.LLM_API_KEY) {
  // Initialize with LLM service if available
  const llmService = require('./services/llmService'); // You may need to create this
  enhancedAudioAnalysis.initialize(llmService);
  logger.info('Enhanced Audio Analysis initialized');
} else {
  enhancedAudioAnalysis.initialize(null);
  logger.info('Enhanced Audio Analysis initialized (local analysis only)');
}

// Integration Framework
if (process.env.CAD_API_URL && process.env.CAD_API_KEY) {
  integrationFramework.initializeCAD({
    apiUrl: process.env.CAD_API_URL,
    apiKey: process.env.CAD_API_KEY,
  });
}

if (process.env.WEARABLE_API_URL) {
  integrationFramework.initializeWearable({
    apiUrl: process.env.WEARABLE_API_URL,
    apiKey: process.env.WEARABLE_API_KEY || null,
  });
}

logger.info('Integration Framework initialized');

// ============================================
// 3. API ENDPOINTS (Add after existing endpoints)
// ============================================

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
app.post('/api/coordination/analyze', async (req, res) => {
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

app.post('/api/location/route-deviation', async (req, res) => {
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

    // Update route history
    locationIntelligence.updateRouteHistory(officerName, currentRoute);

    res.json({ success: true, deviation });
  } catch (error) {
    logger.error('Route deviation analysis error', error);
    res.status(500).json({ error: error.message });
  }
});

// Temporal Analysis
app.post('/api/temporal/analyze', async (req, res) => {
  try {
    const { signals = [], options = {} } = req.body;
    
    const timeOfDay = temporalAnalysis.correlateTimeOfDay(signals, options);
    
    res.json({ success: true, timeOfDay });
  } catch (error) {
    logger.error('Temporal analysis error', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/temporal/trends', async (req, res) => {
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
app.post('/api/signals/correlate', async (req, res) => {
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

app.post('/api/signals/historical-match', async (req, res) => {
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
    res.json({ success: true });
  } catch (error) {
    logger.error('Feedback error', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// 4. SOCKET.IO EVENTS (Add to socket connection handler)
// ============================================

// Enhanced Audio Signals
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

// Coordination Signals
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

// Location Signals
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
