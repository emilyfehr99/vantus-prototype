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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Policy Control</h2>
      
      <div className="space-y-6">
        {/* Data Retention Policy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Retention Period (days)
          </label>
          <input
            type="number"
            value={dataRetentionDays}
            onChange={(e) => setDataRetentionDays(parseInt(e.target.value) || 90)}
            min="1"
            max="365"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Data older than this period will be automatically deleted
          </p>
        </div>

        {/* Auto Delete Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Automatic Data Deletion
            </label>
            <p className="text-xs text-gray-500">
              Automatically delete data after retention period
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoDeleteEnabled}
              onChange={(e) => setAutoDeleteEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Role-Based Access Control */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role-Based Access Control
            </label>
            <p className="text-xs text-gray-500">
              Restrict access based on user roles
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={roleBasedAccess}
              onChange={(e) => setRoleBasedAccess(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Privacy Mode */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Privacy Mode
            </label>
            <p className="text-xs text-gray-500">
              Enable privacy-first features (audio transcripts only, no raw data)
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={privacyMode}
              onChange={(e) => setPrivacyMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={handleSavePolicies}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Policies
          </button>
          <button
            onClick={handleDeleteData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Old Data
          </button>
        </div>
      </div>
    </div>
  )
}
