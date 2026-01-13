# Model Integration Ready

## ✅ System Ready for Model Data Integration

The Vantus system is now fully prepared to integrate detection models when they become available.

---

## Model Categories & Configuration

### 1. Weapon Detection ✅

**Model:** Custom YOLOv8-nano  
**Confidence Threshold:** 70%  
**Status:** Ready for integration

**Detects:**
- Handgun (various)
- Rifle/Shotgun
- Knife/Blade
- Blunt weapon (bat, pipe)

**Training Data Requirements:**
- Handgun: 5,000+ images (Open Images, custom collection)
- Rifle/Shotgun: 2,000+ images (Open Images, custom collection)
- Knife/Blade: 3,000+ images (Open Images, custom collection)
- Blunt: 1,000+ images (custom collection)
- Negative: 10,000+ images (COCO, custom collection)

**Integration Points:**
- `modelRegistry.js` - Model configuration
- `multiModelDetection.js` - Detection service
- `modelLoader.js` - Model loading

**Usage:**
```javascript
const result = await multiModelDetection.detectWeapons(imageUri, officerName);
// Returns: { detected, category, detections[], confidence, threshold, model }
```

---

### 2. Stance Detection ✅

**Model:** MoveNet + custom logic  
**Confidence Threshold:** 65%  
**Status:** Ready for integration

**Detects:**
- Bladed stance
- Fighting stance

**Integration Points:**
- Uses MoveNet for pose estimation (17 keypoints)
- Custom logic for stance classification
- `multiModelDetection.detectStance()`

**Usage:**
```javascript
const result = await multiModelDetection.detectStance(imageUri, officerName);
// Returns: { detected, category, stanceType, confidence, threshold, model }
```

---

### 3. Hands Detection ✅

**Model:** MoveNet + custom logic  
**Confidence Threshold:** 60%  
**Status:** Ready for integration

**Detects:**
- Hands hidden
- Waistband reach

**Integration Points:**
- Uses MoveNet for hand keypoint detection
- Custom logic for pattern recognition
- `multiModelDetection.detectHands()`

**Usage:**
```javascript
const result = await multiModelDetection.detectHands(imageUri, officerName);
// Returns: { detected, category, pattern, confidence, threshold, model }
```

---

### 4. Biometric Detection ✅

**Model:** Wearable data  
**Threshold:** 40% above baseline (N/A confidence)  
**Status:** ✅ Fully Integrated

**Detects:**
- HR spike >40% above baseline

**Integration:**
- Uses baseline calibration system
- Compares current HR to officer's baseline
- No model loading required (uses baseline data)

**Usage:**
```javascript
const result = await multiModelDetection.detectBiometricAnomaly(
  currentHeartRate,
  officerName,
  context
);
// Returns: { detected, category, currentHeartRate, baselineHeartRate, increase, increasePercent, threshold }
```

---

### 5. Audio Detection ✅

**Model:** Custom audio classifier  
**Confidence Threshold:** 70%  
**Status:** Ready for integration

**Detects:**
- Aggressive vocal patterns
- Screaming

**Integration Points:**
- Audio feature extraction
- Custom classifier model
- `multiModelDetection.detectAggressiveAudio()`

**Usage:**
```javascript
const result = await multiModelDetection.detectAggressiveAudio(
  audioTranscript,
  audioFeatures,
  officerName
);
// Returns: { detected, category, pattern, confidence, threshold, model }
```

---

## Model Registry System

### Configuration

All models are configured in `modelRegistry.js`:

```javascript
{
  weapon: {
    category: 'Weapon',
    modelType: 'Custom YOLOv8-nano',
    confidenceThreshold: 0.70,
    status: 'pending', // 'pending' | 'loading' | 'ready' | 'error'
    classes: ['handgun', 'rifle', 'shotgun', 'knife', 'blade', 'blunt_weapon'],
  },
  // ... other models
}
```

### Status Tracking

Models have four states:
- **`pending`** - Not loaded yet (default)
- **`loading`** - Currently loading
- **`ready`** - Loaded and ready to use
- **`error`** - Failed to load

---

## Model Loading

### Automatic Loading

Models are loaded via `modelLoader.js`:

```javascript
// Load all models
await modelLoader.loadAllModels({
  weapon: 'path/to/yolov8-nano/model.json',
  stance: 'path/to/movenet/model.json',
  hands: 'path/to/movenet/model.json',
  audio: 'path/to/audio-classifier/model.json',
});
```

### Individual Loading

```javascript
// Load specific model
await modelLoader.loadWeaponModel('path/to/model.json');
await modelLoader.loadStanceModel('path/to/model.json');
await modelLoader.loadHandsModel('path/to/model.json');
await modelLoader.loadAudioModel('path/to/model.json');
```

---

## Integration Checklist

### When Models Are Available:

1. **Update Model Paths**
   - Set model paths in `App.js` or config file
   - Paths can be local files or remote URLs

2. **Model Format Requirements**
   - **YOLOv8-nano:** TensorFlow.js format (`.json` + weights)
   - **MoveNet:** TensorFlow.js format
   - **Audio Classifier:** TensorFlow.js format

3. **Model Loading**
   - Models load automatically on app start
   - Status tracked in model registry
   - Errors handled gracefully

4. **Detection Integration**
   - Detection services already integrated
   - Just need to uncomment model inference code
   - Replace placeholder functions with actual model calls

