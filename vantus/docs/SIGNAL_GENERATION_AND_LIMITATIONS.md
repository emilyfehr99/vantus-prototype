# Signal Generation & Limitations: The 3-Tier "Active AI Partner"

**Document Version:** 2.1  
**Last Updated:** March 2026  
**Classification:** Internal Use - Legal & Risk Review

---

## Executive Summary

The Vantus Safety System is a three-tier operational overwatch platform designed to maximize officer safety while minimizing false dispatches and operational costs. It generates **probabilistic contextual signals** that trigger specific actions based on the level of escalation. This document outlines the capabilities, accuracy thresholds, and critical limitations of each tier.

---

## 1. Operational Tiers & Capabilities

### 🟢 1.1 TIER 1: Audio-Only Overwatch (Acoustic Sentinel)
The foundation of the system is the **Acoustic Sentinel**, which provides 24/7 background overwatch via the BWC microphone.

- **Capabilities**: 
  - Detects **High-Arousal Vocal Stress** and **Code 3 Keywords** via NLP.
  - Identifies **Gunshots (>140dB)**, glass breakage, and physical struggle acoustics.
- **Protocol**: Triggers a high-priority **SMS Alert** to dispatch.
- **Constraint**: Dispatcher (human) remains the final decision-maker for backup allocation.

### 🟡 1.2 TIER 2: Multimodal Confirmation (Guardian Overwatch)
Tier 2 activates only during confirmed high-stress events to provide visual corroboration.

- **Capabilities**: 
  - **On-Demand Video**: Pulls 30-second clips only when Tier 1 models agree.
  - **YOLOv8-M Vision**: Analyzes the stream for **brandished weapons** (firearms/knives) and multiple attackers.
  - **Fusion Logic**: Requires **Consensus** between Tier 1 (Audio) and Tier 2 (Visual) before taking action.
- **Protocol**: **Autonomous Dispatch (Silent 10-33)** via RoIP injection.
- **Metric**: Backup initiated in **<20 seconds** from incident start.

### 🔴 1.3 TIER 3: Emergency Protocol (Officer Down)
The fail-safe layer for when an officer is incapacitated.

- **Capabilities**:
  - **Kinematic Threat detection**: Detects **horizon line shifts (>90 deg)** and static poses indicating a prone officer.
  - **Silence/Impact Analysis**: Detects high-G BWC impact followed by extended radio/vocal silence.
- **Protocol**: **Force Broadcast** to all units + Automatic EMS notification.

---

## 2. Thresholds & Accuracy Logic

### 2.1 Probabilistic Pattern Indicators
The system does not "diagnose" danger with absolute certainty; it identifies patterns that exceed specific thresholds:
- **Gunshot Detection**: Requires spectral match >85% + acoustic transient >110dB (ambient adjusted).
- **Vocal Stress**: Analyzes pitch variance and syllable rate, not emotional content.
- **Weapon Detection**: YOLOv8-M requires >82% confidence for "brandished" classification.

### 2.2 N-Best Phoneme Disambiguation
To prevent false "Gun!" alerts, the system uses an N-best phoneme list that checks the acoustic environment (RT60 reverberation). If "Gun" and "Run" are phonetically ambiguous in a concrete tunnel, Tier 2 video pull is used to confirm before dispatching.

---

## 3. Critical Limitations & Boundaries

### 3.1 Network & Connectivity
- **Latency**: While autonomous dispatch targets <20s, network congestion or poor cellular signal can delay RoIP injection.
- **Connectivity**: If LTE/5G is lost, the device enters **Offline Buffer Mode**, logging data for forensic audit (Tier 1 fallback).

### 3.2 Environmental Interference
- **Acoustic Masking**: High-decibel machinery, rotor noise (Aviation), or sirens can mask Tier 1 audio detection. The system adjusts thresholds dynamically but cannot overcome total signal clipping.
- **Visual Occlusion**: Body-worn cameras can be blocked by arms, gear, or the officer’s posture. Tier 2 requires a clear sightline for weapon classification.

### 3.3 Non-Diagnostic Clause
The system is **NOT a medical diagnostic tool**. It detects physical states (prone, static) using kinematics, but does not measure vitals or physiological health directly.

---

## 4. Liability & Responsibility

### 4.1 Human-in-the-Loop
Vantus is a "Partner," not a supervisor. 
- In **Tier 1**, a human dispatcher must evaluate the alert.
- In **Tier 2**, while dispatch is autonomous, supervisors can **Veto** via the Intelligent Triage Gate.

### 4.2 Liability Boundary
The system manufacturer and operators are not liable for operational decisions made by officers or supervisors. The system provides the **best possible data** within technical limits, but does not replace the individual officer’s tactical training or command authority.

---

## 5. Compliance: CA SB 524 (The Scribe Layer)
All events are recorded in an **Immutable Audit Trail**. Every Tier 2 video pull and Tier 3 emergency broadcast is timestamped to the millisecond, providing a forensic chain-of-custody for every autonomous action taken.

---

**END OF DOCUMENT**
**Version 2.1 (Tiered Architecture Alignment)**
