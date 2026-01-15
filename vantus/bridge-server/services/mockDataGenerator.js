/**
 * Mock Data Generator Service
 * Generates realistic test data for development and testing
 */

const crypto = require('crypto');

// Sample data pools
const FIRST_NAMES = ['Sarah', 'Michael', 'Jennifer', 'David', 'Emily', 'James', 'Amanda', 'Robert', 'Jessica', 'Christopher'];
const LAST_NAMES = ['Chen', 'Torres', 'Liu', 'Martinez', 'Johnson', 'Williams', 'Brown', 'Davis', 'Garcia', 'Wilson'];
const UNITS = ['Patrol Unit 1', 'Patrol Unit 2', 'Traffic Division', 'Downtown Beat', 'K-9 Unit', 'Special Response', 'Community Policing'];
const CALL_TYPES = ['Traffic Stop', 'Domestic Disturbance', 'Wellness Check', 'Suspicious Activity', 'Noise Complaint', 'Vehicle Accident', 'Assault Report', 'Burglary Response'];
const STREETS = ['Main Street', 'Oak Avenue', 'Park Drive', 'Highland Road', 'Marine Drive', 'First Avenue', 'Broadway', 'Commercial Street'];
const DETECTION_TYPES = ['STANCE_ALERT', 'HANDS_ALERT', 'WEAPON_ALERT', 'MOVEMENT_ALERT', 'AUDIO_ALERT'];
const DETECTION_DESCRIPTIONS = {
    STANCE_ALERT: ['Bladed stance detected', 'Aggressive posture detected', 'Fighting stance observed'],
    HANDS_ALERT: ['Right hand not visible', 'Left hand concealed', 'Hands behind back', 'Reaching motion detected'],
    WEAPON_ALERT: ['Handgun detected', 'Long gun detected', 'Knife detected', 'Blunt object detected'],
    MOVEMENT_ALERT: ['Rapid approach detected', 'Flanking movement observed', 'Subject circling'],
    AUDIO_ALERT: ['Raised voices detected', 'Threat keywords identified', 'Distress call detected'],
};

