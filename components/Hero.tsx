import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import heroVideo from '../public/vantus-bg-video-v2.mp4';

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

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <section ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center pt-48 pb-32 px-6 lg:px-12 bg-black overflow-hidden select-none">
      {/* Background Video Layer Only */}
      <div className="absolute inset-0 z-0">
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
        style={{ y: textY } as any}
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
              Real-Time Officer Safety Platform
            </span>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00FF41]/10 border border-[#00FF41]/30 rounded-full backdrop-blur-sm">
            <span className="font-mono text-[9px] text-[#00FF41] uppercase tracking-widest">
              <strong className="font-black text-white">100% Software Solution.</strong> Integrates with your existing Axon/Motorola Cameras.
            </span>
          </div>
        </div>

        {/* Massive Stacked Headline with Cinematic Video Background */}
        <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-24 my-6">

          {/* Low Opacity Video Background masked to fade out at the edges */}
          <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover brightness-[1.15]"
            >
              <source src={heroVideo} type="video/mp4" />
            </video>
          </div>

          <div className="relative z-10 flex flex-col items-center leading-[0.82] tracking-[-0.05em] uppercase font-black">
            <h1 className="text-[clamp(2.5rem,10vw,8rem)] text-white">Every Officer.</h1>
            <h1 className="text-[clamp(2.5rem,10vw,8rem)] text-neutral-500">Every Call.</h1>
            <h1 className="text-[clamp(2.5rem,10vw,8rem)] text-white hover:text-[#FF3B30] hover:scale-105 transition-all duration-700 ease-out">Never Alone.</h1>
          </div>
        </div>

        {/* Description grounded in specific features */}
        <div className="max-w-4xl text-center">
          <p className="text-xl md:text-3xl text-neutral-300 font-medium leading-relaxed">
            An <span className="text-white font-bold">AI dispatch partner</span> that triages calls, routes officers, and ensures backup arrives instantly.
          </p>
        </div>
      </MotionDiv>

      {/* Corner Accents - Cleaned up to ensure no rogue metrics creep in */}
      <div className="absolute bottom-10 left-10 w-16 h-16 border-b-2 border-l-2 border-neutral-800 pointer-events-none opacity-50" />
      <div className="absolute bottom-10 right-10 w-16 h-16 border-b-2 border-r-2 border-neutral-800 pointer-events-none opacity-50" />
    </section >
  );
};