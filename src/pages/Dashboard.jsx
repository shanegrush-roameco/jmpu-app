// src/pages/Dashboard.jsx
// Sprint 18: Action Center replaces My Tasks -- three-state (active/completed/archived), full width
// Sprint 17: Role-based dashboard layout + live data wiring
// ============================================================================

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Checkmark, ChevronDown } from '@carbon/icons-react'
import GlobalNav from '../components/GlobalNav'
import TaskModal from '../components/modals/TaskModal'
import CreateProjectModal from '../components/modals/CreateProjectModal'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { useTasks, updateTask } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { useQuickBooksInvoices } from '../hooks/useQuickBooks'
import { useNotifications } from '../hooks/useNotifications'

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(val) {
  const num = parseFloat(val) || 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  const due = new Date(dateStr)
  due.setHours(23, 59, 59, 999)
  return due < new Date()
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function formatTimestamp(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const PRIORITY_STYLES = {
  urgent: { label: 'Urgent', bg: '#FEE2E2', color: '#B91C1C' },
  high:   { label: 'High',   bg: '#FEF3C7', color: '#B45309' },
  medium: { label: 'Medium', bg: '#EFF6FF', color: '#1D4ED8' },
  low:    { label: 'Low',    bg: '#F3F4F6', color: '#6B7280' },
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}

// ============================================================================
// NotificationsStrip
// ============================================================================
function NotificationsStrip({ userId }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId)
  const navigate = useNavigate()

  const unread = useMemo(
    () => notifications.filter(n => !n.read).slice(0, 5),
    [notifications]
  )
  const overflow = unreadCount - unread.length

  if (unreadCount === 0) return null

  const handleClick = (notification) => {
    const { type, data } = notification
    if (type === 'message' || type === 'mention') {
      if (data?.project_id) navigate(`/projects/${data.project_id}?tab=messages`)
    } else if (type === 'task_assigned') {
      if (data?.project_id) navigate(`/projects/${data.project_id}`)
    } else if (type === 'project_status') {
      if (data?.project_id) navigate(`/projects/${data.project_id}`)
    } else if (type === 'draw_submission') {
      if (data?.project_id) navigate(`/projects/${data.project_id}?tab=draws`)
    }
    if (!notification.read) markAsRead(notification.id)
  }

  return (
    <div className="bg-white mb-6" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Notifications</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF' }}>
            {unreadCount}
          </span>
        </div>
        <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
          <Checkmark size={14} />
          Mark all read
        </button>
      </div>
      <div className="divide-y divide-gray-50">
        {unread.map((n) => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            className="flex items-start gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{n.data?.project_name || n.title}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-blue-600 font-medium">{n.data?.sender_name || 'System'}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{n.body}</p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{formatTimestamp(n.created_at)}</span>
          </div>
        ))}
      </div>
      {overflow > 0 && (
        <div className="px-5 py-3 border-t border-gray-50">
          <p className="text-xs text-gray-400">+{overflow} more unread -- open the notification panel to view all</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Action Center
// ============================================================================
function ActionCenter({ tasks, loading, onToggle, onArchive, onRestore, completedSet, archivedSet, onNavigateToProject }) {
  const [showArchived, setShowArchived] = useState(false)

  const activeTasks = useMemo(() =>
    tasks.filter(t => !t.is_archived && !archivedSet.has(t.id) && t.status !== 'completed' && !completedSet.has(t.id)),
    [tasks, archivedSet, completedSet]
  )
  const completedTasks = useMemo(() =>
    tasks.filter(t => !t.is_archived && !archivedSet.has(t.id) && (t.status === 'completed' || completedSet.has(t.id))),
    [tasks, archivedSet, completedSet]
  )
  const archivedTasks = useMemo(() =>
    tasks.filter(t => t.is_archived || archivedSet.has(t.id)),
    [tasks, archivedSet]
  )

  return (
    <div className="bg-white mb-6" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Action Center</h3>
          {activeTasks.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF' }}>
              {activeTasks.length}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        ) : activeTasks.length === 0 && completedTasks.length === 0 && archivedTasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">You're all caught up.</p>
          </div>
        ) : (
          <>
            {/* Active tasks */}
            {activeTasks.map((task) => {
              const projectId = task.project_id || task.project?.id
              return (
                <div key={task.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => onToggle(task.id, task.status)}
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors hover:border-gray-400"
                    style={{ borderColor: '#D1D5DB' }}
                  />
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => projectId && onNavigateToProject(projectId)}
                  >
                    <p className="text-sm font-medium truncate" style={{ color: '#1D1D1F' }}>{task.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-gray-500">{task.project?.name || 'Unknown Project'}</span>
                      {task.assigned_to_profile?.full_name && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-500">{task.assigned_to_profile.full_name}</span>
                        </>
                      )}
                      {task.due_date && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-500' : 'text-gray-400'}`}>
                            Due {formatDate(task.due_date)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {task.priority && <PriorityBadge priority={task.priority} />}
                </div>
              )
            })}

            {/* Completed section */}
            {completedTasks.length > 0 && (
              <>
                <div className="px-5 py-2.5 flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Completed</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">{completedTasks.length}</span>
                </div>
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3 bg-gray-50/50">
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#1D1D1F', borderColor: '#1D1D1F' }}
                    >
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400 line-through truncate">{task.title}</p>
                      <span className="text-xs text-gray-400">{task.project?.name || 'Unknown Project'}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onToggle(task.id, task.status)}
                        className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
                      >
                        Reopen
                      </button>
                      <button
                        onClick={() => onArchive(task.id)}
                        className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Archived section */}
            {archivedTasks.length > 0 && (
              <>
                <button
                  onClick={() => setShowArchived(v => !v)}
                  className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Archived</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-300">{archivedTasks.length}</span>
                  <ChevronDown size={14} className={`text-gray-300 transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                </button>
                {showArchived && archivedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3 bg-gray-50/30">
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' }}
                    >
                      <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 line-through truncate">{task.title}</p>
                      <span className="text-xs text-gray-300">
                        {task.archived_at ? `Archived ${new Date(task.archived_at).toLocaleDateString()}` : task.project?.name || 'Unknown Project'}
                      </span>
                    </div>
                    <button
                      onClick={() => onRestore(task.id)}
                      className="text-xs font-medium text-gray-300 hover:text-gray-600 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// StatsCards
// ============================================================================
function StatsCards({ projects, onCardClick }) {
  const counts = useMemo(() => {
    const inProgress = projects.filter(p => p.status === 'in_progress').length
    const atRisk = projects.filter(p => p.status === 'at_risk').length
    const completed = projects.filter(p => p.status === 'completed').length
    const planning = projects.filter(p => p.status === 'planning').length
    return { total: projects.length, inProgress, atRisk, completed, planning }
  }, [projects])

  const cards = [
    { label: 'Total Projects', value: counts.total, dot: null, filterStatus: 'all', segments: [{ pct: counts.total ? (counts.inProgress / counts.total) * 100 : 0, color: '#22C55E' }, { pct: counts.total ? (counts.atRisk / counts.total) * 100 : 0, color: '#EAB308' }] },
    { label: 'In Progress', value: counts.inProgress, dot: '#22C55E', filterStatus: 'in_progress', segments: [{ pct: counts.total ? (counts.inProgress / counts.total) * 100 : 0, color: '#22C55E' }] },
    { label: 'At Risk', value: counts.atRisk, dot: '#EAB308', filterStatus: 'at_risk', segments: [{ pct: counts.total ? (counts.atRisk / counts.total) * 100 : 0, color: '#EAB308' }] },
    { label: 'Completed', value: counts.completed, dot: '#3B82F6', filterStatus: 'completed', segments: [{ pct: counts.total ? (counts.completed / counts.total) * 100 : 0, color: '#3B82F6' }] },
    { label: 'Starting', value: counts.planning, dot: '#6B7280', filterStatus: 'planning', segments: [{ pct: counts.total ? (counts.planning / counts.total) * 100 : 0, color: '#6B7280' }] },
  ]

  return (
    <div className="mb-6 -mr-4 lg:mr-0">
      <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pr-4 lg:pr-0">
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={() => card.filterStatus && onCardClick(card.filterStatus)}
            className="bg-white p-5 relative flex-shrink-0 min-w-[180px] lg:min-w-0 snap-start"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)', cursor: card.filterStatus ? 'pointer' : 'default' }}
          >
            {card.dot && <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: card.dot }} />}
            <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>{card.label}</p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>{card.value}</span>
              <span className="text-sm font-medium" style={{ color: '#919191' }}>Projects</span>
            </div>
            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden flex mb-2">
              {card.segments.map((seg, j) => (
                <div key={j} className="h-full" style={{ width: `${seg.pct}%`, backgroundColor: seg.color }} />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">View</span>
              {card.filterStatus && <ChevronRight size={16} className="text-gray-400" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// FinancialsPanel (admin only)
// ============================================================================
function FinancialsPanel({ invoices, loading }) {
  const openInvoices = useMemo(() =>
    invoices.filter(inv => {
      const balance = parseFloat(inv.balance_due ?? inv.balance) || 0
      return inv.status !== 'Paid' && balance > 0
    }).slice(0, 8),
    [invoices]
  )

  return (
    <div className="bg-white p-5" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Financials</h3>
        <span className="text-xs text-gray-400">Open Invoices</span>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : openInvoices.length === 0 ? (
        <p className="text-sm text-gray-400">No open invoices right now.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 pb-2 border-b border-gray-100 mb-1">
            <span className="text-xs font-medium text-gray-500">Invoice #</span>
            <span className="text-xs font-medium text-gray-500">Customer</span>
            <span className="text-xs font-medium text-gray-500 text-right">Balance Due</span>
          </div>
          <div>
            {openInvoices.map((inv, i) => (
              <div key={inv.id || i} className="grid grid-cols-3 gap-2 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium truncate" style={{ color: '#1D1D1F' }}>{inv.invoice_number || inv.external_doc_number || '--'}</span>
                <span className="text-sm text-gray-600 truncate">{inv.customer_name || '--'}</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(inv.balance_due ?? inv.balance)}</p>
                  {inv.due_date && (
                    <p className={`text-xs ${isOverdue(inv.due_date) ? 'text-red-500' : 'text-gray-400'}`}>Due {formatDate(inv.due_date)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// DueThisWeekPanel (admin only)
// ============================================================================
function DueThisWeekPanel({ tasks, loading, onToggle, completedSet, onNavigateToProject }) {
  const dueThisWeek = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + 7)
    cutoff.setHours(23, 59, 59, 999)
    return tasks.filter(t => t.due_date && new Date(t.due_date) <= cutoff)
  }, [tasks])

  return (
    <div className="bg-white p-5" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Due This Week</h3>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : dueThisWeek.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing due in the next 7 days.</p>
      ) : (
        <div className="space-y-3">
          {dueThisWeek.map((task) => {
            const projectId = task.project_id || task.project?.id
            const done = completedSet.has(task.id)
            return (
              <div key={task.id} className="flex items-start gap-3">
                <button
                  onClick={() => onToggle(task.id, task.status)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${done ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-400'}`}
                >
                  {done && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</p>
                  <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-1">
                    {projectId ? (
                      <button onClick={() => onNavigateToProject(projectId)} className="hover:underline hover:text-gray-800 transition-colors">
                        {task.project?.name || 'Unknown Project'}
                      </button>
                    ) : (
                      <span>{task.project?.name || 'Unknown Project'}</span>
                    )}
                    {task.due_date && (
                      <span className={isOverdue(task.due_date) ? 'text-red-500' : ''}>• Due {formatDate(task.due_date)}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// MyProjectsPanel (employee only)
// ============================================================================
function StatusBadge({ status }) {
  const map = {
    in_progress: { label: 'In Progress', color: '#22C55E' },
    at_risk: { label: 'At Risk', color: '#EAB308' },
    completed: { label: 'Completed', color: '#3B82F6' },
    planning: { label: 'Starting', color: '#6B7280' },
    on_hold: { label: 'On Hold', color: '#9CA3AF' },
  }
  const cfg = map[status] || { label: status, color: '#9CA3AF' }
  return <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
}

function MyProjectsPanel({ projects, loading, onViewProject }) {
  return (
    <div className="bg-white p-5" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>My Projects</h3>
      </div>
      {loading ? (
        <p className="text-sm text-gray-400">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-gray-400">No projects assigned to you.</p>
      ) : (
        <div>
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded"
              onClick={() => onViewProject(project.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                <p className="text-xs text-gray-500">{project.project_number}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={project.status} />
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Dashboard
// ============================================================================
function Dashboard({ user }) {
  const navigate = useNavigate()
  const { profile } = useCurrentProfile()
  const isAdmin = profile?.role === 'admin'

  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [completedTasks, setCompletedTasks] = useState(new Set())
  const [archivedTasks, setArchivedTasks] = useState(new Set())

  const { projects: allProjects } = useProjects({ limit: 500 })

  const { tasks: allTasks, loading: allTasksLoading, refetch: refetchTasks } = useTasks({
    sortBy: 'due_date',
    limit: 150,
  })

  // My tasks: everything assigned to me (active + completed + archived) for Action Center
  const myTasks = useMemo(
    () => allTasks.filter(t => t.assigned_to === user?.id),
    [allTasks, user?.id]
  )

  // Active non-archived tasks for Due This Week panel (admin)
  const activeTasksForDuePanel = useMemo(
    () => allTasks.filter(t =>
      !t.is_archived &&
      !archivedTasks.has(t.id) &&
      t.status !== 'completed' &&
      !completedTasks.has(t.id)
    ),
    [allTasks, archivedTasks, completedTasks]
  )

  const { invoices, loading: invoicesLoading } = useQuickBooksInvoices({ limit: 50 })

  const { projects: myProjects, loading: myProjectsLoading } = useProjects({
    limit: 20,
    sortBy: 'updated_at',
    sortOrder: 'desc',
  })

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed'
    setCompletedTasks(prev => {
      const next = new Set(prev)
      newStatus === 'completed' ? next.add(taskId) : next.delete(taskId)
      return next
    })
    await updateTask(taskId, { status: newStatus })
    refetchTasks()
  }

  const handleArchiveTask = useCallback(async (taskId) => {
    setArchivedTasks(prev => new Set(prev).add(taskId))
    await updateTask(taskId, { is_archived: true, archived_at: new Date().toISOString() })
    refetchTasks()
  }, [refetchTasks])

  const handleRestoreTask = useCallback(async (taskId) => {
    setArchivedTasks(prev => { const next = new Set(prev); next.delete(taskId); return next })
    await updateTask(taskId, { is_archived: false, archived_at: null, status: 'in_progress' })
    refetchTasks()
  }, [refetchTasks])

  const handleCardClick = (filterStatus) => {
    if (filterStatus === 'all') {
      navigate('/projects')
    } else {
      navigate('/projects', { state: { statusFilter: filterStatus } })
    }
  }
  const handleNavigateToProject = (id) => navigate(`/projects/${id}`)
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <GlobalNav user={user} activeNav="dashboard">

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
          {getGreeting()}, {firstName}
        </h2>
        <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
          <button
            className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#1D1D1F' }}
            onClick={() => setShowNewProjectModal(true)}
          >
            New Project
          </button>
          <button
            className="w-full lg:w-auto px-5 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors"
            style={{ color: '#111111', border: '1px solid #111111' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#111111'; e.currentTarget.style.color = '#FFFFFF' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#111111' }}
            onClick={() => setShowNewTaskModal(true)}
          >
            New Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards projects={allProjects} onCardClick={handleCardClick} />

      {/* Notifications Strip -- conditional, disappears when all read */}
      <NotificationsStrip userId={user?.id} />

      {/* Action Center -- full width, always present */}
      <ActionCenter
        tasks={myTasks}
        loading={allTasksLoading}
        onToggle={handleToggleTask}
        onArchive={handleArchiveTask}
        onRestore={handleRestoreTask}
        completedSet={completedTasks}
        archivedSet={archivedTasks}
        onNavigateToProject={handleNavigateToProject}
      />

      {/* Role-based 50/50 below */}
      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FinancialsPanel invoices={invoices} loading={invoicesLoading} />
          <DueThisWeekPanel
            tasks={activeTasksForDuePanel}
            loading={allTasksLoading}
            onToggle={handleToggleTask}
            completedSet={completedTasks}
            onNavigateToProject={handleNavigateToProject}
          />
        </div>
      ) : (
        <MyProjectsPanel
          projects={myProjects}
          loading={myProjectsLoading}
          onViewProject={handleNavigateToProject}
        />
      )}

      <TaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSuccess={() => { setShowNewTaskModal(false); refetchTasks() }}
      />
      <CreateProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSuccess={() => setShowNewProjectModal(false)}
      />
    </GlobalNav>
  )
}

export default Dashboard
