import React from 'react';
import { Sprout, Wind, Droplets, Bug, BugOff, Scissors, ArrowRight } from 'lucide-react';
import { Service } from '../types';

const services: Service[] = [
  {
    id: 'fertilization',
    title: 'Fertilization & Weed Control',
    description: 'A 6-step scientifically tailored program. We feed your lawn the specific nutrients it craves while aggressively targeting weeds.',
    icon: Sprout,
    image: '/fertilization.jpg'
  },
  {
    id: 'aeration',
    title: 'Core Aeration',
    description: 'Relieve soil compaction to allow water, air, and nutrients to penetrate deep into the root zone. Essential for clay soil.',
    icon: Wind,
    image: '/aeration.jpg'
  },
  {
    id: 'overseeding',
    title: 'Premium Overseeding',
    description: 'Introduce new, disease-resistant grass varieties to thicken your turf. Best performed in the fall with aeration.',
    icon: Droplets,
    image: '/overseeding.jpg'
  },
  {
    id: 'mosquito',
    title: 'Mosquito Defense',
    description: 'Create a protective barrier around your property. Reclaim your backyard evenings without the bite.',
    icon: Bug,
    image: '/mosquito.jpg'
  },
  {
    id: 'pests',
    title: 'Flea, Tick & Chigger',
    description: 'Protect your family and pets. Our perimeter defense stops dangerous pests before they enter your lawn.',
    icon: BugOff,
    image: '/flea-tick.jpg'
  }
];

export const Services: React.FC = () => {
  return (
    <section id="services" className="py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-brand-600 font-bold tracking-widest uppercase text-sm mb-3">Our Expertise</h2>
          <h3 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">Complete Property Care</h3>
          <p className="text-gray-600 text-xl font-light">
            We don't do "one size fits all". We provide specialized treatments for Lincoln's unique climate and soil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={service.id} className="group rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-brand-900/10 transition-all duration-500 overflow-hidden flex flex-col h-full">
              <div className="h-64 overflow-hidden relative">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg">
                  <service.icon size={24} className="text-brand-600" />
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h4 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">{service.title}</h4>
                <p className="text-gray-500 mb-8 leading-relaxed flex-1">{service.description}</p>
                <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-brand-600 font-bold group-hover:translate-x-1 transition-transform">
                  <span>Learn More</span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}

          {/* Mowing Callout - Different Style */}
          <div className="rounded-[2rem] bg-gray-900 text-white p-10 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-brand-600 rounded-full blur-[80px] opacity-20"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6">
                <Scissors size={24} className="text-brand-400" />
              </div>
              <h4 className="text-3xl font-bold mb-4">Weekly Mowing</h4>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Looking for those perfect stripes? We offer limited spots for our premium weekly mowing service.
              </p>
              <a href="#quote" className="inline-block bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors">
                Check Availability
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};