# Video File Processing Guide

**Purpose:** Guide for processing pre-recorded bodycam video files (MP4) for testing and analysis

**Status:** Architecture Ready - Requires Video Processing Library

---

## Overview

The Vantus system can process pre-recorded video files (MP4, etc.) to:
- Extract frames from video
- Run detection models on each frame
- Generate detection results
- Test models with real bodycam footage
- Analyze historical videos

---

## What Would Happen Right Now

### Current Status

If you provide an MP4 video file right now:

1. **File Loading**
   - System would accept the video file
   - File would be validated
   - Video metadata would be read

2. **Frame Extraction** ⚠️
   - **Currently**: Frame extraction not fully implemented
   - **Requires**: Video processing library (expo-av, react-native-ffmpeg, etc.)
   - **Would do**: Extract frames every 1 second (configurable)

3. **Frame Processing**
   - Each extracted frame would be processed
   - Detection models would run on frames
   - Results would be logged

4. **Detection Results**
   - Detections would be logged
   - Results would be stored
   - Summary would be generated

---

## Implementation Options

### Option 1: expo-av (Recommended for React Native)

**Setup:**
```bash
npm install expo-av
```

**Capabilities:**
- Video playback
- Frame extraction (with additional work)
- Cross-platform (iOS, Android, Web)

**Limitations:**
- Frame extraction requires additional implementation
- May need native modules for advanced features

### Option 2: react-native-ffmpeg

**Setup:**
```bash
npm install react-native-ffmpeg
```

**Capabilities:**
- Full FFmpeg functionality
- Frame extraction
- Video processing
- More powerful but larger bundle size

**Limitations:**
- Larger app size
- More complex setup

### Option 3: Server-Side Processing

**Setup:**
- Process video on bridge server
- Use FFmpeg on server
- Stream results back to app

**Capabilities:**
- Full video processing
- No app size increase
- Better performance

**Limitations:**
- Requires server processing
- Network dependency

---

## What We Need to Implement

### 1. Frame Extraction

```javascript
// Would extract frames from video
const frames = await extractFramesFromVideo(videoUri, {
  interval: 1000, // 1 frame per second
  format: 'jpg',
  quality: 0.8,
});
```

### 2. Frame Processing

```javascript
// Process each frame through detection models
for (const frame of frames) {
  const results = await multiModelDetection.runAllDetections(
    frame.uri,
    null, // audio (would need audio extraction)
    null, // heart rate
    officerName,
    context,
    calibrationData
  );
}
```

### 3. Results Aggregation

```javascript
// Aggregate all detection results
const summary = {
  totalFrames: frames.length,
  detectionsFound: detections.length,
  detectionRate: (detections.length / frames.length) * 100,
  timeline: detections.map(d => ({
    time: d.videoTime,
    detections: d.detections,
  })),
};
```

---

## Quick Implementation (Using expo-av)

### Step 1: Install expo-av

```bash
cd vantus/vantus-app
npm install expo-av
```

### Step 2: Extract Frames

```javascript
import { Video } from 'expo-av';

async function extractFrames(videoUri, interval = 1000) {
  const frames = [];
  const video = new Video({ uri: videoUri });
  
  // Load video
  await video.loadAsync();
  
  // Get video duration
  const duration = video.getDuration();
  
  // Extract frames at intervals
  for (let time = 0; time < duration; time += interval / 1000) {
    // Seek to time
    await video.setPositionAsync(time);
    
    // Capture frame (would need screenshot capability)
    const frame = await captureFrame(video);
    
    frames.push({
      uri: frame.uri,
      timestamp: time,
      videoTime: time,
    });
  }
  
  return frames;
}
```

### Step 3: Process Frames

```javascript
const results = await videoFileProcessor.processVideoFile(videoUri, {
  officerName: 'OFFICER_12345',
  onFrameProcessed: (frameNum, total, results) => {
    console.log(`Frame ${frameNum}/${total} processed`);
  },
  onDetection: (detection, results) => {
    console.log('Detection found!', detection);
  },
});
```

---

## What Would Happen: Step by Step

### 1. You Provide Video File

```
Video: bodycam_footage.mp4
Duration: 5 minutes
Resolution: 1920x1080
```

### 2. System Processes Video

```
[INFO] Starting video file processing
[INFO] Video file loaded: bodycam_footage.mp4
[INFO] Extracting frames (1 frame per second)...
[INFO] Extracted 300 frames from video
[INFO] Processing frame 1/300...
[INFO] Processing frame 2/300...
...
```

### 3. Detection Results

```
[INFO] Detection found at frame 45 (45 seconds)
  - Weapon: handgun (confidence: 0.85)
  - Stance: bladed_stance (confidence: 0.72)
[INFO] Detection found at frame 120 (120 seconds)
  - Audio: aggressive (confidence: 0.78)
...
```

### 4. Final Summary

```json
{
  "totalFrames": 300,
  "framesProcessed": 300,
  "detectionsFound": 5,
  "detectionRate": "1.7%",
  "processingTime": 45000,
  "detections": [
    {
      "frameNumber": 45,
      "videoTime": 45,
      "detections": {
        "weapon": { "detected": true, "confidence": 0.85 },
        "stance": { "detected": true, "confidence": 0.72 }
      }
    }
  ]
}
```

---

## Testing with Video File

### Method 1: Add to App (Quick Test)

1. **Add video to app assets:**
   ```bash
   # Place video in vantus-app/assets/videos/
   cp bodycam_footage.mp4 vantus-app/assets/videos/
   ```

