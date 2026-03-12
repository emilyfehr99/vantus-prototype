## Vantus Partner Site – Pilot P1 Audio Model Audit

### 1. Scope and Context

This document describes how the audio stack on the Vantus partner site works, with a focus on the **Pilot Phase 1 (Pilot P1) Audit mode** implemented in `AudioDemo.tsx`. It is an on-device, browser-based **demonstrator/simulator**, not a production, field‑validated safety system. All “confidence” numbers are UI‑level estimates derived from heuristics, not from a trained, validated model on real officer data.

The site exposes two modes:
- **Field Demo**: Original YAMNet‑based gunshot/struggle detection plus keyword spotting.
- **Pilot P1 Audit**: A richer, simulated Axon/Evidence.com workflow with advanced feature extraction, escalation modeling, and incident/dispatch summaries.

### 2. High‑Level Architecture


**Core building blocks:**
- **YAMNet (TF.js)**  
  - Loaded from `https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1`.  
  - Provides frame‑level class probabilities over the AudioSet ontology.  
  - The code maps specific class indices into **gunshot** and **struggle** scores:
    - `gunshot`: AudioSet classes like gunshot/explosion/firecracker.
    - `struggle`: Shouting, crying, screaming, glass breaking, smash, etc.

- **Whisper / Transformers.js (`pipeline('automatic-speech-recognition')`)**  
  - Offloaded to `@xenova/transformers`, using `Xenova/whisper-tiny.en`.  
  - Used for **offline transcription** of uploaded audio in demo mode.  
  - In live‑mic mode, the simpler browser `SpeechRecognition` / `webkitSpeechRecognition` API is used instead.

- **Custom feature extractors (Pilot P1)**  
  - A large block of JS in `AudioDemo.tsx` computes:
    - **MFCC13** (Mel Frequency Cepstral Coefficients) via:
      - FFT → power spectrum → mel filter banks → log mel energies → DCT.
    - **Chroma features** (12 pitch classes; spectral energy in 80–2000 Hz mapped to chroma bins).
    - **Spectral features**:
      - Centroid, bandwidth, roll‑off (≈85% energy frequency).
    - **Zero‑Crossing Rate** and **RMS energy** for noisiness and loudness.
    - **PLP** (Perceptual Linear Prediction) using Bark scale bands + equal‑loudness pre‑emphasis + DCT.
    - **GFCC** (Gammatone Frequency Cepstral Coefficients) using a bank of gammatone filters and a Hilbert‑like envelope approximation.
  - A synthetic **BYOL‑A style SSL framework** is present (projection/prediction heads, augmentations like Mixup, Random Resize Crop, Gaussian noise, time shift), but it runs as an **on‑the‑fly feature transform**, not as a trained self‑supervised representation learned from real data.

- **Threat classification wrapper**  
  - `classifyThreat(features, pilotAnalysis, keywords)` and helpers build a higher‑level event object with:
    - `threatType` (`Weapon threat`, `Physical struggle`, `Verbal escalation`, `Officer distress`, `Unknown`).
    - `confidence` (0–100%, derived from internal scores + SSL/attention bonuses).
    - `severity` (`low`, `medium`, `high`, `critical`).
    - `action` (e.g. `Immediate backup required`, `Monitor for escalation`).
    - `trigger` (e.g. keyword hit, spectral trigger).

- **Pilot orchestration & UI**  
  - **Live mic path**:
    - 16 kHz mono audio via `getUserMedia` and `AudioContext`.
    - Periodic 16k/15.6k‑sample windows are fed either to:
      - **YAMNet** (Field Demo) or
      - **Advanced feature extraction + Pilot analysis** (Pilot P1).
  - **File upload path**:
    - Decodes to full‑band audio, resamples to 16 kHz in an `OfflineAudioContext`, then feeds either:
      - YAMNet + Whisper (Field Demo), or
      - Advanced feature extraction + Pilot analysis (Pilot P1).
  - **Text‑only path**:
    - Synthetic transcript lines (e.g. `[14:02:11] OFFICER: ...`) are replayed and analyzed for keywords, context, and escalation logic.

### 3. Feature Set and “Models”

The interface shows five “models”:
- **Acoustic Threat (`gunshot`)**
- **Tactical Keyphrases (`keyword`)**
- **CQC Detection (`struggle`)**
- **Voice Biometric (`speaker`)**
- **Vocal Resonance (`stress`)**

