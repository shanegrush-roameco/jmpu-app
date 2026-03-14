import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import GlobalNav from '../components/GlobalNav'
import AISummaryModal from '../components/modals/AISummaryModal'
import EditProjectModal from '../components/modals/EditProjectModal'
import { MessagesTab } from '../components/messages'
import FinancialValidation from '../components/FinancialValidation'
import { supabase } from '../lib/supabase'
import { useTasks, updateTask } from '../hooks/useTasks'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { useQuickBooksInvoices } from '../hooks/useQuickBooks'
import { ChevronDown, Close } from '@carbon/icons-react'
import AddPermitModal from '../components/modals/AddPermitModal'
import GanttModal from '../components/modals/GanttModal'
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
    { id: 6, name: 'Sign-off', status: 'pending', color: '#E5E7EB' },
    { id: 7, name: 'Complete', status: 'pending', color: '#E5E7EB' },
    { id: 8, name: 'Invoicing', status: 'pending', color: '#E5E7EB' },
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
      { name: 'Sign-off', start: 5, duration: 1, row: 6, color: '#E5E7EB' },
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
    { id: 1, name: 'Kitchen-Before01', type: 'JPG', project: 'Project Alpha', uploadedBy: 'J. O\'Berry' },
    { id: 2, name: 'Kitchen-Before02', type: 'JPG', project: 'Project Alpha', uploadedBy: 'J. O\'Berry' },
    { id: 3, name: 'Kitchen-Before03', type: 'JPG', project: 'Project Alpha', uploadedBy: 'J. O\'Berry' },
    { id: 4, name: 'Electrical Permit, Project Alpha #1283614-1', type: 'JPG', project: 'Project Alpha', uploadedBy: 'J. O\'Berry' },
    { id: 5, name: 'Garage-Before01', type: 'JPG', project: 'Project Alpha', uploadedBy: 'J. O\'Berry' },
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

// ─── MiniGantt: dynamic preview in the timeline card ──────────────────────
const MINI_STATUS_COLORS = {
  completed:   '#38A169',
  in_progress: '#A0AEC0',
  on_hold:     '#C99700',
  blocked:     '#DE071C',
}
const MINI_DAY_W    = 28
const MINI_LEFT_W   = 110
const MINI_MONTH_H  = 28
const MINI_WEEK_H   = 24
const MINI_DAY_H    = 20
const MINI_ROW_H    = 36

function miniToDate(str) {
  if (!str) return null
  const parts = str.split('-').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return isNaN(d.getTime()) ? null : d
}
function miniAddDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function miniDiff(a, b) { return Math.round((b.getTime() - a.getTime()) / 86_400_000) }

