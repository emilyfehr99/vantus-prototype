"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ScopeForm from '@/components/ScopeForm';
import AnalysisResultComponent from '@/components/AnalysisResult';
import LandingPage from '@/components/LandingPage';
import Pricing from '@/components/Pricing';
import { PaywallModal } from '@/components/paywall-modal'; // New Import
import { AnalysisRequest, AnalysisResponse } from '@/types';
import { analyzeScope } from '@/lib/api';

const MAX_FREE_CREDITS = 3;

export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'app' | 'pricing'>('landing');
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    // Load credits from local storage on mount
    const savedCredits = localStorage.getItem('scopeguard_credits');
    if (savedCredits) {
      setCredits(parseInt(savedCredits, 10));
    } else {
      setCredits(MAX_FREE_CREDITS);
      localStorage.setItem('scopeguard_credits', MAX_FREE_CREDITS.toString());
    }
  }, []);

  const handleStart = () => {
    setCurrentView('app');
  };

  const handleNavigation = (view: 'landing' | 'app' | 'pricing') => {
    setCurrentView(view);
    // Reset result when navigating
    if (view !== 'app') setResult(null);
  };

  const handleAnalysis = async (request: AnalysisRequest) => {
    // 3 Strike Limit Check
    if (credits <= 0) {
      setShowPaywall(true);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeScope(request);
      setResult(data);

      // Decrement credits
      const newCredits = credits - 1;
      setCredits(newCredits);
      localStorage.setItem('scopeguard_credits', newCredits.toString());

    } catch (err) {
      setError("SYSTEM ERROR: UNABLE TO CONNECT TO ANALYSIS ENGINE.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    // Check credits again before allowing reset if we want to be strict,
    // but typically reset is allowed, just not new analysis.
  };

  const handleUpgrade = () => {
    // Restore credits to simulate purchase
    setCredits(100);
    localStorage.setItem('scopeguard_credits', '100');
    setCurrentView('app');
    setShowPaywall(false);
  };

  const closePaywall = () => {
    setShowPaywall(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30 selection:text-indigo-200 font-sans">

      {/* Paywall Overlay */}
      <PaywallModal isOpen={showPaywall} onClose={closePaywall} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <Header
          credits={credits}
          currentView={currentView}
          onNavigate={handleNavigation}
        />

        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">

          {currentView === 'landing' && (
            <LandingPage onStart={handleStart} />
          )}

          {currentView === 'pricing' && (
            <Pricing onUpgrade={handleUpgrade} />
          )}

          {currentView === 'app' && (
            <>
              {error && (
                <div className="w-full max-w-2xl mb-8 p-4 bg-rose-950/20 border-l-2 border-rose-500 text-rose-500 text-sm font-mono flex items-center justify-center animate-in fade-in">
                  {error}
                </div>
              )}

              {!result ? (
                <ScopeForm
                  onAnalyze={handleAnalysis}
                  isAnalyzing={isAnalyzing}
                  credits={credits}
                />
              ) : (
                <AnalysisResultComponent result={result} onReset={handleReset} />
              )}
            </>
          )}
        </main>

        <footer className="py-8 text-center border-t border-slate-800 mt-auto bg-slate-950">
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              ScopeGuard Systems © {new Date().getFullYear()}
            </p>
            <p className="text-[10px] text-slate-600 font-mono">
              Powered by OpenAI GPT-4o
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
