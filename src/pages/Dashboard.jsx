import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import NotificationsPanel, { useNotifications } from '../components/NotificationsPanel'

// Mock data based on design
const stats = [
  { 
    label: 'Total Projects', 
    value: 12, 
    subtitle: 'View',
    showArrow: true,
    progressSegments: [
      { percent: 100, color: '#22C55E' },
    ]
  },
  { 
    label: 'In Progress', 
    value: 12, 
    subtitle: 'View',
    statusDot: '#22C55E',
    showArrow: true,
    progressSegments: [
      { percent: 100, color: '#22C55E' },
    ]
  },
  { 
    label: 'At Risk', 
    value: 3, 
    subtitle: 'View',
    statusDot: '#EAB308',
    showArrow: true,
    progressSegments: [
      { percent: 25, color: '#EAB308' },
    ]
  },
  { 
    label: 'Completed', 
    value: 4, 
    subtitle: 'View',
    statusDot: '#3B82F6',
    showArrow: true,
    progressSegments: [
      { percent: 33, color: '#3B82F6' },
    ]
  },
]

const myProjects = [
  { name: 'Project Alpha', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Bravo', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Charlie', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Delta', status: 'At Risk', statusColor: '#EF4444', hasWarning: true },
  { name: 'Project Echo', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Foxtrot', status: 'At Risk', statusColor: '#EF4444', hasWarning: true },
  { name: 'Project Gamma', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Hotel', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Indigo', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Juliet', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Kilo', status: 'In Progress', statusColor: '#22C55E' },
  { name: 'Project Lima', status: 'At Risk', statusColor: '#EF4444', hasWarning: true },
]

const myTasks = [
  { id: 1, title: 'Inspect Job Site A', project: 'Project Alpha', assignee: 'S. Kerley', avatar: 'SK' },
  { id: 2, title: 'Meet Client for Walkthrough', project: 'Project Bravo', assignee: 'S. Kerley', avatar: 'SK' },
  { id: 3, title: 'Mark Hazards for Removal', project: 'Project Alpha', assignee: 'S. Kerley', avatar: 'SK' },
  { id: 4, title: 'Approve Material Purchase Request', project: 'Project Alpha', assignee: 'S. Kerley', avatar: 'SK' },
  { id: 5, title: 'Submit Final Invoice', project: 'Project Foxtrot', assignee: 'J. Vandervennet', avatar: 'JV' },
  { id: 6, title: 'Confirm Dumpster Delivery', project: 'Project Charlie', assignee: 'S. Kerley', avatar: 'SK' },
  { id: 7, title: 'Schedule Framing Inspection', project: 'Project Alpha', assignee: 'S. Kerley', avatar: 'SK' },
]

const openInvoices = [
  { id: '45678', amount: '$67,890.00', date: '05/25/25', status: 'On Time' },
  { id: '45678', amount: '$67,890.00', date: '05/25/25', status: 'On Time' },
  { id: '45678', amount: '$67,890.00', date: '05/25/25', status: 'On Time' },
  { id: '45678', amount: '$67,890.00', date: '05/25/25', status: 'On Time' },
]

const dueThisWeek = [
  { id: 1, title: 'Signed Contract Upload', project: 'Project Alpha', date: 'May 14', icon: 'document', overdue: true },
  { id: 2, title: 'Review Subcontractor Proposal', project: 'Project Gamma', date: 'May 14', icon: 'money', overdue: true },
  { id: 3, title: 'Schedule Inspection', project: 'Project Echo', date: 'May 15', icon: 'calendar', overdue: true },
  { id: 4, title: 'Permits Need To Be Uploaded', project: 'Project Foxtrot', date: 'May 16', icon: 'upload', overdue: false },
  { id: 5, title: 'Schedule Electrical Rough-In Inspection', project: 'Project Echo', date: 'May 16', icon: 'calendar', overdue: false },
  { id: 6, title: 'Submit Subcontractor Payment Application', project: 'Project Delta', date: 'May 18', icon: 'send', overdue: false },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', active: true },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'profiles', label: 'Profiles', icon: 'users' },
]

const recentSearches = [
  'Recent Search Query 1',
  'Recent Search Query 2', 
  'Recent Search Query 3',
  'Recent Search Query 4',
  'Recent Search Query 5',
]

function Dashboard({ user }) {
  const navigate = useNavigate()
  const [completedTasks, setCompletedTasks] = useState(new Set())
  const [activeNav, setActiveNav] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const notifications = useNotifications()

  const handleLogout = async () => {
    await supabase.auth.signOut()
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

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#F4F4F4' }}>
      
      {/* Mobile Menu Overlay */}
{mobileMenuOpen && (
  <div className="fixed inset-0 z-50 lg:hidden">
    {/* Backdrop */}
    <div 
      className="absolute inset-0 bg-black/50"
      onClick={() => setMobileMenuOpen(false)}
    />
    
    {/* Menu Panel */}
    <div className="absolute top-0 left-0 right-0 bg-white rounded-b-2xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 -ml-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <CloseIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: '#1D1D1F' }}>JMPU</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
  className="p-2"
  onClick={() => {
    setMobileMenuOpen(false)
    setMobileSearchOpen(true)
  }}
>
  <SearchIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
</button>
          <div 
  className="relative"
  onClick={() => {
    setMobileMenuOpen(false)
    notifications.toggle()
  }}
>
  <div 
    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer"
    style={{ 
      color: '#111111',
      border: '1px solid #111111'
    }}
  >
    {getInitials(userName)}
  </div>
  {notifications.unreadCount > 0 && (
    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
  )}
</div>
        </div>
      </div>
      
      {/* Navigation Items */}
      <nav className="px-4 py-4">
        <button
          onClick={() => handleNavClick('dashboard')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left mb-1 hover:bg-gray-50 transition-colors"
          style={{ color: '#1D1D1F' }}
        >
          <NavIcon name="home" active={activeNav === 'dashboard'} />
          <span className="text-base">Dashboard</span>
        </button>
        <button
          onClick={() => handleNavClick('projects')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left mb-1 hover:bg-gray-50 transition-colors"
          style={{ color: '#1D1D1F' }}
        >
          <NavIcon name="folder" active={activeNav === 'projects'} />
          <span className="text-base">Projects</span>
        </button>
        <button
          onClick={() => handleNavClick('reports')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left mb-1 hover:bg-gray-50 transition-colors"
          style={{ color: '#1D1D1F' }}
        >
          <NavIcon name="chart" active={activeNav === 'reports'} />
          <span className="text-base">Reports</span>
        </button>
        <button
          onClick={() => handleNavClick('profiles')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left mb-1 hover:bg-gray-50 transition-colors"
          style={{ color: '#1D1D1F' }}
        >
          <NavIcon name="users" active={activeNav === 'profiles'} />
          <span className="text-base">Profiles</span>
        </button>
        <button
          onClick={() => handleNavClick('settings')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left mb-1 hover:bg-gray-50 transition-colors"
          style={{ color: '#1D1D1F' }}
        >
          <NavIcon name="settings" active={activeNav === 'settings'} />
          <span className="text-base">Settings</span>
        </button>
      </nav>
    </div>
  </div>
)}

{/* Sidebar - Desktop only */}
<aside className="hidden lg:flex w-[200px] bg-white flex-col flex-shrink-0 h-full pt-6 pl-4 pr-0">
  {/* Logo */}
  <h1 className="text-xl font-bold mb-6 text-center pr-4" style={{ color: '#1D1D1F' }}>JMPU</h1>

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
        {/* Desktop Header - Hidden on mobile */}
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
            {/* Notifications Button & Panel */}
            <div className="relative">
              <button 
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" 
                style={{ color: '#161616' }}
                onClick={notifications.toggle}
              >
                <BellIcon className="w-5 h-5" />
                {notifications.unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </button>

              {/* Desktop Notifications Panel */}
              <NotificationsPanel 
                isOpen={notifications.isOpen} 
                onClose={notifications.close}
                isMobile={false}
              />
            </div>

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
  {/* Hamburger Menu */}
  <button 
    className="p-2 -ml-2 z-10"
    onClick={() => setMobileMenuOpen(true)}
  >
    <HamburgerIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
  </button>

  {/* Logo - Absolutely centered */}
  <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold" style={{ color: '#1D1D1F' }}>JMPU</h1>

  {/* Right side - Search & Avatar */}
  <div className="flex items-center gap-2 z-10">
    <button 
      className="p-2"
      onClick={() => setMobileSearchOpen(true)}
    >
      <SearchIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
    </button>
    <div className="relative" onClick={notifications.toggle}>
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer"
        style={{ 
          color: '#111111',
          border: '1px solid #111111'
        }}
        title="Notifications"
      >
        {getInitials(userName)}
      </div>
      {notifications.unreadCount > 0 && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      )}
    </div>
  </div>
</header>

{/* Mobile Search Panel */}
{mobileSearchOpen && (
  <div className="fixed inset-0 z-50 lg:hidden">
    {/* Backdrop */}
    <div 
      className="absolute inset-0 bg-black/50"
      onClick={() => setMobileSearchOpen(false)}
    />
    
    {/* Search Panel */}
    <div className="absolute top-0 left-0 right-0 bg-white rounded-b-2xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button 
  className="p-2 -ml-2"
  onClick={() => {
    setMobileSearchOpen(false)
    setMobileMenuOpen(true)
  }}
>
  <HamburgerIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
</button>
          <h1 className="text-lg font-bold" style={{ color: '#1D1D1F' }}>JMPU</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-2"
            onClick={() => setMobileSearchOpen(false)}
          >
            <CloseIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
          </button>
          <div 
  className="relative"
  onClick={() => {
    setMobileSearchOpen(false)
    notifications.toggle()
  }}
>
  <div 
    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer"
    style={{ 
      color: '#111111',
      border: '1px solid #111111'
    }}
  >
    {getInitials(userName)}
  </div>
  {notifications.unreadCount > 0 && (
    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
  )}
</div>
        </div>
      </div>
      
      {/* Search Content */}
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-3" style={{ color: '#1D1D1F' }}>Search</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        
        {/* Most Recent */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2 pb-2 border-b border-gray-100">Most Recent</h3>
          <div className="space-y-1">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                className="w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)}

        {/* Mobile Notifications Panel */}
        <NotificationsPanel
  isOpen={notifications.isOpen}
  onClose={notifications.close}
  onOpenMenu={() => setMobileMenuOpen(true)}
  onOpenSearch={() => setMobileSearchOpen(true)}
  isMobile={true}
/>

        {/* Page Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Good Morning Greeting */}
          <div className="mb-6">
            <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
              Good Morning, {userName.split(' ')[0]}
            </h2>
          </div>

          {/* Stats Cards - Horizontal scroll on mobile, grid on desktop */}
          <div className="mb-6 -mr-4 lg:mr-0">
            <div className="flex lg:grid lg:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory stats-scroll pr-4 lg:pr-0">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  {stat.statusDot && (
                    <div 
                      className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stat.statusDot }}
                    />
                  )}
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>{stat.label}</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      {stat.value}
                    </span>
                    <span className="text-base font-bold" style={{ color: '#919191' }}>
                      Projects
                    </span>
                  </div>
                  {/* Multi-segment progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    {stat.progressSegments.map((segment, segIndex) => (
                      <div 
                        key={segIndex}
                        className="h-full"
                        style={{ 
                          width: `${segment.percent}%`,
                          backgroundColor: segment.color 
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">{stat.subtitle}</p>
                    {stat.showArrow && (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Grid - Single column on mobile, 12-col grid on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* My Projects Card */}
            <div 
              className="lg:col-span-5 bg-white overflow-hidden"
              style={{
                borderRadius: '16px',
                boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">My Projects</h3>
                <button 
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  onClick={() => navigate('/projects')}
                >
                  View All <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {myProjects.map((project, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/project/${index + 1}`)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{project.name}</span>
                      <span className="text-sm" style={{ color: project.statusColor }}>{project.status}</span>
                      {project.hasWarning && (
                        <WarningIcon className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      View Project <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* My Tasks Card */}
            <div 
              className="lg:col-span-7 bg-white overflow-hidden"
              style={{
                borderRadius: '16px',
                boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">My Tasks</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {myTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTask(task.id)
                      }}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        completedTasks.has(task.id)
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {completedTasks.has(task.id) && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        completedTasks.has(task.id) ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">{task.project} • {task.assignee}</p>
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ 
                        color: '#111111',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#F9FAFB'
                      }}
                    >
                      {task.avatar}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Open Invoices Card */}
            <div 
              className="lg:col-span-4 bg-white overflow-hidden"
              style={{
                borderRadius: '16px',
                boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Open Invoices</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  View All <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
              
              {/* Table Headers */}
              <div className="grid grid-cols-3 px-6 py-2 border-b border-gray-100 text-xs text-gray-500">
                <span>Invoice #</span>
                <span>Amount</span>
                <span>Draw Date</span>
              </div>
              
              <div className="divide-y divide-gray-50">
                {openInvoices.map((invoice, index) => (
                  <div 
                    key={index}
                    className="grid grid-cols-3 px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-sm"
                  >
                    <span className="text-blue-600">{invoice.id}</span>
                    <span className="text-gray-900">{invoice.amount}</span>
                    <span className="text-green-600">{invoice.date} ({invoice.status})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Due This Week Card */}
            <div 
              className="lg:col-span-8 bg-white overflow-hidden"
              style={{
                borderRadius: '16px',
                boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
              }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Due This Week</h3>
                <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  View All <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-50 overflow-hidden">
                {dueThisWeek.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer last:rounded-b-2xl"
                  >
                    <DueIcon name={item.icon} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.project}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded flex-shrink-0 ${
                      item.overdue 
                        ? 'text-red-600 bg-red-50' 
                        : 'text-gray-500 bg-gray-100'
                    }`}>
                      <ClockIcon className="w-3 h-3" />
                      {item.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
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

function DueIcon({ name }) {
  const iconClass = "w-5 h-5 text-gray-400"
  
  switch (name) {
    case 'document':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    case 'money':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      )
    case 'upload':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      )
    case 'send':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
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

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function WarningIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

export default Dashboard
