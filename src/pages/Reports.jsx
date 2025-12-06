import { useState, useEffect } from 'react'
import GlobalNav from '../components/GlobalNav'
import DatePicker from '../components/DatePicker'
import { Warning, ChevronRight } from '@carbon/icons-react'

// Mock data based on Figma design
const financialData = {
  income: 176890,
  expenses: 36890,
}

const drawsData = {
  pending: 6890,
  total: 24598,
  completed: 26390,
}

const jobsData = [
  { id: 1, title: 'Mark Hazards for Removal', project: 'Project Alpha', status: 'Not Signed Off' },
  { id: 2, title: 'Schedule Framing Inspection', project: 'Project Alpha', status: 'Not Signed Off' },
  { id: 3, title: 'Approve Material Purchase Request', project: 'Project Alpha', status: 'Not Signed Off' },
  { id: 4, title: 'Confirm Dumpster Delivery', project: 'Project Alpha', status: 'Not Signed Off' },
  { id: 5, title: 'Meet Client for Walkthrough', project: 'Project Alpha', status: 'Not Signed Off' },
]

const actionCenterData = [
  { id: 1, title: 'Schedule Framing Inspection', project: 'Project Alpha', status: 'Overdue 2 Days', urgent: true },
  { id: 2, title: 'Approve Material Purchase Request', project: 'Project Alpha', status: 'Due Today', urgent: true },
  { id: 3, title: 'Task Name', project: 'Project Alpha', status: 'Due Today', urgent: false },
]

