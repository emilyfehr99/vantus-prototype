import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2 } from 'lucide-react';
import bodycamImage from '../public/bodycam-footage-v2.jpg';

export const Mission: React.FC = () => {
    const MotionDiv = motion.div as any;

    return (
        <section id="mission" className="py-24 md:py-40 px-6 bg-[#050505] relative overflow-hidden border-b border-neutral-900">
            {/* HUD Accents */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute top-10 left-10 w-24 h-24 border-t border-l border-[#00FF41]" />
                <div className="absolute bottom-10 right-10 w-24 h-24 border-b border-r border-[#00FF41]" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-16 text-center"
                >
                    <div className="space-y-6">
                        <span className="font-mono text-[#00FF41] text-[10px] tracking-[0.5em] uppercase font-black flex items-center justify-center gap-4">
                            <Target size={14} />
                            Strategic Intent
                        </span>
                        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85]">
                            Intelligence that acts.<br />
                            <span className="bg-gradient-to-b from-[#00FF41] to-[#00FF41]/50 bg-clip-text text-transparent">Backup that arrives.</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 text-left">
                        <div className="space-y-6 bg-neutral-950/50 border border-neutral-900 p-10 backdrop-blur-sm group hover:border-[#00FF41]/20 transition-all duration-500">
                            <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-[#00FF41] rounded-full" />
                                The Philosophy
                            </h3>
                            <p className="text-neutral-400 font-mono text-xs leading-relaxed">
                                We believe that technology shouldn't just record the tragedy—it should prevent it. Vantus exists to bridge the staffing gap with autonomous intelligence that acts as a force multiplier for every officer on the line.
                            </p>
                        </div>
                        <div className="space-y-6 bg-neutral-950/50 border border-neutral-900 p-10 backdrop-blur-sm group hover:border-[#00FF41]/20 transition-all duration-500">
                            <h3 className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-3">
                                <span className="w-1.5 h-1.5 bg-[#00FF41] rounded-full" />
                                The Objective
                            </h3>
                            <p className="text-neutral-400 font-mono text-xs leading-relaxed">
                                Our goal is to ensure that no first responder ever stands alone. By automating documentation and triaging threats in real-time, we return 30% of an officer's time to the community while ensuring backup is always a heartbeat away.
                            </p>
                        </div>
                    </div>

                    <div className="relative pt-16 pb-16 px-8 mt-16 group overflow-hidden border border-neutral-900 rounded-sm bg-[#050505] shadow-[0_0_80px_rgba(0,0,0,1)]">
                        {/* Background Image Layer */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src={bodycamImage}
                                alt="Officer bodycam footage"
                                className="w-full h-full object-cover scale-[0.6] opacity-80 brightness-[1.2] grayscale sepia-[.1]"
                            />
                            {/* Gradient to ensure text readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent" />
                        </div>

                        <div className="relative z-10">
                            <p className="text-[#00FF41] font-mono text-[10px] uppercase tracking-[0.3em] mb-6">Core Directive // v4.2</p>
                            <blockquote className="text-2xl md:text-3xl font-light italic text-white/90 max-w-3xl mx-auto leading-relaxed">
                                "To engineer a world where operational silence is replaced by unwavering support, and every hero returns home."
                            </blockquote>
                        </div>
                    </div>
                </MotionDiv>
            </div>
        </section>
    );
};
