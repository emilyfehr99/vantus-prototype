import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Values } from './components/Values';
import { Guarantee } from './components/Guarantee';
import { Services } from './components/Services';
import { Testimonials } from './components/Testimonials';
import { ContactForm } from './components/ContactForm';
import { Footer } from './components/Footer';
import { FAQ } from './components/FAQ';
import { AIChat } from './components/AIChat';

function App() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Values />
        <Services />
        <Guarantee />
        <Testimonials />
        <ContactForm />
        <FAQ />
      </main>
      <Footer />
      <AIChat />
    </div>
  );
}

export default App;