import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Eye, Cloud, Zap, Radio, Shield, Boxes } from 'lucide-react';
import bodycamImage from '../public/bodycam-footage-v2.jpg';

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
    <section ref={sectionRef} className="py-20 md:pt-0 md:pb-48 px-6 bg-[#000000] overflow-hidden relative">
      <div className="max-w-7xl mx-auto">
        <MotionDiv
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#050505] border border-neutral-900 p-10 md:p-28 relative overflow-hidden rounded-sm shadow-[0_0_80px_rgba(0,0,0,1)]"
        >
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            <img
              src={bodycamImage}
              alt="Officer bodycam footage"
              className="w-full h-full object-cover opacity-20 grayscale sepia-[.1] brightness-[0.4]"
            />
            {/* Added a subtle gradient to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          </div>
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
                <span className="font-mono text-[#00FF41] text-[10px] tracking-[0.5em] uppercase font-black">Architecture Blueprint</span>
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

            {/* 3D Visualizer Core */}
            <MotionDiv
              initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
              whileInView={{ scale: 1, opacity: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="aspect-square bg-neutral-950 border border-neutral-900 p-16 flex flex-col items-center justify-center relative shadow-inner group"
            >
              <div className="w-full h-full relative">
                {/* Outer Rings */}
                <MotionDiv
                  animate={{ rotate: 360 }}
                  transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-dashed border-neutral-800 rounded-full opacity-50 group-hover:opacity-100 group-hover:border-[#00FF41]/20 transition-all duration-700"
                />
                <MotionDiv
                  animate={{ rotate: -360 }}
                  transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-10 border border-[#00FF41]/10 rounded-full group-hover:border-[#00FF41]/30 transition-all duration-700"
                />
                <MotionDiv
                  animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-20 border border-neutral-800 rounded-full group-hover:border-[#00FF41]/20 transition-all duration-700"
                />

                {/* Central Power Core */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <MotionDiv
                    animate={{
                      boxShadow: ['0 0 0px #00FF4100', '0 0 30px #00FF4122', '0 0 0px #00FF4100'],
                      scale: [1, 1.05, 1]
                    }}
                    whileHover={{ scale: 1.1, boxShadow: '0 0 60px rgba(0,255,65,0.3)' }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 bg-[#00FF41]/5 rounded-sm flex items-center justify-center border border-[#00FF41]/20 relative overflow-hidden group-hover:border-[#00FF41] group-hover:bg-[#00FF41]/10 transition-all"
                  >
                    <Zap className="text-[#00FF41] relative z-10 w-12 h-12" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#00FF4144,transparent)] opacity-50" />
                  </MotionDiv>
                </div>

                {/* Removed floating HUD elements for cleaner presentation */}
              </div>
            </MotionDiv>
          </div>
        </MotionDiv>
      </div>
    </section>
  );
};