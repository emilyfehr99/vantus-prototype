'use client';

import { useState } from 'react';
import logger from '../utils/logger';

interface Officer {
  id: string;
  badgeNumber: string;
  name: string;
  unit: string;
  role: 'officer' | 'supervisor' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string | null;
  trainingComplete: boolean;
}

// Mock data for demo
const MOCK_OFFICERS: Officer[] = [
  { id: '1', badgeNumber: 'WPS-4472', name: 'Sarah Chen', unit: 'Patrol Unit 12', role: 'officer', status: 'active', lastActive: '2026-01-15', trainingComplete: true },
  { id: '2', badgeNumber: 'WPS-3301', name: 'Michael Torres', unit: 'Traffic Division', role: 'officer', status: 'active', lastActive: '2026-01-14', trainingComplete: true },
  { id: '3', badgeNumber: 'WPS-2156', name: 'Jennifer Liu', unit: 'Patrol Unit 8', role: 'supervisor', status: 'active', lastActive: '2026-01-15', trainingComplete: true },
  { id: '4', badgeNumber: 'WPS-1892', name: 'David Martinez', unit: 'Downtown Beat', role: 'officer', status: 'inactive', lastActive: '2026-01-10', trainingComplete: false },
];

export default function OfficerManagement() {
  const [officers, setOfficers] = useState<Officer[]>(MOCK_OFFICERS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New officer form state
  const [newOfficer, setNewOfficer] = useState({
    badgeNumber: '',
    name: '',
    unit: '',
    role: 'officer' as const,
  });

  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || officer.role === filterRole;
    const matchesStatus = filterStatus === 'all' || officer.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddOfficer = () => {
    if (!newOfficer.badgeNumber || !newOfficer.name) {
      alert('Please fill in required fields');
      return;
    }

    const officer: Officer = {
      id: Date.now().toString(),
      ...newOfficer,
      status: 'active',
      lastActive: null,
      trainingComplete: false,
    };

    setOfficers([...officers, officer]);
    setNewOfficer({ badgeNumber: '', name: '', unit: '', role: 'officer' });
    setShowAddModal(false);
    logger.info('Officer added', { badgeNumber: officer.badgeNumber });
  };

  const handleStatusChange = (officerId: string, newStatus: Officer['status']) => {
    setOfficers(officers.map(o =>
      o.id === officerId ? { ...o, status: newStatus } : o
    ));
    logger.info('Officer status changed', { officerId, newStatus });
  };

  const handleRemoveOfficer = (officerId: string) => {
    if (confirm('Are you sure you want to remove this officer?')) {
      setOfficers(officers.filter(o => o.id !== officerId));
      logger.info('Officer removed', { officerId });
    }
  };

  const getStatusBadge = (status: Officer['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: Officer['role']) => {
    const colors = {
      officer: 'bg-blue-100 text-blue-800',
      supervisor: 'bg-purple-100 text-purple-800',
      admin: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Officer Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Add Officer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Officers</p>
          <p className="text-2xl font-bold text-gray-900">{officers.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-700">
            {officers.filter(o => o.status === 'active').length}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Training Complete</p>
          <p className="text-2xl font-bold text-blue-700">
            {officers.filter(o => o.trainingComplete).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Supervisors</p>
          <p className="text-2xl font-bold text-purple-700">
            {officers.filter(o => o.role === 'supervisor' || o.role === 'admin').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or badge..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Roles</option>
          <option value="officer">Officers</option>
          <option value="supervisor">Supervisors</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Officers Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Badge</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Training</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOfficers.map((officer) => (
              <tr key={officer.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap font-mono text-sm">{officer.badgeNumber}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{officer.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{officer.unit}</td>
                <td className="px-4 py-4 whitespace-nowrap">{getRoleBadge(officer.role)}</td>
                <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(officer.status)}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {officer.trainingComplete ? (
                    <span className="text-green-600">✓ Complete</span>
                  ) : (
                    <span className="text-orange-600">Pending</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {officer.lastActive || 'Never'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <select
                      value={officer.status}
                      onChange={(e) => handleStatusChange(officer.id, e.target.value as Officer['status'])}
                      className="text-xs px-2 py-1 border rounded"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <button
                      onClick={() => handleRemoveOfficer(officer.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Officer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Number *</label>
                <input
                  type="text"
                  value={newOfficer.badgeNumber}
                  onChange={(e) => setNewOfficer({ ...newOfficer, badgeNumber: e.target.value })}
                  placeholder="WPS-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newOfficer.name}
                  onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                  placeholder="First Last"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit/Assignment</label>
                <input
                  type="text"
                  value={newOfficer.unit}
                  onChange={(e) => setNewOfficer({ ...newOfficer, unit: e.target.value })}
                  placeholder="Patrol Unit X"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newOfficer.role}
                  onChange={(e) => setNewOfficer({ ...newOfficer, role: e.target.value as Officer['role'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="officer">Officer</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOfficer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
