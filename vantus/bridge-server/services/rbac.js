/**
 * Role-Based Access Control (RBAC) Service
 * Manages roles, permissions, and authorization checks
 */

const logger = require('../utils/logger');

// Role definitions with permissions
const ROLES = {
    officer: {
        name: 'Officer',
        level: 1,
        permissions: [
            'view_own_data',
            'start_session',
            'end_session',
            'create_marker',
            'request_welfare_check',
            'view_own_signals',
            'acknowledge_alert',
        ],
    },
    supervisor: {
        name: 'Supervisor',
        level: 2,
        permissions: [
            // Inherits all officer permissions
            'view_own_data',
            'start_session',
            'end_session',
            'create_marker',
            'request_welfare_check',
            'view_own_signals',
            'acknowledge_alert',
            // Supervisor-specific permissions
            'view_all_officers',
            'view_all_signals',
            'veto_dispatch',
            'view_live_feed',
            'generate_reports',
            'flag_signals',
            'view_officer_baselines',
            'override_alert',
        ],
    },
    admin: {
        name: 'Administrator',
        level: 3,
        permissions: [
            // Inherits all supervisor permissions
            'view_own_data',
            'start_session',
            'end_session',
            'create_marker',
            'request_welfare_check',
            'view_own_signals',
            'acknowledge_alert',
            'view_all_officers',
            'view_all_signals',
            'veto_dispatch',
            'view_live_feed',
            'generate_reports',
            'flag_signals',
            'view_officer_baselines',
            'override_alert',
            // Admin-specific permissions
            'configure_system',
            'manage_users',
            'manage_roles',
            'view_audit_logs',
            'view_security_logs',
            'export_data',
            'import_data',
            'delete_data',
            'manage_retention',
            'system_diagnostics',
        ],
    },
};

// Permission descriptions for documentation
const PERMISSION_DESCRIPTIONS = {
    view_own_data: 'View personal officer data and session history',
    start_session: 'Start a new monitoring session',
    end_session: 'End an active monitoring session',
    create_marker: 'Create marker events during session',
    request_welfare_check: 'Request a welfare check',
    view_own_signals: 'View signals generated during own sessions',
    acknowledge_alert: 'Acknowledge alerts directed to self',
    view_all_officers: 'View data for all officers in jurisdiction',
    view_all_signals: 'View all signals across all officers',
    veto_dispatch: 'Veto an automatic dispatch during countdown',
    view_live_feed: 'View live video/audio feeds',
    generate_reports: 'Generate summary and compliance reports',
    flag_signals: 'Flag signals for review',
    view_officer_baselines: 'View baseline data for any officer',
    override_alert: 'Override or dismiss alerts for officers',
    configure_system: 'Modify system configuration settings',
    manage_users: 'Create, modify, or deactivate user accounts',
    manage_roles: 'Assign or change user roles',
    view_audit_logs: 'View audit logs',
    view_security_logs: 'View security event logs',
    export_data: 'Export data from the system',
    import_data: 'Import data into the system',
    delete_data: 'Permanently delete data',
    manage_retention: 'Configure data retention policies',
    system_diagnostics: 'Access system diagnostics and health checks',
};

class RBACService {
    constructor() {
        this.roles = ROLES;
        this.permissionDescriptions = PERMISSION_DESCRIPTIONS;
    }

    /**
     * Check if a role exists
     * @param {string} role - Role name
     * @returns {boolean}
     */
    roleExists(role) {
        return !!this.roles[role];
    }

    /**
     * Get role details
     * @param {string} role - Role name
     * @returns {Object|null}
     */
    getRole(role) {
        return this.roles[role] || null;
    }

    /**
     * Get all available roles
     * @returns {string[]}
     */
    getAllRoles() {
        return Object.keys(this.roles);
    }

    /**
     * Check if a role has a specific permission
     * @param {string} role - Role name
     * @param {string} permission - Permission to check
     * @returns {boolean}
     */
    hasPermission(role, permission) {
        const roleData = this.roles[role];
        if (!roleData) {
            logger.warn('Permission check for unknown role', { role, permission });
            return false;
        }
        return roleData.permissions.includes(permission);
    }

    /**
     * Get all permissions for a role
     * @param {string} role - Role name
     * @returns {string[]}
     */
    getRolePermissions(role) {
        const roleData = this.roles[role];
        return roleData ? roleData.permissions : [];
    }

