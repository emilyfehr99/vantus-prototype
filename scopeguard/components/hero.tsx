"use client";

import { useState, useEffect } from "react";
import { PaywallModal } from "./paywall-modal";
import { ArrowRight, Terminal, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Hero() {
    const [clientEmail, setClientEmail] = useState("");
    const [generatedReply, setGeneratedReply] = useState("");
    const [loading, setLoading] = useState(false);
    const [generations, setGenerations] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);

    // Load generations from local storage
    useEffect(() => {
        const saved = localStorage.getItem("scopeguard_gens");
        if (saved) setGenerations(parseInt(saved));
    }, []);

    const handleGenerate = async () => {
        // Check limits
        if (generations >= 3) {
            setShowPaywall(true);
            return;
        }

        if (!clientEmail.trim()) return;

        setLoading(true);
        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: clientEmail }),
            });

            const data = await response.json();

            if (data.reply) {
                setGeneratedReply(data.reply);

                // Increment and save
                const newCount = generations + 1;
                setGenerations(newCount);
                localStorage.setItem("scopeguard_gens", newCount.toString());

                if (newCount >= 3) {
                    // Optional: Show warning or prepare for paywall next time
                }
            } else {
                alert("Error generating reply");
            }
        } catch (e) {
            console.error(e);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 max-w-7xl mx-auto relative">
            <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />

            {/* Header / Nav */}
            <div className="absolute top-6 left-6 md:left-8 flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                <span className="font-mono text-sm tracking-widest text-zinc-400">SCOPEGUARD v1.0</span>
            </div>

            <div className="absolute top-6 right-6 md:right-8">
                <div className="font-mono text-xs text-zinc-500 border border-zinc-800 px-3 py-1 rounded-full">
                    TRIALS REMAINING: <span className="text-primary">{Math.max(0, 3 - generations)}/3</span>
                </div>
            </div>

            <div className="mb-12 text-center space-y-4 max-w-2xl">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
                    Don't Let Them <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">
                        Creep on You.
                    </span>
                </h1>
                <p className="text-zinc-400 text-lg">
                    Generate professional "Bad Cop" replies to scope creep emails instantly.
                </p>
            </div>

            {/* Main Interface */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 h-[600px]">
                {/* Left Side: Input */}
                <div className="flex flex-col gap-2 relative group">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase px-2">
                        <span>Incoming Transmission (Client)</span>
                        <Terminal size={14} />
                    </div>
                    <textarea
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="Paste the annoying client email here... e.g., 'Hey, can we just quickly add a mobile app to the scope? It shouldn't take long.'"
                        className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 font-mono text-sm text-zinc-300 resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-zinc-700"
                    />
                    <div className="absolute bottom-4 right-4 text-xs text-zinc-700 font-mono">
                        INPUT_BUFFER: ACTIVE
                    </div>
                </div>

                {/* Center Action (Mobile: Middle, Desktop: Absolute/Centered) 
            Actually let's just put the button in the middle or bottom of left for better flow 
        */}

                {/* Right Side: Output */}
                <div className="flex flex-col gap-2 relative">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-500 uppercase px-2">
                        <span>ScopeGuard Protocol</span>
                        <Zap size={14} className={loading ? "text-primary animate-pulse" : ""} />
                    </div>
                    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-6 font-mono text-sm relative group overflow-hidden">
                        {loading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-2">
                                    <RefreshCw className="animate-spin text-primary" />
                                    <span className="text-xs font-mono text-primary animate-pulse">ANALYZING THREAT...</span>
                                </div>
                            </div>
                        )}

                        {generatedReply ? (
                            <div className="whitespace-pre-wrap text-zinc-100 h-full overflow-y-auto">
                                {generatedReply}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-zinc-700">
                                <span className="text-xs tracking-widest">[ WAITING FOR INPUT ]</span>
                            </div>
                        )}

                        {/* Scanlines effect */}
                        <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[5px] w-full animate-scan"></div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <button
                    onClick={handleGenerate}
                    disabled={loading || !clientEmail.trim()}
                    className={cn(
                        "group relative px-8 py-4 bg-primary text-black font-bold text-lg tracking-wider rounded-none uppercase clip-path-slant transition-all hover:translate-y-[-2px] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none",
                        // Custom clip-path for that tactical look
                    )}
                    style={{ clipPath: "polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)" }}
                >
                    <span className="flex items-center gap-2 relative z-10">
                        {loading ? "Processing..." : "Generate Bad Cop Reply"}
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 text-zinc-600 text-xs font-mono">
                SYSTEM STATUS: ONLINE // SECURE CONNECTION
            </div>
        </section>
    );
}
