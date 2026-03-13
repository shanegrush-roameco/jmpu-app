import { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronRight, ChevronLeft, Checkmark, Close, TrashCan, Locked } from '@carbon/icons-react'
import GlobalNav from '../components/GlobalNav'
import { useCurrentProfile } from '../hooks/useProfiles'
import { usePermissions, getRoleDisplayName } from '../hooks/usePermissions'
import { 
  useProfiles, 
  useProfile,
  updateProfile, 
  setProfileStatus, 
  deleteUser,
  updateNotificationPreferences,
  updateAvatar
} from '../hooks/useProfiles'

// Tab configuration
const profileTabs = [
  { id: 'account', label: 'Account Settings' },
  { id: 'company', label: 'Company Settings' },
  { id: 'notifications', label: 'Notifications' },
]

// Status options for dropdown (maps to database values)
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
]

// Role options (maps to user_role enum -- only valid DB values)
const roleOptions = [
  { value: 'admin', label: 'Administrator' },
  { value: 'viewer', label: 'Viewer' },
]

// Profile type options (maps to profile_type column)
const profileTypeOptions = [
  { value: 'jmpu_employee', label: 'JMPU Employee' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'client', label: 'Client' },
]

// Job title options
const jobTitleOptions = [
  'Owner',
  'General Contractor',
  'Project Manager',
  'Project Admin',
  'Electrical Sub',
  'Plumbing Sub',
  'HVAC Sub',
  'Finisher',
  'Designer',
  'Architect',
  'Customer',
]

// Time zone options
const timeZoneOptions = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
]

const timeZoneLabels = {
  'America/Los_Angeles': 'Pacific Time (PT)',
  'America/Denver': 'Mountain Time (MT)',
  'America/Chicago': 'Central Time (CT)',
  'America/New_York': 'Eastern Time (ET)',
}

// Team options
const teamOptions = ['General', 'Admin', 'Field', 'Office']

