/**
 * Test LLM Vision API
 * Simple test to verify LLM vision is working
 */

const llmVisionService = require('./services/llmVisionService');
const fs = require('fs-extra');
const path = require('path');

async function testLLMVision() {
  try {
    console.log('\n🧪 Testing LLM Vision API...\n');

    // Check for API key
    const apiKey = process.env.LLM_VISION_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('❌ Error: API key not found');
      console.error('   Set LLM_VISION_API_KEY or OPENROUTER_API_KEY');
      console.error('   Example: export LLM_VISION_API_KEY=your-key\n');
      process.exit(1);
    }

    // Initialize service
    const provider = process.env.LLM_VISION_PROVIDER || 'openrouter';
    const model = process.env.LLM_VISION_MODEL || 'openai/gpt-4o-mini';
    
    console.log(`Provider: ${provider}`);
    console.log(`Model: ${model}`);
    console.log(`API Key: ${apiKey.substring(0, 10)}...\n`);

    llmVisionService.initialize(provider, apiKey, model);

    if (!llmVisionService.isAvailable()) {
      console.error('❌ LLM Vision Service not available');
      process.exit(1);
    }

    // Load a test frame from results
    const resultsFile = path.join(__dirname, 'video-processing-results-1768418037.json');
    if (!fs.existsSync(resultsFile)) {
      console.error('❌ Results file not found');
      process.exit(1);
    }

    const results = JSON.parse(await fs.readFile(resultsFile, 'utf8'));
    const testFrame = results.frames[0]; // Use first frame

    if (!testFrame || !testFrame.base64) {
      console.error('❌ No frame data found');
      process.exit(1);
    }

    console.log(`Testing with frame ${testFrame.frameNumber} (${testFrame.videoTime}s)\n`);
    console.log('📤 Sending to LLM Vision API...\n');

    // Test detection
    const startTime = Date.now();
    const analysis = await llmVisionService.analyzeImage(testFrame.base64, {
      frameTime: testFrame.videoTime,
    });
    const duration = Date.now() - startTime;

    console.log('✅ Response received!\n');
    console.log(`⏱️  Response time: ${duration}ms\n`);
    console.log('📊 Detection Results:');
    console.log(`  Weapon: ${analysis.weapon.detected ? '✅ Detected' : '❌ Not detected'} (confidence: ${(analysis.weapon.confidence * 100).toFixed(1)}%)`);
    console.log(`  Stance: ${analysis.stance.detected ? '✅ Detected' : '❌ Not detected'} (confidence: ${(analysis.stance.confidence * 100).toFixed(1)}%)`);
    console.log(`  Hands: ${analysis.hands.detected ? '✅ Detected' : '❌ Not detected'} (confidence: ${(analysis.hands.confidence * 100).toFixed(1)}%)\n`);

    if (analysis.weapon.detected) {
      console.log(`  Weapon Details: ${analysis.weapon.detections[0]?.description || 'N/A'}`);
    }
    if (analysis.stance.detected) {
      console.log(`  Stance Details: ${analysis.stance.description || 'N/A'}`);
    }
    if (analysis.hands.detected) {
      console.log(`  Hands Details: ${analysis.hands.description || 'N/A'}`);
    }

    console.log('\n✅ Test successful!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nError details:');
    if (error.message.includes('401')) {
      console.error('  - Invalid API key');
      console.error('  - Check your API key is correct');
    } else if (error.message.includes('429')) {
      console.error('  - Rate limit exceeded');
      console.error('  - Wait a moment and try again');
    } else if (error.message.includes('400')) {
      console.error('  - Bad request');
      console.error('  - Check image format and API format');
    } else {
      console.error('  -', error.message);
    }
    process.exit(1);
  }
}

testLLMVision();
