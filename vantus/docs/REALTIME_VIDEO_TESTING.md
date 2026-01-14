# Real-Time Video Processing Testing Guide

**Purpose:** Guide for testing real-time video processing and understanding what happens

**Status:** Ready for Testing

---

## Overview

The Vantus system now processes live camera video in real-time to detect:
- **Weapons** (handguns, rifles, knives, blunt weapons)
- **Stance patterns** (bladed stance, fighting stance)
- **Hand patterns** (hands hidden, waistband reach)
- **Audio patterns** (aggressive speech, screaming, repetition)

---

## What Happens When You Test

### 1. **Camera Feed Display**
- Live camera view appears on screen
- Camera shows what officer sees
- No recording visible to officer (privacy-first)

### 2. **Frame Capture**
- System captures frames every **2 seconds** (configurable)
- Frames are processed through detection models
- Processing happens in background

### 3. **Detection Processing**
For each frame:
- **Weapon Detection**: Checks for weapons (if model loaded)
- **Stance Detection**: Analyzes body posture (if model loaded)
- **Hand Detection**: Checks hand positions (if model loaded)
- **Audio Detection**: Analyzes audio transcripts (if available)

### 4. **Detection Results**
When detections occur:
- **Logged**: Detection details logged to console
- **Voice Advisory**: Voice messages may play (if configured)
- **Video Clip**: Video clip saved if weapon detected (confidence >= 70%)
- **Signals**: Contextual signals generated and sent to supervisors
- **No Alerts to Officer**: Officer sees nothing (privacy-first)

### 5. **Supervisor Dashboard**
- Detections appear on supervisor dashboard
- Signals sent via Socket.io
- Real-time updates for supervisors

---

## Current Status

### ✅ What Works Now

1. **Camera Feed**
   - Live camera view displays
   - Camera permissions handled
   - Frame capture working

2. **Frame Processing**
   - Frames captured every 2 seconds
   - Processing pipeline ready
   - Detection service initialized

3. **Legacy Detection (COCO-SSD)**
   - Basic object detection (cell phones, etc.)
   - Works immediately
   - Uses TensorFlow.js

4. **Multi-Model Detection System**
   - Architecture ready
   - Detection pipeline implemented
   - Models can be loaded when available

### ⚠️ What Needs Models

1. **Weapon Detection**
   - Status: Ready for YOLOv8-nano model
   - Currently: Returns "Model not loaded"
   - When model loaded: Will detect weapons in real-time

2. **Stance Detection**
   - Status: Ready for MoveNet + custom logic
   - Currently: Returns "Model not loaded"
   - When model loaded: Will detect stance patterns

3. **Hand Detection**
   - Status: Ready for MoveNet + custom logic
   - Currently: Returns "Model not loaded"
   - When model loaded: Will detect hand patterns

4. **Audio Detection**
   - Status: Works with LLM service (if configured)
   - Currently: Uses LLM or fallback pattern matching
   - Works immediately if LLM configured

---

## How to Test Right Now

### Step 1: Start the App

```bash
cd vantus/vantus-app
npm start
# Or: expo start
```

### Step 2: Authenticate

1. Enter badge number (e.g., "12345")
2. Enter PIN (e.g., "1234")
3. Complete authentication

### Step 3: Calibrate

1. Complete 30-second calibration
2. System collects baseline data
3. Calibration completes

### Step 4: Start Session

1. Click "START SESSION" button
2. Camera feed appears
3. Real-time processing starts automatically

### Step 5: Observe Processing

**What You'll See:**
- Live camera feed
- Status messages in console/logs
- Frame processing every 2 seconds

**What Happens:**
- Frames captured from camera
- Detection models run on frames
- Results logged (check console/logs)

**Current Behavior:**
- **Legacy Detection (COCO-SSD)**: Will detect objects like cell phones
- **Weapon/Stance/Hand Detection**: Will show "Model not loaded" until models are available
- **Audio Detection**: Will work if LLM is configured

