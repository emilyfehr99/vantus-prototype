export default function LicenseManagement() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">License Management</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">License Status</p>
          <p className="text-lg font-semibold text-green-600">Active</p>
        </div>
        <div className="text-sm text-gray-600">
          Manage licenses and subscriptions
        </div>
      </div>
    </div>
  )
}