    /**
     * Check if one role has higher level than another
     * @param {string} role1 - First role
     * @param {string} role2 - Second role
     * @returns {boolean} True if role1 has higher or equal level
     */
    hasHigherOrEqualLevel(role1, role2) {
        const r1 = this.roles[role1];
        const r2 = this.roles[role2];
        if (!r1 || !r2) return false;
        return r1.level >= r2.level;
    }

    /**
     * Authorize an action
     * @param {Object} user - User object with role and badgeNumber
     * @param {string} permission - Permission required
     * @param {Object} resource - Optional resource being accessed
     * @returns {{authorized: boolean, reason?: string}}
     */
    authorize(user, permission, resource = null) {
        if (!user || !user.role) {
            return { authorized: false, reason: 'No user or role provided' };
        }

        if (!this.hasPermission(user.role, permission)) {
            logger.info('Permission denied', {
                user: user.badgeNumber,
                role: user.role,
                permission,
                resource: resource?.id,
            });
            return {
                authorized: false,
                reason: `Role '${user.role}' does not have permission '${permission}'`
            };
        }

        // Resource-level checks (e.g., can only view own data for officer role)
        if (resource && resource.ownerId && user.role === 'officer') {
            if (permission === 'view_own_data' && resource.ownerId !== user.badgeNumber) {
                return {
                    authorized: false,
                    reason: 'Officers can only access their own data'
                };
            }
        }

        return { authorized: true };
    }

    /**
     * Create middleware for Express routes
     * @param {string} permission - Required permission
     * @returns {Function} Express middleware
     */
    requirePermission(permission) {
        return (req, res, next) => {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
            }

            const authResult = this.authorize(user, permission, req.resource);

            if (!authResult.authorized) {
                logger.warn('Authorization failed', {
                    user: user.badgeNumber,
                    permission,
                    reason: authResult.reason,
                    path: req.path,
                });

                return res.status(403).json({
                    error: 'Permission denied',
                    code: 'PERMISSION_DENIED',
                    reason: authResult.reason,
                });
            }

            next();
        };
    }

    /**
     * Create middleware that requires any of the specified permissions
     * @param {string[]} permissions - Array of permissions (any one is sufficient)
     * @returns {Function} Express middleware
     */
    requireAnyPermission(permissions) {
        return (req, res, next) => {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
            }

            const hasAny = permissions.some(p => this.hasPermission(user.role, p));

            if (!hasAny) {
                logger.warn('Authorization failed - no matching permissions', {
                    user: user.badgeNumber,
                    requiredAny: permissions,
                    path: req.path,
                });

                return res.status(403).json({
                    error: 'Permission denied',
                    code: 'PERMISSION_DENIED',
                    required: permissions,
                });
            }

            next();
        };
    }

    /**
     * Create middleware that requires all specified permissions
     * @param {string[]} permissions - Array of permissions (all are required)
     * @returns {Function} Express middleware
     */
    requireAllPermissions(permissions) {
        return (req, res, next) => {
            const user = req.user;

            if (!user) {
                return res.status(401).json({
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                });
            }

            const missing = permissions.filter(p => !this.hasPermission(user.role, p));

            if (missing.length > 0) {
                logger.warn('Authorization failed - missing permissions', {
                    user: user.badgeNumber,
                    missing,
                    path: req.path,
                });

                return res.status(403).json({
                    error: 'Permission denied',
                    code: 'PERMISSION_DENIED',
                    missing,
                });
            }

            next();
        };
    }

    /**
     * Get permission description
     * @param {string} permission - Permission name
     * @returns {string}
     */
    getPermissionDescription(permission) {
        return this.permissionDescriptions[permission] || 'No description available';
    }

    /**
     * Get all permissions with descriptions
     * @returns {Object[]}
     */
    getAllPermissionsWithDescriptions() {
        return Object.entries(this.permissionDescriptions).map(([name, description]) => ({
            name,
            description,
            roles: this.getAllRoles().filter(role => this.hasPermission(role, name)),
        }));
    }
}

// Export singleton instance
const rbacService = new RBACService();
module.exports = rbacService;
module.exports.ROLES = ROLES;
module.exports.PERMISSION_DESCRIPTIONS = PERMISSION_DESCRIPTIONS;
