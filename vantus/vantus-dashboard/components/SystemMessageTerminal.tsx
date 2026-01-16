
import { useState, useEffect } from 'react';

// Using inline styles or assuming Tailwind is available globally in the dashboard
// Since we updated globals.css with tailwind-like classes, this should work if the setup is consistent.
// If not, we might need to adjust classes, but the goal is to match Admin UI.

export default function SystemMessageTerminal() {
    const [logs, setLogs] = useState<string[]>([
        '[14:23:15] Initializing Supervisor Dashboard...',
        '[14:23:20] Connecting to Bridge Server...',
        '[14:23:24] Syncing Unit Telemetry...',
    ]);

    useEffect(() => {
        // Simulate random system messages appropriate for Supervisor context
        const messages = [
            'Bridge server connection: STABLE',
            'Updating officer coordinates...',
            'Scanning for signal patterns...',
            'Heartbeat received: UNIT-7',
            'Secure connection established: TLS 1.3',
            'Syncing tactical intent data...',
            'Triage gate: STANDBY',
            'Analyzing kinematic data...',
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
        }, 4000);

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
                    <div key={i} className="text-green-500/80">
                        {log}
                    </div>
                ))}
            </div>
            <div className="absolute top-0 right-4 text-[10px] text-green-900 mt-2">
                VANTUS SUPERVISOR v2.1.0 // BUILD 9921
            </div>
        </div>
    );
}
