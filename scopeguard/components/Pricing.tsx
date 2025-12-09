import React, { useState } from 'react';
import { Check, Loader2, Building2, User, Star, CreditCard, Shield } from 'lucide-react';

interface PricingProps {
    onUpgrade: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onUpgrade }) => {
    const [processing, setProcessing] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

    const handleSubscribe = () => {
        setProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setProcessing(false);
            onUpgrade();
        }, 2000);
    };

    const prices = {
        freelancer: {
            monthly: 29,
            annual: 290 // 2 months free
        },
        agency: {
            monthly: 99,
            annual: 990 // 2 months free
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="text-center mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Revenue Protection</span>
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter">SECURE YOUR REVENUE</h2>
                <p className="text-slate-400 max-w-lg mx-auto text-lg pt-2 font-light">
                    Choose a plan to continue detecting scope creep and generating billable Change Orders.
                </p>
            </div>

            {/* Billing Cycle Toggle - Apple Style */}
            <div className="flex justify-center mb-16">
                <div className="bg-slate-800/50 p-1 rounded-full flex relative shadow-inner border border-white/5 backdrop-blur-sm">
                    {/* Sliding White Background */}
                    <div
                        className="absolute top-1 bottom-1 bg-white rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] shadow-sm z-0"
                        style={{
                            left: billingCycle === 'monthly' ? '4px' : '50%',
                            width: 'calc(50% - 4px)',
                            transform: billingCycle === 'annual' ? 'translateX(0)' : 'translateX(0)'
                        }}
                    ></div>

                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`relative z-10 px-8 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 w-36 ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('annual')}
                        className={`relative z-10 px-8 py-2.5 text-sm font-semibold rounded-full transition-colors duration-300 w-36 flex items-center justify-center gap-2 ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        Yearly
                        {billingCycle === 'monthly' && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-bold animate-pulse absolute -top-2 -right-2">
                                -20%
                            </span>
                        )}
                        {billingCycle === 'annual' && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold ml-1">
                                -20%
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative z-10">

                {/* Freelancer Plan - Standard Glass */}
                <div className="p-8 border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md rounded-2xl transition-all relative group hover:-translate-y-1 duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-white/5 group-hover:bg-slate-800 transition-colors">
                            <User className="w-6 h-6 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-mono font-bold text-white uppercase tracking-widest">Freelancer</h3>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Solo Operator</div>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-1 mb-8">
                        <span className="text-5xl font-black text-white tracking-tighter">
                            ${billingCycle === 'monthly' ? prices.freelancer.monthly : prices.freelancer.annual}
                        </span>
                        <span className="text-sm text-slate-500 font-normal uppercase tracking-widest">
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                    </div>

                    <ul className="space-y-4 mb-8">
                        {[
                            "1 Active Contract Upload",
                            "Gmail Integration",
                            "Draft Replies Only",
                            "Recover up to $1,000/mo"
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={handleSubscribe}
                        className="w-full py-4 bg-slate-800 text-slate-300 rounded-xl font-bold font-mono uppercase tracking-wider text-xs hover:bg-white hover:text-slate-950 transition-all border border-slate-700/50 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        Select Freelancer
                    </button>
                </div>

                {/* Agency Plan - Holographic Foil Effect */}
                <div className="relative p-[1px] rounded-2xl overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
                    {/* Animated Gradient Border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500 animate-[gradient-x_3s_linear_infinite] opacity-70"></div>

                    <div className="relative h-full bg-slate-950/90 backdrop-blur-xl rounded-2xl p-8 overflow-hidden">
                        {/* Foil Shine Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                        <div className="absolute top-0 right-0 p-4">
                            <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-[0_0_10px_rgba(99,102,241,0.5)]">RECOMMENDED</span>
                        </div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30">
                                <Building2 className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 uppercase tracking-widest">Agency</h3>
                                <div className="text-[10px] text-indigo-400 uppercase tracking-widest mt-1">Full Organization</div>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-1 mb-8 relative z-10">
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tighter">
                                ${billingCycle === 'monthly' ? prices.agency.monthly : prices.agency.annual}
                            </span>
                            <span className="text-sm text-slate-500 font-normal uppercase tracking-widest">
                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                        </div>

                        <ul className="space-y-4 mb-8 relative z-10">
                            {[
                                { text: "PDF Change Order Generator", highlight: true },
                                { text: "Slack \"Sentinel\" Integration", highlight: true },
                                { text: "Unlimited Projects & Scans", highlight: true },
                                { text: "Revenue Dashboard", highlight: true }
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <div className={`p-0.5 rounded-full ${item.highlight ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`}>
                                        <Check className="w-3 h-3 text-white" />
                                    </div>
                                    <span className={item.highlight ? "text-white font-bold" : ""}>{item.text}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleSubscribe}
                            disabled={processing}
                            className="relative w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold font-mono uppercase tracking-wider text-xs hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] border border-white/10 z-10 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center justify-center gap-2">
                                {processing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Get Agency Access</span>
                                        <CreditCard className="w-4 h-4" />
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recovery Guarantee */}
            <div className="mt-16 max-w-3xl mx-auto text-center relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 blur-3xl pointer-events-none"></div>
                <div className="relative bg-slate-950/80 border border-amber-900/30 p-8 rounded-2xl backdrop-blur-sm">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Shield className="w-5 h-5 text-amber-500 fill-current" />
                        <span className="text-sm font-mono font-bold text-amber-500 uppercase tracking-widest">Ironclad Guarantee</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xl mx-auto">
                        If ScopeGuard doesn't find at least one "Out of Scope" request in your first 30 days,
                        <span className="text-white font-bold"> we will refund your entire subscription.</span>
                        <br />Zero risk. You only pay if you save money.
                    </p>
                </div>
            </div>

        </div>
    );
};

export default Pricing;
