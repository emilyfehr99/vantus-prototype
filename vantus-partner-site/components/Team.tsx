import React from 'react';
import { motion } from 'framer-motion';

export const Team: React.FC = () => {
    const MotionDiv = motion.div as any;

    return (
        <section className="py-32 px-6 bg-black border-t border-neutral-900 relative overflow-hidden" id="team">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#00FF41]/5 blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center space-y-8">
                <span className="font-mono text-[#00FF41] text-[10px] tracking-[0.5em] uppercase font-black">Origins</span>

                <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-neutral-950 border border-neutral-900 p-12 relative group"
                >
                    {/* Decorative Corner Accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-neutral-800 group-hover:border-[#00FF41] transition-colors" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-neutral-800 group-hover:border-[#00FF41] transition-colors" />

                    <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-8 group-hover:text-[#00FF41] transition-colors">The Mission</h3>

                    <p className="text-neutral-400 font-mono text-sm leading-relaxed max-w-2xl mx-auto italic">
                        "Founded by a former high-level athlete who transitioned to elite teams, channeling competitive drive into solving public safety crises via self-taught AI tools."
                    </p>

                    <div className="mt-10 flex justify-center items-center gap-4 opacity-50">
                        <div className="h-[1px] w-12 bg-[#00FF41]" />
                        <span className="font-mono text-[9px] text-[#00FF41] uppercase tracking-[0.2em] font-bold">Vantus Safety Systems</span>
                        <div className="h-[1px] w-12 bg-[#00FF41]" />
                    </div>
                </MotionDiv>
            </div>
        </section>
    );
};
