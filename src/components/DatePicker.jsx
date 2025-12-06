import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from '@carbon/icons-react'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function DatePicker({ value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value) : new Date()
  })
  const containerRef = useRef(null)

  // Parse the value (YYYY-MM-DD format)
  const selectedDate = value ? new Date(value) : null

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
    }
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  // Navigate months
  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
  }

  // Select a date
  const selectDate = (day) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    const formatted = newDate.toISOString().split('T')[0] // YYYY-MM-DD
    onChange(formatted)
    setIsOpen(false)
  }

  // Format display value
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    })
  }

  // Build calendar grid
  const buildCalendarDays = () => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const daysInPrevMonth = getDaysInMonth(year, month - 1)

    const days = []

    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        currentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - i)
      })
    }

    // Current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        currentMonth: true,
        date: new Date(year, month, i)
      })
    }

    // Next month's leading days
    const remaining = 42 - days.length // 6 rows × 7 days
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        currentMonth: false,
        date: new Date(year, month + 1, i)
      })
    }

    return days
  }

  const isSelected = (date) => {
    if (!selectedDate) return false
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    )
  }

  const isToday = (date) => {
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const calendarDays = buildCalendarDays()

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
      )}
      
      {/* Input Field */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer flex items-center justify-between hover:border-gray-300 transition-colors"
        style={{ color: '#1D1D1F' }}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {formatDisplayDate(value) || 'Select date'}
        </span>
        <Calendar size={16} style={{ color: '#1D1D1F' }} />
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 bg-white z-50 p-4"
          style={{
            borderRadius: '16px',
            boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)',
            minWidth: '280px'
          }}
        >
          {/* Header - Month/Year + Navigation */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={16} style={{ color: '#1D1D1F' }} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={16} style={{ color: '#1D1D1F' }} />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day, i) => (
              <div
                key={i}
                className="w-8 h-8 flex items-center justify-center text-xs font-medium"
                style={{ color: '#6B7280' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, i) => {
              const selected = isSelected(item.date)
              const today = isToday(item.date)
              
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (item.currentMonth) {
                      selectDate(item.day)
                    } else {
                      // Navigate to that month and select
                      setViewDate(item.date)
                      const formatted = item.date.toISOString().split('T')[0]
                      onChange(formatted)
                      setIsOpen(false)
                    }
                  }}
                  className={`
                    w-8 h-8 flex items-center justify-center text-sm rounded-lg transition-colors
                    ${selected 
                      ? 'bg-blue-500 text-white font-medium' 
                      : today 
                        ? 'bg-gray-100 font-medium'
                        : item.currentMonth 
                          ? 'hover:bg-gray-100' 
                          : 'hover:bg-gray-50'
                    }
                  `}
                  style={{
                    color: selected 
                      ? '#FFFFFF' 
                      : item.currentMonth 
                        ? '#1D1D1F' 
                        : '#9CA3AF'
                  }}
                >
                  {item.day}
                </button>
              )
            })}
          </div>

          {/* Footer - Today + Clear */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#EF4444' }}
            >
              Clear
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const formatted = today.toISOString().split('T')[0]
                onChange(formatted)
                setViewDate(today)
                setIsOpen(false)
              }}
              className="text-sm font-medium hover:opacity-70 transition-opacity"
              style={{ color: '#3B82F6' }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
