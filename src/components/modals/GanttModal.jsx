import { useEffect, useMemo, useState } from 'react'
import { Close, ChevronRight, ChevronDown } from '@carbon/icons-react'

// ─── Color constants ────────────────────────────────────────────────────────
const STATUS_COLORS = {
  complete:   '#38A169',
  completed:  '#38A169',
  on_hold:    '#C99700',
  blocked:    '#DE071C',
}
const INCOMPLETE_COLOR = '#A0AEC0'
const TODAY_COLOR      = '#C99700'

// ─── Layout constants ───────────────────────────────────────────────────────
const DAY_W        = 34   // px per day column
const PHASE_ROW_H  = 48   // px per phase row
const TASK_ROW_H   = 36   // px per task sub-row
const MONTH_H      = 32
const WEEK_H       = 26
const DAY_H        = 22
const HEADER_H     = MONTH_H + WEEK_H + DAY_H
const LEFT_W       = 200  // sticky left-column width

// ─── Helpers ────────────────────────────────────────────────────────────────
function toDate(str) {
  if (!str) return null
  const parts = str.split('-').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  return isNaN(d.getTime()) ? null : d
}

function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function getPhaseColor(phase) {
  if (phase.color) return phase.color
  return STATUS_COLORS[(phase.status || '').toLowerCase()] || INCOMPLETE_COLOR
}

function getTaskColor(task) {
  return STATUS_COLORS[(task.status || '').toLowerCase()] || INCOMPLETE_COLOR
}

