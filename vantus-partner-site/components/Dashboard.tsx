import React from 'react';
import { motion } from 'framer-motion';
import { Map, Video, List, FileText, MessageSquare } from 'lucide-react';

const DashboardFeature = ({ icon, title, desc, delay }: any) => {
    const MotionDiv = motion.div as any;
    return (
        <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 bg-black border border-neutral-800 hover:border-[#00FF41]/40 hover:bg-[#00FF41]/[0.02] transition-all duration-300 group"
        >
            <div className="text-neutral-500 group-hover:text-[#00FF41] transition-colors mb-4">
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <h4 className="font-black text-white text-sm uppercase tracking-tight mb-2 group-hover:text-[#00FF41] transition-colors">{title}</h4>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed">{desc}</p>
        </MotionDiv>
    );
};

export const Dashboard: React.FC = () => {
    const MotionDiv = motion.div as any;

    return (
        <section className="py-32 px-6 bg-[#050505] border-t border-neutral-900 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-[#00FF41]/5 blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                    <span className="font-mono text-[#00FF41] text-[10px] tracking-[0.5em] uppercase font-black">Sergeant / Dispatch Interface</span>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-tight mt-4">Command<br />Dashboard.</h2>
                    <p className="mt-6 text-neutral-400 font-mono text-sm max-w-2xl leading-relaxed">
                        Real-time situational awareness for watch commanders and dispatch. Vantus combines field data into a clear, actionable command view.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <DashboardFeature
                        icon={<Map />}
                        title="Live Tactical Map"
                        desc="Color-coded unit tracking with active alerts overlay. Instantly locate units engaged in high-stress incidents."
                        delay={0.1}
                    />
                    <DashboardFeature
                        icon={<Video className="text-[#FF3B30] group-hover:text-[#FF3B30]" />}
                        title="Live Command Center"
                        desc="Auto-pulls live video feed immediately upon any Tier 2 or Tier 3 trigger, giving dispatch instant visual context before units arrive."
                        delay={0.2}
                    />
                    <DashboardFeature
                        icon={<List />}
                        title="Alert Feed & Playback"
                        desc="Chronological feed of all verified alerts with immediate playback of the 30-second context clip that triggered the event."
                        delay={0.3}
                    />
                    <DashboardFeature
                        icon={<FileText />}
                        title="Auto-Dispatch Log"
                        desc="Audit-ready log of all automatic radio dispatches and system actions generated during critical events."
                        delay={0.4}
                    />
                    <DashboardFeature
                        icon={<MessageSquare />}
                        title="Feedback & QA System"
                        desc="Rapid human-in-the-loop review interface allowing sergeants to label false positives or commend accurate detections for continuous model tuning."
                        delay={0.5}
                    />
                </div>
            </div>
        </section>
    );
};
