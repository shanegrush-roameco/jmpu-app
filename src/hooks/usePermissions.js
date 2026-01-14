// src/hooks/usePermissions.js
// Sprint 9: Centralizes permission logic based on user role
// Returns boolean flags for what the current user can do
// ============================================================================

import { useMemo } from 'react'

/**
 * Role hierarchy and permissions matrix
 * 
 * Roles (from profiles table user_role enum):
 * - admin: Full access to everything
 * - project_manager: Can manage projects, see assigned projects
 * - contractor: External, sees assigned projects only
 * - client: Customer view, sees their projects only
 * - viewer: Limited access (default for new users)
 */

const ROLE_PERMISSIONS = {
  admin: {
    canViewProfiles: true,
    canEditProfiles: true,
    canDeleteProfiles: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewAllProjects: true,
    canViewFinancials: true,
    canManageDraws: true,
    canViewReports: true,
    canGenerateReports: true,
    canManageSettings: true,
    canViewDashboard: true,
    isAdmin: true,
  },
  project_manager: {
    canViewProfiles: false,
    canEditProfiles: false,
    canDeleteProfiles: false,
    canCreateProjects: true,
    canEditProjects: true, // Only assigned projects (enforced by RLS)
    canDeleteProjects: false,
    canViewAllProjects: false, // Only assigned (enforced by RLS)
    canViewFinancials: true,
    canManageDraws: true,
    canViewReports: true,
    canGenerateReports: true,
    canManageSettings: false,
    canViewDashboard: true,
    isAdmin: false,
  },
  contractor: {
    canViewProfiles: false,
    canEditProfiles: false,
    canDeleteProfiles: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canViewFinancials: false, // Can only see their own payment info
    canManageDraws: false,
    canViewReports: false,
    canGenerateReports: false,
    canManageSettings: false,
    canViewDashboard: true,
    isAdmin: false,
  },
  client: {
    canViewProfiles: false,
    canEditProfiles: false,
    canDeleteProfiles: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canViewFinancials: true, // Their project financials only
    canManageDraws: false,
    canViewReports: true, // Their project reports only
    canGenerateReports: false,
    canManageSettings: false,
    canViewDashboard: true,
    isAdmin: false,
  },
  viewer: {
    canViewProfiles: false,
    canEditProfiles: false,
    canDeleteProfiles: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewAllProjects: false,
    canViewFinancials: false,
    canManageDraws: false,
    canViewReports: false,
    canGenerateReports: false,
    canManageSettings: false,
    canViewDashboard: true,
    isAdmin: false,
  },
}

// Default permissions for unknown roles or when profile is loading
const DEFAULT_PERMISSIONS = {
  canViewProfiles: false,
  canEditProfiles: false,
  canDeleteProfiles: false,
  canCreateProjects: false,
  canEditProjects: false,
  canDeleteProjects: false,
  canViewAllProjects: false,
  canViewFinancials: false,
  canManageDraws: false,
  canViewReports: false,
  canGenerateReports: false,
  canManageSettings: false,
  canViewDashboard: true,
  isAdmin: false,
}

/**
 * Hook to get permission flags based on user's role
 * 
 * @param {Object} profile - The user's profile object from useCurrentProfile
 * @returns {Object} Permission flags (all booleans)
 * 
 * @example
 * const { profile } = useCurrentProfile()
 * const permissions = usePermissions(profile)
 * 
 * if (permissions.canCreateProjects) {
 *   // Show "New Project" button
 * }
 */
export function usePermissions(profile) {
  const permissions = useMemo(() => {
    if (!profile || !profile.role) {
      return DEFAULT_PERMISSIONS
    }

    const rolePermissions = ROLE_PERMISSIONS[profile.role]
    
    if (!rolePermissions) {
      console.warn(`Unknown role: ${profile.role}, using default permissions`)
      return DEFAULT_PERMISSIONS
    }

    return rolePermissions
  }, [profile])

  return permissions
}

/**
 * Helper function to check a specific permission
 * Useful for inline checks without destructuring
 * 
 * @param {Object} profile - The user's profile
 * @param {string} permission - The permission key to check
 * @returns {boolean}
 */
export function hasPermission(profile, permission) {
  if (!profile || !profile.role) {
    return DEFAULT_PERMISSIONS[permission] ?? false
  }

  const rolePermissions = ROLE_PERMISSIONS[profile.role]
  if (!rolePermissions) {
    return DEFAULT_PERMISSIONS[permission] ?? false
  }

  return rolePermissions[permission] ?? false
}

/**
 * Get the role display name
 * 
 * @param {string} role - The role key from database
 * @returns {string} Human-readable role name
 */
export function getRoleDisplayName(role) {
  const displayNames = {
    admin: 'Administrator',
    project_manager: 'Project Manager',
    contractor: 'Contractor',
    client: 'Client',
    viewer: 'Viewer',
  }
  return displayNames[role] || role
}

export default usePermissions
