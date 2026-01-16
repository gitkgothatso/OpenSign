// src/services/permissionService.js
// Role-based permission checking service

export const permissionService = {
  /**
   * Check if user has admin role
   * @param {string} userRole - User's role (contracts_Admin, contracts_Editor, contracts_User)
   * @returns {boolean}
   */
  isAdmin: (userRole) => {
    return userRole === 'contracts_Admin' || userRole === 'OrgAdmin';
  },

  /**
   * Check if user has editor role
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  isEditor: (userRole) => {
    return userRole === 'contracts_Editor';
  },

  /**
   * Check if user is a regular user
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  isRegularUser: (userRole) => {
    return userRole === 'contracts_User';
  },

  /**
   * Check if user can manage other users
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  canManageUsers: (userRole) => {
    return permissionService.isAdmin(userRole);
  },

  /**
   * Check if user can create teams
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  canCreateTeams: (userRole) => {
    return permissionService.isAdmin(userRole);
  },

  /**
   * Check if user can manage teams (add/remove members, change roles)
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  canManageTeams: (userRole) => {
    return permissionService.isAdmin(userRole);
  },

  /**
   * Check if user can view organization settings
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  canViewOrgSettings: (userRole) => {
    return permissionService.isAdmin(userRole);
  },

  /**
   * Check if user can create document templates
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  canCreateTemplates: (userRole) => {
    return permissionService.isAdmin(userRole) || permissionService.isEditor(userRole);
  },

  /**
   * Check if user can delete documents
   * @param {string} userRole - User's role
   * @param {string} documentOwnerId - Document owner's user ID
   * @param {string} currentUserId - Current user's ID
   * @returns {boolean}
   */
  canDeleteDocument: (userRole, documentOwnerId, currentUserId) => {
    // Admins can delete any document, users can only delete their own
    return permissionService.isAdmin(userRole) || documentOwnerId === currentUserId;
  },

  /**
   * Check if user can share documents organization-wide
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  canShareOrgWide: (userRole) => {
    return permissionService.isAdmin(userRole) || permissionService.isEditor(userRole);
  },

  /**
   * Check if user can view analytics/reports
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  canViewAnalytics: (userRole) => {
    return permissionService.isAdmin(userRole);
  },

  /**
   * Check if user can manage contacts organization-wide
   * @param {string} userRole - User's role
   * @returns {boolean}
   */
  canManageOrgContacts: (userRole) => {
    return permissionService.isAdmin(userRole);
  },

  /**
   * Get user-friendly role name
   * @param {string} userRole - User's role
   * @returns {string}
   */
  getRoleName: (userRole) => {
    const roleNames = {
      'contracts_Admin': 'Administrator',
      'OrgAdmin': 'Organization Admin',
      'contracts_Editor': 'Editor',
      'contracts_User': 'User'
    };
    return roleNames[userRole] || 'User';
  },

  /**
   * Get role badge color for UI
   * @param {string} userRole - User's role
   * @returns {string}
   */
  getRoleBadgeColor: (userRole) => {
    if (permissionService.isAdmin(userRole)) return 'badge-error'; // Red/Primary
    if (permissionService.isEditor(userRole)) return 'badge-warning'; // Orange/Warning
    return 'badge-info'; // Blue/Info
  }
};

export default permissionService;
