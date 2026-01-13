const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const auditLogger = require('./services/auditLogger');
const cadService = require('./services/cadService');
const geocodingService = require('./services/geocodingService');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json()); // For JSON body parsing

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

// Geocoding Service
if (process.env.GEOCODING_API_URL) {
  geocodingService.initialize(
    process.env.GEOCODING_API_URL,
    process.env.GEOCODING_API_KEY || null
  );
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
    
    auditLogger.log({
      eventType: 'EMERGENCY_DISPATCH',
      officerName: dispatchPayload.officer?.id,
      dispatchPayload: dispatchPayload,
    });
    
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
  });

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

// Start server
server.listen(PORT, () => {
  log(`Bridge Server running on port ${PORT}`);
  log(`Waiting for connections...`);
});

