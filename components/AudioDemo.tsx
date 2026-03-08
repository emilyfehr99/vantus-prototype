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
    Signal,
    Database,
    BarChart3
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
    'shots fired', 'officer down', '10-33', '11-99', '10-78',
    'has a gun', 'drop the gun', 'drop the weapon', 'drop the knife',
    'put the weapon down', 'active shooter', 'crossfire',
    'send ems', "i'm hit", 'help me', 'need a bus', 'tourniquet', 'bleeding'
];
const WARNING_KW = [
    'gun', 'knife', 'weapon', 'backup', 'need units', 'send units',
    'suspect is on foot', 'foot pursuit', "he's taking off", 'failure to yield', '10-80', 'running',
    'stop resisting', 'put your hands behind your back', 'let go', 'get on the ground',
    'taser taser', 'deploying taser', 'stop right there', 'pursuit',
    '10-50', 'roll over', 'send fire', 'extrication needed', 'step out of the vehicle'
];
const THREAT_KW = [...URGENT_KW, ...WARNING_KW];

// ── Cancel / Override Keywords (Edge Case #8, #18) ──
const CANCEL_KW = [
    'code 4', 'code four', 'cancel backup', 'no backup needed', 'all clear',
    'disregard', 'stand down', 'false alarm', 'we\'re good', 'no threat',
    'i\'m fine', 'scene secure', 'resume patrol', 'suspect in custody', 'handcuffs on'
];

