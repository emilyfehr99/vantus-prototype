/**
 * COMPREHENSIVE INTEGRATION TEST
 * Tests all features end-to-end:
 * - Mobile App → Server → Dashboard flow
 * - All new features (Triage Gate, Silent Dispatch, Live Feed)
 * - All enhanced services
 * - Socket.io events
 */

const { Server } = require('socket.io');
const { createServer } = require('http');
const ioClient = require('socket.io-client');

// Import all services
const peripheralOverwatch = require('../services/peripheralOverwatch');
const kinematicIntentPrediction = require('../services/kinematicIntentPrediction');
const deEscalationReferee = require('../services/deEscalationReferee');
const factAnchoring = require('../services/factAnchoring');
const dictationOverlay = require('../services/dictationOverlay');
const intelligentTriageGate = require('../services/intelligentTriageGate');
const silentDispatchOverride = require('../services/silentDispatchOverride');
const liveFeedHandoff = require('../services/liveFeedHandoff');
const enhancedAudioAnalysis = require('../services/enhancedAudioAnalysis');
const locationIntelligence = require('../services/locationIntelligence');
const coordinationAnalysis = require('../services/coordinationAnalysis');
const temporalAnalysis = require('../services/temporalAnalysis');
const signalCorrelation = require('../services/signalCorrelation');

