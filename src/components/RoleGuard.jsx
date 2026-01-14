// src/components/RoleGuard.jsx
// Sprint 9: Protects routes and components based on user permissions
// Renders children only if user has required permission(s)
// ============================================================================

import { Navigate } from 'react-router-dom'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { usePermissions } from '../hooks/usePermissions'

/**
 * RoleGuard - Protects content based on user permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string|string[]} props.require - Permission(s) required to view content
 * @param {boolean} props.requireAll - If true, ALL permissions must be met (default: false = ANY)
 * @param {string} props.redirectTo - Where to redirect if unauthorized (default: '/dashboard')
 * @param {React.ReactNode} props.fallback - Optional content to show while loading
 * @param {React.ReactNode} props.unauthorized - Optional content to show if unauthorized (instead of redirect)
 * 
 * @example
 * // Single permission
 * <RoleGuard require="canViewProfiles">
 *   <ProfilesPage />
 * </RoleGuard>
 * 
 * @example
 * // Multiple permissions (ANY)
 * <RoleGuard require={['canViewProfiles', 'canEditProfiles']}>
 *   <AdminSection />
 * </RoleGuard>
 * 
 * @example
 * // Multiple permissions (ALL required)
 * <RoleGuard require={['canViewProfiles', 'canEditProfiles']} requireAll>
 *   <AdminSection />
 * </RoleGuard>
 * 
 * @example
 * // With custom unauthorized view
 * <RoleGuard require="isAdmin" unauthorized={<AccessDenied />}>
 *   <AdminPanel />
 * </RoleGuard>
 */
function RoleGuard({
  children,
  require,
  requireAll = false,
  redirectTo = '/dashboard',
  fallback = null,
  unauthorized = null,
}) {
  const { profile, loading, error } = useCurrentProfile()
  const permissions = usePermissions(profile)

  // Show loading state
  if (loading) {
    return fallback || <LoadingSpinner />
  }

  // Handle error state
  if (error) {
    console.error('RoleGuard: Error loading profile:', error)
    return <Navigate to="/login" replace />
  }

  // No profile means not properly authenticated
  if (!profile) {
    console.warn('RoleGuard: No profile found, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // Check permissions
  const requiredPermissions = Array.isArray(require) ? require : [require]
  
  let isAuthorized = false
  
  if (requireAll) {
    // ALL permissions must be true
    isAuthorized = requiredPermissions.every(perm => permissions[perm] === true)
  } else {
    // ANY permission being true is sufficient
    isAuthorized = requiredPermissions.some(perm => permissions[perm] === true)
  }

  if (!isAuthorized) {
    // If custom unauthorized content provided, show it
    if (unauthorized) {
      return unauthorized
    }
    // Otherwise redirect
    return <Navigate to={redirectTo} replace />
  }

  // Authorized - render children
  return children
}

/**
 * Simple loading spinner for the guard
 */
function LoadingSpinner() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#F4F4F4' }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Inline permission check component
 * Shows/hides content based on permission without redirecting
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to conditionally render
 * @param {string|string[]} props.require - Permission(s) required
 * @param {boolean} props.requireAll - If true, ALL permissions must be met
 * @param {Object} props.profile - User profile (passed in to avoid extra hook call)
 * 
 * @example
 * <PermissionCheck require="canCreateProjects" profile={profile}>
 *   <button>New Project</button>
 * </PermissionCheck>
 */
export function PermissionCheck({
  children,
  require,
  requireAll = false,
  profile,
}) {
  const permissions = usePermissions(profile)
  
  if (!profile) return null

  const requiredPermissions = Array.isArray(require) ? require : [require]
  
  let isAuthorized = false
  
  if (requireAll) {
    isAuthorized = requiredPermissions.every(perm => permissions[perm] === true)
  } else {
    isAuthorized = requiredPermissions.some(perm => permissions[perm] === true)
  }

  if (!isAuthorized) return null

  return children
}

/**
 * Access Denied component - can be used as unauthorized prop
 */
export function AccessDenied({ message = "You don't have permission to view this page." }) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#F4F4F4' }}
    >
      <div 
        className="bg-white p-8 max-w-md text-center"
        style={{
          borderRadius: '16px',
          boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <LockIcon className="w-6 h-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: '#1D1D1F' }}>
          Access Denied
        </h2>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#1D1D1F' }}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

export default RoleGuard
