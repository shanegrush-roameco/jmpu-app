import { useState, useEffect } from 'react'
import GlobalNav from '../components/GlobalNav'

// Tab configuration (same as Profiles detail)
const settingsTabs = [
  { id: 'account', label: 'Account Settings' },
  { id: 'company', label: 'Company Settings' },
  { id: 'notifications', label: 'Notifications' },
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
  'Pacific Time PST',
  'Mountain Time MST',
  'Central Time CST',
  'Eastern Time EST',
]

// Team options
const teamOptions = ['General', 'Admin', 'Field', 'Office']

function Settings({ user }) {
  const [activeTab, setActiveTab] = useState('account')
  const [saveMessage, setSaveMessage] = useState('')

  // Form state pre-populated with logged-in user's data
  // In production, this would come from user profile in database
  const [formData, setFormData] = useState({
    // Account Settings
    firstName: 'Jake',
    lastName: 'Vandervennet',
    phoneNumber: '999-99-9999',
    email: 'jacobv@junkmonkeypickup.com',
    jobTitle: 'Owner',
    timeZone: 'Eastern Time EST',
    // Permissions (read-only display for user, all enabled for Owner)
    projectAccess: true,
    taskAccess: true,
    financialAccess: true,
    clientAccess: true,
    jmpAccess: true,
    lockboxCodes: true,
    // Company Settings
    company: 'Junk Monkey Pickup',
    companyAddress: '1247 Construction Way',
    city: 'Denver',
    state: 'Colorado',
    zip: '80202',
    country: 'US',
    companyEmail: 'info@junkmonkeypickup.com',
    companyPhone: 'XXX-XX-XXXX',
    companyWebsite: 'www.junkmonkeypickup.com',
    einTaxId: 'XX-XXXXXXXX',
    team: 'Admin',
    // Notifications
    projectStatusUpdates: true,
    tasksAssignments: true,
    drawSubmissions: true,
    messages: true,
    emailFormat: true,
    textFormat: true,
  })

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    console.log('Saving settings:', formData)
    setSaveMessage('Settings saved successfully!')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const handleCancel = () => {
    // Reset to original values - in production would refetch from DB
    console.log('Cancelling changes')
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
              {formData.firstName} {formData.lastName}
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                  alt={`${formData.firstName} ${formData.lastName}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="text-sm underline" style={{ color: '#1D1D1F' }}>
                Edit Photo
              </button>
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
                      value={formData.firstName}
                      onChange={(e) => handleFormChange('firstName', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Job Title */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Job Title</label>
                    <div className="relative">
                      <select
                        value={formData.jobTitle}
                        onChange={(e) => handleFormChange('jobTitle', e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {jobTitleOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleFormChange('lastName', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Time Zone */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time Zone</label>
                    <div className="relative">
                      <select
                        value={formData.timeZone}
                        onChange={(e) => handleFormChange('timeZone', e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {timeZoneOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phoneNumber}
                      onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Spacer for grid alignment on desktop */}
                  <div className="hidden lg:block"></div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                  Permissions
                </h5>
                <div className="space-y-3">
                  {[
                    { key: 'projectAccess', label: 'Project Access' },
                    { key: 'taskAccess', label: 'Task Access' },
                    { key: 'financialAccess', label: 'Financial Access' },
                    { key: 'clientAccess', label: 'Client Access' },
                    { key: 'jmpAccess', label: 'JMP Access' },
                    { key: 'lockboxCodes', label: 'Lockbox Codes' },
                  ].map(permission => (
                    <label key={permission.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[permission.key]}
                        onChange={(e) => handleFormChange(permission.key, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                      />
                      <span className="text-sm" style={{ color: '#374151' }}>{permission.label}</span>
                    </label>
                  ))}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Company */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleFormChange('company', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Company Email */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Company Email</label>
                  <input
                    type="email"
                    value={formData.companyEmail}
                    onChange={(e) => handleFormChange('companyEmail', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Company Address */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Company Address</label>
                  <input
                    type="text"
                    value={formData.companyAddress}
                    onChange={(e) => handleFormChange('companyAddress', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Company Phone */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Company Phone</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.companyPhone}
                      onChange={(e) => handleFormChange('companyPhone', e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <EyeOffIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer" />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">City</label>
                  <div className="relative">
                    <select
                      value={formData.city}
                      onChange={(e) => handleFormChange('city', e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Denver">Denver</option>
                      <option value="Boulder">Boulder</option>
                      <option value="Aurora">Aurora</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Company Website */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Company Website</label>
                  <input
                    type="text"
                    value={formData.companyWebsite}
                    onChange={(e) => handleFormChange('companyWebsite', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State</label>
                  <div className="relative">
                    <select
                      value={formData.state}
                      onChange={(e) => handleFormChange('state', e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="Colorado">Colorado</option>
                      <option value="Utah">Utah</option>
                      <option value="Wyoming">Wyoming</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* EIN or Tax ID */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">EIN or Tax ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.einTaxId}
                      onChange={(e) => handleFormChange('einTaxId', e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <LockIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Zip */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Zip</label>
                  <div className="relative">
                    <select
                      value={formData.zip}
                      onChange={(e) => handleFormChange('zip', e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="80202">80202</option>
                      <option value="80201">80201</option>
                      <option value="89678">89678</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Team */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Team</label>
                  <div className="relative">
                    <select
                      value={formData.team}
                      onChange={(e) => handleFormChange('team', e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {teamOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Country</label>
                  <div className="relative">
                    <select
                      value={formData.country}
                      onChange={(e) => handleFormChange('country', e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="US">US</option>
                      <option value="CA">Canada</option>
                      <option value="MX">Mexico</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
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
                    { key: 'projectStatusUpdates', label: 'Project Status Updates' },
                    { key: 'tasksAssignments', label: 'Tasks & Assignments' },
                    { key: 'drawSubmissions', label: 'Draw Submissions' },
                    { key: 'messages', label: 'Messages' },
                  ].map(notification => (
                    <label key={notification.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[notification.key]}
                        onChange={(e) => handleFormChange(notification.key, e.target.checked)}
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
                  Format
                </h5>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.emailFormat}
                      onChange={(e) => handleFormChange('emailFormat', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                    />
                    <span className="text-sm" style={{ color: '#374151' }}>Email</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.textFormat}
                      onChange={(e) => handleFormChange('textFormat', e.target.checked)}
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

          {/* Success Message */}
          {saveMessage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">{saveMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse lg:flex-row justify-end gap-3 mt-8">
            <button
              onClick={handleCancel}
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
              className="w-full lg:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#1D1D1F' }}
            >
              Save
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

function EyeOffIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
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
