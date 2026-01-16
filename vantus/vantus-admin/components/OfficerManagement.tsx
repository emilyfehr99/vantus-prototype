'use client';

import { useState } from 'react';

interface Officer {
  id: string;
  badgeNumber: string;
  name: string;
  status: 'active' | 'offline' | 'warning';
  heartRate: string;
  battery: string;
  lastUpdate: string;
}

// Mock data matching screenshot
const MOCK_OFFICERS: Officer[] = [
  { id: '1', badgeNumber: '4521', name: 'Cst. Sarah Chen', status: 'active', heartRate: '78 BPM', battery: '92%', lastUpdate: '12:49:09 PM' },
  { id: '2', badgeNumber: '4522', name: 'Cst. Mike Rodriguez', status: 'active', heartRate: '85 BPM', battery: '76%', lastUpdate: '12:49:09 PM' },
  { id: '3', badgeNumber: '4523', name: 'Cst. James Wilson', status: 'offline', heartRate: '--', battery: '45%', lastUpdate: '12:49:09 PM' },
  { id: '4', badgeNumber: '3001', name: 'Sgt. Emily Park', status: 'active', heartRate: '72 BPM', battery: '88%', lastUpdate: '12:49:09 PM' },
];

export default function OfficerManagement() {
  const [officers] = useState<Officer[]>(MOCK_OFFICERS);

  const getStatusBadge = (status: Officer['status']) => {
    const styles = {
      active: 'border-green-500 text-green-500 bg-green-900/20',
      offline: 'border-gray-600 text-gray-500 bg-gray-900/20',
      warning: 'border-yellow-500 text-yellow-500 bg-yellow-900/20',
    };

    return (
      <div className={`inline-block border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${styles[status]}`}>
        {status}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border border-gray-800 bg-black/50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-green-500 uppercase">Officer</th>
              <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-green-500 uppercase">Badge</th>
              <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-green-500 uppercase">Status</th>
              <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-green-500 uppercase">Heart Rate</th>
              <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-green-500 uppercase">Battery</th>
              <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-green-500 uppercase">Last Update</th>
              <th className="py-4 px-6 text-[10px] font-bold tracking-widest text-green-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {officers.map((officer) => (
              <tr key={officer.id} className="hover:bg-white/5 transition-colors group">
                <td className="py-6 px-6 font-mono text-white text-lg font-bold">{officer.name}</td>
                <td className="py-6 px-6 font-mono text-green-500 text-lg">{officer.badgeNumber}</td>
                <td className="py-6 px-6">{getStatusBadge(officer.status)}</td>
                <td className="py-6 px-6 font-mono text-green-500 font-bold">{officer.heartRate}</td>
                <td className={`py-6 px-6 font-mono font-bold ${parseInt(officer.battery) > 50 ? 'text-green-500' : 'text-yellow-500'}`}>{officer.battery}</td>
                <td className="py-6 px-6 font-mono text-gray-500 text-xs tracking-wider">{officer.lastUpdate}</td>
                <td className="py-6 px-6">
                  <button className="border border-green-500 text-green-500 px-4 py-1 text-[10px] font-bold tracking-widest uppercase hover:bg-green-500 hover:text-black transition-colors">
                    VIEW
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
