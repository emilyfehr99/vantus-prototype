"use client";

import { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Freelancer");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, role }),
            });

            if (!response.ok) throw new Error("Submission failed");

            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting to waitlist:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
                <div className="w-full max-w-md bg-zinc-950 border border-emerald-500/20 rounded-lg p-8 text-center relative shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex justify-center mb-6">
                        <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20">
                            <Lock className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Price Locked.</h2>
                    <p className="text-zinc-400">
                        You've secured the early adopter rate. We will notify you when your account is ready.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden relative">

                {/* Header */}
                <div className="bg-emerald-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
                    <h2 className="text-3xl font-bold uppercase tracking-tighter relative z-10 drop-shadow-md">Stop Working <br /> For Free.</h2>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-zinc-300 font-medium leading-relaxed">
                            ScopeGuard has recovered <span className="text-emerald-500 font-bold">$4,500</span> for freelancers this month.
                        </p>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
                            Join the Pro Tier to automate this in Gmail.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Email Address</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-zinc-700"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Role</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-md p-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none appearance-none transition-all"
                            >
                                <option>Freelancer</option>
                                <option>Agency Owner</option>
                                <option>In-House</option>
                            </select>
                        </div>

                        <div className="pt-2 space-y-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-600 text-white font-bold font-mono uppercase tracking-wider text-sm py-4 rounded-md hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 group"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Waitlist & Lock Price"}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full text-zinc-600 text-[10px] font-mono uppercase tracking-widest hover:text-zinc-400 transition-colors py-2"
                            >
                                No thanks, I prefer losing money.
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
