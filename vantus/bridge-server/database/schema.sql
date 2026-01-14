-- Vantus AI Partner Database Schema
-- Baseline Calibration and Signal Storage

-- Officers Table
CREATE TABLE IF NOT EXISTS officers (
  id SERIAL PRIMARY KEY,
  badge_number VARCHAR(50) UNIQUE NOT NULL,
  officer_id VARCHAR(100) UNIQUE NOT NULL, -- Generated ID (e.g., WVPS-12345)
  name VARCHAR(255),
  unit VARCHAR(100),
  rank VARCHAR(50),
  department_id VARCHAR(50),
  active BOOLEAN DEFAULT true,
  hire_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_officers_badge ON officers(badge_number);
CREATE INDEX idx_officers_officer_id ON officers(officer_id);

-- Baseline Calibration Table
CREATE TABLE IF NOT EXISTS baselines (
  id SERIAL PRIMARY KEY,
  officer_id VARCHAR(100) NOT NULL,
  context VARCHAR(50) NOT NULL, -- 'on_foot', 'vehicle', 'day', 'night'
  metric_type VARCHAR(50) NOT NULL, -- 'heart_rate', 'movement', 'audio', etc.
  baseline_value JSONB NOT NULL, -- Store baseline data as JSON
  sample_count INTEGER DEFAULT 0,
  calibration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE
);

CREATE INDEX idx_baselines_officer_context ON baselines(officer_id, context);
CREATE INDEX idx_baselines_calibration_date ON baselines(calibration_date);

-- Signals Table
CREATE TABLE IF NOT EXISTS signals (
  id SERIAL PRIMARY KEY,
  officer_id VARCHAR(100) NOT NULL,
  signal_category VARCHAR(50) NOT NULL, -- 'weapon', 'stance', 'hands', 'audio', etc.
  signal_type VARCHAR(100),
  probability DECIMAL(5, 4) NOT NULL, -- 0.0000 to 1.0000
  confidence DECIMAL(5, 4),
  detection_data JSONB, -- Store detection details as JSON
  timestamp TIMESTAMP NOT NULL,
  location JSONB, -- { lat, lng, address }
  context VARCHAR(50), -- 'routine', 'traffic_stop', etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE
);

CREATE INDEX idx_signals_officer_timestamp ON signals(officer_id, timestamp);
CREATE INDEX idx_signals_category ON signals(signal_category);
CREATE INDEX idx_signals_timestamp ON signals(timestamp);

-- Video Clips Table
CREATE TABLE IF NOT EXISTS video_clips (
  id SERIAL PRIMARY KEY,
  officer_id VARCHAR(100) NOT NULL,
  clip_path VARCHAR(500) NOT NULL,
  encryption_key_hash VARCHAR(255), -- Hash of encryption key (not the key itself)
  trigger_signal_id INTEGER, -- Reference to signals table
  pre_trigger_duration INTEGER DEFAULT 30, -- seconds
  post_trigger_duration INTEGER DEFAULT 30, -- seconds
  duration INTEGER, -- total seconds
  file_size BIGINT, -- bytes
  quality VARCHAR(20), -- '480p', '720p', etc.
  fps INTEGER,
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
  FOREIGN KEY (trigger_signal_id) REFERENCES signals(id) ON DELETE SET NULL
);

CREATE INDEX idx_video_clips_officer ON video_clips(officer_id);
CREATE INDEX idx_video_clips_recorded_at ON video_clips(recorded_at);

-- Audio Transcripts Table
CREATE TABLE IF NOT EXISTS audio_transcripts (
  id SERIAL PRIMARY KEY,
  officer_id VARCHAR(100) NOT NULL,
  transcript_text TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  signal_id INTEGER, -- Reference to signals table if triggered by signal
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE,
  FOREIGN KEY (signal_id) REFERENCES signals(id) ON DELETE SET NULL
);

CREATE INDEX idx_audio_transcripts_officer ON audio_transcripts(officer_id);
CREATE INDEX idx_audio_transcripts_timestamp ON audio_transcripts(timestamp);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  officer_id VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_officer ON audit_logs(officer_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- PIN Hashes Table (Secure Storage)
CREATE TABLE IF NOT EXISTS pin_hashes (
  id SERIAL PRIMARY KEY,
  badge_number VARCHAR(50) UNIQUE NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (badge_number) REFERENCES officers(badge_number) ON DELETE CASCADE
);

CREATE INDEX idx_pin_hashes_badge ON pin_hashes(badge_number);

-- Dispatch History Table
CREATE TABLE IF NOT EXISTS dispatch_history (
  id SERIAL PRIMARY KEY,
  officer_id VARCHAR(100) NOT NULL,
  dispatch_type VARCHAR(50) NOT NULL, -- 'PRIORITY_1_BACKUP', 'WELFARE_CHECK', etc.
  location JSONB NOT NULL,
  threat_data JSONB,
  detection_results JSONB,
  telemetry_state JSONB,
  cad_reference VARCHAR(100), -- CAD system reference number
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'dispatched', 'cancelled', 'completed'
  dispatched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (officer_id) REFERENCES officers(officer_id) ON DELETE CASCADE
);

CREATE INDEX idx_dispatch_history_officer ON dispatch_history(officer_id);
CREATE INDEX idx_dispatch_history_status ON dispatch_history(status);
CREATE INDEX idx_dispatch_history_dispatched_at ON dispatch_history(dispatched_at);
