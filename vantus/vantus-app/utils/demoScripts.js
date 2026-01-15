/**
 * Demo Scripts
 * Pre-defined demo scenarios for showcasing Vantus capabilities
 */

// Detection types used in demos
export const DETECTION_TYPES = {
    STANCE_ALERT: 'STANCE_ALERT',
    HANDS_ALERT: 'HANDS_ALERT',
    WEAPON_ALERT: 'WEAPON_ALERT',
    AUTO_DISPATCH: 'AUTO_DISPATCH',
    BACKUP_ARRIVAL: 'BACKUP_ARRIVAL',
    CODE_4: 'CODE_4',
    HEART_RATE_SPIKE: 'HEART_RATE_SPIKE',
    VOICE_THREAT: 'VOICE_THREAT',
    WELFARE_CHECK: 'WELFARE_CHECK',
    SUBJECT_APPROACH: 'SUBJECT_APPROACH',
};

// Color codes for overlay display
export const ALERT_COLORS = {
    STANCE_ALERT: '#3182ce',     // Blue
    HANDS_ALERT: '#dd6b20',      // Orange
    WEAPON_ALERT: '#e53e3e',     // Red
    AUTO_DISPATCH: '#9b2c2c',    // Dark red
    BACKUP_ARRIVAL: '#38a169',   // Green
    CODE_4: '#38a169',           // Green
    HEART_RATE_SPIKE: '#805ad5', // Purple
    VOICE_THREAT: '#d69e2e',     // Yellow
    WELFARE_CHECK: '#3182ce',    // Blue
    SUBJECT_APPROACH: '#dd6b20', // Orange
};

// Voice advisory messages for each detection type
export const VOICE_MESSAGES = {
    STANCE_ALERT: 'Stance change detected',
    HANDS_ALERT: 'Hands not visible',
    WEAPON_ALERT: 'Weapon detected',
    AUTO_DISPATCH: 'Backup requested',
    BACKUP_ARRIVAL: 'Backup on scene',
    CODE_4: 'Code 4, incident resolved',
    HEART_RATE_SPIKE: 'Elevated heart rate',
    VOICE_THREAT: 'Threat keywords detected',
    WELFARE_CHECK: 'Status check - are you okay?',
    SUBJECT_APPROACH: 'Subject approaching',
};

/**
 * Traffic Stop Escalation Demo
 * Standard demo showing weapon detection during traffic stop
 */
export const TRAFFIC_STOP_DEMO = {
    id: 'traffic_stop',
    name: 'Traffic Stop Escalation',
    description: 'Routine traffic stop that escalates to weapon detection',
    duration: 75, // seconds
    officerInfo: {
        name: 'Cst. Sarah Chen',
        badgeNumber: 'WPS-4472',
        unit: 'Patrol Unit 12',
    },
    location: {
        address: '1847 Marine Drive, West Vancouver, BC',
        coordinates: { lat: 49.3270, lng: -123.1650 },
    },
    callType: 'Traffic Stop',
    events: [
        {
            time: 5.0,
            type: DETECTION_TYPES.SUBJECT_APPROACH,
            description: 'Subject exiting vehicle',
            confidence: 0.85,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 12.5,
            type: DETECTION_TYPES.STANCE_ALERT,
            description: 'Bladed stance detected',
            confidence: 0.72,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 15.0,
            type: DETECTION_TYPES.HANDS_ALERT,
            description: 'Right hand not visible',
            confidence: 0.68,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 17.5,
            type: DETECTION_TYPES.HEART_RATE_SPIKE,
            description: 'Heart rate: 142 BPM (baseline: 72)',
            biometric: { current: 142, baseline: 72 },
            confidence: 1.0,
            triggerHaptic: false,
            triggerVoice: false,
        },
        {
            time: 18.2,
            type: DETECTION_TYPES.WEAPON_ALERT,
            description: 'Handgun detected',
            confidence: 0.87,
            triggerHaptic: true,
            triggerVoice: true,
            priority: 'critical',
        },
        {
            time: 18.5,
            type: DETECTION_TYPES.AUTO_DISPATCH,
            description: 'Backup requested automatically',
            confidence: 1.0,
            triggerHaptic: true,
            triggerVoice: true,
            dispatchInfo: {
                priority: 'EMERGENCY',
                unitsRequested: 2,
            },
        },
        {
            time: 45.0,
            type: DETECTION_TYPES.BACKUP_ARRIVAL,
            description: 'Unit 4156 on scene',
            confidence: 1.0,
            triggerHaptic: false,
            triggerVoice: true,
        },
        {
            time: 60.0,
            type: DETECTION_TYPES.CODE_4,
            description: 'Incident resolved',
            confidence: 1.0,
            triggerHaptic: false,
            triggerVoice: true,
        },
    ],
    biometricTimeline: [
        { time: 0, heartRate: 72 },
        { time: 5, heartRate: 78 },
        { time: 10, heartRate: 85 },
        { time: 15, heartRate: 110 },
        { time: 18, heartRate: 142 },
        { time: 20, heartRate: 156 },
        { time: 30, heartRate: 138 },
        { time: 45, heartRate: 115 },
        { time: 60, heartRate: 95 },
        { time: 75, heartRate: 82 },
    ],
};

/**
 * Domestic Disturbance Demo
 * Multi-subject scenario with verbal threats
 */