2. **Process in app:**
   ```javascript
   import videoFileProcessor from './services/videoFileProcessor';
   
   const videoUri = require('./assets/videos/bodycam_footage.mp4');
   
   const results = await videoFileProcessor.processVideoFile(videoUri, {
     officerName: 'OFFICER_12345',
   });
   ```

### Method 2: Select from Device

1. **Use MediaLibrary to select video:**
   ```javascript
   import * as MediaLibrary from 'expo-media-library';
   
   const assets = await MediaLibrary.getAssetsAsync({
     mediaType: MediaLibrary.MediaType.video,
   });
   
   const video = assets.assets[0];
   await videoFileProcessor.processVideoFile(video.uri);
   ```

### Method 3: Server-Side Processing

1. **Upload video to bridge server:**
   ```javascript
   // Upload video
   const formData = new FormData();
   formData.append('video', videoFile);
   
   const response = await fetch(`${BRIDGE_SERVER_URL}/api/process-video`, {
     method: 'POST',
     body: formData,
   });
   ```

2. **Server processes and returns results:**
   ```javascript
   const results = await response.json();
   // Results contain detection timeline
   ```

---

## Current Limitations

### What Doesn't Work Yet

1. **Frame Extraction**
   - Requires video processing library
   - Not implemented in current code
   - Would need expo-av or react-native-ffmpeg

2. **Audio Extraction**
   - Video audio track extraction
   - Would need audio processing
   - Currently only processes transcripts

3. **Real-Time Processing**
   - Video processing is slower than live feed
   - Takes time to extract and process frames

### What Works

1. **Detection Pipeline**
   - Detection models ready
   - Frame processing logic implemented
   - Results aggregation works

2. **File Handling**
   - File system access
   - File validation
   - Results storage

---

## Quick Implementation Path

### Option A: Use expo-av (Easiest)

1. Install: `npm install expo-av`
2. Implement frame extraction using Video component
3. Process frames through existing detection pipeline
4. **Time**: ~2-3 hours

### Option B: Server-Side (Most Flexible)

1. Add video upload endpoint to bridge server
2. Use FFmpeg on server to extract frames
3. Process frames on server
4. Return results to app
5. **Time**: ~4-6 hours

### Option C: react-native-ffmpeg (Most Powerful)

1. Install: `npm install react-native-ffmpeg`
2. Implement frame extraction
3. Process frames
4. **Time**: ~3-4 hours

---

## Recommended Approach

**For Testing Now:**
1. Use **expo-av** for quick implementation
2. Extract frames at 1 FPS (1 frame per second)
3. Process through existing detection pipeline
4. Generate results summary

**For Production:**
1. Use **server-side processing** for better performance
2. Process videos on bridge server
3. Return results to app
4. Support batch processing

---

## What You Can Do Right Now

### Without Video Processing Library

1. **Test with Images:**
   - Extract frames manually (using video player)
   - Save frames as images
   - Process images through detection system

2. **Use Live Camera:**
   - Test with live camera feed
   - Real-time processing works now
   - Same detection pipeline

3. **Prepare for Video:**
   - Detection pipeline is ready
   - Just needs frame extraction
   - Can add video processing library later

---

## Next Steps

1. **Choose Implementation:**
   - expo-av (quick, React Native native)
   - react-native-ffmpeg (powerful, more setup)
   - Server-side (flexible, requires server)

2. **Implement Frame Extraction:**
   - Add video processing library
   - Implement frame extraction
   - Test with sample video

3. **Integrate with Detection:**
   - Use existing detection pipeline
   - Process extracted frames
   - Generate results

---

## Example: What Results Would Look Like

```json
{
  "videoUri": "file:///path/to/bodycam_footage.mp4",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T10:05:00Z",
  "framesProcessed": 300,
  "detections": [
    {
      "frameNumber": 45,
      "videoTime": 45.0,
      "timestamp": "2024-01-15T10:00:45Z",
      "detections": {
        "weapon": {
          "detected": true,
          "category": "weapon",
          "confidence": 0.85,
          "detections": [
            {
              "class": "handgun",
              "confidence": 0.85,
              "bbox": [320, 180, 100, 80]
            }
          ]
        },
        "stance": {
          "detected": true,
          "category": "stance",
          "confidence": 0.72,
          "type": "bladed_stance"
        }
      }
    },
    {
      "frameNumber": 120,
      "videoTime": 120.0,
      "timestamp": "2024-01-15T10:02:00Z",
      "detections": {
        "audio": {
          "detected": true,
          "category": "audio",
          "confidence": 0.78,
          "pattern": "aggressive"
        }
      }
    }
  ],
  "summary": {
    "totalFrames": 300,
    "framesProcessed": 300,
    "detectionsFound": 2,
    "detectionRate": "0.7%",
    "processingTime": 45000
  }
}
```

---

## Summary

**Right Now:**
- System architecture is ready
- Detection pipeline works
- Frame extraction needs implementation
- Would need video processing library

**What Would Happen:**
1. Video file accepted ✅
2. Frame extraction ⚠️ (needs library)
3. Frame processing ✅ (ready)
4. Detection results ✅ (ready)
5. Results summary ✅ (ready)

**To Make It Work:**
- Add expo-av or react-native-ffmpeg
- Implement frame extraction
- Process frames through existing pipeline
- **Estimated time: 2-4 hours**

Would you like me to implement video file processing with expo-av right now?
