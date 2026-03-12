# Vantus AI — Edge Cases & False Positive Mitigations

Critical failure scenarios identified for the automated backup dispatch system. Each entry includes the trigger risk and the engineered mitigation strategy.

---

## 1. Multi-Officer Interaction (Solo Mode Violation)
**Risk:** Two+ officers on scene talking casually — one says "I needed backup on that last call" or "watch my back."

**Mitigation:**
- **Hard "Solo Mode" filter first** — cross-reference GPS + other Axon BWCs in proximity (via Fusus integration) or Bluetooth pings
- If ≥1 other Axon unit within ~50 ft and moving together → **auto-suppress** or drop sensitivity to near-zero
- Add visual confirmation (multiple uniforms/badges in frame)

---

## 2. Backup Arrives Mid-Call (Dynamic Solo → Team Shift)
**Risk:** AI flags distress early (solo), backup shows up 30 seconds later, but AI keeps alerting.

**Mitigation:**
- **Real-time proximity monitoring** — once second unit detected, silence alerts for that incident unless new escalation detected

---

## 3. Training / Role-Play / Academy Scenarios
**Risk:** Simulated fights, "officer down" drills, or scenario training with yelling and physical contact.

**Mitigation:**
- **Geofence known training locations** (or let agency upload polygons)
- Officer/app supervisor can toggle **"Training Mode"** shift-wide (logs it for audit)
- Lower confidence threshold required during training

---

## 4. Radio Bleed / Background Audio (TV, Phone, Civilian Keywords)
**Risk:** Radio traffic elsewhere says "backup," or a suspect/citizen yells "I need backup!" jokingly, or TV in background has cop show drama.

**Mitigation:**
- **Directional audio + source separation** (Body 4 mics are good; enhance with ML)
- Filter known police radio frequencies
- Require **multimodal confirmation** (audio + visual distress like rapid movement or officer not speaking calmly)

---

## 5. Cultural/Language/Sarcasm/De-Escalation Tone Mismatches
**Risk:** Officer uses department slang, heavy accent, or sarcastic "yeah I'm gonna need backup for this grandma" — or de-escalates with raised voice that sounds aggressive.

**Mitigation:**
- Fine-tune on diverse real BWC datasets (anonymized assaults vs. routine)
- Always output **explainability** ("Flagged: elevated voice + rapid motion, 87% confidence")
- Require **>95% confidence** for auto-alert; otherwise just silent flag to supervisor for review

---

## 6. Officer Down but Camera Obstructed/Covered/Off-Angle
**Risk:** Fight happens, BWC gets knocked sideways or covered — audio is muffled, video useless.

**Mitigation:**
- Layer in existing **Axon accelerometer "officer down" sensor** (already in many Body 4 deployments) as a hard trigger
- If motion stops + no audio for X seconds → **escalate regardless of video**

---

## 7. Environmental Noise Spikes (Sirens, Crowds, Dogs, Construction, Wind)
**Risk:** Loud non-threat sounds mimic struggle (car horn + yelling pedestrian).

**Mitigation:**
- **Anomaly detection** trained to ignore recurring environmental patterns
- GPS/context from CAD (e.g., "known loud area") lowers threshold weight on audio

---

## 8. Officer Explicitly Says "No Backup Needed" or Clears the Scene
**Risk:** AI detects potential issue but officer verbally cancels on radio/body.

**Mitigation:**
- **Voice keyword override** ("cancel backup," "code 4," officer's own voice) immediately silences and logs as false positive for retraining
- **Officer always has final say**

---

## 9. Low-Light / Poor Visibility Calls (Night, Rain, Inside Dark House)
**Risk:** Video analysis fails → over-relies on audio → higher false positives.

**Mitigation:**
- **Confidence scoring weights video less in low-light** (Body 4 has good IR)
- Fall back to **audio + motion + existing sensors**

---

## 10. High-Volume False Positives from Routine Citizen Interactions
**Risk:** Argument with loud civilian, traffic stop with yelling, or mental health call — AI misreads as threat to officer.

**Mitigation:**
- Train heavily on **"officer safety vs. citizen agitation"** distinction (body language: officer stance relaxed vs. defensive)
- Start pilots only on **non-emergency solo calls** to gather data safely

---

## Design Principles (Derived)

| Principle | Implementation |
|---|---|
| **Officer always has final say** | Voice keyword override at any tier |
| **Solo mode is the gate** | GPS + Bluetooth proximity suppresses alerts when not solo |
| **Multimodal > single-modal** | Never auto-dispatch on audio alone (Tier 2+) |
| **Explainability always** | Every flag includes model name, confidence %, and trigger reason |
| **Graceful degradation** | If video fails, fall back to audio + accelerometer + GPS context |
| **Context-aware thresholds** | CAD data, time of day, geofence, and training mode all adjust sensitivity |
