
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Shield, PenTool, Radio, Fingerprint, Activity, MessageSquare, Database, Cpu, Terminal, ArrowUpRight } from 'lucide-react';

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

const guardianFeatures = [
  { icon: <Shield />, title: "Guardian Overwatch", desc: "Computer Vision scans BWC feeds for weapons, 'bladed' stances, and sudden suspect movements." },
  { icon: <Activity />, title: "Physiological Overwatch", desc: "Pairs with Apple Watch/Garmin. Auto-increases sampling rate if HR spikes to 140+ BPM while on a call." },
  { icon: <MessageSquare />, title: "Voice-Stress Trigger", desc: "NLP monitors for high-arousal vocal tones and safety keywords like '10-33' or 'Gun!'" },
  { icon: <Radio />, title: "Autonomous Lifeline", desc: "Autonomous dispatch of Priority 1 backup directly into CAD if a struggle or weapon is detected." },
  { icon: <ArrowUpRight />, title: "Kinematic Intent", desc: "AI analyzes velocity and weight distribution to detect attack 'load' signatures 500ms before initiation." },
  { icon: <Terminal />, title: "Tactical Whisperer", desc: "Relays critical data directly into the officer’s Bluetooth earpiece in short, tactical bursts." }
];

const scribeFeatures = [
  { icon: <Database />, title: "Fact Anchoring", desc: "Creates a timestamped 'Fact Log' in real-time so officers never rely on memory for report writing." },
  { icon: <PenTool />, title: "Dictation Overlay", desc: "Officers can 'talk' to the partner during the scene: 'Vantus, mark that blue Toyota as a witness vehicle.'" },
  { icon: <Fingerprint />, title: "Forensic Audit Trail", desc: "Every observation is millisecond-timestamped to the video for SB 524 compliance." },
  { icon: <Cpu />, title: "Edge-AI Processing", desc: "Threat models run locally on the smartphone's NPU. Detection works without cellular connection." }
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
  { type: 'SYS', text: 'Analyzing subject kinematics...' },
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
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/product-bg.jpg"
          className="w-full h-full object-cover opacity-40 grayscale brightness-75"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30" />
      </div>

      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#00FF41]/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-[#00FF41]/3 blur-[100px] rounded-full pointer-events-none z-0" />

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
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-tight">Superior<br />Capabilities.</h2>
          </MotionDiv>
          <MotionP
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.3em] border-l-2 border-[#00FF41] pl-8 py-4 max-w-sm leading-relaxed"
          >
            Tactical oversight engineered from first principles. High-performance partner logic for volatile field operations.
          </MotionP>
        </div>

        <div className="mb-32">
          <MotionDiv
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-xl font-black uppercase italic text-[#00FF41] mb-12 flex items-center gap-6"
          >
            <span className="px-4 py-1.5 bg-[#00FF41] text-black not-italic text-sm font-black">A</span> The Guardian Layer
          </MotionDiv>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guardianFeatures.map((f, i) => (
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
            <span className="px-4 py-1.5 bg-neutral-800 text-white not-italic text-sm font-black">B</span> The Scribe Layer
          </MotionDiv>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
