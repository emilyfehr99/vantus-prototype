/**
 * Full Detection Processing Script
 * Processes extracted video frames through the detection API
 * Uses the actual detection processing pipeline
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('./utils/logger');

async function processDetectionsFull(resultsFile, serverUrl = 'http://localhost:3001') {
  try {
    console.log('\n🔍 Starting Full Detection Processing...\n');
    
    // Load results file
    if (!fs.existsSync(resultsFile)) {
      throw new Error(`Results file not found: ${resultsFile}`);
    }
    
    const results = JSON.parse(await fs.readFile(resultsFile, 'utf8'));
    
    console.log(`📊 Processing ${results.frames.length} frames through detection API...\n`);
    console.log(`Video: ${results.metadata.duration.toFixed(2)} seconds`);
    console.log(`Resolution: ${results.metadata.width}x${results.metadata.height}\n`);
    
    // Prepare frames for processing (keep base64 data)
    const framesForProcessing = results.frames.map(frame => ({
      frameNumber: frame.frameNumber,
      videoTime: frame.videoTime,
      timestamp: frame.timestamp,
      base64: frame.base64, // Keep base64 for processing
    }));
    
    console.log('📤 Sending frames to detection API...\n');
    
    // Process through detection API
    const response = await fetch(`${serverUrl}/api/detections/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frames: framesForProcessing,
        options: {
          officerName: 'OFFICER_TEST',
          enableWeaponDetection: true,
          enableStanceDetection: true,
          enableHandDetection: true,
          enableAudioDetection: false,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Detection processing failed');
    }
    
    const detectionResults = await response.json();
    
    // Display results
    console.log('✅ Detection Processing Complete!\n');
    console.log('📊 Detection Summary:');
    console.log(`  Total Frames: ${detectionResults.summary.totalFrames}`);
    console.log(`  Frames Processed: ${detectionResults.summary.framesProcessed}`);
    console.log(`  Detections Found: ${detectionResults.summary.detectionsFound}`);
    console.log(`  Detection Rate: ${((detectionResults.summary.detectionsFound / detectionResults.summary.framesProcessed) * 100).toFixed(1)}%`);
    console.log('\n  Detection Types:');
    console.log(`    Weapons: ${detectionResults.summary.detectionTypes.weapon}`);
    console.log(`    Stance: ${detectionResults.summary.detectionTypes.stance}`);
    console.log(`    Hands: ${detectionResults.summary.detectionTypes.hands}`);
    console.log(`    Audio: ${detectionResults.summary.detectionTypes.audio}`);
    
    // Show detection timeline
    const detections = detectionResults.results.filter(r => 
      Object.values(r.detections || {}).some(d => d.detected)
    );
    
    if (detections.length > 0) {
      console.log('\n🎯 Detection Timeline:');
      detections.slice(0, 10).forEach(det => {
        const detectedTypes = Object.entries(det.detections || {})
          .filter(([_, d]) => d.detected)
          .map(([type, d]) => `${type} (${(d.confidence * 100).toFixed(1)}%)`)
          .join(', ');
        console.log(`  ${det.videoTime.toFixed(1)}s - Frame ${det.frameNumber}: ${detectedTypes}`);
      });
      if (detections.length > 10) {
        console.log(`  ... and ${detections.length - 10} more detections`);
      }
    } else {
      console.log('\n⚠️  No detections found');
      console.log('  Note: Detection models need to be loaded for actual detection');
      console.log('  Current implementation shows detection structure ready for model integration');
    }
    
    // Save results
    const outputFile = resultsFile.replace('.json', '-detections-full.json');
    await fs.writeFile(outputFile, JSON.stringify(detectionResults, null, 2));
    console.log(`\n💾 Full results saved to: ${outputFile}\n`);
    
    return detectionResults;
    
  } catch (error) {
    console.error('\n❌ Error processing detections:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the bridge server is running:');
      console.error('   cd vantus/bridge-server && npm start\n');
    }
    logger.error('Detection processing failed', error);
    process.exit(1);
  }
}

// Get results file from command line or use latest
const resultsFile = process.argv[2] || 
  path.join(__dirname, 'video-processing-results-1768418037.json');
const serverUrl = process.argv[3] || 'http://localhost:3001';

// Process detections
processDetectionsFull(resultsFile, serverUrl);
