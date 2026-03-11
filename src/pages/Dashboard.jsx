import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlobalNav from '../components/GlobalNav'
import TaskModal from '../components/modals/TaskModal'
import CreateProjectModal from '../components/modals/CreateProjectModal'
import { useTasks, updateTask } from '../hooks/useTasks'

// Mock data based on Figma design
const stats = [
  { 
    label: 'Total Projects', 
    value: 40, 
    subtitle: '22 In Progress • 3 At Risk',
    showArrow: false,
    filterValue: null,
    progressSegments: [
      { percent: 55, color: '#22C55E' },
      { percent: 7.5, color: '#EAB308' },
    ]
  },
  { 
    label: 'In Progress', 
    value: 22, 
    subtitle: '-2 since last week',
    statusDot: '#22C55E',
    showArrow: true,
    filterValue: 'in_progress',
    progressSegments: [
      { percent: 55, color: '#22C55E' },
    ]
  },
  { 
    label: 'At Risk', 
    value: 3, 
    subtitle: 'View',
    statusDot: '#EAB308',
    showArrow: true,
    filterValue: null,
    progressSegments: [
      { percent: 7.5, color: '#EAB308' },
    ]
  },
  { 
    label: 'Completed', 
    value: 4, 
    subtitle: '↑ 33% from last month',
    statusDot: '#3B82F6',
    showArrow: false,
    filterValue: null,
    progressSegments: [
      { percent: 10, color: '#3B82F6' },
    ]
  },
  { 
    label: 'Starting', 
    value: 11, 
    subtitle: 'View',
    statusDot: '#6B7280',
    showArrow: true,
    filterValue: 'planning',
    progressSegments: [
      { percent: 27.5, color: '#6B7280' },
    ]
  },
]

const myTasks = [
  { id: 1, title: 'Inspect Job Site A', project: 'Project Alpha', assignee: 'J. O\'Berry', avatar: 'JO' },
  { id: 2, title: 'Meet Client for Walkthrough', project: 'Project Bravo', assignee: 'J. O\'Berry', avatar: 'JO' },
  { id: 3, title: 'Mark Hazards for Removal', project: 'Project Alpha', assignee: 'J. O\'Berry', avatar: 'JO' },
  { id: 4, title: 'Approve Material Purchase Request', project: 'Project Alpha', assignee: 'J. O\'Berry', avatar: 'JO' },
  { id: 5, title: 'Submit Final Invoice', project: 'Project Foxtrot', assignee: 'J. Vandervennet', avatar: 'JV' },
  { id: 6, title: 'Confirm Dumpster Delivery', project: 'Project Charlie', assignee: 'J. O\'Berry', avatar: 'JO' },
  { id: 7, title: 'Walk Foundation with Client', project: 'Project Delta', assignee: 'J. Vandervennet', avatar: 'JV' },
  { id: 8, title: 'Schedule Framing Inspection', project: 'Project Alpha', assignee: 'J. O\'Berry', avatar: 'JO' },
  { id: 9, title: 'Upload Signed Change Order', project: 'Project Bravo', assignee: 'J. Vandervennet', avatar: 'JV' },
  { id: 10, title: 'Finalize Paint Color Approvals', project: 'Project Echo', assignee: 'J. O\'Berry', avatar: 'JO' },
  { id: 11, title: 'Confirm HVAC Delivery', project: 'Project Foxtrot', assignee: 'J. Vandervennet', avatar: 'JV' },
]

const financials = [
  { id: '45678', amount: '$67,890.00', drawDate: '05/25/25', status: 'On Time' },
  { id: '45678', amount: '$67,890.00', drawDate: '05/25/25', status: 'On Time' },
  { id: '45678', amount: '$67,890.00', drawDate: '05/25/25', status: 'On Time' },
  { id: '45678', amount: '$67,890.00', drawDate: '05/25/25', status: 'On Time' },
]

const dueThisWeek = [
  { id: 1, title: 'Signed Contract Upload', project: 'Project Alpha', date: 'May 14', icon: 'document', overdue: true },
  { id: 2, title: 'Review Subcontractor Proposal', project: 'Project Gamma', date: 'May 14', icon: 'money', overdue: true },
  { id: 3, title: 'Schedule Inspection', project: 'Project Echo', date: 'May 15', icon: 'calendar', overdue: true },
  { id: 4, title: 'Permits Need To Be Uploaded', project: 'Project Foxtrot', date: 'May 16', icon: 'upload', overdue: false },
  { id: 5, title: 'Schedule Electrical Rough-In Inspection', project: 'Project Echo', date: 'May 16', icon: 'calendar', overdue: false },
  { id: 6, title: 'Submit Subcontractor Payment Application', project: 'Project Delta', date: 'May 18', icon: 'send', overdue: false },
]