class MockDataGenerator {
    /**
     * Generate random badge number
     */
    generateBadgeNumber(prefix = 'WPS') {
        return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    /**
     * Generate random officer
     */
    generateOfficer(options = {}) {
        const firstName = options.firstName || FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const lastName = options.lastName || LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

        return {
            id: crypto.randomUUID(),
            badgeNumber: options.badgeNumber || this.generateBadgeNumber(),
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            unit: options.unit || UNITS[Math.floor(Math.random() * UNITS.length)],
            role: options.role || 'officer',
            status: options.status || 'active',
            trainingComplete: options.trainingComplete ?? Math.random() > 0.2,
            lastActive: options.lastActive || this.randomDate(7).toISOString(),
        };
    }

    /**
     * Generate multiple officers
     */
    generateOfficers(count = 10) {
        return Array.from({ length: count }, () => this.generateOfficer());
    }

    /**
     * Generate random location
     */
    generateLocation(options = {}) {
        const streetNumber = Math.floor(100 + Math.random() * 9900);
        const street = STREETS[Math.floor(Math.random() * STREETS.length)];
        const city = options.city || 'West Vancouver';
        const province = options.province || 'BC';

        return {
            address: `${streetNumber} ${street}, ${city}, ${province}`,
            coordinates: {
                lat: options.baseLat ? options.baseLat + (Math.random() - 0.5) * 0.1 : 49.32 + (Math.random() - 0.5) * 0.1,
                lng: options.baseLng ? options.baseLng + (Math.random() - 0.5) * 0.1 : -123.16 + (Math.random() - 0.5) * 0.1,
            },
        };
    }

    /**
     * Generate random detection event
     */
    generateDetection(timestamp = null) {
        const type = DETECTION_TYPES[Math.floor(Math.random() * DETECTION_TYPES.length)];
        const descriptions = DETECTION_DESCRIPTIONS[type];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const confidence = 0.5 + Math.random() * 0.45; // 50-95%

        return {
            id: crypto.randomUUID(),
            type,
            description,
            confidence,
            timestamp: timestamp || new Date().toISOString(),
        };
    }

    /**
     * Generate detection timeline for an incident
     */
    generateDetectionTimeline(count = 5, startTime = null) {
        const start = startTime ? new Date(startTime) : new Date();
        const detections = [];

        for (let i = 0; i < count; i++) {
            const time = new Date(start.getTime() + i * (5000 + Math.random() * 30000)); // 5-35 seconds apart
            detections.push(this.generateDetection(time.toISOString()));
        }

        return detections;
    }

    /**
     * Generate biometric data
     */
    generateBiometricData(options = {}) {
        const baseline = options.baseline || 65 + Math.floor(Math.random() * 15); // 65-80 BPM
        const peak = options.peak || baseline + 40 + Math.floor(Math.random() * 60); // baseline + 40-100 BPM
        const peakTime = options.peakTime || new Date().toISOString();
        const elevatedMinutes = 1 + Math.floor(Math.random() * 10);
        const elevatedSeconds = Math.floor(Math.random() * 60);

        return {
            baseline,
            peak,
            peakTime,
            elevatedDuration: `${elevatedMinutes} min ${elevatedSeconds} sec`,
            samples: this.generateHeartRateSamples(baseline, peak, 30),
        };
    }

    /**
     * Generate heart rate sample series
     */
    generateHeartRateSamples(baseline, peak, count = 30) {
        const samples = [];
        const now = Date.now();

        for (let i = 0; i < count; i++) {
            // Create a realistic curve: start at baseline, spike, then return
            const progress = i / count;
            let hr;
            if (progress < 0.3) {
                hr = baseline + (peak - baseline) * (progress / 0.3);
            } else if (progress < 0.5) {
                hr = peak;
            } else {
                hr = peak - (peak - baseline) * ((progress - 0.5) / 0.5);
            }

            hr = Math.round(hr + (Math.random() - 0.5) * 10); // Add noise

            samples.push({
                timestamp: new Date(now - (count - i) * 10000).toISOString(),
                heartRate: hr,
            });
        }

        return samples;
    }

    /**
     * Generate session data
     */
    generateSession(options = {}) {
        const startTime = options.startTime || this.randomDate(1);
        const durationMinutes = options.durationMinutes || 30 + Math.floor(Math.random() * 300); // 30 min - 5.5 hours
        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

        return {
            sessionId: crypto.randomUUID(),
            officerId: options.officerId || this.generateBadgeNumber(),
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            telemetryData: this.generateTelemetryData(Math.floor(durationMinutes / 5)),
            markerEvents: this.generateMarkerEvents(Math.floor(Math.random() * 10)),
            audioTranscripts: [],
            status: 'completed',
        };
    }

    /**
     * Generate telemetry data
     */
    generateTelemetryData(count = 20) {
        const now = Date.now();
        const data = [];

        for (let i = 0; i < count; i++) {
            data.push({
                timestamp: new Date(now - (count - i) * 300000).toISOString(), // Every 5 minutes
                heartRate: 60 + Math.floor(Math.random() * 40),
                movement: Math.random() * 5,
                gps: this.generateLocation(),
                threatLevel: ['low', 'medium', 'elevated', 'warning'][Math.floor(Math.random() * 4)],
            });
        }

        return data;
    }

    /**
     * Generate marker events
     */
    generateMarkerEvents(count = 5) {
        const types = ['vehicle_stop', 'subject_contact', 'backup_requested', 'code4', 'note'];
        const events = [];
        const now = Date.now();

        for (let i = 0; i < count; i++) {
            events.push({
                id: crypto.randomUUID(),
                type: types[Math.floor(Math.random() * types.length)],
                timestamp: new Date(now - Math.random() * 3600000).toISOString(),
                note: Math.random() > 0.5 ? 'Officer note here' : null,
            });
        }

        return events;
    }

    /**
     * Generate incident report data
     */
    generateIncidentData(options = {}) {
        const officer = options.officer || this.generateOfficer();
        const session = this.generateSession({ officerId: officer.badgeNumber });

        return {
            officerInfo: {
                name: officer.name,
                badgeNumber: officer.badgeNumber,
                unit: officer.unit,
            },
            sessionData: session,
            detectionTimeline: this.generateDetectionTimeline(3 + Math.floor(Math.random() * 5)),
            biometricData: this.generateBiometricData(),
            factLog: this.generateFactLog(10 + Math.floor(Math.random() * 40)),
            videoClips: Math.random() > 0.5 ? [{ id: '1', duration: 60 }, { id: '2', duration: 60 }] : [],
            location: this.generateLocation(),
            cadReference: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
            callType: CALL_TYPES[Math.floor(Math.random() * CALL_TYPES.length)],
        };
    }

    /**
     * Generate fact log entries
     */
    generateFactLog(count = 20) {
        const log = [];
        const now = Date.now();
        let previousHash = null;

        for (let i = 0; i < count; i++) {
            const entry = {
                index: i,
                timestamp: new Date(now - (count - i) * 60000).toISOString(),
                type: ['DETECTION', 'DISPATCH', 'MARKER', 'TELEMETRY'][Math.floor(Math.random() * 4)],
                data: { value: Math.random() },
                previousHash,
            };

            entry.checksum = crypto
                .createHash('sha256')
                .update(JSON.stringify(entry))
                .digest('hex')
                .substring(0, 16);

            previousHash = entry.checksum;
            log.push(entry);
        }

        return log;
    }

    /**
     * Generate calibration data
     */
    generateCalibrationData(officerId) {
        return {
            officerId,
            createdAt: new Date().toISOString(),
            restingHeartRate: 60 + Math.floor(Math.random() * 20),
            heartRateVariability: 20 + Math.floor(Math.random() * 30),
            baselineStressLevel: 0.2 + Math.random() * 0.3,
            movementPatterns: {
                walkingSpeed: 1.2 + Math.random() * 0.8,
                standingStability: 0.8 + Math.random() * 0.2,
            },
            voiceProfile: {
                baselinePitch: 100 + Math.floor(Math.random() * 100),
                speakingRate: 120 + Math.floor(Math.random() * 40),
            },
        };
    }

    /**
     * Helper: Random date within last N days
     */
    randomDate(daysAgo = 7) {
        const now = Date.now();
        const past = now - Math.random() * daysAgo * 24 * 60 * 60 * 1000;
        return new Date(past);
    }
}

module.exports = new MockDataGenerator();
