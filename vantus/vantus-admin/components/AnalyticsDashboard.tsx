'use client';

import { useState, useEffect } from 'react';
import logger from '../utils/logger';

import { getServerUrl } from '../utils/client-config';
const BRIDGE_SERVER_URL = getServerUrl('bridge');

interface AuditSummary {
  totalEvents: number;
  eventTypes: Record<string, number>;
  sessions: {
    started: number;
    ended: number;
  };
  signals: {
    total: number;
    byCategory: Record<string, number>;
  };
  connections: {
    mobile: number;
    dashboard: number;
    admin: number;
  };
  timeRange: {
    start: string;
    end: string;
  };
}

export default function AnalyticsDashboard() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Default to last 7 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSignalType, setSelectedSignalType] = useState<string>('all');

  useEffect(() => {
    fetchSummary();
  }, [startDate, endDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BRIDGE_SERVER_URL}/api/audit/summary?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      logger.error('Failed to fetch audit summary', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const response = await fetch(
        `${BRIDGE_SERVER_URL}/api/audit/logs?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vantus_audit_${startDate}_${endDate}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export logs', error);
      alert('Failed to export logs');
    }
  };

  const exportComplianceReport = () => {
    if (!summary) return;
    
    const report = {
      reportType: 'Compliance Report',
      generatedAt: new Date().toISOString(),
      timeRange: summary.timeRange,
      summary: {
        totalEvents: summary.totalEvents,
        sessions: summary.sessions,
        signals: summary.signals,
        connections: summary.connections,
      },
      eventBreakdown: summary.eventTypes,
      signalBreakdown: summary.signals.byCategory,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vantus_compliance_${startDate}_${endDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredSignals = summary
    ? selectedSignalType === 'all'
      ? Object.entries(summary.signals.byCategory)
      : Object.entries(summary.signals.byCategory).filter(([cat]) => cat === selectedSignalType)
    : [];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Analytics & Compliance</h2>
        <div className="flex gap-2">
          <button
            onClick={exportLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Export Logs
          </button>
          <button
            onClick={exportComplianceReport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            disabled={!summary}
          >
            Compliance Report
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalEvents}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Sessions Started</p>
              <p className="text-2xl font-bold text-gray-900">{summary.sessions.started}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Signals</p>
              <p className="text-2xl font-bold text-gray-900">{summary.signals.total}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Active Connections</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.connections.mobile + summary.connections.dashboard + summary.connections.admin}
              </p>
            </div>
          </div>

          {/* Event Types Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Types</h3>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2">
                {Object.entries(summary.eventTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{type}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Signal Type Filter */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Signals by Category</h3>
              <select
                value={selectedSignalType}
                onChange={(e) => setSelectedSignalType(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                {Object.keys(summary.signals.byCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <div className="space-y-2">
                {filteredSignals.map(([category, count]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{category}</span>
                    <span className="text-sm font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
                {filteredSignals.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No signals found</p>
                )}
              </div>
            </div>
          </div>

          {/* Connection Stats */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Connections</h3>
            <div className="bg-gray-50 rounded p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mobile</p>
                  <p className="text-xl font-bold text-gray-900">{summary.connections.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dashboard</p>
                  <p className="text-xl font-bold text-gray-900">{summary.connections.dashboard}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admin</p>
                  <p className="text-xl font-bold text-gray-900">{summary.connections.admin}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No data available for selected date range</p>
        </div>
      )}
    </div>
  );
}
