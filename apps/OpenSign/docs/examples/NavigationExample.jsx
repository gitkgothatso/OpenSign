// Example: Role-based Navigation Menu

import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

const Navigation = ({ userRole }) => {
  const permissions = usePermissions(userRole);

  return (
    <nav className="main-navigation">
      <ul>
        {/* Dashboard - All Users */}
        <li>
          <NavLink to="/dashboard">
            <span className="icon">📊</span>
            Dashboard
          </NavLink>
        </li>

        {/* User Management - Admin Only */}
        {permissions.canManageUsers && (
          <li>
            <NavLink to="/users">
              <span className="icon">👥</span>
              Users
              <span className="badge badge-error">Admin</span>
            </NavLink>
          </li>
        )}

        {/* Documents - All Users */}
        <li>
          <NavLink to="/documents">
            <span className="icon">📁</span>
            {permissions.isAdmin ? 'All Documents' : 'My Documents'}
          </NavLink>
        </li>

        {/* Teams - All Users (with different capabilities) */}
        <li>
          <NavLink to="/teams">
            <span className="icon">👥</span>
            Teams
            {!permissions.canManageTeams && (
              <span className="text-xs">(View Only)</span>
            )}
          </NavLink>
        </li>

        {/* Templates - Admin & Editor */}
        {permissions.canCreateTemplates && (
          <li>
            <NavLink to="/templates">
              <span className="icon">✍️</span>
              Templates
            </NavLink>
          </li>
        )}

        {/* Organization Settings - Admin Only */}
        {permissions.canViewOrgSettings && (
          <li>
            <NavLink to="/settings/organization">
              <span className="icon">⚙️</span>
              Organization Settings
              <span className="badge badge-error">Admin</span>
            </NavLink>
          </li>
        )}

        {/* Analytics - Admin Only */}
        {permissions.canViewAnalytics && (
          <li>
            <NavLink to="/analytics">
              <span className="icon">📈</span>
              Analytics
              <span className="badge badge-error">Admin</span>
            </NavLink>
          </li>
        )}

        {/* Contacts - All Users */}
        <li>
          <NavLink to="/contacts">
            <span className="icon">📧</span>
            {permissions.canManageOrgContacts ? 'All Contacts' : 'My Contacts'}
          </NavLink>
        </li>

        {/* Profile - All Users */}
        <li>
          <NavLink to="/profile">
            <span className="icon">👤</span>
            Profile
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