Each is backed by a combination of:
1. **Pretrained models** (YAMNet, Whisper) – used mainly in Field Demo.
2. **Hand‑crafted DSP features** – MFCC/GFCC/PLP, spectral stats, ZCR, RMS, etc.
3. **Heuristic decision rules** – thresholds, pattern checks, and synthetic confidence scaling.

#### 3.1 Acoustic Threat (Gunshot)

Two main paths:

- **Field Demo (YAMNet)**  
  - Slices are padded to `BUFFER_SIZE` (15600 samples ≈0.975s).  
  - YAMNet is run; for each slice the code computes both:
    - A **peak gunshot score**: max AudioSet probability over the gunshot/explosion indices (426–431, 436).  
    - A **context gunshot score**: sum of those probabilities across the indices.  
  - Both are rescaled into 0–100 UI confidences, and the **effective gunshot confidence** is the max of peak/context.  
  - If effective confidence > ~10, the result is gated through `shouldSuppressAlert` (GPS / training mode / confidence / ambient noise rules).  
  - If not suppressed and confidence high enough:
    - Model status: `THREAT DETECTED`, `color: 'red'`.  
    - Timeline + optional simulated dispatch if confidence > ~90%.

- **Pilot P1 (Advanced Features)**  
  - For each slice:
    - Extract MFCC, GFCC, PLP, spectral features, ZCR, RMS, plus SSL/attention‑augmented variants.
    - Build a `featureVector` (MFCC energy, spectral brightness, harmonic content, etc.).
    - `analyzeGunshotFeatures(features)` computes a **gunshot threat score** using these features (heuristic combination of high‑frequency energy, transient‑like statistics, etc.).
  - `analyzeAdvancedFeatures` wraps this into `pilotAnalysis.gunshotThreat` (0–100).  
  - Decision:
    - Live Pilot P1 streaming: if `gunshotThreat > ~60–70` → “Gunshot Detected – Multi‑Feature Analysis” timeline entry and possible dispatch at >85%.  
    - File upload (Pilot P1 File Upload):
      - `gunshotThreat > 15` → `THREAT DETECTED`, log “MFCC+GFCC+PLP”, else status `Normal`.

**Reality check:** The gunshot detector in Pilot P1 is mostly **rule‑based** on synthetic features, with no evidence in code of training on firearm datasets (no model weights, no saved parameters). Likely real‑world accuracy on body‑cam audio would be **highly variable** and prone to:
- Confusion with car backfires, fireworks, explosions, door slams.
- Degradation in noisy urban traffic or indoors with reverberation.

#### 3.2 CQC Detection (Struggle)

Again, two paths:

- **Field Demo (YAMNet)**  
  - Uses YAMNet probabilities for AudioSet labels like shout/yell/crying/wail/groan/grunting/screaming/glass/smash → both a **peak score** (max class prob) and a **context score** (sum across the struggle indices) are computed.  
  - Effective struggle confidence is the max of peak/context, then gated via `shouldSuppressAlert`.  
  - High effective confidence → `THREAT DETECTED` + “Physical Struggle / Screaming Detected” event.

- **Pilot P1 (Advanced Features)**  
  - Uses `analyzeStruggleFeatures(features)` that emphasizes:
    - Chroma irregularity, high RMS energy, moderate/high ZCR.
    - Temporal variation in loudness and spectral spread.  
  - `pilotAnalysis.struggleThreat` thresholded similarly (≈60–70 in live, 15+ in file upload).  
  - Generates “Physical Struggle (Advanced: …) – Chroma+ZCR+RMS” log entries.

**Reality check:** This is a **hand‑engineered acoustic pattern detector**, without a trained classifier. In real incidents it would:
- Sometimes fire correctly on genuine fights and intense struggles.
- Also fire on **non‑threatening but chaotic scenes** (sports crowds, concerts, celebrations, kids screaming, etc.).

#### 3.3 Tactical Keyphrases (Keyword Model)

Defined keyword sets:
- **Urgent (`URGENT_KW`)**:  
  Examples: `"shots fired"`, `"officer down"`, `"has a gun"`, `"drop the weapon"`, `"active shooter"`, `"send ems"`, `"i'm hit"`, `"tourniquet"`, `"bleeding"`, etc.
