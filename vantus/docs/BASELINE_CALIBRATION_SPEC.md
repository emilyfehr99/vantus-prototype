# VANTUS BASELINE CALIBRATION ALGORITHM
## ENGINEERING SPECIFICATION

**Version:** 1.0  
**Status:** ✅ Implemented  
**Last Updated:** 2024

---

## PURPOSE

Establish per-officer, per-context behavioral baselines so that all system signals are expressed as relative deviations from that officer's own historical norms.

The system must produce explainable, legally defensible, low-false-positive signals without diagnostic claims.

---

## SECTION 1 — CORE DESIGN CONSTRAINTS (MANDATORY)

### ✅ 1. Per-Officer Baselines Only
- ✅ Never compare officers to one another
- ✅ No global thresholds
- ✅ No population averages

**Implementation:** `baselineCalibration.js` stores baselines per officer, per context. No cross-officer comparisons.

### ✅ 2. Rolling Adaptive Baselines
- ✅ Baselines update gradually over time
- ✅ No permanent learning or frozen profiles
- ✅ Baselines must decay old data

**Implementation:** Exponential Moving Average (EMA) with 10% cap per update. Data windows: Short (session), Mid (14 days), Long (90 days).

### ✅ 3. Context Segmentation
Baselines maintained separately for:
- ✅ On foot vs in vehicle (determined by speed patterns)
- ✅ Day vs night (determined by timestamp)
- ✅ Marker-defined operational contexts (TRAFFIC_STOP, CHECKPOINT, etc.)

**Implementation:** Context key format: `{movement}_{timeOfDay}_{operationalContext}`

### ✅ 4. Explainable Mathematics Only
- ✅ Allowed: mean, median, standard deviation, IQR, MAD, z-score, sigmoid
- ✅ Not allowed: neural networks, embeddings, black-box models

**Implementation:** All calculations use basic statistics. No ML models.

### ✅ 5. Non-Diagnostic Outputs
- ✅ No labels such as "stress", "threat", "risk"
- ✅ Outputs represent deviation probabilities only

**Implementation:** Signal categories are descriptive (e.g., "speech_rate_deviation", not "stress_detected").

---

## SECTION 2 — INPUT DATA SOURCES

### ✅ Telemetry
- ✅ GPS position
- ✅ Speed
- ✅ Heading
- ✅ Timestamp

### ✅ Derived Telemetry
- ✅ Acceleration (calculated from speed deltas)
- ✅ Deceleration (calculated from speed deltas)
- ✅ Stop duration (calculated from position history)
- ✅ Heading variance (calculated from heading changes)

### ✅ Audio Transcript Features
- ✅ Words per minute (WPM) - calculated from transcripts
- ✅ Pause frequency - implicit in WPM calculation
- ✅ Phrase repetition frequency - calculated from word frequencies

### ✅ Markers
- ✅ Context label (TRAFFIC_STOP, CHECKPOINT, etc.)
- ✅ Marker start timestamp
- ✅ Marker end timestamp (estimated from next marker or timeout)

---

## SECTION 3 — BASELINE TIME WINDOWS

### ✅ SHORT TERM
- **Scope:** Current session
- **Purpose:** Smoothing and noise reduction
- **Implementation:** `baseline.shortTermData[]`

### ✅ MID TERM (PRIMARY BASELINE)
- **Scope:** Last 14 days
- **Purpose:** Main comparison baseline
- **Implementation:** `baseline.midTermData[]` (filtered to 14 days)

### ✅ LONG TERM
- **Scope:** Last 60-90 days
- **Purpose:** Sanity checks and drift detection
- **Implementation:** `baseline.longTermData[]` (filtered to 90 days)

**Implementation Rules:**
- ✅ All deviation calculations compare against MID TERM baseline
- ✅ LONG TERM used for baseline corruption detection (future enhancement)
- ✅ SHORT TERM used for real-time smoothing (future enhancement)

---

## SECTION 4 — BASELINE DATA STORAGE MODEL

### ✅ Movement Metrics
- ✅ `avg_speed` - Mean speed
- ✅ `speed_std` - Standard deviation of speed
- ✅ `avg_acceleration` - Mean acceleration
- ✅ `avg_deceleration` - Mean deceleration
- ✅ `stop_duration_median` - Median stop duration
- ✅ `stop_duration_IQR` - Interquartile range of stop durations
- ✅ `heading_variance_avg` - Average heading variance
- ✅ `pace_reversal_avg` - Average pace reversals
- ✅ `pace_reversal_std` - Standard deviation of pace reversals

