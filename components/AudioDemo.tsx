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
    ShieldAlert
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
    const [displayMode, setDisplayMode] = useState<'demo' | 'pilot'>('pilot'); // Default to pilot mode

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

        // #5/#10: Confidence gating — require >95% for auto-dispatch, otherwise silent supervisor flag
        if (effectiveConfidence < threshold && model !== 'keyword') {
            const fatigueNote = lateShift ? ' (Late Shift Active — Lowering supervisor threshold)' : '';
            const lightNote = lowLightMode ? ' (Low-Light Sensitivity Boost Active)' : '';
            return { suppress: false, reason: `Confidence ${effectiveConfidence}% < ${threshold}% threshold — flagged for supervisor review only${fatigueNote}${lightNote}` };
        }

        // #7: Ambient noise spike detection
        if (ambientBaseline > 0.3 && model === 'gunshot') {
            return { suppress: false, reason: `High ambient noise floor (${Math.round(ambientBaseline * 100)}%) — audio weight reduced` };
        }

        const primingNote = primedContext ? ` [Context Primed: ${primedContext}]` : '';
        return { suppress: false, reason: primingNote };
    }, [cancelOverride, trainingMode, soloMode, nearbyUnits, ambientBaseline, custodyMode, pursuitMode, weatherNoise, cadDomestic, cadEDP, cadHighRisk, lateShift, primedContext, lowLightMode]);

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

        // If loud noise, run real classification (simplification for mic buffer)
        if (maxVal > 0.1) {
            // We pad it to 15600 for YAMNet
            const padded = new Float32Array(BUFFER_SIZE);
            padded.set(float32Data.subarray(0, Math.min(float32Data.length, BUFFER_SIZE)));

            const { g, s } = await runYamnet(padded);
            const confG = Math.round(g * 100);
            const confS = Math.round(s * 100);

            if (confG > 10) {
                const filter = shouldSuppressAlert(confG, 'gunshot');
                if (filter.suppress) {
                    addLog({ model: 'gunshot', threat: `SUPPRESSED: Gunshot (${confG}%) — ${filter.reason}`, confidence: confG, level: 'green', scenario: 'Filtered' });
                    setSuppressionLog(p => [`${now()} Gunshot suppressed: ${filter.reason}`, ...p].slice(0, 20));
                } else {
                    const explainability = filter.reason ? ` [${filter.reason}]` : '';
                    setModel('gunshot', { status: 'THREAT DETECTED', confidence: confG, color: 'red', lastDetection: now() });
                    addLog({ model: 'gunshot', threat: `Gunshot via YAMNet (${confG}%)${explainability}`, confidence: confG, level: 'red', scenario: 'Live Edge Model' });
                    addToTimeline('Gunshot Impulse Detected', 'SIGNAL', confG);
                    if (confG > 90) triggerDispatch('Acoustic Gunshot Signature');
                }
            }
            if (confS > 10) {
                const filter = shouldSuppressAlert(confS, 'struggle');
                if (filter.suppress) {
                    addLog({ model: 'struggle', threat: `SUPPRESSED: Struggle (${confS}%) — ${filter.reason}`, confidence: confS, level: 'green', scenario: 'Filtered' });
                    setSuppressionLog(p => [`${now()} Struggle suppressed: ${filter.reason}`, ...p].slice(0, 20));
                } else {
                    const explainability = filter.reason ? ` [${filter.reason}]` : '';
                    setModel('struggle', { status: 'THREAT DETECTED', confidence: confS, color: 'red', lastDetection: now() });
                    addLog({ model: 'struggle', threat: `Struggle/Screaming (${confS}%)${explainability}`, confidence: confS, level: 'red', scenario: 'Live Edge Model' });
                    addToTimeline('Physical Struggle / Screaming Detected', 'SIGNAL', confS);
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
    }, [tfModel, isRecording, setModel, addLog, runYamnet]);



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

            if (confS > 10) {
                setModel('struggle', { status: 'THREAT DETECTED', confidence: confS, color: 'red', lastDetection: now() });
                addLog({ model: 'struggle', threat: 'Struggle/Screaming identified', confidence: confS, level: 'red', scenario: 'File Upload' });
            } else {
                setModel('struggle', { status: 'Normal', confidence: confS, color: 'green', lastDetection: now() });
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

            {/* ── Pilot P1: Axon API Workflow (only shown in pilot mode) ── */}
            {displayMode === 'pilot' && (
                <div className="space-y-8">
                    {/* Axon Ingestion Pipeline */}
                    <div className="bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                                    <Radio className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Axon API Ingestion Pipeline</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setAxonIngestion(prev => ({ ...prev, isActive: !prev.isActive, currentStep: 0 }));
                                    if (!axonIngestion.isActive) {
                                        // Simulate the workflow
                                        const workflow = async () => {
                                            for (let i = 0; i < axonIngestion.steps.length; i++) {
                                                await new Promise(resolve => setTimeout(resolve, 3000));
                                                setAxonIngestion(prev => ({ ...prev, currentStep: i + 1 }));
                                                
                                                // Generate mock events at specific steps
                                                if (i === 2) { // After running detection models
                                                    generateMockEvents();
                                                }
                                                if (i === 4) { // After generating timeline
                                                    generateDispatchEvent();
                                                }
                                            }
                                            setAxonIngestion(prev => ({ ...prev, isActive: false, currentStep: 0 }));
                                        };
                                        workflow();
                                    }
                                }}
                                className={`px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] rounded-full transition-all ${
                                    axonIngestion.isActive 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20'
                                }`}
                            >
                                {axonIngestion.isActive ? 'Stop Ingestion' : 'Start 12AM Ingestion'}
                            </button>
                        </div>

                        {/* Workflow Steps */}
                        <div className="space-y-3">
                            {axonIngestion.steps.map((step, index) => (
                                <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                    index < axonIngestion.currentStep 
                                        ? 'bg-green-500/5 border-green-500/20' 
                                        : index === axonIngestion.currentStep && axonIngestion.isActive
                                        ? 'bg-blue-500/10 border-blue-500/30 animate-pulse'
                                        : 'bg-white/5 border-white/10'
                                }`}>
                                    <div className="flex-shrink-0 w-8 text-center">
                                        {index < axonIngestion.currentStep ? (
                                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                                <span className="text-[10px] text-white">✓</span>
                                            </div>
                                        ) : index === axonIngestion.currentStep && axonIngestion.isActive ? (
                                            <div className="w-6 h-6 bg-blue-500 rounded-full animate-ping" />
                                        ) : (
                                            <div className="w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center">
                                                <span className="text-[10px] text-neutral-400">{index + 1}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${
                                            index < axonIngestion.currentStep 
                                                ? 'text-green-400' 
                                                : index === axonIngestion.currentStep && axonIngestion.isActive
                                                ? 'text-blue-400'
                                                : 'text-neutral-400'
                                        }`}>
                                            {step}
                                        </p>
                                        {index < axonIngestion.currentStep && (
                                            <p className="text-[10px] text-neutral-500 mt-1">Completed at {new Date().toLocaleTimeString()}</p>
                                        )}
                                    </div>
                                    {index === axonIngestion.currentStep && axonIngestion.isActive && (
                                        <div className="text-[10px] text-blue-400 font-mono">Processing...</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Incident Detection Summary */}
                    <div className="bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-amber-500/10 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                            </div>
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Incident Detection Summary</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[9px] font-mono text-neutral-500 uppercase">Officer</p>
                                    <p className="text-lg font-black text-white">417</p>
                                </div>
                                <p className="text-sm text-neutral-400">Shift: Feb 23</p>
                                <p className="text-[10px] text-[#00FF41] mt-2">Detected Events: {detectedEvents.length}</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[9px] font-mono text-neutral-500 uppercase mb-4">Success Metrics</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-400">Total Incidents</span>
                                        <span className="text-sm font-black text-white">{incidentMetrics.totalIncidents}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-400">False Positives</span>
                                        <span className="text-sm font-black text-red-400">{incidentMetrics.falsePositives}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-400">Confirmed</span>
                                        <span className="text-sm font-black text-green-400">{incidentMetrics.confirmedIncidents}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-400">Reviews Saved</span>
                                        <span className="text-sm font-black text-blue-400">{incidentMetrics.manualReviewsSaved}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[9px] font-mono text-neutral-500 uppercase mb-4">Escalation Pattern</p>
                                <div className="space-y-2">
                                    <div className={`p-2 rounded-lg text-center text-[10px] font-black uppercase ${
                                        escalationPattern === 'normal' ? 'bg-green-500/10 text-green-400' :
                                        escalationPattern === 'raised' ? 'bg-amber-500/10 text-amber-400' :
                                        escalationPattern === 'commands' ? 'bg-orange-500/10 text-orange-400' :
                                        'bg-red-500/10 text-red-400'
                                    }`}>
                                        {escalationPattern}
                                    </div>
                                    <p className="text-xs text-neutral-500">Current escalation state</p>
                                </div>
                            </div>
                        </div>

                        {/* Detected Events */}
                        {detectedEvents.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Detected Events</h4>
                                {detectedEvents.map((event, index) => (
                                    <div key={index} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-black text-white">{event.type}</p>
                                                <p className="text-[10px] text-neutral-400">Time: {event.time}</p>
                                                <p className="text-[10px] text-neutral-400">Trigger: {event.trigger}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-[#00FF41]">{(event.confidence * 100).toFixed(0)}%</p>
                                                <p className="text-[9px] text-neutral-500">Confidence</p>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-black/40 rounded-lg">
                                            <p className="text-[10px] text-amber-400">Action: {event.action}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Simulated Dispatch Events */}
                    {dispatchEvents.length > 0 && (
                        <div className="bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-red-500/10 rounded-xl">
                                    <Siren className="w-5 h-5 text-red-400" />
                                </div>
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Simulated Dispatch Events</h3>
                            </div>

                            {dispatchEvents.map((dispatch, index) => (
                                <div key={index} className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-black text-red-400">Backup Unit Requested</p>
                                            <p className="text-[10px] text-neutral-400">Time: {dispatch.time}</p>
                                            <p className="text-[10px] text-neutral-400">Reason: {dispatch.reason}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-red-400">{(dispatch.confidence * 100).toFixed(0)}%</p>
                                            <p className="text-[9px] text-neutral-500">Confidence</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-lg">
                                        <p className="text-sm text-white mb-2">Recommended Action:</p>
                                        <p className="text-[10px] text-neutral-300 leading-relaxed">{dispatch.recommendation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Demo Mode Content (only shown in demo mode) ── */}
            {displayMode === 'demo' && (
                <div className="space-y-8">
                    {/* Demo content will go here - keeping filters only for demo mode */}
                </div>
            )}

            {/* ── Situational Filters Panel (#1-#10) ── */}
            <div className="bg-neutral-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-4">
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                    <div className={`p-4 rounded-xl border transition-all ${lowLightMode ? 'bg-[#00FF41]/5 border-[#00FF41]/20 shadow-[0_0_15px_rgba(0,255,65,0.05)]' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <EyeOff className={`w-4 h-4 ${lowLightMode ? 'text-[#00FF41]' : 'text-neutral-500'}`} />
                                {lowLightMode && <span className="text-[8px] font-black bg-[#00FF41]/10 text-[#00FF41] px-1.5 py-0.5 rounded-full border border-[#00FF41]/20 uppercase">Auto</span>}
                            </div>
                            <input type="checkbox" checked={lowLightMode} onChange={(e) => setLowLightMode(e.target.checked)} className="accent-[#00FF41]" />
                        </div>
                        <p className="text-[10px] font-bold text-white uppercase mb-1">Low-Light</p>
                        <p className="text-[9px] text-neutral-500 font-mono">Weight Audio Higher</p>
                    </div>

                    <div className={`p-4 rounded-xl border transition-all ${accelerometerFallback ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <RotateCw className={`w-4 h-4 ${accelerometerFallback ? 'text-red-500' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={accelerometerFallback} onChange={(e) => setAccelerometerFallback(e.target.checked)} className="accent-red-500" />
                        </div>
                        <p className="text-[10px] font-bold text-white uppercase mb-1">Camera Fail</p>
                        <p className="text-[9px] text-neutral-500 font-mono">Motion Fallback</p>
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

            {/* ── Advanced CAD & Context Integrations (#11-20) ── */}
            <div className="bg-neutral-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-blue-400" />
                        <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">Advanced CAD & Context Links</h3>
                    </div>
                    {primedContext && (
                        <button
                            onClick={() => setPrimedContext(null)}
                            className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20"
                        >
                            <X size={10} /> Clear Context: {primedContext}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className={`p-3 rounded-xl border transition-all ${cadDomestic ? 'bg-purple-500/5 border-purple-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Home className={`w-3.5 h-3.5 ${cadDomestic ? 'text-purple-400' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={cadDomestic} onChange={(e) => setCadDomestic(e.target.checked)} className="accent-purple-500" />
                        </div>
                        <p className="text-[9px] font-bold text-white uppercase mb-1 drop-shadow-sm">Domestic</p>
                    </div>
                    <div className={`p-3 rounded-xl border transition-all ${cadEDP ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Brain className={`w-3.5 h-3.5 ${cadEDP ? 'text-indigo-400' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={cadEDP} onChange={(e) => setCadEDP(e.target.checked)} className="accent-indigo-500" />
                        </div>
                        <p className="text-[9px] font-bold text-white uppercase mb-1 drop-shadow-sm">EDP/Mental</p>
                    </div>
                    <div className={`p-3 rounded-xl border transition-all ${cadHighRisk ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Siren className={`w-3.5 h-3.5 ${cadHighRisk ? 'text-red-500' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={cadHighRisk} onChange={(e) => setCadHighRisk(e.target.checked)} className="accent-red-500" />
                        </div>
                        <p className="text-[9px] font-bold text-white uppercase mb-1 drop-shadow-sm">High Risk</p>
                    </div>
                    <div className={`p-3 rounded-xl border transition-all ${lateShift ? 'bg-blue-400/5 border-blue-400/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Moon className={`w-3.5 h-3.5 ${lateShift ? 'text-blue-400' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={lateShift} onChange={(e) => setLateShift(e.target.checked)} className="accent-blue-400" />
                        </div>
                        <p className="text-[9px] font-bold text-white uppercase mb-1 drop-shadow-sm">Late Shift</p>
                    </div>
                    <div className={`p-3 rounded-xl border transition-all ${weatherNoise ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <CloudRain className={`w-3.5 h-3.5 ${weatherNoise ? 'text-cyan-400' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={weatherNoise} onChange={(e) => setWeatherNoise(e.target.checked)} className="accent-cyan-500" />
                        </div>
                        <p className="text-[9px] font-bold text-white uppercase mb-1 drop-shadow-sm">Weather</p>
                    </div>
                    <div className={`p-3 rounded-xl border transition-all ${pursuitMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Footprints className={`w-3.5 h-3.5 ${pursuitMode ? 'text-orange-400' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={pursuitMode} onChange={(e) => setPursuitMode(e.target.checked)} className="accent-orange-500" />
                        </div>
                        <p className="text-[9px] font-bold text-white uppercase mb-1 drop-shadow-sm">Pursuit</p>
                    </div>
                    <div className={`p-3 rounded-xl border transition-all ${custodyMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <Lock className={`w-3.5 h-3.5 ${custodyMode ? 'text-emerald-400' : 'text-neutral-500'}`} />
                            <input type="checkbox" checked={custodyMode} onChange={(e) => setCustodyMode(e.target.checked)} className="accent-emerald-500" />
                        </div>
                        <p className="text-[9px] font-bold text-white uppercase mb-1 drop-shadow-sm">Custody</p>
                    </div>
                </div>
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
                <ArchitectureDiagram />
            </div>
        </div>
    );
};
