import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const Hero: React.FC = () => {
  const MotionDiv = motion.div as any;
  const MotionButton = motion.button as any;

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 bg-black overflow-hidden select-none">
      {/* Corner Accents */}
      <div className="absolute top-40 left-10 w-12 h-12 border-t border-l border-[#00FF41]/30 pointer-events-none" />
      <div className="absolute top-40 right-10 w-12 h-12 border-t border-r border-[#00FF41]/30 pointer-events-none" />

      {/* Main Tactical Content */}
      <MotionDiv
        style={{ y: textY, opacity } as any}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1600px] flex flex-col items-center text-center space-y-12 z-20"
      >
        {/* Status Line */}
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-[#00FF41] rounded-full shadow-[0_0_8px_#00FF41] animate-pulse" />
          <span className="font-mono text-[11px] text-[#00FF41] font-bold uppercase tracking-[0.4em]">
            Operational Interdiction Protocol Alpha
          </span>
        </div>

        {/* Massive Stacked Headline */}
        <div className="flex flex-col items-center leading-[0.82] tracking-[-0.05em] uppercase font-black">
          <h1 className="text-[clamp(4rem,15vw,12.5rem)] text-white">Digital.</h1>
          <h1 className="text-[clamp(4rem,15vw,12.5rem)] text-neutral-700">Neural.</h1>
          <h1 className="text-[clamp(4rem,15vw,12.5rem)] text-white">Partner.</h1>
        </div>

        {/* Description grounded in specific features */}
        <div className="max-w-3xl">
          The fundamental intelligent operating system for every solo first responder. <span className="text-white">Active threat detection, biometric stress sync, and autonomous backup coordination.</span>
        </p>
        <p className="pt-6 font-mono text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed max-w-lg mx-auto">
          Mission: Bridge the 100,000-officer staffing gap with an agentic force multiplier that ensures backup is never more than a heartbeat away.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-6 pt-8 w-full justify-center items-center">
        <MotionButton
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,255,255,0.15)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-[320px] py-6 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-sm transition-all"
        >
          Request Pilot Access
        </MotionButton>
        <MotionButton
          whileHover={{ scale: 1.02, borderColor: 'white', color: 'white', boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-[320px] py-6 border border-neutral-800 font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500 transition-all"
        >
          Technical Specs // PDF V1.4
        </MotionButton>
      </div>
    </MotionDiv>

      {/* Persistent Sensor Data Sidebar - Enhanced with feature-specific logs */ }
  <div className="absolute bottom-12 left-10 z-30 space-y-4 hidden md:block group">
    <div className="flex items-center gap-2 mb-2">
      <div className="flex gap-1">
        <span className="w-2 h-0.5 bg-[#00FF41]" />
      </div>
      <span className="font-mono text-[9px] text-[#00FF41] uppercase tracking-[0.4em] font-black group-hover:tracking-[0.5em] transition-all">Sensors: Online</span>
    </div>
    <div className="font-mono text-[10px] text-neutral-600 space-y-1.5 tracking-widest uppercase">
      <p className="flex justify-between gap-4 group-hover:text-neutral-400 transition-colors"><span>Vocal Stress:</span> <span className="text-white">Nominal</span></p>
      <p className="flex justify-between gap-4 group-hover:text-neutral-400 transition-colors"><span>Posture Map:</span> <span className="text-white">Scanning</span></p>
      <p className="flex justify-between gap-4 group-hover:text-neutral-400 transition-colors"><span>Threat Sig:</span> <span className="text-white">0.02%</span></p>
      <p className="pt-2 text-[8px] opacity-40">LAT: 34.0522° N // LON: 118.2437° W</p>
    </div>
  </div>

  {/* Footer Vertical Label */ }
  <div className="absolute bottom-12 right-10 font-mono text-[9px] text-neutral-800 vertical-text tracking-[0.6em] uppercase pointer-events-none select-none opacity-50">
    Vantus_Partner_Sys_v4.2
  </div>
    </section >
  );
};