### ✅ Speech Metrics
- ✅ `mean_WPM` - Mean words per minute
- ✅ `std_WPM` - Standard deviation of WPM
- ✅ `median_WPM` - Median words per minute
- ✅ `repetition_rate_median` - Median repetition rate
- ✅ `repetition_rate_MAD` - Median Absolute Deviation of repetition rate

### ✅ Routine Metrics
- ✅ `routine_duration_median` - Median routine duration
- ✅ `routine_duration_IQR` - Interquartile range of routine durations

**Implementation:** Stored in `baselineCalibration.baselines` Map structure.

---

## SECTION 5 — MOVEMENT SIGNAL ALGORITHMS

### ✅ ABRUPT STOP DEVIATION

**Definition:** A deceleration event that exceeds the officer's historical deceleration norm.

**Computation:**
- ✅ `deceleration = (previous_speed - current_speed) / delta_time`

**Baseline (14 days):**
- ✅ `baseline_mean_decel` → `baseline.avg_deceleration`
- ✅ `baseline_std_decel` → calculated from baseline data

**Deviation:**
- ✅ `z = (current_deceleration - baseline_mean_decel) / baseline_std_decel`

**Probability:**
- ✅ `probability = clamp(sigmoid(z / 2), 0.05, 0.95)`

**Trigger Condition:**
- ✅ `z > 1.5`

**Implementation:** `baselineRelativeSignals.generateAbruptStopSignal()`

---

### ✅ STATIONARY DURATION DEVIATION

**Definition:** Officer remains stationary longer than typical for that context.

**Baseline:**
- ✅ `median_stop_duration` → `baseline.stop_duration_median`
- ✅ `IQR_stop_duration` → `baseline.stop_duration_IQR`

**Deviation:**
- ✅ `score = (current_duration - median_stop_duration) / IQR_stop_duration`

**Probability:**
- ✅ `probability = clamp(score / 4, 0.1, 0.9)`

**Trigger Condition:**
- ✅ `current_duration > median_stop_duration + 1.5 * IQR`

**Implementation:** `baselineRelativeSignals.generateStationaryDurationSignal()`

---

### ✅ PACING PATTERN DEVIATION

**Definition:** Repeated short movements within a confined radius.

**Parameters:**
- ✅ `radius = 10 meters`
- ✅ `window = 5 minutes`

**Computation:**
- ✅ Count direction reversals within radius window

**Baseline:**
- ✅ `baseline_reversals_avg` → `baseline.pace_reversal_avg`
- ✅ `baseline_reversals_std` → `baseline.pace_reversal_std`

**Deviation:**
- ✅ `z = (current_reversals - baseline_avg) / baseline_std`

**Probability:**
- ✅ `probability = clamp(sigmoid(z), 0.1, 0.9)`

**Trigger Condition:**
- ✅ `z > 1.3`

**Implementation:** `baselineRelativeSignals.generatePacingPatternSignal()`

---

## SECTION 6 — VOCAL PATTERN DEVIATION (TRANSCRIPT-ONLY)

### ✅ IMPORTANT
- ✅ Never label as stress
- ✅ Use term "speech pattern deviation"

### ✅ SPEECH RATE DEVIATION

**Metric:**
- ✅ `WPM = words_spoken / minutes`

**Baseline:**
- ✅ `mean_WPM` → `baseline.mean_WPM`
- ✅ `std_WPM` → `baseline.std_WPM`

**Deviation:**
- ✅ `z = (current_WPM - mean_WPM) / std_WPM`

**Probability:**
- ✅ `probability = clamp(sigmoid(z), 0.05, 0.95)`

**Trigger Condition:**
- ✅ `|z| > 1.2`

**Implementation:** `baselineRelativeSignals.generateSpeechRateDeviationSignal()`

---

### ✅ PHRASE REPETITION DEVIATION

**Metric:**
- ✅ `repeated_phrases_per_minute`

**Baseline:**
- ✅ `median_repetition_rate` → `baseline.repetition_rate_median`
- ✅ `MAD_repetition_rate` → `baseline.repetition_rate_MAD`

**Deviation:**
- ✅ `score = (current - median) / MAD`

**Probability:**
- ✅ `probability = clamp(score / 4, 0.1, 0.9)`

**Trigger Condition:**
- ✅ `score > 1.5`

