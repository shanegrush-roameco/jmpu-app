// src/pages/Reports.jsx
// Sprint 11: Reports page connected to live Supabase data
// Uses GlobalNav as wrapper (correct pattern from Sprint 5)
// ============================================================================

import { useState, useEffect } from 'react'
import GlobalNav from '../components/GlobalNav'
import AISummaryModal from '../components/modals/AISummaryModal'
import DatePicker from '../components/DatePicker'
import { Warning, ChevronDown } from '@carbon/icons-react'
import {
  useFinancialOutlook,
  useDrawsSummary,
  useActionCenter,
  useProjectsForFilter,
} from '../hooks/useReports'

function Reports({ user }) {
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  
  // Date range state - default to current quarter
  const now = new Date()
  const currentQuarter = Math.floor(now.getMonth() / 3)
  const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
  const quarterEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0)
  
  const [financialStartDate, setFinancialStartDate] = useState(
    quarterStart.toISOString().split('T')[0]
  )
  const [financialEndDate, setFinancialEndDate] = useState(
    quarterEnd.toISOString().split('T')[0]
  )
  const [drawsStartDate, setDrawsStartDate] = useState(
    quarterStart.toISOString().split('T')[0]
  )
  const [drawsEndDate, setDrawsEndDate] = useState(
    quarterEnd.toISOString().split('T')[0]
  )
  
  // =========================================================================
  // Data Hooks - Connected to Supabase
  // =========================================================================

  const {
    data: financialData,
    loading: financialLoading,
    error: financialError,
  } = useFinancialOutlook({
    startDate: financialStartDate,
    endDate: financialEndDate,
  })

  const {
    data: drawsData,
    loading: drawsLoading,
    error: drawsError,
  } = useDrawsSummary({
    startDate: drawsStartDate,
    endDate: drawsEndDate,
  })

  const {
    items: actionCenterData,
    loading: actionCenterLoading,
    error: actionCenterError,
  } = useActionCenter({
    projectId: selectedProjectId,
    limit: 10,
  })

  const { projects: projectsFilter, loading: projectsLoading } = useProjectsForFilter()

  // =========================================================================
  // Event Handlers
  // =========================================================================

  const handleProjectChange = (e) => {
    const value = e.target.value
    setSelectedProjectId(value === 'all' ? null : value)
  }

  // =========================================================================
  // Formatters
  // =========================================================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // =========================================================================
  // Calculated Values
  // =========================================================================

  const totalFinancial = (financialData?.income || 0) + (financialData?.expenses || 0)
  const incomePercent = totalFinancial > 0 
    ? ((financialData?.income || 0) / totalFinancial) * 100 
    : 50
  const expensesPercent = 100 - incomePercent

  const drawsTotal = drawsData?.total || 1
  const pendingPercent = (drawsData?.pending || 0) / drawsTotal * 100

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <GlobalNav user={user} activeNav="reports">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
          Reports
        </h2>
        
        <button
          onClick={() => setAiSummaryOpen(true)}
          className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#1D1D1F' }}
        >
          AI Summary
        </button>
      </div>

      {/* Financial Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Outlook Card */}
        <div 
          className="bg-white p-5"
          style={{
            borderRadius: '16px',
            boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: '#1D1D1F' }}>
            Financial Outlook
          </h3>
          
          {financialLoading ? (
            <div className="animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="flex-1 h-16 bg-gray-100 rounded-lg"></div>
                <div className="flex-1 h-16 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full mb-4"></div>
            </div>
          ) : financialError ? (
            <div className="text-red-500 text-sm py-4">{financialError}</div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-0 mb-3">
                <div 
                  className="flex-1 py-3 px-4 text-center"
                  style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
                >
                  <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#22C55E' }}>
                    {formatCurrency(financialData?.income || 0)}
                  </span>
                  <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Income</span>
                </div>
                <div 
                  className="flex-1 py-3 px-4 text-center"
                  style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
                >
                  <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#EF4444' }}>
                    {formatCurrency(financialData?.expenses || 0)}
                  </span>
                  <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Expenses</span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-4">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ width: `${incomePercent}%`, backgroundColor: '#22C55E' }}
                />
                <div 
                  className="h-full transition-all duration-500"
                  style={{ width: `${expensesPercent}%`, backgroundColor: '#EF4444' }}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <DatePicker
              label="Start Date"
              value={financialStartDate}
              onChange={setFinancialStartDate}
            />
            <DatePicker
              label="End Date"
              value={financialEndDate}
              onChange={setFinancialEndDate}
            />
          </div>

          <button 
            className="w-full py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#111111', border: '1px solid #E5E7EB' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            View Report
          </button>
        </div>

        {/* Draws Summary Card */}
        <div 
          className="bg-white p-5"
          style={{
            borderRadius: '16px',
            boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: '#1D1D1F' }}>
            Draws Summary
          </h3>
          
          {drawsLoading ? (
            <div className="animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="flex-1 h-16 bg-gray-100 rounded-lg"></div>
                <div className="flex-1 h-16 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full mb-4"></div>
            </div>
          ) : drawsError ? (
            <div className="text-red-500 text-sm py-4">{drawsError}</div>
          ) : (
            <>
              <div className="flex flex-col lg:flex-row gap-3 lg:gap-0 mb-3">
                <div 
                  className="flex-1 py-3 px-4 text-center"
                  style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
                >
                  <div className="hidden lg:block">
                    <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#EF4444' }}>
                      {formatCurrency(drawsData?.pending || 0)}
                    </span>
                    <span className="text-xl lg:text-2xl font-semibold mx-1" style={{ color: '#6B7280' }}>/</span>
                    <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#6B7280' }}>
                      {formatCurrency(drawsData?.total || 0)}
                    </span>
                    <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Total</span>
                  </div>
                  <div className="lg:hidden">
                    <span className="text-xl font-semibold" style={{ color: '#EF4444' }}>
                      {formatCurrency(drawsData?.pending || 0)}
                    </span>
                    <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Pending</span>
                  </div>
                </div>
                <div 
                  className="flex-1 py-3 px-4 text-center"
                  style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
                >
                  <div className="hidden lg:block">
                    <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#22C55E' }}>
                      {formatCurrency(drawsData?.completed || 0)}
                    </span>
                    <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Completed</span>
                  </div>
                  <div className="lg:hidden">
                    <span className="text-xl font-semibold" style={{ color: '#6B7280' }}>
                      {formatCurrency(drawsData?.total || 0)}
                    </span>
                    <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Total</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-4">
                <div 
                  className="h-full transition-all duration-500"
                  style={{ width: `${pendingPercent}%`, backgroundColor: '#EF4444' }}
                />
                <div 
                  className="h-full transition-all duration-500"
                  style={{ width: `${100 - pendingPercent}%`, backgroundColor: '#22C55E' }}
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            <DatePicker
              label="Start Date"
              value={drawsStartDate}
              onChange={setDrawsStartDate}
            />
            <DatePicker
              label="End Date"
              value={drawsEndDate}
              onChange={setDrawsEndDate}
            />
          </div>

          <button 
            className="w-full py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#111111', border: '1px solid #E5E7EB' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            View Report
          </button>
        </div>
      </div>

      {/* Action Center - Full Width */}
      <div>
        <div 
          className="bg-white p-5"
          style={{
            borderRadius: '16px',
            boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Action Center</h3>
            
            <div className="relative">
              <select
                value={selectedProjectId || 'all'}
                onChange={handleProjectChange}
                disabled={projectsLoading}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                style={{ color: '#374151' }}
              >
                <option value="all">All Projects</option>
                {projectsFilter.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {actionCenterLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-start gap-3 py-3">
                  <div className="w-5 h-5 bg-gray-100 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : actionCenterError ? (
            <div className="text-red-500 text-sm py-4">{actionCenterError}</div>
          ) : actionCenterData.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">
              No urgent items requiring attention
            </div>
          ) : (
            <div className="space-y-1">
              {actionCenterData.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
                >
                  <Warning 
                    size={20} 
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: item.urgent ? '#EF4444' : '#F59E0B' }}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium" 
                      style={{ color: item.urgent ? '#EF4444' : '#1D1D1F' }}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      {item.project} • {item.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Summary Modal - company-wide, financials included (admin only page) */}
      <AISummaryModal
        isOpen={aiSummaryOpen}
        onClose={() => setAiSummaryOpen(false)}
        project={{
          name: 'JMPU Company Overview',
          summary_scope: 'Company Overview',
          status: 'Active',
          income: financialData?.income,
          expenses: financialData?.expenses,
          draws_total: drawsData?.total,
          draws_completed: drawsData?.completed,
          draws_pending: drawsData?.pending,
        }}
        tasks={actionCenterData.map(item => ({
          id: item.id,
          title: item.title,
          status: item.status,
          project: item.project,
          urgent: item.urgent,
        }))}
        showFinancials={true}
      />
    </GlobalNav>
  )
}

export default Reports
