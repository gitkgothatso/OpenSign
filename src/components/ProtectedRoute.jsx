// src/components/ProtectedRoute.jsx
// Component to protect routes based on user permissions

import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Wrapper component to protect routes based on permissions
 * @param {object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.requiredPermission - Permission required (e.g., 'canManageUsers')
 * @param {string} props.userRole - Current user's role
 * @param {string} props.redirectTo - Path to redirect if unauthorized (default: '/dashboard')
 */
export const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  userRole, 
  redirectTo = '/dashboard' 
}) => {
  const permissions = usePermissions(userRole);

  // Check if user has required permission
  const hasPermission = permissions[requiredPermission];

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * Component to conditionally render content based on permissions
 * @param {object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string} props.permission - Permission required
 * @param {string} props.userRole - Current user's role
 * @param {React.ReactNode} props.fallback - Content to render if not authorized (optional)
 */
export const ProtectedContent = ({ 
  children, 
  permission, 
  userRole, 
  fallback = null 
}) => {
  const permissions = usePermissions(userRole);
  const hasPermission = permissions[permission];

  return hasPermission ? children : fallback;
};

export default ProtectedRoute;
