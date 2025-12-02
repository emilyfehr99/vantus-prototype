import React from 'react';
import { ArrowRight, Check, Star } from 'lucide-react';
import { Button } from './ui/Button';

export const Hero: React.FC = () => {
  return (
    <div className="relative min-h-[90vh] flex flex-col justify-end pb-0 overflow-hidden">
      {/* Background Image with Parallax Feel */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 via-brand-900/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-transparent to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=2000&auto=format&fit=crop" 
          alt="Perfectly manicured lawn at sunset" 
          className="w-full h-full object-cover scale-105 animate-fade-in"
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-20 pb-24 pt-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 backdrop-blur-md border border-brand-400/30 mb-6 animate-fade-in-up shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-bold text-brand-100 tracking-widest uppercase">Accepting New Clients</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black leading-[0.95] mb-8 text-white tracking-tight drop-shadow-xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Lawns Done <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-100 to-white">
              The Right Way.
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed font-light max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Expert care with <span className="font-semibold text-white">zero contracts</span>. We earn your business with every single visit, guaranteed.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button 
              size="lg" 
              onClick={() => document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' })} 
              className="bg-brand-500 hover:bg-brand-400 text-white font-bold text-lg px-10 py-5 rounded-full shadow-2xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-1 transition-all duration-300 border border-brand-400"
            >
              Get Your Free Quote
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/20 hover:bg-white/10 text-white font-bold text-lg px-10 py-5 rounded-full backdrop-blur-sm transition-all" 
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See Our Services
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm font-semibold text-white/80 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
             <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-brand-500/20 text-brand-300"><Check size={14} strokeWidth={4} /></div>
                <span>100% Risk-Free Guarantee</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-brand-500/20 text-brand-300"><Check size={14} strokeWidth={4} /></div>
                <span>No Contracts Required</span>
             </div>
             <div className="flex items-center gap-2">
                 <div className="flex text-yellow-400">
                   <Star size={16} fill="currentColor" />
                   <Star size={16} fill="currentColor" />
                   <Star size={16} fill="currentColor" />
                   <Star size={16} fill="currentColor" />
                   <Star size={16} fill="currentColor" />
                 </div>
                <span>4.8/5 Average Rating</span>
             </div>
          </div>
        </div>
      </div>

      {/* Modern Floating Stats Bar */}
      <div className="relative z-30 bg-white border-b border-gray-100 shadow-xl">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            <div className="py-8 px-4 text-center group cursor-default">
              <div className="text-3xl md:text-4xl font-display font-black text-gray-900 mb-1 group-hover:text-brand-600 transition-colors">10+</div>
              <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Years Experience</div>
            </div>
            <div className="py-8 px-4 text-center group cursor-default">
              <div className="text-3xl md:text-4xl font-display font-black text-gray-900 mb-1 group-hover:text-brand-600 transition-colors">75k+</div>
              <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Lawns Serviced</div>
            </div>
            <div className="py-8 px-4 text-center group cursor-default">
               <div className="text-3xl md:text-4xl font-display font-black text-gray-900 mb-1 group-hover:text-brand-600 transition-colors">100%</div>
              <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Satisfaction Rate</div>
            </div>
            <div className="py-8 px-4 text-center group cursor-default bg-brand-50/50">
              <div className="text-3xl md:text-4xl font-display font-black text-gray-900 mb-1 group-hover:text-brand-600 transition-colors">Zero</div>
              <div className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Contracts Signed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};