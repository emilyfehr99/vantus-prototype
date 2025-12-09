import React, { useState } from 'react';
import { MessageSquare, ArrowRight, Loader2, FileText, Zap, ChevronRight, Terminal } from 'lucide-react';
import { AnalysisRequest } from '../types';

interface ScopeFormProps {
    onAnalyze: (data: AnalysisRequest) => void;
    isAnalyzing: boolean;
    credits: number;
}

const ScopeForm: React.FC<ScopeFormProps> = ({ onAnalyze, isAnalyzing, credits }) => {
    const [contractText, setContractText] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [tone, setTone] = useState<'soft' | 'firm' | 'hard'>('firm');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!contractText.trim() || !clientEmail.trim()) return;
        onAnalyze({ contractText, clientEmail, tone });
    };

    const fillDemoData = () => {
        setContractText(`MASTER SERVICES AGREEMENT (MSA):
1. Scope: Homepage and Contact Page design only.
2. Revisions: Two (2) rounds of revisions included.
3. Exclusions: Content writing, SEO services, additional pages.
4. Overages: Any additional work billed at $150/hr.`);
        setClientEmail(`Subject: Quick favor?

Hey, thanks for the homepage draft. We actually need to add a full blog section and 3 SEO articles for the launch next week. Can you squeeze that in?`);
    };

    return (
        <div className="w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Holographic Container */}
            <div className="relative bg-slate-950/80 backdrop-blur-xl border border-indigo-500/30 rounded-lg p-[1px] shadow-[0_0_50px_rgba(79,70,229,0.15)] overflow-hidden">
                {/* Tech Deco: Top Left Corner */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-400 opacity-80 z-20"></div>
                {/* Tech Deco: Bottom Right Corner */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-400 opacity-80 z-20"></div>

                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80"></div>

                <div className="rounded-lg bg-slate-950/60 p-5 space-y-5 relative z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100">

                    {/* Compact Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-indigo-500/20 rounded border border-indigo-500/30">
                                <Terminal className="w-4 h-4 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-widest text-glow uppercase">
                                    Operations Terminal
                                </h2>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    SYSTEM ONLINE // v3.1.2
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={fillDemoData}
                                className="group flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 rounded text-indigo-300 hover:text-white text-[10px] font-mono uppercase tracking-wider transition-all"
                            >
                                <Zap className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                <span>[ Sim_Data ]</span>
                            </button>
                            <div className="flex flex-col items-end border-l border-white/10 pl-4">
                                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest transform scale-90 origin-right">Credits</div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-base font-mono font-bold ${credits > 1 ? 'text-emerald-400' : 'text-rose-400'}`}>0{credits}</span>
                                    <span className="text-[10px] text-slate-600 font-mono">/ 03</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Contract Section */}
                            <div className="relative group">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-emerald-400 transition-colors">
                                        <div className="w-1 h-4 bg-slate-600 group-focus-within:bg-emerald-400 transition-colors"></div>
                                        Input Stream 01 // TERMS
                                    </label>
                                    <span className="text-[9px] font-mono text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">REQUIRED</span>
                                </div>

                                <div className="relative">
                                    <div className="absolute -inset-[1px] bg-gradient-to-b from-emerald-500/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
                                    <textarea
                                        value={contractText}
                                        onChange={(e) => setContractText(e.target.value)}
                                        placeholder="> PASTE MSA / SOW TERMS..."
                                        className="relative w-full h-40 bg-slate-900/90 border border-slate-700/60 rounded-lg p-4 text-slate-300 placeholder-slate-700 focus:outline-none focus:border-emerald-500/50 focus:bg-slate-950 focus:shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] transition-all resize-none text-[11px] font-mono leading-relaxed custom-scrollbar tracking-wide"
                                        required
                                    />
                                    {/* Tech corner markers inside input */}
                                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-slate-600 group-focus-within:border-emerald-500/50 transition-colors pointer-events-none"></div>
                                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-slate-600 group-focus-within:border-emerald-500/50 transition-colors pointer-events-none"></div>
                                </div>
                            </div>

                            {/* Email Section */}
                            <div className="relative group">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest group-focus-within:text-rose-400 transition-colors">
                                        <div className="w-1 h-4 bg-slate-600 group-focus-within:bg-rose-400 transition-colors"></div>
                                        Input Stream 02 // THREAT
                                    </label>
                                    <span className="text-[9px] font-mono text-slate-600 group-focus-within:text-rose-500/70 transition-colors">REQUIRED</span>
                                </div>

                                <div className="relative">
                                    <div className="absolute -inset-[1px] bg-gradient-to-b from-rose-500/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity rounded-lg pointer-events-none"></div>
                                    <textarea
                                        value={clientEmail}
                                        onChange={(e) => setClientEmail(e.target.value)}
                                        placeholder="> PASTE CLIENT EMAIL..."
                                        className="relative w-full h-40 bg-slate-900/90 border border-slate-700/60 rounded-lg p-4 text-slate-300 placeholder-slate-700 focus:outline-none focus:border-rose-500/50 focus:bg-slate-950 focus:shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] transition-all resize-none text-[11px] font-mono leading-relaxed custom-scrollbar tracking-wide"
                                        required
                                    />
                                    {/* Tech corner markers inside input */}
                                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-slate-600 group-focus-within:border-rose-500/50 transition-colors pointer-events-none"></div>
                                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-slate-600 group-focus-within:border-rose-500/50 transition-colors pointer-events-none"></div>
                                </div>
                            </div>
                        </div>

                        {/* Control Bar: Tone & Submit */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
                            {/* Tone Selector - Compact Horizontal */}
                            <div className="md:col-span-7 bg-slate-900/40 border border-white/5 p-3 rounded-lg flex items-center gap-4">
                                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap px-2 border-r border-white/5">
                                    Engagement Protocol
                                </div>
                                <div className="flex-1 flex gap-2">
                                    {['soft', 'firm', 'hard'].map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setTone(t as any)}
                                            className={`flex-1 relative py-2 px-1 border rounded transition-all duration-300 text-[10px] font-bold uppercase tracking-wider ${tone === t
                                                ? t === 'soft' ? 'bg-indigo-950/50 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(129,140,248,0.3)]'
                                                    : t === 'firm' ? 'bg-amber-950/50 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                                        : 'bg-red-950/60 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-[pulse_2s_infinite]'
                                                : 'bg-slate-900/30 border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-400'
                                                }`}
                                        >
                                            {t === 'hard' ? 'BAD COP' : t === 'firm' ? 'FIRM' : 'DIPLOMAT'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="md:col-span-5">
                                <button
                                    type="submit"
                                    disabled={isAnalyzing}
                                    className="h-full w-full relative group overflow-hidden rounded-lg bg-indigo-600 p-[1px] transition-all hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.1)_5px,rgba(255,255,255,0.1)_10px)] opacity-20"></div>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:animate-[shimmer_1s_infinite]"></div>

                                    <div className="relative h-full bg-slate-950/80 rounded-lg px-4 flex items-center justify-center gap-3 transition-colors group-hover:bg-indigo-600/90">
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin text-indigo-300 group-hover:text-white" />
                                                <span className="font-bold font-mono uppercase tracking-widest text-xs text-indigo-100 group-hover:text-white">Processing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="font-bold font-mono uppercase tracking-widest text-xs text-indigo-100 group-hover:text-white">Execute Analysis</span>
                                                <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                    </form>

                    {/* Bottom Status Bar */}
                    <div className="border-t border-white/5 pt-2 flex justify-between items-center text-[9px] font-mono text-slate-600 uppercase">
                        <span>SECURE CONNECTION ESTABLISHED</span>
                        <span className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-indigo-500 rounded-full animate-ping"></span>
                            AWAITING INPUT
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScopeForm;
