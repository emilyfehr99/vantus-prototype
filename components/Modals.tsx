import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, FileText, Database, Lock, Search, Download, BarChart3, HelpCircle, ChevronDown, CheckCircle2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'procurement' | 'login' | 'faq';
}

const faqs = [
  {
    q: "Is this just 'Big Brother' spying on me?",
    a: "No. We build Privacy-Gated Overwatch. Vantus does not flag 'policy violations' (swearing, smoking). It is strictly programmed for Safety Triggers. Live feeds only push to Command when a threat threshold (Weapon/Heart Rate/Voice Stress) is breached."
  },
  {
    q: "Can the AI trigger a false arrest?",
    a: "Vantus provides Intelligence, not Authority. It alerts the officer: 'Suspect has an object in right hand.' The officer makes the decision. We provide the 'Source of Truth' that protects officers from false accusations in court."
  },
  {
    q: "What if the internet goes out?",
    a: "Edge-AI. The core threat detection models run locally on the smartphone's NPU. It doesn't need cloud to 'see' a gun; it only needs cloud to 'dispatch' backup. If signal is lost, it caches data and alerts via Bluetooth to wearables."
  },
  {
    q: "Our department is broke. How do we pay for this?",
    a: "Departments utilize the 'Personnel Loophole'. A 100-man department that is 10 men short has ~$1.5M in unspent salary. Using $200k of that to make the remaining 90 officers safer is a fiscal no-brainer."
  }
];