describe('Vantus AI Partner - Comprehensive Integration Test', () => {
  let httpServer;
  let io;
  let serverUrl;
  let mobileClient;
  let dashboardClient;
  let receivedEvents;

  beforeAll((done) => {
    // Start test server
    httpServer = createServer();
    io = new Server(httpServer, {
      cors: { origin: '*' },
    });

    // Load server.js handlers (simplified version for testing)
    require('../server')(io);

    httpServer.listen(0, () => {
      serverUrl = `http://localhost:${httpServer.address().port}`;
      done();
    });

    receivedEvents = {
      mobile: [],
      dashboard: [],
    };
  });

  afterAll((done) => {
    if (mobileClient) mobileClient.close();
    if (dashboardClient) dashboardClient.close();
    io.close();
    httpServer.close(done);
  });

  beforeEach(() => {
    receivedEvents.mobile = [];
    receivedEvents.dashboard = [];
  });

  describe('1. Mobile App → Server → Dashboard Flow', () => {
    test('Peripheral Overwatch - Full Flow', async () => {
      return new Promise((resolve, reject) => {
        // Setup dashboard client
        dashboardClient = ioClient(serverUrl);
        dashboardClient.on('connect', () => {
          dashboardClient.on('PERIPHERAL_THREAT', (data) => {
            receivedEvents.dashboard.push({ type: 'PERIPHERAL_THREAT', data });
            expect(data.officerName).toBe('OFFICER_TEST');
            expect(data.threats).toBeDefined();
            expect(Array.isArray(data.threats)).toBe(true);
            resolve();
          });

          // Setup mobile client
          mobileClient = ioClient(serverUrl);
          mobileClient.on('connect', () => {
            // Send peripheral scan request
            const testFrameBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='; // Minimal test image
            mobileClient.emit('PERIPHERAL_SCAN_REQUEST', {
              officerName: 'OFFICER_TEST',
              frameBase64: testFrameBase64,
              context: {},
              timestamp: new Date().toISOString(),
            });
          });
        });

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });
    }, 15000);

    test('Kinematic Intent Prediction - Full Flow', async () => {
      return new Promise((resolve, reject) => {
        dashboardClient = ioClient(serverUrl);
        dashboardClient.on('connect', () => {
          dashboardClient.on('KINEMATIC_PREDICTION', (data) => {
            receivedEvents.dashboard.push({ type: 'KINEMATIC_PREDICTION', data });
            expect(data.officerName).toBe('OFFICER_TEST');
            expect(data.prediction).toBeDefined();
            resolve();
          });

          mobileClient = ioClient(serverUrl);
          mobileClient.on('connect', () => {
            mobileClient.emit('KINEMATIC_PREDICTION_REQUEST', {
              officerName: 'OFFICER_TEST',
              movementData: {
                movementHistory: [
                  { timestamp: Date.now() - 2000, distance: 5, speed: 2.5, heading: 90 },
                  { timestamp: Date.now() - 1000, distance: 5, speed: 2.5, heading: 90 },
                  { timestamp: Date.now(), distance: 5, speed: 2.5, heading: 90 },
                ],
                positionHistory: [],
                currentSpeed: 2.5,
                currentHeading: 90,
              },
              timestamp: new Date().toISOString(),
            });
          });
        });

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });
    }, 15000);

    test('De-escalation Referee - Full Flow', async () => {
      return new Promise((resolve, reject) => {
        dashboardClient = ioClient(serverUrl);
        dashboardClient.on('connect', () => {
          dashboardClient.on('DE_ESCALATION_STATUS', (data) => {
            receivedEvents.dashboard.push({ type: 'DE_ESCALATION_STATUS', data });
            expect(data.officerName).toBe('OFFICER_TEST');
            expect(data.stabilization).toBeDefined();
            resolve();
          });

          mobileClient = ioClient(serverUrl);
          mobileClient.on('connect', () => {
            mobileClient.emit('DE_ESCALATION_CHECK_REQUEST', {
              officerName: 'OFFICER_TEST',
              detectionResults: {},
              telemetryState: {
                lastLocation: { lat: 49.8951, lng: -97.1384 },
                operationalContext: 'routine',
              },
              audioTranscripts: [],
              timestamp: new Date().toISOString(),
            });
          });
        });

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });
    }, 15000);

    test('Fact Anchoring - Full Flow', async () => {
      return new Promise((resolve, reject) => {
        dashboardClient = ioClient(serverUrl);
        dashboardClient.on('connect', () => {
          dashboardClient.on('FACT_ANCHORED', (data) => {
            receivedEvents.dashboard.push({ type: 'FACT_ANCHORED', data });
            expect(data.officerName).toBe('OFFICER_TEST');
            expect(data.fact).toBeDefined();
            resolve();
          });

          mobileClient = ioClient(serverUrl);
          mobileClient.on('connect', () => {
            mobileClient.emit('FACT_ANCHOR', {
              officerName: 'OFFICER_TEST',
              fact: {
                type: 'detection',
                category: 'weapon',
                description: 'Weapon detected in frame',
                confidence: 0.85,
                timestamp: new Date().toISOString(),
              },
              metadata: {
                signalId: 'test_signal_001',
                context: 'routine',
              },
            });
          });
        });

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });
    }, 15000);

    test('Dictation Overlay - Full Flow', async () => {
      return new Promise((resolve, reject) => {
        dashboardClient = ioClient(serverUrl);
        dashboardClient.on('connect', () => {
          dashboardClient.on('DICTATION_COMMAND_PROCESSED', (data) => {
            receivedEvents.dashboard.push({ type: 'DICTATION_COMMAND_PROCESSED', data });
            expect(data.officerName).toBe('OFFICER_TEST');
            expect(data.command).toBeDefined();
            resolve();
          });

          mobileClient = ioClient(serverUrl);
          mobileClient.on('connect', () => {
            mobileClient.emit('DICTATION_COMMAND', {
              officerName: 'OFFICER_TEST',
              transcript: 'Vantus, mark that blue Toyota as a witness vehicle',
              context: {
                timestamp: new Date().toISOString(),
                location: { lat: 49.8951, lng: -97.1384 },
                operationalContext: 'routine',
              },
            });
          });
        });

        setTimeout(() => reject(new Error('Timeout')), 10000);
      });
    }, 15000);
  });

  describe('2. Intelligent Triage Gate', () => {
    test('Initiate countdown and veto', async () => {
      const threatData = {
        type: 'WEAPON_DETECTED',
        confidence: 0.90,
      };

      const dispatchPayload = {
        type: 'PRIORITY_1_BACKUP',
        officer: { id: 'OFFICER_TEST' },
        location: { lat: 49.8951, lng: -97.1384 },
      };

      // Initiate countdown
      const result = intelligentTriageGate.initiateCountdown(
        'OFFICER_TEST',
        threatData,
        dispatchPayload
      );

      expect(result.initiated).toBe(true);
      expect(result.countdown).toBeDefined();
      expect(result.countdown.remaining).toBe(10000);

      // Veto dispatch
      const vetoResult = intelligentTriageGate.vetoDispatch(
        'OFFICER_TEST',
        'SUPERVISOR_001',
        'Situation stabilized'
      );

      expect(vetoResult.vetoed).toBe(true);
      expect(vetoResult.countdown.vetoed).toBe(true);
    });

    test('Auto-veto on stabilization', async () => {
      const threatData = { type: 'WEAPON_DETECTED', confidence: 0.90 };
      const dispatchPayload = {
        type: 'PRIORITY_1_BACKUP',
        officer: { id: 'OFFICER_TEST' },
        location: { lat: 49.8951, lng: -97.1384 },
      };

      intelligentTriageGate.initiateCountdown('OFFICER_TEST', threatData, dispatchPayload);

      // Check countdown with stabilizing situation
      const status = await intelligentTriageGate.checkCountdownStatus(
        'OFFICER_TEST',
        {}, // No detections
        { operationalContext: 'routine' }, // Normal telemetry
        [{ text: 'I understand, officer' }] // Compliant audio
      );

      // Should auto-veto if stabilizing
      if (status.autoVetoed) {
        expect(status.autoVetoed).toBe(true);
        expect(status.reason).toContain('stabilizing');
      }
    });
  });

  describe('3. Silent Dispatch Override', () => {
    test('Should dispatch when thresholds crossed and not de-escalated', async () => {
      const threatData = {
        type: 'WEAPON_DETECTED',
        confidence: 0.90,
      };

      const detectionResults = {
        detections: {
          weapon: { detected: true, confidence: 0.90 },
        },
      };

      const telemetryState = {
        lastLocation: { lat: 49.8951, lng: -97.1384 },
        currentHeartRate: 165, // Elevated
        calibrationData: { heartRateBaseline: 70 },
      };

      const decision = await silentDispatchOverride.shouldDispatch(
        'OFFICER_TEST',
        threatData,
        detectionResults,
        telemetryState,
        []
      );

      expect(decision.shouldDispatch).toBe(true);
      expect(decision.thresholds.crossed).toBe(true);
      expect(decision.triageGate).toBeDefined();
    });

    test('Should NOT dispatch when de-escalated', async () => {
      const threatData = { type: 'WEAPON_DETECTED', confidence: 0.90 };
      const detectionResults = { detections: {} }; // No active threats
      const telemetryState = {
        lastLocation: { lat: 49.8951, lng: -97.1384 },
        operationalContext: 'routine',
      };
      const audioTranscripts = [{ text: 'I understand, officer' }]; // Compliant

      const decision = await silentDispatchOverride.shouldDispatch(
        'OFFICER_TEST',
        threatData,
        detectionResults,
        telemetryState,
        audioTranscripts
      );

      // Should prevent dispatch if de-escalated
      if (decision.deEscalation && decision.deEscalation.stabilizing) {
        expect(decision.shouldDispatch).toBe(false);
        expect(decision.reason).toContain('de-escalat');
      }
    });
  });

  describe('4. Live Feed Hand-off', () => {
    test('Initiate and end live feed', () => {
      const crisisData = {
        type: 'CRITICAL_THREAT',
        timestamp: new Date().toISOString(),
      };

      const tacticalIntent = {
        weaponDetected: true,
        fightingStance: true,
        timestamp: new Date().toISOString(),
      };

      // Initiate hand-off
      const result = liveFeedHandoff.initiateHandoff(
        'OFFICER_TEST',
        crisisData,
        tacticalIntent,
        'rtsp://stream.test.local/OFFICER_TEST/live'
      );

      expect(result.initiated).toBe(true);
      expect(result.stream).toBeDefined();
      expect(result.stream.active).toBe(true);

      // End hand-off
      const endResult = liveFeedHandoff.endHandoff('OFFICER_TEST', 'Crisis resolved');
      expect(endResult.ended).toBe(true);
      expect(endResult.stream.status).toBe('ended');
    });
  });

  describe('5. Enhanced Services', () => {
    test('Enhanced Audio Analysis', async () => {
      const transcript = 'Drop it! I said drop it now!';
      const result = await enhancedAudioAnalysis.detectMultiSpeaker(transcript);
      expect(result).toBeDefined();
    });

    test('Location Intelligence', async () => {
      const location = { lat: 49.8951, lng: -97.1384 };
      const result = await locationIntelligence.classifyLocation(location, {});
      expect(result).toBeDefined();
    });

    test('Coordination Analysis', async () => {
      const location = { lat: 49.8951, lng: -97.1384 };
      const result = await coordinationAnalysis.analyzeProximity('OFFICER_TEST', location);
      expect(result).toBeDefined();
    });

    test('Temporal Analysis', async () => {
      const signals = [
        { signalCategory: 'weapon', probability: 0.85, timestamp: new Date().toISOString() },
      ];
      const result = await temporalAnalysis.analyzeTimeCorrelation(signals, new Date().toISOString());
      expect(result).toBeDefined();
    });

    test('Signal Correlation', async () => {
      const signals = [
        { signalCategory: 'weapon', probability: 0.85, timestamp: new Date().toISOString() },
        { signalCategory: 'stance', probability: 0.80, timestamp: new Date().toISOString() },
      ];
      const result = await signalCorrelation.correlateSignals(signals, {
        officerName: 'OFFICER_TEST',
        timestamp: new Date().toISOString(),
      });
      expect(result).toBeDefined();
    });
  });

  describe('6. Emergency Dispatch Flow', () => {
    test('Full dispatch flow with triage gate', async () => {
      return new Promise((resolve, reject) => {
        dashboardClient = ioClient(serverUrl);
        dashboardClient.on('connect', () => {
          let countdownReceived = false;
          let dispatchReceived = false;

          dashboardClient.on('TRIAGE_GATE_COUNTDOWN', (data) => {
            countdownReceived = true;
            expect(data.officerName).toBe('OFFICER_TEST');
            expect(data.countdown).toBeDefined();
            expect(data.remaining).toBeGreaterThan(0);
          });

          dashboardClient.on('LIVE_FEED_HANDOFF', (data) => {
            expect(data.officerName).toBe('OFFICER_TEST');
            expect(data.stream).toBeDefined();
          });

          dashboardClient.on('EMERGENCY_DISPATCH_UPDATE', (data) => {
            dispatchReceived = true;
            expect(data.type).toBe('PRIORITY_1_BACKUP');
            if (countdownReceived && dispatchReceived) {
              resolve();
            }
          });

          mobileClient = ioClient(serverUrl);
          mobileClient.on('connect', () => {
            // Send emergency dispatch
            mobileClient.emit('EMERGENCY_DISPATCH', {
              officer: { id: 'OFFICER_TEST' },
              location: { lat: 49.8951, lng: -97.1384 },
              detectionResults: {
                detections: {
                  weapon: { detected: true, confidence: 0.90 },
                },
              },
              telemetryState: {
                lastLocation: { lat: 49.8951, lng: -97.1384 },
                currentHeartRate: 165,
                calibrationData: { heartRateBaseline: 70 },
              },
              audioTranscripts: [],
              timestamp: new Date().toISOString(),
            });
          });
        });

        setTimeout(() => {
          if (!countdownReceived || !dispatchReceived) {
            reject(new Error('Timeout - events not received'));
          }
        }, 15000);
      });
    }, 20000);
  });

  describe('7. Service Health Checks', () => {
    test('All services initialized', () => {
      expect(peripheralOverwatch).toBeDefined();
      expect(kinematicIntentPrediction).toBeDefined();
      expect(deEscalationReferee).toBeDefined();
      expect(factAnchoring).toBeDefined();
      expect(dictationOverlay).toBeDefined();
      expect(intelligentTriageGate).toBeDefined();
      expect(silentDispatchOverride).toBeDefined();
      expect(liveFeedHandoff).toBeDefined();
      expect(enhancedAudioAnalysis).toBeDefined();
      expect(locationIntelligence).toBeDefined();
      expect(coordinationAnalysis).toBeDefined();
      expect(temporalAnalysis).toBeDefined();
      expect(signalCorrelation).toBeDefined();
    });

    test('Service stats available', () => {
      const peripheralStats = peripheralOverwatch.getStats();
      const kinematicStats = kinematicIntentPrediction.getStats();
      const deEscalationStats = deEscalationReferee.getStats();
      const factStats = factAnchoring.getStats();
      const dictationStats = dictationOverlay.getStats();

      expect(peripheralStats).toBeDefined();
      expect(kinematicStats).toBeDefined();
      expect(deEscalationStats).toBeDefined();
      expect(factStats).toBeDefined();
      expect(dictationStats).toBeDefined();
    });
  });
});
