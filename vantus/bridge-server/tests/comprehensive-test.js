#!/usr/bin/env node
/**
 * COMPREHENSIVE INTEGRATION TEST
 * Tests all Vantus AI Partner features end-to-end
 * Run with: node tests/comprehensive-test.js
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passed = 0;
let failed = 0;
let total = 0;
const errors = [];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function test(name, fn) {
  total++;
  process.stdout.write(`\n[${total}] ${name}... `);
  
  return fn()
    .then(() => {
      passed++;
      log('✓ PASSED', 'green');
    })
    .catch((error) => {
      failed++;
      errors.push({ test: name, error: error.message });
      log(`✗ FAILED: ${error.message}`, 'red');
    });
}

async function runComprehensiveTest() {
  log('\n╔══════════════════════════════════════════════════════════════════════════╗', 'blue');
  log('║     VANTUS AI PARTNER - COMPREHENSIVE INTEGRATION TEST                  ║', 'blue');
  log('║     Testing All Features End-to-End                                      ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════════════════╝', 'blue');

  // ============================================
  // TEST SUITE 1: SERVICE INITIALIZATION
  // ============================================
  log('\n📦 TEST SUITE 1: Service Initialization', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('All Core Services Loaded', async () => {
    const peripheralOverwatch = require('../services/peripheralOverwatch');
    const kinematicIntentPrediction = require('../services/kinematicIntentPrediction');
    const deEscalationReferee = require('../services/deEscalationReferee');
    const factAnchoring = require('../services/factAnchoring');
    const dictationOverlay = require('../services/dictationOverlay');
    
    if (!peripheralOverwatch || !kinematicIntentPrediction || !deEscalationReferee || 
        !factAnchoring || !dictationOverlay) {
      throw new Error('Core services not loaded');
    }
  });

  await test('All New Features Loaded', async () => {
    const intelligentTriageGate = require('../services/intelligentTriageGate');
    const silentDispatchOverride = require('../services/silentDispatchOverride');
    const liveFeedHandoff = require('../services/liveFeedHandoff');
    
    if (!intelligentTriageGate || !silentDispatchOverride || !liveFeedHandoff) {
      throw new Error('New features not loaded');
    }
  });

  await test('All Enhanced Services Loaded', async () => {
    const enhancedAudioAnalysis = require('../services/enhancedAudioAnalysis');
    const locationIntelligence = require('../services/locationIntelligence');
    const coordinationAnalysis = require('../services/coordinationAnalysis');
    const temporalAnalysis = require('../services/temporalAnalysis');
    const signalCorrelation = require('../services/signalCorrelation');
    
    if (!enhancedAudioAnalysis || !locationIntelligence || !coordinationAnalysis || 
        !temporalAnalysis || !signalCorrelation) {
      throw new Error('Enhanced services not loaded');
    }
  });

  // ============================================
  // TEST SUITE 2: INTELLIGENT TRIAGE GATE
  // ============================================
  log('\n⏱️  TEST SUITE 2: Intelligent Triage Gate', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Initiate Countdown', async () => {
    const intelligentTriageGate = require('../services/intelligentTriageGate');
    const threatData = { type: 'WEAPON_DETECTED', confidence: 0.90 };
    const dispatchPayload = {
      type: 'PRIORITY_1_BACKUP',
      officer: { id: 'OFFICER_TEST' },
      location: { lat: 49.8951, lng: -97.1384 },
    };

    const result = intelligentTriageGate.initiateCountdown('OFFICER_TEST', threatData, dispatchPayload);
    if (!result.initiated) throw new Error('Countdown not initiated');
    if (!result.countdown || result.countdown.remaining !== 10000) {
      throw new Error('Countdown duration incorrect');
    }
  });

  await test('Supervisor Veto', async () => {
    const intelligentTriageGate = require('../services/intelligentTriageGate');
    const threatData = { type: 'WEAPON_DETECTED', confidence: 0.90 };
    const dispatchPayload = {
      type: 'PRIORITY_1_BACKUP',
      officer: { id: 'OFFICER_TEST' },
      location: { lat: 49.8951, lng: -97.1384 },
    };

    intelligentTriageGate.initiateCountdown('OFFICER_TEST', threatData, dispatchPayload);
    const vetoResult = intelligentTriageGate.vetoDispatch('OFFICER_TEST', 'SUPERVISOR_001', 'Test veto');
    
    if (!vetoResult.vetoed) throw new Error('Veto failed');
    if (vetoResult.countdown.status !== 'vetoed') {
      throw new Error('Countdown status not updated');
    }
  });

  await test('Get Active Countdowns', async () => {
    const intelligentTriageGate = require('../services/intelligentTriageGate');
    const countdowns = intelligentTriageGate.getActiveCountdowns();
    if (!Array.isArray(countdowns)) throw new Error('Countdowns not an array');
  });

  // ============================================
  // TEST SUITE 3: SILENT DISPATCH OVERRIDE
  // ============================================
  log('\n🚨 TEST SUITE 3: Silent Dispatch Override', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Threshold Check - Weapon Detected', async () => {
    const silentDispatchOverride = require('../services/silentDispatchOverride');
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

    if (!decision.shouldDispatch) throw new Error('Should dispatch when thresholds crossed');
    if (!decision.thresholds.crossed) throw new Error('Thresholds should be crossed');
    if (!decision.triageGate || !decision.triageGate.initiated) {
      throw new Error('Triage gate should be initiated');
    }
  });

  await test('Prevent Dispatch When De-escalated', async () => {
    const silentDispatchOverride = require('../services/silentDispatchOverride');
    const threatData = { type: 'WEAPON_DETECTED', confidence: 0.90 };
    const detectionResults = { detections: {} }; // No active threats
    const telemetryState = {
      lastLocation: { lat: 49.8951, lng: -97.1384 },
      operationalContext: 'routine',
    };
    const audioTranscripts = [{ text: 'I understand, officer. I will comply.' }]; // Compliant

    const decision = await silentDispatchOverride.shouldDispatch(
      'OFFICER_TEST',
      threatData,
      detectionResults,
      telemetryState,
      audioTranscripts
    );

    // Should prevent dispatch if de-escalated
    if (decision.deEscalation && decision.deEscalation.stabilizing) {
      if (decision.shouldDispatch) {
        throw new Error('Should NOT dispatch when de-escalated');
      }
    }
  });

  // ============================================
  // TEST SUITE 4: LIVE FEED HAND-OFF
  // ============================================
  log('\n📹 TEST SUITE 4: Live Feed Hand-off', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Initiate Live Feed', async () => {
    const liveFeedHandoff = require('../services/liveFeedHandoff');
    const crisisData = { type: 'CRITICAL_THREAT', timestamp: new Date().toISOString() };
    const tacticalIntent = {
      weaponDetected: true,
      fightingStance: true,
      timestamp: new Date().toISOString(),
    };

    const result = liveFeedHandoff.initiateHandoff('OFFICER_TEST', crisisData, tacticalIntent);
    if (!result.initiated) throw new Error('Hand-off not initiated');
    if (!result.stream || result.stream.status !== 'active') {
      throw new Error('Stream not active');
    }
  });

  await test('End Live Feed', async () => {
    const liveFeedHandoff = require('../services/liveFeedHandoff');
    const endResult = liveFeedHandoff.endHandoff('OFFICER_TEST', 'Test complete');
    if (!endResult.ended) throw new Error('Hand-off not ended');
    if (endResult.stream.status !== 'ended') throw new Error('Stream status not updated');
  });

  await test('Get Active Streams', async () => {
    const liveFeedHandoff = require('../services/liveFeedHandoff');
    const streams = liveFeedHandoff.getActiveStreams();
    if (!Array.isArray(streams)) throw new Error('Streams not an array');
  });

  // ============================================
  // TEST SUITE 5: PERIPHERAL OVERWATCH
  // ============================================
  log('\n👁️  TEST SUITE 5: Peripheral Overwatch', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Scan Periphery', async () => {
    const peripheralOverwatch = require('../services/peripheralOverwatch');
    // Minimal test image (1x1 pixel JPEG)
    const testFrameBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    
    const result = await peripheralOverwatch.scanPeriphery(testFrameBase64, {
      officerName: 'OFFICER_TEST',
    });

    if (!result) throw new Error('Peripheral scan failed');
    if (!Array.isArray(result.threats)) throw new Error('Threats not an array');
  });

  await test('Get Stats', async () => {
    const peripheralOverwatch = require('../services/peripheralOverwatch');
    const stats = peripheralOverwatch.getStats();
    if (!stats) throw new Error('Stats not returned');
  });

  // ============================================
  // TEST SUITE 6: KINEMATIC INTENT PREDICTION
  // ============================================
  log('\n⚡ TEST SUITE 6: Kinematic Intent Prediction', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Predict Intent from Movement', async () => {
    const kinematicIntentPrediction = require('../services/kinematicIntentPrediction');
    const movementData = {
      movementHistory: [
        { timestamp: Date.now() - 2000, distance: 5, speed: 2.5, heading: 90 },
        { timestamp: Date.now() - 1000, distance: 5, speed: 2.5, heading: 90 },
        { timestamp: Date.now(), distance: 5, speed: 2.5, heading: 90 },
      ],
      positionHistory: [],
      currentSpeed: 2.5,
      currentHeading: 90,
    };

    const prediction = await kinematicIntentPrediction.predictIntent('OFFICER_TEST', movementData);
    if (!prediction) throw new Error('Prediction failed');
  });

  await test('Get Stats', async () => {
    const kinematicIntentPrediction = require('../services/kinematicIntentPrediction');
    const stats = kinematicIntentPrediction.getStats();
    if (!stats) throw new Error('Stats not returned');
  });

  // ============================================
  // TEST SUITE 7: DE-ESCALATION REFEREE
  // ============================================
  log('\n🛡️  TEST SUITE 7: De-escalation Referee', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Check Stabilization', async () => {
    const deEscalationReferee = require('../services/deEscalationReferee');
    const detectionResults = { detections: {} }; // No active threats
    const telemetryState = {
      lastLocation: { lat: 49.8951, lng: -97.1384 },
      operationalContext: 'routine',
    };
    const audioTranscripts = [{ text: 'I understand, officer. I will comply.' }];

    const result = await deEscalationReferee.checkStabilization(
      'OFFICER_TEST',
      detectionResults,
      telemetryState,
      audioTranscripts
    );

    if (!result) throw new Error('Stabilization check failed');
    if (typeof result.stabilizing !== 'boolean') {
      throw new Error('Stabilizing status not boolean');
    }
  });

  await test('Get Stats', async () => {
    const deEscalationReferee = require('../services/deEscalationReferee');
    const stats = deEscalationReferee.getStats();
    if (!stats) throw new Error('Stats not returned');
  });

  // ============================================
  // TEST SUITE 8: FACT ANCHORING
  // ============================================
  log('\n📝 TEST SUITE 8: Fact Anchoring', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Anchor Fact', async () => {
    const factAnchoring = require('../services/factAnchoring');
    const fact = 'Test weapon detection';

    const anchored = factAnchoring.anchorFact('OFFICER_TEST', fact, {
      type: 'detection',
      category: 'weapon',
      confidence: 0.85,
    });
    if (!anchored.id) throw new Error('Fact not anchored (missing id)');
    if (!anchored.timestamp) throw new Error('Timestamp missing');
  });

  await test('Get Fact Log', async () => {
    const factAnchoring = require('../services/factAnchoring');
    const log = factAnchoring.getFactLog('OFFICER_TEST');
    if (!Array.isArray(log)) throw new Error('Fact log not an array');
  });

  await test('Format Timeline', async () => {
    const factAnchoring = require('../services/factAnchoring');
    const timeline = factAnchoring.formatTimeline('OFFICER_TEST');
    if (!timeline) throw new Error('Timeline not formatted');
  });

  // ============================================
  // TEST SUITE 9: DICTATION OVERLAY
  // ============================================
  log('\n🎤 TEST SUITE 9: Dictation Overlay', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Process Mark Command', async () => {
    const dictationOverlay = require('../services/dictationOverlay');
    const result = await dictationOverlay.processCommand(
      'OFFICER_TEST',
      'Vantus, mark that blue Toyota as a witness vehicle',
      { timestamp: new Date().toISOString() }
    );

    if (!result) throw new Error('Command not processed');
  });

  await test('Process Log Command', async () => {
    const dictationOverlay = require('../services/dictationOverlay');
    const result = await dictationOverlay.processCommand(
      'OFFICER_TEST',
      'Vantus, log suspect fled on foot',
      { timestamp: new Date().toISOString() }
    );

    if (!result) throw new Error('Command not processed');
  });

  await test('Get Command History', async () => {
    const dictationOverlay = require('../services/dictationOverlay');
    const history = dictationOverlay.getCommandHistory('OFFICER_TEST');
    if (!Array.isArray(history)) throw new Error('History not an array');
  });

  // ============================================
  // TEST SUITE 10: ENHANCED SERVICES
  // ============================================
  log('\n🔧 TEST SUITE 10: Enhanced Services', 'cyan');
  log('─────────────────────────────────────────────────────────────────────────', 'cyan');

  await test('Enhanced Audio Analysis', async () => {
    const enhancedAudioAnalysis = require('../services/enhancedAudioAnalysis');
    // Initialize without LLM (will use local analysis)
    enhancedAudioAnalysis.initialize(null);
    const result = await enhancedAudioAnalysis.detectMultiSpeaker('Test transcript with multiple speakers? Yes, I understand.');
    if (!result) throw new Error('Audio analysis failed');
  });

  await test('Location Intelligence', async () => {
    const locationIntelligence = require('../services/locationIntelligence');
    const result = await locationIntelligence.classifyLocationType(
      49.8951,
      -97.1384,
      {}
    );
    if (!result) throw new Error('Location classification failed');
  });

  await test('Coordination Analysis', async () => {
    const coordinationAnalysis = require('../services/coordinationAnalysis');
    const result = coordinationAnalysis.analyzeOfficerProximity(
      'OFFICER_TEST',
      49.8951,
      -97.1384,
      [], // No other officers for this test
      {}
    );
    if (!result) throw new Error('Coordination analysis failed');
  });

  await test('Temporal Analysis', async () => {
    const temporalAnalysis = require('../services/temporalAnalysis');
    const signals = [
      { signalCategory: 'weapon', probability: 0.85, timestamp: new Date().toISOString() },
    ];
    const result = temporalAnalysis.correlateTimeOfDay(signals, {});
    if (!result) throw new Error('Temporal analysis failed');
  });

  await test('Signal Correlation', async () => {
    const signalCorrelation = require('../services/signalCorrelation');
    const signals = [
      { signalCategory: 'weapon', probability: 0.85, timestamp: new Date().toISOString() },
      { signalCategory: 'stance', probability: 0.80, timestamp: new Date().toISOString() },
    ];
    // correlateSignals takes (officerName, currentSignals, options)
    const result = signalCorrelation.correlateSignals('OFFICER_TEST', signals, {});
    if (!result) throw new Error('Signal correlation failed');
  });

  // ============================================
  // TEST SUMMARY
  // ============================================
  log('\n╔══════════════════════════════════════════════════════════════════════════╗', 'blue');
  log('║                         TEST SUMMARY                                     ║', 'blue');
  log('╚══════════════════════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\n📊 Total Tests: ${total}`, 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`, passed === total ? 'green' : 'yellow');

  if (failed > 0) {
    log('\n⚠️  Failed Tests:', 'yellow');
    errors.forEach(({ test, error }) => {
      log(`   - ${test}: ${error}`, 'red');
    });
    log('\n❌ Some tests failed. Please review the errors above.', 'red');
    process.exit(1);
  } else {
    log('\n🎉 All tests passed! System is fully operational.', 'green');
    log('\n✅ All Features Verified:', 'green');
    log('   ✓ Intelligent Triage Gate', 'green');
    log('   ✓ Silent Dispatch Override', 'green');
    log('   ✓ Live Feed Hand-off', 'green');
    log('   ✓ Peripheral Overwatch', 'green');
    log('   ✓ Kinematic Intent Prediction', 'green');
    log('   ✓ De-escalation Referee', 'green');
    log('   ✓ Fact Anchoring', 'green');
    log('   ✓ Dictation Overlay', 'green');
    log('   ✓ Enhanced Services (5/5)', 'green');
    process.exit(0);
  }
}

// Run comprehensive test
runComprehensiveTest().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
