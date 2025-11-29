import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Mock project data
const projectData = {
  id: '1283614-1',
  name: 'Project Alpha',
  status: 'On Hold',
  statusColor: '#EAB308',
  estimatedCompletion: '07/02/2025',
  currentPhase: 'Work in Progress OH',
  phases: [
    { id: 1, name: 'Bidding', status: 'complete', color: '#22C55E' },
    { id: 2, name: 'Pending Approval', status: 'complete', color: '#22C55E' },
    { id: 3, name: 'Scheduling', status: 'complete', color: '#22C55E' },
    { id: 4, name: 'Work in Progress', status: 'current', color: '#22C55E', note: 'OH' },
    { id: 5, name: 'Sent For QC', status: 'pending', color: '#E5E7EB' },
    { id: 6, name: 'Pending Broker', status: 'pending', color: '#E5E7EB' },
    { id: 7, name: 'Complete', status: 'pending', color: '#E5E7EB' },
  ],
  phaseTooltip: {
    title: 'On Hold',
    reason: 'Reason For Hold',
    description: 'Example Lorem Ipsum',
    link: 'See Report'
  },
  tasks: [
    { id: 1, name: 'Inspect Job Site A', dueDate: '05/20/2025', actualDate: '05/18/2025', daysStatus: '2 Days Early', daysStatusType: 'early', note: 'No issues found.' },
    { id: 2, name: 'Demo Interior Walls', dueDate: '05/22/2025', actualDate: '05/25/2025', daysStatus: '3 Days Past Due', daysStatusType: 'late', note: 'Ran into delays with dumpster delivery.' },
    { id: 3, name: 'Electrical Rough In', dueDate: '05/28/2025', actualDate: '--', daysStatus: '5 Days Remaining', daysStatusType: 'pending', note: 'Scheduled and confirmed with contractor.' },
    { id: 4, name: 'HVAC Ductwork Install', dueDate: '06/01/2025', actualDate: '--', daysStatus: '9 Days Remaining', daysStatusType: 'pending', note: 'Awaiting permit approval.' },
    { id: 5, name: 'Cabinet Install', dueDate: '05/10/2025', actualDate: '05/15/2025', daysStatus: '5 Days Past Due', daysStatusType: 'late', note: 'Short one cabinet panel, reordered.' },
    { id: 6, name: 'Flooring Delivery', dueDate: '05/12/2025', actualDate: '05/11/2025', daysStatus: '1 Day Early', daysStatusType: 'early', note: 'Delivered and staged on site.' },
    { id: 7, name: 'Final Paint Walkthrough', dueDate: '04/30/2025', actualDate: '04/30/2025', daysStatus: 'On Time', daysStatusType: 'ontime', note: 'Completed on schedule.' },
    { id: 8, name: 'Final Inspection Request', dueDate: '05/30/2025', actualDate: '--', daysStatus: '12 Days Remaining', daysStatusType: 'pending', note: 'Request form submitted to city office.' },
  ],
  timeline: {
    month: 'October 2024',
    weeks: [
      { label: 'Week 1', dates: '09 - 15 OCT', days: ['09', '10', '11', '12', '13', '14', '15'] },
      { label: 'Week 2', dates: '16 - 22 OCT', days: ['16', '17', '18', '19', '20', '21', '22'] },
      { label: 'Week 3', dates: '23 - 29 OCT', days: ['23', '24', '25', '26', '27', '28', '29'] },
      { label: 'Week 4', dates: '30 OCT - 05 NOV', days: ['30', '31', '01', '02', '03', '04', '05'] },
      { label: 'Week 5', dates: '06 - 12 NOV', days: ['06', '07', '08', '09', '10', '11', '12'] },
      { label: 'Week 6', dates: '13 - 19 NOV', days: ['13', '14', '15', '16', '17', '18', '19'] },
    ],
    phases: [
      { name: 'Bidding', start: 0, duration: 1, row: 0, color: '#FEE2E2' },
      { name: 'Pending Approval', start: 0.8, duration: 1.2, row: 1, color: '#FEF3C7' },
      { name: 'Scheduling', start: 1.5, duration: 1, row: 2, color: '#FEF3C7' },
      { name: 'Work in Progress', start: 2.2, duration: 2, row: 3, color: '#DCFCE7' },
      { name: 'On Hold', start: 2.8, duration: 0.6, row: 4, color: '#FEE2E2', isMarker: true },
      { name: 'Sent For QC', start: 4, duration: 1, row: 5, color: '#E5E7EB' },
      { name: 'Pending Broker', start: 5, duration: 1, row: 6, color: '#E5E7EB' },
    ]
  },
  customer: {
    company: 'Freddie Mac',
    pointOfContact: 'Shawn Ryan',
    phone: '(385) 204-4570',
    email: 'first.last@domain.com',
    workTypes: [
      { name: 'Electrical', color: '#1F2937' },
      { name: 'Plumbing', color: '#3B82F6' },
      { name: 'Roofing', color: '#22C55E' },
      { name: 'Flooring', color: '#EAB308' },
      { name: 'Paint', color: '#6B7280' },
    ],
    lockboxCode: 'XXXX'
  },
  contacts: [
    {
      id: 1,
      company: 'Killowen Construction',
      status: 'active',
      role: 'GC',
      roleColor: '#1F2937',
      pointOfContact: 'Tyler Farrel',
      phone: '(385) 204-4570',
      email: 'first.last@domain.com',
      lockboxCode: 'XXXX'
    },
    {
      id: 2,
      company: 'Freddie Mac',
      status: 'warning',
      role: 'Customer',
      roleColor: '#22C55E',
      pointOfContact: 'Shawn Ryan',
      phone: '(385) 204-4570',
      email: 'first.last@domain.com',
      lockboxCode: 'XXXX'
    }
  ],
  files: [
    { id: 1, name: 'Kitchen-Before01', type: 'JPG', project: 'Project Alpha', uploadedBy: 'S. Kerley' },
    { id: 2, name: 'Kitchen-Before02', type: 'JPG', project: 'Project Alpha', uploadedBy: 'S. Kerley' },
    { id: 3, name: 'Kitchen-Before03', type: 'JPG', project: 'Project Alpha', uploadedBy: 'S. Kerley' },
    { id: 4, name: 'Electrical Permit, Project Alpha #1283614-1', type: 'JPG', project: 'Project Alpha', uploadedBy: 'S. Kerley' },
    { id: 5, name: 'Garage-Before01', type: 'JPG', project: 'Project Alpha', uploadedBy: 'S. Kerley' },
  ],
  financials: {
    summary: {
      totalBudget: 120000,
      budgetAvailable: 85000,
      drawsOut: 3,
      drawCompleted: 4,
      scopeComplete: 33
    },
    invoices: [
      { id: '445123', due: '05/15/2025', status: 'Sent', statusColor: '#22C55E', brokerDate: '05/15/2025', brokerSignOff: '05/15/2025', amount: 54000 },
      { id: '445124', due: '05/22/2025', status: 'Awaiting Sign', statusColor: '#EAB308', brokerDate: '05/20/2025', brokerSignOff: '05/21/2025', amount: 42750 },
      { id: '445125', due: '05/10/2025', status: 'Approved', statusColor: '#22C55E', brokerDate: '05/08/2025', brokerSignOff: '05/09/2025', amount: 36200 },
      { id: '445126', due: '05/05/2025', status: 'Paid', statusColor: '#22C55E', brokerDate: '05/02/2025', brokerSignOff: '05/03/2025', amount: 61450 },
      { id: '445127', due: '06/01/2025', status: 'Sent', statusColor: '#22C55E', brokerDate: '05/30/2025', brokerSignOff: '05/31/2025', amount: 48000 },
      { id: '445128', due: '05/28/2025', status: 'Overdue', statusColor: '#EF4444', brokerDate: '05/25/2025', brokerSignOff: '05/26/2025', amount: 27300 },
      { id: '445129', due: '05/18/2025', status: 'Awaiting Sign', statusColor: '#EAB308', brokerDate: '05/16/2025', brokerSignOff: '05/17/2025', amount: 33800 },
      { id: '445130', due: '05/20/2025', status: 'Approved', statusColor: '#22C55E', brokerDate: '05/17/2025', brokerSignOff: '05/18/2025', amount: 50000 },
    ],
    scope: [
      { id: '445123', task: 'Cabinets Install', contractor: 'Killowen Construction', completed: 100, invoiceAmount: 4200, contractorAmount: 4200 },
      { id: '445223', task: 'Flooring', contractor: 'Devlin Electrical', completed: 100, invoiceAmount: 5750, contractorAmount: 5750 },
      { id: '445323', task: 'Electrical', contractor: 'Davison Plumbing & Sons', completed: 65, invoiceAmount: 8940, contractorAmount: 8940, needsUpdate: true },
      { id: '445423', task: 'Roofing Patch', contractor: 'Hotshot HVAC', completed: 75, invoiceAmount: 2500, contractorAmount: 12500, needsUpdate: true },
      { id: '445523', task: 'Windows', contractor: 'Apex Roofing Systems', completed: 80, invoiceAmount: 14800, contractorAmount: 14800, alert: true },
      { id: '445623', task: 'Paint', contractor: 'Timberline Finish Carpentry', completed: 25, invoiceAmount: 18250, contractorAmount: 18250 },
    ]
  },
  permits: [
    { id: 1, name: 'Permit Name', type: 'permit', appliedDate: '05/01/2025', approvedDate: '05/08/2025', finalInspection: 'Pending', finalInspectionColor: '#EAB308', passDate: '05/08/2025' },
    { id: 2, name: 'Violation Name', type: 'violation', appliedDate: '05/01/2025', approvedDate: null, finalInspection: 'Not Approved', finalInspectionColor: '#EF4444', passDate: null },
    { id: 3, name: 'Permit Name', type: 'permit', appliedDate: '04/28/2025', approvedDate: '05/05/2025', finalInspection: 'Scheduling', finalInspectionColor: '#6B7280', passDate: '05/15/2025' },
    { id: 4, name: 'Permit Name', type: 'permit', appliedDate: '04/15/2025', approvedDate: '05/01/2025', finalInspection: 'Complete', finalInspectionColor: '#22C55E', passDate: '05/15/2025' },
    { id: 5, name: 'Permit Name', type: 'permit', appliedDate: '05/01/2025', approvedDate: '05/08/2025', finalInspection: 'Complete', finalInspectionColor: '#22C55E', passDate: '05/15/2025' },
  ],
  contractorAllocation: [
    { id: '651709', task: 'Final Cleaning & Punchout', contractor: 'Killowen Construction', completed: 0, completedLabel: 'Not Started', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX' },
    { id: '560312', task: 'Drywall & Texture', contractor: 'Killowen Construction', completed: 25, completedLabel: '0-49%', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX' },
    { id: '895632', task: 'Plumbing Rough In', contractor: 'Killowen Construction', completed: 35, completedLabel: '0-49%', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX' },
    { id: '998421', task: 'Roofing Install', contractor: 'Killowen Construction', completed: 65, completedLabel: '50-90%', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX', alert: true },
    { id: '445123', task: 'Cabinets Install', contractor: 'Killowen Construction', completed: 75, completedLabel: '50-90%', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX', alert: true },
    { id: '734508', task: 'Tile & Flooring Install', contractor: 'Killowen Construction', completed: 80, completedLabel: '50-90%', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX', alert: true },
    { id: '782911', task: 'Electrical Final', contractor: 'Killowen Construction', completed: 100, completedLabel: '100%', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX' },
    { id: '119382', task: 'HVAC Rough In', contractor: 'Killowen Construction', completed: 100, completedLabel: '100%', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX' },
    { id: '112045', task: 'Foundation Pour', contractor: 'Killowen Construction', completed: 100, completedLabel: '100%', contractorAmount: 'XX,XXX.XX', netAmount: 'XX,XXX.XX' },
  ],
  contractorPayments: [
    { id: 1, dateRequested: '05/01/2025', contractor: 'Killowen Construction', status: 'Pending', statusColor: '#EAB308', amount: 5900.00, sentOn: '05/16/2025', hasNotes: false },
    { id: 2, dateRequested: '05/01/2025', contractor: 'Killowen Construction', status: 'Approved', statusColor: '#22C55E', amount: 15900.00, sentOn: '05/15/2025', hasNotes: true },
    { id: 3, dateRequested: '04/15/2025', contractor: 'Davison Heating', status: 'Approved', statusColor: '#22C55E', amount: 9900.00, sentOn: '05/15/2025', hasNotes: true },
    { id: 4, dateRequested: '04/15/2025', contractor: 'Plasterman', status: 'Pending', statusColor: '#EAB308', amount: 1900.00, sentOn: '05/14/2025', hasNotes: false },
    { id: 5, dateRequested: '04/15/2025', contractor: 'Hotshot HVAC', status: 'Pending', statusColor: '#EAB308', amount: 8900.00, sentOn: '05/11/2025', hasNotes: true },
    { id: 6, dateRequested: '04/01/2025', contractor: 'Killowen Construction', status: 'Approved', statusColor: '#22C55E', amount: 3400.00, sentOn: '05/10/2025', hasNotes: false },
    { id: 7, dateRequested: '04/01/2025', contractor: 'Killowen Construction', status: 'Approved', statusColor: '#22C55E', amount: 1999.99, sentOn: '05/03/2025', hasNotes: true },
    { id: 8, dateRequested: '04/01/2025', contractor: 'Killowen Construction', status: 'Approved', statusColor: '#22C55E', amount: 5596.00, sentOn: '05/05/2025', hasNotes: false },
  ],
  contractorsList: [
    { id: 1, name: 'Killowen Construction', status: 'active', statusColor: '#22C55E', specialty: 'GC', specialtyColor: '#1D1D1F', contact: 'Tyler Farrel', phone: '(385) 204-4570', email: 'first.last@domain.com', lockboxCode: 'XXXX' },
    { id: 2, name: 'Lights N\' Switches', status: 'active', statusColor: '#22C55E', specialty: 'Electrical', specialtyColor: '#EAB308', contact: 'Derek Bjornson', phone: '(385) 204-4570', email: 'first.last@domain.com', lockboxCode: 'XXXX' },
  ]
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'messages', label: 'Messages' },
  { id: 'financials', label: 'Financials' },
  { id: 'permits', label: 'Permits' },
  { id: 'contractors', label: 'Contractors' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'files', label: 'Files & Notes' },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'projects', label: 'Projects', icon: 'folder', active: true },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'profiles', label: 'Profiles', icon: 'users' },
]

function ProjectDetail({ user }) {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [activeNav, setActiveNav] = useState('projects')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [addContractorModalOpen, setAddContractorModalOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    timeline: true,
    customer: true,
    scope: true
  })
  const [expandedContacts, setExpandedContacts] = useState({})
  const [expandedContractors, setExpandedContractors] = useState({})
  const [editFormData, setEditFormData] = useState({
    biddingDate: '',
    pendingDate: '',
    schedulingDate: '',
    workInProgressDate1: '',
    workInProgressDate2: '',
    sentForQCDate: '',
    pendingBroker: '',
    goBackDate: '',
    completionDate: '',
  })
  const [invoiceFormData, setInvoiceFormData] = useState({
    notes: '',
    attachment: null
  })
  const [paymentFormData, setPaymentFormData] = useState({
    contractor: 'Hotshot HVAC',
    amount: '',
    selectRange: 'This Quarter (Q2 2025)',
    financialOutlook: true,
    drawsSummary: false,
    contractors: false,
    subcontractors: false,
    formatPDF: false,
    formatExcel: true,
    formatGoogleDoc: false,
    notes: '',
    attachment: null
  })
  const [contractorFormData, setContractorFormData] = useState({
    name: '',
    types: {
      gc: null,
      electrical: false,
      plumbing: false,
      hvac: false,
      roofing: false,
      flooring: false,
      drywall: false,
      paint: false,
      cabinets: false
    },
    pointOfContact: '',
    phone: '',
    email: '',
    lockboxCode: ''
  })

  const handleContractorFormChange = (field, value) => {
    setContractorFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleContractorTypeChange = (type, checked) => {
    setContractorFormData(prev => ({
      ...prev,
      types: { ...prev.types, [type]: checked }
    }))
  }

  const toggleContact = (contactId) => {
    setExpandedContacts(prev => ({
      ...prev,
      [contactId]: !prev[contactId]
    }))
  }

  const toggleContractor = (contractorId) => {
    setExpandedContractors(prev => ({
      ...prev,
      [contractorId]: !prev[contractorId]
    }))
  }

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleInvoiceFormChange = (field, value) => {
    setInvoiceFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePaymentFormChange = (field, value) => {
    setPaymentFormData(prev => ({ ...prev, [field]: value }))
  }

  const [notesFormData, setNotesFormData] = useState({
    notes: '',
    attachment: null
  })

  const handleNotesFormChange = (field, value) => {
    setNotesFormData(prev => ({ ...prev, [field]: value }))
  }

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (editModalOpen) setEditModalOpen(false)
        if (invoiceModalOpen) setInvoiceModalOpen(false)
        if (paymentModalOpen) setPaymentModalOpen(false)
        if (reportModalOpen) setReportModalOpen(false)
        if (notesModalOpen) setNotesModalOpen(false)
        if (addContractorModalOpen) setAddContractorModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [editModalOpen, invoiceModalOpen, paymentModalOpen, reportModalOpen, notesModalOpen, addContractorModalOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const handleNavClick = (navId) => {
    setActiveNav(navId)
    setMobileMenuOpen(false)
    const routes = {
      dashboard: '/',
      projects: '/projects',
      reports: '/reports',
      profiles: '/profiles',
    }
    navigate(routes[navId] || '/')
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const getDaysStatusStyle = (type) => {
    switch (type) {
      case 'early':
        return 'text-green-600'
      case 'late':
        return 'text-red-600'
      case 'ontime':
        return 'text-gray-600'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#F4F4F4' }}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[200px] bg-white flex flex-col flex-shrink-0 h-full pt-6 pl-4 pr-0
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <button 
          className="absolute top-4 right-4 p-2 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <CloseIcon className="w-5 h-5 text-gray-500" />
        </button>

        <h1 className="text-xl font-bold mb-6 text-center pr-4" style={{ color: '#1D1D1F' }}>JMPU</h1>

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
          <nav className="flex-1">
            {navItems.map((item) => (
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
                <NavIcon name={item.icon} active={activeNav === item.id} />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="py-4">
          <button 
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            style={{ color: '#6B7280' }}
          >
            <NavIcon name="settings" />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-100 px-8 py-4 items-center justify-between flex-shrink-0">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" style={{ color: '#161616' }}>
              <BellIcon className="w-5 h-5" />
            </button>
            <div 
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer"
              style={{ color: '#111111', border: '1px solid #111111' }}
              onClick={handleLogout}
              title="Click to logout"
            >
              {getInitials(userName)}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="flex lg:hidden bg-white border-b border-gray-100 px-4 py-3 items-center justify-between flex-shrink-0 relative">
          <button className="p-2 -ml-2 z-10" onClick={() => setMobileMenuOpen(true)}>
            <HamburgerIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold" style={{ color: '#1D1D1F' }}>JMP</h1>
          <div className="flex items-center gap-2 z-10">
            <button className="p-2">
              <SearchIcon className="w-5 h-5" style={{ color: '#1D1D1F' }} />
            </button>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer"
              style={{ color: '#111111', border: '1px solid #111111' }}
              onClick={handleLogout}
            >
              {getInitials(userName)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {/* Project Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/projects')}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-xl lg:text-2xl font-semibold" style={{ color: '#1D1D1F' }}>
                {projectData.name} #{projectData.id}
              </h2>
              {/* Avatar on desktop */}
              <div className="hidden lg:flex items-center gap-2 ml-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                  JV
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col lg:flex-row gap-3 w-full lg:w-auto">
              {activeTab === 'financials' ? (
                <>
                  <button 
                    onClick={() => setInvoiceModalOpen(true)}
                    className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#1D1D1F' }}
                  >
                    New Invoice
                  </button>
                  <button 
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full lg:w-auto px-5 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors"
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
                    Pay
                  </button>
                </>
              ) : activeTab === 'permits' ? (
                <button 
                  className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Add Permit/Violation
                </button>
              ) : activeTab === 'contractors' ? (
                <>
                  <button 
                    onClick={() => setReportModalOpen(true)}
                    className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#1D1D1F' }}
                  >
                    Request Draw
                  </button>
                  <button 
                    onClick={() => setAddContractorModalOpen(true)}
                    className="w-full lg:w-auto px-5 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors"
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
                    Add Contractor
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#1D1D1F' }}
                  >
                    Send Message
                  </button>
                  <button 
                    onClick={() => setEditModalOpen(true)}
                    className="w-full lg:w-auto px-5 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors"
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
                    Edit Project
                  </button>
                  <button 
                    className="w-full lg:w-auto px-5 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors"
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
                    AI Summary
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Project Phases Card */}
          <div 
            className="bg-white p-6 mb-6"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold mb-2" style={{ color: '#1D1D1F' }}>Project Phases</h3>
                {/* Mobile: Simple status */}
                <div className="lg:hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-600">Status: {projectData.status}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: projectData.statusColor }} />
                  </div>
                  <p className="text-sm text-gray-500">Estimated Completion: {projectData.estimatedCompletion}</p>
                </div>
              </div>
              
              {/* Desktop: Status info */}
              <div className="hidden lg:flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status: {projectData.status}</span>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: projectData.statusColor }} />
                </div>
                <span className="text-sm text-gray-600">Estimated Completion: {projectData.estimatedCompletion}</span>
              </div>
            </div>

            {/* Phase of Project Label */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{ color: '#1D1D1F' }}>AD</span>
                <span className="text-sm text-gray-500">Phase of Project</span>
              </div>
            </div>

            {/* Desktop: Full Phase Stepper */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                <div className="absolute top-3 left-0 h-1 bg-green-500 rounded-full" style={{ width: '45%' }} />
                
                {/* Phase Dots */}
                <div className="relative flex justify-between">
                  {projectData.phases.map((phase, index) => (
                    <div key={phase.id} className="flex flex-col items-center" style={{ width: `${100 / projectData.phases.length}%` }}>
                      <div 
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${
                          phase.status === 'complete' ? 'bg-green-500 border-green-500' :
                          phase.status === 'current' ? 'bg-green-500 border-green-500' :
                          'bg-white border-gray-300'
                        }`}
                      >
                        {phase.status === 'complete' && (
                          <CheckIcon className="w-3 h-3 text-white" />
                        )}
                        {phase.status === 'current' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className={`text-xs mt-2 text-center ${
                        phase.status === 'pending' ? 'text-gray-400' : 'text-gray-700'
                      }`}>
                        {phase.name} {phase.note && <span className="text-yellow-600">{phase.note}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile: Simplified Phase Indicator */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-green-600 font-medium">Today</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-green-500 rounded-full" style={{ width: '45%' }} />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"
                  style={{ left: '45%' }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">SCH</span>
                <span className="text-xs text-yellow-600">OH</span>
                <span className="text-xs text-gray-500">WIP</span>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards - Only shown when Financials tab is selected */}
          {activeTab === 'financials' && (
            <div className="mb-6 -mr-4 lg:mr-0">
              <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pr-4 lg:pr-0">
                {/* Total Budget */}
                <div 
                  className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Total Budget</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      ${(projectData.financials.summary.totalBudget / 1000).toFixed(0)}k
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: '70%', backgroundColor: '#22C55E' }} />
                    <div className="h-full" style={{ width: '30%', backgroundColor: '#3B82F6' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">70% Allocated • 30% Remaining</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Budget Available */}
                <div 
                  className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Budget Available</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      ${(projectData.financials.summary.budgetAvailable / 1000).toFixed(0)}k
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: '70%', backgroundColor: '#22C55E' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">View breakdown</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Draws Out */}
                <div 
                  className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EAB308' }} />
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Draws Out</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      {projectData.financials.summary.drawsOut}
                    </span>
                    <span className="text-base font-bold" style={{ color: '#919191' }}>
                      Projects
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: '43%', backgroundColor: '#EAB308' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">View</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Draw Completed */}
                <div 
                  className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Draw Completed</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      {projectData.financials.summary.drawCompleted}
                    </span>
                    <span className="text-base font-bold" style={{ color: '#919191' }}>
                      Projects
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: '57%', backgroundColor: '#3B82F6' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">↑ 33% from last month</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Scope */}
                <div 
                  className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Scope</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      {projectData.financials.summary.scopeComplete}%
                    </span>
                    <span className="text-base font-bold" style={{ color: '#22C55E' }}>
                      Complete
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: `${projectData.financials.summary.scopeComplete}%`, backgroundColor: '#22C55E' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">View</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs + Tasks Section (connected) */}
          <div className="mb-6">
            {/* Desktop Tabs */}
            <div className="hidden lg:flex items-end gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="text-base whitespace-nowrap transition-all"
                  style={{ 
                    padding: activeTab === tab.id ? '16px 40px 8px 40px' : '8px 40px 8px 40px',
                    borderRadius: '8px 8px 0 0',
                    backgroundColor: '#FFFFFF',
                    borderBottom: activeTab === tab.id ? 'none' : '1px solid #F4F4F4',
                    fontWeight: activeTab === tab.id ? '700' : '400',
                    color: activeTab === tab.id ? '#1D1D1F' : '#808080'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Container */}
            <div 
              className="bg-white rounded-2xl lg:rounded-none lg:rounded-tr-2xl lg:rounded-br-2xl lg:rounded-bl-2xl"
              style={{ 
                boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
              }}
            >
              {/* Mobile: Header with dropdown (shown on all tabs) */}
              <div className="lg:hidden p-6 pb-4">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                  {tabs.find(t => t.id === activeTab)?.label || 'Overview'}
                </h3>
                
                {/* Search */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <SearchIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>

                {/* Tab Dropdown */}
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                    backgroundPosition: 'right 1rem center', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundSize: '1.5em 1.5em' 
                  }}
                >
                  {tabs.map((tab) => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>

              {/* Overview Tab Content (Tasks) */}
              {activeTab === 'overview' && (
                <>
                  {/* Desktop: Tasks header */}
                  <div className="hidden lg:block p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Tasks</h3>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <FilterIcon className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <GridIcon className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-gray-100">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Date</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Days Early / Pass</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projectData.tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-900">{task.name}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{task.dueDate}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{task.actualDate}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-sm flex items-center gap-1 ${getDaysStatusStyle(task.daysStatusType)}`}>
                          {task.daysStatusType === 'late' && <WarningIcon className="w-4 h-4" />}
                          {task.daysStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{task.note}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="lg:hidden divide-y divide-gray-100">
              {projectData.tasks.map((task) => (
                <div 
                  key={task.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm text-gray-900">{task.name}</span>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
                </>
              )}

              {/* Contacts Tab Content */}
              {activeTab === 'contacts' && (
                <div>
                  {projectData.contacts.map((contact, index) => (
                    <div 
                      key={contact.id} 
                      className={`p-6 ${index !== projectData.contacts.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      {/* Contact Header */}
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleContact(contact.id)}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>{contact.company}</h4>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: contact.status === 'active' ? '#22C55E' : '#EAB308' }}
                          />
                          <span 
                            className="px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1"
                            style={{ backgroundColor: contact.roleColor }}
                          >
                            <WrenchIcon className="w-3 h-3" />
                            {contact.role}
                          </span>
                        </div>
                        <ChevronUpIcon 
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedContacts[contact.id] !== false ? '' : 'rotate-180'
                          }`} 
                        />
                      </div>

                      {/* Contact Details (collapsible) */}
                      {expandedContacts[contact.id] !== false && (
                        <div className="mt-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                          {/* Contact Info */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                <span className="font-medium">Point of Contact</span> {contact.pointOfContact}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                <span className="font-medium">Phone:</span> {contact.phone}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <EmailIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                <span className="font-medium">Email:</span> {contact.email}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <button 
                              className="px-4 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                              style={{ color: '#111111', border: '1px solid #E5E7EB', minWidth: '262px' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <PhoneIcon className="w-4 h-4" />
                              Call
                            </button>
                            <button 
                              className="px-4 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                              style={{ color: '#111111', border: '1px solid #E5E7EB', minWidth: '262px' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <EmailIcon className="w-4 h-4" />
                              Send Message
                            </button>
                            <button 
                              className="px-4 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                              style={{ color: '#111111', border: '1px solid #E5E7EB', minWidth: '262px' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#F9FAFB'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              Lockbox Code: {contact.lockboxCode}
                              <CopyIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Files & Notes Tab Content */}
              {activeTab === 'files' && (
                <div className="p-6">
                  {/* Drag & Drop Zone */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 lg:p-12 text-center mb-8"
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                      // Handle file drop here
                      console.log('Files dropped:', e.dataTransfer.files)
                    }}
                  >
                    <h3 className="text-lg font-semibold mb-2" style={{ color: '#1D1D1F' }}>
                      Drag & Drop Files here
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Files Supported - .XLS, .PDF, .HEIC, .JPG, .PNG
                    </p>
                    <button 
                      className="px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
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
                      Upload
                    </button>
                    <p className="text-xs text-gray-400 mt-4">
                      Max File Size: 10MB
                    </p>
                  </div>

                  {/* Recently Added Files Section */}
                  <div>
                    {/* Header with Search and Filter */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
                        Recently Added Files
                      </h3>
                      <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search"
                            className="w-full lg:w-80 pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <select 
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                            backgroundPosition: 'right 0.75rem center', 
                            backgroundRepeat: 'no-repeat', 
                            backgroundSize: '1.25em 1.25em',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option>Photos</option>
                          <option>Documents</option>
                          <option>All Files</option>
                        </select>
                      </div>
                    </div>

                    {/* File List */}
                    <div className="divide-y divide-gray-100">
                      {projectData.files.map((file) => (
                        <div 
                          key={file.id}
                          className="py-4"
                        >
                          {/* Desktop Layout */}
                          <div className="hidden lg:flex lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                              <span className="font-medium text-sm" style={{ color: '#1D1D1F' }}>{file.name}</span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">.{file.type}</span>
                              <span className="text-sm text-gray-500">{file.project} • Uploaded by: {file.uploadedBy}</span>
                            </div>
                            <div className="flex items-center gap-6">
                              <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                <EyeIcon className="w-4 h-4" />
                                Preview
                              </button>
                              <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                <DownloadIcon className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          </div>

                          {/* Mobile Layout */}
                          <div className="lg:hidden">
                            <div className="flex items-start gap-3 mb-2">
                              <ImageIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm" style={{ color: '#1D1D1F' }}>{file.name}</span>
                                  <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">.{file.type}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">{file.project} • Uploaded by: {file.uploadedBy}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 ml-8">
                              <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                <EyeIcon className="w-4 h-4" />
                                Preview
                              </button>
                              <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                <DownloadIcon className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Financials Tab Content */}
              {activeTab === 'financials' && (
                <div className="p-6">
                  {/* Invoices Section */}
                  <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Invoices</h3>
                      <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1 lg:flex-none">
                          <input
                            type="text"
                            placeholder="Search"
                            className="w-full lg:w-64 pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <select 
                          className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                            backgroundPosition: 'right 0.75rem center', 
                            backgroundRepeat: 'no-repeat', 
                            backgroundSize: '1.25em 1.25em',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option>All</option>
                          <option>Sent</option>
                          <option>Awaiting Sign</option>
                          <option>Approved</option>
                          <option>Paid</option>
                          <option>Overdue</option>
                        </select>
                      </div>
                    </div>

                    {/* Invoices Table - Desktop */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Broker Date</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Broker Sign Off</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {projectData.financials.invoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                <span className="text-sm font-medium underline cursor-pointer" style={{ color: '#1D1D1F' }}>{invoice.id}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  {invoice.due} <CalendarIcon className="w-4 h-4 text-gray-400" />
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm" style={{ color: invoice.statusColor }}>{invoice.status}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  {invoice.brokerDate} <CalendarIcon className="w-4 h-4 text-gray-400" />
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  {invoice.brokerSignOff} <CalendarIcon className="w-4 h-4 text-gray-400" />
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-900">${invoice.amount.toLocaleString()}.00</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Invoices List - Mobile */}
                    <div className="lg:hidden divide-y divide-gray-100">
                      {projectData.financials.invoices.map((invoice) => (
                        <div 
                          key={invoice.id}
                          className="flex items-center justify-between py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{invoice.id}</span>
                          </div>
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">1 - 8 of 40</span>
                      <div className="flex items-center gap-2">
                        <select 
                          className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none"
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                            backgroundPosition: 'right 0.25rem center', 
                            backgroundRepeat: 'no-repeat', 
                            backgroundSize: '1em 1em',
                            paddingRight: '1.5rem',
                            appearance: 'none'
                          }}
                        >
                          <option>1</option>
                          <option>2</option>
                          <option>3</option>
                          <option>4</option>
                          <option>5</option>
                        </select>
                        <span className="text-sm text-gray-500">of 5 pages</span>
                        <div className="flex items-center gap-1 ml-2">
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Permits Tab Content */}
              {activeTab === 'permits' && (
                <div className="p-6">
                  {/* Permits & Violations Section */}
                  <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Permits & Violations</h3>
                      <select 
                        className="w-full lg:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                        style={{ 
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                          backgroundPosition: 'right 0.75rem center', 
                          backgroundRepeat: 'no-repeat', 
                          backgroundSize: '1.25em 1.25em',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option>Permits</option>
                        <option>Violations</option>
                        <option>All</option>
                      </select>
                    </div>

                    {/* Permits Table - Desktop */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Permit / Violation</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Applied For Date</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Date</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Final Inspection</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Date</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {projectData.permits.map((permit) => (
                            <tr key={permit.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{permit.name}</span>
                                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">.PDF</span>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="text-sm text-gray-600">{permit.appliedDate}</span>
                              </td>
                              <td className="py-3">
                                {permit.approvedDate ? (
                                  <span className="text-sm text-green-600 underline cursor-pointer">{permit.approvedDate}</span>
                                ) : (
                                  <span className="text-sm text-gray-400">NA</span>
                                )}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm" style={{ color: permit.finalInspectionColor }}>{permit.finalInspection}</span>
                                  <ChevronDownIcon className="w-4 h-4" style={{ color: permit.finalInspectionColor }} />
                                </div>
                              </td>
                              <td className="py-3">
                                {permit.passDate ? (
                                  <span className="text-sm text-gray-600">{permit.passDate}</span>
                                ) : (
                                  <span className="text-sm text-gray-400">NA</span>
                                )}
                              </td>
                              <td className="py-3">
                                <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                  View Notes
                                  <NotesIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Permits List - Mobile */}
                    <div className="lg:hidden divide-y divide-gray-100">
                      {projectData.permits.map((permit) => (
                        <div 
                          key={permit.id}
                          className="py-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{permit.name}</span>
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">.PDF</span>
                            </div>
                            <span className="text-xs" style={{ color: permit.finalInspectionColor }}>{permit.finalInspection}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Applied: {permit.appliedDate}</span>
                            {permit.approvedDate && <span className="text-green-600">Approved: {permit.approvedDate}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: '#1D1D1F' }}>
                      Upload Permit, Violation, Files, etc.
                    </h3>
                    <div 
                      className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('permit-file-input').click()}
                    >
                      <p className="text-base font-medium text-gray-700 mb-2">
                        Drag & Drop Files here
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Files Supported - .XLS, .PDF, .HEIC, .JPG, .PNG
                      </p>
                      <button 
                        className="px-6 py-2 bg-transparent text-sm font-medium transition-colors"
                        style={{ 
                          color: '#111111', 
                          border: '1px solid #111111',
                          borderRadius: '8px'
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
                        Upload
                      </button>
                      <p className="text-xs text-gray-400 mt-4">
                        Max File Size: 10MB
                      </p>
                    </div>
                    <input
                      id="permit-file-input"
                      type="file"
                      accept=".xls,.xlsx,.pdf,.heic,.jpg,.jpeg,.png"
                      className="hidden"
                      multiple
                    />
                  </div>
                </div>
              )}

              {/* Contractors Tab Content */}
              {activeTab === 'contractors' && (
                <div className="p-6">
                  {/* Contractor Allocation Section */}
                  <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Contractor Allocation</h3>
                      <select 
                        className="w-full lg:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                        style={{ 
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                          backgroundPosition: 'right 0.75rem center', 
                          backgroundRepeat: 'no-repeat', 
                          backgroundSize: '1.25em 1.25em',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option>Killowen Construction</option>
                        <option>Lights N' Switches</option>
                        <option>All Contractors</option>
                      </select>
                    </div>

                    {/* Allocation Table - Desktop */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Task & Details</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Completed %</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor Amount</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Net Amount</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Download</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {projectData.contractorAllocation.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3">
                                <span className="text-sm text-gray-900">{item.id} {item.task}</span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm ${item.completed === 100 ? 'text-green-600' : item.completed >= 50 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                    {item.completedLabel}
                                  </span>
                                  {item.completed > 0 && (
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full rounded-full"
                                        style={{ 
                                          width: `${item.completed}%`,
                                          backgroundColor: item.completed === 100 ? '#22C55E' : item.completed >= 50 ? '#EAB308' : '#9CA3AF'
                                        }}
                                      />
                                    </div>
                                  )}
                                  {item.alert && <AlertIcon className="w-4 h-4 text-red-500" />}
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="text-sm text-gray-600">${item.contractorAmount}</span>
                              </td>
                              <td className="py-3">
                                <span className="text-sm text-gray-600">${item.netAmount}</span>
                              </td>
                              <td className="py-3">
                                <button 
                                  onClick={() => setReportModalOpen(true)}
                                  className="text-sm text-blue-600 underline hover:text-blue-800"
                                >
                                  Download Report (.XLS)
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Allocation List - Mobile */}
                    <div className="lg:hidden divide-y divide-gray-100">
                      {projectData.contractorAllocation.map((item) => (
                        <div key={item.id} className="py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{item.id} {item.task}</span>
                            <span className={`text-xs ${item.completed === 100 ? 'text-green-600' : item.completed >= 50 ? 'text-yellow-600' : 'text-gray-500'}`}>
                              {item.completedLabel}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">${item.netAmount}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contractor Payments (Draws) Section */}
                  <div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Contractor Payments (Draws)</h3>
                      <select 
                        className="w-full lg:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                        style={{ 
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                          backgroundPosition: 'right 0.75rem center', 
                          backgroundRepeat: 'no-repeat', 
                          backgroundSize: '1.25em 1.25em',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option>All</option>
                        <option>Pending</option>
                        <option>Approved</option>
                      </select>
                    </div>

                    {/* Payments Table - Desktop */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date Requested</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Sent On</th>
                            <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {projectData.contractorPayments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3">
                                <span className="text-sm text-gray-600">{payment.dateRequested}</span>
                              </td>
                              <td className="py-3">
                                <span className="text-sm text-blue-600 underline cursor-pointer">{payment.contractor}</span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm" style={{ color: payment.statusColor }}>{payment.status}</span>
                                  <ChevronDownIcon className="w-4 h-4" style={{ color: payment.statusColor }} />
                                </div>
                              </td>
                              <td className="py-3">
                                <span className="text-sm text-gray-600">${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                              </td>
                              <td className="py-3">
                                <span className="text-sm text-gray-600">{payment.sentOn}</span>
                              </td>
                              <td className="py-3">
                                <button 
                                  onClick={() => setNotesModalOpen(true)}
                                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                  {payment.hasNotes ? 'View Notes' : 'Add Note +'}
                                  <NotesIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Payments List - Mobile */}
                    <div className="lg:hidden divide-y divide-gray-100">
                      {projectData.contractorPayments.map((payment) => (
                        <div key={payment.id} className="py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-blue-600 underline">{payment.contractor}</span>
                            <span className="text-sm" style={{ color: payment.statusColor }}>{payment.status}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{payment.dateRequested}</span>
                            <span>${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder for other tabs */}
              {!['overview', 'contacts', 'files', 'financials', 'permits', 'contractors'].includes(activeTab) && (
                <div className="hidden lg:block p-12 text-center">
                  <p className="text-gray-500">
                    {tabs.find(t => t.id === activeTab)?.label} content coming soon...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Scope Section - Only shown on Financials tab */}
          {activeTab === 'financials' && (
            <div 
              className="bg-white mb-6"
              style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
            >
              <div 
                className="p-6 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('scope')}
              >
                <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Scope</h3>
                <ChevronUpIcon className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.scope ? '' : 'rotate-180'}`} />
              </div>

              {expandedSections.scope && (
                <>
                  {/* Scope Table - Desktop */}
                  <div className="hidden lg:block overflow-x-auto border-t border-gray-100 px-6">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Task & Details</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Completed %</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Amount</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contractor Amount</th>
                          <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Download</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {projectData.financials.scope.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3">
                              <span className="text-sm text-gray-900">{item.id} {item.task}</span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">{item.contractor}</span>
                                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${item.completed === 100 ? 'text-green-600' : item.completed >= 50 ? 'text-yellow-600' : 'text-gray-600'}`}>
                                  {item.completed === 100 ? '100%' : item.completed >= 50 ? '50-90%' : '0-49%'}
                                </span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full"
                                    style={{ 
                                      width: `${item.completed}%`,
                                      backgroundColor: item.completed === 100 ? '#22C55E' : item.completed >= 50 ? '#EAB308' : '#9CA3AF'
                                    }}
                                  />
                                </div>
                                {item.alert && <AlertIcon className="w-4 h-4 text-red-500" />}
                              </div>
                            </td>
                            <td className="py-3">
                              <span className="text-sm text-gray-600">${item.invoiceAmount.toLocaleString()}.00</span>
                            </td>
                            <td className="py-3">
                              <span className="text-sm text-gray-600">${item.contractorAmount.toLocaleString()}.00</span>
                            </td>
                            <td className="py-3">
                              <button className="text-sm text-blue-600 underline hover:text-blue-800">Download Report</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Scope List - Mobile */}
                  <div className="lg:hidden divide-y divide-gray-100 border-t border-gray-100">
                    {projectData.financials.scope.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between px-6 py-3"
                      >
                        <span className="text-sm text-gray-900">{item.id} {item.task}</span>
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>

                  {/* Scope Pagination */}
                  <div className="flex items-center justify-between p-6 border-t border-gray-100">
                    <span className="text-sm text-gray-500">1 - 6 of 24</span>
                    <div className="flex items-center gap-2">
                      <select 
                        className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none"
                        style={{ 
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                          backgroundPosition: 'right 0.25rem center', 
                          backgroundRepeat: 'no-repeat', 
                          backgroundSize: '1em 1em',
                          paddingRight: '1.5rem',
                          appearance: 'none'
                        }}
                      >
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                        <option>4</option>
                      </select>
                      <span className="text-sm text-gray-500">of 4 pages</span>
                      <div className="flex items-center gap-1 ml-2">
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <ChevronLeftIcon className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Contractor Cards - Only shown on Contractors tab */}
          {activeTab === 'contractors' && (
            <div className="space-y-4 mb-6">
              {projectData.contractorsList.map((contractor) => (
                <div 
                  key={contractor.id}
                  className="bg-white"
                  style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
                >
                  {/* Contractor Header */}
                  <div 
                    className="p-6 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleContractor(contractor.id)}
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>{contractor.name}</h3>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: contractor.statusColor }} />
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: contractor.specialty === 'GC' ? '#1D1D1F' : '#FEF3C7',
                          color: contractor.specialty === 'GC' ? '#FFFFFF' : '#92400E'
                        }}
                      >
                        {contractor.specialty === 'GC' ? '🔧 GC' : '⚡ ' + contractor.specialty}
                      </span>
                    </div>
                    <ChevronUpIcon className={`w-5 h-5 text-gray-400 transition-transform ${expandedContractors[contractor.id] ? '' : 'rotate-180'}`} />
                  </div>

                  {/* Contractor Details */}
                  {expandedContractors[contractor.id] && (
                    <div className="px-6 pb-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        {/* Contact Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Point of Contact</span>
                            <span className="text-gray-900">{contractor.contact}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Phone:</span>
                            <span className="text-gray-900">{contractor.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <EmailIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Email:</span>
                            <span className="text-gray-900">{contractor.email}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 lg:items-end">
                          <button 
                            className="w-full lg:w-auto px-6 py-2 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            style={{ color: '#111111', border: '1px solid #E5E7EB' }}
                          >
                            <PhoneIcon className="w-4 h-4" />
                            Call
                          </button>
                          <button 
                            className="w-full lg:w-auto px-6 py-2 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            style={{ color: '#111111', border: '1px solid #E5E7EB' }}
                          >
                            <EmailIcon className="w-4 h-4" />
                            Send Message
                          </button>
                          <button 
                            className="w-full lg:w-auto px-6 py-2 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            style={{ color: '#111111', border: '1px solid #E5E7EB' }}
                          >
                            Lockbox Code: {contractor.lockboxCode}
                            <LinkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Project Timeline Section */}
          <div 
            className="bg-white mb-6"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div 
              className="p-6 flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('timeline')}
            >
              <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Project Timeline</h3>
              <ChevronUpIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.timeline ? '' : 'rotate-180'}`} />
            </div>

            {expandedSections.timeline && (
              <div className="px-6 pb-6">
                {/* Gantt Chart */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Month Header */}
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">{projectData.timeline.month}</span>
                  </div>

                  {/* Week Headers */}
                  <div className="flex border-b border-gray-200">
                    {projectData.timeline.weeks.map((week, index) => (
                      <div 
                        key={index} 
                        className="flex-1 border-r border-gray-200 last:border-r-0 min-w-0"
                      >
                        <div className="px-2 lg:px-3 py-2 border-b border-gray-100">
                          <div className="text-xs font-medium text-gray-700 truncate">{week.label}</div>
                          <div className="text-xs text-gray-500 truncate hidden sm:block">{week.dates}</div>
                        </div>
                        <div className="flex">
                          {week.days.map((day, dayIndex) => (
                            <div 
                              key={dayIndex} 
                              className="flex-1 py-1 text-center text-xs text-gray-400 border-r border-gray-100 last:border-r-0"
                            >
                              <span className="hidden sm:inline">{day}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gantt Rows */}
                  <div className="relative" style={{ height: '300px' }}>
                    {projectData.timeline.phases.map((phase, index) => (
                      <div
                        key={index}
                        className="absolute flex items-center"
                        style={{
                          top: `${phase.row * 42 + 10}px`,
                          left: `${phase.start * (100 / 6)}%`,
                          width: `${phase.duration * (100 / 6)}%`,
                          height: '32px',
                        }}
                      >
                        <div 
                          className={`h-full rounded px-2 flex items-center text-xs font-medium truncate ${
                            phase.isMarker ? 'border-l-4 border-red-400' : ''
                          }`}
                          style={{ 
                            backgroundColor: phase.color,
                            width: '100%',
                            color: phase.isMarker ? '#DC2626' : '#374151'
                          }}
                        >
                          {phase.name}
                        </div>
                      </div>
                    ))}
                    
                    {/* Today Marker */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400"
                      style={{ left: '50%' }}
                    >
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-red-400" />
                    </div>
                  </div>
                </div>

                {/* View Gantt Chart Button */}
                <div className="flex justify-center mt-4">
                  <button 
                    className="px-6 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors"
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
                    View Gantt Chart
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customer Section */}
          <div 
            className="bg-white"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
          >
            <div 
              className="p-6 flex items-center justify-between cursor-pointer"
              onClick={() => toggleSection('customer')}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Customer</h3>
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <ChevronUpIcon className={`w-5 h-5 text-gray-500 transition-transform ${expandedSections.customer ? '' : 'rotate-180'}`} />
            </div>

            {expandedSections.customer && (
              <div className="px-6 pb-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Customer Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BuildingIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600"><span className="font-medium">Company:</span> {projectData.customer.company}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600"><span className="font-medium">Point of Contact</span> {projectData.customer.pointOfContact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600"><span className="font-medium">Phone:</span> {projectData.customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EmailIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600"><span className="font-medium">Email:</span> {projectData.customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <WrenchIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Work Type:</span>
                      {projectData.customer.workTypes.map((type, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: type.color }}
                        >
                          {type.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 lg:items-end">
                    <button 
                      className="w-full lg:w-auto px-6 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                      <PhoneIcon className="w-4 h-4" />
                      Call
                    </button>
                    <button 
                      className="w-full lg:w-auto px-6 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                      <EmailIcon className="w-4 h-4" />
                      Send Message
                    </button>
                    <button 
                      className="w-full lg:w-auto px-6 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                      Lockbox Code: {projectData.customer.lockboxCode}
                      <CopyIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Project Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Scrim - covers everything including nav */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditModalOpen(false)}
          />
          
          {/* Modal */}
          <div 
            className="relative bg-white w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
            style={{ 
              borderRadius: '16px',
              boxShadow: '2px 4px 24px rgba(0, 0, 0, 0.15)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Edit Project</h2>
              <button 
                onClick={() => setEditModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 pb-6 space-y-4">
              {/* Bidding Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bidding Date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.biddingDate}
                    onChange={(e) => handleEditFormChange('biddingDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Pending Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pending Date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.pendingDate}
                    onChange={(e) => handleEditFormChange('pendingDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Scheduling Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Scheduling Date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.schedulingDate}
                    onChange={(e) => handleEditFormChange('schedulingDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Work In Progress Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Work In Progress Date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.workInProgressDate1}
                    onChange={(e) => handleEditFormChange('workInProgressDate1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Work In Progress Date 2 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Work In Progress Date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.workInProgressDate2}
                    onChange={(e) => handleEditFormChange('workInProgressDate2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Sent For QC Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sent For QC Date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.sentForQCDate}
                    onChange={(e) => handleEditFormChange('sentForQCDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Pending Broker */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Pending Broker</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.pendingBroker}
                    onChange={(e) => handleEditFormChange('pendingBroker', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Go Back Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Go Back Date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.goBackDate}
                    onChange={(e) => handleEditFormChange('goBackDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Completion Date */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Completion date</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="mm/dd/yyyy"
                    value={editFormData.completionDate}
                    onChange={(e) => handleEditFormChange('completionDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse lg:flex-row gap-3 pt-4">
                <button 
                  onClick={() => setEditModalOpen(false)}
                  className="flex-1 px-6 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors"
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
                    // Handle save logic here
                    console.log('Saving:', editFormData)
                    setEditModalOpen(false)
                  }}
                  className="flex-1 px-6 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {invoiceModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setInvoiceModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 24px rgba(0, 0, 0, 0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>New Invoice</h2>
              <button 
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes:</label>
                <textarea
                  placeholder="Lorem ipsum dolor sit amet, vince adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  value={invoiceFormData.notes}
                  onChange={(e) => handleInvoiceFormChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Attach Proof */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attach Proof:</label>
                <div 
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => document.getElementById('invoice-file-input').click()}
                >
                  <span className="text-sm text-gray-500">Drag and drop or browse (PDF, PNG, JPG)</span>
                  <AttachmentIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="invoice-file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handleInvoiceFormChange('attachment', e.target.files[0])}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setInvoiceModalOpen(false)}
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
                    // Handle submit logic here
                    console.log('Submitting invoice:', invoiceFormData)
                    setInvoiceModalOpen(false)
                    setInvoiceFormData({ notes: '', attachment: null })
                  }}
                  className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Contractor Payment Modal */}
      {paymentModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setPaymentModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 24px rgba(0, 0, 0, 0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>New Contractor Payment</h2>
              <button 
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Contractor */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Contractor</label>
                <select
                  value={paymentFormData.contractor}
                  onChange={(e) => handlePaymentFormChange('contractor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                    backgroundPosition: 'right 0.75rem center', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option>Hotshot HVAC</option>
                  <option>Killowen Construction</option>
                  <option>Davison Plumbing & Sons</option>
                  <option>Apex Roofing Systems</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <input
                  type="text"
                  placeholder="$14,999.99"
                  value={paymentFormData.amount}
                  onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Include The Following */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include The Following:</label>
                
                {/* Select Range */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Select Range</label>
                  <select
                    value={paymentFormData.selectRange}
                    onChange={(e) => handlePaymentFormChange('selectRange', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                      backgroundPosition: 'right 0.75rem center', 
                      backgroundRepeat: 'no-repeat', 
                      backgroundSize: '1.25em 1.25em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option>This Quarter (Q2 2025)</option>
                    <option>Last Quarter (Q1 2025)</option>
                    <option>Year to Date</option>
                    <option>Custom Range</option>
                  </select>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentFormData.financialOutlook}
                      onChange={(e) => handlePaymentFormChange('financialOutlook', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">Financial Outlook</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentFormData.drawsSummary}
                      onChange={(e) => handlePaymentFormChange('drawsSummary', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">Draws Summary</span>
                  </label>
                </div>
              </div>

              {/* Contractors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contractors:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentFormData.contractors}
                      onChange={(e) => handlePaymentFormChange('contractors', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">Contractors</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentFormData.subcontractors}
                      onChange={(e) => handlePaymentFormChange('subcontractors', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">Subcontractors</span>
                  </label>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentFormData.formatPDF}
                      onChange={(e) => handlePaymentFormChange('formatPDF', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">PDF</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentFormData.formatExcel}
                      onChange={(e) => handlePaymentFormChange('formatExcel', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">Microsoft Excel</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentFormData.formatGoogleDoc}
                      onChange={(e) => handlePaymentFormChange('formatGoogleDoc', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">Google Doc</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes:</label>
                <textarea
                  placeholder="Lorem ipsum dolor sit amet, vince adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  value={paymentFormData.notes}
                  onChange={(e) => handlePaymentFormChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Attach Proof */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attach Proof:</label>
                <div 
                  className="border border-gray-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => document.getElementById('payment-file-input').click()}
                >
                  <span className="text-sm text-gray-500">Drag and drop or browse (PDF, PNG, JPG)</span>
                  <AttachmentIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="payment-file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handlePaymentFormChange('attachment', e.target.files[0])}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse lg:flex-row gap-3 pt-2">
                <button 
                  onClick={() => setPaymentModalOpen(false)}
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
                    // Handle submit logic here
                    console.log('Submitting payment:', paymentFormData)
                    setPaymentModalOpen(false)
                  }}
                  className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Submit Draw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Report Modal */}
      {reportModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setReportModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 24px rgba(0, 0, 0, 0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Download A Report</h2>
              <button 
                onClick={() => setReportModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Contractor */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Contractor</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                    backgroundPosition: 'right 0.75rem center', 
                    backgroundRepeat: 'no-repeat', 
                    backgroundSize: '1.25em 1.25em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option>Hotshot HVAC</option>
                  <option>Killowen Construction</option>
                  <option>Davison Plumbing & Sons</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Amount</label>
                <input
                  type="text"
                  placeholder="$14,999.99"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Include The Following */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include The Following:</label>
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Select Range</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, 
                      backgroundPosition: 'right 0.75rem center', 
                      backgroundRepeat: 'no-repeat', 
                      backgroundSize: '1.25em 1.25em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option>This Quarter (Q2 2025)</option>
                    <option>Last Quarter (Q1 2025)</option>
                    <option>Year to Date</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Financial Outlook</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Draws Summary</span>
                  </label>
                </div>
              </div>

              {/* Contractors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contractors:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Contractors</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Subcontractors</span>
                  </label>
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format:</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">PDF</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Microsoft Excel</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                    <span className="text-sm text-gray-700">Google Doc</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes:</label>
                <textarea
                  placeholder="Lorem ipsum dolor sit amet, vince adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Attach Proof */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attach Proof:</label>
                <div className="border border-gray-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-500">Drag and drop or browse (PDF, PNG, JPG)</span>
                  <AttachmentIcon className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
                  style={{ color: '#111111', border: '1px solid #111111' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {notesModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setNotesModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 24px rgba(0, 0, 0, 0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Notes</h2>
              <button 
                onClick={() => setNotesModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes:</label>
                <textarea
                  placeholder="Lorem ipsum dolor sit amet, vince adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                  value={notesFormData.notes}
                  onChange={(e) => handleNotesFormChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Attach Proof */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attach Proof:</label>
                <div 
                  className="border border-gray-200 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => document.getElementById('notes-file-input').click()}
                >
                  <span className="text-sm text-gray-500">Drag and drop or browse (PDF, PNG, JPG)</span>
                  <AttachmentIcon className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="notes-file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handleNotesFormChange('attachment', e.target.files[0])}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setNotesModalOpen(false)}
                  className="flex-1 px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors"
                  style={{ color: '#111111', border: '1px solid #111111' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    console.log('Adding note:', notesFormData)
                    setNotesModalOpen(false)
                    setNotesFormData({ notes: '', attachment: null })
                  }}
                  className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contractor Modal */}
      {addContractorModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setAddContractorModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ borderRadius: '16px', boxShadow: '2px 4px 24px rgba(0, 0, 0, 0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Add Contractor</h2>
              <button 
                onClick={() => setAddContractorModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Contractor Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contractor Name</label>
                <input
                  type="text"
                  placeholder="e.g., Killowen Construction"
                  value={contractorFormData.name}
                  onChange={(e) => handleContractorFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Is General Contractor? */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Is this a General Contractor?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isGC"
                      checked={contractorFormData.types.gc === true}
                      onChange={() => handleContractorTypeChange('gc', true)}
                      className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isGC"
                      checked={contractorFormData.types.gc === false}
                      onChange={() => handleContractorTypeChange('gc', false)}
                      className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-500"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* Specialty Types - Only show if NOT a GC */}
              {contractorFormData.types.gc === false && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialty / Trade</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractorFormData.types.electrical}
                        onChange={(e) => handleContractorTypeChange('electrical', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Electrical</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractorFormData.types.plumbing}
                        onChange={(e) => handleContractorTypeChange('plumbing', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Plumbing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractorFormData.types.hvac}
                        onChange={(e) => handleContractorTypeChange('hvac', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">HVAC</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractorFormData.types.roofing}
                        onChange={(e) => handleContractorTypeChange('roofing', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Roofing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractorFormData.types.flooring}
                        onChange={(e) => handleContractorTypeChange('flooring', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Flooring</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractorFormData.types.drywall}
                        onChange={(e) => handleContractorTypeChange('drywall', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Drywall</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractorFormData.types.paint}
                        onChange={(e) => handleContractorTypeChange('paint', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Paint</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contractorFormData.types.cabinets}
                        onChange={(e) => handleContractorTypeChange('cabinets', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">Cabinets</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Point of Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Point of Contact</label>
                <input
                  type="text"
                  placeholder="e.g., Tyler Farrel"
                  value={contractorFormData.pointOfContact}
                  onChange={(e) => handleContractorFormChange('pointOfContact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="(385) 204-4570"
                  value={contractorFormData.phone}
                  onChange={(e) => handleContractorFormChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={contractorFormData.email}
                  onChange={(e) => handleContractorFormChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Lockbox Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lockbox Code</label>
                <input
                  type="text"
                  placeholder="4-digit code"
                  maxLength={4}
                  value={contractorFormData.lockboxCode}
                  onChange={(e) => handleContractorFormChange('lockboxCode', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">For property entry access</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setAddContractorModalOpen(false)}
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
                    console.log('Adding contractor:', contractorFormData)
                    setAddContractorModalOpen(false)
                    setContractorFormData({
                      name: '',
                      types: { gc: null, electrical: false, plumbing: false, hvac: false, roofing: false, flooring: false, drywall: false, paint: false, cabinets: false },
                      pointOfContact: '',
                      phone: '',
                      email: '',
                      lockboxCode: ''
                    })
                  }}
                  className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Add Contractor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Icon Components
function NavIcon({ name, active }) {
  const iconClass = `w-5 h-5 ${active ? 'text-gray-900' : 'text-gray-400'}`
  
  switch (name) {
    case 'home':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      )
    case 'folder':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      )
    case 'chart':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    case 'users':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    case 'settings':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    default:
      return null
  }
}

function SearchIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

function HamburgerIcon({ className, style }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
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

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
}

function ChevronUpIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
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

function WarningIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

function FilterIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  )
}

function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}

function BuildingIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function PhoneIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  )
}

function EmailIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function WrenchIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  )
}

function CopyIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function ImageIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function EyeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function DownloadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
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

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
}

function AttachmentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
  )
}

function NotesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function LinkIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  )
}

export default ProjectDetail