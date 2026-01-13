export default function IntegrationSettings() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Integration Settings</h2>
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Configure system integrations and API connections
        </div>
        <button className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
          Configure Integrations
        </button>
      </div>
    </div>
  )
}