export const TacticalOverlay: React.FC<ModalProps> = ({ isOpen, onClose, title, type }) => {
  const MotionDiv = motion.div as any;
  const MotionButton = motion.button as any;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <MotionDiv 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />
          
          <MotionDiv 
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            className="relative w-full max-w-5xl bg-[#080808] border border-neutral-800 rounded-sm overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(0,255,65,0.05)]"
          >
            {/* Header */}
            <div className="p-8 border-b border-neutral-900 flex justify-between items-center bg-neutral-950/50 backdrop-blur-md">
              <div className="flex items-center gap-6">
                <div className="p-3 bg-neutral-900 border border-neutral-800 text-[#00FF41]">
                  {type === 'procurement' && <BarChart3 size={20} />}
                  {type === 'faq' && <HelpCircle size={20} />}
                  {type === 'login' && <Lock size={20} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight uppercase">{title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="font-mono text-[9px] text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Lock size={10} className="text-[#00FF41]" /> ACCESS_LEVEL_04 // SECURED
                    </span>
                  </div>
                </div>
              </div>
              <MotionButton 
                whileHover={{ rotate: 90, scale: 1.1, color: 'white' }}
                onClick={onClose} 
                className="p-3 bg-neutral-900/50 hover:bg-neutral-900 text-neutral-600 transition-all rounded-full"
              >
                <X size={24} />
              </MotionButton>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              {type === 'procurement' && (
                <div className="space-y-16">
                   {/* Pricing Tiers */}
                   <div className="grid md:grid-cols-2 gap-8">
                      <MotionDiv 
                        whileHover={{ y: -5, borderColor: '#00FF4166', boxShadow: '0 10px 30px -10px rgba(0,255,65,0.1)' }}
                        className="p-8 bg-neutral-950 border border-neutral-900 group transition-all duration-300"
                      >
                         <span className="font-mono text-[9px] text-[#00FF41] uppercase tracking-widest mb-4 block group-hover:tracking-[0.4em] transition-all">Tier 1: Patrol</span>
                         <h4 className="text-4xl font-black text-white mb-6">$2,000<span className="text-sm font-mono text-neutral-600 ml-2">/ officer / year</span></h4>
                         <ul className="space-y-3 font-mono text-[10px] text-neutral-500">
                            <li className="flex items-center gap-3 group-hover:text-neutral-300 transition-colors"><CheckCircle2 size={12} className="text-[#00FF41]" /> Full Partner Suite (Guardian + Scribe)</li>
                            <li className="flex items-center gap-3 group-hover:text-neutral-300 transition-colors"><CheckCircle2 size={12} className="text-[#00FF41]" /> Edge-AI License</li>
                         </ul>
                      </MotionDiv>
                      <MotionDiv 
                        whileHover={{ y: -5, borderColor: '#ffffff22', boxShadow: '0 10px 30px -10px rgba(255,255,255,0.05)' }}
                        className="p-8 bg-neutral-950 border border-neutral-900 group transition-all duration-300"
                      >
                         <span className="font-mono text-[9px] text-neutral-600 uppercase tracking-widest mb-4 block group-hover:tracking-[0.4em] transition-all">Tier 2: Command</span>
                         <h4 className="text-4xl font-black text-white mb-6">$5,000<span className="text-sm font-mono text-neutral-600 ml-2">/ station / year</span></h4>
                         <ul className="space-y-3 font-mono text-[10px] text-neutral-500">
                            <li className="flex items-center gap-3 group-hover:text-neutral-300 transition-colors"><CheckCircle2 size={12} className="text-[#00FF41]" /> Real-time Lieutenant Dashboard</li>
                            <li className="flex items-center gap-3 group-hover:text-neutral-300 transition-colors"><CheckCircle2 size={12} className="text-[#00FF41]" /> Live Incident Push Capability</li>
                         </ul>
                      </MotionDiv>
                   </div>

                   {/* Strategic Funding Block */}
                   <div className="p-10 bg-[#00FF41]/5 border border-[#00FF41]/20 space-y-10 group/fund">
                      <div>
                        <h4 className="text-xl font-black uppercase mb-4 text-[#00FF41] group-hover/fund:translate-x-1 transition-transform">Funding Strategic Reserves</h4>
                        <p className="text-sm text-neutral-400 leading-relaxed font-mono">
                          Vantus is high-margin SaaS that scales with your existing personnel budget.
                        </p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-12">
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-[#00FF41]/10 flex items-center justify-center text-[#00FF41] font-bold">1</div>
                               <span className="font-bold text-white uppercase italic">The Liability Shield</span>
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed font-mono">
                               Partnering with Municipal Insurance Pools (Travelers, CIRSA). If adopted, insurers provide a <span className="text-white">~$500/officer credit</span> on liability premiums due to reduced risk of wrongful death/injury.
                            </p>
                         </div>
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-[#00FF41]/10 flex items-center justify-center text-[#00FF41] font-bold">2</div>
                               <span className="font-bold text-white uppercase italic">The Personnel Loophole</span>
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed font-mono">
                               A 100-man department that is 10 men short has ~$1.5M in unspent salary. Reallocating 13% of that covers the digital partner suite for the entire active force.
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {type === 'faq' && (
                <div className="max-w-4xl mx-auto space-y-4">
                  {faqs.map((faq, i) => (
                    <div key={i} className="border border-neutral-900 bg-black/50 group overflow-hidden">
                      <button 
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full p-8 flex justify-between items-center text-left hover:bg-white/[0.02] transition-colors group-hover:border-l-4 group-hover:border-[#00FF41] transition-all duration-300"
                      >
                        <span className="font-black text-sm uppercase italic tracking-tighter text-neutral-200 group-hover:text-[#00FF41] transition-colors">
                          {faq.q}
                        </span>
                        <ChevronDown className={`text-[#00FF41] transition-transform duration-500 ${openFaq === i ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {openFaq === i && (
                          <MotionDiv
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-8 pt-0 text-neutral-500 font-mono text-xs leading-relaxed border-t border-neutral-900 bg-[#00FF41]/[0.01]">
                              {faq.a}
                            </div>
                          </MotionDiv>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}

              {type === 'login' && (
                <div className="max-w-md mx-auto py-20 text-center space-y-12">
                  <div className="space-y-4 group">
                    <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#00FF41] mx-auto group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all">
                      <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-2xl font-black uppercase">Authentication Required</h3>
                    <p className="text-xs text-neutral-500 font-mono">Authorized Law Enforcement Personnel Only. All access is logged and FIPS compliant.</p>
                  </div>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <input 
                      type="text" 
                      placeholder="BADGE_ID_VERIFY" 
                      className="w-full bg-black border border-neutral-800 p-5 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all"
                    />
                    <input 
                      type="password" 
                      placeholder="RSA_TOKEN_KEY" 
                      className="w-full bg-black border border-neutral-800 p-5 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all"
                    />
                    <MotionButton 
                      whileHover={{ scale: 1.02, backgroundColor: '#ffffff', boxShadow: '0 0 30px rgba(0,255,65,0.2)' }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-5 bg-[#00FF41] text-black font-black uppercase tracking-widest text-xs transition-all"
                    >
                      Access Terminal
                    </MotionButton>
                  </form>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-black border-t border-neutral-900 flex justify-between items-center text-neutral-700 font-mono text-[8px]">
               <span className="hover:text-neutral-400 transition-colors cursor-default">FIPS 140-2 // SECURE_CHANNEL_READY</span>
               <span className="hover:text-neutral-400 transition-colors cursor-default">v4.2.0-STABLE</span>
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};