'use client';

import { useState } from 'react';
import logger from '../utils/logger';

export default function PolicyControl() {
  const [dataRetentionDays, setDataRetentionDays] = useState(90);
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);
  const [roleBasedAccess, setRoleBasedAccess] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(true);

  const handleSavePolicies = () => {
    // In production, this would save to backend
    const policies = {
      dataRetentionDays,
      autoDeleteEnabled,
      roleBasedAccess,
      privacyMode,
      updatedAt: new Date().toISOString(),
    };
    logger.info('Saving policies', { policies });
    alert('Policies saved successfully');
  };

  const handleDeleteData = () => {
    if (confirm('Are you sure you want to delete data older than the retention period? This action cannot be undone.')) {
      // In production, this would trigger data deletion
      logger.info('Deleting data older than retention period', { dataRetentionDays });
      alert('Data deletion initiated');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border border-green-900/30 bg-black/50 p-8">
        <h3 className="text-[10px] font-bold tracking-widest text-green-500 uppercase mb-8">PRIVACY & POLICY CONTROL</h3>

        <div className="space-y-12">
          {/* Data Retention Policy */}
          <div className="border-b border-gray-800 pb-8">
            <label className="block text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-4">
              DATA RETENTION PERIOD (DAYS)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(parseInt(e.target.value) || 90)}
                min="1"
                max="365"
                className="w-32 bg-black border border-gray-800 text-white font-mono text-2xl font-bold px-4 py-2 focus:border-green-500 focus:outline-none"
              />
              <p className="text-[9px] text-gray-600 uppercase tracking-wider">
                Records older than {dataRetentionDays} days will be purged
              </p>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-6">
            {[
              { label: 'AUTOMATIC DATA DELETION', desc: 'Securely wipe data after retention period', checked: autoDeleteEnabled, set: setAutoDeleteEnabled },
              { label: 'ROLE-BASED ACCESS CONTROL', desc: 'Enforce strict officer/supervisor/admin hierarchies', checked: roleBasedAccess, set: setRoleBasedAccess },
              { label: 'PRIVACY MODE', desc: 'Process biometric data locally without raw cloud storage', checked: privacyMode, set: setPrivacyMode },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div>
                  <label className="block text-sm font-bold text-white tracking-widest uppercase mb-1 group-hover:text-green-500 transition-colors">
                    {item.label}
                  </label>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    {item.desc}
                  </p>
                </div>
                <button
                  onClick={() => item.set(!item.checked)}
                  className={`w-12 h-6 rounded-none border transition-all relative ${item.checked ? 'border-green-500 bg-green-900/20' : 'border-gray-800 bg-black'
                    }`}
                >
                  <div className={`absolute top-0.5 bottom-0.5 w-5 bg-current transition-all ${item.checked ? 'right-0.5 bg-green-500' : 'left-0.5 bg-gray-700'
                    }`} />
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-800">
            <button
              onClick={handleSavePolicies}
              className="flex-1 px-4 py-4 bg-green-600/10 border border-green-500 text-green-500 text-xs font-bold tracking-[0.2em] uppercase hover:bg-green-500 hover:text-black transition-colors"
            >
              SAVE POLICIES
            </button>
            <button
              onClick={handleDeleteData}
              className="px-8 py-4 bg-red-900/10 border border-red-900 text-red-700 text-xs font-bold tracking-[0.2em] uppercase hover:bg-red-600 hover:text-black hover:border-red-600 transition-colors"
            >
              PURGE DATA
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
