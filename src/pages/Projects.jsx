import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
  { id: 2, name: 'Project Bravo', address: '1552 Juniper Ridge Rd, Ogden, UT', status: 'Scheduling', dueDate: '05/14/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 3, name: 'Project Charlie', address: '1652 Juniper Ridge Rd, Ogden, UT', status: 'Active', dueDate: '05/16/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 4, name: 'Project Delta', address: '1752 Juniper Ridge Rd, Ogden, UT', status: 'Pending Broker Signoff', dueDate: '05/10/2025', manager: 'J. Vandervennet', avatar: 'JV' },
  { id: 5, name: 'Project Echo', address: '1852 Juniper Ridge Rd, Ogden, UT', status: 'Invoices', dueDate: '05/08/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 6, name: 'Project Foxtrot', address: '1952 Juniper Ridge Rd, Ogden, UT', status: 'At Risk', dueDate: '05/11/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 7, name: 'Project Gamma', address: '1232 Juniper Ridge Rd, Ogden, UT', status: 'Pending Approval', dueDate: '05/20/2025', manager: 'J. Vandervennet', avatar: 'JV' },
  { id: 8, name: 'Project Hotel', address: '1342 Juniper Ridge Rd, Ogden, UT', status: 'Scheduling', dueDate: '05/13/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 9, name: 'Project Indigo', address: '325 N St. George, Ogden, UT', status: 'Work in Progress', dueDate: '05/15/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 10, name: 'Project Juliet', address: '67 Ridge Way, Layton, UT', status: 'Active', dueDate: '05/19/2025', manager: 'M. Thillman', avatar: 'MT' },
  { id: 11, name: 'Project Kilo', address: '488 South Main St, Moab, UT', status: 'Scheduling', dueDate: '05/18/2025', manager: 'S. Ramirez', avatar: 'SR' },
  { id: 12, name: 'Project Lima', address: '92 W 100 S, Provo, UT', status: 'Pending Approval', dueDate: '05/21/2025', manager: 'T. Nguyen', avatar: 'TN' },
  { id: 13, name: 'Project Mango', address: '821 Orchard Rd, Logan, UT', status: 'Invoices', dueDate: '05/09/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 14, name: 'Project Neptune', address: '2209 W 6200 S, Taylorsville, UT', status: 'Work in Progress', dueDate: '05/22/2025', manager: 'M. Tillman', avatar: 'MT' },
  { id: 15, name: 'Project Omega', address: '14 Oak Canyon Ln, Draper, UT', status: 'At Risk', dueDate: '05/11/2025', manager: 'J. Vandervennet', avatar: 'JV' },
  { id: 16, name: 'Project Pluto', address: '159 Birch Hollow Dr, Sandy, UT', status: 'Active', dueDate: '05/16/2025', manager: 'B. Ramirez', avatar: 'BR' },
  { id: 17, name: 'Project Quartz', address: '421 Main St, Heber City, UT', status: 'Pending Broker Signoff', dueDate: '05/16/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 18, name: 'Project Redwood', address: '93 Canyon Crest Dr, Logan, UT', status: 'Invoices', dueDate: '05/17/2025', manager: 'S. Kerley', avatar: 'SK' },
  { id: 19, name: 'Project Sierra', address: '211 E 500 N, Orem, UT', status: 'Scheduling', dueDate: '05/14/2025', manager: 'S. Kerley', avatar: 'SK' },
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

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'projects', label: 'Projects', icon: 'folder', active: true },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'profiles', label: 'Profiles', icon: 'users' },
]

function Projects({ user }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selectedProjects, setSelectedProjects] = useState(new Set())
  const [activeNav, setActiveNav] = useState('projects')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showPendingTooltip, setShowPendingTooltip] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

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

  const handleNavClick = (navId) => {
    setActiveNav(navId)
    setMobileMenuOpen(false)
    const routes = {
      dashboard: '/',
      projects: '/projects',
      reports: '/reports',
      profiles: '/profiles',
    }
    navigate(routes[navId] || '/')
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#F4F4F4' }}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown on lg+ */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[200px] bg-white flex flex-col flex-shrink-0 h-full pt-6 pl-4 pr-0
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Close button for mobile */}
        <button 
          className="absolute top-4 right-4 p-2 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <CloseIcon className="w-5 h-5 text-gray-500" />
        </button>

        {/* Logo */}
        <h1 className="text-xl font-bold mb-6 text-center pr-4" style={{ color: '#1D1D1F' }}>JMP</h1>

        {/* Nav Container */}
        <div 
          className="flex-1 px-4 py-5 flex flex-col"
          style={{ 
            borderTop: '1px solid #E8E8E8',
            borderLeft: '1px solid #E8E8E8',
            borderBottom: '1px solid #E8E8E8',
            borderRight: 'none',
            borderTopLeftRadius: '16px',
            borderBottomLeftRadius: '16px'
          }}
        >
          {/* Navigation */}
          <nav className="flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mb-1 transition-colors ${
                  activeNav === item.id 
                    ? 'bg-gray-100 font-medium' 
                    : 'hover:bg-gray-50'
                }`}
                style={{ color: activeNav === item.id ? '#1D1D1F' : '#6B7280' }}
              >
                <NavIcon name={item.icon} active={activeNav === item.id} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings */}
        <div className="py-4">
          <button 
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            style={{ color: '#6B7280' }}
          >
            <NavIcon name="settings" />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between flex-shrink-0">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" style={{ color: '#161616' }}>
              <BellIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer"
                style={{ 
                  color: '#111111',
                  border: '1px solid #111111'
                }}
                onClick={handleLogout}
                title="Click to logout"
              >
                {getInitials(userName)}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="flex lg:hidden bg-white border-b border-gray-100 px-4 py-3 items-center justify-between flex-shrink-0 relative">
          <button 
            className="p-2 -ml-2 z-10"
            onClick={() => setMobileMenuOpen(true)}
          >
            <HamburgerIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
          </button>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold" style={{ color: '#1D1D1F' }}>JMP</h1>

          <div className="flex items-center gap-2 z-10">
            <button className="p-2">
              <SearchIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
            </button>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer"
              style={{ 
                color: '#111111',
                border: '1px solid #111111'
              }}
              onClick={handleLogout}
              title="Click to logout"
            >
              {getInitials(userName)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Page Title & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>Projects</h2>
            
            {/* Action Buttons */}
            <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
              <button 
                className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors order-1 lg:order-2"
                style={{ backgroundColor: '#1D1D1F' }}
              >
                New Project
              </button>
              <button 
                className="w-full lg:w-auto group px-5 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors hover:text-white order-2 lg:order-1"
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
        </div>
      </main>
    </div>
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

// Icon Components
function NavIcon({ name, active }) {
  const iconClass = `w-5 h-5 ${active ? 'text-gray-900' : 'text-gray-400'}`
  
  switch (name) {
    case 'home':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    case 'folder':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      )
    case 'chart':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    case 'users':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    case 'settings':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    default:
      return null
  }
}

function SearchIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
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

function HamburgerIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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