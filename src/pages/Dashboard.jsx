// src/pages/Dashboard.jsx
// Sprint 17: Role-based dashboard layout + live data wiring
// Admin: Rollup cards, My Tasks, Due This Week, Financials
// Employee: Rollup cards, My Projects, My Tasks
// ============================================================================

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from '@carbon/icons-react'
import GlobalNav from '../components/GlobalNav'
import TaskModal from '../components/modals/TaskModal'
import CreateProjectModal from '../components/modals/CreateProjectModal'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { useTasks, updateTask } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { useQuickBooksInvoices } from '../hooks/useQuickBooks'

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
    {
      label: 'Total Projects',
      value: counts.total,
      dot: null,
      filterStatus: null,
      segments: [
        { pct: counts.total ? (counts.inProgress / counts.total) * 100 : 0, color: '#22C55E' },
        { pct: counts.total ? (counts.atRisk / counts.total) * 100 : 0, color: '#EAB308' },
      ],
    },
    {
      label: 'In Progress',
      value: counts.inProgress,
      dot: '#22C55E',
      filterStatus: 'in_progress',
      segments: [{ pct: counts.total ? (counts.inProgress / counts.total) * 100 : 0, color: '#22C55E' }],
    },
    {
      label: 'At Risk',
      value: counts.atRisk,
      dot: '#EAB308',
      filterStatus: 'at_risk',
      segments: [{ pct: counts.total ? (counts.atRisk / counts.total) * 100 : 0, color: '#EAB308' }],
    },
    {
      label: 'Completed',
      value: counts.completed,
      dot: '#3B82F6',
      filterStatus: 'completed',
      segments: [{ pct: counts.total ? (counts.completed / counts.total) * 100 : 0, color: '#3B82F6' }],
    },
    {
      label: 'Starting',
      value: counts.planning,
      dot: '#6B7280',
      filterStatus: 'planning',
      segments: [{ pct: counts.total ? (counts.planning / counts.total) * 100 : 0, color: '#6B7280' }],
    },
  ]

  return (
    <div className="mb-6 -mr-4 lg:mr-0">
      <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pr-4 lg:pr-0">
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={() => card.filterStatus && onCardClick(card.filterStatus)}
            className="bg-white p-5 relative flex-shrink-0 min-w-[180px] lg:min-w-0 snap-start"
            style={{
              borderRadius: '16px',
              boxShadow: '2px 4px 12px rgba(0,0,0,0.08)',
              cursor: card.filterStatus ? 'pointer' : 'default',
            }}
          >
            {card.dot && (
              <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: card.dot }} />
            )}
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
// TaskRow (shared between MyTasksPanel and DueThisWeekPanel)
// ============================================================================
function TaskRow({ task, onToggle, completedSet, onNavigateToProject }) {
  const done = completedSet.has(task.id)
  const projectId = task.project_id || task.project?.id

  return (
    <div className="flex items-start gap-3">
      <button
        onClick={() => onToggle(task.id, task.status)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
          done ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {done && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.title}
        </p>
        <div className="text-xs text-gray-500 flex items-center flex-wrap gap-x-1">
          {projectId ? (
            <button
              onClick={() => onNavigateToProject(projectId)}
              className="hover:underline hover:text-gray-800 transition-colors"
            >
              {task.project?.name || 'Unknown Project'}
            </button>
          ) : (
            <span>{task.project?.name || 'Unknown Project'}</span>
          )}
          {task.due_date && (
            <span className={isOverdue(task.due_date) ? 'text-red-500' : ''}>
              • Due {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MyTasksPanel (shared)
// ============================================================================
function MyTasksPanel({ tasks, loading, onToggle, completedSet, onNavigateToProject }) {
  return (
    <div className="bg-white p-5" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>My Tasks</h3>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-400">No open tasks assigned to you.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              completedSet={completedSet}
              onNavigateToProject={onNavigateToProject}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// FinancialsPanel (admin only)
// ============================================================================
function FinancialsPanel({ invoices, loading }) {
  const openInvoices = useMemo(() =>
    invoices
      .filter(inv => {
        const balance = parseFloat(inv.balance_due ?? inv.balance) || 0
        return inv.status !== 'Paid' && balance > 0
      })
      .slice(0, 8),
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
                <span className="text-sm font-medium truncate" style={{ color: '#1D1D1F' }}>
                  {inv.invoice_number || inv.external_doc_number || '--'}
                </span>
                <span className="text-sm text-gray-600 truncate">{inv.customer_name || '--'}</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(inv.balance_due ?? inv.balance)}
                  </p>
                  {inv.due_date && (
                    <p className={`text-xs ${isOverdue(inv.due_date) ? 'text-red-500' : 'text-gray-400'}`}>
                      Due {formatDate(inv.due_date)}
                    </p>
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
          {dueThisWeek.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              completedSet={completedSet}
              onNavigateToProject={onNavigateToProject}
            />
          ))}
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

  // Project counts for stats cards
  const { projects: allProjects } = useProjects({ limit: 500 })

  // Single tasks query -- filter client-side to avoid dual queries + dual realtime subscriptions
  const { tasks: allActiveTasks, loading: allTasksLoading, refetch: refetchTasks } = useTasks({
    status: ['not_started', 'in_progress', 'blocked'],
    sortBy: 'due_date',
    limit: 100,
  })

  const myTasks = useMemo(
    () => allActiveTasks.filter(t => t.assigned_to === user?.id).slice(0, 20),
    [allActiveTasks, user?.id]
  )

  // Admin: open invoices
  const { invoices, loading: invoicesLoading } = useQuickBooksInvoices({ limit: 50 })

  // Employee: my projects (RLS-scoped)
  const { projects: myProjects, loading: myProjectsLoading } = useProjects({
    limit: 10,
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

  const handleCardClick = (filterStatus) => {
    navigate('/projects', { state: { statusFilter: filterStatus } })
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

      {/* Role-based layout */}
      {isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MyTasksPanel
            tasks={myTasks}
            loading={allTasksLoading}
            onToggle={handleToggleTask}
            completedSet={completedTasks}
            onNavigateToProject={handleNavigateToProject}
          />
          <div className="flex flex-col gap-6">
            <FinancialsPanel invoices={invoices} loading={invoicesLoading} />
            <DueThisWeekPanel
              tasks={allActiveTasks}
              loading={allTasksLoading}
              onToggle={handleToggleTask}
              completedSet={completedTasks}
              onNavigateToProject={handleNavigateToProject}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MyProjectsPanel
            projects={myProjects}
            loading={myProjectsLoading}
            onViewProject={handleNavigateToProject}
          />
          <MyTasksPanel
            tasks={myTasks}
            loading={allTasksLoading}
            onToggle={handleToggleTask}
            completedSet={completedTasks}
            onNavigateToProject={handleNavigateToProject}
          />
        </div>
      )}

      <TaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSuccess={() => setShowNewTaskModal(false)}
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
