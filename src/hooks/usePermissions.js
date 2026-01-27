// src/hooks/usePermissions.js
// React hook for role-based permissions

import { useMemo } from 'react';
import permissionService from '../services/permissionService';

/**
 * Custom hook to check user permissions based on role
 * @param {string} userRole - User's role from backend (contracts_Admin, contracts_Editor, contracts_User)
 * @returns {object} Permission flags and helper functions
 */
export const usePermissions = (userRole) => {
  const permissions = useMemo(() => ({
    // Role checks
    isAdmin: permissionService.isAdmin(userRole),
    isEditor: permissionService.isEditor(userRole),
    isRegularUser: permissionService.isRegularUser(userRole),

    // Feature permissions
    canManageUsers: permissionService.canManageUsers(userRole),
    canCreateTeams: permissionService.canCreateTeams(userRole),
    canManageTeams: permissionService.canManageTeams(userRole),
    canViewOrgSettings: permissionService.canViewOrgSettings(userRole),
    canCreateTemplates: permissionService.canCreateTemplates(userRole),
    canShareOrgWide: permissionService.canShareOrgWide(userRole),
    canViewAnalytics: permissionService.canViewAnalytics(userRole),
    canManageOrgContacts: permissionService.canManageOrgContacts(userRole),

    // Helper functions
    canDeleteDocument: (documentOwnerId, currentUserId) =>
      permissionService.canDeleteDocument(userRole, documentOwnerId, currentUserId),
    
    getRoleName: () => permissionService.getRoleName(userRole),
    getRoleBadgeColor: () => permissionService.getRoleBadgeColor(userRole),
    
    // Current role
    role: userRole
  }), [userRole]);

  return permissions;
};

export default usePermissions;