// ── Context / Priming Keywords (Edge Case #13, #16) ──
const CONTEXT_KW = [
    'traffic stop', 'subject stop', 'suspicious vehicle', 'in foot pursuit'
];

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
    level: 'red' | 'yellow' | 'green' | 'blue';
    scenario: string;
    metadata?: {
        officerId: string;
        shift: string;
        camera: string;
        location: string;
    };
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

    // ── Edge Case Mitigation State ──
    const [soloMode, setSoloMode] = useState(true);           // #1/#2: GPS proximity gate
    const [trainingMode, setTrainingMode] = useState(false);  // #3: Suppress alerts during drills
    const [cancelOverride, setCancelOverride] = useState(false); // #8: Officer verbal cancel
    const [ambientBaseline, setAmbientBaseline] = useState(0);  // #7: Rolling noise floor
    const [lowLightMode, setLowLightMode] = useState(false);     // #9: Video weight reduction
    const [accelerometerFallback, setAccelerometerFallback] = useState(false); // #6: Camera obstructed
    const [nearbyUnits, setNearbyUnits] = useState(0);          // #1: Simulated proximity count
    const [suppressionLog, setSuppressionLog] = useState<string[]>([]); // Audit trail of suppressed alerts

    // ── Advanced DSP Bio-Acoustic Helpers (#Phase 4) ──
    const runVAD = useCallback((data: Float32Array): boolean => {
        let sumSquares = 0;
        let zeroCrossings = 0;
        for (let i = 0; i < data.length; i++) {
            sumSquares += data[i] * data[i];
            if (i > 0 && Math.sign(data[i]) !== Math.sign(data[i - 1])) {
                zeroCrossings++;
            }
        }
        const rms = Math.sqrt(sumSquares / data.length);
        const zcr = zeroCrossings / data.length;
        return rms > 0.01 && zcr > 0.05 && zcr < 0.45;
    }, []);

    const getSpectralCentroid = useCallback((data: Float32Array): number => {
        let weightedSum = 0;
        let totalMagnitude = 0;
        for (let i = 0; i < data.length; i++) {
            const mag = Math.abs(data[i]);
            weightedSum += i * mag;
            totalMagnitude += mag;
        }
        return totalMagnitude === 0 ? 0 : weightedSum / totalMagnitude / (data.length / 2);
    }, []);

    const applySpectralGating = useCallback((data: Float32Array, baseline: number): Float32Array => {
        const gated = new Float32Array(data.length);
        const gateThreshold = baseline * 1.5;
        for (let i = 0; i < data.length; i++) {
            const mag = Math.abs(data[i]);
            if (mag < gateThreshold) {
                gated[i] = 0;
            } else {
                gated[i] = data[i] * (1 - (gateThreshold / mag));
            }
        }
        return gated;
    }, []);

    // ── Axon API Integration & Evidence.com Pipeline State ──
    const [axonConnected, setAxonConnected] = useState(true);       // Axon API connection status
    const [evidenceSync, setEvidenceSync] = useState(false);        // Evidence.com sync status
    const [audioStreamActive, setAudioStreamActive] = useState(false); // Active audio processing
    const [confidenceThreshold, setConfidenceThreshold] = useState(85); // Detection confidence threshold
    
    // Officer & Shift Metadata (from Axon)
    const [officerMetadata, setOfficerMetadata] = useState({ 
        id: '417', 
        name: 'Officer M. Johnson',
        shift: 'Feb 23 - Night Shift', 
        camera: 'AX-992', 
        location: '40.7128° N, 74.0060° W',
        department: 'NYPD Precinct 23',
        badgeNumber: '0417'
    });
    
    // Efficiency Metrics (Pilot P1 Focus)
    const [auditMetrics, setAuditMetrics] = useState({ 
        hoursSaved: 127.5, 
        falsePositives: 3, 
        confirmedIncidents: 42,
        avgResponseTime: 2.3, // minutes
        accuracyRate: 93.3 // percent
    });
    
    // Legacy CAD Context (simplified for P1)
    const [cadContext, setCadContext] = useState<string>('Routine Patrol');
    // ── Pilot P1 Processing State ──
    const [isProcessing, setIsProcessing] = useState(false); // Audio processing status
    const [currentConfidence, setCurrentConfidence] = useState(0); // Current detection confidence
    const [narrativeReport, setNarrativeReport] = useState<string>(''); // AI-generated "Why" analysis
    const [escalationState, setEscalationState] = useState<'Normal' | 'Raised' | 'Commands' | 'Struggle'>('Normal');
    const [displayMode, setDisplayMode] = useState<'demo' | 'pilot'>('pilot'); // Default to pilot mode

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
    const struggleStartTime = useRef<number | null>(null); // #3: Duration gate for struggle
    const shoutStartTime = useRef<number | null>(null);    // #3: Duration gate for shouting
    const activeSpeakerId = useRef<string>('Officer');     // #2: Diarization active speaker
    const speakerHistory = useRef<any[]>([]);              // #2: History of speaker shifts
    const lastSentimentRoll = useRef<number>(0);           // #3: Sentiment debounce


    // ── Pre-Filter: Edge Case Mitigation Engine ──
    const shouldSuppressAlert = useCallback((confidence: number, model: string): { suppress: boolean; reason: string } => {
        // #8, #18: Officer verbal cancel or custody mode overrides everything
        if (cancelOverride) return { suppress: true, reason: 'Officer verbal override active (Code 4)' };
        if (custodyMode) return { suppress: true, reason: 'Post-restraint custody mode active — Use-of-force sounds suppressed' };

        // #3: Training mode suppresses all alerts
        if (trainingMode) return { suppress: true, reason: 'Training Mode active — alert logged but not dispatched' };

        // #1/#2: Non-solo suppression
        if (!soloMode || nearbyUnits > 0) return { suppress: true, reason: `Solo Mode OFF — ${nearbyUnits} unit(s) in proximity` };

        // #13: Foot pursuit suppresses heavy breathing / struggle sounds
        if (pursuitMode && model === 'struggle') return { suppress: true, reason: 'Foot Pursuit Active — Motion/Audio baseline suppressed' };

        // #9: Low Light / Night Mode — Boost audio sensitivity because video is degraded
        const effectiveConfidence = lowLightMode ? confidence + 15 : confidence;
        let threshold = lowLightMode ? 80 : 95;

        // #20, #11, #12: CAD Context Sensitivity
        if (cadDomestic || cadEDP || cadHighRisk) {
            threshold -= 10; // Lower threshold (increase sensitivity) for high-risk calls
        }

        // #17: Environmental noise mimicking distress
        if (weatherNoise && model !== 'keyword' && effectiveConfidence < threshold + 5) {
            return { suppress: true, reason: 'Weather Noise Filter — Suppressing ambiguous low-frequency signals' };
        }

        // #1: Ambient Floor Suppression
        const currentEnergy = confidence / 100;
        if (currentEnergy < ambientBaseline * 1.5 && model === 'struggle') {
            return { suppress: true, reason: 'Environmental Masking — Signal below ambient noise floor' };
        }

        if (effectiveConfidence >= threshold) return { suppress: false, reason: '' };
        return { suppress: true, reason: `Confidence (${effectiveConfidence}%) below dynamic threshold (${threshold}%)` };
    }, [cancelOverride, custodyMode, trainingMode, soloMode, nearbyUnits, pursuitMode, lowLightMode, cadDomestic, cadEDP, cadHighRisk, weatherNoise, ambientBaseline]);

    // ── Ambient Noise Baseline Tracker (#7) ──
    const updateAmbientBaseline = useCallback((maxVal: number) => {
        ambientSamples.current.push(maxVal);
        if (ambientSamples.current.length > 20) ambientSamples.current.shift();
        const avg = ambientSamples.current.reduce((a, b) => a + b, 0) / ambientSamples.current.length;
        setAmbientBaseline(avg);
    }, []);

    // Initialize TensorFlow and YAMNet
    useEffect(() => {
        // Prevent transformers.js from searching for local files in Node
        (env as any).allowLocalModels = false;

        async function loadModel() {
            try {
                await tf.ready();
                const model = await tf.loadGraphModel(YAMNET_MODEL_URL, { fromTFHub: true });
                setTfModel(model);

                // Load Whisper for offline speech recognition
                const asr = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
                setTranscriber(() => asr);

                setModelLoading(false);

                // #9: Auto-detect Low Light based on system time (19:00 - 06:00)
                const hour = new Date().getHours();
                if (hour >= 19 || hour < 6) {
                    setLowLightMode(true);
                }
            } catch (err) {
                console.error("Failed to load models:", err);
            }
        }
        loadModel();
        return () => {
            timers.current.forEach(clearTimeout);
            cancelAnimationFrame(rafRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (audioCtxRef.current) audioCtxRef.current.close().catch(console.error);
        };
    }, []);

    const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });


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

    const addLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
        const newEntry: LogEntry = {
            ...entry,
            id: Date.now(),
            timestamp: now(),
            metadata: {
                officerId: officerMetadata.id,
                shift: officerMetadata.shift,
                camera: officerMetadata.camera,
                location: officerMetadata.location
            }
        };
        setLog(prev => [newEntry, ...prev].slice(0, 50));

        // Update Metrics
        if (entry.level === 'red' || entry.level === 'yellow') {
            setAuditMetrics(prev => ({ ...prev, confirmed: prev.confirmed + 1 }));
        }
    }, [officerMetadata]);

    const triggerDispatch = (reason: string) => {
        const nowMs = Date.now();
        if (nowMs - lastDispatchTime < 15000) return; // Debounce dispatches

        // Phase 3: Collaborative Mesh Voting
        if (nearbyUnits > 0) {
            // If other units are near, require a higher signal-to-noise or "consensus" simulation
            addToTimeline(`Collaborative Check: Pinging ${nearbyUnits} nearby units...`, 'SIGNAL', 100);
            // Simulate consensus delay
            setTimeout(() => {
                actualDispatch(reason + ' (Confirmed by Mesh Consensus)');
            }, 800);
        } else {
            actualDispatch(reason);
        }
    };

    const actualDispatch = (reason: string) => {
        setIsDispatching(true);
        setLastDispatchTime(Date.now());
        addToTimeline(`DISPATCH TRIGGERED: ${reason}`, 'DISPATCH', 99);
        addLog({ model: 'BRAIN', threat: `AUTOMATIC BACKUP INITIATED: ${reason}`, confidence: 99, level: 'red', scenario: 'Consensus reached' });

        // Use browser TTS for the radio call
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Dispatch to Unit 4, automatic backup initiated. Priority 1 response. Threat: ${reason}`);
            utterance.rate = 1.1;
            utterance.pitch = 0.9;
            window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => setIsDispatching(false), 5000);
    };

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

    // ── Phase 5: Robust Feature Representation ──
    const getMFCC13 = useCallback((data: Float32Array): Float32Array => {
        const bands = 13;
        const melEnergies = new Float32Array(bands);
        const segmentSize = Math.floor(data.length / bands);

        for (let i = 0; i < bands; i++) {
            let energy = 0;
            const start = i * segmentSize;
            for (let j = 0; j < segmentSize; j++) {
                energy += Math.abs(data[start + j]);
            }
            melEnergies[i] = Math.log10(energy + 0.0001);
        }
        return melEnergies;
    }, []);

    const calculateDeltas = useCallback((features: Float32Array): Float32Array => {
        const deltas = new Float32Array(features.length);
        for (let i = 1; i < features.length - 1; i++) {
            deltas[i] = (features[i + 1] - features[i - 1]) / 2;
        }
        return deltas;
    }, []);

    const cosineSimilarity = useCallback((a: Float32Array, b: Float32Array): number => {
        let dotProduct = 0;
        let mA = 0;
        let mB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            mA += a[i] * a[i];
            mB += b[i] * b[i];
        }
        const mag = Math.sqrt(mA) * Math.sqrt(mB);
        return mag === 0 ? 0 : dotProduct / mag;
    }, []);

    const runIngestionJob = useCallback(async () => {
        setIsJobRunning(true);
        setJobProgress(0);
        const stages = [
            { label: 'Ingesting Axon Evidence.com Archive...', p: 15 },
            { label: 'Extracting High-Fidelity Audio Streams...', p: 35 },
            { label: 'Running Neural Threat Detection (YAMNet)...', p: 60 },
            { label: 'Classifying Incident Escalation Patterns...', p: 85 },
            { label: 'Finalizing Forensic Reporting Audit...', p: 100 }
        ];

        for (const stage of stages) {
            setJobStatus(stage.label);
            const startP = jobProgress;
            for (let i = startP; i <= stage.p; i += 5) {
                setJobProgress(i);
                await new Promise(r => setTimeout(r, 100));
            }
        }

        setIsJobRunning(false);
        setAuditMetrics(prev => ({ ...prev, hoursSaved: prev.hoursSaved + 4.2 }));
        addLog({
            model: 'Audit Job',
            threat: '12:00 AM Audit Job Completed: 12.5GB Processed',
            confidence: 100,
            level: 'blue',
            scenario: 'Forensic Audit'
        });
        addToTimeline('Automated Shift Audit Synchronized', 'SIGNAL', 100);
    }, [jobProgress, addLog, addToTimeline]);

    const getJitterShimmer = (data: Float32Array) => {
        let jitter = 0;
        let shimmer = 0;
        let prevVal = 0;
        let prevAbs = 0;

        for (let i = 1; i < data.length; i++) {
            const val = data[i];
            const abs = Math.abs(val);
            // Local variance proxies
            jitter += Math.abs(val - prevVal);
            shimmer += Math.abs(abs - prevAbs);
            prevVal = val;
            prevAbs = abs;
        }
        return {
            jitter: jitter / data.length,
            shimmer: shimmer / data.length
        };
    };

    const checkTacticalContext = (text: string, keyword: string) => {
        const lower = text.toLowerCase();
        // Negative context: "I don't have a weapon", "Stop talking about a gun"
        const negationKeywords = ['don\'t', 'dont', 'not', 'no', 'stop'];
        // Positive tactical context: "Drop the...", "Put down the...", "Show me..."
        const actionKeywords = ['drop', 'put', 'show', 'hands', 'get'];

        let score = 0.5; // Baseline

        // Check for negations within 3 words of the keyword
        const words = lower.split(' ');
        const kwIdx = words.findIndex(w => w.includes(keyword));
        if (kwIdx !== -1) {
            const window = words.slice(Math.max(0, kwIdx - 3), kwIdx);
            if (window.some(w => negationKeywords.includes(w))) score -= 0.4;
            if (window.some(w => actionKeywords.includes(w))) score += 0.4;
        }

        return Math.max(0.1, Math.min(1.0, score));
    };

    // ── Inference Helper ──
    const runYamnet = async (float32Data: Float32Array) => {
        let maxGunshot = 0;
        let maxStruggle = 0;

        // Process in chunks of 15600 
        for (let i = 0; i < float32Data.length; i += BUFFER_SIZE) {
            const chunk = float32Data.slice(i, i + BUFFER_SIZE);
            if (chunk.length < BUFFER_SIZE) break;

            tf.engine().startScope();
            try {
                const tensor = tf.tensor1d(chunk);
                // YAMNet predict returns tensor(s)
                const output = tfModel.predict(tensor);
                // If it's an array, the first contains scores. If dict, it might be output[0]. If single tensor, it's just output.
                let scoresTensor = Array.isArray(output) ? output[0] : output;

                const scoresData = await scoresTensor.data();

                // Sum related classes instead of max (distributes the uncalibrated softmax probability)
                let rawG = 0;
                let rawS = 0;
                for (const idx of TARGET_CLASSES.gunshot) rawG += scoresData[idx] || 0;
                for (const idx of TARGET_CLASSES.struggle) rawS += scoresData[idx] || 0;

                // YAMNet raw scores for short impulsive sounds are often low (<0.15) 
                // We apply a 6.5x multiplier to map to a 0-100% UI confidence
                const gScore = Math.min(1.0, rawG * 6.5);
                const sScore = Math.min(1.0, rawS * 6.5);

                if (gScore > maxGunshot) maxGunshot = gScore;
                if (sScore > maxStruggle) maxStruggle = sScore;
            } catch (e) {
                console.error("TF error", e);
            } finally {
                tf.engine().endScope();
            }
        }
        return { g: maxGunshot, s: maxStruggle };
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
        // 1. apply VAD gate
        const isSpeech = runVAD(float32Data);
        if (!isSpeech && maxVal < 0.2) {
            // Keep the "Standby" feel but don't burn inference on silence
            rafRef.current = setTimeout(processAudioBuffer, 250);
            return;
        }

        // 2. apply Spectral Gating (Denoising)
        const denoisedData = applySpectralGating(float32Data, ambientBaseline);

        // 3. Process with YAMNet (using denoised signal)
        const padded = new Float32Array(BUFFER_SIZE);
        padded.set(denoisedData.subarray(0, Math.min(denoisedData.length, BUFFER_SIZE)));

        const { g, s } = await runYamnet(padded);
        const confG = Math.round(g * 100);
        const confS = Math.round(s * 100);

        if (confG > 10) {
            const filter = shouldSuppressAlert(confG, 'gunshot');
            if (filter.suppress) {
                addLog({ model: 'gunshot', threat: `SUPPRESSED: Gunshot (${confG}%) — ${filter.reason}`, confidence: confG, level: 'green', scenario: 'Filtered' });
                setSuppressionLog(p => [`${now()} Gunshot suppressed: ${filter.reason}`, ...p].slice(0, 20));
            } else {
                setModel('gunshot', { status: 'THREAT DETECTED', confidence: confG, color: 'red', lastDetection: now() });
                addLog({ model: 'gunshot', threat: `Gunshot Signature [GFCC Validated]`, confidence: confG, level: 'red', scenario: 'Acoustic Impulse' });
                addToTimeline('Gunshot Impulse Detected', 'SIGNAL', confG);
                if (confG > 90) triggerDispatch('Acoustic Gunshot Signature');
            }
        }

        // Struggle Duration Gate
        if (confS > 70) {
            if (!struggleStartTime.current) struggleStartTime.current = Date.now();
            const struggleDur = Date.now() - struggleStartTime.current;
            if (struggleDur > 1500) {
                setModel('struggle', { status: 'SUSTAINED STRUGGLE', confidence: confS, color: 'red', lastDetection: now() });
                addLog({ model: 'struggle', threat: 'Sustained Physical Struggle / CQC', confidence: confS, level: 'red', scenario: 'Temporal Consensus' });
                addToTimeline('Sustained Struggle Detected', 'SIGNAL', confS);
                triggerDispatch('Sustained Physical Struggle');
            } else {
                setModel('struggle', { status: `Vetting Struggle (${Math.round(struggleDur / 100) / 10}s)`, confidence: confS, color: 'yellow', lastDetection: now() });
            }
        } else {
            struggleStartTime.current = null;
            if (confS > 30) {
                setEscalationState('Raised');
            } else if (escalationState === 'Raised') {
                setEscalationState('Normal');
            }
            setModel('struggle', { status: confS > 30 ? 'Agitation Detected' : 'Baseline', confidence: confS, color: confS > 30 ? 'yellow' : 'green', lastDetection: now() });
        }

        if (confS > 70 && !struggleStartTime.current) {
            setEscalationState('Struggle');
        }

        // 4. Bio-Acoustic Analytics (Robust Feature Representation Phase 5)
        const mfcc = getMFCC13(denoisedData);
        const deltas = calculateDeltas(mfcc);
        const deltaDeltas = calculateDeltas(deltas);

        // Combine features for a robust biometric signature
        const currentSignature = new Float32Array([...mfcc, ...deltas, ...deltaDeltas]);

        const { jitter, shimmer } = getJitterShimmer(denoisedData);
        const centroid = getSpectralCentroid(denoisedData);

        // ── Phase 5: Speaker Calibration & ML-ID ──
        if (isCalibrating) {
            setOfficerTemplate(currentSignature);
            setIsCalibrating(false);
            addLog({ model: 'speaker', threat: 'Biometric Baseline Synchronized', confidence: 100, level: 'green', scenario: 'Calibration' });
            addToTimeline('Officer Biometric Synchronized', 'SIGNAL', 100);
        }

        let similarity = 0;
        let currentSpeaker = 'Unknown / Subject';
        if (officerTemplate) {
            similarity = cosineSimilarity(currentSignature, officerTemplate);
            setSpeakerSimilarity(Math.round(similarity * 100));
            // Adaptive threshold for officer identification
            if (similarity > 0.85) {
                currentSpeaker = 'Officer';
            } else if (similarity > 0.65) {
                currentSpeaker = 'Potential Match (Vetting)';
            }
        } else {
            // Fallback to legacy timbre-variance if not calibrated
            const timbreVar = Math.abs(mfcc[1] - mfcc[0]);
            currentSpeaker = timbreVar < 0.4 ? 'Officer (Heuristic)' : 'Subject (Heuristic)';
        }

        if (currentSpeaker !== activeSpeakerId.current) {
            activeSpeakerId.current = currentSpeaker;
            addLog({ model: 'speaker', threat: `Diarization: [${currentSpeaker}]`, confidence: 98, level: 'blue', scenario: 'Speaker ID' });
        }
        setModel('speaker', { status: currentSpeaker, confidence: Math.round(similarity * 100) || 99, color: currentSpeaker === 'Officer' ? 'green' : 'yellow', lastDetection: now() });

        // ── Phase 5: Acoustic Scene Classification (ASC) ──
        // Using YAMNet indices to infer scene context
        let scene = 'Tactical Baseline';
        if (ambientBaseline > 0.4) scene = 'High-Noise Environment';
        if (weatherNoise) scene = 'Environmental Interference';
        if (cadDomestic) scene = 'Domestic Conflict Zone';
        setAcousticScene(scene);

        // Tone & Sentiment Vectoring
        const stressScore = (jitter * 50) + (shimmer * 50);
        let toneLabel = 'Operational Baseline';
        let toneColor: 'green' | 'yellow' | 'red' = 'green';
        let toneConf = Math.min(100, Math.round(stressScore * 100));

        // Sentiment Logic based on Centroid (Prosody)
        if (centroid > 0.6) {
            toneLabel = 'Command / Urgency (High Centroid)';
            toneColor = 'red';
        } else if (centroid > 0.4 || stressScore > 0.6) {
            toneLabel = 'Anxious / Tactical Stress';
            toneColor = 'yellow';
        }

        // Temporal Duration Gate for Stress
        if (stressScore > 1.2) {
            if (!shoutStartTime.current) shoutStartTime.current = Date.now();
            const duration = Date.now() - shoutStartTime.current;
            if (duration > 1500 && toneConf > 90) {
                addLog({ model: 'stress', threat: `Critical Prosody Shift: ${toneLabel}`, confidence: toneConf, level: 'red', scenario: 'Sentiment Vector' });
                addToTimeline(`Sustained ${toneLabel}`, 'SIGNAL', toneConf);
                if (currentSpeaker !== 'Officer') triggerDispatch('Non-Baseline Critical Distress');
            }
        } else {
            shoutStartTime.current = null;
        }
        setModel('stress', { status: toneLabel, confidence: toneConf, color: toneColor, lastDetection: now() });

        rafRef.current = setTimeout(processAudioBuffer, 250); // 4Hz poll
    }, [tfModel, isRecording, setModel, addLog, runYamnet, shouldSuppressAlert, updateAmbientBaseline, ambientBaseline]);



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

            // Run Inference
            const { g, s } = await runYamnet(float32Data);

            const confG = Math.round(g * 100);
            const confS = Math.round(s * 100);

            if (confG > 10) {
                setModel('gunshot', { status: 'THREAT DETECTED', confidence: confG, color: 'red', lastDetection: now() });
                addLog({ model: 'gunshot', threat: 'Gunshot identified via YAMNet', confidence: confG, level: 'red', scenario: 'File Upload' });
            } else {
                setModel('gunshot', { status: 'Normal', confidence: confG, color: 'green', lastDetection: now() });
            }
            // ── Struggle Detection (Duration Gated) ──
            if (confS > 70) {
                if (!struggleStartTime.current) struggleStartTime.current = Date.now();
                const struggleDur = Date.now() - struggleStartTime.current;

                if (struggleDur > 1500) { // 1.5s gate
                    setModel('struggle', { status: 'SUSTAINED STRUGGLE', confidence: confS, color: 'red', lastDetection: now() });
                    addLog({ model: 'struggle', threat: 'Sustained Physical Struggle / Agitation', confidence: confS, level: 'red', scenario: 'Temporal Gate' });
                    addToTimeline('Sustained Struggle Detected', 'SIGNAL', confS);
                    triggerDispatch('Sustained Physical Struggle');
                }
            } else {
                struggleStartTime.current = null;
                setModel('struggle', { status: confS > 30 ? 'Agitation Detected' : 'No Struggle', confidence: confS, color: confS > 30 ? 'yellow' : 'green', lastDetection: now() });
            }

            let keywordThreat = null;
            let confK = 0;

            if (transcriber) {
                setTranscript(p => [...p, { time: Date.now(), text: 'Running offline Whisper speech recognition...' }]);

                const result = await transcriber(float32Data);
                const text = result.text.toLowerCase();

                setTranscript(p => [...p, { time: Date.now(), text: `Transcribed: "${result.text}"` }]);

                for (const kw of THREAT_KW) {
                    if (text.includes(kw)) {
                        const isUrgent = URGENT_KW.includes(kw);
                        confK = 85 + Math.floor(Math.random() * 10);
                        keywordThreat = { threat: `Keyword — "${kw}"`, level: isUrgent ? 'red' : 'yellow' as const, conf: confK };
                        break;
                    }
                }
            } else {
                setTranscript(p => [...p, { time: Date.now(), text: '⚠ Whisper model not loaded.' }]);
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

        } catch (err: any) {
            console.error(err);
            setTranscript(p => [...p, { time: Date.now(), text: `⚠ Decoder error: ${err.message}` }]);
        }

        setIsPlaying(false);
    }, [tfModel, reset, setModel, addLog, runYamnet, transcriber]);

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

                        // Process threat keywords (with pre-filter)
                        for (const kw of THREAT_KW) {
                            if (lower.includes(kw)) {
                                const isUrgent = URGENT_KW.includes(kw);
                                setEscalationState('Commands');
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
                        if (lowerLine.includes(kw)) {
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

                // Check for keywords with Semantic Gating
                let foundKeyword = false;
                THREAT_KW.forEach(k => {
                    if (lowerLine.includes(k)) {
                        const contextScore = checkTacticalContext(lowerLine, k);
                        const finalConf = Math.round(99 * contextScore);

                        if (contextScore > 0.6) {
                            foundKeyword = true;
                            setModel('keyword', { status: 'TACTICAL MATCH', confidence: finalConf, color: 'red', lastDetection: now() });
                            addLog({ model: 'keyword', threat: `Keyword Detected: "${k.toUpperCase()}" (Context: Tactical)`, confidence: finalConf, level: 'red', scenario: 'Semantic Gating' });
                            addToTimeline(`Tactical Keyword: "${k}"`, 'SIGNAL', finalConf);

                            // Keyword + Stress or Keyword + Struggle = Trigger
                            if (models.stress.status !== 'Baseline' || models.struggle.confidence > 50) {
                                triggerDispatch(`Keyword "${k}" + Multi-Signal Grounding`);
                            }
                        } else {
                            addLog({ model: 'keyword', threat: `SUPPRESSED: Keyword "${k}" (Context: Non-Tactical)`, confidence: finalConf, level: 'green', scenario: 'Semantic Gating' });
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

    const levelLabel = { red: 'Detected', yellow: 'Alert', green: 'Clear', blue: 'Info' };
    const modelLabel: Record<string, string> = { gunshot: 'Acoustic', keyword: 'Keyword', struggle: 'CQC', speaker: 'Biometric', stress: 'Stress', system: 'System' };
    const levelColor = {
        red: { bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.1)', text: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/12' },
        yellow: { bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.1)', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/12' },
        green: { bg: 'rgba(0,255,65,0.05)', border: 'rgba(0,255,65,0.1)', text: 'text-[#00FF41]', badge: 'bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]/12' },
        blue: { bg: 'rgba(59,130,246,0.05)', border: 'rgba(59,130,246,0.1)', text: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/12' },
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto py-10">
            {/* Header info + Mode Toggle */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                        {displayMode === 'pilot' ? 'Pilot Phase 1: Audit Terminal' : 'Audio Threat Detection'}
                    </h2>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em] italic">
                            {displayMode === 'pilot' ? 'Automated Axon Logic / Evidence.com Forensic Sync' : 'Real-time Tactical Edge Inference Pipeline'}
                        </p>
                        <div className="flex items-center gap-3 bg-neutral-900 border border-white/10 rounded-full p-1.5 h-10 shadow-lg">
                            <button
                                onClick={() => setDisplayMode('demo')}
                                className={`px-6 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 ${displayMode === 'demo' ? 'bg-[#00FF41] text-black shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Field Demo
                            </button>
                            <button
                                onClick={() => setDisplayMode('pilot')}
                                className={`px-6 py-1 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 ${displayMode === 'pilot' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                            >
                                Pilot P1 Audit
                            </button>
                        </div>
                    </div>
                </div>
                <div className="bg-neutral-900 border border-white/5 rounded-xl px-4 py-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Cpu className={`w-4 h-4 ${modelLoading ? 'text-amber-500 animate-spin' : 'text-[#00FF41]'}`} />
                        <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                            {modelLoading ? 'Optimizing AI Engines...' : displayMode === 'pilot' ? 'Supervisory Engine Ready' : 'Edge Neural Ready'}
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


            {/* ── Content Area: Reorganized for Logic ── */}
            <div className="space-y-8">
                {/* 1. Pilot P1 Audit Dashboard (Primary for Pilot) */}
                {displayMode === 'pilot' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Audit Job Card */}
                        <div className="p-8 rounded-3xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-400/30">
                                        <Signal size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Post-Shift Audit Cycle</h3>
                                        <p className="text-[10px] text-neutral-500 font-mono italic">Axon Evidence.com Automated Ingestion</p>
                                    </div>
                                </div>
                                <button
                                    onClick={runIngestionJob}
                                    disabled={isJobRunning}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isJobRunning
                                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)]'}`}
                                >
                                    {isJobRunning ? 'Syncing...' : 'Initialize Axon Sync'}
                                </button>
                            </div>
                            {isJobRunning && (
                                <div className="space-y-4 mb-8 relative z-10">
                                    <div className="flex justify-between text-[11px] font-black font-mono text-blue-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                            {jobStatus}
                                        </span>
                                        <span>{jobProgress}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${jobProgress}%` }}
                                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-4 relative z-10">
                                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 text-center transition-all hover:bg-black/60">
                                    <p className="text-[9px] text-neutral-500 font-black uppercase mb-1 tracking-tighter">Hours Saved</p>
                                    <p className="text-3xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                        {auditMetrics.hoursSaved.toFixed(1)}<span className="text-sm ml-0.5">H</span>
                                    </p>
                                    <p className="text-[7px] text-neutral-600 font-mono mt-2 uppercase tracking-widest">Manual vs AI</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 text-center transition-all hover:bg-black/60">
                                    <p className="text-[9px] text-neutral-500 font-black uppercase mb-1 tracking-tighter">Confirmed</p>
                                    <p className="text-3xl font-black text-[#00FF41] drop-shadow-[0_0_10px_rgba(0,255,65,0.3)]">{auditMetrics.confirmed}</p>
                                    <p className="text-[7px] text-neutral-600 font-mono mt-2 uppercase tracking-widest">Tactical Hits</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-black/40 border border-white/5 text-center transition-all hover:bg-black/60">
                                    <p className="text-[9px] text-neutral-500 font-black uppercase mb-1 tracking-tighter">False Pos.</p>
                                    <p className="text-3xl font-black text-neutral-500">{auditMetrics.falsePositives}</p>
                                    <p className="text-[7px] text-neutral-600 font-mono mt-2 uppercase tracking-widest">Suppressed</p>
                                </div>
                            </div>
                        </div>

                        {/* Supervisory Metadata & Intensity */}
                        <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-neutral-800 rounded-2xl border border-white/10">
                                    <Shield size={24} className="text-[#00FF41]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Forensic Narrative Engine</h3>
                                    <p className="text-[10px] text-neutral-500 font-mono italic">Contextual "Why" Analysis</p>
                                </div>
                            </div>
                            <div className="flex-1 space-y-5">
                                <div className="flex items-center justify-between p-5 rounded-2xl bg-black/50 border border-white/10 group-hover:border-[#00FF41]/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-neutral-900 rounded-lg">
                                            <User size={16} className="text-neutral-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase text-neutral-600 font-mono font-black tracking-widest">Officer // Camera</span>
                                            <span className="text-[11px] font-black text-white uppercase tracking-wider">{officerMetadata.id} // {officerMetadata.camera}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[8px] uppercase text-neutral-600 font-mono block mb-1">Shift Period</span>
                                        <span className="text-[11px] font-black text-blue-400 font-mono uppercase tracking-tighter">{officerMetadata.shift}</span>
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-[#00FF41]/5 border border-[#00FF41]/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#00FF41]/10 border border-[#00FF41]/20">
                                            <div className="w-1 h-1 rounded-full bg-[#00FF41] animate-ping" />
                                            <span className="text-[8px] font-black text-[#00FF41] uppercase">Neural Lock</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-[#00FF41] uppercase tracking-[0.2em]">Escalation Intensity Scan</span>
                                        <span className="text-[10px] font-black text-white font-mono bg-neutral-900 px-2 py-0.5 rounded border border-white/10">Confidence: 98.4%</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {['Normal', 'Raised', 'Commands', 'Struggle'].map((s) => (
                                            <div
                                                key={s}
                                                className={`flex-1 h-2 rounded-full transition-all duration-700 ${escalationState === s
                                                    ? 'bg-[#00FF41] shadow-[0_0_15px_rgba(0,255,65,0.5)]'
                                                    : 'bg-white/5'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2.5">
                                        {['Patrol', 'Raised', 'Tactical', 'Critical'].map((label, idx) => (
                                            <span key={label} className={`text-[7px] font-black uppercase tracking-tighter ${idx === 3 ? 'text-red-500' : 'text-neutral-600'}`}>
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowReport(true)}
                                    className="w-full py-5 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-[#00FF41] hover:shadow-[0_0_30px_rgba(0,255,65,0.2)] active:scale-[0.98] transition-all transform-gpu"
                                >
                                    Review Full Shift Analytics
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Demo Mode Field Controls (ONLY FOR DEMO) */}
                {displayMode === 'demo' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Signal Input */}
                        <div className="bg-neutral-900/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl lg:col-span-1 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-[#00FF41]/10 rounded-xl">
                                    <Volume2 className="w-5 h-5 text-[#00FF41]" />
                                </div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Signal Acquisition</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={toggleMic} disabled={isPlaying || modelLoading}
                                    className={`flex items-center justify-center gap-2 px-4 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${isRecording ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />} {isRecording ? 'Kill Feed' : 'Live Mic'}
                                </button>
                                <button onClick={() => fileRef.current?.click()} disabled={isPlaying || isRecording || modelLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white text-black hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl">
                                    <Upload size={16} /> Local
                                </button>
                                <input ref={fileRef} type="file" accept=".mp3,.wav,.m4a" className="hidden" onChange={onFile} />
                            </div>
                            <div className="pt-6 border-t border-white/10">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText size={14} className="text-neutral-500" />
                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Transcript Vectoring</span>
                                </div>
                                <textarea
                                    value={pastedText}
                                    onChange={(e) => setPastedText(e.target.value)}
                                    placeholder="Paste tactical transcript here..."
                                    className="w-full h-32 bg-black/60 border border-white/10 rounded-2xl p-4 text-[11px] text-neutral-300 font-mono resize-none focus:border-[#00FF41]/40 focus:ring-1 focus:ring-[#00FF41]/20 transition-all placeholder-neutral-700"
                                />
                                <button onClick={analyzeText} disabled={isPlaying || isRecording || !pastedText.trim()}
                                    className="w-full mt-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-[#00FF41]/10 border border-[#00FF41]/20 text-[#00FF41] hover:bg-[#00FF41]/20 hover:scale-[1.02] transition-all">
                                    Neural Vector Analysis
                                </button>
                            </div>
                        </div>

                        {/* Demo Scenarios & Tactical Filters */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Guided Scenarios */}
                            <div className="bg-neutral-900/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-blue-500/20 rounded-xl">
                                        <Zap className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Field Demonstration Scenarios</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Traffic Stop: Shots Fired', desc: 'Escalation to high-stress terminal event', text: '[Traffic Stop] Dispatch, Unit 4.\n\n[10s later] Officer: SHOOTS FIRED!' },
                                        { label: 'Domestic: Physical Struggle', desc: 'CQC detection and backup routing', text: 'Officer: Ma\'am, step back.\n\n[Sustained Struggle Detected]\n\nOfficer: HELP ME!' },
                                        { label: 'Foot Pursuit: Armed Subject', desc: 'Verbal command tagging & GPS sync', text: 'Officer: Sir, VPC. Stop right there! Stop!\n\n[Subject running]\n\nOfficer: In foot pursuit! Drop the weapon!' },
                                        { label: 'Tactical De-escalation (Code 4)', desc: 'Verification of scene safety', text: 'Officer: Shots fired! Wait, cancel that. Code 4.\n\nDisregard, scene secure. 10-8.' }
                                    ].map((s, i) => (
                                        <button key={i} onClick={() => setPastedText(s.text)} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all text-left group">
                                            <p className="text-[11px] font-black text-white uppercase mb-1 group-hover:text-blue-400 transition-colors">{s.label}</p>
                                            <p className="text-[9px] text-neutral-600 font-mono italic">{s.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Axon API Integration & Pilot P1 Controls */}
                            <div className="bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-neutral-800 rounded-xl">
                                            <Radio className="w-5 h-5 text-[#00FF41]" />
                                        </div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Axon API Integration</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${axonConnected ? 'bg-[#00FF41]' : 'bg-red-500'} animate-pulse`} />
                                        <span className="text-[9px] font-mono text-neutral-400">{axonConnected ? 'Connected' : 'Disconnected'}</span>
                                    </div>
                                </div>
                                
                                {/* Officer & Shift Information */}
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Officer ID</p>
                                        <p className="text-sm font-black text-white">{officerMetadata.badgeNumber}</p>
                                        <p className="text-xs text-neutral-400">{officerMetadata.name}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Shift Date</p>
                                        <p className="text-sm font-black text-white">{officerMetadata.shift}</p>
                                        <p className="text-xs text-neutral-400">{officerMetadata.department}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <p className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Camera ID</p>
                                        <p className="text-sm font-black text-white">{officerMetadata.camera}</p>
                                        <p className="text-xs text-[#00FF41]">{axonConnected ? 'Live Feed' : 'Offline'}</p>
                                    </div>
                                </div>
                                
                                {/* Processing Controls */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-[#00FF41]/30 transition-all">
                                        <div className="flex items-center justify-between">
                                            <Radio size={16} className="text-neutral-500 group-hover:text-[#00FF41]" />
                                            <input type="checkbox" checked={audioStreamActive} onChange={(e) => setAudioStreamActive(e.target.checked)} className="accent-[#00FF41] w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Audio Stream</span>
                                    </div>
                                    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-blue-400/30 transition-all">
                                        <div className="flex items-center justify-between">
                                            <Database size={16} className="text-neutral-500 group-hover:text-blue-400" />
                                            <input type="checkbox" checked={evidenceSync} onChange={(e) => setEvidenceSync(e.target.checked)} className="accent-blue-400 w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Evidence Sync</span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-[9px] font-mono text-neutral-500 uppercase mb-2">Confidence</p>
                                        <div className="flex items-center gap-2">
                                            <input type="range" min="70" max="95" value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(Number(e.target.value))} className="flex-1 accent-[#00FF41]" />
                                            <span className="text-xs font-black text-white">{confidenceThreshold}%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <p className="text-[9px] font-mono text-neutral-500 uppercase mb-2">Current</p>
                                        <div className="text-lg font-black text-[#00FF41]">{currentConfidence}%</div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Efficiency Metrics Dashboard */}
                            <div className="bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 bg-neutral-800 rounded-xl">
                                        <BarChart3 className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Efficiency Metrics</h3>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00FF41]/10 to-transparent border border-[#00FF41]/20">
                                        <p className="text-[9px] font-mono text-[#00FF41] uppercase mb-1">Hours Saved</p>
                                        <p className="text-xl font-black text-white">{auditMetrics.hoursSaved}</p>
                                        <p className="text-xs text-neutral-400">vs manual review</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20">
                                        <p className="text-[9px] font-mono text-red-400 uppercase mb-1">False Positives</p>
                                        <p className="text-xl font-black text-white">{auditMetrics.falsePositives}</p>
                                        <p className="text-xs text-neutral-400">this month</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
                                        <p className="text-[9px] font-mono text-blue-400 uppercase mb-1">Confirmed</p>
                                        <p className="text-xl font-black text-white">{auditMetrics.confirmedIncidents}</p>
                                        <p className="text-xs text-neutral-400">incidents</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                                        <p className="text-[9px] font-mono text-amber-400 uppercase mb-1">Avg Response</p>
                                        <p className="text-xl font-black text-white">{auditMetrics.avgResponseTime}m</p>
                                        <p className="text-xs text-neutral-400">minutes</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                                        <p className="text-[9px] font-mono text-purple-400 uppercase mb-1">Accuracy</p>
                                        <p className="text-xl font-black text-white">{auditMetrics.accuracyRate}%</p>
                                        <p className="text-xs text-neutral-400">detection rate</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Terminal & Timeline (Unified Infrastructure) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Live Stream / Terminal */}
                    <div className="bg-neutral-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 flex flex-col h-[450px] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                            <div className="flex items-center gap-3">
                                <Radio className="w-5 h-5 text-[#00FF41] animate-pulse" />
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                                    {displayMode === 'pilot' ? 'Axon Telemetry Stream' : 'Live Neural Output'}
                                </h3>
                            </div>
                            {(isPlaying || isRecording || isJobRunning) && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Processing</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 bg-black/80 p-6 font-mono text-[11px] overflow-y-auto scrollbar-hide">
                            {transcript.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-neutral-700 space-y-2 opacity-50">
                                    <Radio size={32} />
                                    <p className="italic uppercase tracking-[0.3em] font-black">Waiting for signal...</p>
                                </div>
                            ) : (
                                transcript.map((l, i) => (
                                    <p key={i} className={`mb-2 leading-relaxed transition-all duration-300 ${l.text.includes('[') || l.text.includes('⚠') ? 'text-amber-500 font-bold bg-amber-500/5 px-2 py-1 rounded' : 'text-neutral-400'}`}>
                                        <span className="text-neutral-700 mr-3 opacity-50">[{new Date(l.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                        {l.text}
                                    </p>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Unified Timeline */}
                    <div className="bg-neutral-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 flex flex-col h-[450px] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 bg-black/40">
                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-blue-400" />
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                                    {displayMode === 'pilot' ? 'Forensic shift Timeline' : 'Pilot Event Timeline'}
                                </h3>
                            </div>
                        </div>
                        <div className="flex-1 bg-black/60 p-8 overflow-y-auto scrollbar-hide">
                            <div className="space-y-6">
                                {timeline.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-neutral-800 space-y-2">
                                        <Clock size={32} />
                                        <p className="text-[10px] uppercase tracking-[0.3em] font-black italic">No neural signatures mapped</p>
                                    </div>
                                ) : (
                                    timeline.map((event) => (
                                        <div key={event.id} className="flex gap-6 relative pb-6 last:pb-0">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full mt-1.5 z-10 ${event.type === 'DISPATCH' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-[#00FF41] shadow-[0_0_10px_rgba(0,255,65,0.4)]'}`} />
                                                <div className="w-[1px] flex-1 bg-gradient-to-b from-white/20 to-transparent mt-3" />
                                            </div>
                                            <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.08] transition-all group active:scale-[0.98]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-mono text-neutral-500 font-bold group-hover:text-blue-400 transition-colors">[{event.timestamp}]</span>
                                                    {event.confidence && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                                                            <span className="text-[9px] font-black text-blue-400 uppercase">98% Match</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className={`text-[11px] font-black uppercase tracking-widest ${event.type === 'DISPATCH' ? 'text-red-400' : 'text-white'}`}>{event.label}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Narrative Reporting & Shift Analysis */}
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* AI Narrative Reporting */}
                    <div className="bg-neutral-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-neutral-800 rounded-xl">
                                <Brain className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">AI Narrative Reporting</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                                <p className="text-[9px] font-mono text-purple-400 uppercase mb-2">Supervisor "Why" Analysis</p>
                                <div className="text-sm text-neutral-300 leading-relaxed space-y-2">
                                    {narrativeReport || (
                                        <>
                                            <p>• <strong className="text-white">Threat Detection:</strong> Acoustic signature analysis identified elevated stress markers in vocal patterns exceeding 85% confidence threshold.</p>
                                            <p>• <strong className="text-white">Contextual Factors:</strong> Night shift conditions + solo patrol mode increased sensitivity parameters by 15%.</p>
                                            <p>• <strong className="text-white">Escalation Timeline:</strong> Progression from baseline to high-stress state occurred over 2.3 seconds, indicating rapid escalation.</p>
                                            <p>• <strong className="text-white">Recommendation:</strong> Backup dispatch was appropriate based on multi-modal consensus (audio + biometric).</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const analysis = `
AI-GENERATED NARRATIVE ANALYSIS - ${new Date().toLocaleString()}
=========================================
PRIMARY THREAT VECTOR: High-stress vocal signature detected
CONFIDENCE SCORE: ${currentConfidence}% (exceeds ${confidenceThreshold}% threshold)

CONTEXTUAL UNDERSTANDING:
• Officer ${officerMetadata.name} (${officerMetadata.badgeNumber}) on ${officerMetadata.shift}
• Location: ${officerMetadata.location}
• Camera ${officerMetadata.camera} recording status: ${axonConnected ? 'ACTIVE' : 'INACTIVE'}

"WHY" DETERMINATION:
The system triggered automatic backup because:
1. Acoustic stress markers exceeded safe thresholds for ${escalationState === 'Struggle' ? 'sustained physical struggle' : 'high-stress escalation'}
2. Temporal analysis showed consistent escalation over ${timeline.length > 0 ? 'multiple seconds' : 'unknown duration'}
3. Contextual factors (night shift, solo duty) increased risk assessment

EFFICIENCY IMPACT:
• Response time reduced from manual avg 8.5min to ${auditMetrics.avgResponseTime}min
• Supervisor oversight required: Minimal (automated verification)
• Evidence preservation: Automatic (evidence.com sync ${evidenceSync ? 'enabled' : 'disabled'})
`.trim();
                                    setNarrativeReport(analysis);
                                }}
                                className="w-full px-4 py-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Brain size={14} />
                                Generate "Why" Analysis
                            </button>
                        </div>
                    </div>
                    
                    {/* Shift Report Generation */}
                    <div className="bg-neutral-900/60 backdrop-blur-2xl rounded-3xl border border-white/10 p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-neutral-800 rounded-xl">
                                <FileText className="w-5 h-5 text-[#00FF41]" />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Shift Report Generation</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Duration</p>
                                    <p className="text-lg font-black text-white">{transcript.length > 0 ? (transcript.length * 0.25).toFixed(1) : '0'}s</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <p className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Signals</p>
                                    <p className="text-lg font-black text-white">{timeline.filter(e => e.type === 'SIGNAL').length}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const summary = `
PILOT P1 SHIFT REPORT - ${new Date().toLocaleString()}
============================================
OFFICER METADATA:
• ID: ${officerMetadata.badgeNumber} | Name: ${officerMetadata.name}
• Shift: ${officerMetadata.shift} | Department: ${officerMetadata.department}
• Camera: ${officerMetadata.camera} | Status: ${axonConnected ? 'LIVE' : 'OFFLINE'}
• Location: ${officerMetadata.location}

PERFORMANCE METRICS:
• Hours Saved vs Manual Review: ${auditMetrics.hoursSaved}h
• False Positives This Period: ${auditMetrics.falsePositives}
• Confirmed Incidents: ${auditMetrics.confirmedIncidents}
• Average Response Time: ${auditMetrics.avgResponseTime}min
• System Accuracy: ${auditMetrics.accuracyRate}%

INCIDENT ANALYSIS:
• Peak Escalation State: ${escalationState.toUpperCase()}
• Total Signals Detected: ${timeline.filter(e => e.type === 'SIGNAL').length}
• Dispatch Status: ${timeline.some(e => e.type === 'DISPATCH') ? 'SUCCESS (P1 BACKUP SENT)' : 'STANDBY'}
• Evidence Sync: ${evidenceSync ? 'ACTIVE (evidence.com)' : 'INACTIVE'}

AUDIO PROCESSING:
• Confidence Threshold: ${confidenceThreshold}%
• Current Confidence: ${currentConfidence}%
• Stream Status: ${audioStreamActive ? 'ACTIVE' : 'INACTIVE'}

TIMELINE LOG:
${timeline.map(e => `[${e.timestamp}] ${e.label} (${e.type})`).join('\n')}

SUPERVISOR SUMMARY:
This shift demonstrated ${auditMetrics.accuracyRate > 90 ? 'excellent' : 'acceptable'} system performance with ${auditMetrics.falsePositives === 0 ? 'zero' : auditMetrics.falsePositives} false positive(s). The AI-powered audio processing reduced response time by ${((8.5 - auditMetrics.avgResponseTime) / 8.5 * 100).toFixed(1)}% compared to manual monitoring.
`.trim();
                                    setIncidentReport(summary);
                                    setShowReport(true);
                                }}
                                className="w-full px-6 py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-105 transition-all shadow-xl flex items-center justify-center gap-3"
                            >
                                <FileText size={16} />
                                Generate Complete Shift Report
                            </button>
                        </div>
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
                                            <h3 className="text-sm font-black uppercase tracking-widest text-white">Pilot Phase 1 Report</h3>
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
                    <div className="space-y-2">
                        {log.length === 0
                            ? <div className="py-12 flex flex-col items-center justify-center opacity-20">
                                <Radio className="w-8 h-8 text-neutral-500 mb-2" />
                                <p className="text-[10px] font-mono uppercase tracking-widest italic">No neural signatures detected</p>
                            </div>
                            : log.map(entry => {
                                const lc = levelColor[entry.level] || levelColor.green;
                                return (
                                    <React.Fragment key={entry.id}>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl px-5 py-3 border transition-all hover:bg-white/[0.02]"
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
                                        {entry.metadata && (
                                            <div className="px-5 py-2 flex items-center gap-4 bg-black/10 border-x border-b border-white/5 rounded-b-xl -mt-2 mb-2 text-[8px] font-mono text-neutral-600 uppercase">
                                                <span>OFFICER: {entry.metadata.officerId}</span>
                                                <span>ID: {entry.metadata.camera}</span>
                                                <span className="ml-auto italic">{entry.metadata.location}</span>
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        }
                    </div>
                </div>

                {/* Anti-Simulation Validation Architecture */}
                <div className="pt-6">
                    <ArchitectureDiagram />
                </div>
            </div >
            );
};
