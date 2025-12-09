import React, { useState, useEffect } from 'react';
import { Copy, Check, DollarSign, RefreshCw, ShieldAlert, FileText, Clock, BarChart3, Binary, ShieldCheck } from 'lucide-react';
import { AnalysisResponse, VerdictType } from '../types';

interface AnalysisResultProps {
    result: AnalysisResponse;
    onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
    const [copied, setCopied] = useState(false);
    const [revenue, setRevenue] = useState(0);
    const [timeSaved, setTimeSaved] = useState(0);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [pdfReady, setPdfReady] = useState(false);

    useEffect(() => {
        if (result.verdict === VerdictType.OUT_OF_SCOPE) {
            // Animate Revenue
            const revInterval = setInterval(() => {
                setRevenue(prev => {
                    if (prev >= 450) {
                        clearInterval(revInterval);
                        return 450;
                    }
                    return prev + 15;
                });
            }, 30);

            // Animate Time Saved
            const timeInterval = setInterval(() => {
                setTimeSaved(prev => {
                    if (prev >= 2.5) {
                        clearInterval(timeInterval);
                        return 2.5;
                    }
                    return prev + 0.1;
                });
            }, 50);

            return () => {
                clearInterval(revInterval);
                clearInterval(timeInterval);
            };
        }
    }, [result.verdict]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result.emailDraft);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGeneratePDF = () => {
        setGeneratingPDF(true);
        setTimeout(() => {
            setGeneratingPDF(false);
            setPdfReady(true);
        }, 2500);
    };

    const isCreep = result.verdict === VerdictType.OUT_OF_SCOPE;
    const isUnclear = result.verdict === VerdictType.UNCLEAR;

    const accentColor = isCreep ? 'text-rose-500' : isUnclear ? 'text-amber-500' : 'text-emerald-500';
    const borderColor = isCreep ? 'border-rose-500/50' : isUnclear ? 'border-amber-500/50' : 'border-emerald-500/50';
    const glowShadow = isCreep ? 'shadow-[0_0_50px_rgba(244,63,94,0.15)]' : 'shadow-[0_0_50px_rgba(16,185,129,0.15)]';
    const bgGradient = isCreep
        ? 'bg-gradient-to-b from-rose-950/20 to-slate-950/80'
        : 'bg-gradient-to-b from-emerald-950/20 to-slate-950/80';

    const Icon = isCreep ? ShieldAlert : isUnclear ? Binary : ShieldCheck;
    const title = isCreep ? 'SCOPE BREACH DETECTED' : isUnclear ? 'AMBIGUOUS DATA PROTOCOL' : 'SCOPE SECURE';

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">

            {/* Main Holographic Card */}
            <div className={`relative rounded-2xl border ${borderColor} ${bgGradient} backdrop-blur-xl p-1 overflow-hidden ${glowShadow}`}>
                {/* Scan Line Animation */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-[10px] animate-[scan_3s_ease-in-out_infinite] opacity-50 pointer-events-none"></div>

                <div className="relative z-10 bg-slate-950/50 rounded-xl p-8 md:p-12">
                    <div className="flex items-start justify-between mb-8 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-xl border ${borderColor} bg-slate-950 shadow-inner`}>
                                <Icon className={`w-8 h-8 ${accentColor}`} />
                            </div>
                            <div>
                                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Analysis Verdict</div>
                                <h1 className={`text-2xl md:text-3xl font-black italic tracking-tighter uppercase ${accentColor} drop-shadow-lg`}>
                                    {title}
                                </h1>
                            </div>
                        </div>
                        {isCreep && (
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Confidence Score</span>
                                <span className="text-2xl font-mono font-bold text-white">98.4%</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Left: Data & Reasoning */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="space-y-2">
                                <span className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                    <Binary className="w-3 h-3" /> AI Reasoning Logic
                                </span>
                                <p className="text-slate-300 leading-relaxed font-mono text-sm border-l-2 border-slate-800 pl-4 py-2">
                                    "{result.reasoning}"
                                </p>
                            </div>

                            {/* Draft Email Section */}
                            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden shadow-inner">
                                <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/20">
                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                                        Suggested Response Draft
                                    </span>
                                    <button
                                        onClick={copyToClipboard}
                                        className="group flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-indigo-400 hover:text-white transition-colors"
                                    >
                                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 group-hover:scale-110 transition-transform" />}
                                        {copied ? 'COPIED TO CLIPBOARD' : 'COPY TEXT'}
                                    </button>
                                </div>
                                <div className="p-6">
                                    <p className="text-xs text-slate-500 font-mono mb-4 uppercase">Subject: <span className="text-white normal-case">{result.suggestedSubject}</span></p>
                                    <div className="font-mono text-sm leading-7 text-slate-300 whitespace-pre-wrap">
                                        {result.emailDraft}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Metrics / Actions */}
                        <div className="space-y-6">
                            {isCreep ? (
                                <>
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                            <BarChart3 className="w-12 h-12 text-emerald-500" />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Revenue at Risk</span>
                                        <div className="text-4xl font-mono font-bold text-emerald-500 mt-2 mb-1">${revenue}</div>
                                        <span className="text-[10px] text-emerald-500/60 uppercase tracking-wider">Recoverable</span>
                                    </div>
                                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                                            <Clock className="w-12 h-12 text-indigo-500" />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Admin Saved</span>
                                        <div className="text-4xl font-mono font-bold text-indigo-400 mt-2 mb-1">{timeSaved.toFixed(1)}h</div>
                                        <span className="text-[10px] text-indigo-400/60 uppercase tracking-wider">Efficiency Gain</span>
                                    </div>

                                    <button
                                        onClick={handleGeneratePDF}
                                        disabled={generatingPDF}
                                        className={`w-full py-4 rounded-xl border border-slate-700/50 font-bold font-mono uppercase tracking-wider text-xs transition-all flex flex-col items-center justify-center gap-2 ${pdfReady ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20' : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                    >
                                        {pdfReady ? (
                                            <>
                                                <Check className="w-6 h-6" />
                                                <span>Change Order Ready</span>
                                                <span className="text-[9px] opacity-70">Click to Download</span>
                                            </>
                                        ) : generatingPDF ? (
                                            <>
                                                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                                                <span>Generating PDF...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-6 h-6" />
                                                <span>Generate Change Order</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-50 space-y-4 border border-dashed border-slate-800 rounded-xl">
                                    <ShieldCheck className="w-12 h-12 text-slate-600" />
                                    <p className="text-sm text-slate-500">No scope creep detected. <br />You are safe.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-4">
                <button
                    onClick={onReset}
                    className="group flex items-center gap-3 px-8 py-3 text-slate-500 hover:text-white transition-colors text-xs font-mono font-bold uppercase tracking-widest"
                >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Initialize New Scan
                </button>
            </div>
        </div>
    );
};

export default AnalysisResult;
