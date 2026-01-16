import React from 'react';

interface LiveFeedViewerProps {
  officerName: string;
  streamUrl: string;
  tacticalIntent: any;
  onClose: () => void;
}

export default function LiveFeedViewer({
  officerName,
  streamUrl,
  tacticalIntent,
  onClose,
}: LiveFeedViewerProps) {
  return (
    <div className="vantus-card border-neon-green/50 bg-black/95 fixed inset-0 z-50 m-4 flex flex-col">
      <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
        <h3 className="vantus-title text-neon-green text-xl">Live BWC Feed - {officerName}</h3>
        <button
          className="text-gray-400 hover:text-white text-2xl"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="flex-1 bg-black relative border border-gray-800 rounded mb-4 overflow-hidden">
        {/* In production, this would use a video player component */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
          <p className="font-mono text-neon-green mb-2">LIVE STREAM CONNECTED</p>
          <p className="text-xs">{streamUrl}</p>
          <div className="mt-4 border border-neon-green/30 p-2 rounded text-[10px] animate-pulse">
            REC ●
          </div>
        </div>
      </div>

      <div className="vantus-card bg-black/50 border-gray-800">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tactical Intent Metadata</h4>
        <div className="grid grid-cols-2 gap-4 text-sm font-mono">
          <div className="flex justify-between items-center bg-black/30 p-2 rounded">
            <span className="text-gray-400">Weapon Detected:</span>
            <span className={tacticalIntent.weaponDetected ? 'text-neon-red font-bold' : 'text-gray-600'}>
              {tacticalIntent.weaponDetected ? 'DETECTED' : 'CLEAR'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-black/30 p-2 rounded">
            <span className="text-gray-400">Fighting Stance:</span>
            <span className={tacticalIntent.fightingStance ? 'text-neon-red font-bold' : 'text-gray-600'}>
              {tacticalIntent.fightingStance ? 'DETECTED' : 'CLEAR'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-black/30 p-2 rounded">
            <span className="text-gray-400">Hands Hidden:</span>
            <span className={tacticalIntent.handsHidden ? 'text-yellow-500 font-bold' : 'text-gray-600'}>
              {tacticalIntent.handsHidden ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex justify-between items-center bg-black/30 p-2 rounded">
            <span className="text-gray-400">High Heart Rate:</span>
            <span className={tacticalIntent.heartRateElevated ? 'text-neon-red font-bold' : 'text-gray-600'}>
              {tacticalIntent.heartRateElevated ? 'ELEVATED' : 'NORMAL'}
            </span>
          </div>
        </div>
        <div className="text-[10px] text-gray-600 mt-2 text-right">
          Last Updated: {new Date(tacticalIntent.timestamp || Date.now()).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
