import { useState, useEffect } from 'react'
import GlobalNav from '../components/GlobalNav'

// Mock profile data based on Figma design
const profilesData = [
  { id: 1, name: 'Tyler Farrell', company: 'Killowen Construction', role: 'General Contractor', status: 'Active', avatar: 'TF', email: 'tfarrell@killowen.com', phone: '999-99-9999', firstName: 'Tyler', lastName: 'Farrell', jobTitle: 'General Contractor', timeZone: 'Pacific Time PST' },
  { id: 2, name: 'Derek Bjornson', company: 'Lights N Switches', role: 'Electrical Sub', status: 'Active', avatar: 'DB', email: 'derek@lightnswitches.com', phone: '555-12-3456', firstName: 'Derek', lastName: 'Bjornson', jobTitle: 'Electrical Sub', timeZone: 'Mountain Time MST' },
  { id: 3, name: 'Rachel Cruz', company: 'Devlin Electrical', role: 'Electrical Sub', status: 'Suspended', avatar: 'RC', email: 'rachel@devlin.com', phone: '555-23-4567', firstName: 'Rachel', lastName: 'Cruz', jobTitle: 'Electrical Sub', timeZone: 'Pacific Time PST' },
  { id: 4, name: 'Shawn Ryan', company: 'Freddie Mac', role: 'Customer', status: 'Active', avatar: 'SR', email: 'shawn.ryan@freddiemac.com', phone: '555-34-5678', firstName: 'Shawn', lastName: 'Ryan', jobTitle: 'Customer', timeZone: 'Eastern Time EST' },
  { id: 5, name: 'Tina Nguyen', company: 'Hotshot HVAC', role: 'HVAC Sub', status: 'Active', avatar: 'TN', email: 'tina@hotshothvac.com', phone: '555-45-6789', firstName: 'Tina', lastName: 'Nguyen', jobTitle: 'HVAC Sub', timeZone: 'Pacific Time PST' },
  { id: 6, name: 'Omar Patel', company: 'Plasterman', role: 'Finisher', status: 'Inactive', avatar: 'OP', email: 'omar@plasterman.com', phone: '555-56-7890', firstName: 'Omar', lastName: 'Patel', jobTitle: 'Finisher', timeZone: 'Central Time CST' },
  { id: 7, name: 'Kyle Henderson', company: 'Devlin Electrical', role: 'Electrical Sub', status: 'Active', avatar: 'KH', email: 'kyle@devlin.com', phone: '555-67-8901', firstName: 'Kyle', lastName: 'Henderson', jobTitle: 'Electrical Sub', timeZone: 'Pacific Time PST' },
  { id: 8, name: 'Sophia Lane', company: 'Junk Monkey Pickup', role: 'Project Admin', status: 'Active', avatar: 'SL', email: 'sophia@jmpu.com', phone: '555-78-9012', firstName: 'Sophia', lastName: 'Lane', jobTitle: 'Project Admin', timeZone: 'Mountain Time MST' },
  { id: 9, name: 'Marcus Tillman', company: 'Davison Plumbing', role: 'Plumbing Sub', status: 'Active', avatar: 'MT', email: 'marcus@davisonplumbing.com', phone: '555-89-0123', firstName: 'Marcus', lastName: 'Tillman', jobTitle: 'Plumbing Sub', timeZone: 'Pacific Time PST' },
  { id: 10, name: 'Elise Romero', company: 'Project Charlie', role: 'Architect', status: 'Suspended', avatar: 'ER', email: 'elise@projectcharlie.com', phone: '555-90-1234', firstName: 'Elise', lastName: 'Romero', jobTitle: 'Architect', timeZone: 'Pacific Time PST' },
  { id: 11, name: 'Drew Kessler', company: 'Delta Alpha', role: 'Project Manager', status: 'Active', avatar: 'DK', email: 'drew@deltaalpha.com', phone: '555-01-2345', firstName: 'Drew', lastName: 'Kessler', jobTitle: 'Project Manager', timeZone: 'Eastern Time EST' },
  { id: 12, name: 'Hannah Kim', company: 'Foxtrot Interiors', role: 'Designer', status: 'Active', avatar: 'HK', email: 'hannah@foxtrotinteriors.com', phone: '555-12-3456', firstName: 'Hannah', lastName: 'Kim', jobTitle: 'Designer', timeZone: 'Pacific Time PST' },
  { id: 13, name: 'James Whitmore', company: 'Killowen Construction', role: 'General Contractor', status: 'Active', avatar: 'JW', email: 'james@killowen.com', phone: '555-23-4567', firstName: 'James', lastName: 'Whitmore', jobTitle: 'General Contractor', timeZone: 'Mountain Time MST' },
]

// Tab configuration
const profileTabs = [
  { id: 'account', label: 'Account Settings' },
  { id: 'company', label: 'Company Settings' },
  { id: 'notifications', label: 'Notifications' },
]

// Status options for dropdown
const statusOptions = ['Active', 'Inactive', 'Suspended']

