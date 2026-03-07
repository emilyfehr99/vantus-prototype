import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Database, FileCheck } from 'lucide-react';

export const TrustBanner: React.FC = () => {
    const items = [
        { icon: <ShieldCheck size={14} />, text: "CJIS COMPLIANT" },
        { icon: <Lock size={14} />, text: "FIPS 140-2 ENCRYPTION" },
        { icon: <Database size={14} />, text: "PIPEDA VERIFIED" },
        { icon: <FileCheck size={14} />, text: "SOC-2 TYPE II READY" },
        { icon: <ShieldCheck size={14} />, text: "AES-256 SECURED" },
        { icon: <Lock size={14} />, text: "REAL-TIME OVERWATCH" },
    ];

    // Double the items for seamless loop
    const loopItems = [...items, ...items, ...items];

    return (
        <div className="bg-neutral-950 border-y border-neutral-900 overflow-hidden py-4 relative">
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

            <motion.div
                className="flex whitespace-nowrap gap-12 items-center"
                animate={{ x: [0, -1000] }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {loopItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-[#00FF41]/40 group hover:text-[#00FF41] transition-colors duration-300">
                        {item.icon}
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold">
                            {item.text}
                        </span>
                        <span className="w-1 h-1 bg-neutral-800 rounded-full ml-12" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
};
