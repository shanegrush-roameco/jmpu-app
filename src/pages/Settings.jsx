import { useState, useEffect } from 'react'
import GlobalNav from '../components/GlobalNav'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { 
  updateCurrentProfile, 
  updateNotificationPreferences,
  updateAvatar 
} from '../hooks/useProfiles'
import IntegrationsTab from '../components/IntegrationsTab'

// Tab configuration
const settingsTabs = [
  { id: 'account', label: 'Account Settings' },
  { id: 'company', label: 'Company Settings' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'integrations', label: 'Integrations' },
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

function Settings({ user }) {
  const [activeTab, setActiveTab] = useState('account')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch current user's profile
  const { profile, loading, error, refetch } = useCurrentProfile()

  // Form state
  const [formData, setFormData] = useState({
    // Account Settings
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    job_title: '',
    time_zone: 'America/New_York',
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

  // Original form data for comparison (to detect changes)
  const [originalData, setOriginalData] = useState(null)

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      const data = {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        job_title: profile.job_title || '',
        time_zone: profile.time_zone || 'America/New_York',
        notification_preferences: {
          project_status_updates: profile.notification_preferences?.project_status_updates ?? true,
          task_assignments: profile.notification_preferences?.task_assignments ?? true,
          draw_submissions: profile.notification_preferences?.draw_submissions ?? false,
          messages: profile.notification_preferences?.messages ?? false,
          email_enabled: profile.notification_preferences?.email_enabled ?? true,
          sms_enabled: profile.notification_preferences?.sms_enabled ?? false,
        },
      }
      setFormData(data)
      setOriginalData(JSON.stringify(data))
    }
  }, [profile])

  // Track changes
  useEffect(() => {
    if (originalData) {
      setHasChanges(JSON.stringify(formData) !== originalData)
    }
  }, [formData, originalData])

// Read tab from URL params (for OAuth callback redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && settingsTabs.some(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [])

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

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      // Update profile fields
      await updateCurrentProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        job_title: formData.job_title,
        time_zone: formData.time_zone,
      })

      // Update notification preferences
      await updateNotificationPreferences(profile.id, formData.notification_preferences)

      setSaveSuccess(true)
      setOriginalData(JSON.stringify(formData))
      setHasChanges(false)
      refetch()

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    if (profile) {
      const data = {
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        job_title: profile.job_title || '',
        time_zone: profile.time_zone || 'America/New_York',
        notification_preferences: {
          project_status_updates: profile.notification_preferences?.project_status_updates ?? true,
          task_assignments: profile.notification_preferences?.task_assignments ?? true,
          draw_submissions: profile.notification_preferences?.draw_submissions ?? false,
          messages: profile.notification_preferences?.messages ?? false,
          email_enabled: profile.notification_preferences?.email_enabled ?? true,
          sms_enabled: profile.notification_preferences?.sms_enabled ?? false,
        },
      }
      setFormData(data)
      setHasChanges(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    try {
      setSaving(true)
      setSaveError(null)
      await updateAvatar(profile.id, file)
      refetch()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    const first = formData.first_name?.[0] || ''
    const last = formData.last_name?.[0] || ''
    return (first + last).toUpperCase() || '?'
  }

  // Loading state
  if (loading) {
    return (
      <GlobalNav user={user} activeNav="settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </GlobalNav>
    )
  }

  // Error state
  if (error) {
    return (
      <GlobalNav user={user} activeNav="settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Settings</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800"
            >
              Try Again
            </button>
          </div>
        </div>
      </GlobalNav>
    )
  }

  // No profile state
  if (!profile) {
    return (
      <GlobalNav user={user} activeNav="settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">Your profile hasn't been set up yet. Please contact an administrator.</p>
          </div>
        </div>
      </GlobalNav>
    )
  }

  return (
    <GlobalNav user={user} activeNav="settings">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
          Settings
        </h2>
      </div>

      {/* Tabs Container */}
      <div className="mb-6">
        {/* Desktop Tabs */}
        <div className="hidden lg:flex items-end gap-2">
          {settingsTabs.map((tab) => (
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
                {settingsTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>{tab.label}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Tab Title */}
          <h3 className="hidden lg:block text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
            {settingsTabs.find(t => t.id === activeTab)?.label}
          </h3>

          {/* Profile Header */}
          <div className="mb-6">
            <h4 className="text-base font-semibold mb-3" style={{ color: '#1D1D1F' }}>
              {profile.full_name || `${formData.first_name} ${formData.last_name}`}
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>
              <label className="text-sm underline cursor-pointer" style={{ color: '#1D1D1F' }}>
                Edit Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleFormChange('last_name', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Contact an admin to change your email</p>
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Job Title</label>
                    <div className="relative">
                      <select
                        value={formData.job_title}
                        onChange={(e) => handleFormChange('job_title', e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="">Select job title</option>
                        {jobTitleOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Time Zone */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time Zone</label>
                    <div className="relative">
                      <select
                        value={formData.time_zone}
                        onChange={(e) => handleFormChange('time_zone', e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {timeZoneOptions.map(option => (
                          <option key={option} value={option}>{timeZoneLabels[option]}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Info Card */}
              <div>
                <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                  Account Info
                </h5>
                <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {profile.role?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium capitalize" style={{ 
                      color: profile.status === 'active' ? '#22C55E' : 
                             profile.status === 'suspended' ? '#EF4444' : '#6B7280' 
                    }}>
                      {profile.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Login</span>
                    <span className="text-sm text-gray-900">
                      {profile.last_login_at
                        ? new Date(profile.last_login_at).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                  {profile.company && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Company</span>
                      <span className="text-sm text-gray-900">{profile.company.name}</span>
                    </div>
                  )}
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
              {profile.company ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Company Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={profile.company.name || ''}
                        disabled
                        className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                      <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  {profile.company.phone && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Company Phone</label>
                      <input
                        type="text"
                        value={profile.company.phone}
                        disabled
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  )}
                  {profile.company.email && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Company Email</label>
                      <input
                        type="text"
                        value={profile.company.email}
                        disabled
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  )}
                  {profile.company.website && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Website</label>
                      <input
                        type="text"
                        value={profile.company.website}
                        disabled
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  )}
                  {profile.company.address && (
                    <div className="lg:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Address</label>
                      <input
                        type="text"
                        value={profile.company.address}
                        disabled
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 border border-gray-200 rounded-lg text-center">
                  <p className="text-sm text-gray-500">You are not assigned to a company.</p>
                  <p className="text-xs text-gray-400 mt-1">Contact an administrator to update your company assignment.</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4">
                Company settings are managed by administrators. Contact your admin to make changes.
              </p>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notifications */}
              <div>
                <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                  Notifications
                </h5>
                <div className="space-y-3">
                  {[
                    { key: 'project_status_updates', label: 'Project Status Updates' },
                    { key: 'task_assignments', label: 'Tasks & Assignments' },
                    { key: 'draw_submissions', label: 'Draw Submissions' },
                    { key: 'messages', label: 'Messages' },
                  ].map(notification => (
                    <label key={notification.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notification_preferences[notification.key]}
                        onChange={(e) => handleNotificationChange(notification.key, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
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
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                    />
                    <span className="text-sm" style={{ color: '#374151' }}>Email</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notification_preferences.sms_enabled}
                      onChange={(e) => handleNotificationChange('sms_enabled', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                    />
                    <span className="text-sm" style={{ color: '#374151' }}>Text Message</span>
                  </label>
                  <button className="flex items-center gap-1 text-sm underline mt-2" style={{ color: '#1D1D1F' }}>
                    Send Test Message
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

{/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <IntegrationsTab />
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
              <p className="text-sm text-green-700">Settings saved successfully!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse lg:flex-row justify-end gap-3 mt-8">
            <button
              onClick={handleCancel}
              disabled={!hasChanges || saving}
              className="w-full lg:w-auto px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: '#111111', border: '1px solid #111111' }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#111111'
                  e.currentTarget.style.color = '#FFFFFF'
                }
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
              disabled={!hasChanges || saving}
              className="w-full lg:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1D1D1F' }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </GlobalNav>
  )
}

// Icon Components
function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

export default Settings
