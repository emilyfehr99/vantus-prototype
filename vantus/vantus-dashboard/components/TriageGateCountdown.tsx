import React, { useState, useEffect } from 'react';

interface TriageGateCountdownProps {
  officerName: string;
  countdownId: string;
  remaining: number; // milliseconds
  dispatchPayload: any;
  onVeto: (officerName: string, reason: string) => void;
  supervisorId: string;
}

export default function TriageGateCountdown({
  officerName,
  countdownId,
  remaining: initialRemaining,
  dispatchPayload,
  onVeto,
  supervisorId,
}: TriageGateCountdownProps) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [vetoReason, setVetoReason] = useState('');
  const [showVetoModal, setShowVetoModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(prev => {
        const newRemaining = Math.max(0, prev - 1000);
        if (newRemaining === 0) {
          clearInterval(interval);
        }
        return newRemaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleVeto = () => {
    if (vetoReason.trim()) {
      onVeto(officerName, vetoReason);
      setShowVetoModal(false);
    }
  };

  const secondsRemaining = Math.ceil(remaining / 1000);
  const progress = (remaining / 10000) * 100; // 10 seconds total

  return (
    <div className="vantus-card border-neon-red/50 relative overflow-hidden">
      {/* Background Pulse Animation for urgency */}
      <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none"></div>

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div>
          <h3 className="text-neon-red font-black uppercase text-lg tracking-widest animate-pulse">Intelligent Triage Gate</h3>
          <span className="text-white font-mono text-sm">Target: {officerName}</span>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-white tabular-nums">
            {secondsRemaining}<span className="text-xs text-gray-500 ml-1">SEC</span>
          </div>
          <div className="text-[10px] text-neon-red uppercase tracking-wider">Auto-Dispatch Protocol</div>
        </div>
      </div>

      <div className="relative h-2 bg-gray-800 rounded-full mb-6 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-neon-red transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(255,59,48,0.8)]"
          style={{ width: `${progress}%`, backgroundColor: '#FF3B30' }}
        />
      </div>

      <div className="bg-black/40 border border-gray-800 rounded p-4 mb-4">
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Proposed Dispatch Payload</h4>
        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="block text-gray-600 mb-1">Type</span>
            <span className="text-white">{dispatchPayload?.type || 'PRIORITY_1_BACKUP'}</span>
          </div>
          <div className="border-l border-gray-800 pl-4">
            <span className="block text-gray-600 mb-1">Threat Assessment</span>
            <span className="text-neon-red font-bold">{dispatchPayload?.situation?.threat_type || 'UNKNOWN'}</span>
          </div>
          <div className="border-l border-gray-800 pl-4">
            <span className="block text-gray-600 mb-1">AI Confidence</span>
            <span className="text-white font-bold">{(dispatchPayload?.situation?.confidence * 100 || 0).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="px-6 py-3 bg-red-900/20 border border-red-500/50 text-red-500 font-bold uppercase tracking-widest hover:bg-red-900/40 hover:text-white hover:border-red-500 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setShowVetoModal(true)}
          disabled={remaining === 0}
        >
          [ VETO DISPATCH ]
        </button>
      </div>

      {showVetoModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="vantus-card max-w-md w-full border-neon-red bg-black">
            <h3 className="text-neon-red font-bold uppercase mb-4 text-xl">Confirm Veto Override</h3>
            <p className="text-gray-400 text-sm mb-2">Reason for halting auto-dispatch:</p>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white text-sm font-mono focus:border-neon-red focus:outline-none mb-6"
              value={vetoReason}
              onChange={(e) => setVetoReason(e.target.value)}
              placeholder="Enter operational reason..."
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-400 hover:text-white text-xs uppercase tracking-wider"
                onClick={() => setShowVetoModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-red-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-red-500 rounded-sm shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                onClick={handleVeto}
                disabled={!vetoReason.trim()}
              >
                Confirm Veto
              </button>
            </div>
          </div>
        </div>
      )}

      {remaining === 0 && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-20">
          <div className="text-center">
            <p className="text-neon-green font-mono text-xl animate-pulse mb-2">DISPATCH AUTHORIZED</p>
            <p className="text-gray-500 text-xs uppercase tracking-widest">Protocol Executing...</p>
          </div>
        </div>
      )}
    </div>
  );
}