- **Warning (`WARNING_KW`)**:  
  Examples: `"gun"`, `"knife"`, `"weapon"`, `"need units"`, `"foot pursuit"`, `"failure to yield"`, `"taser taser"`, `"10-50"`, `"extrication needed"`, etc.
- **Threat keywords (`THREAT_KW`)**:  
  `URGENT_KW ∪ WARNING_KW`.

Cancel / override and context keywords:
- **Cancel / override (`CANCEL_KW`)**:  
  `"code 4"`, `"cancel backup"`, `"all clear"`, `"disregard"`, `"stand down"`, `"false alarm"`, `"scene secure"`, `"resume patrol"`, `"suspect in custody"`, `"handcuffs on"`, etc.  
  - These force `cancelOverride = true`, set `keyword` to `OVERRIDE ACTIVE`, and suppress `gunshot`/`struggle` models.
- **Context (`CONTEXT_KW`)**:  
  `"traffic stop"`, `"subject stop"`, `"suspicious vehicle"`, `"in foot pursuit"`.  
  - Used to set “primed context” or “pursuit mode”, which affects narrative and some suppression behavior.

**How detection works:**
- **Live mic (SpeechRecognition)**:
  - `onresult` collects final transcripts, lowercases them.
  - Checks `CANCEL_KW` first → may enter override or custody mode.
  - Then scans for any `THREAT_KW` using **exact substring match OR fuzzy phrase matching**:
    - A small Levenshtein‑based matcher ensures near‑misses (e.g. minor misspellings or ASR quirks) still trigger when all words in the phrase are within edit‑distance 1 of some transcript token.  
  - A synthetic confidence `confK` in roughly `85–94%` range is:
    - Gated through `shouldSuppressAlert(confK, 'keyword')`.
    - If not suppressed:
      - Sets `keyword` status to `THREAT DETECTED` (urgent) or `Possible Threat` (warning).
      - Logs the keyword and optionally dispatches when combined with other cues.

- **File uploads (Whisper)**:
  - ASR runs on the entire audio buffer.
  - Scans transcript for **urgent keywords only**, again with **exact or fuzzy phrase matching**.
  - If found → `keywordThreat` with fixed `conf: 95`, `level: 'red'`.

- **Text‑only transcripts**:
  - Each line is replayed with the same `CANCEL_KW` / `THREAT_KW` logic (with fuzzy matching), plus context priming and escalation tracking.

**Reality check:** Keyword detection itself is straightforward string inclusion on transcripts. Accuracy depends almost entirely on:
- **ASR / SpeechRecognition quality** (noisy, overlapping voices, accents).
- Whether exact phrase variants are present (e.g. `"gun"` vs `"got a gun"` vs slang).  
The `85–95%` confidence it displays is not calibrated; it is a cosmetic number.

#### 3.4 Voice Biometric (Speaker: Officer vs Subject)

Implementation is deliberately simple:
- After each processing slice, the code computes:
  - **Spectral centroid** (weighted average frequency of the power spectrum).
  - **Pitch variance** (`getPitchVariance`, used mainly for stress).
- Speaker role is assigned via a **single threshold** on centroid:
  - `isSubject = centroid > 45` (in arbitrary units derived from the feature scaling).  
  - If `isSubject`:
    - Status: `"Subject Detected"`, color `yellow`.  
  - Else:
    - Status: `"Officer Identified"`, color `green`.  
  - `speakerConf = min(98, 70 + (centroid % 20))` is a synthetic confidence.

There is **no enrollment or diarization**:
- No speaker embeddings, no clustering, no per‑officer calibration, no multi‑speaker segmentation.
- The logic assumes the **lower‑pitch, more stable spectral profile** is likely the officer; higher‑frequency emphasis is assumed to be the subject.

**Reality check:** In practice this is a **rough guess**, not a biometric system:
- Female officers, agitated officers, or officers shouting can be mis‑classified as “subject”.
- Calm, low‑voice subjects could be mis‑classified as “officer”.
- Overlapping speech (officer + subject) is not handled explicitly.

So, real‑world officer vs subject labeling accuracy is likely only slightly better than chance in mixed scenarios; for demo purposes it visually differentiates “calm baseline voice” vs “higher‑energy voice”.

#### 3.5 Vocal Resonance (Stress Model)