function MiniGantt({ phases }) {
  const allDates = []
  phases.forEach(p => {
    if (p.start_date) allDates.push(miniToDate(p.start_date))
    if (p.due_date)   allDates.push(miniToDate(p.due_date))
  })
  const valid = allDates.filter(Boolean)
  if (!valid.length) return null

  let axisStart = miniAddDays(new Date(Math.min(...valid.map(d => d.getTime()))), -3)
  const dow = axisStart.getDay()
  if (dow !== 1) axisStart = miniAddDays(axisStart, dow === 0 ? -6 : -(dow - 1))
  const axisEnd = miniAddDays(new Date(Math.max(...valid.map(d => d.getTime()))), 7)
  const totalDays = miniDiff(axisStart, axisEnd) + 1
  const days = Array.from({ length: totalDays }, (_, i) => miniAddDays(axisStart, i))

  const months = []
  days.forEach((d, i) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!months.length || months[months.length - 1].key !== key) {
      months.push({ key, label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }), startIdx: i, count: 0 })
    }
    months[months.length - 1].count++
  })

  const weeks = []
  days.forEach((d, i) => {
    if (!weeks.length || d.getDay() === 1) {
      weeks.push({ label: `Week ${weeks.length + 1}`, startDate: d, startIdx: i, count: 0 })
    }
    weeks[weeks.length - 1].count++
  })

  const fmtWeek = (start, count) => {
    const end = miniAddDays(start, count - 1)
    const fmt = d => `${String(d.getDate()).padStart(2,'0')} ${d.toLocaleString('en-US',{month:'short'}).toUpperCase()}`
    return `${fmt(start)} - ${fmt(end)}`
  }

  const today = new Date(); today.setHours(0,0,0,0)
  const todayIdx = miniDiff(axisStart, today)
  const todayX = todayIdx >= 0 && todayIdx < totalDays ? todayIdx * MINI_DAY_W + MINI_DAY_W / 2 : null

  const barProps = (startStr, endStr) => {
    if (!startStr) return null
    const s = miniToDate(startStr); if (!s) return null
    const left = miniDiff(axisStart, s) * MINI_DAY_W
    const e = miniToDate(endStr)
    if (e) return { left, width: Math.max(miniDiff(s, e), 1) * MINI_DAY_W, isDot: false }
    return { left: left + MINI_DAY_W / 2, isDot: true }
  }

  const totalW = totalDays * MINI_DAY_W

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', overflowX: 'auto' }}>
        <div style={{ width: MINI_LEFT_W, minWidth: MINI_LEFT_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 10, background: 'white', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ height: MINI_MONTH_H + MINI_WEEK_H + MINI_DAY_H, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-end', padding: '0 10px 5px' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phase</span>
          </div>
          {phases.map((phase, pi) => (
            <div key={phase.id} style={{ height: MINI_ROW_H, display: 'flex', alignItems: 'center', padding: '0 10px', borderBottom: '1px solid #F1F5F9', background: pi % 2 === 1 ? '#FAFAFA' : 'white', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, flexShrink: 0, background: phase.color || MINI_STATUS_COLORS[(phase.status||'').toLowerCase()] || '#A0AEC0' }} />
              <span style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{phase.name}</span>
            </div>
          ))}
        </div>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <div style={{ width: totalW, position: 'relative' }}>
            <div style={{ display: 'flex', height: MINI_MONTH_H, borderBottom: '1px solid #E2E8F0', background: 'white' }}>
              {months.map((m, i) => (
                <div key={i} style={{ width: m.count * MINI_DAY_W, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #E2E8F0' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{m.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', height: MINI_WEEK_H, borderBottom: '1px solid #E2E8F0', background: 'white' }}>
              {weeks.map((w, i) => (
                <div key={i} style={{ width: w.count * MINI_DAY_W, display: 'flex', alignItems: 'center', paddingLeft: 5, borderRight: '1px solid #E2E8F0', gap: 4, overflow: 'hidden' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#4B5563', whiteSpace: 'nowrap' }}>{w.label}</span>
                  <span style={{ fontSize: 9, color: '#94A3B8', whiteSpace: 'nowrap' }}>{fmtWeek(w.startDate, w.count)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', height: MINI_DAY_H, borderBottom: '1px solid #E2E8F0', background: 'white' }}>
              {days.map((d, i) => (
                <div key={i} style={{ width: MINI_DAY_W, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, color: i === todayIdx ? '#C99700' : '#CBD5E0', fontWeight: i === todayIdx ? 700 : 400 }}>{String(d.getDate()).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
            {phases.map((phase, pi) => {
              const color = phase.color || MINI_STATUS_COLORS[(phase.status||'').toLowerCase()] || '#A0AEC0'
              const bp = barProps(phase.start_date, phase.due_date)
              return (
                <div key={phase.id} style={{ height: MINI_ROW_H, position: 'relative', borderBottom: '1px solid #F1F5F9', background: pi % 2 === 1 ? '#FAFAFA' : 'white' }}>
                  {weeks.map((w, wi) => (
                    <div key={wi} style={{ position: 'absolute', left: w.startIdx * MINI_DAY_W, top: 0, bottom: 0, width: w.count * MINI_DAY_W, background: wi % 2 === 1 ? 'rgba(0,0,0,0.012)' : 'transparent', borderRight: '1px solid #F1F5F9' }} />
                  ))}
                  {bp && !bp.isDot && (
                    <div style={{ position: 'absolute', left: bp.left + 2, top: '50%', transform: 'translateY(-50%)', width: Math.max(bp.width - 4, 12), height: 22, borderRadius: 5, background: color, display: 'flex', alignItems: 'center', paddingLeft: 7, overflow: 'hidden', zIndex: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phase.name}</span>
                    </div>
                  )}
                  {bp && bp.isDot && (
                    <div style={{ position: 'absolute', left: bp.left - 5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: color, zIndex: 2 }} />
                  )}
                  {todayX !== null && (
                    <div style={{ position: 'absolute', left: todayX, top: 0, bottom: 0, borderLeft: '2px dashed #C99700', zIndex: 6, opacity: 0.8 }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── Helper shared between components ────────────────────────────────────────
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

const PRIORITY_STYLES = {
  urgent: { label: 'Urgent', bg: '#FEE2E2', color: '#B91C1C' },
  high:   { label: 'High',   bg: '#FEF3C7', color: '#B45309' },
  medium: { label: 'Medium', bg: '#EFF6FF', color: '#1D4ED8' },
  low:    { label: 'Low',    bg: '#F3F4F6', color: '#6B7280' },
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ─── ProjectActionCenter ──────────────────────────────────────────────────────
function ProjectActionCenter({ tasks, loading, onToggle, onArchive, onRestore, completedSet, archivedSet }) {
  const [showArchived, setShowArchived] = useState(false)
  const activeTasks = tasks.filter(t => !t.is_archived && !archivedSet.has(t.id) && t.status !== 'completed' && !completedSet.has(t.id))
  const completedTasks = tasks.filter(t => !t.is_archived && !archivedSet.has(t.id) && (t.status === 'completed' || completedSet.has(t.id)))
  const archivedTasks = tasks.filter(t => t.is_archived || archivedSet.has(t.id))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-gray-50">
        <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Action Center</h3>
        {activeTasks.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF' }}>
            {activeTasks.length}
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="px-6 py-8 text-center"><p className="text-sm text-gray-400">Loading tasks...</p></div>
        ) : activeTasks.length === 0 && completedTasks.length === 0 && archivedTasks.length === 0 ? (
          <div className="px-6 py-8 text-center"><p className="text-sm text-gray-400">No tasks yet for this project.</p></div>
        ) : (
          <>
            {/* Active */}
            {activeTasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <button
                  onClick={() => onToggle(task.id, task.status)}
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors hover:border-gray-400"
                  style={{ borderColor: '#D1D5DB' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#1D1D1F' }}>{task.title}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.assigned_to_profile?.full_name && (
                      <span className="text-xs text-gray-500">{task.assigned_to_profile.full_name}</span>
                    )}
                    {task.due_date && (
                      <>
                        {task.assigned_to_profile?.full_name && <span className="text-xs text-gray-300">•</span>}
                        <span className={`text-xs ${isOverdue(task.due_date) ? 'text-red-500' : 'text-gray-400'}`}>
                          Due {formatDate(task.due_date)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                {task.description && (
                  <p className="hidden lg:block text-sm text-gray-400 truncate max-w-xs flex-shrink-0">{task.description}</p>
                )}
                {task.priority && <PriorityBadge priority={task.priority} />}
              </div>
            ))}

            {/* Completed */}
            {completedTasks.length > 0 && (
              <>
                <div className="px-6 py-2.5 flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-400">Completed</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">{completedTasks.length}</span>
                </div>
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 px-6 py-3 bg-gray-50/50">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1D1D1F', borderColor: '#1D1D1F' }}>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400 line-through truncate">{task.title}</p>
                      {task.assigned_to_profile?.full_name && (
                        <span className="text-xs text-gray-400">{task.assigned_to_profile.full_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => onToggle(task.id, task.status)} className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100">Reopen</button>
                      <button onClick={() => onArchive(task.id)} className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100">Archive</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Archived */}
            {archivedTasks.length > 0 && (
              <>
                <button onClick={() => setShowArchived(v => !v)} className="w-full px-6 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xs font-medium uppercase tracking-wider text-gray-300">Archived</span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-300">{archivedTasks.length}</span>
                  <ChevronDown size={14} className={`text-gray-300 transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                </button>
                {showArchived && archivedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 px-6 py-3 bg-gray-50/30">
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E5E7EB', borderColor: '#E5E7EB' }}>
                      <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 line-through truncate">{task.title}</p>
                      <span className="text-xs text-gray-300">{task.archived_at ? `Archived ${new Date(task.archived_at).toLocaleDateString()}` : ''}</span>
                    </div>
                    <button onClick={() => onRestore(task.id)} className="text-xs font-medium text-gray-300 hover:text-gray-600 transition-colors px-3 py-1 rounded-lg hover:bg-gray-100 flex-shrink-0">Restore</button>
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

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'messages', label: 'Messages' },
  { id: 'financials', label: 'Financials' },
  { id: 'permits', label: 'Permits' },
  { id: 'contractors', label: 'Contractors' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'files', label: 'Files & Notes' },
]

function ProjectDetail({ user }) {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') || 'overview'
  const [activeTab, setActiveTab] = useState(initialTab)

  const { profile } = useCurrentProfile()
  const isAdmin = profile?.role === 'admin'

 // Scroll to top when arriving via tab param (e.g., from notification)
  useEffect(() => {
    if (searchParams.get('tab')) {
      setTimeout(() => {
        const scrollContainer = document.querySelector('.overflow-y-auto')
        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        }
      }, 500)
    }
  }, [])

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [showGantt, setShowGantt] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [onHoldModalOpen, setOnHoldModalOpen] = useState(false)
  const [blockedModalOpen, setBlockedModalOpen] = useState(false)
  const [addPermitModalOpen, setAddPermitModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [notesModalOpen, setNotesModalOpen] = useState(false)
  const [addContractorModalOpen, setAddContractorModalOpen] = useState(false)
  const [aiSummaryModalOpen, setAiSummaryModalOpen] = useState(false)
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
  const [notesFormData, setNotesFormData] = useState({
    notes: '',
    attachment: null
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
        if (aiSummaryModalOpen) setAiSummaryModalOpen(false)
        if (addPermitModalOpen) setAddPermitModalOpen(false)
        if (onHoldModalOpen) setOnHoldModalOpen(false)
        if (blockedModalOpen) setBlockedModalOpen(false)
        if (showGantt) setShowGantt(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [editModalOpen, invoiceModalOpen, paymentModalOpen, reportModalOpen, notesModalOpen, addContractorModalOpen, aiSummaryModalOpen, addPermitModalOpen, onHoldModalOpen, blockedModalOpen, showGantt])

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

  // Fetch real project data
  const [project, setProject] = useState(null)
  const [projectLoading, setProjectLoading] = useState(true)
  useEffect(() => {
    if (!projectId) return
    const fetchProject = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      if (data) setProject(data)
      setProjectLoading(false)
    }
    fetchProject()
  }, [projectId])

  // Real tasks for this project
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks({ projectId })
  const [completedTaskIds, setCompletedTaskIds] = useState(new Set())
  const [archivedTaskIds, setArchivedTaskIds] = useState(new Set())
  const [showArchived, setShowArchived] = useState(false)

  const toggleTaskComplete = useCallback(async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed'
    setCompletedTaskIds(prev => {
      const next = new Set(prev)
      newStatus === 'completed' ? next.add(taskId) : next.delete(taskId)
      return next
    })
    await updateTask(taskId, { status: newStatus })
    refetchTasks()
  }, [refetchTasks])

  const archiveTask = useCallback(async (taskId) => {
    setArchivedTaskIds(prev => new Set(prev).add(taskId))
    await updateTask(taskId, { is_archived: true, archived_at: new Date().toISOString() })
    refetchTasks()
  }, [refetchTasks])

  const restoreTask = useCallback(async (taskId) => {
    setArchivedTaskIds(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
    await updateTask(taskId, { is_archived: false, archived_at: null, status: 'in_progress' })
    refetchTasks()
  }, [refetchTasks])

  // Contacts for this project
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(true)
  useEffect(() => {
    if (!projectId) return
    const fetchContacts = async () => {
      const { data } = await supabase
        .from('project_contacts')
        .select('*')
        .eq('project_id', projectId)
        .order('is_primary', { ascending: false })
      setContacts(data || [])
      setContactsLoading(false)
    }
    fetchContacts()
  }, [projectId])

  // Phases for this project
  const [phases, setPhasesData] = useState([])
  const [phasesLoading, setPhasesLoading] = useState(true)
  useEffect(() => {
    if (!projectId) return
    const fetchPhases = async () => {
      const { data } = await supabase
        .from('phases')
        .select('*')
        .eq('project_id', projectId)
        .order('order', { ascending: true })
      setPhasesData(data || [])
      setPhasesLoading(false)
    }
    fetchPhases()
  }, [projectId])

  // On Hold toggle
  const handleOnHoldToggle = async () => {
    if (!project) return
    if (project.is_on_hold) {
      // Remove hold immediately
      setOnHoldSaving(true)
      const { data } = await supabase
        .from('projects')
        .update({ is_on_hold: false, on_hold_note: null })
        .eq('id', projectId)
        .select()
        .single()
      if (data) setProject(data)
      setOnHoldSaving(false)
    } else {
      // Open modal to collect note
      setOnHoldNote('')
      setOnHoldModalOpen(true)
    }
  }

  const handleOnHoldConfirm = async () => {
    if (!onHoldNote.trim()) return
    setOnHoldSaving(true)
    const { data } = await supabase
      .from('projects')
      .update({ is_on_hold: true, on_hold_note: onHoldNote.trim() })
      .eq('id', projectId)
      .select()
      .single()
    if (data) setProject(data)
    setOnHoldModalOpen(false)
    setOnHoldNote('')
    setOnHoldSaving(false)
  }

  // Blocked toggle
  const handleBlockedToggle = async () => {
    if (!project) return
    if (project.is_blocked) {
      setBlockedSaving(true)
      const { data } = await supabase
        .from('projects')
        .update({ is_blocked: false, blocked_task_id: null })
        .eq('id', projectId)
        .select()
        .single()
      if (data) setProject(data)
      setBlockedSaving(false)
    } else {
      setBlockedTaskId('')
      setBlockedModalOpen(true)
    }
  }

  const handleBlockedConfirm = async () => {
    if (!blockedTaskId) return
    setBlockedSaving(true)
    const { data } = await supabase
      .from('projects')
      .update({ is_blocked: true, blocked_task_id: blockedTaskId })
      .eq('id', projectId)
      .select()
      .single()
    if (data) setProject(data)
    setBlockedModalOpen(false)
    setBlockedTaskId('')
    setBlockedSaving(false)
  }

  // QB Invoices for this project
  const { invoices, loading: invoicesLoading } = useQuickBooksInvoices({ projectId })
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('All')

  const [onHoldNote, setOnHoldNote] = useState('')
  const [onHoldSaving, setOnHoldSaving] = useState(false)
  const [blockedTaskId, setBlockedTaskId] = useState('')
  const [blockedSaving, setBlockedSaving] = useState(false)

  // Files for this project
  const [projectFiles, setProjectFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(true)
  const [fileSearch, setFileSearch] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState('All')
  const SUPABASE_STORAGE_URL = 'https://mbwiaojxmaxsmoykdnww.supabase.co/storage/v1/object/public/project-files'

  const fetchFiles = useCallback(async () => {
    if (!projectId) return
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setProjectFiles(data || [])
    setFilesLoading(false)
  }, [projectId])

  useEffect(() => { fetchFiles() }, [fetchFiles])

  const getFileUrl = (filePath) => `${SUPABASE_STORAGE_URL}/${filePath}`

  const handleDownload = async (file) => {
    const url = getFileUrl(file.file_path)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Permits for this project
  const [permits, setPermits] = useState([])
  const [permitsLoading, setPermitsLoading] = useState(true)
  const [permitTypeFilter, setPermitTypeFilter] = useState('All')
  useEffect(() => {
    if (!projectId) return
    const fetchPermits = async () => {
      const { data } = await supabase
        .from('permits')
        .select('*')
        .eq('project_id', projectId)
        .order('application_date', { ascending: false })
      setPermits(data || [])
      setPermitsLoading(false)
    }
    fetchPermits()
  }, [projectId])

  return (
    <GlobalNav user={user} activeNav="projects">
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
                {project?.name || '...'} {project?.project_number ? `#${project.project_number}` : ''}
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
                  onClick={() => setAddPermitModalOpen(true)}
                  className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  Add Permit/Violation
                </button>
              ) : activeTab === 'contractors' ? (
                null
              ) : (
                <>
                  <button 
                    onClick={() => setEditModalOpen(true)}
                    className="w-full lg:w-auto px-5 py-2.5 rounded-[8px] text-sm font-medium text-white hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#1D1D1F' }}
                  >
                    Edit Project
                  </button>
                  <button 
                    onClick={() => setAiSummaryModalOpen(true)}
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
            {/* Phase Card Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Project Phases</h3>
                {phases.length > 0 && (
                  (phases.find(p => p.status === 'in_progress' || p.status === 'on_hold' || p.status === 'blocked') ||
                   phases.find(p => p.status !== 'completed'))
                    ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                        {(phases.find(p => p.status === 'in_progress' || p.status === 'on_hold' || p.status === 'blocked') || phases.find(p => p.status !== 'completed')).name}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                        Complete
                      </span>
                    )
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Blocked toggle */}
                <button
                  onClick={handleBlockedToggle}
                  disabled={blockedSaving}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                  style={{
                    backgroundColor: project?.is_blocked ? '#FEE2E2' : 'transparent',
                    color: project?.is_blocked ? '#B91C1C' : '#6B7280',
                    border: project?.is_blocked ? '1px solid #FECACA' : '1px solid #E5E7EB',
                  }}
                  onMouseEnter={(e) => { if (!project?.is_blocked) e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                  onMouseLeave={(e) => { if (!project?.is_blocked) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {project?.is_blocked ? 'Blocked -- Remove' : 'Mark Blocked'}
                </button>
                {/* On Hold toggle */}
                <button
                  onClick={handleOnHoldToggle}
                  disabled={onHoldSaving}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                  style={{
                    backgroundColor: project?.is_on_hold ? '#FEF3C7' : 'transparent',
                    color: project?.is_on_hold ? '#92400E' : '#6B7280',
                    border: project?.is_on_hold ? '1px solid #FDE68A' : '1px solid #E5E7EB',
                  }}
                  onMouseEnter={(e) => { if (!project?.is_on_hold) e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                  onMouseLeave={(e) => { if (!project?.is_on_hold) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {project?.is_on_hold ? 'On Hold -- Remove' : 'Place on Hold'}
                </button>
              </div>
            </div>

            {/* Blocked Banner */}
            {project?.is_blocked && (
              <div className="flex items-start gap-2 mb-3 px-4 py-3 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                <span className="text-sm font-medium" style={{ color: '#B91C1C' }}>Blocked by:</span>
                <span className="text-sm" style={{ color: '#B91C1C' }}>
                  {tasks.find(t => t.id === project.blocked_task_id)?.title || 'a task'}
                </span>
              </div>
            )}

            {/* On Hold Banner */}
            {project?.is_on_hold && (
              <div className="flex items-start gap-2 mb-3 px-4 py-3 rounded-xl" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <span className="text-sm font-medium" style={{ color: '#92400E' }}>On Hold:</span>
                <span className="text-sm" style={{ color: '#92400E' }}>{project.on_hold_note}</span>
              </div>
            )}

            {/* Desktop: Full Phase Stepper */}
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 rounded-full" />
                <div
                  className="absolute top-3 left-0 h-1 rounded-full"
                  style={{
                    width: phases.length > 0 ? `${(phases.filter(p => p.status === 'completed').length / phases.length) * 100}%` : '0%',
                    backgroundColor: project?.is_blocked ? '#EF4444' : project?.is_on_hold ? '#EAB308' : '#22C55E'
                  }}
                />
                <div className="relative flex justify-between">
                  {phases.map((phase) => {
                    const isComplete = phase.status === 'completed'
                    const isCurrent = phase.status === 'in_progress' || phase.status === 'on_hold' || phase.status === 'blocked'
                    return (
                      <div key={phase.id} className="flex flex-col items-center" style={{ width: `${100 / phases.length}%` }}>
                        <div
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center z-10"
                          style={{
                            backgroundColor: isComplete ? '#22C55E' : isCurrent && project?.is_blocked ? '#EF4444' : isCurrent ? '#22C55E' : '#FFFFFF',
                            borderColor: isComplete ? '#22C55E' : isCurrent && project?.is_blocked ? '#EF4444' : isCurrent && project?.is_on_hold ? '#EAB308' : isCurrent ? '#22C55E' : '#D1D5DB',
                            borderWidth: isCurrent && project?.is_on_hold && !project?.is_blocked ? '3px' : '2px',
                          }}
                        >
                          {isComplete && <CheckIcon className="w-3 h-3 text-white" />}
                          {isCurrent && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.is_blocked ? '#FEE2E2' : '#FFFFFF' }} />}
                        </div>
                        <span className={`text-xs mt-2 text-center ${!isComplete && !isCurrent ? 'text-gray-400' : 'text-gray-700'}`}>
                          {phase.name}{' '}
                          {isCurrent && project?.is_on_hold && <span className="text-yellow-600">OH</span>}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Mobile: Simplified Phase Indicator */}
            <div className="lg:hidden">
              {phases.length > 0 && (() => {
                const pct = `${(phases.filter(p => p.status === 'completed').length / phases.length) * 100}%`
                const barColor = project?.is_blocked ? '#EF4444' : project?.is_on_hold ? '#EAB308' : '#22C55E'
                const currentPhase = phases.find(p => p.status === 'in_progress' || p.status === 'on_hold' || p.status === 'blocked')
                return (
                  <>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: pct, backgroundColor: barColor }} />
                    </div>
                    {currentPhase && (
                      <p className="text-xs text-center" style={{ color: barColor }}>{currentPhase.name}</p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>

          {/* Financial Summary Cards - Only shown when Financials tab is selected */}
          {activeTab === 'financials' && (() => {
            const totalBudget = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
            const paidInvoices = invoices.filter(inv => inv.status?.toLowerCase() === 'paid')
            const unpaidInvoices = invoices.filter(inv => inv.status?.toLowerCase() !== 'paid')
            const budgetAvailable = totalBudget - paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
            const completedTaskCount = tasks.filter(t => !t.is_archived && (t.status === 'completed' || completedTaskIds.has(t.id))).length
            const totalTaskCount = tasks.filter(t => !t.is_archived).length
            const scopePct = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0
            return (
            <div className="mb-6 -mr-4 lg:mr-0">
              <div className="flex lg:grid lg:grid-cols-5 gap-4 overflow-x-auto snap-x snap-mandatory pr-4 lg:pr-0">
                {/* Total Budget */}
                <div className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}>
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Total Budget</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      {invoicesLoading ? '...' : `$${(totalBudget / 1000).toFixed(0)}k`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: totalBudget > 0 ? `${Math.round((totalBudget - budgetAvailable) / totalBudget * 100)}%` : '0%', backgroundColor: '#22C55E' }} />
                    <div className="h-full" style={{ width: totalBudget > 0 ? `${Math.round(budgetAvailable / totalBudget * 100)}%` : '100%', backgroundColor: '#3B82F6' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">
                      {totalBudget > 0 ? `${Math.round((totalBudget - budgetAvailable) / totalBudget * 100)}% Paid · ${Math.round(budgetAvailable / totalBudget * 100)}% Remaining` : 'No invoices'}
                    </p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Budget Available */}
                <div className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}>
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Budget Available</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      {invoicesLoading ? '...' : `$${(budgetAvailable / 1000).toFixed(0)}k`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: totalBudget > 0 ? `${Math.round(budgetAvailable / totalBudget * 100)}%` : '0%', backgroundColor: '#22C55E' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">Unpaid balance</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Draws Out */}
                <div className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}>
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#EAB308' }} />
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Draws Out</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      {invoicesLoading ? '...' : unpaidInvoices.length}
                    </span>
                    <span className="text-base font-bold" style={{ color: '#919191' }}>Invoices</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: invoices.length > 0 ? `${Math.round(unpaidInvoices.length / invoices.length * 100)}%` : '0%', backgroundColor: '#EAB308' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">Awaiting payment</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Draw Completed */}
                <div className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}>
                  <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Draw Completed</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>
                      {invoicesLoading ? '...' : paidInvoices.length}
                    </span>
                    <span className="text-base font-bold" style={{ color: '#919191' }}>Invoices</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: invoices.length > 0 ? `${Math.round(paidInvoices.length / invoices.length * 100)}%` : '0%', backgroundColor: '#3B82F6' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">Paid invoices</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>

                {/* Scope */}
                <div className="bg-white p-5 relative flex-shrink-0 min-w-[200px] lg:min-w-0 snap-start" style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}>
                  <p className="text-sm mb-1" style={{ color: '#1D1D1F' }}>Scope</p>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-semibold" style={{ color: '#1D1D1F' }}>{scopePct}%</span>
                    <span className="text-base font-bold" style={{ color: '#22C55E' }}>Complete</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden flex">
                    <div className="h-full" style={{ width: `${scopePct}%`, backgroundColor: '#22C55E' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate pr-2">{completedTaskCount} of {totalTaskCount} tasks</p>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
            )
          })()}

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

              {/* Overview Tab Content - Action Center */}
              {activeTab === 'overview' && (
                <ProjectActionCenter
                  tasks={tasks}
                  loading={tasksLoading}
                  onToggle={toggleTaskComplete}
                  onArchive={archiveTask}
                  onRestore={restoreTask}
                  completedSet={completedTaskIds}
                  archivedSet={archivedTaskIds}
                />
              )}

                            {/* Contacts Tab Content */}
              {activeTab === 'contacts' && (
                <div>
                  {contactsLoading ? (
                    <div className="p-6 text-center text-sm text-gray-400">Loading contacts...</div>
                  ) : contacts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">No contacts found for this project.</div>
                  ) : contacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      className={`p-6 ${index !== contacts.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      {/* Contact Header */}
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleContact(contact.id)}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
                            {contact.company || contact.name}
                          </h4>

                          <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                          {contact.role && (
                            <span
                              className="px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-1"
                              style={{ backgroundColor: '#1D1D1F' }}
                            >
                              <WrenchIcon className="w-3 h-3" />
                              {contact.role}
                            </span>
                          )}
                          {contact.is_primary && (
                            <span className="text-xs text-gray-400">Primary</span>
                          )}
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
                                <span className="font-medium">Contact: </span>{contact.name}
                              </span>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  <span className="font-medium">Phone: </span>{contact.phone}
                                </span>
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center gap-2">
                                <EmailIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  <span className="font-medium">Email: </span>{contact.email}
                                </span>
                              </div>
                            )}
                            {contact.notes && (
                              <div className="flex items-start gap-2">
                                <NotesIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                                <span className="text-sm text-gray-600">{contact.notes}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone}`}
                                className="px-4 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                style={{ color: '#111111', border: '1px solid #E5E7EB', minWidth: '220px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <PhoneIcon className="w-4 h-4" />
                                Call
                              </a>
                            )}
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                className="px-4 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                style={{ color: '#111111', border: '1px solid #E5E7EB', minWidth: '220px' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <EmailIcon className="w-4 h-4" />
                                Send Email
                              </a>
                            )}
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
                            value={fileSearch}
                            onChange={e => setFileSearch(e.target.value)}
                            className="w-full lg:w-80 pl-4 pr-10 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]"
                            style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                          />
                          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <div className="relative">
                          <select
                            value={fileTypeFilter}
                            onChange={e => setFileTypeFilter(e.target.value)}
                            className="px-4 py-2 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] appearance-none bg-white"
                            style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                          >
                            <option value="All">All Files</option>
                            <option value="Photos">Photos</option>
                            <option value="Documents">Documents</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <ChevronDown size={16} className="text-gray-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* File List */}
                    {filesLoading ? (
                      <div className="py-12 text-center text-sm text-gray-400">Loading files...</div>
                    ) : (() => {
                      const filtered = projectFiles.filter(f => {
                        const matchSearch = !fileSearch ||
                          f.name?.toLowerCase().includes(fileSearch.toLowerCase())
                        const ext = f.file_type?.toLowerCase() || f.name?.split('.').pop()?.toLowerCase() || ''
                        const matchType = fileTypeFilter === 'All' ||
                          (fileTypeFilter === 'Photos' && ['jpg','jpeg','png','heic','webp'].includes(ext)) ||
                          (fileTypeFilter === 'Documents' && ['pdf','xls','xlsx'].includes(ext))
                        return matchSearch && matchType
                      })
                      if (filtered.length === 0) return (
                        <div className="py-12 text-center text-sm text-gray-400">No files found for this project.</div>
                      )
                      return (
                        <div className="divide-y divide-gray-100">
                          {filtered.map((file) => {
                            const ext = file.file_type || file.name?.split('.').pop()?.toUpperCase() || 'FILE'
                            const fileUrl = getFileUrl(file.file_path)
                            return (
                              <div key={file.id} className="py-4">
                                {/* Desktop */}
                                <div className="hidden lg:flex lg:items-center lg:justify-between">
                                  <div className="flex items-center gap-3">
                                    <ImageIcon className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium text-sm" style={{ color: '#1D1D1F' }}>{file.name}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">.{ext}</span>
                                    {file.file_size && (
                                      <span className="text-sm text-gray-400">
                                        {file.file_size > 1048576
                                          ? `${(file.file_size / 1048576).toFixed(1)} MB`
                                          : `${Math.round(file.file_size / 1024)} KB`}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <a
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                      Preview
                                    </a>
                                    <button
                                      onClick={() => handleDownload(file)}
                                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                      <DownloadIcon className="w-4 h-4" />
                                      Download
                                    </button>
                                  </div>
                                </div>
                                {/* Mobile */}
                                <div className="lg:hidden">
                                  <div className="flex items-start gap-3 mb-2">
                                    <ImageIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm" style={{ color: '#1D1D1F' }}>{file.name}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">.{ext}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 ml-8">
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                      <EyeIcon className="w-4 h-4" />
                                      Preview
                                    </a>
                                    <button onClick={() => handleDownload(file)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                      <DownloadIcon className="w-4 h-4" />
                                      Download
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Financials Tab Content */}
              {activeTab === 'financials' && (
                <div className="p-6">
                {/* Financial Validation - Sprint 16 */}
                  <FinancialValidation
                    projectId={projectId}
                    userRole={user?.role || 'viewer'}
                  />
                  {/* Invoices Section */}
                  <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Invoices</h3>
                      <div className="flex flex-col lg:flex-row gap-3">
                        <div className="relative flex-1 lg:flex-none">
                          <input
                            type="text"
                            placeholder="Search"
                            value={invoiceSearch}
                            onChange={(e) => setInvoiceSearch(e.target.value)}
                            className="w-full lg:w-64 pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]"
                          />
                          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </div>
                        <div className="relative">
                          <select
                            value={invoiceFilter}
                            onChange={(e) => setInvoiceFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] appearance-none pr-10 bg-white"
                            style={{ fontSize: '14px' }}
                          >
                            <option>All</option>
                            <option>Paid</option>
                            <option>Open</option>
                            <option>Overdue</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Invoices Table - Desktop */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {invoicesLoading && (
                            <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">Loading invoices...</td></tr>
                          )}
                          {!invoicesLoading && (() => {
                            const statusColor = (s) => {
                              const v = s?.toLowerCase()
                              if (v === 'paid') return '#22C55E'
                              if (v === 'overdue') return '#EF4444'
                              return '#EAB308'
                            }
                            const filtered = invoices.filter(inv => {
                              const matchSearch = !invoiceSearch ||
                                inv.invoice_number?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                                inv.customer_name?.toLowerCase().includes(invoiceSearch.toLowerCase())
                              const matchFilter = invoiceFilter === 'All' ||
                                inv.status?.toLowerCase() === invoiceFilter.toLowerCase()
                              return matchSearch && matchFilter
                            })
                            if (filtered.length === 0) return (
                              <tr><td colSpan={5} className="py-8 text-center text-sm text-gray-400">No invoices found.</td></tr>
                            )
                            return filtered.map((inv) => (
                              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-4">
                                  <span className="text-sm font-medium underline cursor-pointer" style={{ color: '#1D1D1F' }}>
                                    {inv.invoice_number || inv.external_doc_number || '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-600 flex items-center gap-1">
                                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}
                                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm font-medium" style={{ color: statusColor(inv.status) }}>
                                    {inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1).toLowerCase() : '—'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-sm text-gray-600">{inv.customer_name || '—'}</span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className="text-sm text-gray-900">
                                    ${(inv.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </td>
                              </tr>
                            ))
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Invoices List - Mobile */}
                    <div className="lg:hidden divide-y divide-gray-100">
                      {invoicesLoading && (
                        <div className="py-8 text-center text-sm text-gray-400">Loading invoices...</div>
                      )}
                      {!invoicesLoading && invoices.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between py-3">
                          <div>
                            <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                              {inv.invoice_number || inv.external_doc_number || '—'}
                            </span>
                            <p className="text-xs text-gray-500 mt-0.5">
                              ${(inv.total_amount || 0).toLocaleString()} · {inv.status || '—'}
                            </p>
                          </div>
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      ))}
                    </div>

                    {/* Row count */}
                    {!invoicesLoading && invoices.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Permits Tab Content */}
              {activeTab === 'permits' && (() => {
                const PERMIT_STATUS_COLOR = {
                  not_applied: '#6B7280',
                  pending: '#EAB308',
                  approved: '#22C55E',
                  denied: '#EF4444',
                  expired: '#F97316',
                }
                const PERMIT_STATUS_LABEL = {
                  not_applied: 'Not Applied',
                  pending: 'Pending',
                  approved: 'Approved',
                  denied: 'Denied',
                  expired: 'Expired',
                }
                const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : null
                const uniqueTypes = ['All', ...Array.from(new Set(permits.map(p => p.permit_type).filter(Boolean)))]
                const filteredPermits = permitTypeFilter === 'All' ? permits : permits.filter(p => p.permit_type === permitTypeFilter)
                return (
                <div className="p-6">
                  {/* Permits & Violations Section */}
                  <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>Permits & Violations</h3>
                      <div className="relative w-full lg:w-auto">
                        <select
                          value={permitTypeFilter}
                          onChange={e => setPermitTypeFilter(e.target.value)}
                          className="w-full lg:w-auto px-4 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] appearance-none bg-white"
                          style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                        >
                          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                          <ChevronDown size={16} className="text-gray-500" />
                        </div>
                      </div>
                    </div>

                    {permitsLoading ? (
                      <div className="py-12 text-center text-sm text-gray-400">Loading permits...</div>
                    ) : filteredPermits.length === 0 ? (
                      <div className="py-12 text-center text-sm text-gray-400">No permits found for this project.</div>
                    ) : (
                      <>
                        {/* Permits Table - Desktop */}
                        <div className="hidden lg:block overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Permit / Violation</th>
                                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Applied For Date</th>
                                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Date</th>
                                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                <th className="text-left py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {filteredPermits.map((permit) => {
                                const statusColor = PERMIT_STATUS_COLOR[permit.status] || '#6B7280'
                                const statusLabel = PERMIT_STATUS_LABEL[permit.status] || permit.status || 'Unknown'
                                return (
                                  <tr key={permit.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 pr-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{permit.permit_type}</span>
                                        {permit.permit_number && (
                                          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">#{permit.permit_number}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                      <span className="text-sm text-gray-600">{formatDate(permit.application_date) || <span className="text-gray-400">NA</span>}</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                      {permit.approval_date ? (
                                        <span className="text-sm text-green-600">{formatDate(permit.approval_date)}</span>
                                      ) : (
                                        <span className="text-sm text-gray-400">NA</span>
                                      )}
                                    </td>
                                    <td className="py-3 pr-4">
                                      <span className="text-sm font-medium" style={{ color: statusColor }}>{statusLabel}</span>
                                    </td>
                                    <td className="py-3 pr-4">
                                      {permit.expiration_date ? (
                                        <span className="text-sm text-gray-600">{formatDate(permit.expiration_date)}</span>
                                      ) : (
                                        <span className="text-sm text-gray-400">NA</span>
                                      )}
                                    </td>
                                    <td className="py-3">
                                      {permit.document_url ? (
                                        <a
                                          href={permit.document_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                          View
                                          <LinkIcon className="w-4 h-4" />
                                        </a>
                                      ) : (
                                        <span className="text-sm text-gray-400">NA</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Permits List - Mobile */}
                        <div className="lg:hidden divide-y divide-gray-100">
                          {filteredPermits.map((permit) => {
                            const statusColor = PERMIT_STATUS_COLOR[permit.status] || '#6B7280'
                            const statusLabel = PERMIT_STATUS_LABEL[permit.status] || permit.status || 'Unknown'
                            return (
                              <div key={permit.id} className="py-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{permit.permit_type}</span>
                                    {permit.permit_number && (
                                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">#{permit.permit_number}</span>
                                    )}
                                  </div>
                                  <span className="text-xs font-medium" style={{ color: statusColor }}>{statusLabel}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <span>Applied: {formatDate(permit.application_date) || 'NA'}</span>
                                  {permit.approval_date && <span className="text-green-600">Approved: {formatDate(permit.approval_date)}</span>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
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
                )
              })()}

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

                </div>
              )}
              {/* Messages Tab Content */}
              {activeTab === 'messages' && (
                <MessagesTab 
                  projectId={projectId} 
                  currentUserId={user?.id}
                />
              )}
              {/* Placeholder for other tabs */}

              {!['overview', 'contacts', 'files', 'financials', 'permits', 'contractors', 'messages'].includes(activeTab) && (
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
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
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
                          {contractor.phone && (
                            <a
                              href={`tel:${contractor.phone}`}
                              className="w-full lg:w-auto px-6 py-2 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                              style={{ color: '#111111', border: '1px solid #E5E7EB' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <PhoneIcon className="w-4 h-4" />
                              Call
                            </a>
                          )}
                          {contractor.email && (
                            <a
                              href={`mailto:${contractor.email}`}
                              className="w-full lg:w-auto px-6 py-2 bg-transparent rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                              style={{ color: '#111111', border: '1px solid #E5E7EB' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <EmailIcon className="w-4 h-4" />
                              Send Email
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Project Timeline + Customer - Overview only */}
          {activeTab === 'overview' && (
            <>
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
                {/* Mini Gantt Preview */}
                {phases.length === 0 || !phases.some(p => p.start_date || p.due_date) ? (
                  <div className="border border-gray-200 rounded-lg p-8 flex items-center justify-center">
                    <span className="text-sm text-gray-400">No timeline data yet. Add phases with start and due dates.</span>
                  </div>
                ) : (
                  <MiniGantt phases={phases} />
                )}

                {/* View Gantt Chart Button */}
                <div className="flex justify-center mt-4">
                  <button
                    className="px-6 py-2.5 bg-transparent rounded-[8px] text-sm font-medium transition-colors"
                    style={{ color: '#111111', border: '1px solid #111111' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111111'; e.currentTarget.style.color = '#FFFFFF' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#111111' }}
                    onClick={() => setShowGantt(true)}
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
                <div className="w-3 h-3 rounded-full bg-gray-300" />
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
          </>) } {/* end activeTab === 'overview' */}

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={project}
        onSuccess={(updated) => {
          setProject(updated)
        }}
      />

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
      {/* AI Summary Modal */}
      <AISummaryModal
        isOpen={aiSummaryModalOpen}
        onClose={() => setAiSummaryModalOpen(false)}
        project={{
          id: project?.id || projectId,
          project_number: project?.project_number,
          name: project?.name,
          status: project?.status,
          phase: project?.current_phase,
          estimated_completion_date: project?.estimated_completion_date,
          budget: project?.budget,
          amount_spent: project?.amount_spent,
          permits: project?.permits,
        }}
        tasks={tasks.map(t => ({
          title: t.title,
          status: t.status,
          due_date: t.due_date,
          priority: t.priority,
        }))}
        showFinancials={isAdmin}
      />
      <AddPermitModal
        isOpen={addPermitModalOpen}
        onClose={() => setAddPermitModalOpen(false)}
        projectId={projectId}
        onSuccess={async () => {
          const { data } = await supabase
            .from('permits')
            .select('*')
            .eq('project_id', projectId)
            .order('application_date', { ascending: false })
          setPermits(data || [])
        }}
      />
      {/* Blocked Modal */}
      {blockedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setBlockedModalOpen(false)} />
          <div
            className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden"
            style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Mark as Blocked</h2>
              <button onClick={() => setBlockedModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Close size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Blocking Task <span style={{ color: '#E8500A' }}>*</span>
              </label>
              <div className="relative">
                <select
                  value={blockedTaskId}
                  onChange={(e) => setBlockedTaskId(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] appearance-none bg-white pr-10"
                  style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                  autoFocus
                >
                  <option value="">Select a task...</option>
                  {tasks
                    .filter(t => !t.is_archived && t.status !== 'completed')
                    .map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))
                  }
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <ChevronDown size={16} className="text-gray-500" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-400">This project cannot move forward until this task is resolved.</p>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setBlockedModalOpen(false)}
                className="px-5 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ color: '#111111', border: '1px solid #111111', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111111'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#111111' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBlockedConfirm}
                disabled={!blockedTaskId || blockedSaving}
                className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1D1D1F' }}
              >
                {blockedSaving ? 'Saving...' : 'Mark Blocked'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* On Hold Modal */}
      {onHoldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOnHoldModalOpen(false)} />
          <div
            className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden"
            style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold" style={{ color: '#1D1D1F' }}>Place on Hold</h2>
              <button onClick={() => setOnHoldModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Close size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason <span style={{ color: '#E8500A' }}>*</span>
              </label>
              <textarea
                value={onHoldNote}
                onChange={(e) => setOnHoldNote(e.target.value)}
                placeholder="What is blocking this project?"
                rows={3}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] resize-none"
                style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setOnHoldModalOpen(false)}
                className="px-5 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ color: '#111111', border: '1px solid #111111', backgroundColor: 'transparent' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111111'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#111111' }}
              >
                Cancel
              </button>
              <button
                onClick={handleOnHoldConfirm}
                disabled={!onHoldNote.trim() || onHoldSaving}
                className="px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#1D1D1F' }}
              >
                {onHoldSaving ? 'Saving...' : 'Place on Hold'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showGantt && (
        <GanttModal
          project={project}
          phases={phases}
          tasks={tasks}
          onClose={() => setShowGantt(false)}
        />
      )}
    </GlobalNav>
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