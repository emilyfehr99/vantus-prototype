const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cadRelay = require('./services/cadRelay');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Helper function to get timestamp
function getTimestamp() {
  return new Date().toISOString();
}

// Log function with timestamp
function log(message) {
  console.log(`[${getTimestamp()}] ${message}`);
}

// Socket.io connection handling
io.on('connection', (socket) => {
  log(`Client connected: ${socket.id}`);

  // Listen for THREAT_DETECTED from mobile clients
  socket.on('THREAT_DETECTED', async (data) => {
    log(`THREAT_DETECTED received from ${socket.id}`);
    log(`Threat data: ${JSON.stringify(data)}`);
    
    // Broadcast DASHBOARD_ALERT to all connected web clients (dashboards)
    io.emit('DASHBOARD_ALERT', data);
    log(`DASHBOARD_ALERT broadcasted to all connected clients`);
    
    // Send to CAD system (if configured)
    if (cadRelay.isConfigured()) {
      try {
        const cadResult = await cadRelay.sendToCAD(data);
        if (cadResult.success) {
          log(`CAD alert sent successfully: ${cadResult.cadCallId}`);
        } else {
          log(`CAD alert failed: ${cadResult.error}`);
        }
      } catch (error) {
        log(`CAD relay error: ${error.message}`);
      }
    }
  });

  // Listen for alert clear from mobile clients
  socket.on('ALERT_CLEARED', () => {
    log(`ALERT_CLEARED received from ${socket.id}`);
    io.emit('DASHBOARD_CLEAR', {});
    log(`DASHBOARD_CLEAR broadcasted to all connected clients`);
  });

  // Listen for backup dispatch from dashboard
  socket.on('DISPATCH_BACKUP', (data) => {
    log(`DISPATCH_BACKUP received from ${socket.id}`);
    log(`Backup data: ${JSON.stringify(data)}`);
    
    // Broadcast BACKUP_CONFIRMED to the specific officer
    if (data.officerName) {
      io.emit('BACKUP_CONFIRMED', {
        officerName: data.officerName,
        priority: data.priority || 1,
        eta: data.eta || 'unknown',
        message: data.message || `Officer ${data.officerName}, Priority ${data.priority || 1} Backup is en route. ETA ${data.eta || 'unknown'} minutes.`
      });
      log(`BACKUP_CONFIRMED broadcasted for ${data.officerName}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    log(`Client disconnected: ${socket.id}`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: getTimestamp() });
});

// CAD status endpoint
app.get('/cad/status', (req, res) => {
  res.json({
    cad: cadRelay.getInfo(),
    timestamp: getTimestamp()
  });
});

// Start server
server.listen(PORT, () => {
  log(`Bridge Server running on port ${PORT}`);
  log(`Waiting for connections...`);
});

