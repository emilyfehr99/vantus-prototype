import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "Do I have to sign a contract?",
    answer: "Absolutely not! We believe in Freedom from Contracts. We earn your business with every visit. You are free to cancel at any time if you are not 100% satisfied with our service."
  },
  {
    question: "How do I pay for my service?",
    answer: "We offer convenient payment options. Skip the check—pay with Visa, Mastercard, or Discover. We keep a card on file and automatically bill it after each service is completed, so you never have to worry."
  },
  {
    question: "What if I'm not happy with the service?",
    answer: "You are the judge. We have a 100% Iron-Clad, Money-Back Guarantee. If our work is not excellent, we will re-do the item in question for FREE. If you are still not happy, you will not owe us a single penny for that service."
  },
  {
    question: "Which areas do you service?",
    answer: "We service Lincoln, Omaha and surrounding zip codes including 68102, 68104, 68105, 68106, 68107, 68108, 68110, 68111, 68112, 68114, 68116, 68118, 68122, 68124 and more."
  },
  {
    question: "Are you insured?",
    answer: "Yes, Summit Lawns is fully insured for your protection and ours. We are a professional operation that takes safety and liability seriously."
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <h2 className="text-brand-600 font-bold tracking-wide uppercase text-sm mb-3">Common Questions</h2>
            <h3 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-6">Got Questions? <br/>We Have Answers.</h3>
            <p className="text-gray-600 text-xl font-light mb-8">
              Don't see your question here? Reach out to our team directly and we'll be happy to help.
            </p>
            <a href="#quote" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all">
              Ask a Question
            </a>
          </div>
          
          <div className="lg:col-span-7 space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl transition-all duration-300 ${openIndex === index ? 'border-brand-200 bg-brand-50/30 shadow-sm' : 'border-gray-100 hover:border-brand-200 bg-white'}`}
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className={`text-lg font-bold ${openIndex === index ? 'text-brand-800' : 'text-gray-800'}`}>
                    {faq.question}
                  </span>
                  <div className={`p-1 rounded-full ${openIndex === index ? 'bg-brand-200 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                    {openIndex === index ? (
                      <Minus size={20} />
                    ) : (
                      <Plus size={20} />
                    )}
                  </div>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 pt-0 text-gray-600 leading-relaxed text-lg">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};