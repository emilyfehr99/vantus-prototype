import React from 'react';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
    const MotionDiv = motion.div as any;

    return (
        <section className="py-32 px-6 bg-[#050505] border-t border-neutral-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#00FF41]/5 blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <span className="font-mono text-[#00FF41] text-[10px] tracking-[0.5em] uppercase font-black">Vantus Platform</span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-tight mt-4">Advanced<br/>Analytics.</h2>
                    <p className="mt-6 text-neutral-400 font-mono text-sm max-w-2xl leading-relaxed">
                        Real-time threat detection and incident analysis powered by advanced AI models for officer safety and operational efficiency.
                    </p>
                </div>

                <div className="text-center py-16">
                    <p className="text-neutral-500 font-mono text-sm">
                        Command dashboard features have been moved to the Pilot Phase 1 interface.
                    </p>
                </div>
            </div>
        </section>
    );
};
