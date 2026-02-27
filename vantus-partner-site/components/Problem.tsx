import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldAlert, Clock } from 'lucide-react';

export const Problem: React.FC = () => {
  // Use any casting to bypass strict Framer Motion type errors
  const MotionDiv = motion.div as any;

  return (
    <section className="py-40 px-6 bg-black border-t border-neutral-900 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#FF3B30]/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center relative z-10">
        <MotionDiv
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <span className="font-mono text-[#FF3B30] text-[10px] tracking-[0.5em] uppercase flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse" />
              Tactical Gap Report
            </span>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
              The Crisis of<br />
              <span className="text-neutral-500">Isolation.</span>
            </h2>
          </div>

          <p className="text-neutral-400 font-mono text-sm leading-relaxed max-w-lg">
            Solo-patrol units are operating in increasingly volatile environments without a physical second officer. When every second is a matter of life and death, radio lag is unacceptable.
          </p>

          <div className="flex gap-12 pb-6 border-b border-neutral-900 w-full max-w-lg">
            <div>
              <div className="text-5xl font-black text-[#FF3B30] tracking-tighter">100k</div>
              <div className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest mt-2">Officer Staffing Gap</div>
            </div>
            <div>
              <div className="text-5xl font-black text-[#FF3B30] tracking-tighter">82%</div>
              <div className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest mt-2">Solo Patrol Units</div>
            </div>
          </div>

          <div className="grid gap-10 pt-2">
            {[
              { icon: <ShieldAlert size={20} />, title: "Cognitive Overload", desc: "Fight, communicate, remember details simultaneously." },
              { icon: <Clock size={20} />, title: "Response Lag", desc: "Backup only after radio reach—lethal in struggles." }

            ].map((item, i) => (
              <MotionDiv
                key={i}
                className="flex gap-6 group cursor-default"
                whileHover={{ x: 10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <div className="flex-shrink-0 w-12 h-12 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 group-hover:text-[#FF3B30] group-hover:border-[#FF3B30]/30 group-hover:shadow-[0_0_15px_rgba(255,59,48,0.1)] transition-all duration-300">
                  {item.icon}
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-white text-xs uppercase tracking-widest group-hover:text-[#FF3B30] transition-colors duration-300">{item.title}</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed font-mono group-hover:text-neutral-400 transition-colors duration-300">{item.desc}</p>
                </div>
              </MotionDiv>
            ))}
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative group cursor-crosshair"
        >
          <div className="aspect-[4/5] bg-neutral-950 border border-neutral-800 p-1 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[#FF3B30]/5 mix-blend-overlay z-10 group-hover:bg-[#FF3B30]/10 transition-colors" />
            <img
              src="https://images2.minutemediacdn.com/image/upload/c_fill,w_1200,ar_4:5,f_auto,q_auto,g_auto/shape/cover/sport/124741-fop-d22-1014-0c588a4.jpg"
              className="w-full h-full object-cover opacity-40 grayscale group-hover:scale-110 group-hover:grayscale-[0.5] transition-all duration-1000 ease-out"
              alt="Patrol Reality"
            />

            {/* Red Scanning Beam */}
            <MotionDiv
              animate={{ top: ['-10%', '110%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-1 bg-[#FF3B30] shadow-[0_0_20px_#FF3B30] z-20 opacity-40 pointer-events-none"
            />

            <div className="absolute inset-0 z-20 p-10 flex flex-col justify-between">
              <div className="bg-black/80 backdrop-blur-md p-4 border-l-2 border-[#FF3B30] self-start font-mono text-[10px] group-hover:bg-black/90 transition-colors">
                <span className="text-neutral-500 block">THREAT_VECTOR</span>
                <span className="text-white font-bold">SOLO_PATROL_VULNERABILITY</span>
              </div>

              <div className="bg-absolute bg-black/80 backdrop-blur-md p-8 border border-neutral-800 group-hover:border-[#FF3B30]/30 transition-all duration-500">
                <span className="text-6xl font-black text-[#FF3B30] block mb-2 tracking-tighter group-hover:scale-110 transition-transform origin-left">82%</span>
                <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest leading-relaxed">
                  of U.S. patrol units operate solo.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 border-[#FF3B30]/30 -z-10 group-hover:border-[#FF3B30]/60 transition-colors" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b-2 border-l-2 border-[#FF3B30]/30 -z-10 group-hover:border-[#FF3B30]/60 transition-colors" />
        </MotionDiv>
      </div>
    </section>
  );
};