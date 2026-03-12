# Vantus Product Data Flow & Architecture

This document details the end-to-end technical workflow of the Vantus "Active AI Partner" system, from in-field sensor ingestion to autonomous radio dispatch.

---

## 1. Data Ingestion Layer (The Edge)

| Stage | Action | Technical Detail |
| :--- | :--- | :--- |
| **Field Capture** | Officer Body-Worn Camera (BWC) | Axon Body 3/4 recording 24/7 audio/video. |
| **Stream Flux** | Axon Respond API | Real-time livestream (5–15 sec delay) via HTTPS/WebSocket. |
| **Ingestion** | Vantus Ingestion Layer (AWS) | **Audio Processor**: Receives 1s chunks, buffers last 10s. <br> **Video Processor**: Standby mode; triggers on audio threat. |

---

## 2. Phase 1: Audio Threat Detection (Real-Time)

The first gate for situational awareness uses an ensemble of three models to evaluate the 1-second audio chunks:

- **YAMNet (Acoustic)**: Detects Gunshots, Glass break, Explosions.
- **Whisper (NLP/KWS)**: Detects keywords ("Help", "Gun", "10-33") and **Cancel Words** ("Code 4", "All Clear").
- **CRNN (Physical)**: Detects Struggle, Impact, Choking, Fighting.

### 📊 Decision Gate 1
- **Confidence > 0.85**: Proceed to Phase 2 (Video Pull).
- **Confidence 0.70–0.85**: Alert supervisor only (Tier 1).
- **Confidence < 0.70**: Suppress (no alert).
- **Abort Logic**: If "Code 4" or "False Alarm" is detected, all dispatch processes are instantly killed.

---

## 3. Phase 2: Video Threat Confirmation (Triggered)

Triggered only when **Audio Confidence > 0.85**.

1. **Video Clip Pull**: Pulls a 30-second clip from Axon Respond (`threat_time ± 15s`).
2. **Frame Sampling**: Samples every 10th frame (3fps, 90 frames total).
3. **Computer Vision Processing**:
    - **YOLOv8**: Detects Weapons (Guns/Knives), People, Clothing colors.
    - **MediaPipe Pose**: Detects Officer Prone/Down, Hands up, Fighting stance.
    - **Scene Analysis**: Contextual check (Indoor/Outdoor, Vehicle, Lighting).

---

## 4. Multi-Modal Fusion & Decision Engine

The system combines outputs to calculate a **Final Combined Confidence Score**:

- **Audio Confidence**: 40% weighting.
- **Video Confidence**: 60% weighting.

> [!NOTE]
> **Example**: 0.87 (Audio) × 0.40 + 0.92 (Video) × 0.60 = **0.90 (Tier 2 Auto-Dispatch)**.

---

## 5. Dispatch Execution Layer

### 🚀 Step 1: Contextual Message Generation
AI generates a professional dispatch script including Officer ID, GPS Location, Threat Type (e.g., "ASSAULT IN PROGRESS"), Weapon Type, and Suspect Description.

### 🎙️ Step 2: Digital Signal Recognition (DSR) & RoIP
The system integrates with the department's **Radio over IP (RoIP)** gateway using the DSR protocol to avoid channel collisions:
- **State 1 (Clear)**: Immediate broadcast.
- **State 2 (Busy)**: Queue and wait for End-of-Transmission (EOT).
- **State 3 (Priority)**: Tier 2 Priority Interrupt (requires Chief approval).

### 🛑 Step 3: Cancellation Window
Officers have a **15-second "Safety Buffer"** to cancel the dispatch before it hits the air:
- **Voice**: "Code 4," "Stand down."
- **Hardware**: Triple-press emergency button on BWC.
- **Mobile**: Push notification [CANCEL] tap.

---

## 6. Impact Metric: The Vantus Advantage

| Metric | Without Vantus | With Vantus (Tier 2) |
| :--- | :--- | :--- |
| **Incident Start** | 14:32:15 | 14:32:15 |
| **Detection/Radio** | 14:36:45 (Manual) | 14:32:30 (AI) |
| **Dispatch Sent** | 14:37:00 | 14:32:50 |
| **Backup on Scene** | 14:48:20 | 14:44:10 |
| **Lives Saved** | Standard Response | **4+ Minutes Gained** |