const contractorOptions = ['Killowen Construction', 'ABC Builders', 'XYZ Contractors']
const projectOptions = ['Project Alpha', 'Project Bravo', 'Project Charlie', 'Project Delta']

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
  const [selectedContractor, setSelectedContractor] = useState('Killowen Construction')
  const [selectedProject, setSelectedProject] = useState('Project Alpha')
  
  // Date range state
  const [financialStartDate, setFinancialStartDate] = useState('2025-04-01')
  const [financialEndDate, setFinancialEndDate] = useState('2025-07-01')
  const [drawsStartDate, setDrawsStartDate] = useState('2025-04-01')
  const [drawsEndDate, setDrawsEndDate] = useState('2025-07-01')
  
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

  // Close modal on ESC key
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    })
  }

  // Calculate progress percentages
  const incomePercent = (financialData.income / (financialData.income + financialData.expenses)) * 100
  const expensesPercent = 100 - incomePercent
  const pendingPercent = (drawsData.pending / drawsData.total) * 100

  return (
    <GlobalNav user={user} activeNav="reports">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
          Reports
        </h2>
        
        {/* Generate Report Button */}
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
          
          {/* Values Row - Desktop: side by side, Mobile: stacked */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-0 mb-3">
            <div 
              className="flex-1 py-3 px-4 text-center"
              style={{ 
                backgroundColor: '#FAFAFA',
                borderRadius: '8px'
              }}
            >
              <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#22C55E' }}>
                {formatCurrency(financialData.income)}
              </span>
              <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Income</span>
            </div>
            <div 
              className="flex-1 py-3 px-4 text-center"
              style={{ 
                backgroundColor: '#FAFAFA',
                borderRadius: '8px'
              }}
            >
              <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#EF4444' }}>
                {formatCurrency(financialData.expenses)}
              </span>
              <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Expenses</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-4">
            <div 
              className="h-full"
              style={{ width: `${incomePercent}%`, backgroundColor: '#22C55E' }}
            />
            <div 
              className="h-full"
              style={{ width: `${expensesPercent}%`, backgroundColor: '#EF4444' }}
            />
          </div>

          {/* Date Inputs */}
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

          {/* View Report Button */}
          <button 
            className="w-full py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#111111', border: '1px solid #E5E7EB' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
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
          
          {/* Values - Desktop: side by side, Mobile: stacked */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-0 mb-3">
            <div 
              className="flex-1 py-3 px-4 text-center"
              style={{ 
                backgroundColor: '#FAFAFA',
                borderRadius: '8px'
              }}
            >
              {/* Desktop shows combined, mobile shows separate */}
              <div className="hidden lg:block">
                <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#EF4444' }}>
                  {formatCurrency(drawsData.pending)}
                </span>
                <span className="text-xl lg:text-2xl font-semibold mx-1" style={{ color: '#6B7280' }}>/</span>
                <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#6B7280' }}>
                  {formatCurrency(drawsData.total)}
                </span>
                <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Total</span>
              </div>
              {/* Mobile - show pending separate */}
              <div className="lg:hidden">
                <span className="text-xl font-semibold" style={{ color: '#EF4444' }}>
                  {formatCurrency(drawsData.pending)}
                </span>
                <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Pending</span>
              </div>
            </div>
            <div 
              className="flex-1 py-3 px-4 text-center"
              style={{ 
                backgroundColor: '#FAFAFA',
                borderRadius: '8px'
              }}
            >
              {/* Desktop shows completed */}
              <div className="hidden lg:block">
                <span className="text-xl lg:text-2xl font-semibold" style={{ color: '#22C55E' }}>
                  {formatCurrency(drawsData.completed)}
                </span>
                <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Completed</span>
              </div>
              {/* Mobile shows total */}
              <div className="lg:hidden">
                <span className="text-xl font-semibold" style={{ color: '#6B7280' }}>
                  {formatCurrency(drawsData.total)}
                </span>
                <span className="text-sm ml-2" style={{ color: '#6B7280' }}>Total</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex mb-4">
            <div 
              className="h-full"
              style={{ width: `${pendingPercent}%`, backgroundColor: '#EF4444' }}
            />
            <div 
              className="h-full"
              style={{ width: `${100 - pendingPercent}%`, backgroundColor: '#22C55E' }}
            />
          </div>

          {/* Date Inputs */}
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

          {/* View Report Button */}
          <button 
            className="w-full py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#111111', border: '1px solid #E5E7EB' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
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
            
            {/* Contractor Dropdown */}
            <div className="relative">
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                style={{ color: '#374151' }}
              >
                {contractorOptions.map(contractor => (
                  <option key={contractor} value={contractor}>{contractor}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-1">
            {jobsData.map((job) => (
              <div 
                key={job.id} 
                className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                {/* Checkbox - Desktop only */}
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
                    <span style={{ color: '#EF4444' }}>{job.status}</span>
                  </p>
                </div>

                {/* Chevron - Mobile only */}
                <ChevronRight size={16} className="lg:hidden text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
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
            
            {/* Project Dropdown */}
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                style={{ color: '#374151' }}
              >
                {projectOptions.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Action Items List */}
          <div className="space-y-1">
            {actionCenterData.map((item) => (
              <div 
                key={item.id} 
                className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0"
              >
                {/* Warning Icon */}
                <Warning 
                  size={20} 
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: '#F59E0B' }}
                />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: '#EF4444' }}>
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>
                    {item.project} • {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setGenerateModalOpen(false)}
          />
          
          {/* Modal */}
          <div 
            className="relative bg-white w-full max-w-md p-6"
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => setGenerateModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-500" />
            </button>

            {/* Title */}
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
              Generate Report
            </h3>

            {/* Include The Following */}
            <p className="text-sm font-medium mb-3" style={{ color: '#1D1D1F' }}>
              Include The Following:
            </p>

            {/* Select Range */}
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

            {/* Checkboxes - Report Sections */}
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

            {/* Contractors Section */}
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

            {/* Format Section */}
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

            {/* Action Buttons */}
            <div className="flex flex-col-reverse lg:flex-row gap-3">
              <button 
                onClick={() => setGenerateModalOpen(false)}
                className="flex-1 px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#111111', border: '1px solid #111111' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#111111'
                  e.currentTarget.style.color = '#FFFFFF'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#111111'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  console.log('Downloading report with config:', reportConfig)
                  setGenerateModalOpen(false)
                }}
                className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#1D1D1F' }}
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </GlobalNav>
  )
}

// Page-specific Icon Components
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