---

## Testing Scenarios

### Scenario 1: Basic Frame Processing

**What to do:**
1. Start session
2. Point camera at various objects
3. Watch console/logs

**What happens:**
- Frames captured every 2 seconds
- COCO-SSD detects objects (cell phones, etc.)
- Detection results logged
- No alerts to officer

**Expected output:**
```
Processing frame 1...
No threat detected (objectCount: 3)
Processing frame 2...
THREAT DETECTED! Cell phone found
```

### Scenario 2: Weapon Detection (When Model Loaded)

**What to do:**
1. Start session
2. Point camera at weapon (or test image)
3. Watch for detection

**What happens:**
- Frame captured
- YOLOv8-nano model processes frame
- Weapon detected if confidence >= 70%
- Video clip saved
- Signal sent to supervisors

**Expected output:**
```
Processing frame 5...
Weapon detected: handgun (confidence: 0.85)
Video clip saved
Signal sent to supervisors
```

### Scenario 3: Stance Detection (When Model Loaded)

**What to do:**
1. Start session
2. Stand in bladed/fighting stance
3. Watch for detection

**What happens:**
- Frame captured
- MoveNet extracts keypoints
- Custom logic analyzes stance
- Stance pattern detected if confidence >= 65%
- Signal sent to supervisors

**Expected output:**
```
Processing frame 10...
Stance detected: bladed_stance (confidence: 0.72)
Signal sent to supervisors
```

### Scenario 4: Audio Detection (LLM Configured)

**What to do:**
1. Start session
2. Speak aggressively or scream
3. Watch for detection

**What happens:**
- Audio transcript captured
- LLM analyzes transcript (if configured)
- Pattern detected if confidence >= 70%
- Signal sent to supervisors

**Expected output:**
```
Audio transcript: "STOP! PUT YOUR HANDS UP!"
Pattern detected: aggressive (confidence: 0.75)
Signal sent to supervisors
```

---

## What You'll See in Logs

### Successful Frame Processing

```
[INFO] Processing frame 1
[DEBUG] Frame captured: file:///path/to/frame.jpg
[DEBUG] Running weapon detection...
[DEBUG] Weapon detection: Model not loaded
[DEBUG] Running stance detection...
[DEBUG] Stance detection: Model not loaded
[DEBUG] Running hands detection...
[DEBUG] Hands detection: Model not loaded
[INFO] Frame processing complete
```

### With Models Loaded

```
[INFO] Processing frame 5
[DEBUG] Frame captured: file:///path/to/frame.jpg
[DEBUG] Running weapon detection...
[INFO] Weapon detected: handgun (confidence: 0.85)
[DEBUG] Running stance detection...
[INFO] Stance detected: bladed_stance (confidence: 0.72)
[DEBUG] Running hands detection...
[INFO] Hands detected: waistband_reach (confidence: 0.68)
[INFO] Frame processing complete
[INFO] Video clip saved
[INFO] Signals sent to supervisors
```

### Detection Results

```
[INFO] Real-time detection {
  detections: {
    weapon: {
      detected: true,
      category: 'weapon',
      confidence: 0.85,
      detections: [{ class: 'handgun', confidence: 0.85, bbox: [...] }]
    },
    stance: {
      detected: true,
      category: 'stance',
      confidence: 0.72,
      type: 'bladed_stance'
    }
  }
}
```

---

## Performance Considerations

### Frame Processing Rate

- **Default**: 1 frame every 2 seconds (0.5 FPS)
- **Configurable**: Can adjust `frameInterval` in `realtimeVideoProcessor.startProcessing()`
- **Recommended**: 2-5 seconds for mobile devices

### Processing Time

- **COCO-SSD**: ~200-500ms per frame
- **YOLOv8-nano** (when loaded): ~300-800ms per frame
- **MoveNet** (when loaded): ~100-300ms per frame
- **Total**: ~1-2 seconds per frame (with all models)

### Battery Impact

