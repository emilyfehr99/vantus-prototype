import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, FileText, Database, Lock, Search, Download, BarChart3, HelpCircle, ChevronDown, CheckCircle2, Mail, Target } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'login' | 'waitlist' | 'faq' | 'opioid' | 'careers' | 'whitepaper' | 'contact' | 'privacy' | 'terms';
  children?: React.ReactNode;
}

const faqs = [
  {
    q: "Is this just Abel or Code Four?",
    a: "No, Vantus is an active safety partner prioritizing threat detection and automatic dispatch, not just a passive AI scribe for post-incident paperwork."
  },
  {
    q: "What about false positives?",
    a: "Our Multi-Modal Consensus requires alignment between audio detection and computer vision before triggering Tier 2 alerts, keeping false positive rates under 5%."
  },
  {
    q: "What are the privacy implications?",
    a: "Vantus operates with Privacy-by-Design. There is no surveillance or continuous recording; data is processed in volatile buffers that evaporate unless a threat locks it to immutable storage."
  },
  {
    q: "Didn't Axon build this?",
    a: "No. Axon provides the physical hardware and passive recording. Vantus is the intelligent software layer that integrates with Axon via APIs to provide real-time active overwatch."
  }
];

export const TacticalOverlay: React.FC<ModalProps> = ({ isOpen, onClose, title, type, children }) => {
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
                  {type === 'opioid' && <Database size={20} />}
                  {type === 'faq' && <HelpCircle size={20} />}
                  {type === 'waitlist' && <ShieldAlert size={20} />}
                  {type === 'login' && <Lock size={20} />}
                  {type === 'whitepaper' && <FileText size={20} />}
                  {type === 'careers' && <Search size={20} />}
                  {type === 'contact' && <Mail size={20} />}
                  {type === 'privacy' && <Lock size={20} />}
                  {type === 'terms' && <FileText size={20} />}
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
              {children ? (
                <div className="max-w-4xl mx-auto">
                  {children}
                </div>
              ) : (
                <>
                  {type === 'privacy' && (
                    <div className="space-y-8 max-w-4xl mx-auto text-neutral-400 font-mono text-xs leading-relaxed">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Privacy Policy</h4>
                      <p>Last Updated: {new Date().toLocaleDateString()}</p>
                      <div className="space-y-4">
                        <h5 className="text-[#00FF41] uppercase tracking-widest font-bold">1. Data Collection & Processing</h5>
                        <p>Vantus Safety Systems prioritizes Privacy-by-Design. The Active AI Partner analyzes audio and visual telemetry locally and in volatile buffers. Data is only durably recorded when a validated threat is detected or when manually triggered by the officer.</p>
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-[#00FF41] uppercase tracking-widest font-bold">2. Data Security</h5>
                        <p>All transmitted data is protected via AES-256 encryption both in transit and at rest. Our systems comply with CJIS and PIPEDA requirements for handling sensitive law enforcement data.</p>
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-[#00FF41] uppercase tracking-widest font-bold">3. Third-Party Sharing</h5>
                        <p>We do not sell, rent, or trade any biometric, location, or operational data. Information is only shared with authorized department personnel and dispatch systems as required for the execution of official duties.</p>
                      </div>
                    </div>
                  )}

                  {type === 'terms' && (
                    <div className="space-y-8 max-w-4xl mx-auto text-neutral-400 font-mono text-xs leading-relaxed">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Terms of Use</h4>
                      <p>Last Updated: {new Date().toLocaleDateString()}</p>
                      <div className="space-y-4">
                        <h5 className="text-[#00FF41] uppercase tracking-widest font-bold">1. Acceptance of Terms</h5>
                        <p>By accessing or using the Vantus Safety Systems platform, hardware, or associated services, you agree to be bound by these Terms of Use and all applicable laws and regulations.</p>
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-[#00FF41] uppercase tracking-widest font-bold">2. Authorized Use</h5>
                        <p>The Vantus platform is intended strictly for use by authorized law enforcement and first responder personnel. Unauthorized access, reverse engineering, or attempts to circumvent security protocols are strictly prohibited and may result in legal action.</p>
                      </div>
                      <div className="space-y-4">
                        <h5 className="text-[#00FF41] uppercase tracking-widest font-bold">3. Limitation of Liability</h5>
                        <p>Vantus Safety Systems provides an assistive technological layer. It is not a replacement for officer judgment, training, or established departmental protocols. Vantus shall not be held liable for operational outcomes resulting from the use or inability to use the system.</p>
                      </div>
                    </div>
                  )}

                  {type === 'careers' && (
                    <div className="space-y-10 max-w-4xl mx-auto">
                      <div className="text-center space-y-4 mb-8">
                        <h4 className="text-3xl font-black uppercase tracking-tight">Join The Mission</h4>
                        <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Building the Future of Officer Safety</p>
                      </div>
                      <MotionDiv
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#00FF41]/5 border border-[#00FF41]/30 p-8 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-[#00FF41] text-black text-[9px] font-black uppercase tracking-widest px-4 py-2">
                          Now Hiring
                        </div>
                        <div className="space-y-6">
                          <div>
                            <span className="font-mono text-[9px] text-[#00FF41] uppercase tracking-[0.3em] block mb-2">Open Position</span>
                            <h5 className="text-2xl font-black uppercase tracking-tight">Founding Engineer</h5>
                            <div className="flex flex-wrap gap-4 mt-3 font-mono text-[10px] text-neutral-500 uppercase">
                              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#00FF41] rounded-full"></span>Full-Time</span>
                              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#00FF41] rounded-full"></span>Remote-First</span>
                              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#00FF41] rounded-full"></span>Equity Package</span>
                            </div>
                          </div>
                          <div className="border-t border-[#00FF41]/20 pt-6">
                            <h6 className="text-xs font-black uppercase text-[#00FF41] mb-3 tracking-widest">The Mission</h6>
                            <p className="text-sm text-neutral-400 leading-relaxed">
                              We're building AI-powered safety systems that give law enforcement officers a "digital partner" capable of real-time threat detection and situational awareness. As a Founding Engineer, you'll architect the core systems that could save lives every day.
                            </p>
                          </div>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h6 className="text-xs font-black uppercase text-white mb-2 tracking-widest">What You'll Build</h6>
                              <ul className="space-y-2 text-xs text-neutral-500 font-mono">
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />Edge-AI inference pipelines for mobile devices</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />Real-time computer vision for threat detection</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />Cross-platform mobile applications (iOS/Android)</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />Secure, low-latency command dashboards</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />Infrastructure that scales to thousands of officers</li>
                              </ul>
                            </div>
                            <div className="space-y-3">
                              <h6 className="text-xs font-black uppercase text-white mb-2 tracking-widest">You Bring</h6>
                              <ul className="space-y-2 text-xs text-neutral-500 font-mono">
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />3+ years production software experience</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />TypeScript, Python, or Swift proficiency</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />ML/CV experience (TensorFlow, PyTorch, CoreML)</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />Startup or zero-to-one building mentality</li>
                                <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#00FF41] mt-0.5 flex-shrink-0" />Passion for public safety and saving lives</li>
                              </ul>
                            </div>
                          </div>
                          <div className="bg-black/50 border border-neutral-800 p-5">
                            <h6 className="text-xs font-black uppercase text-white mb-2 tracking-widest">Compensation</h6>
                            <p className="text-xs text-neutral-500 font-mono leading-relaxed">
                              Competitive salary + significant founding equity. Shape the company from day one. Benefits include health, dental, unlimited PTO, and the satisfaction of building something that matters.
                            </p>
                          </div>
                        </div>
                      </MotionDiv>
                      <div className="bg-neutral-950 border border-neutral-900 p-8">
                        <div className="text-center space-y-2 mb-8">
                          <h5 className="text-xl font-black uppercase">Apply Now</h5>
                          <p className="text-neutral-600 font-mono text-[10px] uppercase tracking-widest">Initiate Contact // Secure Channel</p>
                        </div>
                        <form className="space-y-4 max-w-md mx-auto" onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const resumeInput = e.currentTarget.querySelector('input[name="resume"]') as HTMLInputElement;
                          const resumeFileName = resumeInput?.files?.[0]?.name || 'No file selected';
                          const subject = `Founding Engineer Application: ${formData.get('name')}`;
                          const body = `FOUNDING ENGINEER APPLICATION\n\nName: ${formData.get('name')}\nEmail: ${formData.get('email')}\nLinkedIn/Portfolio: ${formData.get('portfolio')}\n\nWhy Vantus:\n${formData.get('message')}\n\n---\n⚠️ IMPORTANT: Please attach your resume file "${resumeFileName}" to this email before sending.`;
                          window.location.href = `mailto:vantussafetysystems@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                        }}>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">Full Name</label>
                              <input name="name" required type="text" placeholder="OPERATOR_NAME" className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">Email</label>
                              <input name="email" required type="email" placeholder="COMMS_CHANNEL" className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">LinkedIn / Portfolio / GitHub</label>
                            <input name="portfolio" type="text" placeholder="https://..." className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">Resume / CV</label>
                            <input name="resume" type="file" accept=".pdf,.doc,.docx,.txt,.rtf" className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-mono file:font-bold file:uppercase file:tracking-widest file:bg-[#00FF41]/20 file:text-[#00FF41] hover:file:bg-[#00FF41]/30 file:cursor-pointer transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">Why Vantus?</label>
                            <textarea name="message" required rows={4} placeholder="What drives you to build life-saving technology..." className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all resize-none" />
                          </div>
                          <MotionButton type="submit" whileHover={{ scale: 1.02, backgroundColor: '#ffffff', boxShadow: '0 0 30px rgba(0,255,65,0.2)' }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-[#00FF41] text-black font-black uppercase tracking-widest text-xs transition-all mt-4">
                            Send Message
                          </MotionButton>
                        </form>
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
                                transition={{ duration: 0 }}
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
                      <div className="flex justify-center gap-6 mt-8 opacity-60">
                        <span className="font-mono text-xs uppercase tracking-widest flex items-center gap-2"><ShieldAlert size={14} className="text-[#00FF41]" /> CJIS Compliant</span>
                        <span className="font-mono text-xs uppercase tracking-widest flex items-center gap-2"><Lock size={14} className="text-[#00FF41]" /> PIPEDA Compliant</span>
                        <span className="font-mono text-xs uppercase tracking-widest flex items-center gap-2"><Database size={14} className="text-[#00FF41]" /> FIPS 140-2</span>
                      </div>
                    </div>
                  )}

                  {type === 'waitlist' && (
                    <div className="max-w-md mx-auto py-10 text-center space-y-8">
                      <div className="space-y-4 group">
                        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#00FF41] mx-auto group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] transition-all">
                          <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-2xl font-black uppercase">Get a Free Demo</h3>
                        <p className="text-xs text-neutral-500 font-mono">Schedule a live demonstration of the Vantus Intelligent Safety platform.</p>
                      </div>
                      <form className="space-y-4 text-left" onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const subject = `Pilot Waitlist: ${formData.get('department')} Dept`;
                        const body = `Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\nDepartment: ${formData.get('department')}\nSize: ${formData.get('size')}`;
                        window.location.href = `mailto:vantussafetysystems@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}>
                        <input name="name" required type="text" placeholder="YOUR_NAME" className="w-full bg-black border border-neutral-800 p-5 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                        <input name="email" required type="email" placeholder="YOUR_EMAIL" className="w-full bg-black border border-neutral-800 p-5 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                        <input name="department" required type="text" placeholder="DEPARTMENT_NAME" className="w-full bg-black border border-neutral-800 p-5 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                        <input name="size" required type="number" placeholder="DEPARTMENT_SIZE (e.g. 50)" className="w-full bg-black border border-neutral-800 p-5 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                        <MotionButton whileHover={{ scale: 1.02, backgroundColor: '#ffffff', boxShadow: '0 0 30px rgba(0,255,65,0.2)' }} whileTap={{ scale: 0.98 }} className="w-full py-5 bg-[#00FF41] text-black font-black uppercase tracking-widest text-xs transition-all mt-4">
                          Submit Request
                        </MotionButton>
                      </form>
                    </div>
                  )}

                  {type === 'whitepaper' && (
                    <div className="space-y-10 max-w-4xl mx-auto">
                      <div className="bg-[#00FF41]/5 border border-[#00FF41]/20 p-8">
                        <h4 className="text-[#00FF41] font-black uppercase mb-4 tracking-widest">Executive Summary</h4>
                        <p className="text-neutral-400 font-mono text-xs leading-relaxed">
                          Vantus is an AI-powered "Digital Partner" system designed to provide real-time situational awareness and autonomous backup dispatch for law enforcement officers. By combining edge-AI computer vision, physiological monitoring, and voice-stress analysis, Vantus creates a multi-layered threat detection system that operates locally on standard smartphones.
                        </p>
                      </div>
                      <div className="space-y-6">
                        <h4 className="text-white font-black uppercase tracking-widest">Technical Architecture</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="p-6 border border-neutral-900 bg-neutral-950">
                            <h5 className="text-[#00FF41] font-bold uppercase mb-3 text-sm">Edge-AI Processing</h5>
                            <ul className="space-y-2 text-xs text-neutral-500 font-mono">
                              <li>• Neural Processing Unit (NPU) inference</li>
                              <li>• On-device threat detection models</li>
                              <li>• Sub-100ms latency for critical alerts</li>
                              <li>• Offline-capable core functionality</li>
                            </ul>
                          </div>
                          <div className="p-6 border border-neutral-900 bg-neutral-950">
                            <h5 className="text-[#00FF41] font-bold uppercase mb-3 text-sm">Multi-Modal Fusion</h5>
                            <ul className="space-y-2 text-xs text-neutral-500 font-mono">
                              <li>• Body-worn camera video analysis</li>
                              <li>• Wearable biometric integration</li>
                              <li>• Real-time audio processing</li>
                              <li>• Action pattern recognition</li>
                            </ul>
                          </div>
                          <div className="p-6 border border-neutral-900 bg-neutral-950">
                            <h5 className="text-[#00FF41] font-bold uppercase mb-3 text-sm">Security & Compliance</h5>
                            <ul className="space-y-2 text-xs text-neutral-500 font-mono">
                              <li>• FIPS 140-2 compliant encryption</li>
                              <li>• End-to-end encrypted communications</li>
                              <li>• SB 524 audit trail compliance</li>
                              <li>• Privacy-gated data handling</li>
                            </ul>
                          </div>
                          <div className="p-6 border border-neutral-900 bg-neutral-950">
                            <h5 className="text-[#00FF41] font-bold uppercase mb-3 text-sm">Integration Points</h5>
                            <ul className="space-y-2 text-xs text-neutral-500 font-mono">
                              <li>• CAD/RMS system connectivity</li>
                              <li>• Apple Watch / Garmin pairing</li>
                              <li>• Bluetooth tactical earpiece</li>
                              <li>• Command dashboard real-time feeds</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-900 p-8">
                        <h4 className="text-white font-black uppercase mb-6 tracking-widest">Performance Benchmarks</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="text-center">
                            <div className="text-3xl font-black text-[#00FF41]">98%</div>
                            <div className="text-[10px] font-mono text-neutral-500 uppercase mt-1">NPU Load Efficiency</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-[#00FF41]">&lt;50ms</div>
                            <div className="text-[10px] font-mono text-neutral-500 uppercase mt-1">Threat Detection</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-[#00FF41]">500ms</div>
                            <div className="text-[10px] font-mono text-neutral-500 uppercase mt-1">Pre-Attack Warning</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-black text-[#00FF41]">24/7</div>
                            <div className="text-[10px] font-mono text-neutral-500 uppercase mt-1">Autonomous Overwatch</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-neutral-950 border border-neutral-900 p-8 text-center space-y-6">
                        <h4 className="text-[#00FF41] font-black uppercase tracking-widest">Receive Technical Specifications</h4>
                        <p className="text-neutral-500 font-mono text-xs mb-4">Enter your department email to receive the complete Technical Specifications PDF directly to your inbox.</p>
                        <form
                          onSubmit={(e) => { e.preventDefault(); onClose(); alert('Specs sent to email.'); }}
                          className="max-w-md mx-auto flex flex-col sm:flex-row gap-4"
                        >
                          <input
                            type="email"
                            required
                            placeholder="OFFICER@DEPARTMENT.GOV"
                            className="flex-1 bg-black border border-neutral-800 p-4 font-mono text-xs text-white focus:border-[#00FF41] focus:outline-none placeholder:text-neutral-700 transition-colors"
                          />
                          <MotionButton
                            type="submit"
                            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0,255,65,0.2)' }}
                            whileTap={{ scale: 0.98 }}
                            className="px-8 py-4 bg-[#00FF41] text-black font-black uppercase tracking-widest text-xs whitespace-nowrap"
                          >
                            Request PDF
                          </MotionButton>
                        </form>
                      </div>
                    </div>
                  )}

                  {type === 'contact' && (
                    <div className="space-y-8 max-w-md mx-auto py-10">
                      <div className="text-center space-y-4 mb-8">
                        <h4 className="text-2xl font-black uppercase">Get In Touch</h4>
                        <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Direct Line to Vantus Command</p>
                      </div>
                      <form className="space-y-4" onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const subject = formData.get('subject') || 'Contact Inquiry';
                        const body = `Name: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\nMessage:\n${formData.get('message')}`;
                        window.location.href = `mailto:vantussafetysystems@gmail.com?subject=${encodeURIComponent(subject as string)}&body=${encodeURIComponent(body)}`;
                      }}>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">Name</label>
                            <input name="name" required type="text" placeholder="YOUR_NAME" className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">Email</label>
                            <input name="email" required type="email" placeholder="YOUR_EMAIL" className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">Subject</label>
                          <input name="subject" type="text" placeholder="INQUIRY_SUBJECT" className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-[#00FF41] uppercase tracking-widest">Message</label>
                          <textarea name="message" required rows={5} placeholder="YOUR_MESSAGE..." className="w-full bg-black border border-neutral-800 p-4 font-mono text-sm text-white outline-none focus:border-[#00FF41] focus:bg-[#00FF41]/[0.02] transition-all resize-none" />
                        </div>
                        <MotionButton type="submit" whileHover={{ scale: 1.02, backgroundColor: '#ffffff', boxShadow: '0 0 30px rgba(0,255,65,0.2)' }} whileTap={{ scale: 0.98 }} className="w-full py-4 bg-[#00FF41] text-black font-black uppercase tracking-widest text-xs transition-all mt-4">
                          Send Message
                        </MotionButton>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-black border-t border-neutral-900 flex justify-between items-center text-neutral-700 font-mono text-[8px]">
              <span className="hover:text-neutral-400 transition-colors cursor-default">FIPS 140-2 // SECURE_CHANNEL_READY</span>
              <span className="hover:text-neutral-400 transition-colors cursor-default">v4.2.0-STABLE</span>
            </div>
          </MotionDiv>
        </div >
      )}
    </AnimatePresence >
  );
};