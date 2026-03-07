import React from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

const FooterLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  const MotionDiv = motion.div as any;
  return (
    <motion.li className="relative inline-block overflow-hidden py-1 group">
      <a
        href={href}
        className="text-neutral-600 transition-colors duration-300 group-hover:text-white flex items-center gap-2"
      >
        {children}
        <MotionDiv
          className="absolute bottom-0 left-0 w-full h-[1px] bg-[#00FF41] shadow-[0_0_8px_#00FF41]"
          initial={{ x: '-105%' }}
          whileHover={{ x: '0%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </a>
    </motion.li>
  );
};

const LegalLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
  const MotionDiv = motion.div as any;
  return (
    <a
      href={href}
      className="relative group text-neutral-700 hover:text-white transition-colors duration-300 py-1"
    >
      {children}
      <MotionDiv
        className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#00FF41]/60 group-hover:w-full transition-all duration-300 shadow-[0_0_4px_#00FF41]"
      />
    </a>
  );
};

export const Footer: React.FC<{
  onOpenWaitlist: () => void;
  onOpenCareers: () => void;
  onOpenFAQ: () => void;
  onOpenWhitepaper: () => void;
  onOpenContact: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
}> = ({ onOpenWaitlist, onOpenCareers, onOpenFAQ, onOpenWhitepaper, onOpenContact, onOpenPrivacy, onOpenTerms }) => {

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
  };


  return (
    <footer className="bg-[#000000] border-t border-neutral-900 py-20 px-6 relative overflow-hidden">
      {/* Decorative Grid Accent */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[linear-gradient(to_right,#00FF41_1px,transparent_1px),linear-gradient(to_bottom,#00FF41_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12 relative z-10">
        <div className="space-y-6 max-w-xs">
          <div className="flex items-center gap-3">
            <Logo className="h-6 w-auto text-white group-hover:text-[#00FF41] transition-colors duration-500" />
            <div className="flex flex-col leading-none">
              <span className="font-bold tracking-tighter text-xl uppercase">Vantus</span>
              <span className="font-mono text-[7px] text-[#00FF41] tracking-[0.2em] uppercase mt-0.5">Intelligent Safety</span>
            </div>
          </div>
          <p className="text-neutral-400 text-base font-medium leading-relaxed tracking-tight italic">
            Intelligence that acts. Backup that arrives.
          </p>
          <div className="text-[10px] font-mono text-neutral-600 tracking-wider flex flex-col gap-1">
            <span>CAGE CODE: Pending</span>
            <span>DUNS: 098412034</span>
            <span className="text-[#00FF41]/30 mt-2">SECURED_COMMS_v4.2</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="font-mono text-xs uppercase text-neutral-400 tracking-widest border-l border-[#00FF41]/40 pl-3">Resources</h4>
            <ul className="flex flex-col space-y-1 text-sm font-medium">
              <FooterLink onClick={onOpenWaitlist}>Get a Free Demo</FooterLink>
              <FooterLink onClick={onOpenFAQ}>FAQ</FooterLink>
              <FooterLink onClick={onOpenWhitepaper}>Technical Whitepaper</FooterLink>

            </ul >
          </div >
          <div className="space-y-4">
            <h4 className="font-mono text-xs uppercase text-neutral-400 tracking-widest border-l border-[#00FF41]/40 pl-3">Company</h4>
            <ul className="flex flex-col space-y-1 text-sm font-medium">
              <FooterLink href="#">Our Mission</FooterLink>
              <FooterLink href="#">Careers</FooterLink>
              <FooterLink href="#">Contact</FooterLink>
            </ul>
          </div>
        </div >
      </div >

      <div className="max-w-6xl mx-auto mt-20 text-center relative z-10 border border-neutral-800 bg-neutral-950 p-12 rounded-lg shadow-[0_0_50px_rgba(0,255,65,0.05)]">
        <Logo className="h-8 w-auto text-[#00FF41] mx-auto mb-6 opacity-80" />
        <h4 className="text-2xl font-black uppercase text-white mb-4 tracking-tight">Ready to enhance officer safety?</h4>
        <button onClick={onOpenWaitlist} className="mt-4 px-10 py-4 bg-[#00FF41] text-black font-black uppercase tracking-widest text-xs hover:bg-white transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(0,255,65,0.2)]">
          Get a Free Demo
        </button>
      </div>

      <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
        <div className="text-[10px] font-mono text-neutral-700 uppercase tracking-widest text-center md:text-left">
          © {new Date().getFullYear()} Vantus Safety Systems Inc. // Defense Technology for the Home Front.
        </div>
        <div className="flex gap-8 text-[10px] font-mono uppercase tracking-widest">
          <LegalLink onClick={onOpenPrivacy}>Privacy Policy</LegalLink>
          <LegalLink onClick={onOpenTerms}>Terms of Use</LegalLink>
        </div>
      </div>
    </footer >
  );
};