const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

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
  socket.on('THREAT_DETECTED', (data) => {
    log(`THREAT_DETECTED received from ${socket.id}`);
    log(`Threat data: ${JSON.stringify(data)}`);
    
    // Broadcast DASHBOARD_ALERT to all connected web clients (dashboards)
    io.emit('DASHBOARD_ALERT', data);
    log(`DASHBOARD_ALERT broadcasted to all connected clients`);
  });

  // Listen for alert clear from mobile clients
  socket.on('ALERT_CLEARED', () => {
    log(`ALERT_CLEARED received from ${socket.id}`);
    io.emit('DASHBOARD_CLEAR', {});
    log(`DASHBOARD_CLEAR broadcasted to all connected clients`);
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

// Start server
server.listen(PORT, () => {
  log(`Bridge Server running on port ${PORT}`);
  log(`Waiting for connections...`);
});

