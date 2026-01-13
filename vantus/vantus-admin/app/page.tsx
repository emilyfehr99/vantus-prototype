import DepartmentOverview from '@/components/DepartmentOverview'
import IntegrationSettings from '@/components/IntegrationSettings'
import LicenseManagement from '@/components/LicenseManagement'
import OfficerManagement from '@/components/OfficerManagement'
import PolicyControl from '@/components/PolicyControl'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Vantus Administration</h1>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DepartmentOverview />
            <OfficerManagement />
            <IntegrationSettings />
            <LicenseManagement />
            <PolicyControl />
          </div>
          
          {/* Analytics Dashboard - Full Width */}
          <div className="mt-6">
            <AnalyticsDashboard />
          </div>
        </div>
      </div>
    </div>
  )
}