---

## Detection Service Integration

### Multi-Model Detection

The `multiModelDetection` service handles all detection categories:

```javascript
// Run all detections
const results = await multiModelDetection.runAllDetections(
  imageUri,      // For weapon/stance/hands
  audioData,     // For audio
  heartRate,     // For biometric
  officerName,
  context
);

// Results structure:
{
  timestamp: '2024-01-01T12:00:00Z',
  officerName: 'OFFICER_12345',
  detections: {
    weapon: { detected, detections[], confidence, ... },
    stance: { detected, stanceType, confidence, ... },
    hands: { detected, pattern, confidence, ... },
    biometric: { detected, currentHeartRate, baselineHeartRate, ... },
    audio: { detected, pattern, confidence, ... },
  }
}
```

---

## Model-Specific Integration Notes

### YOLOv8-nano (Weapon Detection)

**File to Update:** `multiModelDetection.js` - `runWeaponDetection()`

**Example Integration:**
```javascript
async runWeaponDetection(modelInstance, imageUri, threshold) {
  // Load image
  const image = await tf.browser.fromPixels(imageElement);
  
  // Preprocess
  const preprocessed = image.resizeBilinear([640, 640]).div(255.0);
  
  // Run inference
  const predictions = await modelInstance.predict(preprocessed);
  
  // Post-process (NMS, threshold filtering)
  const detections = this.postProcessYOLO(predictions, threshold);
  
  return detections;
}
```

**Requirements:**
- Input: 640x640 image
- Output: Bounding boxes with class and confidence
- Classes: handgun, rifle, shotgun, knife, blade, blunt_weapon

---

### MoveNet (Stance & Hands)

**File to Update:** `multiModelDetection.js` - `runStanceDetection()` and `runHandsDetection()`

**Example Integration:**
```javascript
async runStanceDetection(modelInstance, imageUri, threshold) {
  // Run MoveNet
  const pose = await modelInstance.estimatePose(imageElement);
  
  // Extract keypoints
  const keypoints = pose.keypoints;
  
  // Apply custom stance logic
  const stance = this.analyzeStance(keypoints);
  
  return stance.confidence >= threshold ? stance.type : null;
}
```

**Keypoints (17):**
- Nose, eyes, ears, shoulders, elbows, wrists, hips, knees, ankles

**Custom Logic:**
- Stance: Analyze body angle, arm positions, leg positions
- Hands: Analyze hand positions relative to body, waistband proximity

---

### Audio Classifier

**File to Update:** `multiModelDetection.js` - `runAudioDetection()`

**Example Integration:**
```javascript
async runAudioDetection(modelInstance, transcript, features, threshold) {
  // Extract audio features (MFCC, spectral features, etc.)
  const audioFeatures = this.extractAudioFeatures(audioData);
  
  // Run classifier
  const prediction = await modelInstance.predict(audioFeatures);
  
  // Check threshold
  if (prediction.confidence >= threshold) {
    return {
      type: prediction.class, // 'aggressive' | 'screaming' | 'normal'
      confidence: prediction.confidence,
    };
  }
  
  return null;
}
```

**Features:**
- Can use transcript (text) or audio features (MFCC, spectral)
- Classes: aggressive, screaming, normal

---

## Signal Generation Integration

Detection results are automatically integrated with signal generation:

1. **Weapon/Stance/Hands Detections** → Contextual signals
2. **Biometric Anomalies** → Already integrated with baseline system
3. **Audio Patterns** → Vocal stress proxy signals

**File:** `baselineRelativeSignals.js` (can be extended to use model detections)

---

## Testing Without Models

The system gracefully handles missing models:

- Models in `pending` status return `{ detected: false, reason: 'Model not loaded' }`
- App continues to function with available features
- No crashes or errors when models are unavailable

---

## Production Deployment

### Model Distribution

**Options:**
1. **Bundled with app** - Models included in app bundle
2. **Remote loading** - Models loaded from CDN/server
3. **On-demand** - Models downloaded when needed

### Model Updates

- Models can be updated without app update
- Version tracking in model registry
- A/B testing support (multiple model versions)

### Performance

- Models load asynchronously
- Detection runs on background thread
- Results cached to prevent duplicate processing

---

## Files Created/Modified

### New Files:
1. `vantus-app/services/modelRegistry.js` - Model configuration
2. `vantus-app/services/multiModelDetection.js` - Multi-model detection service
3. `vantus-app/services/modelLoader.js` - Model loading service
4. `docs/MODEL_INTEGRATION_READY.md` - This documentation

### Modified Files:
1. `vantus-app/App.js` - Added model loading initialization

---

## Next Steps

1. **Train Models:**
   - Collect training data per requirements
   - Train YOLOv8-nano for weapon detection
   - Train audio classifier
   - Prepare MoveNet custom logic

2. **Convert Models:**
   - Convert to TensorFlow.js format
   - Optimize for mobile deployment
   - Test inference performance

3. **Integrate Models:**
   - Update model paths in config
   - Uncomment model inference code
   - Replace placeholder functions
   - Test detection accuracy

4. **Deploy:**
   - Bundle models or set up remote loading
   - Test on target devices
   - Monitor performance and accuracy

---

**Status:** ✅ System ready - Just add model files and uncomment inference code
