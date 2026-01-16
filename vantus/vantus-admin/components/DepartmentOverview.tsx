'use client';

import { useState, useEffect } from 'react';

// Mock data
const MOCK_STATS = {
  totalOfficers: 12,
  activeOfficers: 8,
  incidentsToday: 3,
  latency: '--'
};

export default function DepartmentOverview() {
  const [stats, setStats] = useState(MOCK_STATS);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeOfficers: Math.max(1, prev.activeOfficers + (Math.random() > 0.5 ? 1 : -1)),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const MetricCard = ({ label, value, subtext, color = 'text-white' }: { label: string; value: string | number; subtext: string; color?: string }) => (
    <div className="border border-gray-800 bg-black/50 p-6 relative overflow-hidden group hover:border-green-500/50 transition-colors">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-20 group-hover:via-green-500 group-hover:opacity-100 transition-all"></div>
      <h3 className="text-[10px] font-bold tracking-widest text-green-500 uppercase mb-4">{label}</h3>
      <div className={`text-5xl font-bold mb-2 ${color} font-mono`}>{value}</div>
      <div className="text-[10px] tracking-wider text-gray-500 uppercase">{subtext}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          label="Personnel"
          value={stats.totalOfficers}
          subtext="Deployed"
        />
        <MetricCard
          label="Field Ops"
          value={stats.activeOfficers}
          subtext="On Patrol"
        />
        <MetricCard
          label="Incidents"
          value={stats.incidentsToday}
          subtext="Today"
        />
        <MetricCard
          label="Bridge Latency"
          value={stats.latency}
          subtext="ms"
          color="text-green-500"
        />
      </div>

      {/* System Health Monitor */}
      <div>
        <h3 className="text-center text-[10px] font-bold tracking-widest text-green-900 uppercase mb-4">System Health Monitor</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-green-900/30 bg-black p-4 flex flex-col justify-between h-32 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white tracking-wider">CAD CONNECTION</span>
              </div>
              <div className="text-[10px] text-gray-500 uppercase">API Gateway</div>
            </div>
            <div className="pl-4">
              <div className="inline-block border border-green-900 bg-green-900/20 px-2 py-1">
                <span className="text-[10px] font-bold text-green-500 tracking-wider">CONNECTED</span>
              </div>
            </div>
          </div>

          <div className="border border-green-900/30 bg-black p-4 flex flex-col justify-between h-32 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white tracking-wider">BRIDGE SERVER</span>
              </div>
              <div className="text-[10px] text-gray-500 uppercase">Node.js Hub</div>
            </div>
            <div className="pl-4">
              <div className="inline-block border border-red-900 bg-red-900/20 px-2 py-1">
                <span className="text-[10px] font-bold text-red-500 tracking-wider">OFFLINE</span>
              </div>
            </div>
          </div>

          <div className="border border-green-900/30 bg-black p-4 flex flex-col justify-between h-32 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-white tracking-wider">MOBILE UPLINK</span>
              </div>
              <div className="text-[10px] text-gray-500 uppercase">Field Devices</div>
            </div>
            <div className="pl-4">
              <div className="inline-block border border-blue-900 bg-blue-900/20 px-2 py-1">
                <span className="text-[10px] font-bold text-blue-500 tracking-wider">3 CONNECTED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
