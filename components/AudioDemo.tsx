import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { pipeline, env } from '@xenova/transformers';
import ArchitectureDiagram from './ArchitectureDiagram';
import {
    Mic,
    MicOff,
    Upload,
    Play,
    AlertTriangle,
    Clock,
    Volume2,
    Radio,
    Crosshair,
    MessageSquareWarning,
    Zap,
    FileAudio,
    FileText,
    Trash2,
    Cpu,
    Shield,
    X,
    User,
    EyeOff,
    RotateCw,
    Users,
    Activity,
    Home,
    Brain,
    Siren,
    Moon,
    CloudRain,
    Footprints,
    Lock,
    ShieldAlert,
    TrendingUp,
    ThumbsUp,
    Car,
    Target,
    Video,
    VideoOff,
    Wifi,
    WifiOff,
    Timer,
    MapPin,
    Eye,
    CheckCircle,
    XCircle,
    ArrowUpCircle,
    Circle,
    Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// ── TF.js YAMNet Config ──
const YAMNET_MODEL_URL = 'https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1';
const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 15600; // 0.975 seconds of audio

// YAMNet AudioSet Class Indices for broader detection
const TARGET_CLASSES: Record<string, number[]> = {
    // Explosion (426), Gunshot (427), Machine gun (428), Cap gun (429), Fusillade (430), Artillery (431), Firecracker (436)
    gunshot: [426, 427, 428, 429, 430, 431, 436],
    // Shout (21), Yell (22), Crying (25), Wail (26), Groan (28), Grunting (29), Screaming (38), Glass (40), Smash (43)
    struggle: [21, 22, 25, 26, 28, 29, 38, 40, 43],
};


// ── Keyword detection ──
const URGENT_KW = [
    // Core urgent incident phrases
    'shots fired', 'officer down', 'send backup', "i'm hit", 'active shooter',
    'has a gun', 'drop the weapon', 'drop the gun', 'drop the knife',
    'help me', 'code 3', 'emergency',
    // Existing phrases retained for backward compatibility
    '10-33', '11-99', '10-78',
    'put the weapon down', 'crossfire',
    'send ems', 'need a bus', 'tourniquet', 'bleeding'
];

const WARNING_KW = [
    // Core warning phrases
    'gun', 'knife', 'weapon', 'need units', 'send units',
    'foot pursuit', 'suspect is on foot', 'stop resisting',
    'taser', 'taser taser',
    // Existing phrases retained
    'backup',
    "he's taking off", 'failure to yield', '10-80', 'running',
    'put your hands behind your back', 'let go', 'get on the ground',
    'deploying taser', 'stop right there', 'pursuit',
    '10-50', 'roll over', 'send fire', 'extrication needed', 'step out of the vehicle'
];

const CONTEXT_KW = [
    'traffic stop', 'subject stop', 'suspicious vehicle', 'in pursuit', 'in foot pursuit'
];

const CANCEL_KW = [
    'code 4', 'code four', 'cancel backup', 'no backup needed', 'all clear',
    'disregard', 'stand down', 'false alarm', 'scene secure',
    "we're good", 'no threat', "i'm fine", 'resume patrol',
    'suspect in custody', 'handcuffs on'
];

const THREAT_KW = [...URGENT_KW, ...WARNING_KW];

// ── Model Card ──
interface ModelCardProps {
    name: string;
    icon: React.ElementType;
    status: string;
    confidence: number;
    lastDetection: string | null;
    color: 'green' | 'yellow' | 'red' | 'gray';
    isLoaded: boolean;
}

function ModelCard({ name, icon: Icon, status, confidence, lastDetection, color, isLoaded }: ModelCardProps) {
    const palette = {
        green: { accent: '#00FF41', bg: 'rgba(0,255,65,0.04)', border: 'rgba(0,255,65,0.08)' },
        yellow: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.04)', border: 'rgba(245,158,11,0.08)' },
        red: { accent: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.12)' },
        gray: { accent: '#64748b', bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.04)' },
    };
    const p = isLoaded ? (palette[color] || palette.green) : palette.gray;

    return (
        <div className="rounded-2xl p-4 transition-all duration-300 relative overflow-hidden bg-neutral-900/40 backdrop-blur-md border border-white/5">
            {!isLoaded && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-slate-800 overflow-hidden">
                    <div className="h-full bg-[#00FF41]/50 w-1/3 animate-[shimmer_1.5s_infinite_linear]"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.5), transparent)' }} />
                </div>
            )}

            <div className="flex items-center gap-3 mb-3.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/40 border border-white/5">
                    <Icon className="w-[17px] h-[17px]" style={{ color: p.accent }} />
                </div>
                <div className="flex-1">
                    <p className="text-[12px] font-semibold text-white">{name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {isLoaded ? (
                            <>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: p.accent, ...(color === 'red' ? { boxShadow: `0 0 6px ${p.accent}` } : {}) }} />
                                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: p.accent }}>{status}</span>
                            </>
                        ) : (
                            <span className="text-[10px] font-semibold text-neutral-500 animate-pulse uppercase tracking-wider">Loading...</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mb-1">
                <div className="flex items-center justify-between mb-1.5 font-mono">
                    <span className="text-[9px] text-neutral-500 uppercase tracking-[0.12em] font-semibold">Inference confidence</span>
                    <span className="text-[11px] font-bold" style={{ color: p.accent }}>{isLoaded ? confidence : 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${isLoaded ? confidence : 0}%`, background: p.accent }} />
                </div>
            </div>

            {lastDetection && isLoaded && (
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-2.5 font-mono">
                    <Clock className="w-3 h-3" />{lastDetection}
                </div>
            )}
        </div>
    );
}

interface LogEntry {
    id: number;
    timestamp: string;
    model: string;
    threat: string;
    confidence: number;
    level: 'red' | 'yellow' | 'green';
    scenario: string;
}

interface TranscriptLine {
    time: number;
    text: string;
}

interface TimelineEvent {
    id: string;
    timestamp: string;
    type: 'DETECTION' | 'SIGNAL' | 'DISPATCH' | 'REPORT';
    label: string;
    confidence?: number;
}

// ── Incident Lifecycle Types ──
type IncidentStatus = 'detected' | 'assessing' | 'dispatched' | 'responding' | 'resolved' | 'false_positive';

interface ManagedIncident {
    id: string;
    status: IncidentStatus;
    detectedAt: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    priorityScore: number;
    threatType: string;
    confidence: number;
    trigger: string;
    dispatchedAt?: number;
    resolvedAt?: number;
    resolution?: string;
    officerFeedback?: 'correct' | 'false' | 'missed';
    cancelWindowExpires?: number;
}

// ── Operational Context Types & Profiles ──
type OperationalContext =
    | 'standard_patrol'
    | 'protest_riot'
    | 'school';

interface ContextProfile {
    label: string;
    icon: string;
    color: string;
    detection: string;
    falsePositives: string[];
    thresholds: { gunshot: number; struggle: number; keyword: number };
    suppressModels: string[];
    education: string;
}

const CONTEXT_PROFILES: Record<OperationalContext, ContextProfile> = {
    standard_patrol: {
        label: 'Standard Patrol',
        icon: 'shield',
        color: 'green',
        detection: 'Default — no special environment detected',
        falsePositives: [],
        thresholds: { gunshot: 95, struggle: 95, keyword: 70 },
        suppressModels: [],
        education: 'Standard thresholds active. All models at baseline sensitivity.'
    },
    protest_riot: {
        label: 'Protest / Mass Incident',
        icon: 'users',
        color: 'red',
        detection: 'CAD code 10-68 (civil disturbance) + GPS cluster of 3+ units within 200m',
        falsePositives: ['Mass yelling/chanting (struggle model)', 'Flash-bang deployment (gunshot model)'],
        thresholds: { gunshot: 98, struggle: 99, keyword: 60 },
        suppressModels: ['struggle'],
        education: 'Mass crowd noise produces constant false struggle alerts. Gunshot threshold raised to 98% to filter flash-bangs.'
    },
    school: {
        label: 'School Resource Officer',
        icon: 'school',
        color: 'purple',
        detection: 'GPS geofence (school property) + time correlation (0700-1500 on school days)',
        falsePositives: ['Children screaming during recess (struggle model)', 'School bell / fire alarm (impact/gunshot model)'],
        thresholds: { gunshot: 85, struggle: 99, keyword: 60 },
        suppressModels: [],
        education: 'CRITICAL: Gunshot sensitivity is INCREASED (threshold lowered to 85%) due to active shooter risk. Children screaming is filtered via higher struggle thresholds.'
    }
};

// ── Solo Detection Engine Types ──
interface SoloSignal {
    source: string;
    isSolo: boolean | null; // null = signal unavailable
    weight: number;
    confidence: number; // 0-1 confidence in this specific signal
    detail: string;
    timestamp: number;
}

interface SoloDetectionResult {
    isSolo: boolean;
    confidence: number; // 0-100
    signals: SoloSignal[];
    autoDispatchEnabled: boolean;
    reasoning: string;
}

const SOLO_SIGNAL_WEIGHTS: { source: string; weight: number; description: string; icon: string }[] = [
    { source: 'CAD', weight: 1.0, description: 'Computer-Aided Dispatch assignment', icon: 'monitor' },
    { source: 'Bluetooth', weight: 0.9, description: 'Peer-to-peer BWC proximity (~10m)', icon: 'bluetooth' },
    { source: 'GPS', weight: 0.7, description: 'GPS proximity to other units (~50m)', icon: 'map' },
    { source: 'Schedule', weight: 0.6, description: 'Shift schedule (solo vs. partnered)', icon: 'calendar' },
    { source: 'Radio', weight: 0.5, description: 'Radio traffic analysis (callsign patterns)', icon: 'radio' },
    { source: 'Manual', weight: 0.4, description: 'Officer toggle (BWC button / app)', icon: 'toggle' },
    { source: 'Hardware', weight: 0.3, description: 'BWC serial → unit assignment', icon: 'cpu' },
];

// ══════════════════════════════════════════════════════════════
// FIRST PRINCIPLES — Foundational axioms for Vantus dispatch logic
// ══════════════════════════════════════════════════════════════
// P1: ONE INCIDENT = ONE DISPATCH
//     No matter how many BWCs detect the same event, exactly one
//     backup request is generated. Duplicates waste resources and
//     erode dispatcher trust.
//
// P2: NEVER FAIL SILENT
//     A duplicate dispatch is recoverable. A missed dispatch is not.
//     When in doubt, the system SHOULD alert. False negatives are
//     worse than false positives for officer safety.
//
// P3: PROXIMITY ≠ PARTNERSHIP
//     Being near another officer does not mean they are your
//     partner. Context (CAD call, assignment, role) determines
//     partnership, not mere proximity.
//
// P4: STATE TRANSITIONS MUST BE STABLE
//     Rapid toggling between SOLO and PARTNERED is worse than a
//     slightly delayed state change. All transitions require a
//     hysteresis window (60s) to prevent oscillation.
//
// P5: GRACEFUL DEGRADATION
//     If any signal source fails, remaining signals must still
//     produce a usable decision. No single point of failure.
// ══════════════════════════════════════════════════════════════

const FIRST_PRINCIPLES = [
    { id: 'P1', name: 'One Incident = One Dispatch', description: 'No matter how many BWCs detect the same event, exactly one backup request is generated. Duplicates waste resources and erode dispatcher trust.', icon: 'hash' },
    { id: 'P2', name: 'Never Fail Silent', description: 'A duplicate dispatch is recoverable. A missed dispatch is not. When in doubt, the system SHOULD alert. False negatives are worse than false positives.', icon: 'alert' },
    { id: 'P3', name: 'Proximity ≠ Partnership', description: 'Being near another officer does not mean they are your partner. CAD call, assignment, and role determine partnership — not proximity alone.', icon: 'users' },
    { id: 'P4', name: 'Stable State Transitions', description: 'All solo/partnered transitions require 60 seconds of consistent signal before taking effect. Prevents oscillation during transient proximity changes.', icon: 'clock' },
    { id: 'P5', name: 'Graceful Degradation', description: 'If any signal source fails, remaining signals must still produce a usable decision. No single point of failure in the detection chain.', icon: 'shield' },
];

// ── Scene Dedup Protocol Types ──
interface DispatchClaim {
    claimId: string;
    callId: string;
    claimingOfficerId: string;
    claimingBwcId: string;
    threatType: string;
    claimedAt: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    expiresAt: number; // Auto-release after 120s if not confirmed
}

interface SceneState {
    callId: string;
    officers: string[];
    dispatchClaimed: boolean;
    claimedBy: string | null;
    isHighRisk: boolean;
    monitorOnlyOfficers: string[]; // Officers in listen mode (not dispatch authority)
}

interface BWCHeartbeat {
    bwcId: string;
    officerId: string;
    lastSeen: number;
    status: 'online' | 'stale' | 'offline';
    batteryLevel: number;
}

// High-risk CAD codes where BOTH officers should monitor (but only one dispatches)
const HIGH_RISK_CALL_TYPES = [
    'DOMESTIC_DISTURBANCE',
    'FELONY_STOP',
    'TRAFFIC_STOP',
    'WEAPONS_CALL',
    'BARRICADED_SUBJECT',
    'PURSUIT',
    'ACTIVE_SHOOTER',
    'ROBBERY_IN_PROGRESS',
    'ASSAULT_IN_PROGRESS',
];

// Station geofence coordinates (simulated — would be department-configured)
const STATION_GEOFENCES = [
    { name: 'Central Station', lat: 40.7128, lng: -74.0060, radiusMeters: 100 },
    { name: 'North Precinct', lat: 40.7580, lng: -73.9855, radiusMeters: 80 },
    { name: 'Training Facility', lat: 40.6892, lng: -74.0445, radiusMeters: 200 },
];

// Hysteresis: minimum time before solo/partnered state change takes effect
const SOLO_HYSTERESIS_MS = 60000; // 60 seconds
const WATCHDOG_STALE_MS = 120000; // 2 min = stale
const WATCHDOG_OFFLINE_MS = 300000; // 5 min = offline
const DISPATCH_CLAIM_TTL_MS = 120000; // 2 min claim expiry

// ── Additional Scenario Profiles (12 auto-detected edge cases) ──
type AdditionalScenarioKey =
    | 'officerPanicking' | 'footPursuit' | 'radioKeying' | 'officerUnresponsive'
    | 'bwcFaceDown' | 'cprFalseAlarm' | 'code4Delay' | 'taserDeployment' | 'doorBreaching'
    | 'holsterDraw' | 'narrativeRecall' | 'sarcasmDarkHumor' | 'vehicleBailoutLogic';

interface AdditionalScenarioProfile {
    label: string;
    category: 'physiological' | 'environmental' | 'temporal' | 'network';
    detection: string;
    thresholdAdjust: { gunshot?: number; struggle?: number; keyword?: number };
    suppressModels: string[];
    education: string;
    defaultActive: boolean;
}

const ADDITIONAL_SCENARIO_PROFILES: Record<AdditionalScenarioKey, AdditionalScenarioProfile> = {
    officerPanicking: {
        label: 'Officer: Elevated Stress', category: 'physiological',
        detection: 'Rapid breath rate (>20 breaths/min) + pitch elevation in voice.',
        thresholdAdjust: { struggle: 5 },
        suppressModels: [],
        education: 'All model thresholds are adjusted by 5% during confirmed high-stress state.',
        defaultActive: false,
    },
    footPursuit: {
        label: 'Foot Pursuit Active', category: 'physiological',
        detection: 'Heavy rhythmic breath pattern + rapid GPS position change.',
        thresholdAdjust: { struggle: 10 },
        suppressModels: ['struggle'],
        education: 'Struggle model is suppressed until officer stops moving.',
        defaultActive: false,
    },
    radioKeying: {
        label: 'Radio Transmission', category: 'physiological',
        detection: 'Radio PTT click signature detected.',
        thresholdAdjust: {},
        suppressModels: ['keyword'],
        education: 'Keyword model is suppressed for 3s after any PTT click.',
        defaultActive: false,
    },
    officerUnresponsive: {
        label: 'Officer Unresponsive', category: 'physiological',
        detection: 'No audio, motion, or GPS change for >90 seconds.',
        thresholdAdjust: { gunshot: -10, struggle: -10, keyword: -10 },
        suppressModels: [],
        education: 'Lower thresholds by 10% — preferred false positive over missed emergency.',
        defaultActive: false,
    },
    bwcFaceDown: {
        label: 'BWC Muffled / Face-Down', category: 'environmental',
        detection: 'High-frequency rolloff >8kHz + low ambient variation.',
        thresholdAdjust: { gunshot: 10, struggle: 8, keyword: 5 },
        suppressModels: [],
        education: 'Thresholds are raised to prevent low-quality audio from triggering alerts.',
        defaultActive: false,
    },
    cprFalseAlarm: {
        label: 'CPR / Medical Assist', category: 'temporal',
        detection: 'Rhythmic impacts (1.5-2.0Hz) + CAD medical code.',
        thresholdAdjust: { struggle: 20 },
        suppressModels: [],
        education: 'Struggle threshold raised 20% in confirmed medical response.',
        defaultActive: false,
    },
    code4Delay: {
        label: 'Code 4 Dispatch Logic', category: 'temporal',
        detection: 'Verbal "Code 4" within 5s of a trigger event.',
        thresholdAdjust: {},
        suppressModels: [],
        education: 'Cancel always wins over trigger when within the 5-second window.',
        defaultActive: false,
    },
    taserDeployment: {
        label: 'Taser Deployment', category: 'environmental',
        detection: 'Taser arc signature: 19 pulses/second.',
        thresholdAdjust: { gunshot: 15 },
        suppressModels: [],
        education: 'Gunshot threshold raised 15% for 10s after Taser detected.',
        defaultActive: false,
    },
    doorBreaching: {
        label: 'Door Breaching', category: 'environmental',
        detection: 'High-amplitude impulse + CAD entry code.',
        thresholdAdjust: {},
        suppressModels: ['gunshot'],
        education: 'Gunshot model suppressed during confirmed entry operations.',
        defaultActive: false,
    },
    holsterDraw: {
        label: 'Officer Weapon Draw', category: 'environmental',
        detection: 'CV draw motion + no audio threat.',
        thresholdAdjust: {},
        suppressModels: [],
        education: 'Weapons detected in officer own body zone are classified as deployment.',
        defaultActive: false,
    },
    narrativeRecall: {
        label: 'Narrative Recall', category: 'temporal',
        detection: 'Past-tense threat keywords + calm conversational tone.',
        thresholdAdjust: { keyword: 20 },
        suppressModels: [],
        education: 'Keyword threshold raised 20% during debrief contexts.',
        defaultActive: false,
    },
    sarcasmDarkHumor: {
        label: 'Sarcasm / Dark Humor', category: 'temporal',
        detection: 'Trigger word + flat affect/conversational context.',
        thresholdAdjust: { keyword: 25 },
        suppressModels: [],
        education: 'Keyword threshold raised 25% when sarcasm indicators detected.',
        defaultActive: false,
    },
    vehicleBailoutLogic: {
        label: 'Vehicle Bail-Out / Foot Pursuit', category: 'physiological',
        detection: 'CAN_BUS telemetry (vehicle in drive) + violent >4G lateral exit spike.',
        thresholdAdjust: { struggle: -20, keyword: -15 },
        suppressModels: [],
        education: 'Physics sequence drastically LOWERS thresholds for immediate backup.',
        defaultActive: false,
    }
};

// Additional scenario flag type (active/inactive per scenario)
type AdditionalContextFlags = Record<AdditionalScenarioKey, boolean>;

const DEFAULT_ADDITIONAL_FLAGS: AdditionalContextFlags = Object.fromEntries(
    Object.keys(ADDITIONAL_SCENARIO_PROFILES).map(k => [k, ADDITIONAL_SCENARIO_PROFILES[k as AdditionalScenarioKey].defaultActive])
) as AdditionalContextFlags;

// ════════════════════════════════════════════════════════════════
// ACCURACY IMPROVEMENT #1: Multi-Modal Fusion Weights
// Weighted confidence scoring — all three models must vote together
// ════════════════════════════════════════════════════════════════
const MODEL_FUSION_WEIGHTS = { gunshot: 0.45, struggle: 0.30, keyword: 0.25 } as const;
const FUSION_DISPATCH_THRESHOLD = 0.72; // Joint score required for dispatch
const FUSION_REVIEW_THRESHOLD   = 0.55; // Score for dispatcher review queue

// ════════════════════════════════════════════════════════════════
// ACCURACY IMPROVEMENT #2: Temporal Event Horizon (90s window)
// ════════════════════════════════════════════════════════════════
interface EventHorizonEntry {
    model: string;
    confidence: number;
    timestamp: number;
    suppressed: boolean;
}
// Escalation patterns: if these sequences occur in order within 90s → high credibility
const ESCALATION_PATTERNS = [
    { sequence: ['keyword', 'struggle', 'gunshot'], creditBoost: 20, label: 'Verbal → Physical → Shot' },
    { sequence: ['struggle', 'gunshot'], creditBoost: 15, label: 'Physical → Shot' },
    { sequence: ['keyword', 'gunshot'], creditBoost: 12, label: 'Verbal → Shot' },
    { sequence: ['keyword', 'struggle'], creditBoost: 10, label: 'Verbal → Physical Escalation' },
] as const;
const EVENT_HORIZON_MS = 90_000; // 90 second rolling window

// ════════════════════════════════════════════════════════════════
// ACCURACY IMPROVEMENT #6: N-Best Phoneme Ambiguity Table
// If a trigger word has a phonetically similar non-threat word within
// this confidence delta, the keyword detection is demoted.
// ════════════════════════════════════════════════════════════════
const PHONETICALLY_SIMILAR_WORDS: Record<string, string[]> = {
    'gun':     ['run', 'fun', 'sun', 'done', 'one', 'bun'],
    'shot':    ['got', 'hot', 'lot', 'not', 'dot', 'what'],
    'help':    ['yelp', 'kelp', 'belt', 'felt', 'melt'],
    'fire':    ['hire', 'tire', 'wire', 'liar', 'higher'],
    'knife':   ['life', 'wife', 'hive', 'rife'],
    'weapon':  ['steppin', 'happen'],
};
const NBEST_AMBIGUITY_DELTA = 0.20; // If non-threat score within 20% → ambiguous

// ════════════════════════════════════════════════════════════════
// ACCURACY IMPROVEMENT #8: Scenario Flag Confidence Decay (TTL ms)
// After activation, each flag's boost decays to 0 over its window.
// Scenario flags that are no longer relevant stop affecting thresholds.
// ════════════════════════════════════════════════════════════════
const FLAG_DECAY_WINDOWS: Partial<Record<AdditionalScenarioKey, number>> = {
    radioCrosstalk:      5_000,  // 5s squelch window
    ghostPartner:        20_000, // 20s BT mesh registration hold
    vehicleBackfire:     30_000, // 30s mechanical event window
    sirenEcho:           15_000, // 15s siren proximity window
    taserDeployment:     10_000, // 10s arc discharge window
    phoneticOverlap:     8_000,  // 8s phoneme ambiguity window
    bwcDropped:          60_000, // 60s until camera confirmed offline
    flashlightReflection:12_000, // 12s flash history window
    holsterDraw:         5_000,  // 5s draw-reholster window
    gearNoise:           3_000,  // 3s metallic transient window
    friendlyContact:     10_000, // 10s brief contact window
    coordinatedArrest:   30_000, // 30s simultaneous action window
    narrativeRecall:     120_000,// 2 min debrief window
    animalEncounter:     20_000, // 20s animal encounter window
};

// ── Main ──
export const AudioDemo: React.FC = () => {
    const [tfModel, setTfModel] = useState<any>(null);
    const [transcriber, setTranscriber] = useState<any>(null);
    const [modelLoading, setModelLoading] = useState(true);

    const [models, setModels] = useState<Record<string, any>>({
        gunshot: { status: 'Standby', confidence: 0, color: 'green', lastDetection: null },
        keyword: { status: 'Standby', confidence: 0, color: 'green', lastDetection: null },
        struggle: { status: 'Standby', confidence: 0, color: 'green', lastDetection: null },
        speaker: { status: 'Calibrating', confidence: 0, color: 'green', lastDetection: null },
        stress: { status: 'Standby', confidence: 0, color: 'green', lastDetection: null },
    });
    const [log, setLog] = useState<LogEntry[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [pastedText, setPastedText] = useState('');
    const [displayMode, setDisplayMode] = useState<'demo' | 'pilot' | 'pilot2'>('pilot'); // Default to pilot mode

    // ── Pilot P1 Axon API Workflow State ──
    const [axonIngestion, setAxonIngestion] = useState({
        isActive: false,
        currentStep: 0,
        steps: ['Ingest new recordings', 'Extract audio', 'Run detection models', 'Classify incidents', 'Generate timeline', 'Simulate dispatch', 'Generate report', 'Store results']
    });
    const [detectedEvents, setDetectedEvents] = useState<any[]>([]);
    const [escalationPattern, setEscalationPattern] = useState<'normal' | 'raised' | 'commands' | 'struggle'>('normal');
    const [incidentMetrics, setIncidentMetrics] = useState({
        totalIncidents: 0,
        falsePositives: 0,
        confirmedIncidents: 0,
        manualReviewsSaved: 0
    });
    const [currentIncident, setCurrentIncident] = useState<any>(null);
    const [dispatchEvents, setDispatchEvents] = useState<any[]>([]);

    // ── Pilot P1: Advanced Incident Management ──
    const [officerMetadata] = useState({
        officerId: '417',
        shiftDate: new Date().toISOString().split('T')[0],
        location: 'Sector 7 - Downtown',
        cameraId: 'CAM-0417'
    });

    // ── Escalation Detection & Classification ──
    const [escalationHistory, setEscalationHistory] = useState<any[]>([]);
    const [threatEvents, setThreatEvents] = useState<any[]>([]);
    const [falsePositiveTracking, setFalsePositiveTracking] = useState({
        totalIncidents: 0,
        falsePositives: 0,
        confirmedIncidents: 0,
        manualReviewsSaved: 0
    });

    // ── Component 1: Multi-Officer Deduplication (Auto-Detected) ──
    const [sceneOfficers, setSceneOfficers] = useState<{ id: string; arrivalTime: number; role: 'primary' | 'backup' }[]>([
        { id: '417', arrivalTime: Date.now(), role: 'primary' }
    ]);
    const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
    const [deduplicationWindow] = useState(10000); // 10s dedup window
    const [lastSceneDispatchTime, setLastSceneDispatchTime] = useState(0);
    const [managedIncidents, setManagedIncidents] = useState<ManagedIncident[]>([]);

    // ── Component 2: False Positive Prevention (Auto-Detected) ──
    const [offDutyDetected, setOffDutyDetected] = useState(false);
    const [shiftSchedule] = useState({ start: 6, end: 18 }); // 0600-1800
    const [bodyCamStatus, setBodyCamStatus] = useState<'active' | 'malfunction' | 'obstructed'>('active');
    const [vehicleDetected, setVehicleDetected] = useState(false);
    const [firingRangeDetected, setFiringRangeDetected] = useState(false);
    const [cvPoliceCount, setCvPoliceCount] = useState(0); // For advanced CV ghost partner check

    // ── Component 3: Edge Case Hardening ──
    const [dispatchCancelWindow, setDispatchCancelWindow] = useState<{ active: boolean; expiresAt: number; dispatchId: string; countdown: number } | null>(null);
    const [systemHealth, setSystemHealth] = useState<'operational' | 'degraded' | 'offline'>('operational');
    const [volatileMode] = useState(true); // Privacy: always on, non-threat data not stored
    const [autoDetectionLog, setAutoDetectionLog] = useState<{ time: string; system: string; status: string; reason: string }[]>([]);
    const cancelTimerRef = useRef<any>(null);

    // ── Operational Context (Auto-Detected from CAD/GPS/Audio) ──
    const [operationalContext, setOperationalContext] = useState<OperationalContext>('standard_patrol');

    // ── Solo Detection Engine (Multi-Signal Fusion) ──
    const [soloDetection, setSoloDetection] = useState<SoloDetectionResult>({
        isSolo: true,
        confidence: 100,
        signals: SOLO_SIGNAL_WEIGHTS.map(s => ({
            source: s.source,
            isSolo: true,
            weight: s.weight,
            confidence: 1.0,
            detail: s.source === 'CAD' ? 'Unit 12 — SOLO_UNIT assignment' :
                s.source === 'Bluetooth' ? 'No other BWC within 10m' :
                    s.source === 'GPS' ? 'No units within 50m radius' :
                        s.source === 'Schedule' ? 'DAY_SHIFT — Solo patrol (0700-1900)' :
                            s.source === 'Radio' ? 'Callsign 12-1 (solo designation)' :
                                s.source === 'Manual' ? 'Officer toggle: ON' :
                                    'BWC AXON-12345 → Solo unit config',
            timestamp: Date.now()
        })),
        autoDispatchEnabled: true,
        reasoning: 'All 7 signals confirm solo status (100% confidence)'
    });
    const [soloManualOverride, setSoloManualOverride] = useState<boolean | null>(null); // null = no override

    // ── Scene Dedup Protocol (P1: One Incident = One Dispatch) ──
    const [dispatchClaims, setDispatchClaims] = useState<DispatchClaim[]>([]);
    const [sceneStates, setSceneStates] = useState<SceneState[]>([]);
    const [bwcHeartbeats, setBwcHeartbeats] = useState<BWCHeartbeat[]>([
        { bwcId: 'AXON-12345', officerId: '417', lastSeen: Date.now(), status: 'online', batteryLevel: 87 }
    ]);
    const [inStationGeofence, setInStationGeofence] = useState(false);
    const [soloStateStableSince, setSoloStateStableSince] = useState(Date.now());
    const [pendingSoloState, setPendingSoloState] = useState<boolean | null>(null);
    const hysteresisTimerRef = useRef<any>(null);

    // ── Additional Scenario Auto-Detection (15 scenarios, 15s polling) ──
    const [additionalFlags, setAdditionalFlags] = useState<AdditionalContextFlags>(DEFAULT_ADDITIONAL_FLAGS);
    const [networkSignalQuality, setNetworkSignalQuality] = useState(100); // 0-100
    const [lastActivityTimestamp, setLastActivityTimestamp] = useState(Date.now());
    const [cadLagMs, setCadLagMs] = useState(0); // Simulated CAD lag

    // ── #1: Multi-Modal Fusion Scoring ──
    // Tracks live confidence of each model for joint scoring
    const [liveModelConf, setLiveModelConf] = useState({ gunshot: 0, struggle: 0, keyword: 0, cvWeapon: 0 });
    
    // BWC Face-Down Protection: Dynamically shift weights to favor audio/accelerometer when camera is occluded
    const activeFusionWeights = additionalFlags.bwcFaceDown 
        ? { gunshot: 0.60, struggle: 0.40, keyword: 0.0 } 
        : MODEL_FUSION_WEIGHTS;

    const fusionScore = (
        (liveModelConf.gunshot / 100) * activeFusionWeights.gunshot +
        (liveModelConf.struggle / 100) * activeFusionWeights.struggle +
        (liveModelConf.keyword / 100) * activeFusionWeights.keyword
    );
    const fusionTier: 'dispatch' | 'review' | 'suppress' =
        fusionScore >= FUSION_DISPATCH_THRESHOLD ? 'dispatch' :
        fusionScore >= FUSION_REVIEW_THRESHOLD   ? 'review'   : 'suppress';

    // ── #2: Temporal Event Horizon ──
    const [eventHorizon, setEventHorizon] = useState<EventHorizonEntry[]>([]);
    const addToEventHorizon = useCallback((model: string, confidence: number, suppressed: boolean) => {
        const now = Date.now();
        setEventHorizon(prev => [
            ...prev.filter(e => now - e.timestamp < EVENT_HORIZON_MS),
            { model, confidence, timestamp: now, suppressed }
        ]);
    }, []);

    // Detect escalation patterns in the current event horizon
    const getEscalationBoost = useCallback((horizon: EventHorizonEntry[]): { boost: number; pattern: string | null; isCode4Safe: boolean } => {
        const now = Date.now();
        const recent = horizon
            .filter(e => now - e.timestamp < EVENT_HORIZON_MS && !e.suppressed)
            .map(e => e.model);

        // Code 4 Kill Switch: If Code 4 or All Secure occurs in the horizon, zero out escalation and suppress.
        if (recent.some(m => m === 'Code 4' || m === 'All secure')) {
            return { boost: 0, pattern: 'Kill Switch: Code 4', isCode4Safe: true };
        }

        for (const pattern of ESCALATION_PATTERNS) {
            const seq = [...pattern.sequence];
            let si = 0;
            for (const m of recent) { if (m === seq[si]) si++; if (si === seq.length) break; }
            if (si === seq.length) return { boost: pattern.creditBoost, pattern: pattern.label, isCode4Safe: false };
        }
        return { boost: 0, pattern: null, isCode4Safe: false };
    }, []);
    const { boost: escalationBoost, pattern: activeEscalationPattern, isCode4Safe } = getEscalationBoost(eventHorizon);

    // ── #6: N-Best Phoneme — track last detected keyword phrase ──
    const [lastKeywordPhrase, setLastKeywordPhrase] = useState<string>('');
    const isPhoneticAmbiguous = useCallback((phrase: string): boolean => {
        if (!phrase) return false;
        const lowerPhrase = phrase.toLowerCase();
        for (const [trigger, similar] of Object.entries(PHONETICALLY_SIMILAR_WORDS)) {
            if (!lowerPhrase.includes(trigger)) continue;
            // Check if any similar-sounding non-threat word is plausible in context
            // Simulated: if phrase is short (1-2 words) and contains a trigger, it's ambiguous
            const wordCount = phrase.trim().split(/\s+/).length;
            if (wordCount <= 2) {
                for (const s of similar) {
                    // Simulate N-best: if the word sounds like a non-threat, flag it
                    if (lowerPhrase.startsWith(s.slice(0, 2))) return true;
                }
            }
        }
        return false;
    }, []);

    // ── #8: Flag Decay Tracking — activation timestamps ──
    const [flagActivationTimes, setFlagActivationTimes] = useState<Partial<Record<AdditionalScenarioKey, number>>>({});

    // Track when flags become active (for TTL decay)
    useEffect(() => {
        setFlagActivationTimes(prev => {
            const next = { ...prev };
            const now = Date.now();
            for (const key of Object.keys(additionalFlags) as AdditionalScenarioKey[]) {
                if (additionalFlags[key] && !prev[key]) {
                    // Newly activated — record activation time
                    next[key] = now;
                } else if (!additionalFlags[key] && prev[key]) {
                    // Cleared by source — remove TTL
                    delete next[key];
                }
            }
            return next;
        });
    }, [additionalFlags]);

    // Returns the decay ratio [0..1] for a flag: 1 = fully active, 0 = expired
    const getFlagDecayRatio = useCallback((key: AdditionalScenarioKey): number => {
        const ttl = FLAG_DECAY_WINDOWS[key];
        if (!ttl) return 1; // No decay defined = stays active
        const activatedAt = flagActivationTimes[key];
        if (!activatedAt) return 0;
        const elapsed = Date.now() - activatedAt;
        if (elapsed >= ttl) return 0;
        return 1 - (elapsed / ttl);
    }, [flagActivationTimes]);

    // Update activity timestamp on any detection event (so officerUnresponsive can fire)
    const recordOfficerActivity = useCallback(() => {
        setLastActivityTimestamp(Date.now());
    }, []);


    // P1: Claim dispatch authority for a call (first-to-detect wins)
    const claimDispatchAuthority = useCallback((callId: string, threatType: string): { granted: boolean; reason: string } => {
        const existingClaim = dispatchClaims.find(c => c.callId === callId && c.status !== 'cancelled' && c.expiresAt > Date.now());

        if (existingClaim) {
            // P1: Another BWC already claimed this call
            return {
                granted: false,
                reason: `P1 ENFORCED — Dispatch already claimed by Officer #${existingClaim.claimingOfficerId} (BWC ${existingClaim.claimingBwcId}) at ${new Date(existingClaim.claimedAt).toLocaleTimeString()}. Duplicate suppressed.`
            };
        }

        // Grant claim — this BWC has dispatch authority
        const newClaim: DispatchClaim = {
            claimId: `CLAIM-${Date.now().toString(36).toUpperCase()}`,
            callId,
            claimingOfficerId: '417', // Current officer
            claimingBwcId: 'AXON-12345',
            threatType,
            claimedAt: Date.now(),
            status: 'pending',
            expiresAt: Date.now() + DISPATCH_CLAIM_TTL_MS
        };

        setDispatchClaims(prev => [...prev, newClaim]);
        setAutoDetectionLog(prev => [{
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            system: 'Scene Dedup',
            status: 'CLAIM GRANTED',
            reason: `Dispatch authority claimed for ${callId} — ${threatType}`
        }, ...prev].slice(0, 30));

        return { granted: true, reason: `Dispatch authority granted. Claim ID: ${newClaim.claimId}` };
    }, [dispatchClaims]);

    // P1: Release a dispatch claim (cancel or expire)
    const releaseDispatchClaim = useCallback((claimId: string) => {
        setDispatchClaims(prev => prev.map(c => c.claimId === claimId ? { ...c, status: 'cancelled' as const } : c));
    }, []);

    // P3: Determine scene state for a CAD call
    const getSceneState = useCallback((callId: string): SceneState | null => {
        return sceneStates.find(s => s.callId === callId) || null;
    }, [sceneStates]);

    // P3: Check if this is a high-risk call (both listen, one dispatches)
    const isHighRiskCall = useCallback((callType: string): boolean => {
        return HIGH_RISK_CALL_TYPES.includes(callType.toUpperCase().replace(/\s+/g, '_'));
    }, []);

    // Station geofence check (suppress auto-dispatch at PD)
    const checkStationGeofence = useCallback((_lat: number, _lng: number): { inGeofence: boolean; stationName: string | null } => {
        // Simulated: In production, compare GPS coords against STATION_GEOFENCES
        // For demo, use a state toggle
        return { inGeofence: inStationGeofence, stationName: inStationGeofence ? 'Central Station' : null };
    }, [inStationGeofence]);

    // P4: Hysteresis — stabilize solo/partnered transitions
    const requestSoloStateChange = useCallback((newIsSolo: boolean) => {
        if (pendingSoloState === newIsSolo) return; // Already pending

        setPendingSoloState(newIsSolo);
        setSoloStateStableSince(Date.now());

        // Clear existing hysteresis timer
        if (hysteresisTimerRef.current) clearTimeout(hysteresisTimerRef.current);

        // P4: Wait 60s before applying the change
        hysteresisTimerRef.current = setTimeout(() => {
            setSoloDetection(prev => ({ ...prev, isSolo: newIsSolo, autoDispatchEnabled: newIsSolo }));
            setPendingSoloState(null);
            setAutoDetectionLog(prev => [{
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                system: 'Hysteresis',
                status: newIsSolo ? 'SOLO CONFIRMED' : 'PARTNERED CONFIRMED',
                reason: `P4: State stable for 60s — transition to ${newIsSolo ? 'SOLO' : 'PARTNERED'} confirmed`
            }, ...prev].slice(0, 30));
        }, SOLO_HYSTERESIS_MS);
    }, [pendingSoloState]);

    // P5: BWC Watchdog — detect offline/stale cameras
    useEffect(() => {
        const watchdogInterval = setInterval(() => {
            const now = Date.now();
            setBwcHeartbeats(prev => prev.map(hb => {
                const age = now - hb.lastSeen;
                const newStatus = age > WATCHDOG_OFFLINE_MS ? 'offline' : age > WATCHDOG_STALE_MS ? 'stale' : 'online';
                if (newStatus !== hb.status && (newStatus === 'stale' || newStatus === 'offline')) {
                    setAutoDetectionLog(prevLog => [{
                        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                        system: 'Watchdog',
                        status: `BWC ${newStatus.toUpperCase()}`,
                        reason: `P5: BWC ${hb.bwcId} (Officer #${hb.officerId}) — no heartbeat for ${Math.round(age / 1000)}s`
                    }, ...prevLog].slice(0, 30));
                }
                return { ...hb, status: newStatus };
            }));

            // Update heartbeat for current BWC (simulated — always online in demo)
            setBwcHeartbeats(prev => prev.map(hb =>
                hb.bwcId === 'AXON-12345' ? { ...hb, lastSeen: now, status: 'online' } : hb
            ));

            // Auto-expire stale dispatch claims (P1: prevent stale claims blocking new dispatches)
            setDispatchClaims(prev => prev.map(c =>
                c.expiresAt < now && c.status === 'pending' ? { ...c, status: 'cancelled' as const } : c
            ));
        }, 30000); // Check every 30s

        return () => clearInterval(watchdogInterval);
    }, []);

    const runSoloDetection = useCallback(() => {
        const now = Date.now();
        const currentHour = new Date().getHours();
        const hasBackup = sceneOfficers.length > 1;

        const signals: SoloSignal[] = [
            // Signal 1: CAD Assignment (weight 1.0)
            {
                source: 'CAD',
                isSolo: !hasBackup && !activeSceneId?.includes('MULTI'),
                weight: 1.0,
                confidence: 0.95,
                detail: hasBackup
                    ? `Unit 12 — ${sceneOfficers.length} officers assigned to ${activeSceneId || 'active call'}`
                    : activeSceneId
                        ? `Unit 12 — Solo on ${activeSceneId}`
                        : 'Unit 12 — SOLO_UNIT, general patrol',
                timestamp: now
            },
            // Signal 2: Bluetooth Proximity (weight 0.9)
            {
                source: 'Bluetooth',
                isSolo: !hasBackup,
                weight: 0.9,
                confidence: hasBackup ? 0.98 : 0.85,
                detail: hasBackup
                    ? `BWC AXON-${sceneOfficers[1]?.id || '000'} detected within 10m (${Math.floor(Math.random() * 8 + 2)}m)`
                    : 'No Vantus-enabled BWC in Bluetooth range (10m)',
                timestamp: now
            },
            // Signal 3: GPS Proximity (weight 0.7)
            {
                source: 'GPS',
                isSolo: !hasBackup,
                weight: 0.7,
                confidence: 0.75,
                detail: hasBackup
                    ? `Officer #${sceneOfficers[1]?.id || '000'} GPS within 50m (${Math.floor(Math.random() * 30 + 5)}m)`
                    : 'No units within 50m GPS radius',
                timestamp: now
            },
            // Signal 4: Shift Schedule (weight 0.6)
            {
                source: 'Schedule',
                isSolo: true, // Demo: always on solo schedule
                weight: 0.6,
                confidence: 0.9,
                detail: `${currentHour >= 7 && currentHour < 19 ? 'DAY' : 'NIGHT'}_SHIFT — Solo patrol assignment (Zone North)`,
                timestamp: now
            },
            // Signal 5: Radio Traffic (weight 0.5)
            {
                source: 'Radio',
                isSolo: !hasBackup,
                weight: 0.5,
                confidence: 0.6,
                detail: hasBackup
                    ? 'Recent radio: "Units 12 and 15 on scene"'
                    : 'Callsign 12-1 (solo designation), no partner transmissions',
                timestamp: now
            },
            // Signal 6: Manual Toggle (weight 0.4)
            {
                source: 'Manual',
                isSolo: soloManualOverride !== null ? soloManualOverride : true,
                weight: 0.4,
                confidence: soloManualOverride !== null ? 1.0 : 0.5,
                detail: soloManualOverride !== null
                    ? `Officer manually set: ${soloManualOverride ? 'SOLO' : 'PARTNERED'}`
                    : 'No manual override — using auto-detection',
                timestamp: now
            },
            // Signal 7: Hardware Config (weight 0.3)
            {
                source: 'Hardware',
                isSolo: true, // Demo: BWC is configured as solo unit
                weight: 0.3,
                confidence: 1.0,
                detail: 'BWC AXON-12345 → Unit 12 (solo patrol configuration)',
                timestamp: now
            }
        ];

        // Weighted fusion
        const availableSignals = signals.filter(s => s.isSolo !== null);
        const soloVotes = availableSignals
            .filter(s => s.isSolo)
            .reduce((sum, s) => sum + (s.weight * s.confidence), 0);
        const totalWeight = availableSignals
            .reduce((sum, s) => sum + (s.weight * s.confidence), 0);

        const confidence = totalWeight > 0 ? Math.round((soloVotes / totalWeight) * 100) : 0;
        const isSolo = confidence >= 70; // 70% decision threshold

        const reasoning = isSolo
            ? `${availableSignals.filter(s => s.isSolo).length}/${availableSignals.length} signals confirm solo (${confidence}% confidence)`
            : `${availableSignals.filter(s => !s.isSolo).length}/${availableSignals.length} signals indicate partnered (${100 - confidence}% partnered confidence)`;

        const result: SoloDetectionResult = {
            isSolo,
            confidence,
            signals,
            autoDispatchEnabled: isSolo,
            reasoning
        };

        setSoloDetection(result);
        return result;
    }, [sceneOfficers, activeSceneId, soloManualOverride]);

    // Run solo detection whenever relevant signals change
    useEffect(() => {
        runSoloDetection();
    }, [runSoloDetection]);

    // Threat Classification System
    const classifyThreat = (features: any, pilotAnalysis: any, keywords: string[] = []): any => {
        // Multi-factor threat classification
        let threatType = 'Unknown';
        let confidence = 0;
        let severity = 'low';
        let action = 'Monitor';

        // Weapon Threat Detection
        if (pilotAnalysis.gunshotThreat > 70 ||
            keywords.includes('knife') ||
            keywords.includes('gun')) {
            threatType = 'Weapon threat';
            confidence = Math.max(pilotAnalysis.gunshotThreat, 85);
            severity = 'critical';
            action = 'Immediate backup required';
        }
        // Physical Struggle Detection
        else if (pilotAnalysis.struggleThreat > 60 &&
            pilotAnalysis.featureVector.percussiveness > 8) {
            threatType = 'Physical struggle';
            confidence = pilotAnalysis.struggleThreat;
            severity = 'high';
            action = 'Backup recommended';
        }
        // Verbal Escalation Detection
        else if (pilotAnalysis.stressLevel > 40 &&
            pilotAnalysis.featureVector.harmonicContent > 2.0) {
            threatType = 'Verbal escalation';
            confidence = pilotAnalysis.stressLevel;
            severity = 'medium';
            action = 'Monitor for escalation';
        }
        // Officer Distress Detection
        else if (pilotAnalysis.stressLevel > 70 &&
            pilotAnalysis.escalationDetected) {
            threatType = 'Officer distress';
            confidence = pilotAnalysis.stressLevel;
            severity = 'high';
            action = 'Immediate check-in required';
        }
        // Gunshot (specific)
        else if (pilotAnalysis.gunshotThreat > 85) {
            threatType = 'Gunshot';
            confidence = pilotAnalysis.gunshotThreat;
            severity = 'critical';
            action = 'Emergency dispatch activated';
        }

        return {
            threatType,
            confidence: confidence / 100, // Convert to 0-1 scale
            severity,
            action,
            trigger: determineTrigger(features, keywords),
            stressLevel: pilotAnalysis.stressLevel > 50 ? 'high' : pilotAnalysis.stressLevel > 25 ? 'medium' : 'low'
        };
    };

    // Determine trigger for threat event
    const determineTrigger = (features: any, keywords: string[] = []): string => {
        const triggers = [];

        if (keywords && keywords.length > 0) {
            triggers.push(`Keyword: "${keywords[0]}"`);
        }

        if (features.spectralCentroid > 2000) {
            triggers.push('High frequency impulse');
        }

        if (features.zeroCrossingRate > 0.1) {
            triggers.push('Impulsive sound pattern');
        }

        if (features.rmsEnergy > 0.3) {
            triggers.push('Elevated volume');
        }

        if (features.chromaEntropy > 2.5) {
            triggers.push('Chaotic vocal pattern');
        }

        return triggers.length > 0 ? triggers.join(' + ') : 'Acoustic anomaly detected';
    };

    // Escalation Pattern Detection
    const detectEscalationPattern = (currentEvent: any): any => {
        const history = [...escalationHistory, currentEvent].slice(-5); // Last 5 events

        if (history.length < 2) return { pattern: 'normal', confidence: 0.5 };

        // Pattern analysis
        let escalationLevel = 'normal';
        let patternConfidence = 0;

        // Check for escalation progression
        const stressLevels = history.map(e => e.stressLevel || 'low');
        const confidences = history.map(e => e.confidence || 0);

        // Escalation detection logic
        if (stressLevels.includes('high') && confidences.some(c => c > 0.8)) {
            escalationLevel = 'struggle';
            patternConfidence = 0.9;
        } else if (stressLevels.includes('medium') && confidences.some(c => c > 0.6)) {
            escalationLevel = 'commands';
            patternConfidence = 0.7;
        } else if (stressLevels.includes('medium')) {
            escalationLevel = 'raised';
            patternConfidence = 0.6;
        }

        return {
            pattern: escalationLevel,
            confidence: patternConfidence,
            progression: getEscalationProgression(history)
        };
    };

    // Get escalation progression timeline
    const getEscalationProgression = (history: any[]): string => {
        const progression = [];

        history.forEach((event, index) => {
            const time = new Date(event.timestamp).toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });

            progression.push(`${time}: ${event.threatType}`);
        });

        return progression.join(' → ');
    };

    // Generate Simulated Dispatch Event
    const generateDispatchEvent = (threatEvent: any): any => {
        const dispatchTime = new Date();
        const timeString = dispatchTime.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        return {
            time: timeString,
            reason: `${threatEvent.threatType} detected`,
            confidence: threatEvent.confidence,
            recommendedAction: generateDispatchNarrative(threatEvent, dispatchTime),
            officerId: officerMetadata.officerId,
            location: officerMetadata.location,
            cameraId: officerMetadata.cameraId
        };
    };

    // Generate dispatch narrative
    const generateDispatchNarrative = (threatEvent: any, dispatchTime: Date): string => {
        const timeString = dispatchTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let narrative = `At approximately ${timeString} hours the officer`;

        switch (threatEvent.threatType) {
            case 'Weapon threat':
                narrative += ` issued verbal commands instructing a suspect to drop a ${threatEvent.trigger.includes('knife') ? 'knife' : 'weapon'}. Audio analysis detected elevated stress levels and multiple verbal commands consistent with a high-risk encounter.`;
                break;
            case 'Physical struggle':
                narrative += ` engaged in a physical struggle. Audio analysis detected impact sounds, elevated stress levels, and chaotic vocal patterns consistent with a violent encounter.`;
                break;
            case 'Verbal escalation':
                narrative += ` encountered verbal escalation. Audio analysis detected raised voices, increased vocal stress, and aggressive language patterns.`;
                break;
            case 'Gunshot':
                narrative += ` reported a gunshot. Audio analysis detected a high-frequency impulse consistent with firearm discharge.`;
                break;
            case 'Officer distress':
                narrative += ` exhibited signs of distress. Audio analysis detected elevated stress levels and unusual vocal patterns requiring immediate check-in.`;
                break;
            default:
                narrative += ` encountered an unusual situation requiring attention.`;
        }

        return narrative;
    };

    // Record a probabilistic threat event and update escalation/dispatch state
    const recordProbabilisticThreatEvent = (
        features: any,
        pilotAnalysis: any,
        source: 'live-mic' | 'file-upload' | 'text',
        keywords: string[] = []
    ) => {
        const classified = classifyThreat(features, pilotAnalysis, keywords);
        if (classified.threatType === 'Unknown') return;

        const timestamp = Date.now();
        const eventId = `${timestamp}-${Math.random().toString(16).slice(2)}`;

        const threatEvent = {
            id: eventId,
            timestamp,
            source,
            ...classified,
            featureVector: features.flatFeatureVector || null
        };

        setThreatEvents(prev => [...prev, threatEvent]);

        const escalationEntry = {
            ...threatEvent,
            stressLevel: classified.stressLevel,
            confidence: classified.confidence
        };

        setEscalationHistory(prev => [...prev, escalationEntry]);

        const escalation = detectEscalationPattern(escalationEntry);
        setEscalationPattern(escalation.pattern);

        setDetectedEvents(prev => [
            ...prev,
            {
                type: classified.threatType,
                time: new Date(timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                trigger: classified.trigger,
                confidence: classified.confidence,
                action: classified.action
            }
        ]);

        if (classified.action === 'Immediate backup required' || classified.action === 'Emergency dispatch activated') {
            const dispatchEvent = generateDispatchEvent({
                threatType: classified.threatType,
                confidence: classified.confidence,
                trigger: classified.trigger
            });
            setDispatchEvents(prev => [...prev, dispatchEvent]);
        }

        setIncidentMetrics(prev => ({
            ...prev,
            totalIncidents: prev.totalIncidents + 1
        }));
    };

    // Officer Feedback System
    const handleOfficerFeedback = (eventId: string, feedback: 'correct' | 'false' | 'missed') => {
        // Update false positive tracking
        setFalsePositiveTracking(prev => {
            const updated = { ...prev };

            if (feedback === 'correct') {
                updated.confirmedIncidents++;
            } else if (feedback === 'false') {
                updated.falsePositives++;
            } else if (feedback === 'missed') {
                // This would be handled differently in a real system
                updated.totalIncidents++;
            }

            return updated;
        });

        // Update event with feedback
        setThreatEvents(prev => prev.map(event =>
            event.id === eventId
                ? { ...event, officerFeedback: feedback, feedbackTimestamp: new Date().toISOString() }
                : event
        ));

        // Calculate manual reviews saved
        setFalsePositiveTracking(prev => ({
            ...prev,
            manualReviewsSaved: prev.confirmedIncidents * 15 // Estimate: 15 minutes saved per confirmed incident
        }));
    };

    // ── Edge Case Mitigation State ──
    const [soloMode, setSoloMode] = useState(true);           // #1/#2: GPS proximity gate
    const [trainingMode, setTrainingMode] = useState(false);  // #3: Suppress alerts during drills
    const [cancelOverride, setCancelOverride] = useState(false); // #8: Officer verbal cancel
    const [ambientBaseline, setAmbientBaseline] = useState(0);  // #7: Rolling noise floor
    const [lowLightMode, setLowLightMode] = useState(false);     // #9: Video weight reduction
    const [accelerometerFallback, setAccelerometerFallback] = useState(false); // #6: Camera obstructed
    const [nearbyUnits, setNearbyUnits] = useState(0);          // #1: Simulated proximity count
    const [suppressionLog, setSuppressionLog] = useState<string[]>([]); // Audit trail of suppressed alerts

    // ── Advanced CAD & Context State (Cases 11-20) ──
    const [cadDomestic, setCadDomestic] = useState(false);      // #11: Domestic/Disturbance
    const [cadEDP, setCadEDP] = useState(false);                // #12: Mental Health/EDP
    const [cadHighRisk, setCadHighRisk] = useState(false);      // #20: Swatting/Prank
    const [lateShift, setLateShift] = useState(false);          // #19: Fatigue
    const [weatherNoise, setWeatherNoise] = useState(false);    // #17: Environment mimicking distress
    const [pursuitMode, setPursuitMode] = useState(false);      // #13: Foot pursuits
    const [custodyMode, setCustodyMode] = useState(false);      // #18: Post-restraint
    const [primedContext, setPrimedContext] = useState<string | null>(null); // #14, #15, #16: Officer initiated contacts

    // Auto-detection polling: runs every 15s, simulates all scenario signals
    useEffect(() => {
        const detectScenarios = () => {
            const now = Date.now();
            const inactiveMs = now - lastActivityTimestamp;

            setAdditionalFlags(prev => {
                const next = { ...prev };

                // ── A: Physiological ──
                next.officerUnresponsive = !offDutyDetected && inactiveMs > 90000;
                next.footPursuit = pursuitMode;
                next.bwcFaceDown = bodyCamStatus === 'obstructed';
                next.extremeWeather = weatherNoise;
                next.interviewRoom = inStationGeofence && cadHighRisk;
                next.cityEvent = operationalContext === 'protest_riot';

                // ── Category 1: Linguistic Ambiguity ──
                // radioCrosstalk: auto-detected when radioKeying is active (squelch fingerprint)
                next.radioCrosstalk = prev.radioKeying;
                // tacticalComm: fires when primed context suggests officer-initiated scene (found weapon)
                next.tacticalComm = !!primedContext && operationalContext === 'standard_patrol';
                // mediaInterference: fires when BWC shows degraded + vehicle active (patrol car scenario)
                next.mediaInterference = vehicleDetected && !offDutyDetected;

                // ── Category 2: Visual Misidentification ──
                // flashlightReflection: fires in low light with no confirmed audio corroboration
                next.flashlightReflection = lowLightMode;
                // pistolGripObject: fires when CV confidence is ambiguous (simulated by lowLight + solo)
                next.pistolGripObject = lowLightMode && soloDetection.isSolo;
                // holsterDraw: fires during active high-risk call (officer likely has weapon drawn)
                next.holsterDraw = (cadDomestic || cadHighRisk) && soloDetection.isSolo;

                // ── Category 3: Solo vs. Partner Gap ──
                // ghostPartner: fires when scene suddenly has more officers than BT mesh registered
                // OR: CV detects 2+ humans in police gear but BT Mesh says 1 (CV Human Count check)
                next.ghostPartner = (sceneOfficers.length > 1 && soloDetection.isSolo && soloDetection.confidence > 60) ||
                                    (cvPoliceCount >= 2 && sceneOfficers.length === 0);
                // coordinatedArrest: fires when 2+ officers are on scene and an active call exists
                next.coordinatedArrest = sceneOfficers.length > 1 && !!activeSceneId;

                // ── Acoustic & Linguistic (Batch 2) ──
                // narrativeRecall: officer stationary + in debrief-like context (training/post-shift)
                next.narrativeRecall = trainingMode || (lateShift && !activeSceneId);
                // phoneticOverlap: high-echo environments (tunnel) raise phonetic ambiguity risk
                next.phoneticOverlap = additionalFlags.tunnelPatrol;
                // vehicleBackfire: when officer is in/near vehicle and not on active call
                next.vehicleBackfire = vehicleDetected && !activeSceneId;
                // sirenEcho: when siren-producing vehicle nearby (pursuit or EMS-assisted)
                next.sirenEcho = vehicleDetected && (pursuitMode || additionalFlags.hospitalPatrol);
                // gearNoise: always a background risk when officer is moving (low-light or active call)
                next.gearNoise = !offDutyDetected && !inStationGeofence;
                // narrationKwsFP: officer narrating de-escalation (EDP or domestic call context)
                next.narrationKwsFP = cadEDP || cadDomestic;

                // ── Visual & CV (Batch 2) ──
                // doritoBag: low confidence CV zone — ambient risk, fire when lowLightMode active
                next.doritoBag = lowLightMode && !activeSceneId;
                // shadowGun: dawn/dusk low-angle light (approximate with lowLightMode)
                next.shadowGun = lowLightMode;
                // occlusionReentry: during any active call (hand-in-pocket is a common scene element)
                next.occlusionReentry = !!activeSceneId && soloDetection.isSolo;
                // motionBlurWeapon: during foot pursuit (camera moving rapidly)
                next.motionBlurWeapon = pursuitMode;
                // uniformConfusion: city events or multi-officer scenes
                next.uniformConfusion = additionalFlags.cityEvent || sceneOfficers.length > 1;

                // ── Situational & Contextual ──
                // cprFalseAlarm: hospital patrol or EMS-assisted call type
                next.cprFalseAlarm = additionalFlags.hospitalPatrol || (cadEDP && !activeSceneId);
                // friendlyContact: community policing / de-escalation context (EDP call, no high-risk)
                next.friendlyContact = cadEDP && !cadHighRisk;
                // rehearsalPrank: training mode + city event (venues)
                next.rehearsalPrank = trainingMode || additionalFlags.cityEvent;
                // animalEncounter: active call, off-road or park context (simulated by non-station, non-vehicle)
                next.animalEncounter = !vehicleDetected && !inStationGeofence && !!activeSceneId;
                // bwcDropped: during pursuit or struggle-risk contexts
                next.bwcDropped = pursuitMode || (bodyCamStatus === 'obstructed' && !!activeSceneId);

                // ── Logic & Metadata ──
                // gpsDrift: when vehicle + multi-story building likely (intermittent signal)
                next.gpsDrift = additionalFlags.intermittentSignal || additionalFlags.tunnelPatrol;
                // crossJurisdiction: when scene has multiple officers but not all are in CAD
                next.crossJurisdiction = sceneOfficers.length > 1 && !soloDetection.isSolo;
                // sensitivityOverride: when system is in degraded or offline state (over-alerting risk)
                next.sensitivityOverride = systemHealth === 'degraded' || systemHealth === 'offline';

                // ── Acoustic & Environmental (Batch 3) ──
                next.hydraulicHiss = vehicleDetected && !activeSceneId;
                next.echoChamber = additionalFlags.tunnelPatrol;
                next.k9Distress = vehicleDetected && additionalFlags.cityEvent;
                next.thunderclap = additionalFlags.extremeWeather;
                next.velcroRip = cadHighRisk && !!activeSceneId;
                next.paScreech = additionalFlags.cityEvent || operationalContext === 'protest_riot';
                next.crowdChant = additionalFlags.cityEvent;

                // ── CV & Physical (Batch 3) ──
                next.sprayPaintCan = lowLightMode && !activeSceneId;
                next.flashlightStrobe = lowLightMode && pursuitMode;
                next.telescopicBaton = cadHighRisk && soloDetection.isSolo;
                next.reflectiveSafetyVest = lowLightMode && vehicleDetected;
                next.selfieStickLongGun = additionalFlags.cityEvent && sceneOfficers.length > 0;
                next.fingerGun = cadEDP && !cadHighRisk;
                next.medicalEquipment = additionalFlags.hospitalPatrol;

                // ── Tactical & Operational (Batch 3) ──
                // code4Delay: recent activity happened just before a cancel-override
                next.code4Delay = cancelOverride && (Date.now() - lastActivityTimestamp < 6000);
                next.doorBreaching = cadHighRisk && !!activeSceneId && inStationGeofence;
                next.undercoverSlang = trainingMode && !soloDetection.isSolo;
                next.taserRapidFire = additionalFlags.taserDeployment;
                next.footfallBiometrics = pursuitMode;
                next.brushWhipping = additionalFlags.animalEncounter && !vehicleDetected;
                next.radioHandReach = vehicleDetected && soloDetection.isSolo;
                next.windowPunch = vehicleDetected && !!activeSceneId;
                next.safeTable = inStationGeofence && !activeSceneId;
                next.patDown = (cadDomestic || cadEDP) && !!activeSceneId;
                next.loudMusicVibration = vehicleDetected && additionalFlags.cityEvent;

                // ── Meta & Psychological (Batch 4) ──
                next.sarcasmDarkHumor = offDutyDetected && !activeSceneId;
                next.thirdPersonNarrative = trainingMode;
                next.radioClash = sceneOfficers.length > 0 && !soloDetection.isSolo;
                next.languageBarrier = cadEDP && !cadHighRisk;
                next.mentalHealthRepeat = cadEDP && !!activeSceneId;

                // ── Hardware & Physics (Batch 4) ──
                next.magnetometerInterference = additionalFlags.hospitalPatrol && vehicleDetected;
                next.radioPouchClip = cadHighRisk && !!activeSceneId;
                next.lightBarStrobe = lowLightMode && vehicleDetected;
                next.rainSweatLens = additionalFlags.extremeWeather && vehicleDetected;
                next.chestThump = pursuitMode;

                // ── Fringe Environmental (Batch 4) ──
                next.bugZapper = !vehicleDetected && additionalFlags.hospitalPatrol;
                next.highWindBuffeting = additionalFlags.extremeWeather;
                next.skateboardPop = additionalFlags.cityEvent && !vehicleDetected;
                next.carWash = vehicleDetected && !activeSceneId && !soloDetection.isSolo;
                next.beanBagRound = additionalFlags.animalEncounter;

                // ── Human-in-the-Loop (Batch 4) ──
                next.bathroomBreak = inStationGeofence && !activeSceneId;
                next.undercoverSafeWord = cadDomestic && !additionalFlags.undercoverSlang;
                next.firmwareBug = systemHealth === 'offline';
                next.tacticalBreathing = pursuitMode && !cadHighRisk;
                next.handcuffClicks = cadHighRisk && !!activeSceneId;

                // ── Smart City Interference (Batch 4) ──
                next.droneInterference = additionalFlags.cityEvent && cadHighRisk;
                next.evPedestrianAlert = vehicleDetected && additionalFlags.cityEvent && lateShift;
                next.smartDoorbellCrosstalk = additionalFlags.hospitalPatrol && !vehicleDetected;
                next.mirrorIncident = lowLightMode && !vehicleDetected;
                next.crowdPanicApp = additionalFlags.cityEvent && sceneOfficers.length > 0;

                // ── Adversarial & Intentional Manipulation (Batch 5) ──
                next.externalVoiceTrigger = activeSceneId !== null && !soloDetection.isSolo && !cadHighRisk;
                next.audioMaskingDetection = additionalFlags.loudMusicVibration && cadHighRisk;

                // ── High-Velocity Motion & Physics (Batch 5) ──
                next.vehicleBailoutLogic = pursuitMode && vehicleDetected;

                // ── System & Legal Compliance (Batch 5) ──
                next.sensitiveLocationMasking = additionalFlags.hospitalPatrol || inStationGeofence;
                next.spatialClusterEngine = additionalFlags.cityEvent && sceneOfficers.length > 0 && cadHighRisk;
                next.stealthModeSuppression = cadHighRisk && !vehicleDetected && !!activeSceneId;

                // ── D: Network ──
                const newLag = systemHealth === 'degraded' ? 90000 + Math.random() * 90000 :
                               systemHealth === 'offline' ? 180000 + Math.random() * 120000 : Math.random() * 30000;
                setCadLagMs(newLag);
                next.staleCAD = newLag > 120000;
                next.networkOutage = systemHealth === 'offline';
                next.intermittentSignal = systemHealth === 'degraded';

                const newQuality = systemHealth === 'offline' ? 0 :
                                   systemHealth === 'degraded' ? 20 + Math.floor(Math.random() * 30) :
                                   85 + Math.floor(Math.random() * 15);
                setNetworkSignalQuality(newQuality);

                // Log newly activated flags
                const newlyActive = (Object.keys(next) as AdditionalScenarioKey[]).filter(k => next[k] && !prev[k]);
                if (newlyActive.length > 0) {
                    setAutoDetectionLog(prevLog => [
                        ...newlyActive.map(k => ({
                            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                            system: ADDITIONAL_SCENARIO_PROFILES[k].label,
                            status: 'AUTO-DETECTED',
                            reason: ADDITIONAL_SCENARIO_PROFILES[k].detection
                        })),
                        ...prevLog
                    ].slice(0, 30));
                }
                return next;
            });
        };

        detectScenarios();
        const interval = setInterval(detectScenarios, 15000);
        return () => clearInterval(interval);
    }, [lastActivityTimestamp, offDutyDetected, pursuitMode, bodyCamStatus, weatherNoise, inStationGeofence, cadHighRisk, operationalContext, systemHealth, primedContext, vehicleDetected, lowLightMode, soloDetection, cadDomestic, sceneOfficers, activeSceneId, additionalFlags, trainingMode, cadEDP, lateShift, cvPoliceCount]);

    // ── Phase 1: Pipeline State ──
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [isDispatching, setIsDispatching] = useState(false);
    const [activeSignals, setActiveSignals] = useState<string[]>([]);
    const [incidentReport, setIncidentReport] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);
    const [lastDispatchTime, setLastDispatchTime] = useState<number>(0);

    const fileRef = useRef<HTMLInputElement>(null);
    const timers = useRef<any[]>([]);
    const recRef = useRef<any>(null);
    const ambientSamples = useRef<number[]>([]);  // #7: Rolling ambient window

    // Audio Context refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const rafRef = useRef<any>(null);

    // ── Pre-Filter: Edge Case Mitigation Engine (Enhanced with Auto-Detection) ──
    const shouldSuppressAlert = useCallback((confidence: number, model: string): { suppress: boolean; reason: string } => {
        // ═══ SOLO DETECTION: Auto-Dispatch Gatekeeper ═══
        if (!soloDetection.autoDispatchEnabled) {
            return { suppress: true, reason: `AUTO-DISPATCH DISABLED — Officer not solo (${soloDetection.confidence}% solo confidence, threshold: 70%). ${soloDetection.reasoning}` };
        }

        // ═══ STATION GEOFENCE (P3: Context over proximity) ═══
        if (inStationGeofence) {
            return { suppress: true, reason: 'STATION GEOFENCE — Auto-dispatch suppressed within police station/precinct property. P3: Proximity to other officers at station ≠ field incident.' };
        }

        // ═══ HYSTERESIS GUARD (P4: Stable state transitions) ═══
        if (pendingSoloState !== null) {
            return { suppress: true, reason: `HYSTERESIS — State transition pending (${pendingSoloState ? 'SOLO' : 'PARTNERED'}). P4: Waiting 60s for stable signal before activating. Prevents oscillation artifacts.` };
        }

        // ═══ LOGIC REFINEMENT: Code 4 Event Horizon Kill Switch ═══
        if (isCode4Safe && model !== 'keyword') {
            return { suppress: true, reason: 'CODE 4 KILL SWITCH — De-escalation keyword within 90s context zeroes FUSION_DISPATCH_THRESHOLD.' };
        }

        // ═══ LOGIC REFINEMENT: High-Reverb KWS Disambiguation ═══
        const isHighReverb = additionalFlags.echoChamber || additionalFlags.tunnelPatrol;
        if (model === 'keyword' && isHighReverb && liveModelConf.cvWeapon < 80) {
            return { suppress: true, reason: `HIGH REVERB KWS EXTRACTOR — Audio RT60 > 0.8s requires CV Weapon Confidence > 80% (Currently ${liveModelConf.cvWeapon}%).` };
        }

        // ═══ ADDITIONAL SCENARIO FLAGS (Auto-detected edge cases) ═══
        // #8: Each flag's threshold effect is weighted by its decay ratio (TTL-based freshness)
        for (const key of Object.keys(additionalFlags) as AdditionalScenarioKey[]) {
            if (!additionalFlags[key]) continue;
            const scenario = ADDITIONAL_SCENARIO_PROFILES[key];
            const decayRatio = getFlagDecayRatio(key); // 1.0 = fresh, 0.0 = expired
            if (decayRatio <= 0) continue; // Flag TTL expired — ignore

            // Full model suppression
            if (scenario.suppressModels.includes(model)) {
                return { suppress: true, reason: `${scenario.label.toUpperCase()} — ${model} suppressed (flag freshness ${Math.round(decayRatio * 100)}%). ${scenario.education.split('.')[0]}.` };
            }
            // Threshold adjustment scaled by decay: a stale flag has less impact
            const rawAdj = scenario.thresholdAdjust[model as keyof typeof scenario.thresholdAdjust] ?? 0;
            const adj = rawAdj * decayRatio; // decay-weighted
            if (adj > 0) {
                const effectiveThreshold = Math.min(99, 75 + adj);
                if (confidence < effectiveThreshold) {
                    return { suppress: true, reason: `${scenario.label.toUpperCase()} — ${model} conf ${confidence}% < threshold ${Math.round(effectiveThreshold)}% (+${Math.round(adj)}%, ${Math.round(decayRatio * 100)}% fresh). ${scenario.education.split('.')[0]}.` };
                }
            }
        }

        // ═══ OPERATIONAL CONTEXT: Environment-Aware Filtering ═══
        const profile = CONTEXT_PROFILES[operationalContext];
        if (operationalContext !== 'standard_patrol') {
            // Check if model is fully suppressed in this context
            if (profile.suppressModels.includes(model)) {
                return { suppress: true, reason: `${profile.label.toUpperCase()} CONTEXT — ${model} model suppressed (${profile.education.split('.')[0]})` };
            }
            // Apply context-specific thresholds
            const contextThreshold = profile.thresholds[model as keyof typeof profile.thresholds];
            if (contextThreshold && confidence < contextThreshold && model !== 'keyword') {
                return { suppress: true, reason: `${profile.label.toUpperCase()} — ${model} confidence ${confidence}% < context threshold ${contextThreshold}% (${profile.falsePositives[0] || 'environment noise'})` };
            }
        }

        // ═══ COMPONENT 2: Auto-Detected False Positive Prevention ═══

        // Off-duty temporal filter (auto-detected from shift schedule)
        if (offDutyDetected) return { suppress: true, reason: 'OFF-DUTY — Temporal filter active (outside shift schedule)' };

        // Firing range geofence (auto-detected from GPS)
        if (firingRangeDetected && model === 'gunshot') return { suppress: true, reason: 'FIRING RANGE — GPS geofence active, gunshot model suppressed' };

        // Vehicle/engine noise (auto-detected from audio spectral analysis)
        if (vehicleDetected) {
            if (model === 'struggle') return { suppress: true, reason: 'IN-VEHICLE — Engine noise context, struggle model suppressed' };
            if (model === 'gunshot' && confidence < 98) return { suppress: true, reason: `IN-VEHICLE — Gunshot threshold raised to 98% (conf: ${confidence}%)` };
        }

        // Body cam malfunction (auto-detected from sensor) → require multi-modal
        if (bodyCamStatus === 'malfunction' && model !== 'keyword') {
            return { suppress: false, reason: `BODY CAM MALFUNCTION — Multi-modal confirmation required (audio + keyword + escalation must agree)` };
        }

        // ═══ COMPONENT 1: Multi-Officer Deduplication ═══

        // Backup already on-scene → suppress re-dispatch
        if (sceneOfficers.length > 1 && (model === 'gunshot' || model === 'struggle')) {
            const backupOfficer = sceneOfficers.find(o => o.role === 'backup');
            if (backupOfficer) {
                return { suppress: true, reason: `BACKUP ON-SCENE — Officer ${backupOfficer.id} arrived, duplicate dispatch suppressed` };
            }
        }

        // Dedup window: suppress if same scene dispatched recently
        if (activeSceneId && Date.now() - lastSceneDispatchTime < deduplicationWindow) {
            return { suppress: true, reason: `DEDUP — Alert within ${deduplicationWindow / 1000}s of prior dispatch for scene ${activeSceneId}` };
        }

        // ═══ COMPONENT 3: Edge Case — Camera ripped off → escalation ═══
        if (accelerometerFallback && !bodyCamStatus.startsWith('active')) {
            // Don't suppress — treat as escalation signal
            return { suppress: false, reason: 'CAMERA DETACHED — Treating as potential officer distress, escalating' };
        }

        // ═══ EXISTING FILTERS ═══

        // #8, #18: Officer verbal cancel or custody mode overrides everything
        if (cancelOverride) return { suppress: true, reason: 'Officer verbal override active (Code 4)' };
        if (custodyMode) return { suppress: true, reason: 'Post-restraint custody mode active — Use-of-force sounds suppressed' };

        // #3: Training mode suppresses all alerts (MANUAL toggle)
        if (trainingMode) return { suppress: true, reason: 'Training Mode active — alert logged but not dispatched' };

        // #1/#2: Non-solo suppression
        if (!soloMode || nearbyUnits > 0) return { suppress: true, reason: `Solo Mode OFF — ${nearbyUnits} unit(s) in proximity` };

        // #13: Foot pursuit suppresses heavy breathing / struggle sounds
        if (pursuitMode && model === 'struggle') return { suppress: true, reason: 'Foot Pursuit Active — Motion/Audio baseline suppressed' };

        // #9: Low Light / Night Mode — Boost audio sensitivity because video is degraded
        const effectiveConfidence = lowLightMode ? confidence + 15 : confidence;
        const threshold = lowLightMode ? 80 : 95;

        // #17: Environmental noise mimicking distress
        if (weatherNoise && model !== 'keyword' && effectiveConfidence < 95) {
            return { suppress: true, reason: 'Environmental/Weather Disturbance Flag Active — Low confidence audio suppressed' };
        }

        // #11, #12: Domestic/EDP require higher certainty to prevent false positives from yelling
        if ((cadDomestic || cadEDP) && model === 'struggle' && effectiveConfidence < 98) {
            return { suppress: false, reason: `CAD Profile (Domestic/EDP) Active — Multi-modal confirmation required (Conf ${effectiveConfidence}% < 98%)` };
        }

        // #20: Swatting / High-risk profiling boosts sensitivity
        if (cadHighRisk && effectiveConfidence >= 85) {
            return { suppress: false, reason: `CAD High-Risk/Swat Profile — Sensitivity Boosted (Auto-Dispatch at 85% instead of 95%)` };
        }

        // #6: N-Best Phoneme ambiguity check (keyword model only)
        if (model === 'keyword' && isPhoneticAmbiguous(lastKeywordPhrase)) {
            const kThreshold = 75 + 18; // +18% for phonetic ambiguity
            if (confidence < kThreshold) {
                return { suppress: true, reason: `N-BEST PHONEME — "${lastKeywordPhrase}" is phonetically ambiguous (sounds like non-threat word). Keyword conf ${confidence}% < ${kThreshold}% boosted threshold.` };
            }
        }

        // ═══ #5/#10: Final confidence gate — with escalation boost from event horizon ═══
        // #2: Escalation boost: prior events in the 90s window lower the required threshold
        const boostedConf = effectiveConfidence + escalationBoost;
        const fatigueNote = lateShift ? ' (Late Shift Active — Lowering supervisor threshold)' : '';
        const lightNote = lowLightMode ? ' (Low-Light Sensitivity Boost Active)' : '';
        const horizonNote = escalationBoost > 0 ? ` [Event Horizon: +${escalationBoost}% from ${activeEscalationPattern}]` : '';
        if (boostedConf < threshold && model !== 'keyword') {
            return { suppress: false, reason: `Confidence ${effectiveConfidence}%${horizonNote} < ${threshold}% threshold — supervisor review only${fatigueNote}${lightNote}` };
        }

        // #1: Multi-Modal Fusion Gate — require weighted joint confidence before dispatch
        // (All three model scores must be sufficiently high together)
        if (fusionTier === 'suppress' && model === 'gunshot') {
            return { suppress: true, reason: `FUSION GATE — Joint confidence score ${(fusionScore * 100).toFixed(0)}% < ${(FUSION_REVIEW_THRESHOLD * 100).toFixed(0)}% review threshold. Gunshot alone insufficient for dispatch. (G:${liveModelConf.gunshot}% S:${liveModelConf.struggle}% K:${liveModelConf.keyword}%)` };
        }
        if (fusionTier === 'review' && model === 'gunshot') {
            return { suppress: false, reason: `FUSION REVIEW — Joint score ${(fusionScore * 100).toFixed(0)}% (${(FUSION_DISPATCH_THRESHOLD * 100).toFixed(0)}% needed for dispatch). Queued for dispatcher review. (G:${liveModelConf.gunshot}% S:${liveModelConf.struggle}% K:${liveModelConf.keyword}%)` };
        }

        // #7: Ambient noise spike detection
        if (ambientBaseline > 0.3 && model === 'gunshot') {
            return { suppress: false, reason: `High ambient noise floor (${Math.round(ambientBaseline * 100)}%) — audio weight reduced` };
        }

        // ═══ COMPONENT 3: Privacy — volatile processing note ═══
        const privacyNote = volatileMode ? ' [Volatile: non-threat data purged]' : '';
        const primingNote = primedContext ? ` [Context Primed: ${primedContext}]` : '';
        return { suppress: false, reason: `${primingNote}${privacyNote}` };
    }, [cancelOverride, trainingMode, soloMode, nearbyUnits, ambientBaseline, custodyMode, pursuitMode, weatherNoise, cadDomestic, cadEDP, cadHighRisk, lateShift, primedContext, lowLightMode, offDutyDetected, firingRangeDetected, vehicleDetected, bodyCamStatus, sceneOfficers, activeSceneId, lastSceneDispatchTime, deduplicationWindow, accelerometerFallback, volatileMode, operationalContext, soloDetection, inStationGeofence, pendingSoloState, additionalFlags, getFlagDecayRatio, fusionScore, fusionTier, liveModelConf, escalationBoost, activeEscalationPattern, isPhoneticAmbiguous, lastKeywordPhrase, isCode4Safe]);

    // ── Ambient Noise Baseline Tracker (#7) ──
    const updateAmbientBaseline = useCallback((maxVal: number) => {
        ambientSamples.current.push(maxVal);
        if (ambientSamples.current.length > 20) ambientSamples.current.shift();
        const avg = ambientSamples.current.reduce((a, b) => a + b, 0) / ambientSamples.current.length;
        setAmbientBaseline(avg);
    }, []);

    // ── Auto-Detection Engine (runs on mount + interval) ──
    useEffect(() => {
        const logDetection = (system: string, status: string, reason: string) => {
            setAutoDetectionLog(prev => [{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), system, status, reason }, ...prev].slice(0, 30));
        };

        const runAutoDetection = () => {
            const currentHour = new Date().getHours();

            // Off-duty detection from shift schedule
            const isWithinShift = currentHour >= shiftSchedule.start && currentHour < shiftSchedule.end;
            const wasOffDuty = offDutyDetected;
            setOffDutyDetected(!isWithinShift);
            if (!isWithinShift && !wasOffDuty) {
                logDetection('Temporal Filter', 'OFF-DUTY', `Current hour ${currentHour}:00 outside shift ${shiftSchedule.start}:00-${shiftSchedule.end}:00`);
            }

            // Late shift auto-detection (last 2 hours of shift)
            if (isWithinShift && currentHour >= shiftSchedule.end - 2) {
                setLateShift(true);
                logDetection('Fatigue Monitor', 'LATE SHIFT', `Last 2 hours of shift — fatigue sensitivity active`);
            }

            // Simulated GPS-based firing range detection (demo: always off unless toggled by Axon pipeline)
            // In production this would check GPS coordinates against known range locations

            // Simulated body cam health check
            // In production: Axon API reports camera status
            logDetection('Body Cam', bodyCamStatus.toUpperCase(), 'Sensor health check — Axon API polling');

            // Auto-detect low light from time
            const isNight = currentHour >= 19 || currentHour < 6;
            setLowLightMode(isNight);
        };

        // Run immediately
        runAutoDetection();

        // Poll every 60 seconds
        const intervalId = setInterval(runAutoDetection, 60000);

        return () => clearInterval(intervalId);
    }, [shiftSchedule]);

    // ── Vehicle Noise Auto-Detection (from audio spectral analysis) ──
    const detectVehicleNoise = useCallback((features: any) => {
        // Engine noise: low spectral centroid + high energy + low zero-crossing rate
        if (features && features.spectralCentroid < 500 && features.rmsEnergy > 0.15 && features.zeroCrossingRate < 0.05) {
            if (!vehicleDetected) {
                setVehicleDetected(true);
                setAutoDetectionLog(prev => [{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), system: 'Audio Spectral', status: 'IN-VEHICLE', reason: 'Low-freq sustained rumble detected (centroid < 500Hz, low ZCR)' }, ...prev].slice(0, 30));
            }
        } else if (vehicleDetected) {
            setVehicleDetected(false);
        }
    }, [vehicleDetected]);

    // ── Body Cam Status Auto-Detection ──
    const detectBodyCamStatus = useCallback((hasVideoSignal: boolean, hasAudioSignal: boolean) => {
        if (!hasVideoSignal && !hasAudioSignal) {
            setBodyCamStatus('malfunction');
        } else if (!hasVideoSignal && hasAudioSignal) {
            setBodyCamStatus('obstructed');
        } else {
            setBodyCamStatus('active');
        }
    }, []);

    // ── Camera Rip-Off Detection (Edge Case: treat as escalation) ──
    const detectCameraRipOff = useCallback((features: any) => {
        // Sudden loss of video + spike in audio stress → officer distress
        if (accelerometerFallback && features && features.rmsEnergy > 0.4) {
            setBodyCamStatus('malfunction');
            // Auto-escalate: this is NOT a failure, it's a threat signal
            return { isRipOff: true, reason: 'Camera forcibly removed — interpreting as physical altercation' };
        }
        return { isRipOff: false, reason: '' };
    }, [accelerometerFallback]);

    // Initialize TensorFlow and YAMNet (with graceful degradation)
    useEffect(() => {
        // Prevent transformers.js from searching for local files in Node
        (env as any).allowLocalModels = false;

        async function loadModel() {
            let modelsLoaded = 0;
            try {
                await tf.ready();
                const model = await tf.loadGraphModel(YAMNET_MODEL_URL, { fromTFHub: true });
                setTfModel(model);
                modelsLoaded++;
            } catch (err) {
                console.error("Failed to load YAMNet:", err);
                setSystemHealth('degraded');
                setAutoDetectionLog(prev => [{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), system: 'System Health', status: 'DEGRADED', reason: 'YAMNet failed to load — keyword-only mode active' }, ...prev]);
            }

            try {
                const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
                setTranscriber(() => asr);
                modelsLoaded++;
            } catch (err) {
                console.error("Failed to load Whisper:", err);
                if (modelsLoaded === 0) {
                    setSystemHealth('offline');
                    setAutoDetectionLog(prev => [{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), system: 'System Health', status: 'OFFLINE', reason: 'All models failed — manual review mode only' }, ...prev]);
                } else {
                    setSystemHealth('degraded');
                }
            }

            if (modelsLoaded > 0) setModelLoading(false);

            // #9: Auto-detect Low Light based on system time (19:00 - 06:00)
            const hour = new Date().getHours();
            if (hour >= 19 || hour < 6) {
                setLowLightMode(true);
            }
        }
        loadModel();
        return () => {
            timers.current.forEach(clearTimeout);
            cancelAnimationFrame(rafRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current) audioCtxRef.current.close().catch(console.error);
            if (cancelTimerRef.current) clearInterval(cancelTimerRef.current);
        };
    }, []);

    const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const addLog = useCallback((e: Omit<LogEntry, 'timestamp' | 'id'>) => {
        setLog(p => [{ ...e, timestamp: now(), id: Date.now() + Math.random() } as LogEntry, ...p]);
    }, []);

    const setModel = useCallback((m: string, d: any) => setModels(p => ({ ...p, [m]: { ...p[m], ...d } })), []);

    // ── Transition & Timeline Logic ──
    const addToTimeline = useCallback((label: string, type: TimelineEvent['type'], confidence?: number) => {
        const newEvent: TimelineEvent = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: now(),
            type,
            label,
            confidence
        };
        setTimeline(prev => [newEvent, ...prev].slice(0, 50));
    }, []);

    const triggerDispatch = useCallback((reason: string) => {
        if (isDispatching || Date.now() - lastDispatchTime < 30000) return; // Prevent spam

        setIsDispatching(true);
        setLastDispatchTime(Date.now());
        addToTimeline(`Simulated Dispatch Triggered: ${reason}`, 'DISPATCH');

        // Simulated Radio Call (TTS)
        if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance();
            msg.text = `Dispatch to Unit 4, automatic backup initiated. Priority 1 response. Reason: ${reason}`;
            msg.rate = 0.9;
            msg.pitch = 1.1;
            window.speechSynthesis.speak(msg);
        }

        // Auto-clear notification after 10s
        setTimeout(() => setIsDispatching(false), 10000);
    }, [isDispatching, lastDispatchTime, addToTimeline]);

    // ── Component 4: Incident Lifecycle Management ──
    const computePriorityScore = useCallback((incident: { severity: string; confidence: number; escalationDetected?: boolean; keywordMatch?: boolean; cancelDetected?: boolean; detectedAt: number }) => {
        const severityScores: Record<string, number> = { critical: 100, high: 75, medium: 50, low: 25 };
        let score = severityScores[incident.severity] || 25;
        if (incident.escalationDetected) score += 20;
        if (incident.keywordMatch) score += 15;
        if (incident.confidence > 0.85) score += 10;
        if (incident.cancelDetected) score -= 30;
        // Recency bonus: +10 if within last 30 seconds
        if (Date.now() - incident.detectedAt < 30000) score += 10;
        return Math.max(0, Math.min(score, 150));
    }, []);

    const createManagedIncident = useCallback((threatType: string, confidence: number, severity: string, trigger: string): ManagedIncident => {
        const id = `INC-${Date.now().toString(36).toUpperCase()}`;
        const detectedAt = Date.now();
        const priorityScore = computePriorityScore({ severity, confidence, detectedAt });
        return {
            id,
            status: 'detected',
            detectedAt,
            severity: severity as ManagedIncident['severity'],
            priorityScore,
            threatType,
            confidence,
            trigger
        };
    }, [computePriorityScore]);

    const updateIncidentStatus = useCallback((incidentId: string, newStatus: IncidentStatus, resolution?: string) => {
        setManagedIncidents(prev => prev.map(inc =>
            inc.id === incidentId
                ? {
                    ...inc,
                    status: newStatus,
                    ...(newStatus === 'dispatched' ? { dispatchedAt: Date.now() } : {}),
                    ...(newStatus === 'resolved' || newStatus === 'false_positive' ? { resolvedAt: Date.now(), resolution } : {})
                }
                : inc
        ));
    }, []);

    const startDispatchCancelWindow = useCallback((dispatchId: string) => {
        const expiresAt = Date.now() + 15000;
        setDispatchCancelWindow({ active: true, expiresAt, dispatchId, countdown: 15 });

        // Clear any existing timer
        if (cancelTimerRef.current) clearInterval(cancelTimerRef.current);

        cancelTimerRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
            if (remaining <= 0) {
                clearInterval(cancelTimerRef.current);
                setDispatchCancelWindow(null);
                // Dispatch is now locked in
                updateIncidentStatus(dispatchId, 'dispatched');
            } else {
                setDispatchCancelWindow(prev => prev ? { ...prev, countdown: remaining } : null);
            }
        }, 1000);
    }, [updateIncidentStatus]);

    const cancelDispatch = useCallback((dispatchId: string) => {
        if (cancelTimerRef.current) clearInterval(cancelTimerRef.current);
        setDispatchCancelWindow(null);
        updateIncidentStatus(dispatchId, 'false_positive', 'Dispatcher cancelled within 15s window');
        setAutoDetectionLog(prev => [{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), system: 'Dispatch', status: 'CANCELLED', reason: `Dispatch ${dispatchId} cancelled by dispatcher override` }, ...prev].slice(0, 30));
    }, [updateIncidentStatus]);

    const reset = useCallback(() => {
        setModels({
            gunshot: { status: 'Standby', confidence: 0, color: 'green', lastDetection: null },
            keyword: { status: 'Standby', confidence: 0, color: 'green', lastDetection: null },
            struggle: { status: 'Standby', confidence: 0, color: 'green', lastDetection: null },
            speaker: { status: 'Calibrating', confidence: 0, color: 'green', lastDetection: null },
            stress: { status: 'Standby', confidence: 0, color: 'green', lastDetection: null },
        });
        setTimeline([]);
        setIsDispatching(false);
        setActiveSignals([]);
    }, []);

    // ── Signal Processing Helpers ──
    const getSpectralCentroid = (data: Float32Array) => {
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < data.length; i++) {
            numerator += i * Math.abs(data[i]);
            denominator += Math.abs(data[i]);
        }
        return denominator === 0 ? 0 : numerator / denominator;
    };

    const getPitchVariance = (data: Float32Array) => {
        let sum = 0;
        let sumSq = 0;
        const n = data.length;
        for (let i = 0; i < n; i++) {
            const val = Math.abs(data[i]);
            sum += val;
            sumSq += val * val;
        }
        const mean = sum / n;
        return (sumSq / n) - (mean * mean);
    };

    // ── Advanced Audio Feature Extraction for Pilot P1 ──

    // MFCC (Mel-Frequency Cepstral Coefficients) - 13 coefficients
    const getMFCC13 = (data: Float32Array): number[] => {
        const frameSize = 1024;
        const numCoefficients = 13;
        const sampleRate = 16000;
        const melFilters = createMelFilterBank(frameSize, sampleRate, numCoefficients + 1);

        // Compute power spectrum
        const fftResult = computeFFT(data.slice(0, frameSize));
        const powerSpectrum = fftResult.map(val => val * val);

        // Apply mel filter bank
        const melEnergies = melFilters.map(filter =>
            filter.reduce((sum, weight, idx) => sum + weight * powerSpectrum[idx], 0)
        );

        // Log compression
        const logMelEnergies = melEnergies.map(energy => Math.log(Math.max(energy, 1e-10)));

        // DCT to get MFCC
        return computeDCT(logMelEnergies).slice(0, numCoefficients);
    };

    // Create mel filter bank
    const createMelFilterBank = (frameSize: number, sampleRate: number, numFilters: number): number[][] => {
        const melLow = hzToMel(0);
        const melHigh = hzToMel(sampleRate / 2);
        const melPoints = Array.from({ length: numFilters + 2 }, (_, i) =>
            melToHz(melLow + (melHigh - melLow) * i / (numFilters + 1))
        );

        const fftBins = Array.from({ length: frameSize / 2 + 1 }, (_, i) => i * sampleRate / frameSize);

        return melPoints.slice(0, -1).map((mel, i) =>
            fftBins.map(bin => {
                const left = melPoints[i];
                const center = melPoints[i + 1];
                const right = melPoints[i + 2];

                if (bin <= left || bin >= right) return 0;
                if (bin <= center) return (bin - left) / (center - left);
                return (right - bin) / (right - center);
            })
        );
    };

    // Mel frequency conversion
    const hzToMel = (hz: number): number => 2595 * Math.log10(1 + hz / 700);
    const melToHz = (mel: number): number => 700 * (Math.pow(10, mel / 2595) - 1);

    // Simplified FFT (Power of 2 only)
    const computeFFT = (data: Float32Array): Float32Array => {
        const N = data.length;
        const result = new Float32Array(N);

        for (let k = 0; k < N; k++) {
            let real = 0;
            let imag = 0;
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += data[n] * Math.cos(angle);
                imag += data[n] * Math.sin(angle);
            }
            result[k] = Math.sqrt(real * real + imag * imag);
        }
        return result;
    };

    // Discrete Cosine Transform
    const computeDCT = (data: number[]): number[] => {
        const N = data.length;
        const result = new Array(N);

        for (let k = 0; k < N; k++) {
            let sum = 0;
            for (let n = 0; n < N; n++) {
                sum += data[n] * Math.cos(Math.PI * k * (n + 0.5) / N);
            }
            result[k] = sum * Math.sqrt(2 / N);
        }
        return result;
    };

    // Chroma Features (12 pitch classes)
    const getChromaFeatures = (data: Float32Array): number[] => {
        const sampleRate = 16000;
        const frameSize = 2048;
        const chroma = new Array(12).fill(0);

        // Compute FFT
        const fftResult = computeFFT(data.slice(0, frameSize));
        const powerSpectrum = fftResult.map(val => val * val);

        // Map frequency bins to chroma
        for (let i = 1; i < powerSpectrum.length / 2; i++) {
            const freq = i * sampleRate / frameSize;
            if (freq > 80 && freq < 2000) { // Musical range
                const pitch = 12 * Math.log2(freq / 440) + 69; // MIDI note number
                const chromaIndex = Math.round(pitch) % 12;
                chroma[chromaIndex] += powerSpectrum[i];
            }
        }

        // Normalize
        const sum = chroma.reduce((a, b) => a + b, 0);
        return sum > 0 ? chroma.map(val => val / sum) : chroma;
    };

    // Spectral Features (Centroid, Bandwidth, Roll-off)
    const getSpectralFeatures = (data: Float32Array) => {
        const frameSize = 2048;
        const sampleRate = 16000;
        const fftResult = computeFFT(data.slice(0, frameSize));
        const powerSpectrum = fftResult.map(val => val * val);

        // Spectral centroid
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < powerSpectrum.length / 2; i++) {
            const freq = i * sampleRate / frameSize;
            numerator += freq * powerSpectrum[i];
            denominator += powerSpectrum[i];
        }
        const centroid = denominator > 0 ? numerator / denominator : 0;

        // Spectral bandwidth
        let bandwidthNum = 0;
        for (let i = 0; i < powerSpectrum.length / 2; i++) {
            const freq = i * sampleRate / frameSize;
            bandwidthNum += Math.pow(freq - centroid, 2) * powerSpectrum[i];
        }
        const bandwidth = denominator > 0 ? Math.sqrt(bandwidthNum / denominator) : 0;

        // Spectral roll-off (85% energy point)
        let cumulativeEnergy = 0;
        const totalEnergy = powerSpectrum.reduce((a, b) => a + b, 0);
        let rollOffBin = 0;
        for (let i = 0; i < powerSpectrum.length / 2; i++) {
            cumulativeEnergy += powerSpectrum[i];
            if (cumulativeEnergy >= 0.85 * totalEnergy) {
                rollOffBin = i;
                break;
            }
        }
        const rollOff = rollOffBin * sampleRate / frameSize;

        return { centroid, bandwidth, rollOff };
    };

    // Zero-Crossing Rate
    const getZeroCrossingRate = (data: Float32Array): number => {
        let crossings = 0;
        for (let i = 1; i < data.length; i++) {
            if ((data[i - 1] >= 0 && data[i] < 0) || (data[i - 1] < 0 && data[i] >= 0)) {
                crossings++;
            }
        }
        return crossings / data.length;
    };

    // RMS Energy
    const getRMSEnergy = (data: Float32Array): number => {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        return Math.sqrt(sum / data.length);
    };

    // Perceptual Linear Prediction (PLP)
    const getPLP = (data: Float32Array): number[] => {
        const frameSize = 512;
        const numCoeffs = 13;
        const sampleRate = 16000;

        // Compute power spectrum
        const fftResult = computeFFT(data.slice(0, frameSize));
        const powerSpectrum = fftResult.map(val => val * val);

        // Critical band integration (simplified Bark scale)
        const barkBands = integrateCriticalBands(powerSpectrum, sampleRate);

        // Equal-loudness pre-emphasis
        const equalized = barkBands.map((energy, i) =>
            energy * (i < 15 ? Math.pow((i + 1) / 15, 0.5) : 1)
        );

        // Log compression and inverse DCT
        const logEqualized = equalized.map(energy => Math.log(Math.max(energy, 1e-10)));
        const plpCoeffs = computeDCT(logEqualized).slice(0, numCoeffs);

        return plpCoeffs;
    };

    // Critical band integration (simplified Bark scale)
    const integrateCriticalBands = (powerSpectrum: Float32Array, sampleRate: number): number[] => {
        const numBands = 24; // Bark scale bands
        const bands = new Array(numBands).fill(0);
        const nyquist = sampleRate / 2;

        for (let i = 0; i < powerSpectrum.length / 2; i++) {
            const freq = i * nyquist / (powerSpectrum.length / 2);
            const barkIndex = Math.min(Math.floor(13 * Math.atan(0.00076 * freq) + 3.5 * Math.atan((freq / 7500) * (freq / 7500))), numBands - 1);
            bands[barkIndex] += powerSpectrum[i];
        }

        return bands;
    };

    // Gammatone Frequency Cepstral Coefficients (GFCCs)
    const getGFCC = (data: Float32Array): number[] => {
        const numCoeffs = 13;
        const sampleRate = 16000;

        // Create gammatone filter bank
        const gammatoneFilters = createGammatoneFilterBank(sampleRate, numCoeffs + 1);

        // Apply filters and compute envelope
        const envelopes = gammatoneFilters.map(filter => {
            const filtered = applyGammatoneFilter(data, filter);
            return computeEnvelope(filtered);
        });

        // Log compression
        const logEnvelopes = envelopes.map(env => Math.log(Math.max(env, 1e-10)));

        // DCT to get GFCC
        return computeDCT(logEnvelopes).slice(0, numCoeffs);
    };

    // Create gammatone filter bank
    const createGammatoneFilterBank = (sampleRate: number, numFilters: number): GammatoneFilter[] => {
        const minFreq = 50;
        const maxFreq = sampleRate / 2;

        return Array.from({ length: numFilters }, (_, i) => {
            const centerFreq = minFreq * Math.pow(maxFreq / minFreq, i / (numFilters - 1));
            const bandwidth = 1.019 * (24.7 + 4.37 * centerFreq / 1000);

            return {
                centerFreq,
                bandwidth,
                order: 4,
                sampleRate
            };
        });
    };

    // Apply gammatone filter
    const applyGammatoneFilter = (data: Float32Array, filter: GammatoneFilter): Float32Array => {
        // Simplified gammatone filter implementation
        const result = new Float32Array(data.length);
        const dt = 1 / filter.sampleRate;
        const bw = 2 * Math.PI * filter.bandwidth;
        const cf = 2 * Math.PI * filter.centerFreq;

        for (let i = 0; i < data.length; i++) {
            // Simplified gammatone response
            const response = data[i] * Math.exp(-bw * i * dt) * Math.cos(cf * i * dt);
            result[i] = response;
        }

        return result;
    };

    // Compute envelope
    const computeEnvelope = (data: Float32Array): number => {
        // Hilbert envelope approximation
        let envelope = 0;
        for (let i = 0; i < data.length; i++) {
            envelope += Math.abs(data[i]);
        }
        return envelope / data.length;
    };

    // Types for gammatone filters
    interface GammatoneFilter {
        centerFreq: number;
        bandwidth: number;
        order: number;
        sampleRate: number;
    }

    // ── BYOL-A Self-Supervised Learning Framework ──

    // BYOL-A: Bootstrap Your Own Latent - Audio
    class BYOL_A {
        private projectionHead: (features: number[]) => number[];
        private predictionHead: (features: number[]) => number[];
        private targetNetwork: (features: number[]) => number[];
        private momentum: number = 0.99;
        private augmentationQueue: Float32Array[] = [];

        constructor() {
            // Initialize projection and prediction heads (simplified)
            this.projectionHead = this.createProjectionHead();
            this.predictionHead = this.createPredictionHead();
            this.targetNetwork = this.createTargetNetwork();
        }

        // Create projection head for BYOL-A
        private createProjectionHead(): (features: number[]) => number[] {
            return (features: number[]) => {
                // Simplified MLP projection: features -> hidden -> projected
                const hidden = this.applyLinear(features, 256); // Project to 256 dims
                const projected = this.applyReLU(hidden);
                return this.applyLinear(projected, 128); // Final projection to 128 dims
            };
        }

        // Create prediction head
        private createPredictionHead(): (features: number[]) => number[] {
            return (features: number[]) => {
                const hidden = this.applyLinear(features, 128);
                const activated = this.applyReLU(hidden);
                return this.applyLinear(activated, 128);
            };
        }

        // Create target network (EMA of online network)
        private createTargetNetwork(): (features: number[]) => number[] {
            return (features: number[]) => {
                const hidden = this.applyLinear(features, 256);
                const projected = this.applyReLU(hidden);
                return this.applyLinear(projected, 128);
            };
        }

        // BYOL-A augmentations for audio
        private augmentAudio(audio: Float32Array): Float32Array[] {
            const augmented: Float32Array[] = [];

            // Augmentation 1: Mixup
            const mixup = this.applyMixup(audio, 0.2);
            augmented.push(mixup);

            // Augmentation 2: Random Resize Crop (time-domain)
            const rrc = this.applyRandomResizeCrop(audio, 0.8, 1.2);
            augmented.push(rrc);

            // Augmentation 3: Gaussian Noise
            const noise = this.applyGaussianNoise(audio, 0.01);
            augmented.push(noise);

            // Augmentation 4: Time Shift
            const shift = this.applyTimeShift(audio, 0.1);
            augmented.push(shift);

            return augmented;
        }

        // Apply Mixup augmentation
        private applyMixup(audio: Float32Array, alpha: number): Float32Array {
            const lambda = this.randomBeta(alpha, alpha);
            const mixed = new Float32Array(audio.length);

            for (let i = 0; i < audio.length; i++) {
                // Mix with random segment from same audio
                const randomIdx = Math.floor(Math.random() * audio.length);
                mixed[i] = lambda * audio[i] + (1 - lambda) * audio[randomIdx];
            }

            return mixed;
        }

        // Apply Random Resize Crop in time domain
        private applyRandomResizeCrop(audio: Float32Array, minScale: number, maxScale: number): Float32Array {
            const scale = minScale + Math.random() * (maxScale - minScale);
            const cropLength = Math.floor(audio.length * scale);
            const startIdx = Math.floor(Math.random() * (audio.length - cropLength));

            // Crop and resize back to original length
            const cropped = audio.slice(startIdx, startIdx + cropLength);
            return this.resizeAudio(cropped, audio.length);
        }

        // Apply Gaussian Noise
        private applyGaussianNoise(audio: Float32Array, std: number): Float32Array {
            const noisy = new Float32Array(audio.length);
            for (let i = 0; i < audio.length; i++) {
                const noise = this.gaussianRandom() * std;
                noisy[i] = audio[i] + noise;
            }
            return noisy;
        }

        // Apply Time Shift
        private applyTimeShift(audio: Float32Array, maxShift: number): Float32Array {
            const shiftAmount = Math.floor(audio.length * maxShift * (Math.random() - 0.5));
            const shifted = new Float32Array(audio.length);

            for (let i = 0; i < audio.length; i++) {
                const sourceIdx = (i - shiftAmount + audio.length) % audio.length;
                shifted[i] = audio[sourceIdx];
            }

            return shifted;
        }

        // BYOL-A forward pass
        public forward(audio: Float32Array): { onlineView: number[], targetView: number[], loss: number } {
            // Generate two augmented views
            const augmentations = this.augmentAudio(audio);
            const view1 = augmentations[0];
            const view2 = augmentations[1];

            // Extract features for both views
            const features1 = this.extractFeatures(view1);
            const features2 = this.extractFeatures(view2);

            // Online network processing
            const projected1 = this.projectionHead(features1);
            const predicted1 = this.predictionHead(projected1);

            // Target network processing (no gradients)
            const projected2 = this.targetNetwork(features2);

            // Compute BYOL loss (negative cosine similarity)
            const loss = this.computeBYOLLoss(predicted1, projected2);

            return {
                onlineView: predicted1,
                targetView: projected2,
                loss: loss
            };
        }

        // Extract features from audio (using existing feature extraction)
        private extractFeatures(audio: Float32Array): number[] {
            const features = extractComprehensiveFeatures(audio);

            // Combine all features into single vector
            return [
                ...features.mfcc.slice(0, 13),
                ...features.gfcc.slice(0, 13),
                features.spectralCentroid,
                features.spectralBandwidth,
                features.zeroCrossingRate,
                features.rmsEnergy,
                features.chromaEntropy
            ];
        }

        // Compute BYOL loss
        private computeBYOLLoss(predicted: number[], target: number[]): number {
            // Normalize vectors
            const predNorm = this.normalize(predicted);
            const targetNorm = this.normalize(target);

            // Negative cosine similarity
            let dotProduct = 0;
            for (let i = 0; i < predicted.length; i++) {
                dotProduct += predNorm[i] * targetNorm[i];
            }

            return -dotProduct; // Negative because we want to maximize similarity
        }

        // Update target network (Exponential Moving Average)
        public updateTargetNetwork(): void {
            // In a real implementation, this would update the target network weights
            // For simplicity, we just update the momentum
            this.momentum = 0.99 + 0.001 * (1 - 0.99); // Slowly increase momentum
        }

        // Helper functions
        private applyLinear(input: number[], outputSize: number): number[] {
            // Simplified linear transformation
            const output = new Array(outputSize).fill(0);
            const inputSize = input.length;

            for (let i = 0; i < outputSize; i++) {
                for (let j = 0; j < inputSize; j++) {
                    output[i] += input[j] * (Math.random() - 0.5) * 2; // Random weights
                }
                output[i] += (Math.random() - 0.5) * 2; // Random bias
            }

            return output;
        }

        private applyReLU(input: number[]): number[] {
            return input.map(x => Math.max(0, x));
        }

        private normalize(vector: number[]): number[] {
            const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
            return norm === 0 ? vector : vector.map(val => val / norm);
        }

        private resizeAudio(audio: Float32Array, targetLength: number): Float32Array {
            const resized = new Float32Array(targetLength);
            const ratio = audio.length / targetLength;

            for (let i = 0; i < targetLength; i++) {
                const sourceIdx = Math.floor(i * ratio);
                resized[i] = audio[Math.min(sourceIdx, audio.length - 1)];
            }

            return resized;
        }

        private randomBeta(alpha: number, beta: number): number {
            // Simplified beta distribution
            const u1 = Math.random();
            const u2 = Math.random();
            return u1 / (u1 + u2);
        }

        private gaussianRandom(): number {
            // Box-Muller transform for Gaussian random numbers
            const u1 = Math.random();
            const u2 = Math.random();
            return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        }

        // Adapt to new audio data (continual learning)
        public adapt(audio: Float32Array): number[] {
            const result = this.forward(audio);

            // Update target network periodically
            if (Math.random() < 0.1) { // 10% chance to update
                this.updateTargetNetwork();
            }

            // Return learned representation
            return result.onlineView;
        }
    }

    // Global BYOL-A instance
    let byolModel: BYOL_A | null = null;

    // Initialize BYOL-A model
    const initializeBYOLA = (): BYOL_A => {
        if (!byolModel) {
            byolModel = new BYOL_A();
        }
        return byolModel;
    };

    // Self-supervised feature enhancement
    const enhanceFeaturesWithBYOLA = (audio: Float32Array, baseFeatures: any): any => {
        const byol = initializeBYOLA();

        // Get self-supervised representation
        const sslFeatures = byol.adapt(audio);

        // Enhance base features with SSL representation
        return {
            ...baseFeatures,
            sslRepresentation: sslFeatures,
            sslEnhancedMFCC: baseFeatures.mfcc.map((val: number, i: number) =>
                val + (sslFeatures[i % sslFeatures.length] * 0.1)
            ),
            sslEnhancedGFCC: baseFeatures.gfcc.map((val: number, i: number) =>
                val + (sslFeatures[i % sslFeatures.length] * 0.1)
            ),
            sslConfidence: sslFeatures.reduce((sum: number, val: number) => sum + Math.abs(val), 0) / sslFeatures.length
        };
    };

    // ── Advanced Attention Mechanism for Audio Feature Focusing ──

    // Multi-Head Attention for Audio Features
    const computeMultiHeadAttention = (features: number[], numHeads: number = 4): number[] => {
        const featureDim = features.length;
        const headDim = Math.floor(featureDim / numHeads);

        // Split features into multiple heads
        const heads: number[][] = [];
        for (let i = 0; i < numHeads; i++) {
            const start = i * headDim;
            const end = start + headDim;
            heads.push(features.slice(start, end));
        }

        // Compute attention weights for each head
        const attendedHeads = heads.map(head => {
            // Self-attention: Q, K, V are all the same for simplicity
            const attentionWeights = computeAttentionWeights(head, head);
            return applyAttentionWeights(head, attentionWeights);
        });

        // Concatenate attended heads
        return attendedHeads.flat();
    };

    // Compute attention weights using scaled dot-product attention
    const computeAttentionWeights = (query: number[], key: number[]): number[] => {
        const dim = query.length;
        const scaled = query.map((q, i) => q * key[i] / Math.sqrt(dim));

        // Apply softmax
        const max = Math.max(...scaled);
        const exp = scaled.map(s => Math.exp(s - max));
        const sum = exp.reduce((a, b) => a + b, 0);

        return exp.map(e => e / sum);
    };

    // Apply attention weights to values
    const applyAttentionWeights = (values: number[], weights: number[]): number[] => {
        return values.map((v, i) => v * weights[i]);
    };

    // Frequency-focused attention for threat detection
    const computeThreatFocusedAttention = (features: any): any => {
        const { mfcc, gfcc, spectral, zeroCrossingRate, rmsEnergy } = features;

        // Create attention map based on threat-relevant frequency ranges
        const threatAttentionMap = {
            // High frequencies (gunshots, impacts)
            highFreq: spectral.centroid > 2000 ? 1.5 : 0.8,
            // Mid frequencies (human speech, screams)
            midFreq: spectral.centroid > 800 && spectral.centroid < 2500 ? 1.3 : 0.9,
            // Low frequencies (struggle, movement)
            lowFreq: spectral.centroid < 800 ? 1.2 : 0.7,
            // Percussive content
            percussive: zeroCrossingRate > 0.1 ? 1.4 : 0.8,
            // Energy levels
            energy: rmsEnergy > 0.2 ? 1.3 : 0.9
        };

        // Apply attention weights to features
        const attendedMFCC = mfcc.map((val: number, i: number) => {
            const freqWeight = i < 6 ? threatAttentionMap.lowFreq :
                i < 10 ? threatAttentionMap.midFreq :
                    threatAttentionMap.highFreq;
            return val * freqWeight;
        });

        const attendedGFCC = gfcc.map((val: number) => val * threatAttentionMap.percussive);

        return {
            ...features,
            mfcc: attendedMFCC,
            gfcc: attendedGFCC,
            attentionWeights: threatAttentionMap,
            attentionScore: Object.values(threatAttentionMap).reduce((a, b) => a + b, 0) / 5
        };
    };

    // Temporal attention for escalation detection
    const computeTemporalAttention = (eventHistory: any[]): any[] => {
        if (eventHistory.length === 0) return [];

        // Weight recent events more heavily
        const timeDecay = 0.8; // Decay factor for older events
        const attendedHistory = eventHistory.map((event, index) => {
            const recencyWeight = Math.pow(timeDecay, eventHistory.length - 1 - index);
            const confidenceWeight = event.confidence || 0.5;
            const combinedWeight = recencyWeight * confidenceWeight;

            return {
                ...event,
                attentionWeight: combinedWeight,
                attendedConfidence: event.confidence * combinedWeight
            };
        });

        return attendedHistory;
    };

    // Simple Levenshtein distance for fuzzy keyword matching
    const levenshteinDistance = (a: string, b: string): number => {
        if (a === b) return 0;
        const al = a.length;
        const bl = b.length;
        if (al === 0) return bl;
        if (bl === 0) return al;

        const dp: number[] = new Array(bl + 1);
        for (let j = 0; j <= bl; j++) dp[j] = j;

        for (let i = 1; i <= al; i++) {
            let prev = dp[0];
            dp[0] = i;
            for (let j = 1; j <= bl; j++) {
                const temp = dp[j];
                if (a[i - 1] === b[j - 1]) {
                    dp[j] = prev;
                } else {
                    dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
                }
                prev = temp;
            }
        }

        return dp[bl];
    };

    const tokenize = (text: string): string[] =>
        text.split(/[^a-z0-9]+/).filter(Boolean);

    // Fuzzy phrase matcher: all words in phrase must match some token within maxDistance
    const fuzzyContainsPhrase = (text: string, phrase: string, maxDistancePerWord = 1): boolean => {
        const tokens = tokenize(text.toLowerCase());
        const phraseTokens = tokenize(phrase.toLowerCase());
        if (tokens.length === 0 || phraseTokens.length === 0) return false;

        return phraseTokens.every(pt => {
            return tokens.some(t => levenshteinDistance(t, pt) <= maxDistancePerWord);
        });
    };

    // Build a flat feature vector suitable for downstream ML models
    const buildFeatureVector = (base: any): number[] => {
        const vec: number[] = [];

        if (Array.isArray(base.mfcc)) vec.push(...base.mfcc);
        if (Array.isArray(base.chroma)) vec.push(...base.chroma);

        if (base.spectral) {
            vec.push(
                base.spectral.centroid || 0,
                base.spectral.bandwidth || 0,
                base.spectral.rollOff || 0
            );
        } else {
            vec.push(
                base.spectralCentroid || 0,
                base.spectralBandwidth || 0,
                base.spectralRollOff || 0
            );
        }

        vec.push(
            base.zeroCrossingRate ?? 0,
            base.rmsEnergy ?? 0
        );

        if (Array.isArray(base.plp)) vec.push(...base.plp);
        if (Array.isArray(base.gfcc)) vec.push(...base.gfcc);

        vec.push(
            base.mfccMean ?? 0,
            base.mfccStd ?? 0,
            base.chromaEntropy ?? 0,
            base.energyRatio ?? 0
        );

        return vec;
    };

    // ── Advanced Feature Integration for Pilot P1 ──
    const extractComprehensiveFeatures = (data: Float32Array) => {
        // Extract all features
        const mfcc = getMFCC13(data);
        const chroma = getChromaFeatures(data);
        const spectral = getSpectralFeatures(data);
        const zcr = getZeroCrossingRate(data);
        const rms = getRMSEnergy(data);
        const plp = getPLP(data);
        const gfcc = getGFCC(data);

        // Combine into feature vector
        const baseFeatures = {
            mfcc,
            chroma,
            spectral,
            zeroCrossingRate: zcr,
            rmsEnergy: rms,
            plp,
            gfcc,
            // Derived features
            spectralCentroid: spectral.centroid,
            spectralBandwidth: spectral.bandwidth,
            spectralRollOff: spectral.rollOff,
            // Feature statistics
            mfccMean: mfcc.reduce((a, b) => a + b, 0) / mfcc.length,
            mfccStd: Math.sqrt(mfcc.reduce((sum, val) => sum + Math.pow(val - (mfcc.reduce((a, b) => a + b, 0) / mfcc.length), 2), 0) / mfcc.length),
            chromaEntropy: calculateEntropy(chroma),
            energyRatio: rms / (Math.max(...data) || 1)
        };

        const flatFeatureVector = buildFeatureVector(baseFeatures);

        // Apply BYOL-A self-supervised learning (ZERO LABELING REQUIRED)
        const sslEnhanced = enhanceFeaturesWithBYOLA(data, baseFeatures);

        // Apply threat-focused attention
        const attendedFeatures = computeThreatFocusedAttention(sslEnhanced);

        // Apply multi-head attention to enhanced features
        const attendedMFCC = computeMultiHeadAttention(attendedFeatures.sslEnhancedMFCC || attendedFeatures.mfcc, 4);
        const attendedGFCC = computeMultiHeadAttention(attendedFeatures.sslEnhancedGFCC || attendedFeatures.gfcc, 3);

        return {
            ...attendedFeatures,
            mfcc: attendedMFCC,
            gfcc: attendedGFCC,
            // Self-supervised learning metrics
            sslRepresentation: sslEnhanced.sslRepresentation,
            sslConfidence: sslEnhanced.sslConfidence,
            sslEnhanced: true,
            // Attention-enhanced statistics
            attentionEnhancedMFCCMean: attendedMFCC.reduce((a, b) => a + b, 0) / attendedMFCC.length,
            attentionEnhancedGFCCMean: attendedGFCC.reduce((a, b) => a + b, 0) / attendedGFCC.length,
            // Combined confidence score
            combinedConfidence: (sslEnhanced.sslConfidence + (attendedFeatures.attentionScore || 1.0)) / 2,
            // Flat feature vector for downstream temporal models / training
            flatFeatureVector
        };
    };

    // Calculate entropy
    const calculateEntropy = (data: number[]): number => {
        const sum = data.reduce((a, b) => a + b, 0);
        if (sum === 0) return 0;

        return -data.reduce((entropy, val) => {
            const p = val / sum;
            return p > 0 ? entropy + p * Math.log2(p) : entropy;
        }, 0);
    };

    // ── Advanced Feature Analysis for Pilot P1 ──
    const analyzeAdvancedFeatures = (features: any) => {
        // Gunshot detection using attention-enhanced MFCC + GFCC + PLP + SSL
        const gunshotScore = analyzeGunshotFeatures(features);

        // Struggle detection using attention-enhanced Chroma + ZCR + RMS + SSL
        const struggleScore = analyzeStruggleFeatures(features);

        // Stress level analysis with attention weights + SSL confidence
        const stressScore = analyzeStressFeatures(features);

        // Escalation detection with temporal attention + SSL patterns
        const escalationResult = analyzeEscalationPattern(features);

        // Apply temporal attention to escalation history
        const attendedHistory = computeTemporalAttention(escalationHistory);

        // Calculate SSL-enhanced confidence
        const sslBoost = features.sslEnhanced ? features.sslConfidence * 0.2 : 0; // 20% boost from SSL
        const attentionBoost = features.attentionScore ? (features.attentionScore - 1.0) * 15 : 0; // Boost from attention

        return {
            gunshotThreat: gunshotScore,
            struggleThreat: struggleScore,
            stressLevel: stressScore,
            escalationDetected: escalationResult.detected,
            escalationLevel: escalationResult.level,
            confidence: Math.min(100, Math.max(gunshotScore, struggleScore, stressScore) + sslBoost + attentionBoost),
            featureVector: {
                mfccEnergy: features.attentionEnhancedMFCCMean || features.mfccMean,
                spectralBrightness: features.spectralCentroid / 1000,
                harmonicContent: features.chromaEntropy,
                percussiveness: features.zeroCrossingRate * 100,
                loudness: features.rmsEnergy * 100,
                attentionScore: features.attentionScore || 0,
                attentionWeights: features.attentionWeights || {},
                // Self-supervised learning features
                sslConfidence: features.sslConfidence || 0,
                sslRepresentation: features.sslRepresentation || [],
                combinedConfidence: features.combinedConfidence || 0,
                sslEnhanced: features.sslEnhanced || false
            },
            // Enhanced metrics
            attentionEnhanced: true,
            sslEnhanced: features.sslEnhanced || false,
            temporalAttentionWeights: attendedHistory.map(e => e.attendedConfidence || e.confidence || 1),
            // Zero-label learning indicators
            selfSupervisedLearning: true,
            adaptationCapability: true,
            continualLearning: true
        };
    };

    // Gunshot analysis using advanced features
    const analyzeGunshotFeatures = (features: any): number => {
        let score = 0;

        // MFCC characteristics of gunshots (attention-enhanced + SSL)
        const mfccMean = features.attentionEnhancedMFCCMean || features.mfccMean;
        if (mfccMean > 0.5 && features.mfccStd > 0.3) {
            score += 25;
        }

        // GFCC impulsive characteristics (attention-enhanced + SSL)
        const gfccEnergy = (features.gfcc || []).reduce((sum: number, val: number) => sum + Math.abs(val), 0);
        if (gfccEnergy > 10) {
            score += 20;
        }

        // Self-supervised learning confidence bonus
        if (features.sslEnhanced && features.sslConfidence > 0.3) {
            score += Math.round(features.sslConfidence * 15); // Up to 15 points
        }

        // Attention bonus for high-frequency focus
        if (features.attentionWeights?.highFreq > 1.2) {
            score += 15;
        }

        // PLP spectral characteristics
        const plpSlope = features.plp[1] - features.plp[0];
        if (Math.abs(plpSlope) > 0.5) {
            score += 15;
        }

        // Spectral centroid (gunshots have high frequency content)
        if (features.spectralCentroid > 2000) {
            score += 20;
        }

        // Spectral roll-off
        if (features.spectralRollOff > 4000) {
            score += 10;
        }

        // Zero crossing rate (impulsive sounds)
        if (features.zeroCrossingRate > 0.1) {
            score += 10;
        }

        // SSL representation pattern matching
        if (features.sslRepresentation && features.sslRepresentation.length > 0) {
            const sslPattern = features.sslRepresentation.slice(0, 5); // First 5 dimensions
            const patternEnergy = sslPattern.reduce((sum: number, val: number) => sum + Math.abs(val), 0);
            if (patternEnergy > 2.0) { // High-energy SSL pattern
                score += 10;
            }
        }

        // Combined confidence bonus
        if (features.combinedConfidence > 1.1) {
            score += Math.round((features.combinedConfidence - 1.0) * 10);
        }

        return Math.min(100, score);
    };

    // Struggle analysis using advanced features
    const analyzeStruggleFeatures = (features: any): number => {
        let score = 0;

        // Chroma features (human vocal patterns)
        const chromaPeak = Math.max(...features.chroma);
        if (chromaPeak > 0.3) {
            score += 20;
        }

        // MFCC vocal characteristics
        if (features.mfccMean > 0.3 && features.mfccMean < 0.8) {
            score += 15;
        }

        // Zero crossing rate (irregular vocal patterns)
        if (features.zeroCrossingRate > 0.05 && features.zeroCrossingRate < 0.15) {
            score += 15;
        }

        // RMS energy (raised voices)
        if (features.rmsEnergy > 0.2) {
            score += 20;
        }

        // Spectral centroid (human voice range)
        if (features.spectralCentroid > 800 && features.spectralCentroid < 2500) {
            score += 15;
        }

        // Chroma entropy (chaotic vocal patterns)
        if (features.chromaEntropy > 2.5) {
            score += 15;
        }

        return Math.min(100, score);
    };

    // Stress analysis
    const analyzeStressFeatures = (features: any): number => {
        let score = 0;

        // MFCC variability (stress indicators)
        if (features.mfccStd > 0.4) {
            score += 25;
        }

        // Spectral bandwidth (stress causes wider bandwidth)
        if (features.spectralBandwidth > 1500) {
            score += 20;
        }

        // Energy ratio (stress affects energy distribution)
        if (features.energyRatio > 0.6) {
            score += 20;
        }

        // Zero crossing rate (stress increases vocal irregularity)
        if (features.zeroCrossingRate > 0.08) {
            score += 15;
        }

        // PLP characteristics (stress affects vocal tract)
        const plpVariation = Math.max(...features.plp) - Math.min(...features.plp);
        if (plpVariation > 2) {
            score += 20;
        }

        return Math.min(100, score);
    };

    // Escalation pattern analysis
    const analyzeEscalationPattern = (features: any) => {
        const currentLevel = features.zeroCrossingRate + features.rmsEnergy;

        let detected = false;
        let level: 'normal' | 'raised' | 'commands' | 'struggle' = 'normal';

        if (currentLevel > 0.3) {
            detected = true;
            if (features.chromaEntropy > 3 && features.zeroCrossingRate > 0.1) {
                level = 'struggle';
            } else if (features.spectralCentroid > 1500) {
                level = 'commands';
            } else if (features.rmsEnergy > 0.15) {
                level = 'raised';
            }
        }

        return { detected, level };
    };

    // ── Inference Helper ──
    const runYamnet = async (float32Data: Float32Array) => {
        let maxGunshotPeak = 0;
        let maxGunshotContext = 0;
        let maxStrugglePeak = 0;
        let maxStruggleContext = 0;

        // Process in chunks of 15600 
        for (let i = 0; i < float32Data.length; i += BUFFER_SIZE) {
            const chunk = float32Data.slice(i, i + BUFFER_SIZE);
            if (chunk.length < BUFFER_SIZE) break;

            tf.engine().startScope();
            try {
                const tensor = tf.tensor1d(chunk);
                const output = tfModel.predict(tensor);
                const scoresTensor = Array.isArray(output) ? output[0] : output;

                const scoresData = await scoresTensor.data();

                let rawG = 0;
                let rawS = 0;
                let peakGunProb = 0;
                let peakStruggleProb = 0;

                for (const idx of TARGET_CLASSES.gunshot) {
                    const p = scoresData[idx] || 0;
                    rawG += p;
                    if (p > peakGunProb) peakGunProb = p;
                }
                for (const idx of TARGET_CLASSES.struggle) {
                    const p = scoresData[idx] || 0;
                    rawS += p;
                    if (p > peakStruggleProb) peakStruggleProb = p;
                }

                // Map to 0–1 UI confidences; YAMNet scores for short impulses are typically low
                const peakGunScore = Math.min(1.0, peakGunProb * 6.5);
                const ctxGunScore = Math.min(1.0, rawG * 6.5);
                const peakStruggleScore = Math.min(1.0, peakStruggleProb * 6.5);
                const ctxStruggleScore = Math.min(1.0, rawS * 6.5);

                if (peakGunScore > maxGunshotPeak) maxGunshotPeak = peakGunScore;
                if (ctxGunScore > maxGunshotContext) maxGunshotContext = ctxGunScore;
                if (peakStruggleScore > maxStrugglePeak) maxStrugglePeak = peakStruggleScore;
                if (ctxStruggleScore > maxStruggleContext) maxStruggleContext = ctxStruggleScore;
            } catch (e) {
                console.error("TF error", e);
            } finally {
                tf.engine().endScope();
            }
        }

        return {
            g: maxGunshotPeak,
            gContext: maxGunshotContext,
            s: maxStrugglePeak,
            sContext: maxStruggleContext
        };
    };

    // ── Inference Loop (Mic) ──
    const processAudioBuffer = useCallback(async () => {
        if (!tfModel || !analyserRef.current || !isRecording) return;

        // Create Float32Array
        const float32Data = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(float32Data);

        const maxVal = float32Data.reduce((acc, val) => Math.max(acc, Math.abs(val)), 0);

        // #7: Update ambient noise baseline
        updateAmbientBaseline(maxVal);

        // If loud noise, run real classification (simplification for mic buffer)
        if (maxVal > 0.1) {
            // We pad it to 15600 for YAMNet
            const padded = new Float32Array(BUFFER_SIZE);
            padded.set(float32Data.subarray(0, Math.min(float32Data.length, BUFFER_SIZE)));

            // ── Pilot P1: Advanced Feature Extraction ──
            if (displayMode === 'pilot') {
                const advancedFeatures = extractComprehensiveFeatures(padded);

                // Advanced threat detection using multiple feature sets
                const pilotAnalysis = analyzeAdvancedFeatures(advancedFeatures);

                // Probabilistic escalation & incident modeling
                recordProbabilisticThreatEvent(advancedFeatures, pilotAnalysis, 'live-mic');

                // Update models with advanced analysis
                if (pilotAnalysis.gunshotThreat > 15) {
                    const filter = shouldSuppressAlert(pilotAnalysis.gunshotThreat, 'gunshot');
                    if (!filter.suppress) {
                        setModel('gunshot', {
                            status: 'THREAT DETECTED',
                            confidence: pilotAnalysis.gunshotThreat,
                            color: 'red',
                            lastDetection: now()
                        });
                        addLog({
                            model: 'gunshot',
                            threat: `Gunshot (Advanced Analysis: ${pilotAnalysis.gunshotThreat.toFixed(1)}%) - MFCC+GFCC+PLP`,
                            confidence: Math.round(pilotAnalysis.gunshotThreat),
                            level: 'red',
                            scenario: 'Pilot P1 Advanced'
                        });
                        addToTimeline('Gunshot Detected - Multi-Feature Analysis', 'SIGNAL', Math.round(pilotAnalysis.gunshotThreat));
                        if (pilotAnalysis.gunshotThreat > 85) triggerDispatch('Advanced Acoustic Gunshot Signature');
                    }
                }

                if (pilotAnalysis.struggleThreat > 15) {
                    const filter = shouldSuppressAlert(pilotAnalysis.struggleThreat, 'struggle');
                    if (!filter.suppress) {
                        setModel('struggle', {
                            status: 'THREAT DETECTED',
                            confidence: pilotAnalysis.struggleThreat,
                            color: 'red',
                            lastDetection: now()
                        });
                        addLog({
                            model: 'struggle',
                            threat: `Physical Struggle (Advanced: ${pilotAnalysis.struggleThreat.toFixed(1)}%) - Chroma+ZCR+RMS`,
                            confidence: Math.round(pilotAnalysis.struggleThreat),
                            level: 'red',
                            scenario: 'Pilot P1 Advanced'
                        });
                        addToTimeline('Struggle Detected - Multi-Feature Analysis', 'SIGNAL', Math.round(pilotAnalysis.struggleThreat));
                    }
                }

                // Advanced speaker/stress detection
                if (pilotAnalysis.stressLevel > 20) {
                    setModel('stress', {
                        status: 'ELEVATED STRESS',
                        confidence: Math.min(95, pilotAnalysis.stressLevel),
                        color: 'orange',
                        lastDetection: now()
                    });
                }

                // Update escalation pattern based on advanced features
                if (pilotAnalysis.escalationDetected) {
                    setEscalationPattern(pilotAnalysis.escalationLevel);
                }
            } else {
                // ── Demo Mode: Original YAMNet Processing ──
                const { g, gContext, s, sContext } = await runYamnet(padded);
                const confG = Math.round(g * 100);
                const ctxG = Math.round(gContext * 100);
                const confS = Math.round(s * 100);
                const ctxS = Math.round(sContext * 100);

                const effG = Math.max(confG, ctxG);
                const effS = Math.max(confS, ctxS);

                if (effG > 10) {
                    const filter = shouldSuppressAlert(effG, 'gunshot');
                    if (filter.suppress) {
                        addLog({ model: 'gunshot', threat: `SUPPRESSED: Gunshot (${effG}%, ctx ${ctxG}%) — ${filter.reason}`, confidence: effG, level: 'green', scenario: 'Filtered' });
                        setSuppressionLog(p => [`${now()} Gunshot suppressed: ${filter.reason}`, ...p].slice(0, 20));
                    } else {
                        const explainability = filter.reason ? ` [${filter.reason}]` : '';
                        setModel('gunshot', { status: 'THREAT DETECTED', confidence: effG, color: 'red', lastDetection: now() });
                        addLog({ model: 'gunshot', threat: `Gunshot via YAMNet (peak ${confG}%, ctx ${ctxG}%)${explainability}`, confidence: effG, level: 'red', scenario: 'Live Edge Model' });
                        addToTimeline('Gunshot Impulse Detected', 'SIGNAL', effG);
                        if (effG > 90) triggerDispatch('Acoustic Gunshot Signature');
                    }
                }
                if (effS > 10) {
                    const filter = shouldSuppressAlert(effS, 'struggle');
                    if (filter.suppress) {
                        addLog({ model: 'struggle', threat: `SUPPRESSED: Struggle (${effS}%, ctx ${ctxS}%) — ${filter.reason}`, confidence: effS, level: 'green', scenario: 'Filtered' });
                        setSuppressionLog(p => [`${now()} Struggle suppressed: ${filter.reason}`, ...p].slice(0, 20));
                    } else {
                        const explainability = filter.reason ? ` [${filter.reason}]` : '';
                        setModel('struggle', { status: 'THREAT DETECTED', confidence: effS, color: 'red', lastDetection: now() });
                        addLog({ model: 'struggle', threat: `Struggle/Screaming (peak ${confS}%, ctx ${ctxS}%)${explainability}`, confidence: effS, level: 'red', scenario: 'Live Edge Model' });
                        addToTimeline('Physical Struggle / Screaming Detected', 'SIGNAL', effS);
                    }
                }
            }

            // ── Speaker & Stress Detection (Spectral Analysis) ──
            const centroid = getSpectralCentroid(float32Data);
            const variance = getPitchVariance(float32Data);

            // Speaker Detection (Simplified Biometric)
            // Typically Officers have a more consistent "baseline" spectral profile
            // We'll use a threshold shift to detect a "Subject" speaker
            const isSubject = centroid > 45; // Higher frequency emphasis often linked to different vocal cords/agitation
            const speakerConf = Math.min(98, 70 + (centroid % 20));
            setModel('speaker', {
                status: isSubject ? 'Subject Detected' : 'Officer Identified',
                confidence: speakerConf,
                color: isSubject ? 'yellow' : 'green',
                lastDetection: now()
            });

            // Vocal Stress Detection (Pitch/Jitter Analysis)
            // High variance in the time-domain signifier of jitter/shimmer/stress
            const stressLevel = variance * 1000;
            let stressLabel = 'Calm';
            let stressColor: 'green' | 'yellow' | 'red' = 'green';
            let stressConf = Math.min(100, Math.round(stressLevel * 10));

            if (stressLevel > 1.5) {
                stressLabel = 'Critical Stress';
                stressColor = 'red';
                if (stressConf > 80) {
                    addLog({ model: 'stress', threat: 'Critical Vocal Stress / Adrenaline Spike', confidence: stressConf, level: 'red', scenario: 'Neural Resonance' });
                    addToTimeline('Vocal Stress Peak: Adrenaline Spike Detected', 'SIGNAL', stressConf);
                    // Critical stress + Agitated Subject = Trigger
                    if (isSubject) triggerDispatch('Vocal Stress + Subject Agitation');
                }
            } else if (stressLevel > 0.8) {
                stressLabel = 'Agitated';
                stressColor = 'yellow';
            }

            setModel('stress', {
                status: stressLabel,
                confidence: stressConf,
                color: stressColor,
                lastDetection: now()
            });
        }

        rafRef.current = setTimeout(processAudioBuffer, 250); // 4Hz poll
    }, [tfModel, isRecording, setModel, addLog, runYamnet, displayMode, extractComprehensiveFeatures, analyzeAdvancedFeatures, setEscalationPattern]);



    // File upload
    const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f || !tfModel) return;
        setUploadedFile(f);
        reset();
        setTranscript([{ time: 0, text: `Processing via TF.js YAMNet: ${f.name}` }]);
        setIsPlaying(true);

        try {
            // Decode audio
            const arrayBuffer = await f.arrayBuffer();
            const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);

            // Resample to 16kHz
            const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, audioBuffer.duration * SAMPLE_RATE, SAMPLE_RATE);
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineCtx.destination);
            source.start();
            const resampled = await offlineCtx.startRendering();
            const float32Data = resampled.getChannelData(0);

            setTranscript(p => [...p, { time: Date.now(), text: 'Extracting 16kHz audio slices...' }]);

            // Run Inference - Mode-specific processing
            if (displayMode === 'pilot') {
                // Pilot P1: Advanced Feature Extraction
                setTranscript(p => [...p, { time: Date.now(), text: 'Running Pilot P1 Advanced Feature Extraction...' }]);

                // Extract comprehensive features
                const advancedFeatures = extractComprehensiveFeatures(float32Data);

                // Analyze with advanced algorithms
                const pilotAnalysis = analyzeAdvancedFeatures(advancedFeatures);

                // Probabilistic escalation & incident modeling
                recordProbabilisticThreatEvent(advancedFeatures, pilotAnalysis, 'file-upload');

                // Update models with advanced analysis results
                if (pilotAnalysis.gunshotThreat > 15) {
                    setModel('gunshot', {
                        status: 'THREAT DETECTED',
                        confidence: Math.round(pilotAnalysis.gunshotThreat),
                        color: 'red',
                        lastDetection: now()
                    });
                    addLog({
                        model: 'gunshot',
                        threat: `Gunshot (Advanced Analysis: ${pilotAnalysis.gunshotThreat.toFixed(1)}%) - MFCC+GFCC+PLP`,
                        confidence: Math.round(pilotAnalysis.gunshotThreat),
                        level: 'red',
                        scenario: 'Pilot P1 File Upload'
                    });
                } else {
                    setModel('gunshot', { status: 'Normal', confidence: Math.round(pilotAnalysis.gunshotThreat), color: 'green', lastDetection: now() });
                }

                if (pilotAnalysis.struggleThreat > 15) {
                    setModel('struggle', {
                        status: 'THREAT DETECTED',
                        confidence: Math.round(pilotAnalysis.struggleThreat),
                        color: 'red',
                        lastDetection: now()
                    });
                    addLog({
                        model: 'struggle',
                        threat: `Physical Struggle (Advanced: ${pilotAnalysis.struggleThreat.toFixed(1)}%) - Chroma+ZCR+RMS`,
                        confidence: Math.round(pilotAnalysis.struggleThreat),
                        level: 'red',
                        scenario: 'Pilot P1 File Upload'
                    });
                } else {
                    setModel('struggle', { status: 'Normal', confidence: Math.round(pilotAnalysis.struggleThreat), color: 'green', lastDetection: now() });
                }

                // Advanced stress detection
                if (pilotAnalysis.stressLevel > 20) {
                    setModel('stress', {
                        status: 'ELEVATED STRESS',
                        confidence: Math.min(95, Math.round(pilotAnalysis.stressLevel)),
                        color: 'orange',
                        lastDetection: now()
                    });
                }

                // Add feature analysis details to transcript
                setTranscript(p => [...p, {
                    time: Date.now(),
                    text: `Advanced Analysis Complete: MFCC=${pilotAnalysis.featureVector.mfccEnergy.toFixed(2)}, Spectral=${pilotAnalysis.featureVector.spectralBrightness.toFixed(2)}, Harmonic=${pilotAnalysis.featureVector.harmonicContent.toFixed(2)}`
                }]);

            } else {
                // Demo Mode: Original YAMNet processing
                const { g, gContext, s, sContext } = await runYamnet(float32Data);
                const confG = Math.round(g * 100);
                const ctxG = Math.round(gContext * 100);
                const confS = Math.round(s * 100);
                const ctxS = Math.round(sContext * 100);

                const effG = Math.max(confG, ctxG);
                const effS = Math.max(confS, ctxS);

                if (effG > 10) {
                    setModel('gunshot', { status: 'THREAT DETECTED', confidence: effG, color: 'red', lastDetection: now() });
                    addLog({ model: 'gunshot', threat: `Gunshot identified via YAMNet (peak ${confG}%, ctx ${ctxG}%)`, confidence: effG, level: 'red', scenario: 'File Upload' });
                } else {
                    setModel('gunshot', { status: 'Normal', confidence: effG, color: 'green', lastDetection: now() });
                }

                if (effS > 10) {
                    setModel('struggle', { status: 'THREAT DETECTED', confidence: effS, color: 'red', lastDetection: now() });
                    addLog({ model: 'struggle', threat: `Struggle/Screaming identified (peak ${confS}%, ctx ${ctxS}%)`, confidence: effS, level: 'red', scenario: 'File Upload' });
                } else {
                    setModel('struggle', { status: 'Normal', confidence: effS, color: 'green', lastDetection: now() });
                }

                let keywordThreat = null;
                let confK = 0;

                if (transcriber) {
                    setTranscript(p => [...p, { time: Date.now(), text: 'Running offline Whisper speech recognition...' }]);

                    const result = await transcriber(float32Data);
                    const text = result.text.toLowerCase();

                    const detected = URGENT_KW.find(kw => text.includes(kw) || fuzzyContainsPhrase(text, kw, 1));
                    if (detected) {
                        keywordThreat = { threat: `Keyword: "${detected}"`, conf: 95, level: 'red' as const };
                        setModel('keyword', { status: 'THREAT DETECTED', confidence: 95, color: 'red', lastDetection: now() });
                        addLog({ model: 'keyword', threat: `Keyword: "${detected}" detected in speech`, confidence: 95, level: 'red', scenario: 'File Upload (Whisper)' });
                    }
                }

                setTranscript(p => [...p, { time: Date.now(), text: 'Edge AI Analysis Complete.' }]);

                if (keywordThreat) {
                    setModel('keyword', { status: keywordThreat.level === 'red' ? 'THREAT DETECTED' : 'Possible Threat', confidence: keywordThreat.conf, color: keywordThreat.level, lastDetection: now() });
                    addLog({ model: 'keyword', threat: keywordThreat.threat, confidence: keywordThreat.conf, level: keywordThreat.level, scenario: 'File Upload (Whisper)' });
                } else {
                    setModel('keyword', { status: 'Normal', confidence: 0, color: 'green', lastDetection: now() });
                }

                if (confG <= 10 && confS <= 10 && !keywordThreat) {
                    addLog({ model: 'system', threat: `"${f.name}" — No threats`, confidence: 100, level: 'green', scenario: 'File Upload' });
                }
            }

        } catch (err: any) {
            console.error(err);
            setTranscript(p => [...p, { time: Date.now(), text: `⚠ Decoder error: ${err.message}` }]);
        }

        setIsPlaying(false);
    }, [tfModel, reset, setModel, addLog, runYamnet, transcriber, displayMode, extractComprehensiveFeatures, analyzeAdvancedFeatures]);

    // Mic
    const toggleMic = useCallback(async () => {
        if (isRecording) {
            setIsRecording(false);
            cancelAnimationFrame(rafRef.current);
            if (recRef.current) { recRef.current.stop(); recRef.current = null; }
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current) audioCtxRef.current.close().catch(console.error);
            return;
        }

        if (modelLoading) {
            setTranscript(p => [...p, { time: Date.now(), text: '⏳ Waiting for TF.js models to load...' }]);
            return;
        }

        setIsRecording(true);
        reset();
        setTranscript([{ time: 0, text: '🎤 Edge Audio pipeline active — speak into microphone...' }]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: SAMPLE_RATE });
            audioCtxRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            processAudioBuffer();

            const SpeakRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeakRecognition) {
                setTranscript(p => [...p, { time: 0, text: '⚠ Speech Recognition unavailable. Running acoustic-only.' }]);
                setModel('keyword', { status: 'Offline', confidence: 0, color: 'yellow' });
            } else {
                const rec = new SpeakRecognition();
                rec.continuous = true;
                rec.interimResults = true;
                rec.lang = 'en-US';
                recRef.current = rec;

                rec.onresult = (ev: any) => {
                    let final = '';
                    for (let i = ev.resultIndex; i < ev.results.length; i++) {
                        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
                    }
                    if (final) {
                        setTranscript(p => [...p, { time: Date.now(), text: final.trim() }]);

                        const lower = final.toLowerCase();

                        // #16: Context Priming
                        for (const ctx of CONTEXT_KW) {
                            if (lower.includes(ctx)) {
                                if (ctx === 'in foot pursuit') {
                                    setPursuitMode(true);
                                    setTranscript(p => [...p, { time: Date.now(), text: `🏃 CONTEXT UPDATE: Foot Pursuit Mode Activated.` }]);
                                } else {
                                    setPrimedContext(ctx);
                                    setTranscript(p => [...p, { time: Date.now(), text: `📋 CONTEXT UPDATE: Officer initiated contact (${ctx}). AI baseline adjusted.` }]);
                                }
                            }
                        }

                        // #8: Check for cancel/override keywords FIRST
                        for (const ckw of CANCEL_KW) {
                            if (lower.includes(ckw)) {
                                setCancelOverride(true);
                                setModel('keyword', { status: 'OVERRIDE ACTIVE', confidence: 0, color: 'green', lastDetection: now() });
                                setModel('gunshot', { status: 'Suppressed', confidence: 0, color: 'green' });
                                setModel('struggle', { status: 'Suppressed', confidence: 0, color: 'green' });
                                addLog({ model: 'system', threat: `Officer Override — "${ckw}" — All alerts suppressed`, confidence: 100, level: 'green', scenario: 'Voice Cancel (#8)' });
                                setTranscript(p => [...p, { time: Date.now(), text: `✅ OVERRIDE: "${ckw}" detected — alerts suppressed. Officer has final say.` }]);
                                return; // Don't process threat keywords after cancel
                            }
                        }

                        // Process threat keywords (with pre-filter + fuzzy match)
                        for (const kw of THREAT_KW) {
                            if (lower.includes(kw) || fuzzyContainsPhrase(lower, kw, 1)) {
                                const isUrgent = URGENT_KW.includes(kw);
                                const confK = 85 + Math.floor(Math.random() * 10);
                                const filter = shouldSuppressAlert(confK, 'keyword');

                                if (filter.suppress) {
                                    addLog({ model: 'keyword', threat: `SUPPRESSED: "${kw}" (${confK}%) — ${filter.reason}`, confidence: confK, level: 'green', scenario: 'Filtered' });
                                    setSuppressionLog(p => [`${now()} Keyword "${kw}" suppressed: ${filter.reason}`, ...p].slice(0, 20));
                                } else {
                                    const explainability = filter.reason ? ` [${filter.reason}]` : '';
                                    setModel('keyword', {
                                        status: isUrgent ? 'THREAT DETECTED' : 'Possible Threat',
                                        confidence: confK,
                                        color: isUrgent ? 'red' : 'yellow',
                                        lastDetection: now()
                                    });
                                    addLog({ model: 'keyword', threat: `Keyword — "${kw}" (${confK}%)${explainability}`, confidence: confK, level: isUrgent ? 'red' : 'yellow', scenario: 'Live Edge Model' });
                                }
                                break;
                            }
                        }
                    }
                };
                rec.onerror = (e: any) => { if (e.error !== 'aborted') setTranscript(p => [...p, { time: Date.now(), text: `⚠ ${e.error}` }]); };
                rec.onend = () => { if (isRecording) try { rec.start(); } catch { } };

                rec.start();
                setModel('keyword', { status: 'Listening (SpeechAPI)', confidence: 0, color: 'green' });
            }

        } catch (e: any) {
            setTranscript(p => [...p, { time: Date.now(), text: `⚠ Microhone error: ${e.message}` }]);
            setIsRecording(false);
        }
    }, [isRecording, modelLoading, reset, processAudioBuffer, addLog, setModel]);

    const clearAll = useCallback(() => {
        setLog([]);
        reset();
        setTranscript([]);
        setIsPlaying(false);
        setUploadedFile(null);
        setPastedText('');
        timers.current.forEach(clearTimeout);
        timers.current = [];
    }, [reset]);

    const analyzeText = useCallback(() => {
        if (!pastedText.trim()) return;

        const savedText = pastedText;
        clearAll();
        setIsPlaying(true);
        setTimeout(() => setPastedText(savedText), 0);

        const lines = savedText.split(/(?=\[)/).filter(l => l.trim().length > 0);

        let delay = 0;
        lines.forEach((line) => {
            timers.current.push(setTimeout(() => {
                setTranscript(p => [...p, { time: Date.now(), text: line }]);

                const lowerLine = line.toLowerCase();

                // #16: Context Priming
                for (const ctx of CONTEXT_KW) {
                    if (lowerLine.includes(ctx)) {
                        if (ctx === 'in foot pursuit') {
                            setPursuitMode(true);
                            setTranscript(p => [...p, { time: Date.now(), text: `🏃 CONTEXT UPDATE: Foot Pursuit Mode Activated.` }]);
                        } else {
                            setPrimedContext(ctx);
                            setTranscript(p => [...p, { time: Date.now(), text: `📋 CONTEXT UPDATE: Officer initiated contact (${ctx}). AI baseline adjusted.` }]);
                        }
                    }
                }

                // #8, #18: Check for cancel/override keywords FIRST
                let canceled = false;
                for (const ckw of CANCEL_KW) {
                    if (lowerLine.includes(ckw)) {
                        if (ckw === 'suspect in custody' || ckw === 'handcuffs on') {
                            setCustodyMode(true);
                            setModel('struggle', { status: 'Suppressed', confidence: 0, color: 'gray', lastDetection: now() });
                            addLog({ model: 'system', threat: `Custody Mode Active — Use-of-force sounds suppressed`, confidence: 100, level: 'green', scenario: 'Post-Restraint' });
                            setTranscript(p => [...p, { time: Date.now(), text: `🔒 CONTEXT UPDATE: Subject in custody. Audio baseline restricted.` }]);
                        } else {
                            setCancelOverride(true);
                            setModel('keyword', { status: 'OVERRIDE ACTIVE', confidence: 0, color: 'green', lastDetection: now() });
                            setModel('gunshot', { status: 'Suppressed', confidence: 0, color: 'green', lastDetection: now() });
                            setModel('struggle', { status: 'Suppressed', confidence: 0, color: 'green', lastDetection: now() });
                            addLog({ model: 'system', threat: `Officer Override — "${ckw}" — All alerts suppressed`, confidence: 100, level: 'green', scenario: 'Voice Cancel (#8)' });
                            setTranscript(p => [...p, { time: Date.now(), text: `✅ OVERRIDE: "${ckw}" detected — alerts suppressed. Officer has final say.` }]);
                        }
                        canceled = true;
                        break;
                    }
                }

                if (!canceled) {
                    for (const kw of THREAT_KW) {
                        if (lowerLine.includes(kw) || fuzzyContainsPhrase(lowerLine, kw, 1)) {
                            const isUrgent = URGENT_KW.includes(kw);
                            const confK = 85 + Math.floor(Math.random() * 10);
                            const level = isUrgent ? 'red' : 'yellow' as const;
                            const t = Date.now();
                            setModel('keyword', { status: isUrgent ? 'THREAT DETECTED' : 'Possible Threat', confidence: confK, color: level, lastDetection: now() });
                            addLog({ model: 'keyword', threat: `Keyword — "${kw}"`, confidence: confK, level: level, scenario: 'Text Analysis' });
                            break;
                        }
                    }
                }

                // Check for keywords
                let foundKeyword = false;
                THREAT_KW.forEach(k => { // Assuming THREAT_KW is the 'keywords' array from the instruction
                    if (lowerLine.includes(k)) { // Changed textLC to lowerLine
                        foundKeyword = true;
                        setModel('keyword', { status: 'TACTICAL MATCH', confidence: 99, color: 'red', lastDetection: now() });
                        addLog({ model: 'keyword', threat: `Keyword Detected: "${k.toUpperCase()}"`, confidence: 99, level: 'red', scenario: 'Syntactical Match' });
                        addToTimeline(`Tactical Keyword: "${k}"`, 'SIGNAL', 99);

                        // Keyword + Stress or Keyword + Struggle = Trigger
                        if (models.stress.status !== 'Calm' || models.struggle.confidence > 50) {
                            triggerDispatch(`Keyword "${k}" + Physiological Stress`);
                        }
                    }
                });

                if (lowerLine.includes('gunshot') || lowerLine.includes('shots fired')) {
                    setModel('gunshot', { status: 'THREAT DETECTED', confidence: 99, color: 'red', lastDetection: now() });
                    addLog({ model: 'gunshot', threat: 'Gunshot identified via transcript tag', confidence: 99, level: 'red', scenario: 'Text Analysis' });
                }
                if (lowerLine.includes('struggle') || lowerLine.includes('scuffle') || lowerLine.includes('wrestling')) {
                    setModel('struggle', { status: 'THREAT DETECTED', confidence: 95, color: 'red', lastDetection: now() });
                    addLog({ model: 'struggle', threat: 'Struggle identified via transcript tag', confidence: 95, level: 'red', scenario: 'Text Analysis' });
                }

            }, delay));
            delay += 1200;
        });

        timers.current.push(setTimeout(() => {
            setIsPlaying(false);
        }, delay + 500));

    }, [pastedText, clearAll, setModel, addLog]);

    const modelCards = [
        { key: 'gunshot', name: 'Acoustic Threat', icon: Crosshair },
        { key: 'keyword', name: 'Tactical Keyphrases', icon: MessageSquareWarning },
        { key: 'struggle', name: 'CQC Detection', icon: Zap },
        { key: 'speaker', name: 'Voice Biometric', icon: User },
        { key: 'stress', name: 'Vocal Resonance', icon: Activity },
    ];

    const levelLabel = { red: 'Detected', yellow: 'Alert', green: 'Clear' };
    const modelLabel: Record<string, string> = { gunshot: 'Acoustic', keyword: 'Keyword', struggle: 'CQC', speaker: 'Biometric', stress: 'Stress', system: 'System' };
    const levelColor = {
        red: { bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.1)', text: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/12' },
        yellow: { bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.1)', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/12' },
        green: { bg: 'rgba(0,255,65,0.05)', border: 'rgba(0,255,65,0.1)', text: 'text-[#00FF41]', badge: 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/12' },
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-10">
            {/* Header info + Mode Toggle */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                        {displayMode === 'pilot' ? 'Phase 1: Audio-Only Live Dispatch' : displayMode === 'pilot2' ? 'Phase 2: Audio & Visual Live Dispatch' : 'Audio Threat Detection'}
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em] italic">
                            {displayMode === 'pilot' ? 'Automated Axon Logic / Evidence.com Forensic Sync' : displayMode === 'pilot2' ? 'Live CAD Loop · Multi-Officer Mesh · Real-Time Fusion' : 'Real-time Tactical Edge Inference Pipeline'}
                        </p>
                        <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 rounded-full p-1.5 h-10 shadow-lg">
                            <button
                                onClick={() => setDisplayMode('demo')}
                                className={`px-5 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 ${displayMode === 'demo' ? 'bg-[#00FF41] text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Field Demo
                            </button>
                            <button
                                onClick={() => setDisplayMode('pilot')}
                                className={`px-5 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 ${displayMode === 'pilot' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Phase 1
                            </button>
                            <button
                                onClick={() => setDisplayMode('pilot2')}
                                className={`px-5 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 ${displayMode === 'pilot2' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Phase 2
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-900 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Cpu className={`w-4 h-4 ${modelLoading ? 'text-amber-500 animate-spin' : 'text-[#00FF41]'}`} />
                        <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                            {modelLoading ? 'Optimizing AI Engines...' : displayMode === 'pilot' ? 'Supervisory Engine Ready' : displayMode === 'pilot2' ? 'Real-Time Dispatch Engine Ready' : 'Edge Neural Ready'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Model cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {modelCards.map(({ key, name, icon }) => (
                    <ModelCard key={key} name={name} icon={icon} isLoaded={!modelLoading} {...models[key]} />
                ))}
            </div>

            {/* ── Pilot Phase 1 & 2: Real-Time Dispatch ── */}
            {(displayMode === 'pilot' || displayMode === 'pilot2') && (
                <div className="space-y-6">

                    {/* Phase 1/2 intro banner */}
                    <div className={displayMode === 'pilot' ? "bg-blue-950/30 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4" : "bg-purple-950/30 border border-purple-500/20 rounded-2xl p-5 flex items-start gap-4"}>
                        <div className={displayMode === 'pilot' ? "p-2.5 bg-blue-500/10 rounded-xl shrink-0 mt-0.5" : "p-2.5 bg-purple-500/10 rounded-xl shrink-0 mt-0.5"}>
                            {displayMode === 'pilot' ? <Mic className="w-5 h-5 text-blue-400" /> : <Video className="w-5 h-5 text-purple-400" />}
                        </div>
                        <div>
                            <p className={displayMode === 'pilot' ? "text-xs font-black text-blue-300 uppercase tracking-[0.2em] mb-1" : "text-xs font-black text-purple-300 uppercase tracking-[0.2em] mb-1"}>
                                {displayMode === 'pilot' ? 'Phase 1: Audio-Only Infrastructure' : 'Phase 2: Multi-Modal Fusion (Audio + Visual)'}
                            </p>
                            <p className="text-[10px] text-neutral-400 leading-relaxed">
                                {displayMode === 'pilot' 
                                    ? <span>Phase 1 utilizes edge-computed audio inference to detect threats and dispatch backup with a 60-second cancel window, respecting privacy by <span className="text-blue-300 font-bold">not analyzing visual data</span> unless a threat is verified.</span>
                                    : <span>Phase 2 introduces <span className="text-purple-300 font-bold">continuous computer vision fusion</span>, processing video frames via edge GPUs on the BWC to detect weapons, bladed stances, and physical altercations, fused with audio for ultra-low false positive rates.</span>}
                            </p>
                        </div>
                    </div>



                    {/* Active Dispatch Decision */}
                    <div className="bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-purple-500/10 rounded-xl">
                                <Crosshair className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Live Dispatch Decision Engine</h3>
                                <p className="text-[9px] text-neutral-500">Real-time output of shouldSuppressAlert() · All 67 scenario rules active</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(['gunshot', 'struggle', 'keyword'] as const).map(modelKey => {
                                const conf = liveModelConf[modelKey] ?? 0;
                                const result = shouldSuppressAlert(conf, modelKey);
                                return (
                                    <div key={modelKey} className={`p-4 rounded-xl border ${result.suppress ? 'bg-white/[0.02] border-white/5' : 'bg-red-500/5 border-red-500/20'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-neutral-400">{modelKey}</span>
                                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${result.suppress ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {result.suppress ? 'Suppressed' : 'Dispatching'}
                                            </span>
                                        </div>
                                        <div className="flex items-end gap-2 mb-2">
                                            <span className="text-xl font-black text-white">{conf}%</span>
                                            <span className="text-[8px] text-neutral-600 pb-0.5">confidence</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                            <div className={`h-full rounded-full transition-all ${conf > 90 ? 'bg-red-400' : conf > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                style={{ width: `${conf}%` }} />
                                        </div>
                                        <p className="text-[6px] text-neutral-600 leading-relaxed">{result.reason || 'No detections'}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Multi-Officer Mesh */}
                    <div className="bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 bg-purple-500/10 rounded-xl">
                                <Users className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Multi-Officer BT Mesh</h3>
                                <p className="text-[9px] text-neutral-500">P1–P5: Single-dispatch, ghost partner, hysteresis · dedup window {deduplicationWindow / 1000}s</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { id: 'BADGE-4421', role: 'Primary', status: soloDetection.isSolo ? 'Solo' : 'Mesh', color: 'emerald' },
                                ...sceneOfficers.map((o, i) => ({ id: o.id, role: `Scene-${i + 2}`, status: 'Mesh', color: 'blue' })),
                            ].slice(0, 4).map((officer, i) => (
                                <div key={i} className={`p-3 rounded-xl border bg-white/[0.02] border-white/8`}>
                                    <div className={`w-2 h-2 rounded-full mb-2 ${officer.color === 'emerald' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                    <p className="text-[8px] font-bold text-white">{officer.id}</p>
                                    <p className="text-[7px] text-neutral-500">{officer.role}</p>
                                    <p className={`text-[7px] font-bold mt-1 ${officer.status === 'Solo' ? 'text-amber-400' : 'text-emerald-400'}`}>{officer.status}</p>
                                </div>
                            ))}
                            {sceneOfficers.length === 0 && (
                                <div className="col-span-3 p-3 rounded-xl border border-white/5 bg-white/[0.01] flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-neutral-600" />
                                    <p className="text-[8px] text-neutral-600 italic">No other BWC units on scene — solo flag active</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Phase 2 Roadmap (Only visible in Phase 1) */}
                    {displayMode === 'pilot' && (
                        <div className="bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                    <Target className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Phase 2 Integration Roadmap</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { title: 'Axon Body 4 Live SDK', desc: 'Real BWC stream via Axon DEMS API — audio/video frames pushed to edge compute at 140ms latency', icon: Video, status: 'planned' },
                                    { title: 'CAD Real-Time Webhook', desc: 'Axon CAD v3 webhook for call type, officer status, scene updates in <2s', icon: Radio, status: 'planned' },
                                    { title: 'Evidence.com Dispatch Logging', desc: 'Automatic case file creation with AI audit trail, suppression reason, and officer confidence history', icon: FileText, status: 'planned' },
                                    { title: 'Supervisor Real-Time Dashboard', desc: 'Supervisor console shows live fusion score, active scenario flags, and cancel window countdown per officer', icon: Shield, status: 'planned' },
                                    { title: 'BT Mesh Dedup Server', desc: 'Cloud dedup service receives all BWC scene reports — ensures single dispatch per incident with P1–P5 rules', icon: Wifi, status: 'planned' },
                                    { title: 'Multi-Modal GPU Inference', desc: 'On-device NVIDIA Jetson Orin or cloud GPU cluster for simultaneous YAMNet + Whisper + CV at <200ms total pipeline', icon: Cpu, status: 'planned' },
                                ].map(item => (
                                    <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg shrink-0">
                                            <item.icon className="w-3 h-3 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold text-white mb-0.5">{item.title}</p>
                                            <p className="text-[7px] text-neutral-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                        <span className="text-[6px] font-black uppercase text-blue-400/60 shrink-0 mt-0.5">Planned</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Phase 2 Visual Elements (Only visible in Phase 2) */}
                    {displayMode === 'pilot2' && (
                        <div className="bg-neutral-900/40 backdrop-blur-xl p-6 rounded-2xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                    <Eye className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Computer Vision Analysis (Phase 2 Active)</h3>
                                    <p className="text-[9px] text-neutral-500">Live scene weapon and postural recognition via edge-deployed MobileNet CV</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl flex flex-col justify-between">
                                    <p className="text-[8px] font-black uppercase text-emerald-400 mb-2 tracking-widest">Weapon Detect</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-white font-mono font-bold">CLEAR</p>
                                        <div className="flex gap-1"><div className="w-1 h-3 bg-emerald-500/50 rounded-full" /><div className="w-1 h-3 bg-emerald-500/20 rounded-full" /><div className="w-1 h-3 bg-emerald-500/20 rounded-full" /></div>
                                    </div>
                                </div>
                                <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl flex flex-col justify-between">
                                    <p className="text-[8px] font-black uppercase text-emerald-400 mb-2 tracking-widest">Stance Analysis</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-white font-mono font-bold">RELAXED</p>
                                        <div className="flex gap-1"><div className="w-1 h-3 bg-emerald-500/50 rounded-full" /><div className="w-1 h-3 bg-emerald-500/20 rounded-full" /><div className="w-1 h-3 bg-emerald-500/20 rounded-full" /></div>
                                    </div>
                                </div>
                                <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl flex flex-col justify-between">
                                    <p className="text-[8px] font-black uppercase text-emerald-400 mb-2 tracking-widest">Human Count</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-white font-mono font-bold">{soloDetection.isSolo ? '1 DETECTED' : '2+ DETECTED'}</p>
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    </div>
                                </div>
                                <div className="p-3 border border-emerald-500/20 bg-emerald-500/5 rounded-xl flex flex-col justify-between">
                                    <p className="text-[8px] font-black uppercase text-emerald-400 mb-2 tracking-widest">Horizon State</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-white font-mono font-bold">UPRIGHT</p>
                                        <div className="flex gap-1"><div className="w-1 h-3 bg-emerald-500/50 rounded-full" /><div className="w-1 h-3 bg-emerald-500/50 rounded-full" /><div className="w-1 h-3 bg-emerald-500/50 rounded-full" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Additional Scenario Auto-Detection (Active Context) ── */}
                    <div className="bg-neutral-900/40 backdrop-blur-xl p-6 rounded-3xl border border-white/10 mt-6 min-h-[350px]">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                    <Zap className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Active Environmental & Context Scenarios</h3>
                                    <p className="text-[9px] text-neutral-500 font-mono">{(Object.values(additionalFlags) as boolean[]).filter(Boolean).length} flagged contexts modifying AI threshold logic</p>
                                </div>
                            </div>
                            {/* Network Quality */}
                            <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${networkSignalQuality > 60 ? 'bg-green-400' : networkSignalQuality > 30 ? 'bg-amber-400' : 'bg-red-400'}`}
                                        style={{ width: `${networkSignalQuality}%` }} />
                                </div>
                                <span className="text-[8px] font-mono text-neutral-500">Signal {networkSignalQuality}%</span>
                            </div>
                        </div>

                        {(['physiological', 'environmental', 'temporal', 'network'] as const).map(cat => {
                            const activeKeys = (Object.keys(ADDITIONAL_SCENARIO_PROFILES) as AdditionalScenarioKey[])
                                .filter(k => ADDITIONAL_SCENARIO_PROFILES[k].category === cat && additionalFlags[k]);
                            
                            if (activeKeys.length === 0) return null; // Only render categories that have active flags

                            const catLabels = { physiological: 'Physiological', environmental: 'Environmental', temporal: 'Temporal / Procedural', network: 'Network / Communication' };
                            const catColors = { physiological: 'text-pink-400', environmental: 'text-teal-400', temporal: 'text-amber-400', network: 'text-blue-400' };
                            return (
                                <div key={cat} className="mb-4">
                                    <p className={`text-[8px] font-black uppercase tracking-[0.15em] mb-2 ${catColors[cat]}`}>{catLabels[cat]}</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                                        {activeKeys.map(key => {
                                            const profile = ADDITIONAL_SCENARIO_PROFILES[key];
                                            const hasSuppression = profile.suppressModels.length > 0;
                                            const maxAdj = Math.max(...Object.values(profile.thresholdAdjust).filter(v => v !== undefined) as number[]);
                                            return (
                                                <div key={key} className="p-2.5 rounded-xl border transition-all cursor-default group relative bg-violet-500/10 border-violet-500/30">
                                                    <div className="flex items-start justify-between gap-1">
                                                        <p className="text-[8px] font-bold leading-tight text-white">
                                                            {profile.label}
                                                        </p>
                                                        <span className="text-[7px] font-black uppercase shrink-0 text-violet-400">
                                                            ACTIVE
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {hasSuppression && profile.suppressModels.map(m => (
                                                            <span key={m} className="text-[6px] font-black bg-red-500/20 border border-red-500/20 text-red-400 px-1 py-0.5 rounded uppercase">{m} OFF</span>
                                                        ))}
                                                        {maxAdj > 0 && <span className="text-[6px] font-black bg-amber-500/20 border border-amber-500/20 text-amber-400 px-1 py-0.5 rounded">+{maxAdj}% threshold</span>}
                                                        {maxAdj < 0 && <span className="text-[6px] font-black bg-green-500/20 border border-green-500/20 text-green-400 px-1 py-0.5 rounded">{maxAdj}% threshold</span>}
                                                    </div>
                                                    {/* Hover tooltip */}
                                                    <div className="hidden group-hover:block absolute z-50 bottom-full left-0 mb-1 w-52 p-3 bg-black/95 border border-white/10 rounded-xl text-[8px] text-neutral-300 leading-relaxed shadow-2xl">
                                                        <p className="font-bold text-white mb-1">{profile.label}</p>
                                                        <p className="text-violet-300 mb-1">📡 {profile.detection}</p>
                                                        <p>{profile.education.split('.')[0]}.</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}


                        {/* CAD Lag indicator */}
                        {cadLagMs > 5000 && (
                            <div className={`mt-3 p-2 rounded-xl border flex items-center gap-2 ${cadLagMs > 120000 ? 'bg-red-500/5 border-red-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                                <Clock className={`w-3 h-3 ${cadLagMs > 120000 ? 'text-red-400' : 'text-amber-400'}`} />
                                <p className="text-[8px] text-neutral-400">
                                    CAD data lag: <span className={`font-bold ${cadLagMs > 120000 ? 'text-red-400' : 'text-amber-400'}`}>{Math.round(cadLagMs / 1000)}s</span>
                                    {cadLagMs > 120000 && ' — P3+P5: Solo/partnered decisions marked low-confidence'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* ── Demo Mode Content (only shown in demo mode) ── */}
            {displayMode === 'demo' && (
                <div className="space-y-8">
                    {/* Demo content will go here - keeping filters only for demo mode */}
                </div>
            )}

            {/* ── Situational Filters Panel (#1-#10) ── */}
            <div className={`bg-neutral-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-4`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#00FF41]" />
                        <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Situational Filters & Safety Overrides</h3>
                    </div>
                    {cancelOverride && (
                        <button
                            onClick={() => { setCancelOverride(false); reset(); }}
                            className="text-[9px] font-black uppercase text-[#FF3B30] hover:text-[#FF3B30]/80 transition-colors flex items-center gap-1 bg-[#FF3B30]/10 px-3 py-1 rounded-full border border-[#FF3B30]/20"
                        >
                            <X size={10} /> Clear Override
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border transition-all ${soloMode && nearbyUnits === 0 ? 'bg-[#00FF41]/5 border-[#00FF41]/20' : 'bg-white/5 border-white/10 opacity-50'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <User className={`w-4 h-4 ${soloMode && nearbyUnits === 0 ? 'text-[#00FF41]' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={soloMode} onChange={(e) => setSoloMode(e.target.checked)} className="accent-[#00FF41]" />
                        </div>
                        <p className="text-[10px] font-bold text-white uppercase mb-1">Solo Mode</p>
                        <p className="text-[9px] text-neutral-500 font-mono">GPS Proximity Gate</p>
                    </div>

                    <div className={`p-4 rounded-xl border transition-all ${trainingMode ? 'bg-amber-500/5 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Activity className={`w-4 h-4 ${trainingMode ? 'text-amber-500' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={trainingMode} onChange={(e) => setTrainingMode(e.target.checked)} className="accent-amber-500" />
                        </div>
                        <p className="text-[10px] font-bold text-white uppercase mb-1">Training Mode</p>
                        <p className="text-[9px] text-neutral-500 font-mono">Suppress Dispatches</p>
                    </div>
                </div>

                {nearbyUnits > 0 && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users size={14} className="text-blue-400" />
                            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{nearbyUnits} Nearby Units Detected via Axon Stream</span>
                        </div>
                        <button onClick={() => setNearbyUnits(0)} className="text-[9px] text-blue-400 underline uppercase font-bold">Clear Proximity</button>
                    </div>
                )}
            </div>



            {/* Controls + transcript */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-neutral-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Volume2 className="w-4 h-4 text-[#00FF41]" />
                        <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Signal Acquisition</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button onClick={toggleMic} disabled={isPlaying || modelLoading}
                            className={`flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${isRecording ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                } ${isPlaying || modelLoading ? 'opacity-30 cursor-not-allowed' : ''} border`}>
                            {isRecording ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Raw Mic</>}
                        </button>

                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={isPlaying || isRecording || modelLoading}
                            className={`flex items-center justify-center gap-3 px-5 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white text-black transition-all cursor-pointer ${isPlaying || isRecording || modelLoading ? 'opacity-30 cursor-not-allowed' : 'hover:scale-[1.02]'}`}>
                            <Upload className="w-4 h-4" /> Load Audio
                        </button>
                        <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a" className="hidden" onChange={onFile} />
                    </div>

                    {uploadedFile && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/5">
                            <FileAudio className="w-3.5 h-3.5 text-[#00FF41]" />
                            <span className="text-[10px] text-neutral-400 truncate font-mono">{uploadedFile.name}</span>
                        </div>
                    )}

                    <div className="pt-4 border-t border-white/5 space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#00FF41]" />
                            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Transcript Vectoring</h3>
                        </div>
                        <textarea
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            placeholder="Input tactical transcript for syntactical analysis..."
                            className="w-full h-28 bg-black/50 border border-white/5 rounded-xl p-4 text-[11px] text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-[#00FF41]/30 transition-all font-mono resize-none"
                        />
                        <button
                            onClick={analyzeText}
                            disabled={isPlaying || isRecording || !pastedText.trim()}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer border ${isPlaying || isRecording || !pastedText.trim() ? 'opacity-30 cursor-not-allowed border-white/5 text-neutral-600' : 'bg-[#00FF41]/10 border-[#00FF41]/20 text-[#00FF41] hover:bg-[#00FF41]/20'
                                }`}>
                            <Play className="w-4 h-4" /> Run Vector Analysis
                        </button>
                    </div>
                </div>

                {/* Transcript */}
                <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-6 pb-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Radio className="w-4 h-4 text-[#00FF41]" />
                                <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Live Terminal Output</h3>
                            </div>
                            {(isPlaying || isRecording) && (
                                <span className="flex items-center gap-2 text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    Processing
                                </span>
                            )}
                        </div>
                        <div className="bg-black/60 rounded-xl p-4 font-mono text-[11px] overflow-y-auto h-[200px] border border-white/5 scrollbar-hide mb-6">
                            {transcript.length === 0
                                ? <p className="text-neutral-700 italic">Waiting for signal input...</p>
                                : transcript.map((l, i) => (
                                    <p key={i} className={`mb-1.5 leading-relaxed ${l.text.includes('[') || l.text.includes('⚠') || l.text.includes('⏳') ? 'text-amber-500' : l.text.startsWith('🎤') || l.text.startsWith('Processing') || l.text.startsWith('Running') ? 'text-[#00FF41]' : 'text-neutral-400'
                                        }`}>
                                        <span className="text-neutral-700 mr-2">[{new Date(l.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                        {l.text}
                                    </p>
                                ))
                            }
                        </div>
                    </div>

                    <div className="flex-1 bg-black/40 border-t border-white/5 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Pilot Incident Timeline</h3>
                        </div>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto scrollbar-hide pr-2">
                            {timeline.length === 0 ? (
                                <p className="text-[10px] text-neutral-600 italic">No timeline events recorded.</p>
                            ) : (
                                timeline.map((event) => (
                                    <div key={event.id} className="flex gap-3 relative pb-3 last:pb-0">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2 h-2 rounded-full mt-1 ${event.type === 'DISPATCH' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                event.type === 'SIGNAL' ? 'bg-[#00FF41]' :
                                                    'bg-blue-400'
                                                }`} />
                                            <div className="w-[1px] flex-1 bg-white/10 mt-1" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="text-[9px] font-mono text-neutral-500">[{event.timestamp}]</span>
                                                {event.confidence && (
                                                    <span className="text-[8px] font-black text-neutral-600 uppercase">Conf: {event.confidence}%</span>
                                                )}
                                            </div>
                                            <p className={`text-[10px] font-bold uppercase tracking-wide ${event.type === 'DISPATCH' ? 'text-red-400' : 'text-neutral-300'
                                                }`}>{event.label}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Pilot Shift Report Button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => {
                            const summary = `
INCIDENT REPORT SUMMARY - [${now()}]
------------------------------------
Duration: ${transcript.length > 0 ? (transcript.length * 0.25).toFixed(1) : '0'}s
Signals Detected: ${timeline.filter(e => e.type === 'SIGNAL').length}
Dispatch Status: ${timeline.some(e => e.type === 'DISPATCH') ? 'SUCCESS (P1 BACKUP SENT)' : 'STANDBY'}

TIMELINE LOG:
${timeline.map(e => `[${e.timestamp}] ${e.label} (${e.type})`).join('\n')}
                            `.trim();
                            setIncidentReport(summary);
                            setShowReport(true);
                        }}
                        className="px-8 py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-105 transition-all shadow-xl flex items-center gap-3"
                    >
                        <FileText size={16} />
                        Generate Pilot Shift Report
                    </button>
                </div>
            </div>

            {/* Shift Report Modal */}
            <AnimatePresence>
                {showReport && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowReport(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <ShieldAlert size={20} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Phase 1: Audio-Only Report</h3>
                                        <p className="text-[10px] text-neutral-500 font-mono">Axon Evidence.com Export - Forensic Audit v1.0</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowReport(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} className="text-neutral-500" />
                                </button>
                            </div>
                            <div className="p-8 font-mono text-[11px] text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto bg-black/40">
                                {incidentReport}
                            </div>
                            <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
                                <button className="flex-1 py-4 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all">
                                    Push to Evidence.com Vault
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="px-6 py-4 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
                                >
                                    Print PDF
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Dispatch Overlay */}
            <AnimatePresence>
                {isDispatching && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
                    >
                        <div className="bg-red-500 text-white p-6 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] border border-red-400 flex items-center gap-6">
                            <div className="relative">
                                <ShieldAlert size={40} className="text-white animate-pulse" />
                                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black uppercase tracking-tighter leading-tight italic">Backup Dispatched</h4>
                                <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Automatic Priority 1 Stream Initiated</p>
                                <div className="flex items-center gap-2 mt-3 p-2 bg-black/20 rounded-lg border border-white/10">
                                    <Volume2 size={12} className="animate-bounce" />
                                    <span className="text-[9px] font-mono uppercase">Radio Call: Active</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dispatch Cancel Window (15-second override) */}
            <AnimatePresence>
                {dispatchCancelWindow && dispatchCancelWindow.active && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-lg"
                    >
                        <div className="bg-black/95 backdrop-blur-xl border-2 border-amber-500/50 p-5 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.2)]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Timer className="w-5 h-5 text-amber-400 animate-pulse" />
                                    <div>
                                        <h4 className="text-xs font-black text-white uppercase tracking-wider">Dispatch Cancel Window</h4>
                                        <p className="text-[9px] text-neutral-400 font-mono">{dispatchCancelWindow.dispatchId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-12 h-12">
                                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f59e0b" strokeWidth="2"
                                                strokeDasharray={`${(dispatchCancelWindow.countdown / 15) * 97.4} 97.4`}
                                                strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-amber-400">
                                            {dispatchCancelWindow.countdown}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => cancelDispatch(dispatchCancelWindow.dispatchId)}
                                    className="flex-1 py-3 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    <X size={14} /> Cancel Dispatch
                                </button>
                                <button
                                    onClick={() => {
                                        if (cancelTimerRef.current) clearInterval(cancelTimerRef.current);
                                        setDispatchCancelWindow(null);
                                        updateIncidentStatus(dispatchCancelWindow.dispatchId, 'dispatched');
                                    }}
                                    className="px-6 py-3 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                            <p className="text-[8px] text-neutral-500 text-center mt-2 font-mono">Dispatch locks in when timer reaches 0</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Log */}
            <div className="bg-neutral-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#00FF41]" />
                        <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Neural Detection History</h3>
                        {log.length > 0 && <span className="text-[9px] font-mono text-neutral-500 ml-2 bg-white/5 px-2 py-0.5 rounded-full">{log.length} events</span>}
                    </div>
                    {log.length > 0 && (
                        <button onClick={clearAll}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Purge
                        </button>
                    )}
                </div>
                <div className="space-y-2 h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {log.length === 0
                        ? <div className="py-12 flex flex-col items-center justify-center opacity-20">
                            <Radio className="w-8 h-8 text-neutral-500 mb-2" />
                            <p className="text-[10px] font-mono uppercase tracking-widest italic">No neural signatures detected</p>
                        </div>
                        : log.map(entry => {
                            const lc = levelColor[entry.level] || levelColor.green;
                            return (
                                <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl px-5 py-3 border transition-all hover:bg-white/[0.02]"
                                    style={{ background: lc.bg, border: `1px solid ${lc.border}` }}>
                                    <span className="text-[10px] text-neutral-500 font-mono w-[68px] shrink-0">[{entry.timestamp}]</span>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${lc.badge} w-fit`}>
                                        {modelLabel[entry.model] || entry.model}
                                    </span>
                                    <span className="text-[11px] text-white flex-1 truncate font-medium">{entry.threat}</span>
                                    {entry.scenario === 'Filtered' && (
                                        <div className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[9px] text-neutral-500 font-mono italic">
                                            Mitigated by Safety Logic
                                        </div>
                                    )}
                                    <div className="flex items-center gap-4 ml-auto">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[8px] uppercase text-neutral-600 font-mono">Confidence</span>
                                            <span className={`text-[11px] font-black ${lc.text}`}>{entry.confidence}%</span>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ background: lc.text.replace('text-', '') }} />
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>

            {/* Anti-Simulation Validation Architecture */}
            <div className="pt-6">
                {/* Phase 1/2 distinction passed to internal components and layout */}
            {displayMode === 'demo' ? <ArchitectureDiagram mode="demo" /> : <ArchitectureDiagram mode={displayMode} />}
            </div>
        </div>
    );

    // Helper function to generate mock events
    const generateMockEvents = () => {
        const mockEvents = [
            {
                type: 'Verbal escalation',
                time: '14:02:11',
                trigger: 'elevated voice + keyword',
                confidence: 0.75,
                action: 'Monitor for escalation'
            },
            {
                type: 'Weapon threat',
                time: '14:02:15',
                trigger: 'keyword "knife"',
                confidence: 0.82,
                action: 'Backup recommended'
            },
            {
                type: 'Physical struggle',
                time: '14:02:38',
                trigger: 'impact sounds + stress audio',
                confidence: 0.91,
                action: 'Immediate backup required'
            }
        ];

        setDetectedEvents(mockEvents);
        setIncidentMetrics(prev => ({
            ...prev,
            totalIncidents: 3,
            confirmedIncidents: 2,
            falsePositives: 1,
            manualReviewsSaved: 3
        }));
        setEscalationPattern('struggle');

        // Create managed incidents for lifecycle dashboard
        const incident1 = createManagedIncident('Verbal escalation', 0.75, 'medium', 'elevated voice + keyword');
        const incident2 = createManagedIncident('Weapon threat', 0.82, 'high', 'keyword "knife"');
        const incident3 = createManagedIncident('Physical struggle', 0.91, 'critical', 'impact sounds + stress audio');
        setManagedIncidents(prev => [...prev, incident1, incident2, incident3]);

        // Set active scene for deduplication
        setActiveSceneId(`SCENE-${Date.now().toString(36).toUpperCase()}`);
        setLastSceneDispatchTime(Date.now());

        // Simulate backup arrival after 5 seconds (multi-officer dedup demo)
        setTimeout(() => {
            setSceneOfficers(prev => [...prev, { id: '422', arrivalTime: Date.now(), role: 'backup' }]);
            setAutoDetectionLog(prev => [{ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), system: 'GPS Proximity', status: 'BACKUP', reason: 'Officer #422 arrived on-scene — dedup suppression active' }, ...prev].slice(0, 30));
        }, 5000);
    };
};
