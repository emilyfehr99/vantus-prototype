export default function DepartmentOverview() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Overview</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Total Departments</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Active Officers</p>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  )
}
