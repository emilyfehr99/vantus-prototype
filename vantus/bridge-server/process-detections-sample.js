/**
 * Process Sample Frames with LLM Vision
 * Processes only a few frames to stay within free tier limits
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('./utils/logger');
const llmVisionService = require('./services/llmVisionService');
const detectionProcessor = require('./api/detectionProcessor');

async function processSampleFrames(resultsFile, sampleCount = 5) {
  try {
    console.log('\n🔍 Processing Sample Frames with LLM Vision...\n');

    // Initialize LLM Vision Service
    const apiKey = process.env.LLM_VISION_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('❌ Error: LLM Vision API key not configured');
      process.exit(1);
    }

    const provider = process.env.LLM_VISION_PROVIDER || 'openrouter';
    const model = process.env.LLM_VISION_MODEL || 'openai/gpt-4o-mini';
    const apiUrl = process.env.LLM_VISION_API_URL || null;

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

    // Select sample frames (spread throughout video)
    const totalFrames = results.frames.length;
    const sampleFrames = [];
    const step = Math.floor(totalFrames / sampleCount);
    
    for (let i = 0; i < sampleCount; i++) {
      const index = Math.min(i * step, totalFrames - 1);
      sampleFrames.push(results.frames[index]);
    }

    console.log(`📊 Processing ${sampleFrames.length} sample frames (out of ${totalFrames} total)...\n`);
    console.log(`Video: ${results.metadata.duration.toFixed(2)} seconds`);
    console.log(`Resolution: ${results.metadata.width}x${results.metadata.height}\n`);

    const detectionResults = {
      videoMetadata: results.metadata,
      frames: [],
      detections: [],
      summary: {
        totalFrames: totalFrames,
        sampleFrames: sampleFrames.length,
        framesProcessed: 0,
        detectionsFound: 0,
        detectionTypes: {
          weapon: 0,
          stance: 0,
          hands: 0,
        },
        note: `Processed ${sampleFrames.length} sample frames to stay within API limits`,
      },
    };

    // Process sample frames
    for (let i = 0; i < sampleFrames.length; i++) {
      const frame = sampleFrames[i];
      const frameNumber = i + 1;

      console.log(`  Processing sample frame ${frameNumber}/${sampleFrames.length} (${frame.videoTime.toFixed(1)}s)...`);

      try {
        // Process frame through detection processor
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

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Error processing frame ${frameNumber}`, error);
        if (error.message.includes('402') || error.message.includes('credits')) {
          console.error('\n⚠️  Out of API credits. Processed what we could.\n');
          break;
        }
      }
    }

    // Calculate summary
    detectionResults.summary.detectionsFound = detectionResults.detections.length;

    // Display results
    console.log('\n✅ Sample Processing Complete!\n');
    console.log('📊 Detection Summary:');
    console.log(`  Total Frames in Video: ${detectionResults.summary.totalFrames}`);
    console.log(`  Sample Frames Processed: ${detectionResults.summary.framesProcessed}`);
    console.log(`  Detections Found: ${detectionResults.summary.detectionsFound}`);
    console.log('\n  Detection Types:');
    console.log(`    Weapons: ${detectionResults.summary.detectionTypes.weapon}`);
    console.log(`    Stance: ${detectionResults.summary.detectionTypes.stance}`);
    console.log(`    Hands: ${detectionResults.summary.detectionTypes.hands}`);

    // Show detection timeline
    if (detectionResults.detections.length > 0) {
      console.log('\n🎯 Detection Timeline:');
      detectionResults.detections.forEach(det => {
        const conf = (det.detection.confidence * 100).toFixed(1);
        const desc = det.detection.description || det.detection.type || det.detection.pattern || '';
        console.log(`  ${det.videoTime.toFixed(1)}s - Frame ${det.frameNumber}: ${det.type} (${conf}%) - ${desc}`);
      });
    } else {
      console.log('\n⚠️  No detections found in sample frames');
    }

    // Save results
    const outputFile = resultsFile.replace('.json', '-sample-detections.json');
    await fs.writeFile(outputFile, JSON.stringify(detectionResults, null, 2));
    console.log(`\n💾 Results saved to: ${outputFile}\n`);

    return detectionResults;
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    logger.error('Sample detection processing failed', error);
    process.exit(1);
  }
}

// Get results file and sample count
const resultsFile = process.argv[2] ||
  path.join(__dirname, 'video-processing-results-1768418037.json');
const sampleCount = parseInt(process.argv[3]) || 5;

// Process sample frames
processSampleFrames(resultsFile, sampleCount);
