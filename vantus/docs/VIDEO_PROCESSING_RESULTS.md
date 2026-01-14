# Video Processing Results

**Date**: 2026-01-14
**Video File**: `6-2-20 Clip 0011 from Body Cam 0009_6-2-20.mp4`

---

## Processing Summary

### Video Metadata
- **Duration**: 47.6 seconds
- **Resolution**: 1920x1080 (Full HD)
- **Codec**: H.264
- **FPS**: 30
- **Format**: MP4

### Frame Extraction
- **Total Frames Extracted**: 48 frames
- **Frame Interval**: 1 second (1 frame per second)
- **Processing Rate**: ~1 frame/second
- **Extraction Method**: FFmpeg server-side processing

---

## Processing Details

### Step 1: Video Upload ✅
- Video file uploaded to bridge server
- File validated (MP4 format, valid video file)
- File size checked (within 500MB limit)

### Step 2: Frame Extraction ✅
- FFmpeg extracted 48 frames at 1-second intervals
- Frames saved as JPEG images
- Base64 encoded for transmission

### Step 3: Frame Transmission ✅
- All 48 frames converted to base64
- Frames ready for detection processing
- Temporary files cleaned up

---

## Next Steps

### Detection Processing
Each of the 48 frames would now be processed through:

1. **Weapon Detection**
   - YOLOv8-nano model
   - Detects: handguns, rifles, knives, blunt weapons
   - Confidence threshold: 70%

2. **Stance Detection**
   - MoveNet model
   - Detects: bladed stance, fighting stance
   - Body posture analysis

3. **Hand Detection**
   - Custom classifier
   - Detects: hands hidden, waistband reach
   - Hand position analysis

4. **Audio Detection** (if audio track available)
   - LLM analysis of audio transcripts
   - Detects: aggressive speech, screaming, repetition
   - Pattern recognition

---

## Expected Detection Results

### Timeline
- **0-10 seconds**: Initial scene analysis
- **10-20 seconds**: Movement patterns
- **20-30 seconds**: Potential detection zones
- **30-40 seconds**: Continued monitoring
- **40-47 seconds**: Final scene analysis

### Detection Statistics (Simulated)
- **Total Frames**: 48
- **Frames with Detections**: Variable (depends on content)
- **Detection Rate**: Variable
- **Processing Time**: ~2-5 minutes (with detection models)

---

## API Response Structure

```json
{
  "success": true,
  "metadata": {
    "duration": 47.6,
    "width": 1920,
    "height": 1080,
    "codec": "h264",
    "fps": "30/1",
    "size": 12345678,
    "format": "mov,mp4,m4a,3gp,3g2,mj2"
  },
  "frames": [
    {
      "path": "/path/to/frame.jpg",
      "filename": "frame_001.jpg",
      "videoTime": 0.0,
      "frameNumber": 1,
      "timestamp": "2026-01-14T19:13:00Z",
      "base64": "data:image/jpeg;base64,..."
    },
    // ... 47 more frames
  ],
  "summary": {
    "totalFrames": 48,
    "duration": 47.6,
    "interval": 1
  }
}
```

---

## Usage in Mobile App

```javascript
import videoFileProcessor from './services/videoFileProcessor';

const results = await videoFileProcessor.processVideoFile(
  'file:///Users/emilyfehr8/Desktop/6-2-20 Clip 0011 from Body Cam 0009_6-2-20.mp4',
  {
    officerName: 'OFFICER_12345',
    frameInterval: 1,
    onFrameProcessed: (frameNum, total, results) => {
      console.log(`Frame ${frameNum}/${total} processed`);
    },
    onDetection: (detection, results) => {
      console.log('Detection found!', detection);
    },
  }
);

console.log('Processing complete:', results.summary);
```

---

## Performance Metrics

- **Video Upload**: ~1-2 seconds
- **Frame Extraction**: ~5-10 seconds (48 frames)
- **Base64 Encoding**: ~2-3 seconds
- **Total Processing Time**: ~10-15 seconds (without detection)
- **With Detection Models**: ~2-5 minutes (48 frames × 3-5 seconds/frame)

---

## File Locations

- **Results JSON**: `vantus/bridge-server/video-processing-results-*.json`
- **Temporary Frames**: `vantus/temp/video-processing/frames/` (cleaned up after processing)
- **Uploaded Video**: `vantus/temp/uploads/` (cleaned up after processing)

---

## Success Criteria Met ✅

- ✅ Video file accepted and validated
- ✅ Frames extracted successfully (48 frames)
- ✅ Server-side processing working
- ✅ API endpoint functional
- ✅ Base64 encoding working
- ✅ Cleanup completed
- ✅ Ready for detection processing

---

## Notes

- Video is a real bodycam footage (47.6 seconds)
- Full HD resolution (1920x1080)
- Standard 30 FPS frame rate
- H.264 codec (standard for bodycams)
- All 48 frames extracted successfully
- Ready for full detection pipeline integration
