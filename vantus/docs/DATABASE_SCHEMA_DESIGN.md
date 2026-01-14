# Database Schema Design

**Purpose:** Database schema designs for persistent storage of Vantus system data.

**Status:** Design complete - Ready for implementation when database is chosen

---

## Overview

The Vantus system requires persistent storage for:
1. **Baselines** - Per-officer, per-context behavioral baselines
2. **Officers** - Officer metadata and authentication
3. **Sessions** - Active and historical officer sessions
4. **Signals** - Contextual signals generated during sessions
5. **Audit Logs** - Immutable audit trail for compliance

---

## 1. BASELINES TABLE

**Purpose:** Store per-officer, per-context behavioral baselines

```sql
CREATE TABLE baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id VARCHAR(100) NOT NULL,
  context_movement VARCHAR(50) NOT NULL, -- 'on_foot' | 'in_vehicle'
  context_time_of_day VARCHAR(50) NOT NULL, -- 'day' | 'night'
  context_operational VARCHAR(50) NOT NULL, -- 'routine' | 'traffic_stop' | 'checkpoint'
  
  -- Movement metrics
  avg_speed DECIMAL(10, 2),
  speed_std DECIMAL(10, 2),
  avg_acceleration DECIMAL(10, 2),
  avg_deceleration DECIMAL(10, 2),
  deceleration_std DECIMAL(10, 2),
  stop_duration_median DECIMAL(10, 2),
  stop_duration_iqr DECIMAL(10, 2),
  heading_variance_avg DECIMAL(10, 2),
  pace_reversal_avg DECIMAL(10, 2),
  pace_reversal_std DECIMAL(10, 2),
  
  -- Speech metrics
  mean_wpm DECIMAL(10, 2),
  std_wpm DECIMAL(10, 2),
  median_wpm DECIMAL(10, 2),
  repetition_rate_median DECIMAL(10, 2),
  repetition_rate_mad DECIMAL(10, 2),
  
  -- Routine metrics
  routine_duration_median DECIMAL(10, 2),
  routine_duration_iqr DECIMAL(10, 2),
  
  -- Metadata
  data_points INTEGER DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_baselines_officer_context (officer_id, context_movement, context_time_of_day, context_operational),
  INDEX idx_baselines_officer (officer_id),
  INDEX idx_baselines_updated (last_updated)
);

-- Baseline data windows (for rolling adaptive baselines)
CREATE TABLE baseline_data_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_id UUID NOT NULL REFERENCES baselines(id) ON DELETE CASCADE,
  window_type VARCHAR(20) NOT NULL, -- 'short_term' | 'mid_term' | 'long_term'
  data JSONB NOT NULL, -- Array of telemetry points
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_baseline_windows_baseline (baseline_id),
  INDEX idx_baseline_windows_type (window_type),
  INDEX idx_baseline_windows_dates (window_start, window_end)
);
```

---

## 2. OFFICERS TABLE

**Purpose:** Store officer metadata and authentication information

```sql
CREATE TABLE officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_number VARCHAR(50) UNIQUE NOT NULL,
  officer_id VARCHAR(100) UNIQUE NOT NULL, -- Formatted ID (e.g., WVPS-12345)
  name VARCHAR(200),
  unit VARCHAR(100),
  rank VARCHAR(50),
  department VARCHAR(100) NOT NULL,
  
  -- Authentication (hashed PIN)
  pin_hash VARCHAR(255) NOT NULL, -- bcrypt/argon2 hash
  pin_salt VARCHAR(255),
  
  -- Biometric
  biometric_enabled BOOLEAN DEFAULT false,
  biometric_template TEXT, -- Encrypted biometric template
  
  -- Status
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_officers_badge (badge_number),
  INDEX idx_officers_officer_id (officer_id),
  INDEX idx_officers_department (department),
  INDEX idx_officers_active (active)
);
```

---

## 3. SESSIONS TABLE

**Purpose:** Store active and historical officer sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  officer_id VARCHAR(100) NOT NULL,
  badge_number VARCHAR(50) NOT NULL,
  
  -- Session timing
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  
  -- Session state
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'ended' | 'crashed'
  
  -- Calibration data
  calibration_data JSONB, -- Heart rate baseline, audio baseline, etc.
  
  -- Summary statistics
  telemetry_count INTEGER DEFAULT 0,
  marker_count INTEGER DEFAULT 0,
  signal_count INTEGER DEFAULT 0,
  
  -- Metadata
  device_info JSONB, -- Device type, OS version, app version
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_sessions_officer (officer_id),
  INDEX idx_sessions_badge (badge_number),
  INDEX idx_sessions_status (status),
  INDEX idx_sessions_start_time (start_time),
  INDEX idx_sessions_session_id (session_id)
);

