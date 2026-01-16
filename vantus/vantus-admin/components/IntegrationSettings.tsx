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
      case 'connected': return 'border-green-500 text-green-500 bg-green-900/20';
      case 'disconnected': return 'border-gray-800 text-gray-500 bg-gray-900/20';
      case 'error': return 'border-red-500 text-red-500 bg-red-900/20';
      case 'pending': return 'border-yellow-500 text-yellow-500 bg-yellow-900/20';
    }
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return '●';
      case 'disconnected': return '○';
      case 'error': return '✕';
      case 'pending': return '⚡';
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
    <div className="space-y-6">
      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="border border-gray-800 bg-black/50 p-6 hover:border-green-500/50 transition-colors group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">{getIntegrationIcon(integration.type)}</span>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase mb-1">{integration.name}</h3>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {integration.lastSync
                      ? `SYNC: ${new Date(integration.lastSync).toLocaleTimeString()}`
                      : 'NOT CONFIGURED'}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${getStatusColor(integration.status)}`}>
                {getStatusIcon(integration.status)} {integration.status}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleConfigure(integration)}
                className="flex-1 px-3 py-2 bg-green-900/20 text-green-500 border border-green-900 text-xs font-bold tracking-wider hover:bg-green-500 hover:text-black transition-colors"
              >
                CONFIGURE
              </button>
              <button
                onClick={() => handleTestConnection(integration.id)}
                className="px-3 py-2 bg-gray-900/20 text-gray-500 border border-gray-800 text-xs font-bold tracking-wider hover:text-white hover:border-white transition-colors"
                disabled={integration.status === 'pending'}
              >
                TEST
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-black border border-green-500 rounded-none p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center gap-3 mb-8 border-b border-gray-800 pb-4">
              <span className="text-2xl">{getIntegrationIcon(selectedIntegration.type)}</span>
              <h3 className="text-lg font-bold text-white tracking-widest uppercase">Configure {selectedIntegration.name}</h3>
            </div>

            <div className="space-y-6">
              {getConfigFields(selectedIntegration.type).map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] font-bold text-green-500 tracking-widest uppercase mb-2">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={configValues[field.key] || ''}
                      onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-green-500 focus:outline-none font-mono text-xs h-32"
                      placeholder={`ENTER ${field.label.toUpperCase()}...`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={configValues[field.key] || ''}
                      onChange={(e) => setConfigValues({ ...configValues, [field.key]: e.target.value })}
                      className="w-full px-4 py-3 bg-black border border-gray-800 text-white focus:border-green-500 focus:outline-none font-mono text-xs"
                      placeholder={`ENTER ${field.label.toUpperCase()}...`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-800">
              <button
                onClick={() => setSelectedIntegration(null)}
                className="flex-1 px-4 py-3 bg-transparent border border-gray-800 text-gray-400 text-xs font-bold tracking-widest hover:text-white hover:border-white transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-3 bg-green-600/20 border border-green-500 text-green-500 text-xs font-bold tracking-widest hover:bg-green-500 hover:text-black transition-colors"
              >
                SAVE & TEST
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Events Reference */}
      <div className="mt-8 p-6 border border-gray-800 bg-black/30">
        <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-4">Available Webhook Events</h3>
        <div className="flex flex-wrap gap-2">
          {['THREAT_DETECTED', 'DISPATCH_REQUESTED', 'OFFICER_DOWN', 'SESSION_START', 'SESSION_END', 'WELFARE_CHECK_FAILED'].map(event => (
            <code key={event} className="px-2 py-1 bg-gray-900 border border-gray-800 text-green-500/70 font-mono text-[10px]">
              {event}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