function Profiles({ user }) {
  // Current user permissions
  const { profile: currentUserProfile } = useCurrentProfile()
  const permissions = usePermissions(currentUserProfile)

  // State
  const [view, setView] = useState('list') // 'list' or 'detail'
  const [activeTab, setActiveTab] = useState('account')
  const [selectedProfileId, setSelectedProfileId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [profileTypeFilter, setProfileTypeFilter] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkApplying, setBulkApplying] = useState(false)
  const itemsPerPage = 13

  // Fetch profiles from Supabase
  const { 
    profiles: allProfiles, 
    loading: profilesLoading, 
    error: profilesError,
    refetch: refetchProfiles 
  } = useProfiles({
    search: searchQuery,
    status: statusFilter || null,
    sortBy: 'full_name',
    sortOrder: 'asc',
  })

  // Local filter by profile_type
  const profiles = profileTypeFilter
    ? allProfiles.filter(p => p.profile_type === profileTypeFilter)
    : allProfiles

  // Fetch selected profile details
  const { 
    profile: selectedProfile, 
    loading: profileLoading,
    refetch: refetchProfile 
  } = useProfile(selectedProfileId)

  // Form state for profile editing
  const [formData, setFormData] = useState({
    // Account Settings
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    job_title: '',
    role: 'viewer',
    profile_type: 'jmpu_employee',
    time_zone: 'America/New_York',
    // Company (read-only, from company relation)
    company_name: '',
    // Notification Preferences
    notification_preferences: {
      project_status_updates: true,
      task_assignments: true,
      draw_submissions: false,
      messages: false,
      email_enabled: true,
      sms_enabled: false,
    },
  })

  // Populate form when selected profile loads
  useEffect(() => {
    if (selectedProfile) {
      setFormData({
        first_name: selectedProfile.first_name || '',
        last_name: selectedProfile.last_name || '',
        phone: selectedProfile.phone || '',
        email: selectedProfile.email || '',
        job_title: selectedProfile.job_title || '',
        role: selectedProfile.role || 'viewer',
        profile_type: selectedProfile.profile_type || 'jmpu_employee',
        time_zone: selectedProfile.time_zone || 'America/New_York',
        company_name: selectedProfile.company?.name || '',
        notification_preferences: {
          project_status_updates: selectedProfile.notification_preferences?.project_status_updates ?? true,
          task_assignments: selectedProfile.notification_preferences?.task_assignments ?? true,
          draw_submissions: selectedProfile.notification_preferences?.draw_submissions ?? false,
          messages: selectedProfile.notification_preferences?.messages ?? false,
          email_enabled: selectedProfile.notification_preferences?.email_enabled ?? true,
          sms_enabled: selectedProfile.notification_preferences?.sms_enabled ?? false,
        },
      })
    }
  }, [selectedProfile])

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (deleteModalOpen) setDeleteModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [deleteModalOpen])

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openStatusDropdown && !e.target.closest('.status-dropdown-container')) {
        setOpenStatusDropdown(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openStatusDropdown])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, profileTypeFilter])

  // Pagination
  const totalPages = Math.ceil(profiles.length / itemsPerPage)
  const paginatedProfiles = profiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleProfileClick = (profile) => {
    setSelectedProfileId(profile.id)
    setActiveTab('account')
    setView('detail')
    setSaveError(null)
    setSaveSuccess(false)
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value,
      },
    }))
  }

  const handleDeleteClick = (e, profile) => {
    e.stopPropagation()
    setProfileToDelete(profile)
    setDeleteModalOpen(true)
    setOpenStatusDropdown(null)
  }

  const handleStatusChange = async (profileId, newStatus) => {
    try {
      await setProfileStatus(profileId, newStatus)
      refetchProfiles()
    } catch (err) {
      console.error('Error updating status:', err)
    }
    setOpenStatusDropdown(null)
  }

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return
    
    try {
      await deleteUser(profileToDelete.id)
      refetchProfiles()
      setDeleteModalOpen(false)
      setProfileToDelete(null)
    } catch (err) {
      console.error('Error deleting user:', err)
    }
  }

  const handleSave = async () => {
    if (!selectedProfileId) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Update profile fields
      await updateProfile(selectedProfileId, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        job_title: formData.job_title,
        role: formData.role,
        profile_type: formData.profile_type,
        time_zone: formData.time_zone,
      })

      // Update notification preferences separately
      await updateNotificationPreferences(selectedProfileId, formData.notification_preferences)

      setSaveSuccess(true)
      refetchProfile()
      refetchProfiles()
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedProfileId) return

    try {
      setSaving(true)
      await updateAvatar(selectedProfileId, file)
      refetchProfile()
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBulkToggle = (profileId) => {
    setBulkSelectedIds(prev => {
      const next = new Set(prev)
      next.has(profileId) ? next.delete(profileId) : next.add(profileId)
      return next
    })
  }

  const handleBulkSelectAll = () => {
    if (bulkSelectedIds.size === paginatedProfiles.length) {
      setBulkSelectedIds(new Set())
    } else {
      setBulkSelectedIds(new Set(paginatedProfiles.map(p => p.id)))
    }
  }

  const handleBulkApply = async () => {
    if (!bulkStatus || bulkSelectedIds.size === 0) return
    setBulkApplying(true)
    try {
      await Promise.all(
        [...bulkSelectedIds].map(id => setProfileStatus(id, bulkStatus))
      )
      refetchProfiles()
      setBulkSelectedIds(new Set())
      setBulkStatus('')
      setBulkEditMode(false)
    } catch (err) {
      console.error('Bulk status update failed:', err)
    } finally {
      setBulkApplying(false)
    }
  }

  const handleBulkCancel = () => {
    setBulkEditMode(false)
    setBulkSelectedIds(new Set())
    setBulkStatus('')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#22C55E'
      case 'inactive':
        return '#6B7280'
      case 'suspended':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  const getStatusLabel = (status) => {
    return statusOptions.find(s => s.value === status)?.label || status
  }

  const getProfileTypeLabel = (type) => {
    return profileTypeOptions.find(t => t.value === type)?.label || type || 'JMPU Employee'
  }

  const getInitials = (profile) => {
    const first = profile.first_name?.[0] || ''
    const last = profile.last_name?.[0] || ''
    return (first + last).toUpperCase() || '?'
  }

  // Permission check - redirect if not allowed
  if (!permissions.canViewProfiles) {
    return (
      <GlobalNav user={user} activeNav="profiles">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view profiles.</p>
          </div>
        </div>
      </GlobalNav>
    )
  }

  return (
    <GlobalNav user={user} activeNav="profiles">
      {view === 'list' ? (
        <>
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
              Profiles
            </h2>

            {/* Add Profile Button - Desktop */}
            {permissions.canEditProfiles && (
              <button
                className="hidden lg:block px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#1D1D1F' }}
              >
                Add Profile
              </button>
            )}
          </div>

          {/* Add Profile Button - Mobile (full width, above card) */}
          {permissions.canEditProfiles && (
            <button
              className="lg:hidden w-full mb-4 px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#1D1D1F' }}
            >
              Add Profile
            </button>
          )}

          {/* Profile Management Card */}
          <div
            className="bg-white p-6"
            style={{
              borderRadius: '16px',
              boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          >
            <h3 className="text-base font-semibold mb-4" style={{ color: '#1D1D1F' }}>
              Profile Management
            </h3>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-3 mb-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, or job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Status Filter */}
              <div className="relative lg:w-32">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Profile Type Filter */}
              <div className="relative lg:w-44">
                <select
                  value={profileTypeFilter}
                  onChange={(e) => setProfileTypeFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All Types</option>
                  {profileTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Bulk Edit Button */}
              {permissions.canEditProfiles && (
                <button
                  onClick={() => bulkEditMode ? handleBulkCancel() : setBulkEditMode(true)}
                  className="px-5 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
                  style={{ color: '#111111', border: '1px solid #111111' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#111111'
                    e.currentTarget.style.color = '#FFFFFF'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#111111'
                  }}
                >
                  {bulkEditMode ? 'Cancel' : 'Bulk Edit'}
                </button>
              )}
            </div>

            {/* Loading State */}
            {profilesLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}

            {/* Error State */}
            {profilesError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-600">Error loading profiles: {profilesError}</p>
              </div>
            )}

            {/* Empty State */}
            {!profilesLoading && !profilesError && profiles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No profiles found</p>
              </div>
            )}

            {/* Bulk Action Bar */}
            {bulkEditMode && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600 min-w-[80px]">
                  {bulkSelectedIds.size} selected
                </span>
                <div className="relative">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">Set status...</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={handleBulkApply}
                  disabled={!bulkStatus || bulkSelectedIds.size === 0 || bulkApplying}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  {bulkApplying ? 'Applying...' : 'Apply'}
                </button>
              </div>
            )}

            {/* Desktop Table */}
            {!profilesLoading && profiles.length > 0 && (
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {bulkEditMode && (
                        <th className="text-left py-3 w-8">
                          <input
                            type="checkbox"
                            checked={bulkSelectedIds.size === paginatedProfiles.length && paginatedProfiles.length > 0}
                            onChange={handleBulkSelectAll}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedProfiles.map((profile) => (
                      <tr
                        key={profile.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => bulkEditMode ? handleBulkToggle(profile.id) : handleProfileClick(profile)}
                      >
                        {bulkEditMode && (
                          <td className="py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={bulkSelectedIds.has(profile.id)}
                              onChange={() => handleBulkToggle(profile.id)}
                              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="py-4">
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium overflow-hidden">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={profile.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitials(profile)
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-medium underline"
                              style={{ color: '#1D1D1F' }}
                            >
                              {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                            </span>
                            <ChevronRight size={16} className="text-gray-400" />
                          </div>
                          <span className="text-xs text-gray-500">{profile.email}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-gray-600">{profile.company?.name || '—'}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-sm text-gray-600">{getRoleDisplayName(profile.role)}</span>
                          {profile.profile_type && (
                            <span className="block text-xs text-gray-400">{getProfileTypeLabel(profile.profile_type)}</span>
                          )}
                          {profile.job_title && (
                            <span className="block text-xs text-gray-400">{profile.job_title}</span>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="status-dropdown-container relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (permissions.canEditProfiles) {
                                  setOpenStatusDropdown(openStatusDropdown === profile.id ? null : profile.id)
                                }
                              }}
                              className="flex items-center gap-1.5 text-sm"
                              style={{ color: getStatusColor(profile.status) }}
                              disabled={!permissions.canEditProfiles}
                            >
                              {getStatusLabel(profile.status)}
                              {permissions.canEditProfiles && <ChevronDown size={16} />}
                            </button>

                            {/* Status Dropdown */}
                            {openStatusDropdown === profile.id && permissions.canEditProfiles && (
                              <div
                                className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {statusOptions.map((status) => (
                                  <button
                                    key={status.value}
                                    onClick={() => handleStatusChange(profile.id, status.value)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                                    style={{ color: getStatusColor(status.value) }}
                                  >
                                    {status.label}
                                    {profile.status === status.value && (
                                      <Checkmark size={16} />
                                    )}
                                  </button>
                                ))}
                                {permissions.canDeleteProfiles && (
                                  <div className="border-t border-gray-100">
                                    <button
                                      onClick={(e) => handleDeleteClick(e, profile)}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                      style={{ color: '#EF4444' }}
                                    >
                                      Delete User
                                      <TrashCan size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile List */}
            {!profilesLoading && profiles.length > 0 && (
              <div className="lg:hidden divide-y divide-gray-100">
                {paginatedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => handleProfileClick(profile)}
                    className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium flex-shrink-0 overflow-hidden">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(profile)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#1D1D1F' }}>
                          {profile.full_name || `${profile.first_name} ${profile.last_name}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{profile.company?.name || '—'}</p>
                        <p className="text-xs text-gray-400 truncate">{getProfileTypeLabel(profile.profile_type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{
                          color: getStatusColor(profile.status),
                          backgroundColor: `${getStatusColor(profile.status)}15`,
                        }}
                      >
                        {getStatusLabel(profile.status)}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, profiles.length)} of {profiles.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Back Button */}
          <button
            onClick={() => {
              setView('list')
              setSelectedProfileId(null)
            }}
            className="flex items-center gap-1 text-sm mb-4 hover:underline"
            style={{ color: '#1D1D1F' }}
          >
            <ChevronLeft size={16} />
            Back to Profiles
          </button>

          {/* Loading State */}
          {profileLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}

          {/* Profile Detail View */}
          {!profileLoading && selectedProfile && (
            <div className="mb-6">
              {/* Desktop Tabs */}
              <div className="hidden lg:flex items-end gap-2">
                {profileTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="text-base whitespace-nowrap transition-all"
                    style={{
                      padding: activeTab === tab.id ? '16px 40px 8px 40px' : '8px 40px 8px 40px',
                      borderRadius: '8px 8px 0 0',
                      backgroundColor: '#FFFFFF',
                      borderBottom: activeTab === tab.id ? 'none' : '1px solid #F4F4F4',
                      fontWeight: activeTab === tab.id ? '700' : '400',
                      color: activeTab === tab.id ? '#1D1D1F' : '#808080'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Container */}
              <div
                className="bg-white rounded-2xl lg:rounded-none lg:rounded-tr-2xl lg:rounded-br-2xl lg:rounded-bl-2xl p-6"
                style={{
                  boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Mobile Tab Dropdown */}
                <div className="lg:hidden mb-6">
                  <div className="relative">
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {profileTabs.map((tab) => (
                        <option key={tab.id} value={tab.id}>{tab.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Tab Title */}
                <h3 className="hidden lg:block text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                  {profileTabs.find(t => t.id === activeTab)?.label}
                </h3>

                {/* Profile Header with Avatar */}
                <div className="mb-6">
                  <h4 className="text-base font-semibold mb-3" style={{ color: '#1D1D1F' }}>
                    {selectedProfile.full_name || `${formData.first_name} ${formData.last_name}`}
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium overflow-hidden">
                      {selectedProfile.avatar_url ? (
                        <img
                          src={selectedProfile.avatar_url}
                          alt={selectedProfile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(selectedProfile)
                      )}
                    </div>
                    {permissions.canEditProfiles && (
                      <label className="text-sm underline cursor-pointer" style={{ color: '#1D1D1F' }}>
                        Edit Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Account Settings Tab */}
                {activeTab === 'account' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Personal Information */}
                    <div className="lg:col-span-2">
                      <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                        Personal Information
                      </h5>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">First Name</label>
                          <input
                            type="text"
                            value={formData.first_name}
                            onChange={(e) => handleFormChange('first_name', e.target.value)}
                            disabled={!permissions.canEditProfiles}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          />
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={formData.last_name}
                            onChange={(e) => handleFormChange('last_name', e.target.value)}
                            disabled={!permissions.canEditProfiles}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          />
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleFormChange('phone', e.target.value)}
                            disabled={!permissions.canEditProfiles}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          />
                        </div>

                        {/* Email (read-only) */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Email</label>
                          <div className="relative">
                            <input
                              type="email"
                              value={formData.email}
                              disabled
                              className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm bg-gray-50"
                            />
                            <Locked size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>

                        {/* Job Title */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Job Title</label>
                          <div className="relative">
                            <select
                              value={formData.job_title}
                              onChange={(e) => handleFormChange('job_title', e.target.value)}
                              disabled={!permissions.canEditProfiles}
                              className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Select job title</option>
                              {jobTitleOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Role */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">System Role</label>
                          <div className="relative">
                            <select
                              value={formData.role}
                              onChange={(e) => handleFormChange('role', e.target.value)}
                              disabled={!permissions.canEditProfiles}
                              className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                            >
                              {roleOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Profile Type */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Profile Type</label>
                          <div className="relative">
                            <select
                              value={formData.profile_type}
                              onChange={(e) => handleFormChange('profile_type', e.target.value)}
                              disabled={!permissions.canEditProfiles}
                              className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                            >
                              {profileTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Time Zone */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Time Zone</label>
                          <div className="relative">
                            <select
                              value={formData.time_zone}
                              onChange={(e) => handleFormChange('time_zone', e.target.value)}
                              disabled={!permissions.canEditProfiles}
                              className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                            >
                              {timeZoneOptions.map(option => (
                                <option key={option} value={option}>{timeZoneLabels[option]}</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Card */}
                    <div>
                      <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                        Account Status
                      </h5>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Status</span>
                          <span
                            className="text-sm font-medium"
                            style={{ color: getStatusColor(selectedProfile.status) }}
                          >
                            {getStatusLabel(selectedProfile.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Last Login</span>
                          <span className="text-sm text-gray-900">
                            {selectedProfile.last_login_at
                              ? new Date(selectedProfile.last_login_at).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Created</span>
                          <span className="text-sm text-gray-900">
                            {new Date(selectedProfile.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Company Settings Tab */}
                {activeTab === 'company' && (
                  <div>
                    <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                      Company Information
                    </h5>
                    {selectedProfile.company ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Company Name</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={selectedProfile.company.name || ''}
                              disabled
                              className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm bg-gray-50"
                            />
                            <Locked size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        {selectedProfile.company.phone && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Company Phone</label>
                            <input
                              type="text"
                              value={selectedProfile.company.phone}
                              disabled
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                            />
                          </div>
                        )}
                        {selectedProfile.company.address && (
                          <div className="lg:col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">Address</label>
                            <input
                              type="text"
                              value={selectedProfile.company.address}
                              disabled
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No company assigned to this profile.</p>
                    )}
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Notification Types */}
                    <div>
                      <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                        Notifications
                      </h5>
                      <div className="space-y-3">
                        {[
                          { key: 'project_status_updates', label: 'Project Status Updates' },
                          { key: 'task_assignments', label: 'Tasks and Assignments' },
                          { key: 'draw_submissions', label: 'Draw Submissions' },
                          { key: 'messages', label: 'Messages' },
                        ].map(notification => (
                          <label key={notification.key} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.notification_preferences[notification.key]}
                              onChange={(e) => handleNotificationChange(notification.key, e.target.checked)}
                              disabled={!permissions.canEditProfiles}
                              className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className="text-sm" style={{ color: '#374151' }}>{notification.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Format */}
                    <div>
                      <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                        Delivery Format
                      </h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notification_preferences.email_enabled}
                            onChange={(e) => handleNotificationChange('email_enabled', e.target.checked)}
                            disabled={!permissions.canEditProfiles}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-sm" style={{ color: '#374151' }}>Email</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.notification_preferences.sms_enabled}
                            onChange={(e) => handleNotificationChange('sms_enabled', e.target.checked)}
                            disabled={!permissions.canEditProfiles}
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-sm" style={{ color: '#374151' }}>Text Message</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {saveError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{saveError}</p>
                  </div>
                )}

                {/* Success Message */}
                {saveSuccess && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">Profile saved successfully!</p>
                  </div>
                )}

                {/* Action Buttons */}
                {permissions.canEditProfiles && (
                  <div className="flex flex-col-reverse lg:flex-row justify-end gap-3 mt-8">
                    <button
                      onClick={() => {
                        setView('list')
                        setSelectedProfileId(null)
                      }}
                      className="w-full lg:w-auto px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
                      style={{ color: '#111111', border: '1px solid #111111' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#111111'
                        e.currentTarget.style.color = '#FFFFFF'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#111111'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full lg:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50"
                      style={{ backgroundColor: '#1D1D1F' }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDeleteModalOpen(false)}
          />

          {/* Modal */}
          <div
            className="relative bg-white w-full max-w-md p-6"
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Close size={20} className="text-gray-500" />
            </button>

            {/* Title */}
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#1D1D1F' }}>
              Confirm Deletion
            </h3>

            {/* Message */}
            <p className="text-sm mb-2" style={{ color: '#374151' }}>
              Are you sure you want to delete {profileToDelete?.full_name || `${profileToDelete?.first_name} ${profileToDelete?.last_name}`}'s profile?
            </p>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              This action cannot be undone.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse lg:flex-row gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#111111', border: '1px solid #111111' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#111111'
                  e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#111111'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#EF4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </GlobalNav>
  )
}

export default Profiles