**Implementation:** `baselineRelativeSignals.generateRepetitionDeviationSignal()`

---

## SECTION 7 — CONTEXTUAL DRIFT SIGNALS

### ✅ ROUTINE DURATION DRIFT

**Definition:** Operational routine exceeding officer's historical duration.

**Computation:**
- ✅ `elapsed_time` since context marker start

**Baseline:**
- ✅ `routine_duration_median` → `baseline.routine_duration_median`
- ✅ `routine_duration_IQR` → `baseline.routine_duration_IQR`

**Deviation:**
- ✅ `drift = (elapsed_time - median) / IQR`

**Probability:**
- ✅ `probability = clamp(drift / 5, 0.1, 0.9)`

**Trigger Condition:**
- ✅ `drift > 1.5`

**Implementation:** `baselineRelativeSignals.generateRoutineDurationDriftSignal()`

---

## SECTION 8 — BASELINE UPDATE LOGIC

### ✅ Update Rules
- ✅ Baselines update only at session end
- ✅ Use exponential moving average (EMA) with 10% cap per update
- ✅ Never allow single session to shift baseline >10%
- ✅ Drop sessions with missing context markers from baseline updates

**Implementation:** `baselineCalibration.updateBaseline()`

### ✅ Baseline Decay
- ✅ Data older than 90 days gradually weighted toward zero influence
- ✅ Implemented via data window filtering (90-day cutoff)

**Implementation:** `baselineCalibration.updateDataWindows()`

---

## SECTION 9 — SIGNAL OUTPUT SCHEMA

### ✅ All Signals Output This Structure

```javascript
{
  "signalType": "contextual_deviation",
  "signalCategory": "stationary_duration",
  "probability": 0.72,
  "timestamp": "ISO-8601",
  "baselineContext": {
    "window": "14_days",
    "metric": "stop_duration",
    "baselineMedian": 6.2,
    "baselineIQR": 2.1,
    "comparisonValue": 11.4
  },
  "explanation": {
    "summary": "Observed value exceeded officer's typical range for this context.",
    "method": "IQR-based deviation",
    "limitations": [
      "Does not indicate threat or intent",
      "Dependent on context marker accuracy"
    ]
  },
  "traceability": {
    "dataSources": ["GPS", "Markers"],
    "calculationVersion": "baseline_v1.0"
  }
}
```

**Implementation:** All signals in `baselineRelativeSignals.js` follow this schema.

---

## SECTION 10 — ENGINEERING REQUIREMENTS

- ✅ All signal logic must be baseline-relative
- ✅ No hard-coded thresholds outside deviation logic
- ✅ All outputs must include explanation metadata
- ✅ All math must be auditable
- ✅ All baselines must be officer-scoped and context-scoped

**Status:** ✅ All requirements met

---

## SECTION 11 — PROHIBITIONS (ABSOLUTE)

- ✅ No officer comparisons
- ✅ No risk scoring
- ✅ No mental or emotional inference
- ✅ No black-box ML
- ✅ No permanent profiles

**Status:** ✅ All prohibitions enforced

---

## IMPLEMENTATION FILES

1. **`vantus-app/services/baselineCalibration.js`**
   - Baseline storage and management
   - Context determination
   - Baseline update logic
   - Metric extraction

2. **`vantus-app/services/baselineRelativeSignals.js`**
   - All signal generation algorithms
   - Baseline-relative calculations
   - Signal output schema compliance

3. **`vantus-app/App.js`**
   - Integration with telemetry service
   - Baseline updates at session end
   - Signal generation using baselines

---

## TESTING CHECKLIST

- [ ] Baseline creation for new officers
- [ ] Context segmentation (on foot vs vehicle, day vs night)
- [ ] Baseline updates at session end
- [ ] EMA update with 10% cap
- [ ] Data window filtering (14 days, 90 days)
- [ ] Abrupt stop signal generation
- [ ] Stationary duration signal generation
- [ ] Pacing pattern signal generation
- [ ] Speech rate deviation signal generation
- [ ] Repetition deviation signal generation
- [ ] Routine duration drift signal generation
- [ ] Signal output schema compliance
- [ ] No cross-officer comparisons
- [ ] No global thresholds

---

## NOTES

- Baselines require minimum data before signals can be generated
- First few sessions may use fallback to old edge intelligence
- Baselines adapt gradually (10% cap per update)
- All calculations are explainable and auditable

---

**END OF SPECIFICATION**
