
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, LayoutGroup } from 'framer-motion';
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
    <motion.div 
      layout
      className="border border-neutral-800 bg-neutral-950 mb-4 overflow-hidden rounded-sm cursor-pointer group"
      transition={{ 
        layout: { duration: 0.6, ease: [0.04, 0.62, 0.23, 0.98] }
      }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-900/50 transition-colors relative z-20">
        <div className="flex items-center gap-4">
          <span className={`font-black text-lg uppercase tracking-tight transition-colors duration-500 ${isOpen ? 'text-[#00FF41]' : 'text-white'}`}>{title}</span>
          {badge && <span className="px-3 py-1 bg-neutral-800 text-[10px] font-mono text-neutral-400 rounded-sm">{badge}</span>}
        </div>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          <ChevronDown className={`transition-colors duration-500 ${isOpen ? 'text-[#00FF41]' : 'text-neutral-500'}`} />
        </motion.div>
      </div>
      
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
        variants={{
          open: { 
            height: "auto", 
            opacity: 1,
            transition: {
              height: { duration: 0.6, ease: [0.04, 0.62, 0.23, 0.98] },
              opacity: { duration: 0.4, delay: 0.1 }
            }
          },
          closed: { 
            height: 0, 
            opacity: 0,
            transition: {
              height: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] },
              opacity: { duration: 0.2 }
            }
          }
        }}
        className="overflow-hidden relative z-10"
      >
        <motion.div 
          variants={{
            open: { y: 0, opacity: 1, transition: { duration: 0.5, delay: 0.2, ease: "easeOut" } },
            closed: { y: -10, opacity: 0, transition: { duration: 0.3 } }
          }}
          className="p-6 pt-0 border-t border-neutral-900 text-neutral-400 font-mono text-sm leading-relaxed"
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
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
  { type: 'SYS', text: 'Environmental scan complete.' },
  { type: 'SYS', text: "Rear peripheral motion detected." },
  { type: 'LOG', text: 'Biometric Alert: HR spike > 145 BPM.' },
  { type: 'SYS', text: 'Analyzing subject behavioral audio...' },
  { type: 'ALERT', text: 'THREAT DETECTED: BLADED STANCE.' },
  { type: 'LOG', text: 'Voice Stress: High Arousal Detected.' },
  { type: 'ALERT', text: 'WEAPON SIGNATURE: KNIFE (98%).' },
  { type: 'SYS', text: 'Emergency Assistance Dispatched.' },
  { type: 'LOG', text: 'Dispatch Notified: Priority 1 Backup.' },
  { type: 'SYS', text: 'GPS Coordinates Sent to CAD.' },

];

const STATIC_LOGS: LogEntry[] = [];

export const Product: React.FC = () => {
  const MotionDiv = motion.div as any;
  const MotionP = motion.p as any;

  return (
    <section className="pt-12 pb-0 md:pt-12 md:pb-0 px-6 bg-[#000000] border-t border-neutral-900 overflow-hidden relative">
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

        <div className="mb-20">
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

            <LayoutGroup id="threat-tiers">
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

              <AccordionItem title="TIER 2: Audio & Visual Fusion (Medium-High Confidence)" badge="High Multi-modal Accuracy">
                <div className="space-y-4">
                  <p><strong className="text-white">Weapon Identification (CV):</strong> Real-time visual confirmation of firearms or edged weapons via body cam feed.</p>
                  <p><strong className="text-white">Multi-modal Fusion:</strong> Cross-references audio cues (e.g., "drop the gun") with visual weapon detection to eliminate false positives.</p>
                  <p><strong className="text-white">Person Down / Officer Stationary:</strong> Detects if an officer is horizontal on the ground or immobile for &gt;10s during a high-stress event.</p>
                  <div className="mt-4 p-4 bg-[#FF3B30]/20 border-l-2 border-[#FF3B30] text-[#FF3B30] font-black uppercase text-xs">
                    Action: Priority RoIP voice injection to all nearby units. Automatic CAD entry for "Officer in Trouble" (10-33). Stream opens for supervisory review.
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem title="TIER 3: Extreme Tactical Emergency (Fatal/Critical Threat)" badge="Autonomous Backup">
                <div className="space-y-4">
                  <p><strong className="text-white">Gunshot + Officer Down Fusion:</strong> Visual confirmation of a downed officer following a gunshot detection.</p>
                  <p><strong className="text-white">Ambush Detection:</strong> Mismatched tactical flow (e.g., silent approach followed by immediate high-impulse audio + rapid movement).</p>
                  <div className="mt-4 p-4 bg-red-600 text-white font-black uppercase text-xs animate-pulse">
                    Action: Full Tactical Override. Autonomous dispatch of nearest units via MDT. Real-time audio/video broadcast to supervisor dashboard.
                  </div>
                </div>
              </AccordionItem>
            </LayoutGroup>
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




      </div>
    </section>
  );
};
