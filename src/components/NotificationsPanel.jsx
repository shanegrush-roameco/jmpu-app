import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseLarge, Menu, ChevronRight, Logout, Checkmark } from '@carbon/icons-react'
import { supabase } from '../lib/supabase'
import { useNotifications } from '../hooks/useNotifications'

// Helper to format relative timestamps
function formatTimestamp(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

// Render body text with @mentions highlighted
function renderBodyWithMentions(body) {
  if (!body) return null
  const parts = body.split(/(@\w+)/g)
  return parts.map((part, index) =>
    part.startsWith('@')
      ? <span key={index} className="text-blue-600 font-medium">{part}</span>
      : part
  )
}

// Single notification row -- defined outside parent to prevent remount on re-render
function NotificationItem({ notification, onClick }) {
  const senderName = notification.data?.sender_name || 'System'
  const senderInitials = notification.data?.sender_initials || senderName[0]?.toUpperCase() || '?'
  const projectName = notification.data?.project_name || notification.title

  return (
    <div
      onClick={() => onClick(notification)}
      className="px-4 lg:px-6 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-800">
            {senderInitials}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{projectName}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-blue-600 font-medium">{senderName}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">{formatTimestamp(notification.created_at)}</span>
              </div>
            </div>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {renderBodyWithMentions(notification.body)}
          </p>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-gray-500">No notifications yet</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="px-6 py-12 flex justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
    </div>
  )
}

function NotificationsPanel({ isOpen, onClose, onOpenMenu, isMobile = false, userId }) {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications(userId)

  const [loggingOut, setLoggingOut] = useState(false)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  // Close on click outside (desktop only)
  useEffect(() => {
    if (isMobile || !isOpen) return
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, isMobile])

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  const handleLogout = async () => {
    setLoggingOut(true)
    onClose()
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error.message)
      setLoggingOut(false)
    }
  }

  // Navigate first, then mark read -- avoids async delay blocking navigation
  const handleNotificationClick = (notification) => {
    const { type, data } = notification

    // Navigate immediately
    if (type === 'message' || type === 'mention') {
      if (data?.project_id) navigate(`/projects/${data.project_id}?tab=messages`)
    } else if (type === 'task_assigned') {
      if (data?.project_id) navigate(`/projects/${data.project_id}`)
    } else if (type === 'project_status') {
      if (data?.project_id) navigate(`/projects/${data.project_id}`)
    } else if (type === 'draw_submission') {
      if (data?.project_id) navigate(`/projects/${data.project_id}?tab=draws`)
    }

    onClose()

    // Mark read after navigation -- fire and forget
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  if (!isOpen) return null

  // Shared footer content
  const FooterActions = () => (
    <div className="px-6 pt-2 pb-4 border-t border-gray-100">
      <button
        onClick={() => { navigate('/notifications'); onClose() }}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        style={{ color: '#1D1D1F' }}
      >
        <span>View All Notifications</span>
        <ChevronRight size={20} />
      </button>

      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
        style={{ color: '#1D1D1F' }}
      >
        {loggingOut ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
        ) : (
          <Logout size={20} />
        )}
        <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
      </button>
    </div>
  )

  // Shared header
  const PanelHeader = ({ showMenu = false }) => (
    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
      {showMenu ? (
        <button
          className="p-2 -ml-2"
          onClick={() => { onClose(); onOpenMenu && onOpenMenu() }}
        >
          <Menu size={24} style={{ color: '#1D1D1F' }} />
        </button>
      ) : (
        <h3 className="font-semibold text-gray-900">Notifications</h3>
      )}

      {showMenu && (
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold" style={{ color: '#1D1D1F' }}>JMPU</h1>
      )}

      <div className="flex items-center gap-3">
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Checkmark size={14} />
            Mark all read
          </button>
        )}
        {showMenu && (
          <button className="p-1" onClick={onClose}>
            <CloseLarge size={24} style={{ color: '#1D1D1F' }} />
          </button>
        )}
      </div>
    </div>
  )

  // Mobile panel
  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
        <div
          className="fixed top-0 left-0 right-0 bg-white z-50 lg:hidden rounded-b-2xl"
          style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}
        >
          <PanelHeader showMenu />

          {/* Notifications title row (mobile only, below header) */}
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {loading ? <LoadingState /> : notifications.length === 0 ? <EmptyState /> : (
              notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
              ))
            )}
          </div>

          <FooterActions />
        </div>
      </>
    )
  }

  // Desktop panel
  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl overflow-hidden z-50"
      style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)' }}
    >
      <PanelHeader />

      <div className="max-h-[320px] overflow-y-auto">
        {loading ? <LoadingState /> : notifications.length === 0 ? <EmptyState /> : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
          ))
        )}
      </div>

      <FooterActions />
    </div>
  )
}

export default NotificationsPanel
