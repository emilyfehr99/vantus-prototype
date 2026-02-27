
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Shield, PenTool, Radio, Fingerprint, Activity, MessageSquare, Database, Cpu, Terminal, ArrowUpRight, ChevronDown, CheckCircle2, Lock, Eye, Zap, Volume2, Video } from 'lucide-react';

// Define FeatureCardProps to properly handle React props including 'key'
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color?: "green" | "red" | "white";
  index: number;
}

// Using React.FC allows the component to correctly accept standard props like 'key' in a list context
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color = "green", index }) => {
  const MotionDiv = motion.div as any;
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const spotlightX = useSpring(mouseX, springConfig);
  const spotlightY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const isGreen = color === "green";

  // Dynamic styling based on layer type
  const borderStyle = isGreen
    ? "border-neutral-900 hover:border-[#00FF41]/40"
    : "border-neutral-900/50 border-dashed hover:border-neutral-500/60 hover:border-solid";

  const shadowStyle = isGreen
    ? "shadow-[0_0_20px_rgba(0,255,65,0.02)]"
    : "group-hover:shadow-[0_0_30px_rgba(255,255,255,0.02)]";

  const iconColorClass = isGreen
    ? "group-hover:text-[#00FF41]"
    : "group-hover:text-white";

  const accentColor = isGreen ? "bg-[#00FF41]" : "bg-neutral-600";

  return (
    <MotionDiv
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`bg-neutral-950 border p-8 space-y-8 group transition-all duration-500 overflow-hidden relative ${borderStyle} ${shadowStyle}`}
    >
      {/* Dynamic Background Pattern for Scribe Layer */}
      {!isGreen && (
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:16px_16px] group-hover:opacity-[0.05] transition-opacity" />
      )}

      {/* Spotlight Effect */}
      <MotionDiv
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(400px circle at ${spotlightX}px ${spotlightY}px, ${isGreen ? 'rgba(0, 255, 65, 0.05)' : 'rgba(255, 255, 255, 0.03)'}, transparent 80%)`,
        }}
      />

      <div className={`text-neutral-500 transition-colors duration-500 ${iconColorClass}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 28 })}
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-sm uppercase tracking-tight text-white">{title}</h4>
          <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-neutral-600" />
        </div>
        <p className={`text-xs leading-relaxed font-mono ${isGreen ? 'text-neutral-500' : 'text-neutral-400'}`}>
          {desc}
        </p>
      </div>

      {/* Left Accent Bar */}
      <div className={`absolute top-0 left-0 w-[2px] h-0 ${accentColor} group-hover:h-full transition-all duration-700 delay-100`} />
    </MotionDiv>
  );
};