Based on **time‑domain variance**:
- `variance = getPitchVariance(float32Data)` where variance is computed over the absolute sample values.
- `stressLevel = variance * 1000` → scaled into heuristic “stress”:
  - If `stressLevel > 1.5`:  
    - Label: `"Critical Stress"`, color `red`.  
    - If `stressConf > 80` and `isSubject` → may trigger dispatch.  
  - Else if `stressLevel > 0.8`:
    - Label: `"Agitated"`, color `yellow`.  
  - Else:
    - Label: `"Calm"`, color `green`.
- `stressConf` ≈ `min(100, round(stressLevel * 10))`.

Again, this is a **hand‑designed proxy** for jitter/shimmer/noise; no machine‑learned mapping from audio to validated stress scores.  
It will light up for any signal with high amplitude variation (e.g. yelling, music spikes, sirens), whether or not it truly indicates psychological stress.

### 4. Escalation, Incident Modeling, and Axon Workflow

Pilot P1 adds a layer of **temporal and incident‑level logic** on top of the per‑slice detectors:

- **Escalation history and patterns**
  - `escalationHistory` collects threat events over time, each with `threatType`, `confidence`, and `stressLevel` (“low/medium/high”).
  - `detectEscalationPattern(currentEvent)`:
    - Looks at the last ≈5 events.
    - Categorizes pattern as:
      - `normal`  
      - `raised` (medium stress, moderate confidences)  
      - `commands` (medium stress + high confidences, command‑like language)  
      - `struggle` (high stress + high confidences)
    - Returns a `pattern` and `patternConfidence`, plus a textual progression.
  - `escalationPattern` state is updated and rendered as `normal / raised / commands / struggle` badges.

- **Temporal attention and SSL enhancements**
  - `computeTemporalAttention(eventHistory)` and `analyzeEscalationPattern(features)` approximate a **temporal attention mechanism**; practically, they weight more recent, severe events higher when computing an incident‑level confidence.
  - `analyzeAdvancedFeatures` then adds:
    - `sslBoost` (up to ~20%) if `features.sslEnhanced` is set.
    - `attentionBoost` based on `attentionStrength`.
  - Final `pilotAnalysis.confidence` is `min(100, max(gunshot, struggle, stress) + sslBoost + attentionBoost)`.

- **Incident detection & dispatch**
  - `classifyThreat` combines:
    - `pilotAnalysis` scores,
    - `featureVector` values,
    - Any **present keywords**.  
  - It may label events as:
    - `Weapon threat`: high gunshot score or keywords like `gun`/`knife`.
    - `Physical struggle`: high struggle threat + strong percussiveness.
    - `Verbal escalation`: elevated stress + harmonic content.
    - `Officer distress`: high stress + escalation detected.
  - `generateDispatchEvent(threatEvent)` turns these into **backup recommendations** and simulated dispatch cards (reason text, confidence, recommended action).

- **Axon ingestion workflow (UI simulation)**
  - Stepper labels:
    - `Ingest new recordings` → `Extract audio` → `Run detection models` → `Classify incidents` → `Generate timeline` → `Simulate dispatch` → `Generate report` → `Store results`.
  - A background async loop advances steps with timeouts and calls:
    - `generateMockEvents()` – creates canned incidents like “Verbal escalation” and “Weapon threat” with pre‑filled triggers and confidences.
    - `generateDispatchEvent()` at appropriate steps.
  - Metrics like `totalIncidents`, `falsePositives`, `confirmedIncidents`, `manualReviewsSaved` are currently **driven by simulated events and officer feedback toggles**, not real data.

- **Officer feedback loop**
  - In the Pilot UI, a supervisor can mark incidents as:
    - True positive vs false positive.
    - Override decisions.  
  - This updates `falsePositiveTracking` and `incidentMetrics`, but there is no downstream model retraining — it is displayed as a conceptual “learning loop”.

### 5. How It Decides “Officer vs Offender”

There is **no true diarization or identity model**. Instead:

- The “Voice Biometric” model:
  - Computes the spectral centroid on the current audio buffer.
  - Uses `centroid > 45` as the only split:
    - Higher centroid → labeled “Subject Detected”.
    - Lower centroid → labeled “Officer Identified”.
- This decision is independent of:
  - Body‑cam orientation, distance to speak­er, overlapping talks.
  - Who is actually speaking according to the transcript (officer vs suspect tags in text mode are **not** used to adjust this model).

