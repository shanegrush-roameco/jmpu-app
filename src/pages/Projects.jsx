import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import GlobalNav from '../components/GlobalNav'
import DatePicker from '../components/DatePicker'

// Status configuration with colors
const statusConfig = {
  'Active': { color: '#22C55E', bgColor: '#DCFCE7', textColor: '#166534' },
  'Scheduling': { color: '#6B7280', bgColor: '#F3F4F6', textColor: '#374151' },
  'Work in Progress': { color: '#6B7280', bgColor: '#F3F4F6', textColor: '#374151' },
  'Pending Approval': { color: '#6B7280', bgColor: '#F3F4F6', textColor: '#374151' },
  'Pending Broker Signoff': { color: '#6B7280', bgColor: '#F3F4F6', textColor: '#374151' },
  'Invoices': { color: '#6B7280', bgColor: '#F3F4F6', textColor: '#374151' },
  'At Risk': { color: '#EF4444', bgColor: '#FEE2E2', textColor: '#DC2626' },
}

// Mock project data based on Figma
const projectsData = [
  { id: 1, name: 'Project Alpha', address: '1452 Juniper Ridge Rd, Ogden, UT', status: 'Active', dueDate: '05/12/2025', manager: 'J. Vandervennet', avatar: 'JV' },
  { id: 2, name: 'Project Bravo', address: '1552 Juniper Ridge Rd, Ogden, UT', status: 'Scheduling', dueDate: '05/14/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 3, name: 'Project Charlie', address: '1652 Juniper Ridge Rd, Ogden, UT', status: 'Active', dueDate: '05/16/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 4, name: 'Project Delta', address: '1752 Juniper Ridge Rd, Ogden, UT', status: 'Pending Broker Signoff', dueDate: '05/10/2025', manager: 'J. Vandervennet', avatar: 'JV' },
  { id: 5, name: 'Project Echo', address: '1852 Juniper Ridge Rd, Ogden, UT', status: 'Invoices', dueDate: '05/08/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 6, name: 'Project Foxtrot', address: '1952 Juniper Ridge Rd, Ogden, UT', status: 'At Risk', dueDate: '05/11/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 7, name: 'Project Gamma', address: '1232 Juniper Ridge Rd, Ogden, UT', status: 'Pending Approval', dueDate: '05/20/2025', manager: 'J. Vandervennet', avatar: 'JV' },
  { id: 8, name: 'Project Hotel', address: '1342 Juniper Ridge Rd, Ogden, UT', status: 'Scheduling', dueDate: '05/13/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 9, name: 'Project Indigo', address: '325 N St. George, Ogden, UT', status: 'Work in Progress', dueDate: '05/15/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 10, name: 'Project Juliet', address: '67 Ridge Way, Layton, UT', status: 'Active', dueDate: '05/19/2025', manager: 'M. Thillman', avatar: 'MT' },
  { id: 11, name: 'Project Kilo', address: '488 South Main St, Moab, UT', status: 'Scheduling', dueDate: '05/18/2025', manager: 'S. Ramirez', avatar: 'SR' },
  { id: 12, name: 'Project Lima', address: '92 W 100 S, Provo, UT', status: 'Pending Approval', dueDate: '05/21/2025', manager: 'T. Nguyen', avatar: 'TN' },
  { id: 13, name: 'Project Mango', address: '821 Orchard Rd, Logan, UT', status: 'Invoices', dueDate: '05/09/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 14, name: 'Project Neptune', address: '2209 W 6200 S, Taylorsville, UT', status: 'Work in Progress', dueDate: '05/22/2025', manager: 'M. Tillman', avatar: 'MT' },
  { id: 15, name: 'Project Omega', address: '14 Oak Canyon Ln, Draper, UT', status: 'At Risk', dueDate: '05/11/2025', manager: 'J. Vandervennet', avatar: 'JV' },
  { id: 16, name: 'Project Pluto', address: '159 Birch Hollow Dr, Sandy, UT', status: 'Active', dueDate: '05/16/2025', manager: 'B. Ramirez', avatar: 'BR' },
  { id: 17, name: 'Project Quartz', address: '421 Main St, Heber City, UT', status: 'Pending Broker Signoff', dueDate: '05/16/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 18, name: 'Project Redwood', address: '93 Canyon Crest Dr, Logan, UT', status: 'Invoices', dueDate: '05/17/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 19, name: 'Project Sierra', address: '211 E 500 N, Orem, UT', status: 'Scheduling', dueDate: '05/14/2025', manager: 'J. O\'Berry', avatar: 'JO' },
  { id: 20, name: 'Project Titan', address: '707 Aspen Way, Park City, UT', status: 'Pending Approval', dueDate: '05/20/2025', manager: 'J. Vandervennet', avatar: 'JV' },
  { id: 21, name: 'Project Unity', address: '880 Meadow View Ln, Lehi, UT', status: 'Work in Progress', dueDate: '05/22/2025', manager: 'M. Tilman', avatar: 'MT' },
  { id: 22, name: 'Project Vista', address: '1100 E 2100 S, Salt Lake City, UT', status: 'Active', dueDate: '05/25/2025', manager: 'B. Ramirez', avatar: 'BR' },
  { id: 23, name: 'Project Willow', address: '640 Pioneer Rd, St. George, UT', status: 'Scheduling', dueDate: '05/26/2025', manager: 'T. Nguyen', avatar: 'TN' },
  { id: 24, name: 'Project Zenith', address: '73 Stone Creek Blvd, Ogden, UT', status: 'Pending Broker Signoff', dueDate: '05/24/2025', manager: 'J. Vandervennet', avatar: 'JV' },
]

// Summary stats configuration
const summaryStats = {
  total: 40,
  pendingApproval: 5,
  scheduling: 8,
  workInProgress: 16,
  pendingBrokerSignoff: 4,
  invoices: 5,
  qcInvoices: 2,
}

// Progress bar segments (percentages)
const progressSegments = [
  { label: 'Pending Approval', count: 5, color: '#FCD34D', percent: 12.5 },
  { label: 'Scheduling', count: 8, color: '#A3E635', percent: 20 },
  { label: 'Work in Progress', count: 16, color: '#22C55E', percent: 40 },
  { label: 'Pending Broker Sign-Off', count: 4, color: '#38BDF8', percent: 10 },
  { label: 'Invoices', count: 5, color: '#818CF8', percent: 12.5 },
  { label: 'QC Invoices', count: 2, color: '#C084FC', percent: 5 },
]

function Projects({ user }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedProjects, setSelectedProjects] = useState(new Set())
  const [showPendingTooltip, setShowPendingTooltip] = useState(false)
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false)
  const [newProjectFormData, setNewProjectFormData] = useState({
    customer: '',
    assetNumber: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    dateReceived: ''
  })

  const handleNewProjectFormChange = (field, value) => {
    setNewProjectFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetNewProjectForm = () => {
    setNewProjectFormData({
      customer: '',
      assetNumber: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      dateReceived: ''
    })
  }

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (newProjectModalOpen) setNewProjectModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [newProjectModalOpen])

  // Filter projects based on search and status
  const filteredProjects = projectsData.filter(project => {
    const matchesSearch = searchQuery === '' || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.manager.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'All' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const toggleProjectSelection = (projectId) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  return (
    <GlobalNav user={user} activeNav="projects">
      {/* Page Title & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>Projects</h2>
        
        {/* Action Buttons */}
        <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
          <button 
            onClick={() => setNewProjectModalOpen(true)}
            className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#1D1D1F' }}
          >
            New Project
          </button>
          <button 
            className="w-full lg:w-auto group px-5 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors hover:text-white"
            style={{ 
              color: '#111111', 
              border: '1px solid #111111',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#111111'
              e.currentTarget.style.color = '#FFFFFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#111111'
            }}
          >
            AI Summary
          </button>
        </div>
      </div>

      {/* At A Glance Card */}
      <div 
        className="bg-white p-6 mb-6"
        style={{
          borderRadius: '16px',
          boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-medium text-gray-500 mb-1">All Projects - At A Glance</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold" style={{ color: '#1D1D1F' }}>{summaryStats.total}</span>
              <span className="text-sm text-gray-500">Total Projects</span>
            </div>
          </div>
          
          {/* Pending Tooltip - Desktop */}
          <div 
            className="hidden lg:block relative"
            onMouseEnter={() => setShowPendingTooltip(true)}
            onMouseLeave={() => setShowPendingTooltip(false)}
          >
            <div className="bg-gray-50 rounded-lg px-4 py-3 cursor-pointer">
              <p className="text-sm font-medium text-gray-900">Pending</p>
              <p className="text-xs text-gray-500">10% Pending Broker</p>
              <p className="text-xs text-gray-500">Signoff <span className="text-blue-600 underline cursor-pointer">Read More</span></p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex mb-3">
          {progressSegments.map((segment, index) => (
            <div 
              key={index}
              className="h-full"
              style={{ 
                width: `${segment.percent}%`,
                backgroundColor: segment.color 
              }}
              title={`${segment.label}: ${segment.count}`}
            />
          ))}
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          <span>{summaryStats.pendingApproval} Pending Approval</span>
          <span>•</span>
          <span>{summaryStats.scheduling} Scheduling</span>
          <span>•</span>
          <span className="text-green-600">{summaryStats.workInProgress} Work in Progress</span>
          <span>•</span>
          <span>{summaryStats.pendingBrokerSignoff} Pending Broker Sign-Off</span>
          <span>•</span>
          <span>{summaryStats.invoices} Invoices</span>
          <span>•</span>
          <span>{summaryStats.qcInvoices} QC Invoices</span>
        </div>
      </div>

      {/* All Projects Card */}
      <div 
        className="bg-white"
        style={{
          borderRadius: '16px',
          boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Card Header */}
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>All Projects</h3>
          
          {/* Search and Filter Row */}
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Status Filter & Bulk Edit */}
            <div className="flex gap-3 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 lg:flex-none px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Scheduling">Scheduling</option>
                <option value="Work in Progress">Work in Progress</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Pending Broker Signoff">Pending Broker Signoff</option>
                <option value="Invoices">Invoices</option>
                <option value="At Risk">At Risk</option>
              </select>
              
              <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                <EditIcon className="w-4 h-4 text-gray-500" />
                <span className="hidden lg:inline">Bulk Edit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-100">
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Project #</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Project Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProjects.map((project) => (
                <tr 
                  key={project.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="py-4 px-6">
                    <span className="text-sm font-medium text-gray-900 underline">{project.name}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-600">{project.address}</span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-600">{project.dueDate}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ 
                          backgroundColor: '#F3F4F6',
                          color: '#374151'
                        }}
                      >
                        {project.avatar}
                      </div>
                      <span className="text-sm text-gray-600">{project.manager}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List */}
        <div className="lg:hidden divide-y divide-gray-100">
          {filteredProjects.map((project) => (
            <div 
              key={project.id}
              className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    selectedProjects.has(project.id) 
                      ? 'bg-gray-900 border-gray-900' 
                      : 'border-gray-300'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleProjectSelection(project.id)
                  }}
                >
                  {selectedProjects.has(project.id) && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-900 underline">{project.name}</span>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>

      {/* New Project Modal */}
      {newProjectModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setNewProjectModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 24px rgba(0, 0, 0, 0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>New Project</h2>
              <button 
                onClick={() => setNewProjectModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <input
                  type="text"
                  placeholder="Name"
                  value={newProjectFormData.customer}
                  onChange={(e) => handleNewProjectFormChange('customer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Asset # */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset #</label>
                <input
                  type="text"
                  placeholder="XXXXXXXXXXX"
                  value={newProjectFormData.assetNumber}
                  onChange={(e) => handleNewProjectFormChange('assetNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="999 Road Rd."
                  value={newProjectFormData.address}
                  onChange={(e) => handleNewProjectFormChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="City Name"
                  value={newProjectFormData.city}
                  onChange={(e) => handleNewProjectFormChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={newProjectFormData.state}
                  onChange={(e) => handleNewProjectFormChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                    backgroundPosition: 'right 0.75rem center', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Select State</option>
                  <option value="AL">Alabama</option>
                  <option value="AK">Alaska</option>
                  <option value="AZ">Arizona</option>
                  <option value="AR">Arkansas</option>
                  <option value="CA">California</option>
                  <option value="CO">Colorado</option>
                  <option value="CT">Connecticut</option>
                  <option value="DE">Delaware</option>
                  <option value="FL">Florida</option>
                  <option value="GA">Georgia</option>
                  <option value="HI">Hawaii</option>
                  <option value="ID">Idaho</option>
                  <option value="IL">Illinois</option>
                  <option value="IN">Indiana</option>
                  <option value="IA">Iowa</option>
                  <option value="KS">Kansas</option>
                  <option value="KY">Kentucky</option>
                  <option value="LA">Louisiana</option>
                  <option value="ME">Maine</option>
                  <option value="MD">Maryland</option>
                  <option value="MA">Massachusetts</option>
                  <option value="MI">Michigan</option>
                  <option value="MN">Minnesota</option>
                  <option value="MS">Mississippi</option>
                  <option value="MO">Missouri</option>
                  <option value="MT">Montana</option>
                  <option value="NE">Nebraska</option>
                  <option value="NV">Nevada</option>
                  <option value="NH">New Hampshire</option>
                  <option value="NJ">New Jersey</option>
                  <option value="NM">New Mexico</option>
                  <option value="NY">New York</option>
                  <option value="NC">North Carolina</option>
                  <option value="ND">North Dakota</option>
                  <option value="OH">Ohio</option>
                  <option value="OK">Oklahoma</option>
                  <option value="OR">Oregon</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="RI">Rhode Island</option>
                  <option value="SC">South Carolina</option>
                  <option value="SD">South Dakota</option>
                  <option value="TN">Tennessee</option>
                  <option value="TX">Texas</option>
                  <option value="UT">Utah</option>
                  <option value="VT">Vermont</option>
                  <option value="VA">Virginia</option>
                  <option value="WA">Washington</option>
                  <option value="WV">West Virginia</option>
                  <option value="WI">Wisconsin</option>
                  <option value="WY">Wyoming</option>
                </select>
              </div>

              {/* ZIP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                <input
                  type="text"
                  placeholder="99999"
                  maxLength={5}
                  value={newProjectFormData.zip}
                  onChange={(e) => handleNewProjectFormChange('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date Received */}
              <DatePicker
                label="Date Received"
                value={newProjectFormData.dateReceived}
                onChange={(value) => handleNewProjectFormChange('dateReceived', value)}
              />

              {/* Action Buttons */}
              <div className="flex flex-col-reverse lg:flex-row gap-3 pt-2">
                <button 
                  onClick={() => {
                    setNewProjectModalOpen(false)
                    resetNewProjectForm()
                  }}
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
                    console.log('Creating project:', newProjectFormData)
                    setNewProjectModalOpen(false)
                    resetNewProjectForm()
                  }}
                  className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </GlobalNav>
  )
}

// Status Badge Component
function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig['Scheduling']
  const isAtRisk = status === 'At Risk'
  const isActive = status === 'Active'
  
  return (
    <div className="flex items-center gap-1.5">
      <span 
        className="text-sm"
        style={{ color: isActive ? '#22C55E' : isAtRisk ? '#EF4444' : '#374151' }}
      >
        {status}
      </span>
      {isAtRisk && (
        <WarningIcon className="w-4 h-4 text-amber-500" />
      )}
      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
    </div>
  )
}

// Page-specific Icon Components
function SearchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
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

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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

function EditIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function WarningIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

export default Projects