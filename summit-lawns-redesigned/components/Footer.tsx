import React from 'react';
import { Sprout, Facebook, Instagram, Twitter, MapPin } from 'lucide-react';

const zipCodes = [
  "68102", "68104", "68105", "68106", "68107", 
  "68108", "68110", "68111", "68112", "68114", 
  "68116", "68118", "68122", "68124"
];

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          
          <div className="col-span-1">
            <a href="#" className="flex items-center gap-2 mb-6 text-brand-900 group">
              <div className="bg-brand-600 p-2 rounded-lg text-white group-hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">
                 <Sprout size={24} fill="currentColor" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-display font-bold leading-none tracking-tight">SUMMIT</span>
                <span className="text-xs font-bold tracking-widest text-brand-600">LAWNS LINCOLN</span>
              </div>
            </a>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">
              Professional lawn care without the hassle. We earn your business with every visit. Freedom from contracts, 100% satisfaction guaranteed.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all"><Facebook size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all"><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all"><Twitter size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-8 text-xs uppercase tracking-widest">Our Services</h4>
            <ul className="space-y-4 text-sm text-gray-600 font-medium">
              <li><a href="#" className="hover:text-brand-600 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200"><span className="w-1.5 h-1.5 rounded-full bg-brand-200"></span>Lawn Fertilization</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200"><span className="w-1.5 h-1.5 rounded-full bg-brand-200"></span>Weed Control</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200"><span className="w-1.5 h-1.5 rounded-full bg-brand-200"></span>Aeration & Overseeding</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200"><span className="w-1.5 h-1.5 rounded-full bg-brand-200"></span>Mosquito Defense</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors flex items-center gap-2 hover:translate-x-1 duration-200"><span className="w-1.5 h-1.5 rounded-full bg-brand-200"></span>Flea & Tick Control</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-8 text-xs uppercase tracking-widest">Service Areas</h4>
            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              {zipCodes.map(zip => (
                <span key={zip} className="bg-gray-50 px-2 py-1 rounded text-xs font-semibold border border-gray-100 text-gray-600 hover:border-brand-200 hover:text-brand-700 transition-colors cursor-default">{zip}</span>
              ))}
              <span className="text-brand-600 font-bold text-xs flex items-center gap-1 bg-brand-50 px-2 py-1 rounded border border-brand-100"><MapPin size={10} /> And More!</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-8 text-xs uppercase tracking-widest">Contact Us</h4>
            <ul className="space-y-6 text-sm text-gray-600">
              <li className="flex flex-col group">
                <span className="font-bold text-gray-900 text-xs uppercase tracking-wide mb-1">Phone</span>
                <a href="tel:4029130999" className="hover:text-brand-600 font-bold text-xl text-brand-900 transition-colors">(402) 913-0999</a>
              </li>
              <li className="flex flex-col group">
                <span className="font-bold text-gray-900 text-xs uppercase tracking-wide mb-1">Email</span>
                <a href="mailto:office@summitlawns.com" className="hover:text-brand-600 font-medium text-lg transition-colors">office@summitlawns.com</a>
              </li>
              <li className="flex flex-col">
                <span className="font-bold text-gray-900 text-xs uppercase tracking-wide mb-1">Office Hours</span>
                <span className="font-medium">Mon - Fri, 8:00 am - 5:00 pm</span>
              </li>
            </ul>
             <a href="#" className="mt-6 inline-flex items-center text-white bg-gray-900 px-5 py-3 rounded-xl font-bold text-xs hover:bg-brand-600 transition-colors uppercase tracking-wide shadow-lg">
               Join Our Team <span className="ml-2">→</span>
             </a>
          </div>

        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-400">
          <p>&copy; {new Date().getFullYear()} Summit Lawns Lincoln. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-brand-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-brand-600 transition-colors">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};