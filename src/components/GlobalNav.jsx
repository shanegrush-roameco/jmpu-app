// src/components/GlobalNav.jsx
// Sprint 9: Added permission-based navigation visibility
// Profiles link only shows for users with canViewProfiles permission
// ============================================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationsPanel, { useNotifications } from './NotificationsPanel'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { usePermissions } from '../hooks/usePermissions'
import { 
  Home, 
  Folder, 
  Report, 
  UserMultiple, 
  Settings, 
  Search, 
  Menu, 
  CloseLarge, 
  ChevronLeft 
} from '@carbon/icons-react'

const recentSearches = [
  'Recent Search Query 1',
  'Recent Search Query 2',
  'Recent Search Query 3',
  'Recent Search Query 4',
  'Recent Search Query 5',
]

// Nav items with optional permission requirement
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'reports', label: 'Reports', icon: Report, requirePermission: 'canViewReports' },
  { id: 'profiles', label: 'Profiles', icon: UserMultiple, requirePermission: 'canViewProfiles' },
]

function GlobalNav({ user, activeNav, children }) {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [menuSearchActive, setMenuSearchActive] = useState(false)
  const notifications = useNotifications()
  
  // Get current user's profile and permissions
  const { profile, loading: profileLoading } = useCurrentProfile()
  const permissions = usePermissions(profile)

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const handleNavClick = (navId) => {
    setMobileMenuOpen(false)
    setMenuSearchActive(false)
    const routes = {
      dashboard: '/',
      projects: '/projects',
      reports: '/reports',
      profiles: '/profiles',
      settings: '/settings',
    }
    navigate(routes[navId] || '/')
  }

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(item => {
    // If no permission required, always show
    if (!item.requirePermission) return true
    // If still loading profile, hide permission-gated items
    if (profileLoading) return false
    // Check if user has the required permission
    return permissions[item.requirePermission] === true
  })

  // Helper to check if a specific nav item should be visible
  const shouldShowNavItem = (navId) => {
    const item = navItems.find(i => i.id === navId)
    if (!item) return true
    if (!item.requirePermission) return true
    if (profileLoading) return false
    return permissions[item.requirePermission] === true
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#F4F4F4' }}>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setMobileMenuOpen(false)
              setMenuSearchActive(false)
            }}
          />
          
          {/* Menu Panel */}
          <div className="absolute top-0 left-0 right-0 bg-white rounded-b-2xl shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 relative">
              <button 
                className="p-2 -ml-2 z-10"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setMenuSearchActive(false)
                }}
              >
                <CloseLarge size={24} style={{ color: '#1D1D1F' }} />
              </button>
              <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold" style={{ color: '#1D1D1F' }}>JMPU</h1>
              <div 
                className="relative z-10"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setMenuSearchActive(false)
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
            
            {/* Menu Content - switches between nav and search */}
            {!menuSearchActive ? (
              <>
                {/* Search Input */}
                <div className="px-6 pt-6">
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => setMenuSearchActive(true)}
                  >
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white cursor-pointer"
                      readOnly
                    />
                    <Search size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Navigation Items - Mobile */}
                <nav className="pt-6 pb-8 flex flex-col gap-6">
                  {/* Dashboard - always visible */}
                  <button
                    onClick={() => handleNavClick('dashboard')}
                    className="mx-4 h-11 flex items-center gap-4 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    style={{ color: '#1D1D1F', borderRadius: '8px' }}
                  >
                    <Home size={24} className={activeNav === 'dashboard' ? 'text-gray-900' : 'text-gray-400'} />
                    <span 
                      className={`text-base ${activeNav === 'dashboard' ? 'font-bold' : 'font-normal'}`}
                      style={{ letterSpacing: '0.16px' }}
                    >
                      Dashboard
                    </span>
                  </button>
                  
                  {/* Projects - always visible */}
                  <button
                    onClick={() => handleNavClick('projects')}
                    className="mx-4 h-11 flex items-center gap-4 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    style={{ color: '#1D1D1F', borderRadius: '8px' }}
                  >
                    <Folder size={24} className={activeNav === 'projects' ? 'text-gray-900' : 'text-gray-400'} />
                    <span 
                      className={`text-base ${activeNav === 'projects' ? 'font-bold' : 'font-normal'}`}
                      style={{ letterSpacing: '0.16px' }}
                    >
                      Projects
                    </span>
                  </button>
                  
                  {/* Reports - permission-gated */}
                  {shouldShowNavItem('reports') && (
                    <button
                      onClick={() => handleNavClick('reports')}
                      className="mx-4 h-11 flex items-center gap-4 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                      style={{ color: '#1D1D1F', borderRadius: '8px' }}
                    >
                      <Report size={24} className={activeNav === 'reports' ? 'text-gray-900' : 'text-gray-400'} />
                      <span 
                        className={`text-base ${activeNav === 'reports' ? 'font-bold' : 'font-normal'}`}
                        style={{ letterSpacing: '0.16px' }}
                      >
                        Reports
                      </span>
                    </button>
                  )}
                  
                  {/* Profiles - admin only */}
                  {shouldShowNavItem('profiles') && (
                    <button
                      onClick={() => handleNavClick('profiles')}
                      className="mx-4 h-11 flex items-center gap-4 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                      style={{ color: '#1D1D1F', borderRadius: '8px' }}
                    >
                      <UserMultiple size={24} className={activeNav === 'profiles' ? 'text-gray-900' : 'text-gray-400'} />
                      <span 
                        className={`text-base ${activeNav === 'profiles' ? 'font-bold' : 'font-normal'}`}
                        style={{ letterSpacing: '0.16px' }}
                      >
                        Profiles
                      </span>
                    </button>
                  )}
                  
                  {/* Settings - always visible */}
                  <button
                    onClick={() => handleNavClick('settings')}
                    className="mx-4 h-11 flex items-center gap-4 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                    style={{ color: '#1D1D1F', borderRadius: '8px' }}
                  >
                    <Settings size={24} className={activeNav === 'settings' ? 'text-gray-900' : 'text-gray-400'} />
                    <span 
                      className={`text-base ${activeNav === 'settings' ? 'font-bold' : 'font-normal'}`}
                      style={{ letterSpacing: '0.16px' }}
                    >
                      Settings
                    </span>
                  </button>
                </nav>
              </>
            ) : (
              <>
                {/* Search Active State */}
                <div className="p-6 flex flex-col gap-6">
                  {/* Back to Main Menu */}
                  <button 
                    className="flex items-center gap-2 text-base font-bold hover:opacity-70 transition-colors"
                    style={{ color: '#000000', letterSpacing: '0.16px' }}
                    onClick={() => setMenuSearchActive(false)}
                  >
                    <ChevronLeft size={16} />
                    <span>Back To Main Menu</span>
                  </button>

                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <Search size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                  
                  {/* Most Recent */}
                  <div className="-mx-6">
                    <h3 className="text-base font-bold px-6 mb-2" style={{ color: '#000000', letterSpacing: '0.16px' }}>Most Recent</h3>
                    <div className="flex flex-col">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          className="mx-4 h-11 flex items-center text-left px-4 py-2 text-base hover:bg-gray-50 transition-colors"
                          style={{ color: '#1D1D1F', letterSpacing: '0.16px', borderRadius: '8px' }}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
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
          {/* Navigation - Desktop (uses filtered visibleNavItems) */}
          <nav className="flex-1">
            {visibleNavItems.map((item) => {
              const IconComponent = item.icon
              return (
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
                  <IconComponent size={24} className={activeNav === item.id ? 'text-gray-900' : 'text-gray-400'} />
                  <span className="text-sm">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Settings */}
        <div className="py-4 pr-4">
          <button 
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
              activeNav === 'settings' ? 'bg-gray-100' : 'hover:bg-gray-50'
            }`}
            style={{ 
              color: activeNav === 'settings' ? '#1D1D1F' : '#6B7280',
              borderRadius: '16px'
            }}
          >
            <Settings size={24} className={activeNav === 'settings' ? 'text-gray-900' : 'text-gray-400'} />
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
              <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side - Avatar only (notifications on click) */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer"
                style={{ 
                  color: '#111111',
                  border: '1px solid #111111'
                }}
                onClick={notifications.toggle}
                title="Notifications"
              >
                {getInitials(userName)}
              </div>
              {notifications.unreadCount > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              )}

              {/* Desktop Notifications Panel */}
              <NotificationsPanel 
                isOpen={notifications.isOpen} 
                onClose={notifications.close}
                isMobile={false}
              />
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
            <Menu size={24} style={{ color: '#1D1D1F' }} />
          </button>

          {/* Logo - Absolutely centered */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold" style={{ color: '#1D1D1F' }}>JMPU</h1>

          {/* Right side - Avatar only */}
          <div className="relative z-10" onClick={notifications.toggle}>
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
        </header>

        {/* Mobile Notifications Panel */}
        <NotificationsPanel
          isOpen={notifications.isOpen}
          onClose={notifications.close}
          onOpenMenu={() => setMobileMenuOpen(true)}
          isMobile={true}
        />

        {/* Page Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default GlobalNav
