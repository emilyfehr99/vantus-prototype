import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useSpring, AnimatePresence, useMotionValue } from 'framer-motion';
import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { Product } from './components/Product';
import { Physics } from './components/Physics';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { Logo } from './components/Logo';
import { TacticalOverlay } from './components/Modals';
import { Radio, Menu, X, Signal, Target, LogOut, Mic, Layout, Shield } from 'lucide-react';
import { Login } from './components/Login';
import { AudioDemo } from './components/AudioDemo';

// Use React.FC to ensure children prop is correctly handled by the JSX parser and TypeScript
const NavLink: React.FC<{ onClick: () => void; children: React.ReactNode; index: string }> = ({ onClick, children, index }) => {
  const MotionDiv = motion.div as any;
  return (
    <button
      onClick={onClick}
      className="relative group py-2 px-5 flex items-center gap-3 transition-all duration-300 rounded-sm hover:bg-white/[0.03]"
    >
      <span className="font-mono text-[8px] text-[#00FF41]/40 group-hover:text-[#00FF41] transition-colors duration-300">
        [{index}]
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 group-hover:text-white transition-colors duration-500">
        {children}
      </span>

      {/* Tactical Corner Accents */}
      <MotionDiv
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#00FF41]"
      />
      <MotionDiv
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#00FF41]"
      />
    </button>
  );
};

