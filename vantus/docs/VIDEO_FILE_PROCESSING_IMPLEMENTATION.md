# Video File Processing - Implementation Guide

**Purpose:** How to implement full video file processing with frame extraction

**Status:** Architecture Ready - Needs Frame Extraction Implementation

---

## Current Status

If you provide an MP4 video file **right now**, here's what would happen:

### ✅ What Works

1. **File Acceptance**
   - System accepts video file URI
   - Validates file exists
   - Loads video metadata

2. **Video Loading**
   - Uses expo-av to load video
   - Gets video duration
   - Prepares for frame extraction

3. **Detection Pipeline**
   - Detection models ready
   - Frame processing logic implemented
   - Results aggregation works

### ⚠️ What Needs Implementation

1. **Frame Extraction**
   - Currently: Placeholder implementation
   - Needs: Actual frame capture from video
   - Solution: Use react-native-view-shot or canvas API

2. **Frame Capture**
   - expo-av doesn't have direct screenshot
   - Need workaround or additional library
   - Options: react-native-view-shot, canvas, or server-side

---

## Quick Implementation Options

### Option 1: react-native-view-shot (Recommended)

**Install:**
```bash
npm install react-native-view-shot
```

**Implementation:**
```javascript
import { captureRef } from 'react-native-view-shot';

// Create hidden video view
const videoRef = useRef(null);

// Capture frame
const frameUri = await captureRef(videoRef, {
  format: 'jpg',
  quality: 0.8,
});
```

**Pros:**
- Works on iOS, Android, Web
- Simple API
- Good performance

**Cons:**
- Requires React component ref
- Need to render video (even if hidden)

---

### Option 2: Server-Side Processing (Best for Production)

**Implementation:**
1. Upload video to bridge server
2. Server uses FFmpeg to extract frames
3. Server processes frames
4. Return results to app

**Pros:**
- Full FFmpeg functionality
- Better performance
- No app size increase
- Can process large videos

**Cons:**
- Requires server processing
- Network dependency

**Server Implementation:**
```javascript
// bridge-server/routes/video.js
const ffmpeg = require('fluent-ffmpeg');

app.post('/api/process-video', async (req, res) => {
  const videoFile = req.files.video;
  
  // Extract frames using FFmpeg
  const frames = await extractFrames(videoFile.path, {
    interval: 1000, // 1 frame per second
  });
  
  // Process frames
  const results = await processFrames(frames);
  
  res.json(results);
});
```

---

### Option 3: Manual Frame Extraction (For Testing)

**For Quick Testing:**
1. Use video player to manually extract frames
2. Save frames as images
3. Process images through existing system

**Steps:**
1. Open video in video player
2. Pause at desired times
3. Take screenshots
4. Save as images
5. Process images through `multiModelDetection.runAllDetections()`

---

## What Would Happen: Step by Step

### If You Provide Video Now (Current State)

```
1. Video File Accepted ✅
   → File validated
   → Video loaded with expo-av

2. Frame Extraction ⚠️
   → Attempts to extract frames
   → Currently returns empty array (placeholder)
   → Would need frame extraction implementation

3. Frame Processing ✅
   → If frames extracted, processes each frame
   → Runs detection models
   → Generates results

4. Results ✅
   → Detection results logged
   → Summary generated
   → Results returned
```

### With Full Implementation

```
1. Video File Accepted ✅
   → File validated
   → Video loaded

2. Frame Extraction ✅
   → Extracts frames every 1 second
   → Saves frames as images
   → Returns frame URIs

3. Frame Processing ✅
   → Processes each frame
   → Weapon detection (if model loaded)
   → Stance detection (if model loaded)
   → Hand detection (if model loaded)

4. Detection Results ✅
   → Detections logged
   → Timeline created
   → Summary generated

5. Results Returned ✅
   → Full processing results
   → Detection timeline
   → Summary statistics
```

---

## Quick Test Implementation

### Using react-native-view-shot

1. **Install:**
   ```bash
   npm install react-native-view-shot
   ```

2. **Update videoFileProcessor.js:**
   ```javascript
   import { captureRef } from 'react-native-view-shot';
   
   async captureFrameFromVideo(videoRef, time) {
     // Seek video to time
     await videoRef.current.setPositionAsync(time);
     
     // Wait for seek to complete
     await new Promise(resolve => setTimeout(resolve, 200));
     
     // Capture frame
     const frameUri = await captureRef(videoRef, {
       format: 'jpg',
       quality: 0.8,
     });
     
     return frameUri;
   }
   ```

3. **Process Video:**
   ```javascript
   const results = await videoFileProcessor.processVideoFile(videoUri, {
     officerName: 'OFFICER_12345',
     frameInterval: 1000, // 1 frame per second
   });
   ```

---

## Example: Processing a 5-Minute Video

### Input
```
Video: bodycam_footage.mp4
Duration: 5 minutes (300 seconds)
Resolution: 1920x1080
```

### Processing
```
[INFO] Starting video file processing
[INFO] Video loaded: duration 300 seconds
[INFO] Extracting 300 frames (1 frame per second)...
[INFO] Extracted frame 1/300 at 0.0s
[INFO] Extracted frame 2/300 at 1.0s
...
[INFO] Processing frame 1/300...
[INFO] Processing frame 2/300...
[INFO] Detection found at frame 45 (45.0s)
  - Weapon: handgun (confidence: 0.85)
[INFO] Detection found at frame 120 (120.0s)
  - Audio: aggressive (confidence: 0.78)
...
[INFO] Video processing complete
```

### Output
```json
{
  "videoUri": "file:///path/to/bodycam_footage.mp4",
  "framesProcessed": 300,
  "detections": [
    {
      "frameNumber": 45,
      "videoTime": 45.0,
      "detections": {
        "weapon": {
          "detected": true,
          "confidence": 0.85
        }
      }
    },
    {
      "frameNumber": 120,
      "videoTime": 120.0,
      "detections": {
        "audio": {
          "detected": true,
          "confidence": 0.78
        }
      }
    }
  ],
  "summary": {
    "totalFrames": 300,
    "detectionsFound": 2,
    "detectionRate": "0.7%"
  }
}
```

---

## Right Now: What You Can Do

### Option 1: Test with Images

1. Extract frames manually from video
2. Save as images
3. Process images:
   ```javascript
   const results = await multiModelDetection.runAllDetections(
     imageUri, // Frame image
     null, // audio
     null, // heart rate
     'OFFICER_12345',
     null, // context
     null // calibration
   );
   ```

### Option 2: Use Live Camera

1. Test with live camera feed
2. Real-time processing works now
3. Same detection pipeline

### Option 3: Implement Frame Extraction

1. Add react-native-view-shot
2. Implement frame capture
3. Process video files

---

## Recommended Next Step

**For Quick Testing:**
- Use live camera feed (works now)
- Test detection pipeline
- Verify models work

**For Video File Processing:**
- Implement server-side processing (most flexible)
- Or add react-native-view-shot (quick implementation)
- Process videos for testing and validation

---

## Summary

**Right Now:**
- ✅ Video file processor created
- ✅ Architecture ready
- ⚠️ Frame extraction needs implementation
- ✅ Detection pipeline works
- ✅ Results aggregation works

**What Happens:**
1. Video accepted ✅
2. Video loaded ✅
3. Frame extraction ⚠️ (placeholder)
4. Frame processing ✅ (ready)
5. Results ✅ (ready)

**To Make It Work:**
- Add frame extraction (react-native-view-shot or server-side)
- Process frames through existing pipeline
- **Estimated time: 2-4 hours**

Would you like me to implement full video file processing with frame extraction right now?
