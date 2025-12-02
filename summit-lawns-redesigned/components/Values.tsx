import React from 'react';
import { FileX, CreditCard, Clock, Sparkles, ArrowUpRight } from 'lucide-react';

export const Values: React.FC = () => {
  return (
    <section id="values" className="py-32 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-brand-600 font-bold tracking-widest uppercase text-sm mb-4">The Summit Difference</h2>
            <h3 className="text-4xl md:text-5xl font-display font-bold text-gray-900 leading-tight">
              We Don't Just Cut Grass. <br />
              <span className="text-gray-400">We Build Trust.</span>
            </h3>
          </div>
          <p className="max-w-md text-gray-600 text-lg font-light leading-relaxed">
            Business should be simple. No hidden fees, no locked-in contracts, just results that speak for themselves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Feature Card - Spans 2 cols on tablet, 1 on mobile, 2 on desktop */}
          <div className="md:col-span-2 bg-brand-900 rounded-[2.5rem] p-10 md:p-14 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[100px] opacity-40 translate-x-1/3 -translate-y-1/3 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10">
                <FileX size={32} className="text-brand-300" />
              </div>
              <div>
                <h4 className="text-3xl md:text-4xl font-display font-bold mb-6">Freedom From Contracts</h4>
                <p className="text-brand-100 text-lg md:text-xl leading-relaxed max-w-xl mb-8">
                  We believe we should earn your business on every single visit. If you're not happy, you shouldn't be stuck. It's that simple.
                </p>
                <div className="flex items-center gap-2 text-brand-300 font-bold uppercase tracking-wider text-sm">
                  <span>Our Promise</span>
                  <ArrowUpRight size={18} />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Feature - Convenient Payments */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
              <CreditCard size={28} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Easy Payments</h4>
            <p className="text-gray-500 leading-relaxed">
              Skip the check. We keep a card on file and bill automatically after service. Visa, Mastercard, or Discover.
            </p>
          </div>

          {/* Third Feature - Efficiency */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 group">
            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
              <Clock size={28} />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Timely Service</h4>
            <p className="text-gray-500 leading-relaxed">
              We communicate when we show up. We work efficiently. You get your weekend back without the hassle.
            </p>
          </div>

          {/* Fourth Feature - Expert Care (Spans 2 cols) */}
          <div className="md:col-span-2 bg-white rounded-[2.5rem] p-10 md:p-12 border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col md:flex-row items-center gap-8 group">
            <div className="flex-1">
              <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles size={28} />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Expert Lawn Care</h4>
              <p className="text-gray-500 leading-relaxed text-lg">
                Never feel embarrassed about your lawn again. Our team are true professionals who treat your property like a showroom.
              </p>
            </div>
            <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden relative">
              <img src="/expert-lawn-care.jpeg" alt="Green grass" className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};