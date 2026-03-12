# Vantus Operational Roadmap: Demo, Phase 1, and Phase 2

This document provides an in-depth breakdown of the three primary operational phases of Vantus Safety Systems, detailing detection capabilities, accuracy logic, and real-world scenarios for each.

---

## 1. Demo Mode (Real-Time In-Browser Simulation)
**Status:** Live on Prototype
**Objective:** Prove the "Active AI" concept using commodity hardware (browser-based processing).

### 🚀 Key Features
- **In-Browser ML**: Uses TensorFlow.js and YAMNet for hardware-accelerated audio event classification without server-side latency.
- **Whisper Integration**: Uses `@xenova/transformers` for real-time Keyword Spotting (KWS).
- **Synthetic Sensor Logic**: Simulates GPS, Accelerometer, and Bluetooth (BT) Mesh signals to demonstrate multi-signal fusion.

### 🔍 What It Detects
- **Acoustic Events**: Gunshots, Explosions, and Struggles (shouts, glass breaking, rhythmic impacts).
- **Urgent Keywords**: "Shots fired," "Officer down," "10-33," "Drop the gun."
- **Stress Patterns**: Phonetic analysis of vocal jitter and breath rate spikes.

### 📊 Accuracy & Logic
- **Multimodal SOS Gate**: Requires a weighted joint score of **72%** before triggering. (Formula: `Gunshot × 0.45 + Struggle × 0.30 + Keyword × 0.25`).
- **N-Best Phoneme Logic**: Specifically filters out phonetic twins (e.g., "Run" vs "Gun") by checking spectral resonance and context.

---

## 2. Phase 1: Post-Shift Audit (The Scribe Layer)
**Status:** Implementation Ready (Forensic Focus)
**Objective:** Automated forensic review of body-worn camera (BWC) footage to ensure safety compliance and reduce manual supervisor workload.

### 🚀 Key Features
- **Evidence.com Integration**: Connects to Axon APIs to extract and process video/audio batches after a shift is docked.
- **Forensic Sifting**: Automatically flags "Critical Moments" based on AI-detected threats that may have been missed in manual reports.
- **CA SB 524 Compliance**: Generates millisecond-precise, immutable fact logs for audit trails.

### 🔍 What It Detects
- **Safety Gaps**: "Phantom" events where an officer was in a high-stress struggle but did not request backup.
- **Compliance Markers**: Verifies if "Officer Down" commands were recognized and if the 30-second pre-event buffer was correctly captured.
- **Fact Anchoring**: "14:02:11 - Visual confirmation of bladed stance."

### 📊 Efficiency Focus
- **Hours Saved Metric**: Compares automated AI audit time against manual supervisor review time.
- **False Positive suppression**: Higher latency but higher accuracy layer (using larger, non-real-time models).

---

## 3. Phase 2: Live Field Pilot (Autonomous Oversight)
**Status:** Production Integration Phase
**Objective:** Real-time, low-latency autonomous overwatch that bypasses human dispatcher lag to save lives.

### 🚀 Key Features
- **BT Mesh Mesh**: Multiple cameras in proximity sync timestamps to ensure **"One Incident = One Dispatch."**
- **CAD Loop Integration**: Direct injection into Computer-Aided Dispatch (CAD) systems (e.g., Motorola, Axon CAD).
- **Tactical Whisperer**: Real-time voice advisory through the officer's Bluetooth earpiece ("Check six," "Backup 2 mins out").

### 🔍 What It Detects (Elite Features)
- **Kinematic Intent**: Predicts imminent attacks based on center-of-gravity shifts (500ms prediction window).
- **Ghost Partner Logic**: Identifies if an officer is "solo" vs "partnered" by checking CAD rosters and nearby BT beacons.
- **Operational Contexts**: 67+ auto-detected scenarios:
    - **Aviation Mode**: Rotor noise suppression.
    - **Hospital Mode**: Geofenced alarm filtering.
    - **Acoustic Jamming**: Detects if a suspect is intentional masking audio.

### 📊 Mission-Critical Logic
- **Autonomous Dispatch (10-33)**: Auto-escalates to Priority 1 Dispatch if heart rate >160 BPM persists for 10s during a Critical Threat event.
- **Lieutenant's Veto**: A 10-second "Intelligent Triage Gate" on the dashboard allows a supervisor to veto or confirm the dispatch before it hits the MDT.

---

## Technical Summary Table

| Feature | Demo Mode | Phase 1 (Audit) | Phase 2 (Live Pilot) |
| :--- | :--- | :--- | :--- |
| **Data Source** | Local Simulated / Mic | Evidence.com (Stored) | Live BWC Flux + CAD |
| **Latency** | <500ms (Local) | N/A (Batch) | <1.5s (Cloud Edge) |
| **Accuracy Layer** | 7-Layer Gate | Forensic Deep Scan | Real-Time Fusion |
| **Dispatch Logic** | Simulated Notification | Compliance Report | Autonomous CAD Injection |
| **Primary Goal** | Stakeholder Buy-in | Efficiency & Compliance | Officer Survival |
