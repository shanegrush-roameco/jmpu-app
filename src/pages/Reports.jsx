// src/pages/Reports.jsx
// Sprint 11: Reports page connected to live Supabase data
// Uses GlobalNav as wrapper (correct pattern from Sprint 5)
// ============================================================================

import { useState, useEffect } from 'react'
import GlobalNav from '../components/GlobalNav'
import DatePicker from '../components/DatePicker'
import { Warning, ChevronRight } from '@carbon/icons-react'
import {
  useFinancialOutlook,
  useDrawsSummary,
  useJobs,
  useActionCenter,
  useContractors,
  useProjectsForFilter,
} from '../hooks/useReports'
import { generateAndDownloadReport } from '../lib/exportUtils'
import { VerificationBadge } from '../components/FinancialValidation'
import { useVerificationBadges } from '../hooks/useFinancialValidation'

// Quarter options for report generation
const quarterOptions = [
  'This Quarter (Q2 2025)',
  'Last Quarter (Q1 2025)',
  'Q4 2024',
  'Q3 2024',
  'Custom Range',
]

function Reports({ user }) {
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [completedJobs, setCompletedJobs] = useState(new Set())
  const [selectedContractorId, setSelectedContractorId] = useState(null)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  
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
  
  // Generate Report modal state
  const [reportConfig, setReportConfig] = useState({
    range: 'This Quarter (Q2 2025)',
    financialOutlook: true,
    drawsSummary: false,
    contractors: false,
    subcontractors: false,
    formatPdf: false,
    formatExcel: true,
    formatGoogleDoc: false,
  })

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
    jobs: jobsData,
    loading: jobsLoading,
    error: jobsError,
  } = useJobs({
    contractorId: selectedContractorId,
    limit: 10,
  })

  const {
    items: actionCenterData,
    loading: actionCenterLoading,
    error: actionCenterError,
  } = useActionCenter({
    projectId: selectedProjectId,
    limit: 10,
  })

  const { contractors, loading: contractorsLoading } = useContractors()
  const { projects: projectsFilter, loading: projectsLoading } = useProjectsForFilter()
  // Sprint 16: Verification badges
  const projectIdsForBadges = [
    ...jobsData.map(j => j.project_id),
    ...actionCenterData.map(a => a.project_id),
  ].filter(Boolean)
  const { badges: verificationBadges } = useVerificationBadges(projectIdsForBadges)

  // =========================================================================
  // Event Handlers
  // =========================================================================

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && generateModalOpen) {
        setGenerateModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [generateModalOpen])

  const toggleJob = (jobId) => {
    setCompletedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const handleConfigChange = (field) => {
    setReportConfig(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleContractorChange = (e) => {
    const value = e.target.value
    setSelectedContractorId(value === 'all' ? null : value)
  }

  const handleProjectChange = (e) => {
    const value = e.target.value
    setSelectedProjectId(value === 'all' ? null : value)
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setGenerateError(null)

    try {
      await generateAndDownloadReport(reportConfig)
      setGenerateModalOpen(false)
    } catch (error) {
      console.error('Error generating report:', error)
      setGenerateError(error.message || 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
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
          onClick={() => setGenerateModalOpen(true)}
          className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#1D1D1F' }}
        >
          Generate Report
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

      {/* Jobs & Action Center Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs Card */}
        <div 
          className="bg-white p-5"
          style={{
            borderRadius: '16px',
            boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Jobs</h3>
            
            <div className="relative">
              <select
                value={selectedContractorId || 'all'}
                onChange={handleContractorChange}
                disabled={contractorsLoading}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                style={{ color: '#374151' }}
              >
                <option value="all">All Contractors</option>
                {contractors.map(contractor => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {jobsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 py-3">
                  <div className="w-5 h-5 bg-gray-100 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobsError ? (
            <div className="text-red-500 text-sm py-4">{jobsError}</div>
          ) : jobsData.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">
              No jobs requiring attention
            </div>
          ) : (
            <div className="space-y-1">
              {jobsData.map((job) => (
                <div 
                  key={job.id} 
                  className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <button
                    onClick={() => toggleJob(job.id)}
                    className={`hidden lg:flex w-5 h-5 rounded-full border-2 items-center justify-center flex-shrink-0 transition-colors ${
                      completedJobs.has(job.id)
                        ? 'bg-gray-900 border-gray-900'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {completedJobs.has(job.id) && (
                      <CheckIcon className="w-3 h-3 text-white" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${completedJobs.has(job.id) ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {job.title}
                    </p>
                    <p className="text-xs">
                      <span style={{ color: '#6B7280' }}>{job.project}</span>
                      <span style={{ color: '#6B7280' }}> • </span>
                      <span style={{ color: job.status === 'Signed Off' ? '#22C55E' : '#EF4444' }}>
                        {job.status}
                      </span>
                    </p>
                  </div>

                  <ChevronRight size={16} className="lg:hidden text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Center Card */}
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
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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

      {/* Generate Report Modal */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setGenerateModalOpen(false)}
          />
          
          <div 
            className="relative bg-white w-full max-w-md p-6"
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)'
            }}
          >
            <button 
              onClick={() => setGenerateModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>

            <h3 className="text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
              Generate Report
            </h3>

            <p className="text-sm font-medium mb-3" style={{ color: '#1D1D1F' }}>
              Include The Following:
            </p>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Select Range</label>
              <div className="relative">
                <select
                  value={reportConfig.range}
                  onChange={(e) => setReportConfig(prev => ({ ...prev, range: e.target.value }))}
                  className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  style={{ color: '#374151' }}
                >
                  {quarterOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.financialOutlook}
                  onChange={() => handleConfigChange('financialOutlook')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-sm" style={{ color: '#374151' }}>Financial Outlook</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.drawsSummary}
                  onChange={() => handleConfigChange('drawsSummary')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-sm" style={{ color: '#374151' }}>Draws Summary</span>
              </label>
            </div>

            <p className="text-sm font-medium mb-3" style={{ color: '#1D1D1F' }}>
              Contractors:
            </p>
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.contractors}
                  onChange={() => handleConfigChange('contractors')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-sm" style={{ color: '#374151' }}>Contractors</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.subcontractors}
                  onChange={() => handleConfigChange('subcontractors')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-sm" style={{ color: '#374151' }}>Subcontractors</span>
              </label>
            </div>

            <p className="text-sm font-medium mb-3" style={{ color: '#1D1D1F' }}>
              Format:
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.formatPdf}
                  onChange={() => handleConfigChange('formatPdf')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-sm" style={{ color: '#374151' }}>PDF</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.formatExcel}
                  onChange={() => handleConfigChange('formatExcel')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-sm" style={{ color: '#374151' }}>Microsoft Excel</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportConfig.formatGoogleDoc}
                  onChange={() => handleConfigChange('formatGoogleDoc')}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                />
                <span className="text-sm" style={{ color: '#374151' }}>Google Doc</span>
              </label>
            </div>

            {generateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{generateError}</p>
              </div>
            )}

            <div className="flex flex-col-reverse lg:flex-row gap-3">
              <button 
                onClick={() => setGenerateModalOpen(false)}
                disabled={isGenerating}
                className="flex-1 px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ color: '#111111', border: '1px solid #111111' }}
                onMouseEnter={(e) => {
                  if (!isGenerating) {
                    e.currentTarget.style.backgroundColor = '#111111'
                    e.currentTarget.style.color = '#FFFFFF'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#111111'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerateReport}
                disabled={isGenerating || (!reportConfig.formatPdf && !reportConfig.formatExcel && !reportConfig.formatGoogleDoc)}
                className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1D1D1F' }}
              >
                {isGenerating ? 'Generating...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </GlobalNav>
  )
}

// Icon Components
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

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default Reports
