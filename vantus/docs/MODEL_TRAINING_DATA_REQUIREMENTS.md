# Model Training Data Requirements

## Weapon Detection Model (YOLOv8-nano)

### Training Data Requirements

| Class | Images Needed | Sources | Status |
|-------|--------------|---------|--------|
| Handgun (various) | 5,000+ | Open Images, custom collection | Pending |
| Rifle/Shotgun | 2,000+ | Open Images, custom collection | Pending |
| Knife/Blade | 3,000+ | Open Images, custom collection | Pending |
| Blunt (bat, pipe) | 1,000+ | Custom collection | Pending |
| Negative (hands, phones, wallets) | 10,000+ | COCO, custom collection | Pending |

**Total Images Required:** ~21,000+

### Data Collection Guidelines

1. **Diversity:**
   - Multiple angles (front, side, back)
   - Different lighting conditions
   - Various backgrounds
   - Different distances

2. **Handgun Variations:**
   - Different models/types
   - Holstered vs unholstered
   - Different hand positions
   - Partial visibility

3. **Negative Examples:**
   - Hands holding phones
   - Hands holding wallets
   - Hands in pockets
   - Empty hands
   - Other objects (keys, tools, etc.)

4. **Annotation Requirements:**
   - Bounding boxes for all weapons
   - Class labels
   - Confidence scores (if available)
   - YOLO format annotations

---

## Stance Detection (MoveNet + Custom Logic)

### Training Data Requirements

**Model:** MoveNet (pre-trained) + Custom classification logic

**Data Needed:**
- Pose sequences with stance labels
- Bladed stance examples: 500+ sequences
- Fighting stance examples: 500+ sequences
- Normal stance examples: 1,000+ sequences

**Keypoint Data:**
- MoveNet provides 17 keypoints
- Custom logic analyzes keypoint relationships
- No additional training data needed for MoveNet (uses pre-trained model)

**Custom Logic Training:**
- Labeled sequences: 2,000+ total
- Keypoint patterns for each stance type
- Temporal sequences (not just single frames)

---

## Hands Detection (MoveNet + Custom Logic)

### Training Data Requirements

**Model:** MoveNet (pre-trained) + Custom classification logic

**Data Needed:**
- Pose sequences with hand pattern labels
- Hands hidden examples: 500+ sequences
- Waistband reach examples: 500+ sequences
- Normal hand positions: 1,000+ sequences

**Keypoint Data:**
- MoveNet provides hand keypoints (wrists, fingers)
- Custom logic analyzes hand positions relative to body
- No additional training data needed for MoveNet

**Custom Logic Training:**
- Labeled sequences: 2,000+ total
- Hand position patterns
- Proximity to waistband measurements

---

## Audio Classification

### Training Data Requirements

**Model:** Custom audio classifier

**Classes:**
- Aggressive vocal patterns
- Screaming
- Normal speech

**Data Needed:**
- Aggressive audio: 2,000+ samples
- Screaming audio: 1,000+ samples
- Normal speech: 5,000+ samples

**Audio Requirements:**
- Duration: 1-5 seconds per sample
- Sample rate: 16kHz minimum
- Format: WAV or MP3
- Diverse speakers, environments, languages

**Features:**
- MFCC coefficients
- Spectral features
- Prosodic features (pitch, tempo)
- Can also use transcript text features

---

## Biometric Detection

**Model:** Wearable data (no training required)

**Baseline Collection:**
- Heart rate baseline captured during calibration
- No training data needed
- Uses percentage threshold (40% above baseline)

**Data Collection:**
- Resting heart rate during calibration
- Continuous heart rate monitoring during sessions
- Comparison to baseline for anomaly detection

---

## Data Storage & Organization

### Recommended Structure

```
training_data/
├── weapon_detection/
│   ├── handgun/
│   │   ├── images/
│   │   └── annotations/
│   ├── rifle_shotgun/
│   ├── knife_blade/
│   ├── blunt/
│   └── negative/
├── stance_detection/
│   ├── bladed_stance/
│   ├── fighting_stance/
│   └── normal/
├── hands_detection/
│   ├── hands_hidden/
│   ├── waistband_reach/
│   └── normal/
└── audio_classification/
    ├── aggressive/
    ├── screaming/
    └── normal/
```

---

## Annotation Standards

### Weapon Detection (YOLO Format)

```yaml
# YOLO annotation format
class_id center_x center_y width height

# Example:
0 0.5 0.5 0.2 0.3  # handgun at center, 20% width, 30% height
```

**Classes:**
- 0: handgun
- 1: rifle_shotgun
- 2: knife_blade
- 3: blunt_weapon

### Stance Detection

**Format:** JSON with keypoints and label
```json
{
  "keypoints": [...17 keypoints...],
  "label": "bladed_stance",
  "confidence": 0.95
}
```

### Hands Detection

**Format:** JSON with keypoints and label
```json
{
  "keypoints": [...hand keypoints...],
  "label": "waistband_reach",
  "confidence": 0.87
}
```

### Audio Classification

**Format:** Audio file + label
- File: WAV/MP3
- Label: aggressive | screaming | normal
- Optional: Transcript text

---

## Data Quality Requirements

1. **Image Quality:**
   - Minimum resolution: 640x640 (YOLOv8 input)
   - Clear, in-focus images
   - Proper exposure

2. **Diversity:**
   - Multiple environments
   - Different lighting conditions
   - Various camera angles
   - Different distances

3. **Balance:**
   - Balanced class distribution
   - Sufficient negative examples
   - Representative of real-world scenarios

4. **Validation:**
   - 80% training, 10% validation, 10% test split
   - Cross-validation recommended
   - Test on unseen data

---

## Model Integration Checklist

When training data is ready:

- [ ] Collect all required images/audio
- [ ] Annotate data according to standards
- [ ] Split into train/val/test sets
- [ ] Train YOLOv8-nano for weapon detection
- [ ] Develop custom logic for stance detection
- [ ] Develop custom logic for hands detection
- [ ] Train audio classifier
- [ ] Convert models to TensorFlow.js format
- [ ] Optimize for mobile deployment
- [ ] Test inference performance
- [ ] Integrate into `multiModelDetection.js`
- [ ] Update model paths in `modelLoader.js`
- [ ] Test on target devices

---

## Data Sources

### Open Images Dataset
- Large-scale image dataset
- Contains weapon images
- Free for research/commercial use

### COCO Dataset
- Common Objects in Context
- Good for negative examples
- Free for research/commercial use

### Custom Collection
- Department-specific scenarios
- Real-world environments
- Privacy-compliant collection

---

**Status:** System ready - Waiting for training data collection and model training