const Header = ({
  onOpenFAQ,
  onOpenWaitlist,
  onLogout,
  isLoggedIn,
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  onOpenLogin
}: {
  onOpenFAQ: () => void,
  onOpenWaitlist: () => void,
  onOpenLogin: () => void,
  onLogout?: () => void,
  isLoggedIn: boolean,
  activeTab?: 'landing' | 'audio',
  setActiveTab?: (tab: 'landing' | 'audio') => void,
  mobileMenuOpen: boolean,
  setMobileMenuOpen: (open: boolean) => void
}) => {
  const MotionButton = motion.button as any;
  const MotionDiv = motion.div as any;

  const scrollToSection = (id: string) => {
    if (activeTab !== 'landing' && setActiveTab) {
      setActiveTab('landing');
      // Wait for re-render before scrolling
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - offset,
          behavior: 'smooth'
        });
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] transition-all duration-700 py-6 bg-black/40 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-10 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => {
            if (activeTab !== 'landing' && setActiveTab) setActiveTab('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-4 group cursor-pointer relative z-[110]"
        >
          <Logo className="h-6 w-auto text-white group-hover:text-[#00FF41] transition-colors duration-500" />
          <div className="flex flex-col leading-none">
            <span className="font-black tracking-[-0.04em] text-2xl uppercase group-hover:translate-x-1 transition-transform duration-500">Vantus</span>
            <span className="font-mono text-[7px] text-neutral-500 tracking-[0.3em] uppercase mt-1 font-bold group-hover:text-neutral-300 transition-colors duration-500">Safety Systems</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-1 bg-white/[0.02] border border-white/5 p-1 rounded-full backdrop-blur-md">
          {!isLoggedIn ? (
            <>
              <NavLink onClick={() => scrollToSection('mission')} index="01">The Problem</NavLink>
              <NavLink onClick={() => scrollToSection('features')} index="02">Our Solution</NavLink>
              <NavLink onClick={onOpenFAQ} index="03">FAQ</NavLink>
            </>
          ) : (
            <>
              <NavLink onClick={() => setActiveTab?.('landing')} index="01">
                <div className="flex items-center gap-2">
                  <Layout size={10} className={activeTab === 'landing' ? 'text-[#00FF41]' : ''} />
                  Dashboard
                </div>
              </NavLink>
              <NavLink onClick={() => setActiveTab?.('audio')} index="02">
                <div className="flex items-center gap-2">
                  <Mic size={10} className={activeTab === 'audio' ? 'text-[#00FF41]' : ''} />
                  Audio Mode
                </div>
              </NavLink>
              <NavLink onClick={onOpenFAQ} index="03">FAQ</NavLink>
            </>
          )}
        </div>

        {/* CTA Button & Mobile Toggle */}
        <div className="flex items-center gap-8 relative z-[110]">
          {!isLoggedIn ? (
            <div className="hidden md:flex items-center gap-4">
              <MotionButton
                onClick={onOpenWaitlist}
                whileHover={{ scale: 1.05, backgroundColor: '#00FF41', border: '1px solid #00FF41', color: 'black' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-8 py-3 bg-transparent border border-white/20 text-white font-black uppercase text-[10px] tracking-[0.2em] transition-all rounded-sm"
              >
                Get a Free Demo
              </MotionButton>
              <MotionButton
                onClick={onOpenLogin}
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-8 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] transition-all rounded-sm"
              >
                Pilot Access
              </MotionButton>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-[9px] font-mono text-[#00FF41] uppercase tracking-widest">Authenticated Pilot</span>
                <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">Sector 4 Access</span>
              </div>
              <MotionButton
                onClick={onLogout}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 border border-white/10 text-white font-mono uppercase text-[9px] tracking-[0.2em] transition-all rounded-sm"
              >
                <LogOut size={12} />
                Term
              </MotionButton>
            </div>
          )}

          <MotionButton
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white relative flex items-center justify-center"
            whileHover={{ scale: 1.1, color: '#00FF41' }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="drop-shadow-[0_0_8px_rgba(0,255,65,0.5)]"
                >
                  <X size={28} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={28} />
                </motion.div>
              )}
            </AnimatePresence>
          </MotionButton>
        </div >
      </div >

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {
          mobileMenuOpen && (
            <MotionDiv
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[105] flex flex-col items-center justify-center p-10 lg:hidden"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#00FF41_1px,transparent_1px)] bg-[size:32px_32px]" />

              <ul className="space-y-10 text-center">
                {!isLoggedIn ? (
                  ['The Problem', 'Our Solution', 'FAQ'].map((item, idx) => {
                    const sectionId = item.toLowerCase().replace(' ', '-');
                    return (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <button
                          onClick={() => item === 'FAQ' ? onOpenFAQ() : scrollToSection(sectionId === 'the-problem' ? 'mission' : sectionId === 'our-solution' ? 'features' : '')}
                          className="text-3xl font-black uppercase tracking-tighter hover:text-[#00FF41] transition-colors"
                        >
                          {item}
                        </button>
                      </motion.li>
                    );
                  })
                ) : (
                  ['Dashboard', 'Audio Detection', 'FAQ', 'Logout'].map((item, idx) => {
                    return (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <button
                          onClick={() => {
                            if (item === 'Dashboard') setActiveTab?.('landing');
                            else if (item === 'Audio Detection') setActiveTab?.('audio');
                            else if (item === 'FAQ') onOpenFAQ();
                            else if (item === 'Logout') onLogout?.();
                            setMobileMenuOpen(false);
                          }}
                          className={`text-3xl font-black uppercase tracking-tighter hover:text-[#00FF41] transition-colors ${item === 'Logout' ? 'text-red-500' : ''}`}
                        >
                          {item}
                        </button>
                      </motion.li>
                    );
                  })
                )}
                {!isLoggedIn && (
                  <motion.li
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex flex-col gap-4 mt-8 w-full">
                      <button
                        onClick={onOpenWaitlist}
                        className="px-12 py-5 bg-transparent border border-white/20 text-white font-black uppercase text-sm tracking-widest"
                      >
                        Get a Free Demo
                      </button>
                      <button
                        onClick={onOpenLogin}
                        className="px-12 py-5 bg-white text-black font-black uppercase text-sm tracking-widest"
                      >
                        Pilot Access
                      </button>
                    </div>
                  </motion.li>
                )}
              </ul>

              <div className="absolute bottom-12 font-mono text-[8px] text-neutral-600 uppercase tracking-[0.5em]">
                Vantus Safety Systems // Mobile Terminal
              </div>

            </MotionDiv >
          )
        }
      </AnimatePresence >
    </nav >
  );
};

const App: React.FC = () => {
  const [modalType, setModalType] = useState<'faq' | 'login' | 'waitlist' | 'careers' | 'whitepaper' | 'contact' | 'privacy' | 'terms' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'landing' | 'audio'>('landing');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const MotionDiv = motion.div as any;

  const handleLogin = () => {
    setIsLoggedIn(true);
    setModalType(null);
    setActiveTab('audio');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="bg-black text-white selection:bg-[#00FF41] selection:text-black min-h-screen relative overflow-x-hidden">
      <Header
        onOpenFAQ={() => setModalType('faq')}
        onOpenWaitlist={() => setModalType('waitlist')}
        onOpenLogin={() => setModalType('login')}
        onLogout={handleLogout}
        isLoggedIn={isLoggedIn}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <AnimatePresence mode="wait">
        {activeTab === 'landing' ? (
          <MotionDiv
            key="landing"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              scale: mobileMenuOpen ? 0.94 : 1,
              filter: mobileMenuOpen ? 'blur(10px)' : 'blur(0px)',
              y: mobileMenuOpen ? 20 : 0
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="relative z-10 origin-top"
          >
            <Hero
              onOpenWaitlist={() => setModalType('waitlist')}
              onOpenLogin={() => setModalType('login')}
              onOpenWhitepaper={() => setModalType('whitepaper')}
            />
            <div id="mission"><Problem /></div>
            <div id="features"><Product /></div>
            <Physics />
            {isLoggedIn && <div id="dashboard"><Dashboard /></div>}
            <Footer
              onOpenWaitlist={() => setModalType('waitlist')}
              onOpenCareers={() => setModalType('careers')}
              onOpenFAQ={() => setModalType('faq')}
              onOpenWhitepaper={() => setModalType('whitepaper')}
              onOpenContact={() => setModalType('contact')}
              onOpenPrivacy={() => setModalType('privacy')}
              onOpenTerms={() => setModalType('terms')}
            />
          </MotionDiv>
        ) : (
          <MotionDiv
            key="audio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 pt-32 px-10 min-h-screen"
          >
            <AudioDemo />
            <div className="mt-20">
              <Footer
                onOpenWaitlist={() => { }}
                onOpenCareers={() => setModalType('careers')}
                onOpenFAQ={() => setModalType('faq')}
                onOpenWhitepaper={() => setModalType('whitepaper')}
                onOpenContact={() => setModalType('contact')}
                onOpenPrivacy={() => setModalType('privacy')}
                onOpenTerms={() => setModalType('terms')}
              />
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>

      <TacticalOverlay isOpen={modalType === 'login'} onClose={() => setModalType(null)} title="Tactical Authentication" type="login">
        <Login onLogin={handleLogin} />
      </TacticalOverlay>

      <TacticalOverlay isOpen={modalType === 'waitlist'} onClose={() => setModalType(null)} title="Free Demo Scheduling" type="waitlist" />
      <TacticalOverlay isOpen={modalType === 'faq'} onClose={() => setModalType(null)} title="Tactical Protocol FAQ" type="faq" />
      <TacticalOverlay isOpen={modalType === 'careers'} onClose={() => setModalType(null)} title="Join The Mission" type="careers" />
      <TacticalOverlay isOpen={modalType === 'whitepaper'} onClose={() => setModalType(null)} title="Technical Whitepaper" type="whitepaper" />
      <TacticalOverlay isOpen={modalType === 'contact'} onClose={() => setModalType(null)} title="Contact Us" type="contact" />
      <TacticalOverlay isOpen={modalType === 'privacy'} onClose={() => setModalType(null)} title="Privacy Policy" type="privacy" />
      <TacticalOverlay isOpen={modalType === 'terms'} onClose={() => setModalType(null)} title="Terms of Use" type="terms" />

    </main >
  );
};

export default App;