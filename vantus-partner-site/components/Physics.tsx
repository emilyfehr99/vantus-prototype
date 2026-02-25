import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Eye, Cloud, Zap, Radio, Shield, Boxes } from 'lucide-react';

export const Physics: React.FC = () => {
  const MotionDiv = motion.div as any;
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Use springs for smooth but snappy movement
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const schemaY = useTransform(smoothProgress, [0, 1], ["-15%", "15%"]);
  const rotateSchema = useTransform(smoothProgress, [0, 1], [0, 30]);
  const scaleSchema = useTransform(smoothProgress, [0, 0.5, 1], [0.8, 1, 0.8]);

  return (
    <section ref={sectionRef} className="py-40 px-6 bg-[#000000] overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <MotionDiv
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#050505] border border-neutral-900 p-8 md:p-24 relative overflow-hidden rounded-sm shadow-[0_0_80px_rgba(0,0,0,1)]"
        >
          {/* Kinetic Blueprint Schematic */}
          <MotionDiv
            style={{ y: schemaY, rotate: rotateSchema, scale: scaleSchema } as any}
            className="absolute -top-40 -right-40 p-8 opacity-[0.02] pointer-events-none"
          >
            <Boxes size={800} strokeWidth={0.5} />
          </MotionDiv>

          <div className="grid lg:grid-cols-2 gap-24 items-center relative z-10">
            <div className="space-y-16">
              <div className="space-y-6">
                <span className="font-mono text-[#00FF41] text-[10px] tracking-[0.5em] uppercase font-black">How It Works</span>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">Proactive<br />Detection.</h2>
              </div>

              <div className="space-y-10 text-neutral-400 text-lg font-light leading-relaxed">
                <p className="max-w-lg">
                  Traditional BWC data is reactive—passive evidence collected for post-incident review. <span className="text-white font-bold italic">Vantus is active intelligence.</span>
                </p>
                <div className="grid gap-8">
                  {[
                    {
                      icon: <Eye className="text-[#00FF41] flex-shrink-0" />,
                      title: "Passive Eye",
                      desc: "Uses existing body cams (e.g., Axon Body 3/4) via APIs."
                    },
                    {
                      icon: <Cloud className="text-[#00FF41] flex-shrink-0" />,
                      title: "Remote Brain",
                      desc: "Cloud compute on AWS Canada for PIPEDA compliance."
                    },
                    {
                      icon: <Zap className="text-[#00FF41] flex-shrink-0" />,
                      title: "Core Intelligence",
                      desc: "Advanced audio and video models working together with multi-modal consensus logic."
                    },
                    {
                      icon: <Radio className="text-[#00FF41] flex-shrink-0" />,
                      title: "Tactical Output",
                      desc: "RoIP injection, dashboard with live map/alerts, and rapid feedback system."
                    },
                    {
                      icon: <Shield className="text-[#00FF41] flex-shrink-0" />,
                      title: "Privacy by Design",
                      desc: "Volatile RAM processing, no continuous recording, department-owned keys, AES-256 encryption."

                    }
                  ].map((item, i) => (
                    <MotionDiv
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="p-6 bg-black border border-neutral-800 flex gap-6 items-start hover:border-[#00FF41]/40 hover:bg-[#00FF41]/[0.02] transition-all duration-500 group relative overflow-hidden cursor-default"
                    >
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neutral-800 group-hover:border-[#00FF41] transition-colors" />
                      <div className="group-hover:scale-110 group-hover:text-[#00FF41] group-hover:drop-shadow-[0_0_8px_#00FF41] transition-all duration-500">
                        {item.icon}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-white font-black text-sm uppercase tracking-tight group-hover:text-[#00FF41] transition-colors">{item.title}</h4>
                        <p className="text-xs text-neutral-500 font-mono leading-relaxed tracking-tight group-hover:text-neutral-300 transition-colors">{item.desc}</p>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Flow Diagram */}
            <MotionDiv
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-neutral-950 border border-neutral-900 p-8 md:p-12 relative shadow-inner"
            >
              <div className="space-y-3">
                {/* Diagram Title */}
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-neutral-900">
                  <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse shadow-[0_0_8px_#00FF41]" />
                  <span className="font-mono text-[10px] text-[#00FF41] uppercase tracking-[0.3em] font-bold">System Pipeline</span>
                </div>

                {/* Flow Steps */}
                {[
                  { step: '01', label: 'Input', title: 'Body Camera', desc: 'Existing Axon / Motorola hardware', color: 'border-neutral-700', textColor: 'text-neutral-400' },
                  { step: '02', label: 'Process', title: 'Audio Stream', desc: 'Continuous low-bandwidth analysis', color: 'border-[#00FF41]/40', textColor: 'text-[#00FF41]' },
                  { step: '03', label: 'Detect', title: 'Threat Consensus', desc: 'Multi-model audio + on-demand video', color: 'border-[#00FF41]/60', textColor: 'text-[#00FF41]' },
                  { step: '04', label: 'Act', title: 'Auto-Dispatch', desc: 'RoIP backup injection in <20 sec', color: 'border-[#FF3B30]/60', textColor: 'text-[#FF3B30]' },
                ].map((item, i) => (
                  <MotionDiv
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.5 }}
                    className="relative"
                  >
                    {/* Connector Line */}
                    {i > 0 && (
                      <div className="absolute -top-1.5 left-6 w-[2px] h-3 bg-gradient-to-b from-neutral-800 to-neutral-900" />
                    )}

                    <div className={`flex items-stretch gap-4 p-4 border-l-2 ${item.color} hover:bg-white/[0.02] transition-all duration-300 group cursor-default`}>
                      {/* Step Number */}
                      <div className="flex flex-col items-center justify-center min-w-[40px]">
                        <span className={`font-black text-2xl tracking-tighter ${item.textColor}`}>{item.step}</span>
                        <span className="font-mono text-[7px] text-neutral-600 uppercase tracking-widest mt-1">{item.label}</span>
                      </div>

                      {/* Divider */}
                      <div className="w-px bg-neutral-800 group-hover:bg-neutral-700 transition-colors" />

                      {/* Content */}
                      <div className="flex-1 py-1">
                        <h4 className="font-black text-white text-sm uppercase tracking-tight group-hover:text-[#00FF41] transition-colors">{item.title}</h4>
                        <p className="font-mono text-[11px] text-neutral-500 mt-1 group-hover:text-neutral-400 transition-colors">{item.desc}</p>
                      </div>

                      {/* Arrow indicator */}
                      {i < 3 && (
                        <div className="flex items-center text-neutral-700 group-hover:text-neutral-500 transition-colors">
                          <span className="font-mono text-[10px]">↓</span>
                        </div>
                      )}
                    </div>
                  </MotionDiv>
                ))}

                {/* Result Bar */}
                <MotionDiv
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="mt-6 p-4 bg-[#00FF41]/5 border border-[#00FF41]/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Zap size={16} className="text-[#00FF41]" />
                    <span className="font-mono text-[10px] text-[#00FF41] uppercase tracking-widest font-bold">End-to-end: Under 20 seconds</span>
                  </div>
                  <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-widest">Zero hardware required</span>
                </MotionDiv>
              </div>
            </MotionDiv>

          </div>
        </MotionDiv>
      </div>
    </section>
  );
};