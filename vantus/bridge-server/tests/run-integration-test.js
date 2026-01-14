#!/usr/bin/env node
/**
 * Standalone Integration Test Runner
 * Can be run without Jest: node tests/run-integration-test.js
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

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let passed = 0;
let failed = 0;
let total = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  total++;
  process.stdout.write(`\n[${total}] Testing: ${name}... `);
  
  return fn()
    .then(() => {
      passed++;
      log('✓ PASSED', 'green');
    })
    .catch((error) => {
      failed++;
      log(`✗ FAILED: ${error.message}`, 'red');
      if (error.stack) {
        console.error(error.stack);
      }
    });
}

async function runTests() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'blue');
  log('║  VANTUS AI PARTNER - COMPREHENSIVE INTEGRATION TEST        ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════╝', 'blue');

  // Test 1: Service Initialization
  await test('Service Initialization', async () => {
    const services = [
      peripheralOverwatch,
      kinematicIntentPrediction,
      deEscalationReferee,
      factAnchoring,
      dictationOverlay,
      intelligentTriageGate,
      silentDispatchOverride,
      liveFeedHandoff,
      enhancedAudioAnalysis,
      locationIntelligence,
      coordinationAnalysis,
      temporalAnalysis,
      signalCorrelation,
    ];

    services.forEach(service => {
      if (!service) throw new Error('Service not initialized');
    });
  });

  // Test 2: Intelligent Triage Gate
  await test('Intelligent Triage Gate - Initiate and Veto', async () => {
    const threatData = { type: 'WEAPON_DETECTED', confidence: 0.90 };
    const dispatchPayload = {
      type: 'PRIORITY_1_BACKUP',
      officer: { id: 'OFFICER_TEST' },
      location: { lat: 49.8951, lng: -97.1384 },
    };

    const result = intelligentTriageGate.initiateCountdown('OFFICER_TEST', threatData, dispatchPayload);
    if (!result.initiated) throw new Error('Countdown not initiated');

    const vetoResult = intelligentTriageGate.vetoDispatch('OFFICER_TEST', 'SUPERVISOR_001', 'Test veto');
    if (!vetoResult.vetoed) throw new Error('Veto failed');
  });

  // Test 3: Silent Dispatch Override
  await test('Silent Dispatch Override - Threshold Check', async () => {
    const threatData = { type: 'WEAPON_DETECTED', confidence: 0.90 };
    const detectionResults = {
      detections: { weapon: { detected: true, confidence: 0.90 } },
    };
    const telemetryState = {
      lastLocation: { lat: 49.8951, lng: -97.1384 },
      currentHeartRate: 165,
      calibrationData: { heartRateBaseline: 70 },
    };

    const decision = await silentDispatchOverride.shouldDispatch(
      'OFFICER_TEST',
      threatData,
      detectionResults,
      telemetryState,
      []
    );

    if (!decision.shouldDispatch) {
      throw new Error('Should dispatch when thresholds crossed');
    }
    if (!decision.thresholds.crossed) {
      throw new Error('Thresholds should be crossed');
    }
  });

  // Test 4: Live Feed Hand-off
  await test('Live Feed Hand-off - Initiate and End', async () => {
    const crisisData = { type: 'CRITICAL_THREAT', timestamp: new Date().toISOString() };
    const tacticalIntent = {
      weaponDetected: true,
      fightingStance: true,
      timestamp: new Date().toISOString(),
    };

    const result = liveFeedHandoff.initiateHandoff('OFFICER_TEST', crisisData, tacticalIntent);
    if (!result.initiated) throw new Error('Hand-off not initiated');

    const endResult = liveFeedHandoff.endHandoff('OFFICER_TEST', 'Test complete');
    if (!endResult.ended) throw new Error('Hand-off not ended');
  });

  // Test 5: Fact Anchoring
  await test('Fact Anchoring - Anchor and Retrieve', async () => {
    const fact = {
      type: 'detection',
      category: 'weapon',
      description: 'Test weapon detection',
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    };

    const anchored = await factAnchoring.anchorFact('OFFICER_TEST', fact, {});
    if (!anchored.factId) throw new Error('Fact not anchored');

    const log = factAnchoring.getFactLog('OFFICER_TEST');
    if (!Array.isArray(log)) throw new Error('Fact log not retrieved');
  });

  // Test 6: Dictation Overlay
  await test('Dictation Overlay - Process Command', async () => {
    const result = await dictationOverlay.processCommand(
      'OFFICER_TEST',
      'Vantus, mark that blue Toyota as a witness vehicle',
      { timestamp: new Date().toISOString() }
    );

    if (!result) throw new Error('Command not processed');
  });

  // Test 7: Enhanced Services
  await test('Enhanced Audio Analysis', async () => {
    const result = await enhancedAudioAnalysis.detectMultiSpeaker('Test transcript');
    if (!result) throw new Error('Audio analysis failed');
  });

  await test('Location Intelligence', async () => {
    const result = await locationIntelligence.classifyLocation(
      { lat: 49.8951, lng: -97.1384 },
      {}
    );
    if (!result) throw new Error('Location classification failed');
  });

  await test('Coordination Analysis', async () => {
    const result = await coordinationAnalysis.analyzeProximity(
      'OFFICER_TEST',
      { lat: 49.8951, lng: -97.1384 }
    );
    if (!result) throw new Error('Coordination analysis failed');
  });

  await test('Temporal Analysis', async () => {
    const signals = [
      { signalCategory: 'weapon', probability: 0.85, timestamp: new Date().toISOString() },
    ];
    const result = await temporalAnalysis.analyzeTimeCorrelation(signals, new Date().toISOString());
    if (!result) throw new Error('Temporal analysis failed');
  });

  await test('Signal Correlation', async () => {
    const signals = [
      { signalCategory: 'weapon', probability: 0.85, timestamp: new Date().toISOString() },
      { signalCategory: 'stance', probability: 0.80, timestamp: new Date().toISOString() },
    ];
    const result = await signalCorrelation.correlateSignals(signals, {
      officerName: 'OFFICER_TEST',
      timestamp: new Date().toISOString(),
    });
    if (!result) throw new Error('Signal correlation failed');
  });

  // Test 8: Socket.io Integration Test
  await test('Socket.io - Event Flow', async () => {
    return new Promise((resolve, reject) => {
      const httpServer = createServer();
      const io = new Server(httpServer, { cors: { origin: '*' } });

      // Setup basic handlers
      io.on('connection', (socket) => {
        socket.on('PERIPHERAL_SCAN_REQUEST', async (data) => {
          const result = await peripheralOverwatch.scanPeriphery(data.frameBase64, {
            officerName: data.officerName,
            ...data.context,
          });
          if (result.threats && result.threats.length > 0) {
            io.emit('PERIPHERAL_THREAT', {
              officerName: data.officerName,
              threats: result.threats,
              timestamp: new Date().toISOString(),
            });
          }
        });
      });

      httpServer.listen(0, () => {
        const port = httpServer.address().port;
        const client = ioClient(`http://localhost:${port}`);

        client.on('connect', () => {
          client.on('PERIPHERAL_THREAT', () => {
            client.close();
            io.close();
            httpServer.close();
            resolve();
          });

          // Send test request
          client.emit('PERIPHERAL_SCAN_REQUEST', {
            officerName: 'OFFICER_TEST',
            frameBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
            context: {},
            timestamp: new Date().toISOString(),
          });
        });

        setTimeout(() => {
          client.close();
          io.close();
          httpServer.close();
          reject(new Error('Socket.io test timeout'));
        }, 5000);
      });
    });
  });

  // Print Summary
  log('\n╔══════════════════════════════════════════════════════════════╗', 'blue');
  log('║                      TEST SUMMARY                             ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════╝', 'blue');
  log(`\nTotal Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, passed === total ? 'green' : 'yellow');

  if (failed > 0) {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
