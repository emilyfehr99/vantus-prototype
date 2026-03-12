# Vantus Operational roadmap: The 3-Tier "Active AI Partner"

This document outlines the operational roadmap for Vantus Safety Systems, focused on a three-tier escalation architecture that balances officer safety with extreme cost-efficiency.

---

## 🟢 TIER 1: Audio-Only Alerts (The "Acoustic Sentinel")
**Focus:** 24/7 background overwatch with minimal payload.
**Cost:** ~$8/officer/year.

### 🔍 Detection Capabilities
- **Voice-Stress Trigger**: Natural Language Processing (NLP) monitors for "High-Arousal" vocal tones and specific "Code 3" keywords (e.g., "Drop it!", "10-33", "Gun!").
- **Acoustic Sentinel**: Spectral analysis detects gunshots (>140dB impulse), glass breaking, impact sounds, and struggle audio.

### 🚀 Action
- **SMS Dispatch**: Automatically sends a high-priority SMS alert to the dispatcher.
- **Human-in-the-Loop**: The dispatcher receives the alert and decides whether to escalate or send backup based on the audio transcript/context.

---

## 🟡 TIER 2: Audio + Video Confirmed (The "Guardian" Overwatch)
**Focus:** Multi-modal confirmation for autonomous dispatch authority.
**Cost:** ~$2/officer/year (Video is only pulled on-demand, ~480 times/year/officer).

### 🔍 Detection Capabilities
- **Guardian Overwatch**: When 2+ audio models (Tier 1) agree on a threat, the system initiates an on-demand 30-second video pull (30s pre-buffer + real-time stream).
- **YOLOv8-M Computer Vision**: Analyzes the video stream for brandished weapons (firearms/knives), multiple attackers, and aggressive stances.
- **Multimodal Consensus**: Requires both Audio (stress/gunshot) and Video (weapon/stance) to agree before taking autonomous action.

### 🚀 Action
- **Autonomous Dispatch (Silent 10-33)**: Vantus auto-injects a Priority 1 Backup Request directly into the officer's talkgroup via RoIP (Radio over IP).
- **Survival Metric**: Backup is rolling in **<20 seconds** from the initial incident start.

---

## 🔴 TIER 3: Officer Down (Emergency Protocol)
**Focus:** Fail-safe rescue when an officer is incapacitated.
**Cost:** High-priority bandwidth allocation.

### 🔍 Detection Capabilities
- **Kinematic Threat Detection**: AI analyzes BWC horizon line shifts (>90 degrees) combined with a static pose (>10 seconds) to identify a prone or unconscious officer.
- **Silence Analysis**: Detects a high-G impact sound (BWC hit) followed by no radio/vocal activity for 10+ seconds.
- **Video Confirmation**: Force-pulls a live video feed to confirm if the officer is on the ground and immobile.

### 🚀 Action
- **Force Broadcast**: Triggers an emergency RoIP broadcast to ALL units on all talkgroups.
- **Automatic EMS**: Direct notification to Emergency Medical Services with precise GPS coordinates.
- **Immediate Overwatch**: Notifies the nearest 5 units with an audible "Officer Down" siren tone.

---

## Technical Summary Table

| Layer | Primary Sensor | Mode | Cost/Year | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | Mic (24/7) | Continuous | $8 | SMS to Dispatch |
| **Tier 2** | Mic + Camera | On-Demand | $2 | Autonomous Dispatch (RoIP) |
| **Tier 3** | Accel + Camera | Emergency | N/A | Force Broadcast + EMS |

