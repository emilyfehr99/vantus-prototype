import React from 'react';
import { ShieldCheck, Quote, CheckCircle2 } from 'lucide-react';

export const Guarantee: React.FC = () => {
  return (
    <section id="guarantee" className="py-24 bg-brand-950 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-brand-600/20 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="bg-white rounded-[3rem] p-8 md:p-20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden ring-4 ring-white/10">

          {/* Decorative Top Border */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-400"></div>

          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">

            {/* Guarantee Badge */}
            <div className="lg:w-1/3 flex flex-col items-center text-center relative">
              <div className="relative group perspective-1000">
                <div className="absolute inset-0 bg-gold-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-white to-gray-50 border-4 border-gold-500 shadow-2xl flex flex-col items-center justify-center p-6 transform transition-transform group-hover:scale-105 duration-500">
                  <ShieldCheck size={64} className="text-gold-500 mb-3" strokeWidth={1.5} />
                  <div className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Summit Lawns</div>
                  <div className="text-3xl md:text-4xl font-black text-gray-900 leading-none mb-1">100%</div>
                  <div className="text-sm font-bold text-gold-600 uppercase tracking-wider">Money Back</div>
                  <div className="text-xs font-semibold text-gray-400 uppercase mt-1">Guarantee</div>
                </div>
              </div>
            </div>

            {/* Letter Content */}
            <div className="lg:w-2/3 relative">
              <Quote className="absolute -top-10 -left-10 text-brand-50 opacity-50 rotate-180" size={140} />

              <h3 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-8 relative z-10 leading-tight">
                Our Iron-Clad <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-800">Risk-Free Promise</span>
              </h3>

              <div className="space-y-6 text-gray-600 leading-relaxed text-lg relative z-10">
                <p>
                  <strong className="text-gray-900 font-bold text-xl">Here’s the deal:</strong> We want you to be totally thrilled with our service. So absolutely delighted that you will recommend us to your friends and neighbors.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
                  <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100">
                    <CheckCircle2 className="text-brand-600 mb-3" size={28} />
                    <h5 className="font-bold text-gray-900 mb-2">We Re-Do It Free</h5>
                    <p className="text-sm text-gray-600">If our work is not excellent, we will re-do the item in question for FREE.</p>
                  </div>
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <ShieldCheck className="text-red-600 mb-3" size={28} />
                    <h5 className="font-bold text-gray-900 mb-2">You Don't Pay</h5>
                    <p className="text-sm text-gray-600">If you are still not happy, you will not owe us a single penny.</p>
                  </div>
                </div>

                <p className="font-medium text-gray-500 italic">
                  "If we were not the company we claim to be, that guarantee would probably cost us a small fortune. So we’re proud of that."
                </p>
              </div>

              <div className="mt-10 flex items-center gap-5 pt-8 border-t border-gray-100">

                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-200">
                  <div className="w-full h-full bg-brand-100 flex items-center justify-center font-display font-bold text-brand-800 text-xl">TG</div>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Ted Glaser</div>
                  <div className="text-xs text-brand-600 font-bold uppercase tracking-wide">Owner, Summit Lawns</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};