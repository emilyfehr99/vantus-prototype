import React from 'react';
import { Star } from 'lucide-react';
import { Testimonial } from '../types';

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    role: 'Homeowner',
    content: "Summit Lawns transformed our backyard. We went from a patchy mess to the best lawn on the block. The team is always punctual and professional.",
    rating: 5
  },
  {
    id: '2',
    name: 'Mike Thompson',
    role: 'Business Owner',
    content: "We use them for snow removal at our office complex. They are incredibly reliable. Even in the worst blizzards, our lot is clear before employees arrive.",
    rating: 5
  },
  {
    id: '3',
    name: 'Emily Chen',
    role: 'Resident',
    content: "Great communication and fair pricing. I love the online billing system and how easy it is to request extra services when needed.",
    rating: 5
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section id="reviews" className="py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200 mb-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google" className="w-5 h-5" />
            <span className="font-bold text-gray-700 text-sm">4.8 Stars on Google</span>
          </div>
          <h3 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6">Trusted by Your Neighbors</h3>
          <p className="text-gray-500 max-w-2xl text-lg">
             We work hard to earn every 5-star review. See what people in Lincoln and Omaha are saying about our service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div key={t.id} className="bg-gray-50 p-10 rounded-[2rem] hover:-translate-y-2 transition-transform duration-300 border border-gray-100">
              <div className="flex gap-1 text-yellow-400 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={20} fill="currentColor" />
                ))}
              </div>
              <p className="text-gray-700 mb-8 leading-relaxed text-lg font-medium">"{t.content}"</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center font-bold text-white shadow-lg">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-brand-600 text-sm font-semibold">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};