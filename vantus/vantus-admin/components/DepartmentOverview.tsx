'use client';

import { useState, useEffect } from 'react';
import logger from '../utils/logger';

interface DepartmentStats {
  totalOfficers: number;
  activeOfficers: number;
  totalSessions: number;
  sessionsToday: number;
  alertsToday: number;
  dispatchesToday: number;
  avgSessionDuration: string;
  systemUptime: string;
}

interface RecentActivity {
  id: string;
  type: 'session' | 'alert' | 'dispatch' | 'login';
  message: string;
  officer: string;
  timestamp: string;
}

// Mock data
const MOCK_STATS: DepartmentStats = {
  totalOfficers: 24,
  activeOfficers: 8,
  totalSessions: 1247,
  sessionsToday: 12,
  alertsToday: 3,
  dispatchesToday: 1,
  avgSessionDuration: '6h 24m',
  systemUptime: '99.7%',
};

const MOCK_ACTIVITY: RecentActivity[] = [
  { id: '1', type: 'session', message: 'Session started', officer: 'Badge WPS-4472', timestamp: '2026-01-15 16:02:00' },
  { id: '2', type: 'alert', message: 'Threat detected - Weapon alert', officer: 'Badge WPS-3301', timestamp: '2026-01-15 15:45:22' },
  { id: '3', type: 'dispatch', message: 'Auto-dispatch triggered', officer: 'Badge WPS-3301', timestamp: '2026-01-15 15:45:25' },
  { id: '4', type: 'session', message: 'Session ended', officer: 'Badge WPS-2156', timestamp: '2026-01-15 14:30:00' },
  { id: '5', type: 'login', message: 'Officer logged in', officer: 'Badge WPS-4472', timestamp: '2026-01-15 14:00:00' },
];

export default function DepartmentOverview() {
  const [stats, setStats] = useState<DepartmentStats>(MOCK_STATS);
  const [activity, setActivity] = useState<RecentActivity[]>(MOCK_ACTIVITY);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeOfficers: Math.max(1, prev.activeOfficers + (Math.random() > 0.5 ? 1 : -1)),
      }));
      setLastUpdated(new Date().toLocaleTimeString());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'session': return '🟢';
      case 'alert': return '⚠️';
      case 'dispatch': return '🚨';
      case 'login': return '👤';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'session': return 'border-green-500';
      case 'alert': return 'border-yellow-500';
      case 'dispatch': return 'border-red-500';
      case 'login': return 'border-blue-500';
    }
  };

  const StatCard = ({ label, value, color = 'text-gray-900', bgColor = 'bg-white' }: { label: string; value: string | number; color?: string; bgColor?: string }) => (
    <div className={`${bgColor} rounded-lg p-4 shadow`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Department Overview</h2>
            <p className="text-sm text-gray-500">Real-time system status and activity</p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <StatCard label="Total Officers" value={stats.totalOfficers} />
          <StatCard label="Active Now" value={stats.activeOfficers} color="text-green-600" bgColor="bg-green-50" />
          <StatCard label="Sessions Today" value={stats.sessionsToday} color="text-blue-600" bgColor="bg-blue-50" />
          <StatCard label="Alerts Today" value={stats.alertsToday} color={stats.alertsToday > 5 ? 'text-red-600' : 'text-yellow-600'} bgColor={stats.alertsToday > 5 ? 'bg-red-50' : 'bg-yellow-50'} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <StatCard label="Dispatches Today" value={stats.dispatchesToday} color="text-red-600" bgColor="bg-red-50" />
          <StatCard label="Total Sessions" value={stats.totalSessions.toLocaleString()} />
          <StatCard label="Avg Session Duration" value={stats.avgSessionDuration} />
          <StatCard label="System Uptime" value={stats.systemUptime} color="text-green-600" bgColor="bg-green-50" />
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm">Bridge Server</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm">Database</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm">Socket.IO</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
            <span className="text-sm">CAD Integration</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
        </div>
        <div className="space-y-3">
          {activity.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 bg-gray-50 rounded-lg border-l-4 ${getActivityColor(item.type)}`}
            >
              <span className="text-xl">{getActivityIcon(item.type)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.message}</p>
                <p className="text-xs text-gray-500">{item.officer}</p>
              </div>
              <p className="text-xs text-gray-400">{item.timestamp.split(' ')[1]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            📊 Generate Report
          </button>
          <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            👤 Add Officer
          </button>
          <button className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            ⚙️ System Settings
          </button>
          <button className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
            📥 Export Data
          </button>
        </div>
      </div>
    </div>
  );
}