const AccordionItem: React.FC<{ title: string, badge?: string, defaultOpen?: boolean, children: React.ReactNode }> = ({ title, badge, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-neutral-800 bg-neutral-950 mb-4 overflow-hidden rounded-sm transition-all duration-300">
      <button
        className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-900 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <span className="font-black text-lg text-white uppercase">{title}</span>
          {badge && <span className="px-3 py-1 bg-neutral-800 text-[10px] font-mono text-neutral-400 rounded-sm">{badge}</span>}
        </div>
        <div className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="text-neutral-500" />
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-6 pt-0 border-t border-neutral-900 text-neutral-400 font-mono text-sm leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const additionalSafetyFeatures = [
  { icon: <Activity />, title: "Stress Biometric Sync", desc: "(Optional) Syncs via Bluetooth wearables like Apple Watch." },
  { icon: <Eye />, title: "Peripheral Overwatch", desc: "CV for secondary suspects in the officer's periphery." },
  { icon: <Zap />, title: "Pre-Arrival Intel", desc: "Live stream + AI assessment broadcasted to responding units." }

];

const scribeFeatures = [
  { icon: <Database />, title: "Real-Time Fact Anchoring", desc: "Timestamped \"Fact Log\" (e.g., \"14:02:11 - Audio: Gunshot detected\")." },
  { icon: <PenTool />, title: "Auto-Documentation", desc: "Generates report draft within 15 minutes; officer reviews/edits." },
  { icon: <MessageSquare />, title: "Dictation Overlay", desc: "Voice commands (e.g., \"Vantus, mark blue Toyota as witness vehicle\")." },
  { icon: <CheckCircle2 />, title: "Forensic Audit Trail", desc: "Timestamped AI observations for compliance (e.g., CA SB 524)." },
  { icon: <Lock />, title: "Volatile Evidence Locking", desc: "Write-only buffer; data evaporates unless trigger locks it to immutable storage." }
];

interface LogEntry {
  id: number;
  time: string;
  type: 'SYS' | 'LOG' | 'ALERT';
  message: string;
}

const DYNAMIC_MESSAGES = [
  { type: 'SYS', text: 'Scanning env... Sector 4 clear.' },
  { type: 'SYS', text: 'Peripheral motion: 6 o\'clock position.' },
  { type: 'LOG', text: 'Biometric Alert: HR spike > 145 BPM.' },
  { type: 'SYS', text: 'Analyzing subject behavioral audio...' },
  { type: 'ALERT', text: 'THREAT DETECTED: BLADED STANCE.' },
  { type: 'LOG', text: 'Voice Stress: High Arousal Detected.' },
  { type: 'ALERT', text: 'WEAPON SIGNATURE: KNIFE (98%).' },
  { type: 'SYS', text: 'Autonomous Lifeline Triggered.' },
  { type: 'LOG', text: 'Dispatch Notified: Priority 1 Backup.' },
  { type: 'SYS', text: 'GPS Coordinates Sent to CAD.' },

];

const LiveTacticalFeed = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logId = useRef(0);
  const MotionDiv = motion.div as any;
  const feedContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const addLog = () => {
      const msgTemplate = DYNAMIC_MESSAGES[Math.floor(Math.random() * DYNAMIC_MESSAGES.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newEntry: LogEntry = {
        id: logId.current++,
        time: timeStr,
        type: msgTemplate.type as any,
        message: msgTemplate.text
      };

      setLogs(prev => [newEntry, ...prev].slice(0, 8));
    };

    const interval = setInterval(addLog, 2500);
    addLog();
    return () => clearInterval(interval);
  }, []);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mt-32 p-8 md:p-12 bg-[#050505] border border-neutral-900 rounded-sm relative overflow-hidden group min-h-[400px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
    >
      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#00FF41_1px,transparent_1px),linear-gradient(to_bottom,#00FF41_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-neutral-900">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse shadow-[0_0_8px_#00FF41]" />
            <span className="font-mono text-[10px] text-[#00FF41] uppercase tracking-[0.4em] font-bold">Situational Overwatch v4.2</span>
          </div>
          <div className="font-mono text-[8px] text-neutral-700 uppercase flex items-center gap-4 tracking-widest">
            <span className="animate-pulse">Buffer: Synchronized</span>
            <span>Uptime: 142.04.11</span>
            <span className="text-white">Enc: AES-XTS</span>
          </div>
        </div>

        <div className="space-y-4 font-mono text-[11px] h-[280px] overflow-hidden relative" ref={feedContainerRef}>
          <AnimatePresence initial={false} mode="popLayout">
            {logs.map((log) => (
              <MotionDiv
                key={log.id}
                layout
                initial={{ opacity: 0, x: -30, filter: 'blur(10px)', skewX: -10 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  filter: 'blur(0px)',
                  skewX: 0,
                  backgroundColor: log.type === 'ALERT' ? ['rgba(255,59,48,0.4)', 'rgba(255,59,48,0.05)'] : 'rgba(0,0,0,0)'
                }}
                exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 30,
                  layout: { duration: 0.3 }
                }}
                className={`flex gap-6 group py-1.5 px-3 rounded-sm relative overflow-hidden transition-all duration-300 ${log.type === 'ALERT' ? 'border-l-2 border-[#FF3B30] bg-[#FF3B30]/5' : 'hover:bg-white/[0.02]'
                  }`}
              >
                <span className="text-neutral-700 w-16 shrink-0 font-bold">{log.time}</span>
                <span className={`font-black w-12 shrink-0 tracking-tighter ${log.type === 'ALERT' ? 'text-[#FF3B30] animate-pulse' :
                  log.type === 'SYS' ? 'text-[#00FF41]' :
                    'text-neutral-500'
                  }`}>
                  [{log.type}]
                </span>
                <span className={`flex-1 transition-colors duration-300 ${log.type === 'ALERT' ? 'text-white font-black uppercase' :
                  'text-neutral-400 group-hover:text-white'
                  }`}>
                  {log.message}
                </span>

                {/* Visual Sweep Effect */}
                <MotionDiv
                  initial={{ left: '-100%' }}
                  animate={{ left: '200%' }}
                  transition={{ duration: 1.2, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF41]/10 to-transparent pointer-events-none"
                />
              </MotionDiv>
            ))}
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <div className="mt-12 flex items-center justify-between pt-6 border-t border-neutral-900">
          <div className="flex gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-neutral-700 text-[7px] uppercase font-black tracking-widest">NPU Engine</span>
              <span className="text-[#00FF41] text-[10px] font-bold">OPT_LOAD_98%</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-neutral-700 text-[7px] uppercase font-black tracking-widest">Sync Latency</span>
              <span className="text-white text-[10px] font-bold">1.2 MS</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map(i => (
                <MotionDiv
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1.5 h-1.5 bg-[#00FF41]"
                />
              ))}
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-sm">
              <Terminal size={12} className="text-[#00FF41]" />
              <span className="text-neutral-500 text-[9px] uppercase tracking-widest font-black">Ready for Command_</span>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Glitch Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,255,0,0.06))] bg-[size:100%_2px,3px_100%]"></div>
    </MotionDiv>
  );
};