-- Session telemetry data (for detailed analysis)
CREATE TABLE session_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  altitude DECIMAL(10, 2),
  heading DECIMAL(5, 2),
  speed DECIMAL(10, 2), -- m/s
  
  -- Movement
  acceleration_x DECIMAL(10, 2),
  acceleration_y DECIMAL(10, 2),
  acceleration_z DECIMAL(10, 2),
  
  -- Timestamp
  timestamp TIMESTAMP NOT NULL,
  
  INDEX idx_telemetry_session (session_id),
  INDEX idx_telemetry_timestamp (timestamp)
);

-- Session marker events
CREATE TABLE session_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL, -- 'traffic_stop' | 'suspicious_activity' | 'checkpoint'
  timestamp TIMESTAMP NOT NULL,
  location JSONB, -- { lat, lng }
  notes TEXT,
  
  INDEX idx_markers_session (session_id),
  INDEX idx_markers_type (event_type),
  INDEX idx_markers_timestamp (timestamp)
);

-- Session audio transcripts
CREATE TABLE session_audio_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  
  transcript TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  confidence DECIMAL(3, 2), -- 0.0 to 1.0
  
  INDEX idx_audio_session (session_id),
  INDEX idx_audio_timestamp (timestamp)
);
```

---

## 4. SIGNALS TABLE

**Purpose:** Store contextual signals generated during sessions

```sql
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id VARCHAR(100) UNIQUE NOT NULL,
  session_id VARCHAR(100) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  officer_id VARCHAR(100) NOT NULL,
  
  -- Signal metadata
  signal_type VARCHAR(50) NOT NULL, -- 'movement_anomaly' | 'vocal_stress' | 'contextual_drift'
  category VARCHAR(50) NOT NULL, -- 'abrupt_stop' | 'stationary_duration' | 'pacing' | etc.
  timestamp TIMESTAMP NOT NULL,
  
  -- Signal data
  probability DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
  explanation TEXT NOT NULL, -- Human-readable explanation
  origin_data JSONB NOT NULL, -- Traceable origin data
  
  -- Context
  context_movement VARCHAR(50),
  context_time_of_day VARCHAR(50),
  context_operational VARCHAR(50),
  
  -- Baseline comparison
  baseline_value DECIMAL(10, 2),
  observed_value DECIMAL(10, 2),
  deviation_type VARCHAR(20), -- 'above' | 'below' | 'pattern_change'
  
  -- Status
  flagged BOOLEAN DEFAULT false,
  flagged_by VARCHAR(100), -- Supervisor ID
  flagged_at TIMESTAMP,
  review_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_signals_session (session_id),
  INDEX idx_signals_officer (officer_id),
  INDEX idx_signals_type (signal_type),
  INDEX idx_signals_category (category),
  INDEX idx_signals_timestamp (timestamp),
  INDEX idx_signals_flagged (flagged)
);
```

---

## 5. AUDIT LOGS TABLE

**Purpose:** Immutable audit trail for compliance and legal discovery

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_type VARCHAR(100) NOT NULL, -- 'SESSION_START' | 'SIGNAL_GENERATED' | 'DISPATCH_TRIGGERED' | etc.
  event_category VARCHAR(50) NOT NULL, -- 'session' | 'signal' | 'dispatch' | 'admin' | 'auth'
  
  -- Actor
  actor_type VARCHAR(50) NOT NULL, -- 'officer' | 'supervisor' | 'admin' | 'system'
  actor_id VARCHAR(100),
  actor_name VARCHAR(200),
  
  -- Target (what was acted upon)
  target_type VARCHAR(50), -- 'session' | 'signal' | 'officer' | etc.
  target_id VARCHAR(100),
  
  -- Event data
  event_data JSONB NOT NULL, -- Full event payload
  event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Context
  session_id VARCHAR(100),
  officer_id VARCHAR(100),
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  
  -- Compliance
  immutable BOOLEAN DEFAULT true, -- Cannot be deleted
  retention_until TIMESTAMP, -- When record can be archived
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_audit_event_type (event_type),
  INDEX idx_audit_category (event_category),
  INDEX idx_audit_actor (actor_type, actor_id),
  INDEX idx_audit_timestamp (event_timestamp),
  INDEX idx_audit_session (session_id),
  INDEX idx_audit_officer (officer_id),
  INDEX idx_audit_retention (retention_until)
);
```

---

## 6. DISPATCHES TABLE

**Purpose:** Store auto-dispatch and manual dispatch records

