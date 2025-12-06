import { useState, useEffect, useRef } from 'react'
import { CloseLarge, Menu, ChevronRight, Logout } from '@carbon/icons-react'
import { supabase } from '../lib/supabase'

// Mock notifications data based on design
const notificationsData = [
  {
    id: 1,
    projectName: 'Project Alpha',
    user: 'Jake',
    avatar: 'J',
    timestamp: '1 Hour ago',
    message: 'Can you confirm the dumpster delivery for Thursday?',
    unread: true,
  },
  {
    id: 2,
    projectName: 'Project Delta',
    user: 'Jake',
    avatar: 'J',
    timestamp: '2 Hours ago',
    message: 'Please upload the signed change order by EOD.',
    unread: true,
  },
  {
    id: 3,
    projectName: 'Project Foxtrot',
    user: 'Jake',
    avatar: 'J',
    timestamp: '1 Day ago',
    message: 'Following up on the HVAC delivery — @Tyler any updates?',
    unread: true,
    mention: 'Tyler',
  },
]

function NotificationsPanel({ isOpen, onClose, onOpenMenu, onOpenSearch, isMobile = false }) {
  const [notifications] = useState(notificationsData)
  const panelRef = useRef(null)

  // Close on click outside (desktop only)
  useEffect(() => {
    if (!isMobile) {
      const handleClickOutside = (event) => {
        if (panelRef.current && !panelRef.current.contains(event.target)) {
          onClose()
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, onClose, isMobile])

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
    }
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Handle logout
  const handleLogout = async () => {
    onClose()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error.message)
    }
  }

  // Function to render message with @mentions highlighted
  const renderMessageWithMentions = (message, mention) => {
    if (!mention) return message
    const parts = message.split(`@${mention}`)
    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && (
          <span className="text-blue-600 font-medium">@{mention}</span>
        )}
      </span>
    ))
  }

  if (!isOpen) return null

  // Mobile Panel - Full width, no animation
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
        
        {/* Panel */}
        <div 
          className="fixed top-0 left-0 right-0 bg-white z-50 lg:hidden rounded-b-2xl"
          style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}
        >
          {/* Header - matches other mobile panels */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 relative">
            {/* Left side - Hamburger */}
            <button 
              className="p-2 -ml-2 z-10"
              onClick={() => {
                onClose()
                onOpenMenu && onOpenMenu()
              }}
            >
              <Menu size={24} style={{ color: '#1D1D1F' }} />
            </button>

            {/* Center - Logo */}
            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold" style={{ color: '#1D1D1F' }}>JMPU</h1>

            {/* Right side - Close */}
            <div className="flex items-center gap-2 z-10">
              <button 
                className="w-8 h-8 flex items-center justify-center"
                onClick={onClose}
              >
                <CloseLarge size={24} style={{ color: '#1D1D1F' }} />
              </button>
            </div>
          </div>

          {/* Notifications Title */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>

          {/* Notification Items */}
          <div className="max-h-[50vh] overflow-y-auto">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className="px-4 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div 
                      className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-800"
                    >
                      {notification.avatar}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{notification.projectName}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-blue-600 font-medium">{notification.user}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-400">{notification.timestamp}</span>
                        </div>
                      </div>
                      {notification.unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {renderMessageWithMentions(notification.message, notification.mention)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-6 border-t border-gray-100">
            {/* View All Notifications Button */}
            <button 
              className="w-full flex items-center justify-between px-0 py-4 text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ 
                borderTop: '1px solid #E5E5E5',
                borderBottom: '1px solid #E5E5E5',
                color: '#1D1D1F'
              }}
            >
              <span>View All Notifications</span>
              <ChevronRight size={20} />
            </button>

            {/* Logout */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-4 text-sm hover:opacity-70 transition-opacity"
              style={{ color: '#1D1D1F' }}
            >
              <Logout size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </>
    )
  }

  // Desktop Panel - Dropdown
  return (
    <div 
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl overflow-hidden z-50"
      style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
      </div>

      {/* Notification Items */}
      <div className="max-h-[320px] overflow-y-auto">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className="px-6 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0"
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div 
                  className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-800"
                >
                  {notification.avatar}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{notification.projectName}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-blue-600 font-medium">{notification.user}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{notification.timestamp}</span>
                    </div>
                  </div>
                  {notification.unread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {renderMessageWithMentions(notification.message, notification.mention)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-6 border-t border-gray-100">
        {/* View All Notifications Button */}
        <button 
          className="w-full flex items-center justify-between px-0 py-4 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ 
            borderTop: '1px solid #E5E5E5',
            borderBottom: '1px solid #E5E5E5',
            color: '#1D1D1F'
          }}
        >
          <span>View All Notifications</span>
          <ChevronRight size={20} />
        </button>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 py-4 text-sm hover:opacity-70 transition-opacity"
          style={{ color: '#1D1D1F' }}
        >
          <Logout size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

// Export a hook for managing notification state
export function useNotifications() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications] = useState(notificationsData)
  
  const unreadCount = notifications.filter(n => n.unread).length
  
  const toggle = () => setIsOpen(prev => !prev)
  const close = () => setIsOpen(false)
  
  return {
    isOpen,
    toggle,
    close,
    unreadCount
  }
}

export default NotificationsPanel