export const DOMESTIC_DISTURBANCE_DEMO = {
    id: 'domestic_disturbance',
    name: 'Domestic Disturbance',
    description: 'Response to domestic disturbance call with multiple subjects',
    duration: 90,
    officerInfo: {
        name: 'Cst. Michael Torres',
        badgeNumber: 'WPS-3301',
        unit: 'Patrol Unit 8',
    },
    location: {
        address: '425 Oak Street, Vancouver, BC',
        coordinates: { lat: 49.2827, lng: -123.1207 },
    },
    callType: 'Domestic Disturbance',
    events: [
        {
            time: 8.0,
            type: DETECTION_TYPES.VOICE_THREAT,
            description: 'Raised voices detected',
            confidence: 0.75,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 15.0,
            type: DETECTION_TYPES.SUBJECT_APPROACH,
            description: 'Second subject approaching from left',
            confidence: 0.82,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 22.0,
            type: DETECTION_TYPES.STANCE_ALERT,
            description: 'Aggressive posture detected',
            confidence: 0.79,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 28.0,
            type: DETECTION_TYPES.VOICE_THREAT,
            description: 'Threat keywords identified',
            confidence: 0.88,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 35.0,
            type: DETECTION_TYPES.HANDS_ALERT,
            description: 'Subject reaching behind back',
            confidence: 0.71,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 55.0,
            type: DETECTION_TYPES.CODE_4,
            description: 'Subjects separated, de-escalated',
            confidence: 1.0,
            triggerHaptic: false,
            triggerVoice: true,
        },
    ],
    biometricTimeline: [
        { time: 0, heartRate: 75 },
        { time: 10, heartRate: 88 },
        { time: 20, heartRate: 105 },
        { time: 30, heartRate: 118 },
        { time: 40, heartRate: 125 },
        { time: 50, heartRate: 108 },
        { time: 60, heartRate: 92 },
        { time: 75, heartRate: 82 },
        { time: 90, heartRate: 78 },
    ],
};

/**
 * Solo Welfare Check Demo
 * Late night welfare check - the "2 AM solo call" scenario
 */
export const WELFARE_CHECK_DEMO = {
    id: 'welfare_check',
    name: 'Solo Welfare Check (2 AM)',
    description: 'Late night solo welfare check - showcasing backup protection',
    duration: 60,
    officerInfo: {
        name: 'Cst. Jennifer Liu',
        badgeNumber: 'WPS-2156',
        unit: 'Night Patrol',
    },
    location: {
        address: '892 Highland Road, Burnaby, BC',
        coordinates: { lat: 49.2488, lng: -122.9805 },
    },
    callType: 'Wellness Check',
    events: [
        {
            time: 10.0,
            type: DETECTION_TYPES.SUBJECT_APPROACH,
            description: 'Subject at door',
            confidence: 0.78,
            triggerHaptic: false,
            triggerVoice: false,
        },
        {
            time: 20.0,
            type: DETECTION_TYPES.WELFARE_CHECK,
            description: 'Periodic welfare check initiated',
            confidence: 1.0,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 35.0,
            type: DETECTION_TYPES.HANDS_ALERT,
            description: 'Subject hands in pockets',
            confidence: 0.65,
            triggerHaptic: true,
            triggerVoice: true,
        },
        {
            time: 50.0,
            type: DETECTION_TYPES.CODE_4,
            description: 'Subject checked, all clear',
            confidence: 1.0,
            triggerHaptic: false,
            triggerVoice: true,
        },
    ],
    biometricTimeline: [
        { time: 0, heartRate: 70 },
        { time: 15, heartRate: 78 },
        { time: 30, heartRate: 85 },
        { time: 45, heartRate: 80 },
        { time: 60, heartRate: 72 },
    ],
};

/**
 * All available demo scripts
 */
export const DEMO_SCRIPTS = [
    TRAFFIC_STOP_DEMO,
    DOMESTIC_DISTURBANCE_DEMO,
    WELFARE_CHECK_DEMO,
];

/**
 * Get demo script by ID
 */
export function getDemoScript(id) {
    return DEMO_SCRIPTS.find(script => script.id === id) || TRAFFIC_STOP_DEMO;
}

/**
 * Get event at specific timestamp
 * @param {Object} script - Demo script object
 * @param {number} currentTime - Current playback time in seconds
 * @param {number} tolerance - Time tolerance in seconds (default 0.5)
 */
export function getEventAtTime(script, currentTime, tolerance = 0.5) {
    return script.events.find(event =>
        Math.abs(event.time - currentTime) <= tolerance
    );
}

/**
 * Get all events up to current time
 */
export function getEventsUpToTime(script, currentTime) {
    return script.events.filter(event => event.time <= currentTime);
}

/**
 * Get biometric data at specific timestamp (interpolated)
 */
export function getBiometricAtTime(script, currentTime) {
    const timeline = script.biometricTimeline;

    // Find surrounding data points
    let before = timeline[0];
    let after = timeline[timeline.length - 1];

    for (let i = 0; i < timeline.length - 1; i++) {
        if (timeline[i].time <= currentTime && timeline[i + 1].time >= currentTime) {
            before = timeline[i];
            after = timeline[i + 1];
            break;
        }
    }

    // Linear interpolation
    const progress = (currentTime - before.time) / (after.time - before.time || 1);
    const heartRate = Math.round(before.heartRate + (after.heartRate - before.heartRate) * progress);

    return {
        heartRate,
        baseline: timeline[0].heartRate,
        elevated: heartRate > timeline[0].heartRate * 1.25,
    };
}

export default {
    DETECTION_TYPES,
    ALERT_COLORS,
    VOICE_MESSAGES,
    DEMO_SCRIPTS,
    TRAFFIC_STOP_DEMO,
    DOMESTIC_DISTURBANCE_DEMO,
    WELFARE_CHECK_DEMO,
    getDemoScript,
    getEventAtTime,
    getEventsUpToTime,
    getBiometricAtTime,
};
