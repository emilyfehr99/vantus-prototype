import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

interface LoginProps {
    onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulated authentication
        setTimeout(() => {
            if (email === 'admin@vantus.ai' && password === 'vantus2026') {
                onLogin();
            } else {
                setError('Invalid tactical credentials. Access denied.');
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 max-w-md mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF41]/5 blur-[60px] rounded-full -mr-16 -mt-16" />

                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-[#00FF41]" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Pilot Terminal</h2>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em] mt-1">Authentication Required</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div className="space-y-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest ml-1">Email Identifier</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@vantus.ai"
                                required
                                className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#00FF41]/30 focus:ring-1 focus:ring-[#00FF41]/10 transition-all placeholder:text-neutral-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest ml-1">Secure Key</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-black/50 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#00FF41]/30 focus:ring-1 focus:ring-[#00FF41]/10 transition-all placeholder:text-neutral-700"
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 text-red-400 text-[11px] font-medium bg-red-400/5 border border-red-400/10 p-3 rounded-xl"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white hover:bg-neutral-100 disabled:opacity-50 text-black font-black uppercase text-xs tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-6 group"
                    >
                        {isLoading ? 'Authenticating...' : (
                            <>
                                Initialize Pilot Session
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-800/50 flex flex-col items-center">
                    <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                        Vantus Encrypted Terminal v4.0.2
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