export const Product: React.FC = () => {
  const MotionDiv = motion.div as any;
  const MotionP = motion.p as any;

  return (
    <section className="py-40 px-6 bg-[#000000] border-t border-neutral-900 overflow-hidden relative">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#00FF41]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[#00FF41]/3 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <MotionDiv
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <span className="font-mono text-[#00FF41] text-[10px] tracking-[0.5em] uppercase font-black">Core Intelligence Suite</span>
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-tight">Active AI<br />Partner.</h2>
          </MotionDiv>
          <MotionP
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-neutral-400 font-mono text-[10px] uppercase tracking-[0.2em] border-l-2 border-[#00FF41] pl-8 py-4 max-w-lg leading-relaxed space-y-4"
          >
            <span className="block text-white">Unlike passive AI scribes built for post-incident paperwork, Vantus is an active safety mechanism.</span>
            <span className="block">Integrates seamlessly with existing Axon and Motorola body cams via secure APIs. Audio streams continuously for zero-latency threat detection, selectively pulling on-demand video only when a threat is confirmed—ensuring real-time overwatch without continuous streaming overhead.</span>
          </MotionP>
        </div>

        <div className="mb-32">
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-xl font-black uppercase italic text-[#00FF41] mb-12 flex items-center gap-6"
          >
            <span className="px-4 py-1.5 bg-[#00FF41] text-black not-italic text-sm font-black">A</span> Safety Features (The "Partner" Layer)
          </MotionDiv>

          <div className="mb-12">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Three-Tier Threat Detection System</h3>

            <AccordionItem title="Tier 1 (Audio-Only Alerts)" badge="Low Latency" defaultOpen={true}>
              <div className="space-y-4">
                <p><strong className="text-white">Voice-Stress Trigger:</strong> Natural Language Processing (NLP) monitors for "High-Arousal" vocal tones and specific "Code 3" keywords ("Drop it!", "10-33", "Gun!").</p>
                <p><strong className="text-white">Acoustic Sentinel:</strong> Spectral analysis detects gunshots (&gt;140dB impulse), glass breaking, impact sounds, struggle audio.</p>
                <div className="mt-4 p-4 bg-[#FF3B30]/10 border-l-2 border-[#FF3B30] text-[#FF3B30] font-black uppercase text-xs">
                  Action: SMS alert to dispatcher (human decides whether to send backup).
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="Tier 2 (Audio + Video Confirmed - Auto-Dispatch)" badge="Multi-Modal Consensus">
              <div className="space-y-4">
                <p><strong className="text-white">The "Guardian" Overwatch:</strong> When 2+ audio models agree, system pulls 30-second video clip on-demand (not continuous streaming).</p>
                <p><strong className="text-white">Computer Vision:</strong> Analyzes video for weapons (holstered or brandished), officer down/prone position, multiple attackers.</p>
                <p><strong className="text-white">Multi-Modal Consensus:</strong> Audio + Video confirmation required before triggering.</p>
                <p><strong className="text-white">Autonomous Dispatch (The "Silent 10-33"):</strong> If weapon detected + audio distress, Vantus auto-injects Priority 1 Backup Request via encrypted radio channel to officer's talkgroup.</p>
                <div className="mt-4 p-4 bg-[#FF3B30]/20 border-l-2 border-[#FF3B30] text-[#FF3B30] font-black uppercase text-xs animate-pulse">
                  Action: Backup is rolling in &lt;20 seconds from incident start.
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="Tier 3 (Officer Down - Emergency Protocol)" badge="Critical">
              <div className="space-y-4">
                <p><strong className="text-white">Silence Analysis:</strong> Impact sound + no radio activity for 10+ seconds.</p>
                <p><strong className="text-white">Video Confirmation:</strong> Pulls video to confirm officer on ground, not moving.</p>
                <div className="mt-4 p-4 bg-[#FF3B30] text-white font-black uppercase text-xs">
                  Action: Emergency radio broadcast to ALL units + automatic EMS notification + alerts nearest 5 units.
                </div>
              </div>
            </AccordionItem>
          </div>

          <h3 className="text-sm font-mono text-neutral-500 uppercase tracking-widest mb-6">Additional Safety Capabilities</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {additionalSafetyFeatures.map((f, i) => (

              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                color="green"
                index={i}
              />
            ))}
          </div>
        </div>

        <div className="mb-32">
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-xl font-black uppercase italic text-neutral-400 mb-12 flex items-center gap-6"
          >
            <span className="px-4 py-1.5 bg-neutral-800 text-white not-italic text-sm font-black">B</span> Documentation Features (The "Scribe" Layer)
          </MotionDiv>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scribeFeatures.map((f, i) => (
              <FeatureCard
                key={i}
                icon={f.icon}
                title={f.title}
                desc={f.desc}
                color="white"
                index={i}
              />
            ))}
          </div>
        </div>

        <LiveTacticalFeed />
      </div>
    </section>
  );
};
