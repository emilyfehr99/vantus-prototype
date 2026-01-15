'use client';

import { useState } from 'react';
import logger from '../utils/logger';

interface Integration {
  id: string;
  name: string;
  type: 'cad' | 'sso' | 'rms' | 'axon' | 'geocoding' | 'webhook';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: string | null;
  config: Record<string, string>;
}

const INTEGRATIONS: Integration[] = [
  { id: 'cad', name: 'CAD System', type: 'cad', status: 'disconnected', lastSync: null, config: { endpoint: '', apiKey: '' } },
  { id: 'sso', name: 'SSO / SAML 2.0', type: 'sso', status: 'disconnected', lastSync: null, config: { provider: '', entityId: '' } },
  { id: 'axon', name: 'Axon Evidence', type: 'axon', status: 'disconnected', lastSync: null, config: { apiKey: '', accountId: '' } },
  { id: 'rms', name: 'Records Management', type: 'rms', status: 'disconnected', lastSync: null, config: { endpoint: '', apiKey: '' } },
  { id: 'geocoding', name: 'Geocoding (Maps)', type: 'geocoding', status: 'disconnected', lastSync: null, config: { provider: 'osm', apiKey: '' } },
  { id: 'webhook', name: 'Alert Webhooks', type: 'webhook', status: 'disconnected', lastSync: null, config: { url: '', secret: '' } },
];

export default function IntegrationSettings() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return '✓';
      case 'disconnected': return '○';
      case 'error': return '✗';
      case 'pending': return '⏳';
    }
  };

  const getIntegrationIcon = (type: Integration['type']) => {
    switch (type) {
      case 'cad': return '📡';
      case 'sso': return '🔐';
      case 'axon': return '📹';
      case 'rms': return '📁';
      case 'geocoding': return '🗺️';
      case 'webhook': return '🔔';
    }
  };

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigValues({ ...integration.config });
  };

  const handleSaveConfig = () => {
    if (!selectedIntegration) return;

    setIntegrations(integrations.map(i =>
      i.id === selectedIntegration.id
        ? { ...i, config: configValues, status: 'pending' }
        : i
    ));

    logger.info('Integration config saved', { id: selectedIntegration.id, config: configValues });
    alert('Configuration saved. Testing connection...');

    // Simulate connection test
    setTimeout(() => {
      const hasAllValues = Object.values(configValues).every(v => v.trim() !== '');
      setIntegrations(prev => prev.map(i =>
        i.id === selectedIntegration.id
          ? { ...i, status: hasAllValues ? 'connected' : 'disconnected', lastSync: hasAllValues ? new Date().toISOString() : null }
          : i
      ));
    }, 1500);

    setSelectedIntegration(null);
  };

  const handleTestConnection = (integrationId: string) => {
    setIntegrations(prev => prev.map(i =>
      i.id === integrationId ? { ...i, status: 'pending' } : i
    ));

    setTimeout(() => {
      const integration = integrations.find(i => i.id === integrationId);
      const hasConfig = integration && Object.values(integration.config).some(v => v.trim() !== '');
      setIntegrations(prev => prev.map(i =>
        i.id === integrationId
          ? { ...i, status: hasConfig ? 'connected' : 'error', lastSync: hasConfig ? new Date().toISOString() : null }
          : i
      ));
    }, 2000);
  };

  const getConfigFields = (type: Integration['type']): { key: string; label: string; type: string }[] => {
    switch (type) {
      case 'cad':
        return [
          { key: 'endpoint', label: 'CAD API Endpoint', type: 'url' },
          { key: 'apiKey', label: 'API Key', type: 'password' },
          { key: 'dispatchTemplate', label: 'Dispatch Template', type: 'text' },
        ];
      case 'sso':
        return [
          { key: 'provider', label: 'Identity Provider', type: 'text' },
          { key: 'entityId', label: 'Entity ID', type: 'text' },
          { key: 'metadataUrl', label: 'Metadata URL', type: 'url' },
          { key: 'certificate', label: 'X.509 Certificate', type: 'textarea' },
        ];
      case 'axon':
        return [
          { key: 'apiKey', label: 'Axon API Key', type: 'password' },
          { key: 'accountId', label: 'Account ID', type: 'text' },
          { key: 'bucket', label: 'Evidence Bucket', type: 'text' },
        ];
      case 'rms':
        return [
          { key: 'endpoint', label: 'RMS API Endpoint', type: 'url' },
          { key: 'apiKey', label: 'API Key', type: 'password' },
          { key: 'agencyCode', label: 'Agency Code', type: 'text' },
        ];
      case 'geocoding':
        return [
          { key: 'provider', label: 'Provider (google/osm)', type: 'text' },
          { key: 'apiKey', label: 'API Key', type: 'password' },
        ];
      case 'webhook':
        return [
          { key: 'url', label: 'Webhook URL', type: 'url' },
          { key: 'secret', label: 'Webhook Secret', type: 'password' },
          { key: 'events', label: 'Events (comma-separated)', type: 'text' },
        ];
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Integration Settings</h2>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-500">
                    {integration.lastSync
                      ? `Last sync: ${new Date(integration.lastSync).toLocaleString()}`
                      : 'Not configured'}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(integration.status)}`}>
                {getStatusIcon(integration.status)} {integration.status}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleConfigure(integration)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Configure
              </button>
              <button
                onClick={() => handleTestConnection(integration.id)}
                className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                disabled={integration.status === 'pending'}
              >
                Test
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{getIntegrationIcon(selectedIntegration.type)}</span>
              <h3 className="text-lg font-semibold">Configure {selectedIntegration.name}</h3>
            </div>

            <div className="space-y-4">
              {getConfigFields(selectedIntegration.type).map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={configValues[field.key] || ''}
                      onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 font-mono text-sm"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={configValues[field.key] || ''}
                      onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setSelectedIntegration(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save & Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Events Reference */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Available Webhook Events</h3>
        <div className="flex flex-wrap gap-2">
          {['THREAT_DETECTED', 'DISPATCH_REQUESTED', 'OFFICER_DOWN', 'SESSION_START', 'SESSION_END', 'WELFARE_CHECK_FAILED'].map(event => (
            <code key={event} className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded">
              {event}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
