/**
 * Show Detection Results
 * Displays detection results in a readable format
 */

const fs = require('fs');
const path = require('path');

const resultsFile = process.argv[2] || 'test-video-results-sample-detections.json';

if (!fs.existsSync(resultsFile)) {
  console.error(`Results file not found: ${resultsFile}`);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

console.log('\n🎯 DETECTION RESULTS');
console.log('='.repeat(60));
console.log(`\n📹 Video: ${results.videoMetadata.duration.toFixed(2)}s`);
console.log(`   Resolution: ${results.videoMetadata.width}x${results.videoMetadata.height}`);
console.log(`   Format: ${results.videoMetadata.format}`);

console.log(`\n📊 Summary:`);
console.log(`   Total Frames: ${results.summary.totalFrames}`);
console.log(`   Frames Processed: ${results.summary.framesProcessed}`);
console.log(`   Detections Found: ${results.summary.detectionsFound}`);

if (results.summary.detectionTypes) {
  console.log(`\n   Detection Types:`);
  console.log(`     Weapons: ${results.summary.detectionTypes.weapon}`);
  console.log(`     Stance: ${results.summary.detectionTypes.stance}`);
  console.log(`     Hands: ${results.summary.detectionTypes.hands}`);
}

if (results.detections && results.detections.length > 0) {
  console.log(`\n🎬 Detection Timeline:`);
  results.detections.forEach(det => {
    const conf = (det.detection.confidence * 100).toFixed(1);
    const desc = det.detection.description || det.detection.type || det.detection.pattern || '';
    console.log(`   ${det.videoTime.toFixed(1)}s - Frame ${det.frameNumber}: ${det.type.toUpperCase()}`);
    console.log(`     Confidence: ${conf}%`);
    console.log(`     Description: ${desc}`);
    console.log('');
  });
} else {
  console.log(`\n⚠️  No detections found above threshold`);
  console.log(`   (This is normal if video has no weapons/stance/hands)`);
}

// Show frames with any detections
const framesWithDetections = results.frames.filter(f => 
  Object.values(f.detections || {}).some(d => d.detected)
);

if (framesWithDetections.length > 0) {
  console.log(`\n📸 Frames with Detections:`);
  framesWithDetections.slice(0, 10).forEach(frame => {
    const detections = Object.entries(frame.detections || {})
      .filter(([_, d]) => d.detected)
      .map(([type, d]) => `${type} (${(d.confidence * 100).toFixed(0)}%)`)
      .join(', ');
    console.log(`   Frame ${frame.frameNumber} (${frame.videoTime.toFixed(1)}s): ${detections}`);
  });
  if (framesWithDetections.length > 10) {
    console.log(`   ... and ${framesWithDetections.length - 10} more frames`);
  }
}

console.log(`\n💾 Results file: ${resultsFile}\n`);
