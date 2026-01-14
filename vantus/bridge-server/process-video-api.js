/**
 * Process Video via API Endpoint
 * Shows how to process video through the bridge server API
 * This simulates what the mobile app would do
 */

const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const path = require('path');

async function processVideoViaAPI(videoPath, bridgeServerUrl = 'http://localhost:3001') {
  try {
    console.log('\n🎥 Processing Video via API...\n');
    console.log(`Video: ${videoPath}`);
    console.log(`Server: ${bridgeServerUrl}\n`);
    
    // Check if video exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    
    // Create form data
    const form = new FormData();
    form.append('video', fs.createReadStream(videoPath));
    form.append('interval', '1'); // 1 frame per second
    form.append('officerName', 'OFFICER_TEST');
    
    console.log('📤 Uploading video to server...');
    
    // Upload and process
    const response = await fetch(`${bridgeServerUrl}/api/video/process`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Server processing failed');
    }
    
    const result = await response.json();
    
    console.log('\n✅ Video Processing Complete!\n');
    console.log('📊 Results:');
    console.log(`  Total Frames: ${result.summary.totalFrames}`);
    console.log(`  Video Duration: ${result.metadata.duration.toFixed(2)} seconds`);
    console.log(`  Resolution: ${result.metadata.width}x${result.metadata.height}`);
    console.log(`  Frame Interval: ${result.summary.interval} second(s)`);
    console.log(`  Frames Extracted: ${result.frames.length}\n`);
    
    console.log('📸 Sample Frames:');
    result.frames.slice(0, 3).forEach((frame, index) => {
      console.log(`  Frame ${frame.frameNumber}: ${frame.videoTime.toFixed(1)}s`);
      console.log(`    - Base64 data length: ${frame.base64.length} characters`);
    });
    if (result.frames.length > 3) {
      console.log(`  ... and ${result.frames.length - 3} more frames\n`);
    }
    
    console.log('💡 Next Steps:');
    console.log('  - Frames are now ready for detection processing');
    console.log('  - Each frame would be analyzed by detection models');
    console.log('  - Results would include weapon, stance, hand, and audio detections\n');
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the bridge server is running:');
      console.error('   cd vantus/bridge-server && npm start\n');
    }
    process.exit(1);
  }
}

// Get video path from command line
const videoPath = process.argv[2] || '/Users/emilyfehr8/Desktop/Untitled.mp4';
const serverUrl = process.argv[3] || 'http://localhost:3001';

// Check if node-fetch is available (for Node.js < 18)
if (typeof fetch === 'undefined') {
  console.error('❌ node-fetch is required. Install it with: npm install node-fetch@2');
  process.exit(1);
}

processVideoViaAPI(videoPath, serverUrl);
