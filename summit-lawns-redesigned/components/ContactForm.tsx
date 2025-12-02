import React from 'react';
import { Button } from './ui/Button';
import { Mail, Phone, MapPin, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ContactForm: React.FC = () => {
  return (
    <section id="quote" className="py-24 relative bg-gray-50">
       <div className="absolute top-0 left-0 w-full h-1/2 bg-brand-900 z-0"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col lg:flex-row">
          
          {/* Info Side */}
          <div className="lg:w-5/12 bg-brand-900 p-12 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full mix-blend-multiply filter blur-[80px] opacity-40 -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
              <h3 className="text-4xl font-display font-bold mb-6">Get Your Free Quote</h3>
              <p className="text-brand-100 mb-12 text-lg leading-relaxed font-light">
                Stop worrying about your lawn and start enjoying it. Fill out the form, and we'll get back to you with a custom estimate.
              </p>
              
              <div className="space-y-8 mb-12">
                <a href="tel:4029130999" className="flex items-start gap-4 group">
                  <div className="bg-brand-800 p-4 rounded-2xl group-hover:bg-brand-700 transition-colors">
                    <Phone size={24} className="text-brand-300" />
                  </div>
                  <div>
                    <div className="text-xs text-brand-400 font-bold uppercase tracking-widest mb-1">Call Us</div>
                    <div className="text-xl font-bold group-hover:text-brand-300 transition-colors">(402) 913-0999</div>
                  </div>
                </a>

                <a href="mailto:office@summitlawns.com" className="flex items-start gap-4 group">
                  <div className="bg-brand-800 p-4 rounded-2xl group-hover:bg-brand-700 transition-colors">
                    <Mail size={24} className="text-brand-300" />
                  </div>
                  <div>
                    <div className="text-xs text-brand-400 font-bold uppercase tracking-widest mb-1">Email Us</div>
                    <div className="text-lg font-bold group-hover:text-brand-300 transition-colors">office@summitlawns.com</div>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <div className="bg-brand-800 p-4 rounded-2xl">
                    <Clock size={24} className="text-brand-300" />
                  </div>
                  <div>
                    <div className="text-xs text-brand-400 font-bold uppercase tracking-widest mb-1">Business Hours</div>
                    <p className="text-lg font-bold">Mon - Fri, 8:00 am - 5:00 pm</p>
                  </div>
                </div>
              </div>

              {/* Mini Values */}
              <div className="pt-8 border-t border-brand-800">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-brand-50 font-medium">
                    <CheckCircle2 size={20} className="text-green-400" /> No Contracts Required
                  </li>
                  <li className="flex items-center gap-3 text-brand-50 font-medium">
                    <CheckCircle2 size={20} className="text-green-400" /> 100% Satisfaction Guaranteed
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:w-7/12 p-12 lg:p-16 bg-white">
            <h4 className="text-3xl font-bold text-gray-900 mb-8 font-display">Request Service</h4>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-bold text-gray-700 ml-1">First Name</label>
                  <input type="text" id="firstName" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-bold text-gray-700 ml-1">Last Name</label>
                  <input type="text" id="lastName" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-bold text-gray-700 ml-1">Street Address</label>
                <input type="text" id="address" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white" placeholder="1234 Green Grass Way" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email</label>
                  <input type="email" id="email" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white" placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-bold text-gray-700 ml-1">Phone</label>
                  <input type="tel" id="phone" className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white" placeholder="(402) 555-0123" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-gray-700 ml-1">How can we help?</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Fertilization & Weed', 'Aeration & Overseeding', 'Mosquito Control', 'Flea/Tick Control', 'Weekly Mowing'].map(service => (
                    <label key={service} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-brand-50 hover:border-brand-200 transition-all group select-none">
                      <input type="checkbox" className="w-5 h-5 text-brand-600 border-gray-300 rounded focus:ring-brand-500" />
                      <span className="text-sm font-bold text-gray-600 group-hover:text-brand-900">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <Button type="submit" size="lg" className="w-full font-bold text-lg py-5 rounded-xl shadow-xl shadow-brand-200 hover:shadow-brand-300 hover:-translate-y-1 transition-all">
                  Get My Free Quote <ArrowRight className="ml-2" />
                </Button>
                <p className="text-xs text-gray-400 mt-4 text-center">We respect your privacy. No spam, ever.</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};