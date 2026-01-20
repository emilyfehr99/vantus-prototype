'use client';

import { useState, useEffect } from 'react';

export default function SystemMessageTerminal() {
    const [logs, setLogs] = useState<string[]>([
        '[14:23:15] Navigating to Policy Control...',
        '[14:23:20] Navigating to Department Overview...',
        '[14:23:24] Bridge server unreachable',
    ]);

    useEffect(() => {
        // Simulate random system messages
        const messages = [
            'Bridge server unreachable',
            'Navigating to Officer Management...',
            'Navigating to License Management...',
            'System health check initiated...',
            'Secure connection established: TLS 1.3',
            'Syncing officer roster...'
        ];

        const interval = setInterval(() => {
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            const time = new Date().toLocaleTimeString('en-US', { hour12: false });
            const newLog = `[${time}] ${randomMsg}`;

            setLogs(prev => {
                const updated = [...prev, newLog];
                if (updated.length > 5) updated.shift();
                return updated;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-0 left-0 w-full bg-black border-t border-green-500/50 p-2 font-mono text-xs z-50">
            <div className="flex justify-between items-center mb-1 px-2 border-b border-green-900/30 pb-1">
                <span className="text-green-600 font-bold tracking-widest">// SYSTEM MESSAGE TERMINAL</span>
                <span className="text-green-600 animate-pulse">● ACTIVE</span>
            </div>
            <div className="px-2 space-y-1 opacity-80">
                {logs.map((log, i) => (
                    <div key={i} className={`${log.includes('unreachable') ? 'text-red-500' : 'text-green-500/80'}`}>
                        {log}
                    </div>
                ))}
            </div>
            <div className="absolute top-0 right-4 text-[10px] text-green-900 mt-2">
                VANTUS ADMIN v2.4.1 // BUILD 8892
            </div>
        </div>
    );
}