Net effect:
- In calm traffic‑stop‑like audio where only the officer speaks in a lower, steady tone, the speaker label will usually show “Officer Identified”.
- As soon as there are higher‑frequency or more agitated voices, it likely flips to “Subject Detected” even if that’s another officer or the same officer shouting.
- In noise‑heavy environments (sirens, radios, traffic), centroid can be driven by background noise instead of speech, leading to arbitrary labeling.

This is best interpreted as a **demo indicator of “calm vs agitated voice energy”**, not a robust officer vs offender classifier.

### 6. Likely Accuracy (Qualitative Assessment)

Because there is **no evidence of supervised training or field validation** in the repo (no model checkpoints, datasets, evaluation scripts, or metrics), all accuracy comments below are **qualitative estimates**:

- **Gunshot & struggle (audio‑only)**  
  - **Strengths**:
    - YAMNet provides a solid, generic prior on gunshot/impact/scream‑like sounds in cleanish audio.
    - MFCC/GFCC/PLP + spectral stats encode useful features if a proper classifier were later trained.  
  - **Weaknesses**:
    - Current Pilot P1 logic is hand‑tuned; thresholds and scores are not calibrated on police data.
    - No explicit modeling of environment (indoors/outdoors, distance, echo, occlusion).
    - Prone to **false positives** on fireworks, construction, crowds, or loud music; **false negatives** when guns are fired off‑axis, in vehicles, or under heavy noise.
  - **Practical expectation**:  
    - In controlled demos with curated samples, it will look convincing.  
    - In raw, unconstrained body‑cam feeds, you should assume **significant error**, especially around edge cases and overlapping sounds.

- **Keyword / phrase detection**
  - **Strengths**:
    - If the transcript is accurate and the phrase appears in close form (“shots fired”, “officer down”), detection is near‑perfect (string match).
  - **Weaknesses**:
    - Real‑world ASR on BWC audio is often brittle: crosstalk, radios, sirens, accents, masks, wind, etc.
    - Limited phrase list and exact matching; slang, paraphrases, or mis‑hearings won’t match.
  - **Practical expectation**:
    - On clean radio / test clips: high apparent precision/recall.  
    - On real incidents: heavily bottlenecked by transcription quality; **effective recall may be low**, though precision for words it does catch is decent.

- **Speaker role (officer vs subject)**  
  - **Practical expectation**:  
    - In the absence of diarization/embeddings, expect classification near **coin‑flip** in complex scenes, with some added bias: calm lower voices → “officer”, high‑energy speech → “subject”.
    - Should never be used for any real adjudication of responsibility or force.

- **Stress / escalation modeling**
  - **Strengths**:
    - Captures that chaotic, rapidly varying signals tend to correspond to more intense situations.
  - **Weaknesses**:
    - No separation between officer and background; no calibration; cannot distinguish genuine stress from external noise.
    - The “temporal attention” and SSL references are conceptual; there is no long‑trained temporal model.
  - **Practical expectation**:
    - Good for **storytelling and visualization** of “escalating incident timelines”.  
    - Not reliable enough to base real dispatch or discipline decisions on without further training/validation.

### 7. Summary

- The Vantus partner site’s **Pilot P1 audio stack** is a **rich, well‑designed demonstrator** that:
  - Showcases how multi‑feature audio analysis, keyword spotting, escalation modeling, and dispatch recommendations could work.
  - Integrates familiar tools (YAMNet, Whisper, MFCC/GFCC/PLP, BYOL‑A‑style SSL) into a coherent Axon/Evidence.com‑like narrative.
- However, in its current code form it is **not a production‑grade, validated model**:
  - Core decisions are driven by handcrafted heuristics, fixed thresholds, and simulated confidences.
  - There is no training pipeline, no held‑out evaluation, and no empirical metrics on real law‑enforcement data.
- For external partners (e.g. Vercel, Axon) this should be positioned as:
  - A **conceptual Pilot P1 demo and UX prototype**.  
  - A foundation onto which real, trained, and validated models would later be plugged (using the same feature and timeline scaffolding).

### 8. Actionable Technical Roadmap

This section captures concrete next steps to evolve Pilot P1 from a heuristic demo into a data‑driven, probabilistic system.  
Portions of 8.1 and 8.2 are **partially implemented in the current code** (flat feature vectors and probabilistic incident/escalation logging), but there is still **no trained temporal model or calibrated probabilities** – all numeric outputs remain heuristic.

