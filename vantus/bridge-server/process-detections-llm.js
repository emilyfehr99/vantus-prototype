/**
 * LLM-Based Detection Processing
 * Uses LLM vision to analyze video frames for weapons, hands, stance, etc.
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('./utils/logger');
const llmVisionService = require('./services/llmVisionService');
const detectionProcessor = require('./api/detectionProcessor');

async function processDetectionsWithLLM(resultsFile) {
  try {
    console.log('\n🔍 Starting LLM-Based Detection Processing...\n');

    // Initialize LLM Vision Service
    const provider = process.env.LLM_VISION_PROVIDER || 'openrouter';
    const apiKey = process.env.LLM_VISION_API_KEY || process.env.OPENROUTER_API_KEY;
    const model = process.env.LLM_VISION_MODEL || null;
    const apiUrl = process.env.LLM_VISION_API_URL || null;

    if (!apiKey) {
      console.error('❌ Error: LLM Vision API key not configured');
      console.error('   Set LLM_VISION_API_KEY or OPENROUTER_API_KEY environment variable');
      console.error('   Example: export LLM_VISION_API_KEY=your-api-key');
      process.exit(1);
    }

    llmVisionService.initialize(provider, apiKey, model, apiUrl);

    if (!llmVisionService.isAvailable()) {
      console.error('❌ Error: LLM Vision Service not available');
      process.exit(1);
    }

    console.log(`✅ LLM Vision Service initialized (${provider})\n`);

    // Load results file
    if (!fs.existsSync(resultsFile)) {
      throw new Error(`Results file not found: ${resultsFile}`);
    }

    const results = JSON.parse(await fs.readFile(resultsFile, 'utf8'));

    console.log(`📊 Processing ${results.frames.length} frames with LLM vision...\n`);
    console.log(`Video: ${results.metadata.duration.toFixed(2)} seconds`);
    console.log(`Resolution: ${results.metadata.width}x${results.metadata.height}\n`);

    const detectionResults = {
      videoMetadata: results.metadata,
      frames: [],
      detections: [],
      summary: {
        totalFrames: results.frames.length,
        framesProcessed: 0,
        detectionsFound: 0,
        detectionTypes: {
          weapon: 0,
          stance: 0,
          hands: 0,
        },
      },
    };

    // Process each frame
    for (let i = 0; i < results.frames.length; i++) {
      const frame = results.frames[i];
      const frameNumber = i + 1;

      // Show progress
      if (frameNumber % 5 === 0 || frameNumber === results.frames.length) {
        console.log(`  Processing frame ${frameNumber}/${results.frames.length}...`);
      }

      try {
        // Process frame through detection processor (uses LLM vision)
        const frameDetections = await detectionProcessor.processFrame(frame, {
          officerName: 'OFFICER_TEST',
        });

        detectionResults.frames.push({
          frameNumber: frame.frameNumber,
          videoTime: frame.videoTime,
          timestamp: frame.timestamp,
          detections: frameDetections.detections,
        });

        detectionResults.summary.framesProcessed++;

        // Count detections
        if (frameDetections.detections.weapon?.detected) {
          detectionResults.summary.detectionTypes.weapon++;
          detectionResults.detections.push({
            frameNumber: frame.frameNumber,
            videoTime: frame.videoTime,
            type: 'weapon',
            detection: frameDetections.detections.weapon,
          });
        }

        if (frameDetections.detections.stance?.detected) {
          detectionResults.summary.detectionTypes.stance++;
          detectionResults.detections.push({
            frameNumber: frame.frameNumber,
            videoTime: frame.videoTime,
            type: 'stance',
            detection: frameDetections.detections.stance,
          });
        }

        if (frameDetections.detections.hands?.detected) {
          detectionResults.summary.detectionTypes.hands++;
          detectionResults.detections.push({
            frameNumber: frame.frameNumber,
            videoTime: frame.videoTime,
            type: 'hands',
            detection: frameDetections.detections.hands,
          });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.error(`Error processing frame ${frameNumber}`, error);
      }
    }

    // Calculate summary
    detectionResults.summary.detectionsFound = detectionResults.detections.length;
    detectionResults.summary.detectionRate = (
      (detectionResults.summary.detectionsFound / detectionResults.summary.framesProcessed) * 100
    ).toFixed(1) + '%';

    // Display results
    console.log('\n✅ LLM Detection Processing Complete!\n');
    console.log('📊 Detection Summary:');
    console.log(`  Total Frames: ${detectionResults.summary.totalFrames}`);
    console.log(`  Frames Processed: ${detectionResults.summary.framesProcessed}`);
    console.log(`  Detections Found: ${detectionResults.summary.detectionsFound}`);
    console.log(`  Detection Rate: ${detectionResults.summary.detectionRate}`);
    console.log('\n  Detection Types:');
    console.log(`    Weapons: ${detectionResults.summary.detectionTypes.weapon}`);
    console.log(`    Stance: ${detectionResults.summary.detectionTypes.stance}`);
    console.log(`    Hands: ${detectionResults.summary.detectionTypes.hands}`);

    // Show detection timeline
    if (detectionResults.detections.length > 0) {
      console.log('\n🎯 Detection Timeline:');
      detectionResults.detections.slice(0, 15).forEach(det => {
        const conf = (det.detection.confidence * 100).toFixed(1);
        const desc = det.detection.description || det.detection.type || det.detection.pattern || '';
        console.log(`  ${det.videoTime.toFixed(1)}s - Frame ${det.frameNumber}: ${det.type} (${conf}%) - ${desc}`);
      });
      if (detectionResults.detections.length > 15) {
        console.log(`  ... and ${detectionResults.detections.length - 15} more detections`);
      }
    } else {
      console.log('\n⚠️  No detections found in video');
    }

    // Save results
    const outputFile = resultsFile.replace('.json', '-llm-detections.json');
    await fs.writeFile(outputFile, JSON.stringify(detectionResults, null, 2));
    console.log(`\n💾 Results saved to: ${outputFile}\n`);

    return detectionResults;
  } catch (error) {
    console.error('\n❌ Error processing detections:', error.message);
    logger.error('LLM detection processing failed', error);
    process.exit(1);
  }
}

// Get results file from command line or use latest
const resultsFile = process.argv[2] ||
  path.join(__dirname, 'video-processing-results-1768418037.json');

// Process detections
processDetectionsWithLLM(resultsFile);
