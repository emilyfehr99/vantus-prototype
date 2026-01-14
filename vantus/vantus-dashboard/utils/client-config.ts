/**
 * Client Configuration (Dashboard)
 * Centralized configuration for client-specific settings
 */

const CLIENT_CONFIG = {
  // Client Information
  department: {
    name: process.env.NEXT_PUBLIC_DEPARTMENT_NAME || 'DEPARTMENT_NAME',
    abbreviation: process.env.NEXT_PUBLIC_DEPARTMENT_ABBREV || 'DEPT',
    jurisdiction: {
      center: {
        lat: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LAT || '49.8951'),
        lng: parseFloat(process.env.NEXT_PUBLIC_MAP_CENTER_LNG || '-97.1384'),
      },
    },
  },

  // Server URLs
  servers: {
    bridge: process.env.NEXT_PUBLIC_BRIDGE_URL || 'http://localhost:3001',
    dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3000',
    admin: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002',
  },

  // Officer ID Format
  officerId: {
    format: process.env.NEXT_PUBLIC_OFFICER_ID_FORMAT || 'OFFICER_{badge}',
    prefix: process.env.NEXT_PUBLIC_OFFICER_ID_PREFIX || 'OFFICER_',
    separator: process.env.NEXT_PUBLIC_OFFICER_ID_SEPARATOR || '_',
  },

  // Branding
  branding: {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'VANTUS',
    departmentName: process.env.NEXT_PUBLIC_DEPARTMENT_NAME || 'DEPARTMENT_NAME',
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#1E40AF',
    secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#3B82F6',
  },
};

/**
 * Generate officer ID from badge number
 */
export function generateOfficerId(badgeNumber: string): string {
  const { format, prefix, separator } = CLIENT_CONFIG.officerId;
  if (format.includes('{badge}')) {
    return format.replace('{badge}', badgeNumber);
  }
  return prefix + separator + badgeNumber;
}

/**
 * Get server URL
 */
export function getServerUrl(type: 'bridge' | 'dashboard' | 'admin' = 'bridge'): string {
  return CLIENT_CONFIG.servers[type] || CLIENT_CONFIG.servers.bridge;
}

/**
 * Get department center coordinates
 */
export function getDepartmentCenter(): { lat: number; lng: number } {
  return CLIENT_CONFIG.department.jurisdiction.center;
}

export default CLIENT_CONFIG;
