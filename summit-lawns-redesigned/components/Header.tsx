import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Sprout } from 'lucide-react';
import { NavItem } from '../types';
import { Button } from './ui/Button';

const navItems: NavItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Why Us', href: '#values' },
  { label: 'Services', href: '#services' },
  { label: 'Guarantee', href: '#guarantee' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'FAQ', href: '#faq' },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isScrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 border-gray-100'
        : 'bg-transparent py-6 border-transparent'
        }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className={`p-2 rounded-lg transition-colors ${isScrolled ? 'bg-brand-600 text-white' : 'bg-white text-brand-700'}`}>
              <img
                src="/summit-logo.jpeg"
                alt="Summit Lawns Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-display font-bold leading-none ${isScrolled ? 'text-gray-900' : 'text-white'} tracking-tight`}>
                SUMMIT
              </span>
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isScrolled ? 'text-brand-600' : 'text-brand-100'}`}>
                Lawns Lincoln
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`text-sm font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 ${isScrolled ? 'text-gray-600 hover:text-brand-600' : 'text-white/90 hover:text-white'
                  }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-6">
            <a
              href="tel:4029130999"
              className={`flex items-center gap-2 text-sm font-bold transition-colors ${isScrolled ? 'text-gray-900 hover:text-brand-600' : 'text-white hover:text-brand-200'
                }`}
            >
              <Phone size={18} className={isScrolled ? "text-brand-600" : "text-brand-300"} fill="currentColor" />
              (402) 913-0999
            </a>
            <Button
              variant={isScrolled ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })}
              className={`rounded-full shadow-lg ${!isScrolled && 'shadow-brand-900/20'}`}
            >
              Get a Free Quote
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-gray-100 p-6 lg:hidden flex flex-col gap-4 animate-in slide-in-from-top-5 duration-300">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-gray-800 font-bold py-3 border-b border-gray-50 hover:text-brand-600 flex justify-between items-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
              <ArrowRight size={16} className="text-gray-300" />
            </a>
          ))}
          <a href="tel:4029130999" className="flex items-center justify-center gap-2 text-brand-700 font-bold py-3 bg-brand-50 rounded-xl mt-2">
            <Phone size={18} /> Call (402) 913-0999
          </a>
          <Button className="w-full rounded-xl py-3" onClick={() => {
            setIsMobileMenuOpen(false);
            document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Get Free Quote
          </Button>
        </div>
      )}
    </header>
  );
};
import { ArrowRight } from 'lucide-react';