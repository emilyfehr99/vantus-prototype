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
import { Radio, Menu, X, Signal, Target } from 'lucide-react';

// Use React.FC to ensure children prop is correctly handled by the JSX parser and TypeScript
const NavLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => {
  const MotionDiv = motion.div as any;
  return (
    <button
      onClick={onClick}
      className="relative group hover:text-white transition-colors py-2"
    >
      {children}
      <MotionDiv
        className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#00FF41] shadow-[0_0_8px_#00FF41]"
        whileHover={{ width: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
    </button>
  );
};

const Header = ({
  onOpenFAQ,
  onOpenWaitlist,
  mobileMenuOpen,
  setMobileMenuOpen
}: {
  onOpenFAQ: () => void,
  onOpenWaitlist: () => void,
  mobileMenuOpen: boolean,
  setMobileMenuOpen: (open: boolean) => void
}) => {
  const MotionButton = motion.button as any;
  const MotionDiv = motion.div as any;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] transition-all duration-700 py-10 bg-transparent">
      <div className="max-w-[1600px] mx-auto px-10 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-4 group cursor-pointer relative z-[110]"
        >
          <Logo className="h-6 w-auto text-white group-hover:text-[#00FF41] transition-colors duration-500" />
          <div className="flex flex-col leading-none">
            <span className="font-black tracking-[-0.04em] text-2xl uppercase group-hover:translate-x-1 transition-transform duration-500">Vantus</span>
            <span className="font-mono text-[7px] text-neutral-500 tracking-[0.3em] uppercase mt-1 font-bold group-hover:text-neutral-300 transition-colors duration-500">Safety Systems</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-12 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          <NavLink onClick={() => scrollToSection('mission')}>The Problem</NavLink>
          <NavLink onClick={() => scrollToSection('features')}>Our Solution</NavLink>
          <NavLink onClick={onOpenFAQ}>FAQ</NavLink>
        </div>

        {/* CTA Button & Mobile Toggle */}
        <div className="flex items-center gap-8 relative z-[110]">
          <MotionButton
            onClick={onOpenWaitlist}

            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center px-10 py-3 bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] transition-all rounded-sm"
          >
            Join Waitlist
          </MotionButton>

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
                {['The Problem', 'Our Solution', 'FAQ'].map((item, idx) => {
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
                })}
                <motion.li
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <button
                    onClick={onOpenWaitlist}
                    className="mt-8 px-12 py-5 bg-white text-black font-black uppercase text-sm tracking-widest"
                  >
                    Join Waitlist
                  </button>
                </motion.li>
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
  const [modalType, setModalType] = useState<'faq' | 'login' | 'careers' | 'whitepaper' | 'contact' | 'privacy' | 'terms' | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const MotionDiv = motion.div as any;

  return (
    <main className="bg-black text-white selection:bg-[#00FF41] selection:text-black min-h-screen relative overflow-x-hidden">
      <Header
        onOpenFAQ={() => setModalType('faq')}
        onOpenWaitlist={() => setModalType('login')}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Background Content Wrapper for Parallax Effect */}
      <MotionDiv
        animate={{
          scale: mobileMenuOpen ? 0.94 : 1,
          opacity: mobileMenuOpen ? 0.4 : 1,
          filter: mobileMenuOpen ? 'blur(10px)' : 'blur(0px)',
          y: mobileMenuOpen ? 20 : 0
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className="relative z-10 origin-top"
      >
        <Hero
          onOpenWaitlist={() => setModalType('login')}
          onOpenWhitepaper={() => setModalType('whitepaper')}
        />
        <div id="dashboard"><Dashboard /></div>
        <Footer
          onOpenWaitlist={() => setModalType('login')}
          onOpenCareers={() => setModalType('careers')}
          onOpenFAQ={() => setModalType('faq')}
          onOpenWhitepaper={() => setModalType('whitepaper')}
          onOpenContact={() => setModalType('contact')}
          onOpenPrivacy={() => setModalType('privacy')}
          onOpenTerms={() => setModalType('terms')}
        />
      </MotionDiv>

      <TacticalOverlay isOpen={modalType === 'faq'} onClose={() => setModalType(null)} title="Tactical Protocol FAQ" type="faq" />
      <TacticalOverlay isOpen={modalType === 'login'} onClose={() => setModalType(null)} title="Pilot Waitlist" type="login" />
      <TacticalOverlay isOpen={modalType === 'careers'} onClose={() => setModalType(null)} title="Join The Mission" type="careers" />
      <TacticalOverlay isOpen={modalType === 'whitepaper'} onClose={() => setModalType(null)} title="Technical Whitepaper" type="whitepaper" />
      <TacticalOverlay isOpen={modalType === 'contact'} onClose={() => setModalType(null)} title="Contact Us" type="contact" />
      <TacticalOverlay isOpen={modalType === 'privacy'} onClose={() => setModalType(null)} title="Privacy Policy" type="privacy" />
      <TacticalOverlay isOpen={modalType === 'terms'} onClose={() => setModalType(null)} title="Terms of Use" type="terms" />

    </main >
  );
};

export default App;