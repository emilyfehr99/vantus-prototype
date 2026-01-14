/**
 * Test script for video processing
 * Processes the provided video file
 */

const videoProcessingService = require('./services/videoProcessingService');
const path = require('path');
const logger = require('./utils/logger');

async function testVideoProcessing() {
  const videoPath = '/Users/emilyfehr8/Desktop/Untitled.mp4';
  
  try {
    logger.info('Starting video processing test', { videoPath });
    
    // Check if video file exists
    const fs = require('fs-extra');
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }
    
    // Get video metadata
    logger.info('Getting video metadata...');
    const metadata = await videoProcessingService.getVideoMetadata(videoPath);
    logger.info('Video metadata:', metadata);
    
    // Extract frames (1 frame per second)
    logger.info('Extracting frames...');
    const frames = await videoProcessingService.extractFrames(videoPath, {
      interval: 1, // 1 frame per second
    });
    
    logger.info(`Extracted ${frames.length} frames`);
    logger.info('First few frames:', frames.slice(0, 3).map(f => ({
      filename: f.filename,
      videoTime: f.videoTime,
    })));
    
    // Clean up frames
    logger.info('Cleaning up frames...');
    await videoProcessingService.cleanupFrames(frames.map(f => f.path));
    
    logger.info('Video processing test complete!');
    
  } catch (error) {
    logger.error('Video processing test failed', error);
    process.exit(1);
  }
}

// Run test
testVideoProcessing();
