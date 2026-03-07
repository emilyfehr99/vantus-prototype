
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0 }}
            className="overflow-hidden"
          >
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
  { icon: <Database />, title: "Real-Time Fact Anchoring", desc: "Timestamped AI observations (e.g., '14:02:11 - Audio: Gunshot detected (92%)'). Solves CA SB 524 forensic audit trail compliance." },
  { icon: <MessageSquare />, title: "Dictation Overlay", desc: "Speak voice commands during scene (e.g., \"Vantus, mark blue Toyota as witness vehicle\") for hands-free evidence tagging to timeline." }
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

const STATIC_LOGS: LogEntry[] = [];

const LiveTacticalFeed = () => {
  const MotionDiv = motion.div as any;
  const feedContainerRef = useRef<HTMLDivElement>(null);

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mt-20 p-8 md:p-10 bg-[#050505] border border-neutral-900 rounded-sm relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)]"
    >
      {/* Abstract tactical texture */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-[0.03] mix-blend-overlay pointer-events-none grayscale" />
      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#00FF41_1px,transparent_1px),linear-gradient(to_bottom,#00FF41_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-neutral-900">
          <div className="flex items-center gap-4">
          </div>
          <div className="font-mono text-[8px] text-neutral-800 uppercase flex items-center gap-4 tracking-widest">
            <span>System: Active</span>
          </div>
        </div>

        <div className="space-y-3 font-mono text-[10px] overflow-hidden relative" ref={feedContainerRef}>
          {STATIC_LOGS.map((log) => (
            <MotionDiv
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                backgroundColor: log.type === 'ALERT' ? 'rgba(255,59,48,0.05)' : 'rgba(0,0,0,0)'
              }}
              className={`flex gap-4 group py-1.5 px-3 rounded-sm relative overflow-hidden transition-all duration-300 ${log.type === 'ALERT' ? 'border-l-2 border-[#FF3B30] bg-[#FF3B30]/5' : ''
                }`}
            >
              <span className={`font-black w-14 shrink-0 tracking-tighter ${log.type === 'ALERT' ? 'text-[#FF3B30]' :
                log.type === 'SYS' ? 'text-[#00FF41]' :
                  'text-neutral-500'
                }`}>
                [{log.type}]
              </span>
              <span className={`flex-1 transition-colors duration-300 ${log.type === 'ALERT' ? 'text-white font-black uppercase' :
                'text-neutral-400'
                }`}>
                {log.message}
              </span>
            </MotionDiv>
          ))}
        </div>

        {/* Status Bar */}
        <div className="mt-8 pt-6 border-t border-neutral-900/50">
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
    <section className="py-20 md:pt-40 md:pb-12 px-6 bg-[#000000] border-t border-neutral-900 overflow-hidden relative">
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

            <AccordionItem title="TIER 1: Audio-Only Alerts (Low-Medium Confidence)" badge="Low Latency" defaultOpen={true}>
              <div className="space-y-4">
                <p><strong className="text-white">Real-time Gunshot Detection:</strong> &gt;140dB impulse signature.</p>
                <p><strong className="text-white">Keyword Spotting:</strong> Distress phrases like "shots fired," "10-33," "officer down," "help," "gun," "knife," "drop it."</p>
                <p><strong className="text-white">Struggle Sound Detection:</strong> Impacts, grunting, glass breaking, heavy breathing, vocal stress.</p>
                <div className="mt-4 p-4 bg-[#FF3B30]/10 border-l-2 border-[#FF3B30] text-[#FF3B30] font-black uppercase text-xs">
                  Action: SMS alert sent to dispatcher with timestamp, GPS location, and 30-second audio clip. Dispatcher makes final decision on sending backup.
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="TIER 2: Audio + Video Confirmed Threats (High Confidence - Auto-Dispatch)" badge="Automated Dispatch">
              <div className="space-y-4">
                <p><strong className="text-white">Multi-Modal Trigger:</strong> Triggered when 2+ audio models agree (&gt;80% confidence each).</p>
                <p><strong className="text-white">Video Confirmation:</strong> System pulls 30-second video clip on-demand (15 sec before + 15 sec after trigger).</p>
                <p><strong className="text-white">Computer Vision:</strong> YOLO weapon detection (handguns, rifles, knives visible) + Person detection/threat posture analysis (multiple attackers, fighting stance).</p>
                <div className="mt-4 p-4 bg-[#FF3B30]/20 border-l-2 border-[#FF3B30] text-[#FF3B30] font-black uppercase text-xs">
                  Action: Automatic RoIP dispatch broadcast: "Unit [badge], automatic backup alert. Officer [name], [address]. [Threat type]. Backup units respond Code 3." + SMS alert to dispatch supervisor verifying auto-dispatch was sent.
                </div>
              </div>
            </AccordionItem>

            <AccordionItem title="TIER 3: Officer Down - Emergency Protocol" badge="Critical">
              <div className="space-y-4">
                <p><strong className="text-white">Silence Analysis:</strong> Impact sound detection + silence analysis (&gt;10 seconds no radio activity).</p>
                <p><strong className="text-white">Horizon Line Shift:</strong> Officer prone/unconscious via accelerometer + video.</p>
                <p><strong className="text-white">Continuous Monitoring:</strong> Real-time assessment updates if officer regains consciousness.</p>
                <div className="mt-4 p-4 bg-[#FF3B30] text-white font-black uppercase text-xs">
                  Action: Emergency RoIP broadcast to ALL units: "Unit [badge], OFFICER DOWN. [Address]. No response detected. All units Code 3." + SMS to all on-duty supervisors + Automatic EMS notification + Alert sent to nearest 5 units.
                </div>
              </div>
            </AccordionItem>
          </div>

          <h3 className="text-sm font-mono text-neutral-500 uppercase tracking-widest mb-6">Additional Safety Capabilities</h3>
          <div className="grid md:grid-cols-2 gap-4">
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



        <LiveTacticalFeed />
      </div>
    </section>
  );
};