function Dashboard({ user }) {
  const navigate = useNavigate()
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)

  // Fetch tasks assigned to the current user
  const { tasks: myTasks, loading: tasksLoading, refetch: refetchTasks } = useTasks({
    assignedTo: user?.id,
    status: ['not_started', 'in_progress', 'blocked'], // Exclude completed/cancelled
    sortBy: 'due_date',
    sortOrder: 'asc',
    limit: 20,
  })

  const toggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'not_started' : 'completed'
    try {
      await updateTask(taskId, { status: newStatus })
      refetchTasks()
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  return (
    <GlobalNav user={user} activeNav="dashboard">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
          Admin Dashboard
        </h2>
        
        {/* Action Buttons */}
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
            onClick={() => setShowNewTaskModal(true)}
          >
            New Task
          </button>
        </div>
      </div>

      {/* Stats Cards - Horizontal scroll on mobile, 5 columns on desktop */}
      <div className="mb-6 -mr-4 lg:mr-0">
        <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory stats-scroll pr-4 lg:pr-0">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-5 relative flex-shrink-0 min-w-[180px] lg:min-w-0 snap-start"
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
                <span className="text-sm font-medium" style={{ color: '#919191' }}>
                  Projects
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden flex mb-2">
                {stat.progressSegments.map((segment, idx) => (
                  <div 
                    key={idx}
                    className="h-full"
                    style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
                  />
                ))}
              </div>
              
              <div className="flex items-center justify-between">
                {stat.showArrow ? (
                  <button
                    onClick={() => navigate('/projects', { state: { statusFilter: stat.filterValue } })}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <span>{stat.subtitle}</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-gray-500">{stat.subtitle}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Today's Tasks */}
        <div 
          className="bg-white p-5"
          style={{
            borderRadius: '16px',
            boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>My Tasks</h3>
            <button className="text-sm text-gray-500 flex items-center gap-1">
              View All <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Loading */}
          {tasksLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-gray-600" />
            </div>
          )}

          {/* Empty state */}
          {!tasksLoading && myTasks.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No tasks assigned to you.</p>
          )}

          {/* Task list */}
          {!tasksLoading && myTasks.length > 0 && (
            <div className="space-y-3">
              {myTasks.map((task) => {
                const isCompleted = task.status === 'completed'
                const initials = task.assigned_user?.full_name
                  ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
                return (
                  <div key={task.id} className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isCompleted
                          ? 'bg-gray-900 border-gray-900'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {isCompleted && <CheckIcon className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {task.project?.name || 'No project'}
                        {task.due_date && ` • Due ${new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
                    >
                      {initials}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
                
        </div>

        {/* Right Column - Financials + Due This Week stacked */}
        <div className="flex flex-col gap-6">
          {/* Financials */}
          <div 
            className="bg-white p-5"
            style={{
              borderRadius: '16px',
              boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Financials</h3>
              <button className="text-sm text-gray-500 flex items-center gap-1">
                View All <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-4 pb-2 border-b border-gray-100 mb-2">
              <span className="text-xs font-medium text-gray-500">Open Invoices</span>
              <span className="text-xs font-medium text-gray-500">Invoice Amount</span>
              <span className="text-xs font-medium text-gray-500">Draw Dates</span>
            </div>
            
            {/* Table Rows */}
            <div className="space-y-2">
              {financials.map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-blue-600 underline cursor-pointer">{item.id}</span>
                  <span className="text-sm text-gray-900">{item.amount}</span>
                  <span className="text-sm text-green-600">{item.drawDate} ({item.status})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Due This Week */}
          <div 
            className="bg-white p-5"
            style={{
              borderRadius: '16px',
              boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Due This Week</h3>
              <button className="text-sm text-gray-500 flex items-center gap-1">
                View All <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {dueThisWeek.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center gap-3 py-2"
                >
                  <DueIcon name={item.icon} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.project}</p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium flex-shrink-0 ${
                    item.overdue ? 'text-red-600' : 'text-gray-500'
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

      <TaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        onSuccess={() => { setShowNewTaskModal(false); refetchTasks(); }}
      />

      <CreateProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSuccess={() => setShowNewProjectModal(false)}
      />
    </GlobalNav>
  )
}

// Page-specific Icon Components
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

export default Dashboard