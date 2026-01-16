/**
 * Pattern Timeline Component
 * Visualizes patterns over time for selected officer
 */

import React from 'react';

interface Signal {
  signalType: string;
  signalCategory: string;
  probability: number;
  timestamp: string;
  explanation: {
    description: string;
    originData: any;
    traceability: any;
  };
}

interface PatternTimelineProps {
  signals: Signal[];
  officerName: string;
}

export default function PatternTimeline({ signals, officerName }: PatternTimelineProps) {
  if (!signals || signals.length === 0) {
    return (
      <div className="vantus-card text-center py-8 text-gray-500 font-mono text-sm border-dashed">
        <p>NO SIGNALS DETECTED</p>
      </div>
    );
  }

  // Sort signals by timestamp
  const sortedSignals = [...signals].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Get time range
  const firstTime = new Date(sortedSignals[0].timestamp);
  const lastTime = new Date(sortedSignals[sortedSignals.length - 1].timestamp);
  const timeRange = lastTime.getTime() - firstTime.getTime();

  // Get signal color
  const getSignalColor = (signal: Signal): string => {
    const prob = signal.probability;
    if (prob > 0.7) return '#FFAA00'; // Orange
    if (prob > 0.5) return '#FFD700'; // Yellow
    return '#00FF41'; // Green
  };

  // Calculate position on timeline
  const getTimelinePosition = (timestamp: string): number => {
    const signalTime = new Date(timestamp).getTime();
    const position = ((signalTime - firstTime.getTime()) / timeRange) * 100;
    return Math.max(0, Math.min(100, position));
  };

  return (
    <div className="vantus-card mb-4 min-w-[600px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Pattern Timeline: <span className="text-white">{officerName}</span>
        </h3>
        <div className="flex gap-4 text-[10px]">
          <span className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_5px_rgba(255,170,0,0.5)]"></span>
            High
          </span>
          <span className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(255,215,0,0.5)]"></span>
            Medium
          </span>
          <span className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-[#00FF41] shadow-[0_0_5px_rgba(0,255,65,0.5)]"></span>
            Low
          </span>
        </div>
      </div>

      <div className="relative h-24 mb-2">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 transform -translate-y-1/2"></div>
        {sortedSignals.map((signal, idx) => {
          const position = getTimelinePosition(signal.timestamp);
          const color = getSignalColor(signal);

          return (
            <div
              key={`${signal.timestamp}-${idx}`}
              className="absolute top-1/2 w-3 h-3 rounded-sm transform -translate-y-1/2 -translate-x-1/2 cursor-pointer hover:scale-150 transition-transform z-10 border border-black"
              style={{
                left: `${position}%`,
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}50`
              }}
              title={`${signal.signalCategory} (${(signal.probability * 100).toFixed(0)}%) - ${new Date(signal.timestamp).toLocaleTimeString()}`}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] font-mono text-gray-600">
        <span>{firstTime.toLocaleTimeString()}</span>
        <span>{lastTime.toLocaleTimeString()}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 border-t border-gray-800 pt-4">
        <div className="text-center">
          <span className="block text-[10px] text-gray-500 uppercase mb-1">Total Signals</span>
          <span className="text-xl font-mono text-white">{signals.length}</span>
        </div>
        <div className="text-center border-l border-gray-800">
          <span className="block text-[10px] text-gray-500 uppercase mb-1">Duration</span>
          <span className="text-xl font-mono text-white">{Math.max(1, Math.round(timeRange / 1000 / 60))}m</span>
        </div>
        <div className="text-center border-l border-gray-800">
          <span className="block text-[10px] text-gray-500 uppercase mb-1">Categories</span>
          <span className="text-xl font-mono text-white">{new Set(signals.map(s => s.signalCategory)).size}</span>
        </div>
      </div>
    </div>
  );
}
