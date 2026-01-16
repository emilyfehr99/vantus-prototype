'use client';

import { useState, useEffect } from 'react';
import DepartmentOverview from '@/components/DepartmentOverview';
import IntegrationSettings from '@/components/IntegrationSettings';
import LicenseManagement from '@/components/LicenseManagement';
import OfficerManagement from '@/components/OfficerManagement';
import PolicyControl from '@/components/PolicyControl';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('DEPARTMENT OVERVIEW');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'DEPARTMENT OVERVIEW':
        return <DepartmentOverview />;
      case 'OFFICER MANAGEMENT':
        return <OfficerManagement />;
      case 'LICENSE MANAGEMENT':
        return <LicenseManagement />;
      case 'INTEGRATION SETTINGS':
        return <IntegrationSettings />;
      case 'POLICY CONTROL':
        return <PolicyControl />;
      default:
        return <DepartmentOverview />;
    }
  };

  const tabs = [
    'DEPARTMENT OVERVIEW',
    'OFFICER MANAGEMENT',
    'LICENSE MANAGEMENT',
    'INTEGRATION SETTINGS',
    'POLICY CONTROL'
  ];

  return (
    <div className="min-h-screen bg-black text-white font-mono pb-20">
      {/* Top Header */}
      <header className="border-b border-gray-900 px-6 py-4 flex items-center justify-between bg-black/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-[0.2em] text-white">VANTUS</h1>
            <span className="text-[10px] tracking-[0.3em] text-gray-400">SAFETY SYSTEMS</span>
          </div>
          <div className="h-8 w-px bg-gray-800 mx-4"></div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-red-600 font-bold text-xs tracking-wider">OFFLINE</span>
            <span className="text-gray-500 text-xs ml-2 tracking-widest">{currentTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[10px] tracking-widest text-gray-500 uppercase">Admin Portal</span>
          <div className="border border-green-500 px-3 py-1 bg-green-900/10">
            <span className="text-green-500 font-bold text-xs tracking-wider">SYSTEM SECURE</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-gray-900 px-6 flex items-center gap-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 text-xs font-bold tracking-widest transition-colors relative ${activeTab === tab
                ? 'text-black bg-green-500 px-4'
                : 'text-gray-400 hover:text-white px-2'
              }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="p-8 max-w-[1600px] mx-auto">
        <div className="mb-8 flex items-center justify-between border-b border-gray-900 pb-4">
          <h2 className="text-xl font-bold tracking-widest text-white uppercase flex items-center gap-4">
            {activeTab}
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-green-500 text-xs font-bold tracking-widest">LIVE</span>
          </div>
        </div>

        <div className="animate-fadeIn">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
