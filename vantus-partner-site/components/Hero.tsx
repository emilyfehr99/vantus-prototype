import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const Hero: React.FC<{
  onOpenWaitlist: () => void;
  onOpenLogin: () => void;
  onOpenWhitepaper: () => void;
}> = ({ onOpenWaitlist, onOpenLogin, onOpenWhitepaper }) => {
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
    <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center pt-48 pb-32 px-6 lg:px-12 bg-black overflow-hidden select-none">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1596705359489-3224b1ff5801?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Officer background"
          className="w-full h-full object-cover opacity-20 blur-sm brightness-75 grayscale sepia-[.1]"
        />
        {/* Subtle Bodycam / Tactical Texture Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-5 mix-blend-overlay pointer-events-none" />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

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
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <MotionDiv
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-[#00FF41] rounded-full shadow-[0_0_8px_#00FF41]"
            />
            <span className="font-mono text-[11px] text-[#00FF41] font-bold uppercase tracking-[0.4em]">
              Operational Interdiction Protocol Alpha
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded-full backdrop-blur-sm">
            <span className="font-mono text-[9px] text-[#00FF41] uppercase tracking-widest">
              <strong className="font-black text-white">100% Software Solution.</strong> Integrates with your existing Axon/Motorola Cameras.
            </span>
          </div>
        </div>

        {/* Massive Stacked Headline */}
        <div className="flex flex-col items-center leading-[0.82] tracking-[-0.05em] uppercase font-black">
          <h1 className="text-[clamp(3rem,12vw,10rem)] text-white">Every Officer.</h1>
          <h1 className="text-[clamp(3rem,12vw,10rem)] text-neutral-500">Every Call.</h1>
          <h1 className="text-[clamp(3rem,12vw,10rem)] text-white hover:text-red-500 transition-colors duration-700">Never Alone.</h1>
        </div>

        {/* Description grounded in specific features */}
        <div className="max-w-4xl text-center">
          <p className="text-xl md:text-3xl text-neutral-300 font-medium leading-relaxed">
            Vantus bridges the 100,000-officer staffing gap by providing an <span className="text-white font-bold">autonomous, agentic partner</span> that predicts violence, automates documentation, and ensures backup is never more than a heartbeat away.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-8 w-full justify-center items-center">
          <MotionButton
            onClick={onOpenLogin}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-[260px] py-5 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-sm transition-all"
          >
            Pilot Access
          </MotionButton>
          <MotionButton
            onClick={onOpenWaitlist}
            whileHover={{ scale: 1.02, backgroundColor: '#00FF41', borderColor: '#00FF41', color: 'black' }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-[260px] py-5 border border-white/20 bg-transparent text-white font-black uppercase tracking-widest text-[11px] rounded-sm transition-all"
          >
            Join Waitlist
          </MotionButton>
          <MotionButton
            whileHover={{ scale: 1.02, borderColor: 'white', color: 'white', boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenWhitepaper}
            className="w-full sm:w-[260px] py-5 border border-neutral-800 font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500 transition-all"
          >
            Tech Specs // PDF
          </MotionButton>
        </div>
      </MotionDiv>

      {/* Persistent Sensor Data Sidebar - Enhanced with feature-specific logs */}
      <div className="absolute bottom-12 left-10 z-30 space-y-4 hidden md:block group">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1">
            <span className="w-2 h-0.5 bg-[#00FF41]" />
          </div>
          <span className="font-mono text-[9px] text-[#00FF41] uppercase tracking-[0.4em] font-black group-hover:tracking-[0.5em] transition-all">Sensors: Online</span>
        </div>
        <div className="font-mono text-[10px] text-neutral-600 space-y-2 tracking-widest uppercase">
          <p className="flex justify-between gap-6 group-hover:text-neutral-400 transition-colors"><span>Vocal Stress:</span> <span className="text-white">Nominal</span></p>
          <p className="flex justify-between gap-6 group-hover:text-neutral-400 transition-colors"><span>Posture Map:</span> <span className="text-white">Scanning</span></p>
          <p className="flex justify-between gap-6 group-hover:text-neutral-400 transition-colors"><span>Threat Sig:</span> <span className="text-white">0.02%</span></p>
          <p className="pt-2 text-[8px] opacity-40">LAT: 34.0522° N // LON: 118.2437° W</p>
        </div>
      </div>
    </section >
  );
};