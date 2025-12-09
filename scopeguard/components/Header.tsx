import React from 'react';
import { Shield, Activity, Zap } from 'lucide-react';

interface HeaderProps {
    credits: number;
    currentView: 'landing' | 'app' | 'pricing';
    onNavigate: (view: 'landing' | 'app' | 'pricing') => void;
}

const Header: React.FC<HeaderProps> = ({ credits, currentView, onNavigate }) => {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between relative z-10">
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => onNavigate('landing')}
                >
                    <div className="relative flex items-center justify-center w-9 h-9 bg-indigo-600 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:bg-indigo-500 transition-all duration-300 group-hover:scale-110">
                        <div className="absolute inset-0 bg-indigo-400 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                        <Shield className="w-5 h-5 text-white fill-current relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase group-hover:text-indigo-400 transition-colors">
                            ScopeGuard
                        </h1>
                        <p className="text-[9px] text-slate-500 font-mono tracking-[0.2em] uppercase">
                            Digital Bodyguard Protocol
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">

                    {/* Only show system status and credits inside the app, not on landing page */}
                    {currentView !== 'landing' && (
                        <div className="hidden md:flex items-center gap-6 border-r border-slate-800 pr-6 mr-2">
                            <div className="flex items-center gap-2">
                                <div className={`relative w-2 h-2 rounded-full ${credits > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                    <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${credits > 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                </div>
                                <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${credits > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {credits > 0 ? 'System Online' : 'Credits Depleted'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded border border-slate-800">
                                <Zap className="w-3 h-3 text-amber-400 fill-current" />
                                <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">
                                    Credits: <span className="text-white font-bold">{credits}</span>
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-xs font-mono font-medium text-slate-400">
                        {currentView === 'landing' ? (
                            <>
                                <button onClick={() => onNavigate('pricing')} className="hidden sm:block hover:text-white transition-colors uppercase tracking-widest text-[11px]">Pricing</button>
                                <button
                                    onClick={() => onNavigate('app')}
                                    className="px-6 py-2.5 bg-white text-slate-950 hover:bg-indigo-50 hover:scale-105 transition-all uppercase rounded-md font-bold text-[11px] tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                >
                                    Launch Interface
                                </button>
                            </>
                        ) : (
                            <>
                                {credits > 50 ? (
                                    <span className="text-indigo-400 uppercase tracking-wider font-bold drop-shadow-[0_0_10px_rgba(129,140,248,0.3)]">PRO ACCOUNT</span>
                                ) : (
                                    <button
                                        onClick={() => onNavigate('pricing')}
                                        className="hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]"
                                    >
                                        Upgrade to Agency
                                    </button>
                                )}
                                <button
                                    onClick={() => onNavigate('app')}
                                    className="px-4 py-2 bg-indigo-600/10 border border-indigo-500/50 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all uppercase rounded font-bold tracking-wider text-[10px]"
                                >
                                    {currentView === 'app' ? 'New Scan' : 'Dashboard'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
