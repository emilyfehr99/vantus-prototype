import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export const Hero: React.FC<{
  onOpenWaitlist: () => void;
  onOpenWhitepaper: () => void;
}> = ({ onOpenWaitlist, onOpenWhitepaper }) => {
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
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1596705359489-3224b1ff5801?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
          alt="Officer background"
          className="w-full h-full object-cover opacity-30 blur-sm brightness-75 grayscale sepia-[.2]"
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
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
            <div className="w-1.5 h-1.5 bg-[#00FF41] rounded-full shadow-[0_0_8px_#00FF41] animate-pulse" />
            <span className="font-mono text-[11px] text-[#00FF41] font-bold uppercase tracking-[0.4em]">
              Now Accepting Pilot Departments
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
            Vantus bridges the 100,000-officer staffing gap with an <span className="text-white font-bold">AI partner that automatically calls for backup within 20 seconds</span> when your officer is in danger — no radio needed. Plus, it handles documentation so officers can focus on the scene.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 pt-8 w-full justify-center items-center">
          <MotionButton
            onClick={onOpenWaitlist}
            whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-[320px] py-6 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-sm transition-all"
          >
            Request Pilot Access
          </MotionButton>
          <MotionButton
            whileHover={{ scale: 1.02, borderColor: 'white', color: 'white', boxShadow: '0 0 20px rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenWhitepaper}
            className="w-full sm:w-[320px] py-6 border border-neutral-800 font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500 transition-all"
          >
            Technical Specs
          </MotionButton>
        </div>
      </MotionDiv>

    </section >
  );
};