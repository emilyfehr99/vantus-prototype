export default function OfficerManagement() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Officer Management</h2>
      <div className="space-y-4">
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Add Officer
        </button>
        <div className="text-sm text-gray-600">
          Manage officer accounts and permissions
        </div>
      </div>
    </div>
  )
}