#### 8.1 Feature Vectorization and Temporal Modeling

- **Vectorization**:  
  - Concatenate all per‑frame features (e.g. 13 MFCCs + 12 chroma + 3–5 spectral features + ZCR + RMS + PLP + GFCC) into a single feature vector.  
  - This becomes the canonical representation for each 10–50 ms audio frame.
- **Sequence modeling**:  
  - For temporal models, stack per‑frame vectors over 5–10 seconds into a feature matrix of shape \([num\_frames, num\_features]\).  
  - Use this as input to RNNs/LSTMs/GRUs or small Transformers to predict per‑frame or segment‑level probabilities for:
    - Gunshot
    - Struggle / CQC
    - Distress speech
    - Keyword presence (optional, to complement ASR)
    - Speaker role (officer vs subject), if diarization is available.
- **Augmentations (BYOL‑A)**:  
  - Reuse the existing augmentations (Mixup, random resize‑crop in time, Gaussian noise, time shift) during model training.  
  - These improve robustness to:
    - Different microphones and mounts
    - Wind, sirens, traffic, radios
    - Partial occlusion and clipping.

#### 8.2 Probabilistic Escalation Engine

- **Model‑driven inputs**:  
  - Replace fixed heuristic scores with **calibrated probabilities** from trained models:
    - \(P(\text{gunshot})\), \(P(\text{struggle})\), \(P(\text{distress speech})\), \(P(\text{urgent keyword})\), \(P(\text{officer})\), \(P(\text{subject})\), \(P(\text{high stress})\).
  - Feed these into `classifyThreat`, `detectEscalationPattern`, and `computeTemporalAttention` instead of hand‑crafted thresholds.
- **Sequential escalation model**:  
  - Introduce a higher‑level temporal model (e.g. simple HMM, RNN, or compact Transformer) whose input is the time series of model probabilities and symbolic events.  
  - Have it predict the **escalation state** over time:
    - `normal → raised → commands → struggle → officer distress`.  
  - Use this as the authoritative source for:
    - Escalation labels
    - Narrative generation
    - Triggering dispatch simulations.
- **“Needs backup” as final decision**:  
  - Treat “Immediate backup required” as the output of this escalation model, not as a local rule in the gunshot/struggle detectors.  
  - Inputs should include:
    - All audio models’ probabilities
    - Speaker role estimates
    - Keyword and cancel/override signals
    - Temporal context (how long, how fast things have escalated).

#### 8.3 Sound Event Detection (SED) Model Improvements

- **Specialized SED models**:  
  - Evaluate publicly available pre‑trained models beyond YAMNet for:
    - Gunshots and explosions (trained on ESC‑50, UrbanSound8K, firearm‑specific datasets where available).
    - Aggression/struggle (shouts, fights, panic screams).
    - Glass breaking and impact sounds.  
  - Sources: DCASE challenge repositories, Hugging Face Hub, TensorFlow Hub, PyTorch Hub.
  - Map their outputs into Pilot P1’s **gunshot** and **struggle** channels, replacing or augmenting the current heuristics.
- **Richer use of YAMNet**:  
  - Instead of summing a small set of AudioSet indices, design composite heuristics over a broader class subset, e.g.:
    - Gunshot high + scream high – (vehicle backfire / fireworks) high.  
    - Fight / crowd / impact classes grouped into a more nuanced struggle score.  
  - This creates a more discriminative **false‑positive reduction layer** on top of YAMNet.

#### 8.4 Advanced ASR and Keyword Spotting

- **Stronger ASR**:  
  - On‑device: experiment with larger Whisper checkpoints (`base.en`, `small.en`, `medium.en`) where compute allows.  
  - Cloud: consider OpenAI Whisper API, Google Speech‑to‑Text, AWS Transcribe, etc., for higher transcription accuracy on noisy BWC audio.
- **Smarter keyword detection**:  
  - Expand and refine keyword lists via:
    - Public radio code lists, training manuals, incident reports, and FOIA‑released transcripts.  
  - Use **fuzzy matching** (e.g. Levenshtein distance, token‑level similarity) instead of exact string search:
    - Catch “shots on fire”, “shots fired off”, mild mis‑spellings, and ASR quirks.  
  - Apply **contextual weighting**:
    - Increase confidence when multiple related terms co‑occur (“gun” + “drop the weapon”, “send units” + “officer down”).
