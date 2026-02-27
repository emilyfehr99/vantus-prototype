import React from 'react';
import { Cpu, Activity, Zap, Mic2, FileText, CheckCircle2, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function ArchitectureDiagram() {
    return (
        <div className="bg-neutral-900/40 backdrop-blur-md p-6 mt-6 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 mb-6">
                <ShieldAlert className="w-5 h-5 text-[#00FF41]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                    Next-Gen Validation Architecture (Anti-Simulation Layer)
                </h3>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Step 1: Raw Input */}
                <div className="flex-1 w-full bg-black/40 border border-white/5 rounded-xl p-4 text-center">
                    <Mic2 className="w-6 h-6 text-neutral-500 mx-auto mb-2" />
                    <h4 className="text-[11px] font-bold text-neutral-200">Raw Hardware Input</h4>
                    <p className="text-[10px] text-neutral-500 mt-1">Dual-Mic Body Cam</p>
                </div>

                <ArrowRight className="w-5 h-5 text-neutral-700 hidden md:block" />

                {/* Step 2: Base ML */}
                <div className="flex-1 w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                    <Activity className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <h4 className="text-[11px] font-bold text-red-100">Base ML Models</h4>
                    <p className="text-[10px] text-red-400 mt-1">YAMNet / Whisper<br />(Outputs 99% Gunshot)</p>
                </div>

                <ArrowRight className="w-5 h-5 text-neutral-700 hidden md:block" />

                {/* Step 3: The Validation Layer */}
                <div className="flex-[2] w-full bg-[#00FF41]/5 border border-[#00FF41]/20 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF41]"></div>
                    <div className="flex items-center gap-2 mb-3 justify-center">
                        <Cpu className="w-4 h-4 text-[#00FF41]" />
                        <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">First-Principles Logic Gate</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left">
                        <div className="bg-black/40 p-2 rounded border border-white/5 flex items-start gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-[10px] font-bold text-neutral-200 block">Analog Clipping</span>
                                <span className="text-[9px] text-neutral-500">Hardware shockwave test</span>
                            </div>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/5 flex items-start gap-2">
                            <Activity className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-[10px] font-bold text-neutral-200 block">Frequency Limits</span>
                                <span className="text-[9px] text-neutral-500">Infrasonic presence (&lt;20Hz)</span>
                            </div>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/5 flex items-start gap-2">
                            <Mic2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-[10px] font-bold text-neutral-200 block">Phase Alignment</span>
                                <span className="text-[9px] text-neutral-500">Stereo 3D spatial separation</span>
                            </div>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/5 flex items-start gap-2">
                            <FileText className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-[10px] font-bold text-neutral-200 block">LLM Context</span>
                                <span className="text-[9px] text-neutral-500">Syntactical media vectoring</span>
                            </div>
                        </div>
                    </div>
                </div>

                <ArrowRight className="w-5 h-5 text-neutral-700 hidden md:block" />

                {/* Step 4: Output */}
                <div className="flex-1 w-full space-y-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-100">Organic (Auto-Dispatch)</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center gap-2 opacity-50">
                        <XCircle className="w-4 h-4 text-neutral-500" />
                        <span className="text-[10px] font-bold text-neutral-400">Synthesized (Ignore)</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
