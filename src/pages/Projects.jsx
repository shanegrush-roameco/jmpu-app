// src/pages/Projects.jsx
// Sprint 8: Projects page with Supabase CRUD operations
// Uses GlobalNav as wrapper (correct pattern from Sprint 7)
// ============================================================================

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import GlobalNav from '../components/GlobalNav'
import CreateProjectModal from '../components/modals/CreateProjectModal'
import AISummaryModal from '../components/modals/AISummaryModal'
import { useProjects } from '../hooks/useProjects'
import { useCurrentProfile } from '../hooks/useCurrentProfile'

// Status configuration with colors (matching database enum values)
const statusConfig = {
  'planning': { label: 'Planning', color: '#6B7280', bgColor: '#F3F4F6', textColor: '#374151' },
  'in_progress': { label: 'In Progress', color: '#22C55E', bgColor: '#DCFCE7', textColor: '#166534' },
  'on_hold': { label: 'On Hold', color: '#F59E0B', bgColor: '#FEF3C7', textColor: '#92400E' },
  'completed': { label: 'Completed', color: '#10B981', bgColor: '#D1FAE5', textColor: '#065F46' },
  'cancelled': { label: 'Cancelled', color: '#EF4444', bgColor: '#FEE2E2', textColor: '#DC2626' },
}

// Project type labels
const projectTypeLabels = {
  'renovation': 'Renovation',
  'insurance_repair': 'Insurance Repair',
  'fire_rehabilitation': 'Fire Rehab',
  'water_damage': 'Water Damage',
  'mold_remediation': 'Mold Remediation',
  'general_construction': 'Construction',
  'demolition': 'Demolition',
  'other': 'Other',
}

function Projects({ user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(
    location.state?.statusFilter ?? 'All'
  )
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false)
  const [aiSummaryModalOpen, setAiSummaryModalOpen] = useState(false)

  const { profile } = useCurrentProfile()
  const isAdmin = profile?.role === 'admin'

  // Fetch projects from Supabase
  const { projects, loading, error, refetch } = useProjects({
    search: searchQuery,
    status: statusFilter !== 'All' ? statusFilter : null,
  })

  // Calculate summary stats from real data
  const summaryStats = {
    total: projects.length,
    planning: projects.filter(p => p.status === 'planning').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    onHold: projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
  }

  // Progress bar segments based on real data
  const getProgressSegments = () => {
    if (summaryStats.total === 0) return []
    return [
      { label: 'Planning', count: summaryStats.planning, color: '#6B7280', percent: (summaryStats.planning / summaryStats.total) * 100 },
      { label: 'In Progress', count: summaryStats.inProgress, color: '#22C55E', percent: (summaryStats.inProgress / summaryStats.total) * 100 },
      { label: 'On Hold', count: summaryStats.onHold, color: '#F59E0B', percent: (summaryStats.onHold / summaryStats.total) * 100 },
      { label: 'Completed', count: summaryStats.completed, color: '#10B981', percent: (summaryStats.completed / summaryStats.total) * 100 },
    ].filter(s => s.count > 0)
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
            onClick={() => setAiSummaryModalOpen(true)}
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
              <span className="text-4xl font-semibold" style={{ color: '#1D1D1F' }}>
                {loading ? '...' : summaryStats.total}
              </span>
              <span className="text-sm text-gray-500">Total Projects</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {summaryStats.total > 0 && (
          <>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex mb-3">
              {getProgressSegments().map((segment, index) => (
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
              {summaryStats.planning > 0 && <span>{summaryStats.planning} Planning</span>}
              {summaryStats.planning > 0 && summaryStats.inProgress > 0 && <span>•</span>}
              {summaryStats.inProgress > 0 && <span className="text-green-600">{summaryStats.inProgress} In Progress</span>}
              {summaryStats.inProgress > 0 && summaryStats.onHold > 0 && <span>•</span>}
              {summaryStats.onHold > 0 && <span>{summaryStats.onHold} On Hold</span>}
              {summaryStats.onHold > 0 && summaryStats.completed > 0 && <span>•</span>}
              {summaryStats.completed > 0 && <span>{summaryStats.completed} Completed</span>}
            </div>
          </>
        )}

        {/* Empty state for progress bar */}
        {summaryStats.total === 0 && !loading && (
          <p className="text-sm text-gray-400">No projects yet. Create your first project to get started.</p>
        )}
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
            
            {/* Status Filter */}
            <div className="flex gap-3 w-full lg:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 lg:flex-none px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8 cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
              >
                <option value="All">All</option>
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="px-6 pb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
              <button 
                onClick={refetch}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projects.length === 0 && (
          <div className="px-6 pb-6 text-center py-12">
            <p className="text-gray-500 mb-4">No projects found</p>
            <button 
              onClick={() => setNewProjectModalOpen(true)}
              className="px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#1D1D1F' }}
            >
              Create Your First Project
            </button>
          </div>
        )}

        {/* Desktop Table */}
        {!loading && !error && projects.length > 0 && (
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-gray-100">
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Asset #</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map((project) => (
                  <tr 
                    key={project.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <td className="py-4 px-6">
                      <div>
                        <span className="text-sm font-medium text-gray-900 underline">{project.name}</span>
                        <span className="block text-xs text-gray-400">{project.asset_number}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {[project.address_line1, project.city, project.state].filter(Boolean).join(', ') || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {projectTypeLabels[project.project_type] || project.project_type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">
                        {project.start_date 
                          ? new Date(project.start_date).toLocaleDateString() 
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile List */}
        {!loading && !error && projects.length > 0 && (
          <div className="lg:hidden divide-y divide-gray-100">
            {projects.map((project) => (
              <div 
                key={project.id}
                className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 underline">{project.name}</span>
                  <span className="block text-xs text-gray-400">{project.asset_number}</span>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onSuccess={() => { setNewProjectModalOpen(false); refetch() }}
      />

      <AISummaryModal
        isOpen={aiSummaryModalOpen}
        onClose={() => setAiSummaryModalOpen(false)}
        project={{
          name: 'All Projects',
          status: `${summaryStats.total} total`,
          projects: projects,
        }}
        tasks={[]}
        showFinancials={isAdmin}
      />
    </GlobalNav>
  )
}

// Status Badge Component
function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, color: '#6B7280', textColor: '#374151' }
  
  return (
    <div className="flex items-center gap-1.5">
      <span 
        className="text-sm"
        style={{ color: config.textColor }}
      >
        {config.label}
      </span>
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

export default Projects