- **Emotion / tone models**:  
  - Integrate pre‑trained models for vocal emotion/stress (from Hugging Face or similar) as inputs to the **Vocal Resonance** and **Officer Distress** signals.  
  - Combine with ASR context (e.g. angry tone + threat keywords) to refine severity estimates.

#### 8.5 Speaker Role and Diarization

- **Diarization models**:  
  - Explore open‑source diarization (e.g. pyannote.audio, NVIDIA NeMo, other research repos) to segment audio into speaker turns (“Speaker 1”, “Speaker 2”, …).  
  - Even if baseline performance is imperfect on BWC audio, it can still:
    - Separate overlapping speech
    - Provide coarse speaker turn boundaries.
- **Mapping speakers to roles**:  
  - Use higher‑level heuristics to guess officer vs subject:
    - The speaker active first and most consistently at the beginning of the recording is likely the officer.  
    - Combine with radio metadata where available (e.g. known unit callsigns).  
    - Use stress and keyword patterns (subject more likely to be high‑stress without issuing commands; officer more likely to use structured commands and codes).
- **Risk caveat**:  
  - Without proper enrollment or labeled officer voices, treat these labels as **advisory only**, never as ground truth for legal or disciplinary decisions.

#### 8.6 Enhanced Stress / Vocal Resonance Modeling

- **Pre‑trained stress / emotion models**:  
  - Replace `getPitchVariance`‑only logic with models specifically trained for stress/emotion detection in speech.  
  - Inputs can be:
    - Raw waveforms
    - Log‑mel spectrograms
    - Feature vectors already computed for SED.  
  - Use outputs like “anger”, “fear”, “panic”, “calm” as numeric features feeding the escalation engine.
- **Role‑aware stress**:  
  - Apply stress models separately to officer and subject streams (if diarization exists):
    - Officer high stress → candidate for “Officer Distress”.  
    - Subject high stress + threatening keywords → “Verbal Escalation”.

#### 8.7 Probabilistic Rule Engine and State Machine

- **Weighted scoring across models**:  
  - Replace hard thresholds with a probabilistic scoring layer:
    - Assign weights to each cue (e.g., gunshot > urgent keyword > struggle > stress).  
    - Compute a rolling threat score that combines:
      - Model probabilities
      - ASR/keyword signals
      - Context flags (traffic stop, pursuit, custody, cancel/override).
- **Temporal state machine**:  
  - Implement an explicit state machine for `detectEscalationPattern`, e.g.:
    - `NORMAL → VERBAL_ESCALATION → COMMANDS → STRUGGLE → WEAPON_THREAT / OFFICER_DISTRESS`.  
  - Use:
    - Entry conditions defined by probabilistic thresholds and event combinations.  
    - Decay logic to de‑escalate if no threat cues are observed for a configured interval.
- **Smarter suppression logic**:  
  - Evolve `shouldSuppressAlert` into a context‑aware filter that considers:
    - Cancel/override phrases (highest priority).  
    - Current escalation state (e.g. in `WEAPON_THREAT`, lower tolerances for suppressing signals).  
    - Environmental context (traffic stop vs routine patrol vs custody mode).

### 9. Related Work and Reference Implementation

- **Automatic conflict detection in police body-worn audio** ([arXiv 1711.05355](https://ar5iv.labs.arxiv.org/html/1711.05355)): Pipeline on LAPD BWA using denoising (OM-LSA), speech/non-speech SVM, and **repetition + intensity** as a conflict proxy (officer repeating commands). Evaluated on 105 labeled files; high/mild conflict files rank in the top of the proposed score.
- **Reference implementation**: A Python script implementing denoising, energy-based segmentation, fingerprint + correlation repetition detection, and conflict scoring is in `scripts/lapd_conflict_detection.py`. Run with `python scripts/lapd_conflict_detection.py --audio path/to.wav`, or use `run_conflict_pipeline(y, sr)` / `run_conflict_pipeline_from_dataset()` in Colab. Dependencies: `pip install -r scripts/requirements-lapd.txt` (or `librosa`, `scipy`, `numpy`; `noisereduce` optional). This provides a complementary **repetition-based conflict** channel that can be combined with Pilot P1’s gunshot/struggle/keyword/stress signals.

