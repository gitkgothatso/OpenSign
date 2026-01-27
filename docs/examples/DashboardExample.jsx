// Example: How to update Dashboard component with role-based features

import React, { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { ProtectedContent } from '../components/ProtectedRoute';
import apiClient from '../config/api';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await apiClient.get('/users/me');
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  // Get permissions based on user role
  const permissions = usePermissions(user?.UserRole);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      {/* User Info with Role Badge */}
      <div className="user-info">
        <h2>Welcome, {user?.name}</h2>
        <span className={`badge ${permissions.getRoleBadgeColor()}`}>
          {permissions.getRoleName()}
        </span>
      </div>

      {/* Admin-only: User Management */}
      <ProtectedContent permission="canManageUsers" userRole={user?.UserRole}>
        <div className="admin-section">
          <h3>User Management</h3>
          <button onClick={() => window.location.href = '/users'}>
            Manage Users
          </button>
          <button onClick={() => window.location.href = '/users/new'}>
            Add New User
          </button>
        </div>
      </ProtectedContent>

      {/* Admin-only: Organization Settings */}
      <ProtectedContent permission="canViewOrgSettings" userRole={user?.UserRole}>
        <div className="admin-section">
          <h3>Organization Settings</h3>
          <button onClick={() => window.location.href = '/settings/organization'}>
            Configure Organization
          </button>
        </div>
      </ProtectedContent>

      {/* Admin & Editor: Team Management */}
      {(permissions.isAdmin || permissions.isEditor) && (
        <div className="team-section">
          <h3>Teams</h3>
          {permissions.canCreateTeams && (
            <button onClick={() => window.location.href = '/teams/new'}>
              Create Team
            </button>
          )}
          <button onClick={() => window.location.href = '/teams'}>
            View Teams
          </button>
        </div>
      )}

      {/* Admin-only: Analytics */}
      <ProtectedContent permission="canViewAnalytics" userRole={user?.UserRole}>
        <div className="analytics-section">
          <h3>Analytics & Reports</h3>
          <div className="stats">
            {/* Organization-wide statistics */}
            <div className="stat">Total Users: XX</div>
            <div className="stat">Active Documents: XX</div>
            <div className="stat">Completed Signatures: XX</div>
          </div>
        </div>
      </ProtectedContent>

      {/* All Users: Documents */}
      <div className="documents-section">
        <h3>{permissions.isAdmin ? 'All Documents' : 'My Documents'}</h3>
        <button onClick={() => window.location.href = '/documents'}>
          View Documents
        </button>
        {permissions.canCreateTemplates && (
          <button onClick={() => window.location.href = '/templates/new'}>
            Create Template
          </button>
        )}
      </div>

      {/* All Users: Personal Profile */}
      <div className="profile-section">
        <h3>My Profile</h3>
        <button onClick={() => window.location.href = '/profile'}>
          Edit Profile
        </button>
        <button onClick={() => window.location.href = '/profile/preferences'}>
          Preferences
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