function fmtWeekRange(startDate, count) {
  const end = addDays(startDate, count - 1)
  const fmt = (d) => {
    const day = String(d.getDate()).padStart(2, '0')
    const mon = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
    return `${day} ${mon}`
  }
  return `${fmt(startDate)} - ${fmt(end)}`
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function GanttModal({ project, phases = [], tasks = [], onClose }) {
  const [expandedPhases, setExpandedPhases] = useState({})

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const togglePhase = (id) =>
    setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }))

  // ── Build timeline axis ──────────────────────────────────────────────────
  const timeline = useMemo(() => {
    const allDates = []
    if (project?.start_date) allDates.push(toDate(project.start_date))
    if (project?.due_date)   allDates.push(toDate(project.due_date))
    phases.forEach(p => {
      if (p.start_date) allDates.push(toDate(p.start_date))
      if (p.due_date)   allDates.push(toDate(p.due_date))
    })
    tasks.forEach(t => {
      if (t.due_date) allDates.push(toDate(t.due_date))
    })

    const valid = allDates.filter(Boolean)
    if (!valid.length) return null

    // Snap start to Monday, add padding
    let minDate = addDays(new Date(Math.min(...valid)), -3)
    const dow = minDate.getDay()
    if (dow !== 1) minDate = addDays(minDate, dow === 0 ? -6 : -(dow - 1))
    const maxDate = addDays(new Date(Math.max(...valid)), 10)

    const totalDays = diffDays(minDate, maxDate) + 1
    const days = Array.from({ length: totalDays }, (_, i) => addDays(minDate, i))

    // Months
    const months = []
    let curMonth = null
    days.forEach((d, i) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!curMonth || curMonth.key !== key) {
        curMonth = {
          key,
          label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          startIdx: i,
          count: 0,
        }
        months.push(curMonth)
      }
      curMonth.count++
    })

    // Weeks (Mon-Sun)
    const weeks = []
    let curWeek = null
    days.forEach((d, i) => {
      if (!curWeek || d.getDay() === 1) {
        if (curWeek) weeks.push(curWeek)
        curWeek = { label: `Week ${weeks.length + 1}`, startDate: d, startIdx: i, count: 0 }
      }
      curWeek.count++
    })
    if (curWeek) weeks.push(curWeek)

    return { start: minDate, days, months, weeks }
  }, [phases, tasks, project])

  // Today offset (px from left edge of timeline)
  const todayX = useMemo(() => {
    if (!timeline) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = diffDays(timeline.start, today)
    if (diff < 0 || diff >= timeline.days.length) return null
    return diff * DAY_W + DAY_W / 2
  }, [timeline])

  // Given start + end dates, return bar positioning or dot flag
  const barProps = (startStr, endStr) => {
    if (!timeline || !startStr) return null
    const startDate = toDate(startStr)
    if (!startDate) return null
    const startDiff = diffDays(timeline.start, startDate)
    const endDate = toDate(endStr)
    if (endDate) {
      return { left: startDiff * DAY_W, width: Math.max(diffDays(startDate, endDate), 1) * DAY_W, isDot: false }
    }
    return { left: startDiff * DAY_W + DAY_W / 2, isDot: true }
  }

  const isEmpty = !timeline || phases.length === 0

  // ── Shared: today line across a row ─────────────────────────────────────
  const TodayLine = ({ opacity = 1 }) =>
    todayX !== null ? (
      <div style={{
        position: 'absolute', left: todayX, top: 0, bottom: 0, zIndex: 6,
        borderLeft: `2px dashed ${TODAY_COLOR}`, opacity,
      }} />
    ) : null

  // ── Shared: week stripe backgrounds ─────────────────────────────────────
  const WeekStripes = () =>
    timeline.weeks.map((w, wi) => (
      <div key={wi} style={{
        position: 'absolute', left: w.startIdx * DAY_W, top: 0, bottom: 0,
        width: w.count * DAY_W,
        background: wi % 2 === 1 ? 'rgba(0,0,0,0.013)' : 'transparent',
        borderRight: '1px solid #F1F5F9',
      }} />
    ))

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: '#F4F4F4', fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Header ── */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E2E8F0',
        padding: '18px 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Project Timeline
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1D1D1F', margin: 0 }}>
            {project?.name || 'Project'}
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#6B7280', transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          aria-label="Close timeline"
        >
          <Close size={20} />
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 24, display: 'flex', flexDirection: 'column' }}>
        {isEmpty ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#6B7280', margin: 0 }}>No timeline data yet</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
              Add phases with start and due dates to see the Gantt chart.
            </p>
          </div>
        ) : (
          <div style={{
            flex: 1, background: 'white', borderRadius: 16,
            boxShadow: '2px 4px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
              <div style={{ display: 'flex', minHeight: '100%' }}>

                {/* ── Sticky left column ── */}
                <div style={{
                  width: LEFT_W, minWidth: LEFT_W, flexShrink: 0,
                  position: 'sticky', left: 0, zIndex: 20,
                  background: 'white', borderRight: '1px solid #E2E8F0',
                }}>
                  {/* Header blank to match time axis */}
                  <div style={{
                    height: HEADER_H, borderBottom: '1px solid #E2E8F0',
                    display: 'flex', alignItems: 'flex-end',
                    padding: '0 16px 8px',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Phase
                    </span>
                  </div>

                  {/* Phase name rows */}
                  {phases.map((phase, pi) => {
                    const phaseTasks = tasks.filter(t => t.phase_id === phase.id)
                    const isExpanded = expandedPhases[phase.id]
                    const color = getPhaseColor(phase)

                    return (
                      <div key={phase.id}>
                        <div
                          style={{
                            height: PHASE_ROW_H, display: 'flex', alignItems: 'center',
                            padding: '0 16px', borderBottom: '1px solid #F1F5F9',
                            gap: 8, background: pi % 2 === 1 ? '#FAFAFA' : 'white',
                            cursor: phaseTasks.length ? 'pointer' : 'default',
                            userSelect: 'none',
                          }}
                          onClick={() => phaseTasks.length && togglePhase(phase.id)}
                        >
                          <span style={{ color: '#94A3B8', flexShrink: 0, display: 'flex', alignItems: 'center', width: 14 }}>
                            {phaseTasks.length > 0
                              ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)
                              : null}
                          </span>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#1D1D1F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {phase.name}
                          </span>
                        </div>

                        {isExpanded && phaseTasks.map(task => (
                          <div key={task.id} style={{
                            height: TASK_ROW_H, display: 'flex', alignItems: 'center',
                            padding: '0 16px 0 38px', borderBottom: '1px solid #F1F5F9',
                            gap: 6, background: '#F8FAFC',
                          }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: getTaskColor(task), flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>

                {/* ── Scrollable timeline ── */}
                <div style={{ flex: 1, overflowX: 'auto', position: 'relative' }}>
                  <div style={{ width: timeline.days.length * DAY_W, position: 'relative' }}>

                    {/* Month row */}
                    <div style={{
                      display: 'flex', height: MONTH_H, borderBottom: '1px solid #E2E8F0',
                      position: 'sticky', top: 0, zIndex: 10, background: 'white',
                    }}>
                      {timeline.months.map((m, i) => (
                        <div key={i} style={{
                          width: m.count * DAY_W, minWidth: m.count * DAY_W,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRight: '1px solid #E2E8F0',
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{m.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Week row */}
                    <div style={{
                      display: 'flex', height: WEEK_H, borderBottom: '1px solid #E2E8F0',
                      position: 'sticky', top: MONTH_H, zIndex: 10, background: 'white',
                    }}>
                      {timeline.weeks.map((w, i) => (
                        <div key={i} style={{
                          width: w.count * DAY_W, minWidth: w.count * DAY_W,
                          display: 'flex', alignItems: 'center',
                          paddingLeft: 6, borderRight: '1px solid #E2E8F0', gap: 4,
                        }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#4B5563', whiteSpace: 'nowrap' }}>
                            {w.label}
                          </span>
                          <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            {fmtWeekRange(w.startDate, w.count)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Day numbers row */}
                    <div style={{
                      display: 'flex', height: DAY_H, borderBottom: '1px solid #E2E8F0',
                      position: 'sticky', top: MONTH_H + WEEK_H, zIndex: 10, background: 'white',
                    }}>
                      {timeline.days.map((d, i) => {
                        const today = new Date(); today.setHours(0,0,0,0)
                        const isToday = diffDays(timeline.start, today) === i
                        return (
                          <div key={i} style={{
                            width: DAY_W, minWidth: DAY_W,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{
                              fontSize: 10,
                              color: isToday ? TODAY_COLOR : '#CBD5E0',
                              fontWeight: isToday ? 700 : 400,
                            }}>
                              {String(d.getDate()).padStart(2, '0')}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Phase + task rows */}
                    {phases.map((phase, pi) => {
                      const phaseTasks = tasks.filter(t => t.phase_id === phase.id)
                      const isExpanded = expandedPhases[phase.id]
                      const color = getPhaseColor(phase)
                      const bp = barProps(phase.start_date, phase.due_date)

                      return (
                        <div key={phase.id}>
                          {/* Phase row */}
                          <div style={{
                            height: PHASE_ROW_H, position: 'relative',
                            borderBottom: '1px solid #F1F5F9',
                            background: pi % 2 === 1 ? '#FAFAFA' : 'white',
                          }}>
                            <WeekStripes />

                            {bp && !bp.isDot && (
                              <div style={{
                                position: 'absolute',
                                left: bp.left + 4,
                                top: '50%', transform: 'translateY(-50%)',
                                width: Math.max(bp.width - 8, 24),
                                height: 28, borderRadius: 6, background: color,
                                display: 'flex', alignItems: 'center',
                                paddingLeft: 10, paddingRight: 8, overflow: 'hidden',
                                zIndex: 2,
                              }}>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {phase.name}
                                </span>
                              </div>
                            )}

                            {bp && bp.isDot && (
                              <div style={{
                                position: 'absolute',
                                left: bp.left - 6, top: '50%', transform: 'translateY(-50%)',
                                display: 'flex', alignItems: 'center', gap: 6, zIndex: 2,
                              }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: 500, color, whiteSpace: 'nowrap' }}>
                                  {phase.name}
                                </span>
                              </div>
                            )}

                            <TodayLine />
                          </div>

                          {/* Task sub-rows */}
                          {isExpanded && phaseTasks.map(task => {
                            const tColor = getTaskColor(task)
                            const tbp = barProps(task.start_date || phase.start_date, task.due_date)
                            return (
                              <div key={task.id} style={{
                                height: TASK_ROW_H, position: 'relative',
                                borderBottom: '1px solid #F1F5F9', background: '#F8FAFC',
                              }}>
                                <WeekStripes />

                                {tbp && !tbp.isDot && (
                                  <div style={{
                                    position: 'absolute',
                                    left: tbp.left + 4,
                                    top: '50%', transform: 'translateY(-50%)',
                                    width: Math.max(tbp.width - 8, 16),
                                    height: 20, borderRadius: 4,
                                    background: tColor, opacity: 0.8,
                                    display: 'flex', alignItems: 'center',
                                    paddingLeft: 8, overflow: 'hidden', zIndex: 2,
                                  }}>
                                    <span style={{ fontSize: 11, fontWeight: 500, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {task.title}
                                    </span>
                                  </div>
                                )}

                                {tbp && tbp.isDot && (
                                  <div style={{
                                    position: 'absolute',
                                    left: tbp.left - 5, top: '50%', transform: 'translateY(-50%)',
                                    display: 'flex', alignItems: 'center', gap: 5, zIndex: 2,
                                  }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: tColor, flexShrink: 0 }} />
                                    <span style={{ fontSize: 11, color: tColor, whiteSpace: 'nowrap' }}>{task.title}</span>
                                  </div>
                                )}

                                <TodayLine opacity={0.6} />
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Legend footer ── */}
      <div style={{
        background: 'white', borderTop: '1px solid #E2E8F0',
        padding: '14px 32px', display: 'flex', alignItems: 'center',
        gap: 24, flexWrap: 'wrap', flexShrink: 0,
      }}>
        {[
          { color: '#38A169', label: 'Complete' },
          { color: '#A0AEC0', label: 'In Progress' },
          { color: '#C99700', label: 'On Hold' },
          { color: '#DE071C', label: 'Blocked' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <div style={{ width: 22, borderTop: `2px dashed ${TODAY_COLOR}` }} />
          <span style={{ fontSize: 12, color: '#6B7280' }}>Today</span>
        </div>
      </div>
    </div>
  )
}