- **Camera**: Continuous use drains battery
- **Processing**: Model inference uses CPU/GPU
- **Recommendation**: Process frames every 2-5 seconds to balance accuracy and battery

---

## Troubleshooting

### Camera Not Showing

**Issue**: Camera feed doesn't appear

**Solutions:**
1. Check camera permissions
2. Restart app
3. Check device camera availability

### No Detections

**Issue**: No detections even with objects in view

**Possible Causes:**
1. Models not loaded (check logs for "Model not loaded")
2. Confidence below threshold
3. Objects not in detection classes

**Solutions:**
1. Check model status: `modelRegistry.getModelSummary()`
2. Lower confidence thresholds (in config)
3. Verify objects match detection classes

### Processing Too Slow

**Issue**: Frame processing takes too long

**Solutions:**
1. Increase `frameInterval` (process less frequently)
2. Use smaller models (YOLOv8-nano vs full YOLOv8)
3. Reduce image quality in `captureFrame()`

### High Battery Drain

**Issue**: Battery drains quickly

**Solutions:**
1. Increase `frameInterval` to 5+ seconds
2. Process only when session active
3. Use lower quality images
4. Disable unnecessary detections

---

## Testing Checklist

- [ ] Camera feed displays correctly
- [ ] Frame capture works (check logs)
- [ ] COCO-SSD detection works (legacy)
- [ ] Real-time processing starts with session
- [ ] Processing stops when session ends
- [ ] Detection results logged correctly
- [ ] No errors in console/logs
- [ ] Battery usage acceptable
- [ ] Performance acceptable (2-5 second intervals)

---

## Next Steps

### To Enable Full Detection

1. **Load Weapon Model**
   - Train or obtain YOLOv8-nano model
   - Add model path to config
   - Model will load automatically

2. **Load Stance/Hand Models**
   - Set up MoveNet model
   - Implement custom logic
   - Models will load automatically

3. **Configure LLM for Audio**
   - Set up LLM provider (OpenRouter, LocalAI, etc.)
   - Audio detection will work immediately

### To Improve Performance

1. **Optimize Frame Rate**
   - Adjust `frameInterval` based on needs
   - Balance accuracy vs battery

2. **Optimize Models**
   - Use smaller models (nano versions)
   - Quantize models for mobile
   - Use TensorFlow.js optimizations

3. **Add Caching**
   - Cache detection results
   - Skip similar frames
   - Reduce redundant processing

---

## Safety & Privacy

### Officer Privacy
- **No alerts to officer**: Officer sees nothing
- **No recording visible**: Recording happens in background
- **Privacy-first**: Only signals sent to supervisors

### Data Handling
- **Frames processed locally**: No cloud processing
- **No frame storage**: Frames processed and discarded
- **Only detections stored**: Detection results stored, not frames

### Supervisor Access
- **Signals only**: Supervisors see signals, not video
- **Video clips**: Saved only on detection (encrypted)
- **Real-time updates**: Signals appear on dashboard

---

## Example Test Session

```
1. Start App
   → Authentication screen appears

2. Authenticate (badge: 12345, PIN: 1234)
   → Calibration screen appears

3. Complete Calibration (30 seconds)
   → Standby screen appears

4. Click "START SESSION"
   → Camera feed appears
   → Real-time processing starts
   → Logs show: "Real-time video processing started"

5. Point Camera at Objects
   → Every 2 seconds: "Processing frame X"
   → Detection results logged
   → No alerts to officer

6. Check Logs
   → See frame processing
   → See detection results
   → See signals sent

7. Stop Session
   → Real-time processing stops
   → Logs show: "Real-time video processing stopped"
```

---

## Notes

- **Real-time processing is automatic** when session starts
- **No manual activation needed** - starts with session
- **Works even without models** - will show "Model not loaded"
- **Legacy detection (COCO-SSD) works immediately**
- **Models can be added later** - system ready for integration
- **Privacy-first** - officer sees nothing, supervisors see signals only