```sql
CREATE TABLE dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- Trigger
  trigger_type VARCHAR(50) NOT NULL, -- 'auto' | 'manual' | 'welfare_check'
  trigger_condition VARCHAR(100), -- 'CRITICAL_THREAT' | 'HEART_RATE_ELEVATED' | etc.
  
  -- Officer
  officer_id VARCHAR(100) NOT NULL,
  badge_number VARCHAR(50) NOT NULL,
  session_id VARCHAR(100),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT, -- Reverse geocoded address
  
  -- Threat information
  threat_type VARCHAR(50),
  confidence DECIMAL(5, 4),
  detection_results JSONB, -- Full detection results
  
  -- Dispatch payload
  cad_payload JSONB NOT NULL, -- Full CAD dispatch payload
  cad_response JSONB, -- CAD system response
  cad_id VARCHAR(100), -- CAD system dispatch ID
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'sent' | 'confirmed' | 'failed'
  sent_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_dispatches_officer (officer_id),
  INDEX idx_dispatches_session (session_id),
  INDEX idx_dispatches_status (status),
  INDEX idx_dispatches_trigger (trigger_type),
  INDEX idx_dispatches_timestamp (created_at)
);
```

---

## 7. VIDEO CLIPS TABLE

**Purpose:** Store metadata for saved video clips

```sql
CREATE TABLE video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- Associated session/event
  session_id VARCHAR(100) NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
  signal_id VARCHAR(100) REFERENCES signals(signal_id) ON DELETE SET NULL,
  dispatch_id VARCHAR(100) REFERENCES dispatches(dispatch_id) ON DELETE SET NULL,
  
  -- Clip metadata
  trigger_type VARCHAR(50) NOT NULL, -- 'signal' | 'dispatch' | 'manual'
  trigger_timestamp TIMESTAMP NOT NULL,
  
  -- Video file
  file_path TEXT NOT NULL, -- Encrypted file path
  file_size_bytes BIGINT,
  duration_seconds INTEGER, -- Should be 60 seconds (30s pre + 30s post)
  
  -- Video properties
  resolution VARCHAR(20) DEFAULT '480p', -- 480p
  frame_rate INTEGER DEFAULT 15, -- 15 FPS
  encrypted BOOLEAN DEFAULT true,
  encryption_key_id VARCHAR(100), -- Reference to encryption key
  
  -- Status
  uploaded BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP,
  storage_location VARCHAR(100), -- 'local' | 'cloud' | 'archive'
  
  -- Retention
  retention_until TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_video_session (session_id),
  INDEX idx_video_signal (signal_id),
  INDEX idx_video_dispatch (dispatch_id),
  INDEX idx_video_trigger (trigger_type),
  INDEX idx_video_retention (retention_until)
);
```

---

## RELATIONSHIPS

```
officers (1) ──< (many) sessions
sessions (1) ──< (many) signals
sessions (1) ──< (many) session_telemetry
sessions (1) ──< (many) session_markers
sessions (1) ──< (many) session_audio_transcripts
sessions (1) ──< (many) video_clips
sessions (1) ──< (many) dispatches
baselines (many) ──> (1) officers
signals (many) ──> (1) sessions
dispatches (many) ──> (1) sessions
video_clips (many) ──> (1) sessions
```

---

## DATA RETENTION POLICIES

### Baselines
- **Retention:** Indefinite (updated, not deleted)
- **Archive:** After 1 year of inactivity, move to archive table

### Sessions
- **Retention:** 90 days active, then archive
- **Archive:** Move to `sessions_archive` table after 90 days

### Signals
- **Retention:** 90 days active, then archive
- **Archive:** Move to `signals_archive` table after 90 days
- **Flagged signals:** Retain indefinitely

### Audit Logs
- **Retention:** 7 years (legal requirement)
- **Deletion:** After 7 years, can be deleted (if not flagged for legal hold)

### Video Clips
- **Retention:** 30 days default, 90 days if associated with flagged signal
- **Deletion:** Automatic deletion after retention period

### Dispatches
- **Retention:** 7 years (legal requirement)
- **Archive:** Move to archive table after 1 year

---

## MIGRATION STRATEGY

1. **Phase 1:** Create tables with current schema
2. **Phase 2:** Migrate in-memory baselines to database
3. **Phase 3:** Implement session persistence
4. **Phase 4:** Implement signal persistence
5. **Phase 5:** Implement audit logging
6. **Phase 6:** Implement video clip metadata storage

---

## NOTES

- All timestamps use UTC
- All JSONB fields are indexed using GIN indexes (PostgreSQL)
- Foreign keys use `ON DELETE CASCADE` for dependent data
- Audit logs use `ON DELETE RESTRICT` to prevent deletion
- All tables include `created_at` and `updated_at` timestamps
- UUIDs are used for primary keys for distributed system compatibility