// Job title options
const jobTitleOptions = [
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

function Profiles({ user }) {
  const [view, setView] = useState('list') // 'list' or 'detail'
  const [activeTab, setActiveTab] = useState('account')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [openStatusDropdown, setOpenStatusDropdown] = useState(null)
  const itemsPerPage = 13

  // Form state for profile editing
  const [formData, setFormData] = useState({
    // Account Settings
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    jobTitle: '',
    timeZone: '',
    // Permissions
    projectAccess: true,
    taskAccess: true,
    financialAccess: false,
    clientAccess: false,
    jmpAccess: false,
    lockboxCodes: false,
    // Company Settings
    company: '',
    companyAddress: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    einTaxId: '',
    team: 'General',
    // Notifications
    projectStatusUpdates: true,
    tasksAssignments: true,
    drawSubmissions: false,
    messages: false,
    emailFormat: true,
    textFormat: true,
  })

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

  // Filter profiles
  const filteredProfiles = profilesData.filter(profile => {
    const matchesSearch = searchQuery === '' ||
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.role.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'All' || profile.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage)
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleProfileClick = (profile) => {
    setSelectedProfile(profile)
    setFormData({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phoneNumber: profile.phone,
      email: profile.email,
      jobTitle: profile.jobTitle,
      timeZone: profile.timeZone,
      projectAccess: true,
      taskAccess: true,
      financialAccess: false,
      clientAccess: false,
      jmpAccess: false,
      lockboxCodes: false,
      company: profile.company,
      companyAddress: '310 Kingfisher Lane',
      city: 'Denver',
      state: 'Colorado',
      zip: '89678',
      country: 'US',
      companyEmail: '',
      companyPhone: 'XXX-XX-XXXX',
      companyWebsite: 'www.domain.com',
      einTaxId: 'XX-XXXXXXXX',
      team: 'General',
      projectStatusUpdates: true,
      tasksAssignments: true,
      drawSubmissions: false,
      messages: false,
      emailFormat: true,
      textFormat: true,
    })
    setActiveTab('account')
    setView('detail')
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDeleteClick = (e, profile) => {
    e.stopPropagation()
    setProfileToDelete(profile)
    setDeleteModalOpen(true)
    setOpenStatusDropdown(null)
  }

  const handleStatusChange = (profileId, newStatus) => {
    // In real app, this would update the database
    console.log(`Changing profile ${profileId} status to ${newStatus}`)
    setOpenStatusDropdown(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return '#22C55E'
      case 'Inactive':
        return '#6B7280'
      case 'Suspended':
        return '#EF4444'
      default:
        return '#6B7280'
    }
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
            <button
              className="hidden lg:block px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#1D1D1F' }}
            >
              Add Profile
            </button>
          </div>

          {/* Add Profile Button - Mobile (full width, above card) */}
          <button
            className="lg:hidden w-full mb-4 px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#1D1D1F' }}
          >
            Add Profile
          </button>

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
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              {/* Status Filter */}
              <div className="relative lg:w-32">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="All">Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Bulk Edit Button */}
              <button
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
                Bulk Edit
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
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
                      onClick={() => handleProfileClick(profile)}
                    >
                      <td className="py-4">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                          {selectedProfile?.id === profile.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium underline"
                            style={{ color: '#1D1D1F' }}
                          >
                            {profile.name}
                          </span>
                          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-gray-600">{profile.company}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-gray-600">{profile.role}</span>
                      </td>
                      <td className="py-4">
                        <div className="status-dropdown-container relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenStatusDropdown(openStatusDropdown === profile.id ? null : profile.id)
                            }}
                            className="flex items-center gap-1.5 text-sm"
                            style={{ color: getStatusColor(profile.status) }}
                          >
                            {profile.status}
                            <ChevronDownIcon className="w-4 h-4" />
                          </button>

                          {/* Status Dropdown */}
                          {openStatusDropdown === profile.id && (
                            <div
                              className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {statusOptions.map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(profile.id, status)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                                  style={{ color: getStatusColor(status) }}
                                >
                                  {status}
                                  {profile.status === status && (
                                    <CheckIcon className="w-4 h-4" />
                                  )}
                                </button>
                              ))}
                              <div className="border-t border-gray-100">
                                <button
                                  onClick={(e) => handleDeleteClick(e, profile)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                  style={{ color: '#EF4444' }}
                                >
                                  Delete User
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="lg:hidden divide-y divide-gray-100">
              {paginatedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleProfileClick(profile)}
                  className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 -mx-6 px-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                      {selectedProfile?.id === profile.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className="text-sm font-medium underline" style={{ color: '#1D1D1F' }}>
                      {profile.name}
                    </span>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProfiles.length)} of {filteredProfiles.length}
              </span>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{currentPage}</span>
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">of {totalPages} pages</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Profile Detail View */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('list')}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
                Profiles
              </h2>
            </div>
          </div>

          {/* Tabs Container */}
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
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Tab Title */}
              <h3 className="hidden lg:block text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                {profileTabs.find(t => t.id === activeTab)?.label}
              </h3>

              {/* Profile Header */}
              <div className="mb-6">
                <h4 className="text-base font-semibold mb-3" style={{ color: '#1D1D1F' }}>
                  {selectedProfile?.name}
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                      alt={selectedProfile?.name}
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
                          <option value="89678">89678</option>
                          <option value="80201">80201</option>
                          <option value="80202">80202</option>
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

              {/* Action Buttons */}
              <div className="flex flex-col-reverse lg:flex-row justify-end gap-3 mt-8">
                <button
                  onClick={() => setView('list')}
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
                  onClick={() => {
                    console.log('Saving profile:', formData)
                    setView('list')
                  }}
                  className="w-full lg:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
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
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>

            {/* Title */}
            <h3 className="text-lg font-semibold mb-3" style={{ color: '#1D1D1F' }}>
              Confirm Deletion
            </h3>

            {/* Message */}
            <p className="text-sm mb-2" style={{ color: '#374151' }}>
              Are you sure you want to delete {profileToDelete?.name}'s profile?
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
                onClick={() => {
                  console.log('Deleting profile:', profileToDelete)
                  setDeleteModalOpen(false)
                  setProfileToDelete(null)
                }}
                className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#1D1D1F' }}
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

// Icon Components
function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

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

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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

export default Profiles
