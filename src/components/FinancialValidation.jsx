// src/components/FinancialValidation.jsx
// Sprint 16: Financial validation UI
// Shows QB vs App budget comparison, variance indicators, verification workflow
// Design system: #F4F4F4 bg, white cards 16px radius, #1D1D1F primary, Inter
// ============================================================================

import { useState } from 'react'
import {
  useFinancialValidation,
  useFinancialVerification,
} from '../hooks/useFinancialValidation'

// ============================================================================
// Variance indicator helpers
// ============================================================================

const STATUS_CONFIG = {
  match: {
    color: '#22C55E',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    label: 'Match',
    icon: 'checkmark',
  },
  warning: {
    color: '#EAB308',
    bgColor: '#FEFCE8',
    borderColor: '#FEF08A',
    label: 'Minor Variance',
    icon: 'warning',
  },
  mismatch: {
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    label: 'Mismatch',
    icon: 'flag',
  },
}

const VERIFICATION_STATUS_CONFIG = {
  verified: {
    color: '#22C55E',
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    label: 'Verified',
    icon: 'shield-check',
  },
  flagged: {
    color: '#EF4444',
    bgColor: '#FEF2F2',
    borderColor: '#FECACA',
    label: 'Flagged',
    icon: 'flag',
  },
  pending_review: {
    color: '#EAB308',
    bgColor: '#FEFCE8',
    borderColor: '#FEF08A',
    label: 'Pending Review',
    icon: 'clock',
  },
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================================
// VarianceIndicator - Small inline badge showing match/warning/mismatch
// ============================================================================

function VarianceIndicator({ variance }) {
  if (!variance) return null
  const config = STATUS_CONFIG[variance.status] || STATUS_CONFIG.match

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      {variance.status === 'match' && <CheckCircleIcon className="w-3.5 h-3.5" />}
      {variance.status === 'warning' && <WarningTriangleIcon className="w-3.5 h-3.5" />}
      {variance.status === 'mismatch' && <FlagIcon className="w-3.5 h-3.5" />}
      <span>{config.label}</span>
      {variance.percent > 0 && (
        <span style={{ opacity: 0.8 }}>({variance.percent}%)</span>
      )}
    </div>
  )
}

// ============================================================================
// VerificationBadge - Shows verified/flagged/pending status
// ============================================================================

export function VerificationBadge({ status, verifiedAt, verifiedBy, compact = false }) {
  if (!status) {
    if (compact) return null
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}
      >
        Unverified
      </span>
    )
  }

  const config = VERIFICATION_STATUS_CONFIG[status] || VERIFICATION_STATUS_CONFIG.pending_review

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: config.bgColor,
          color: config.color,
          border: `1px solid ${config.borderColor}`,
        }}
      >
        {status === 'verified' && <ShieldCheckIcon className="w-3.5 h-3.5" />}
        {status === 'flagged' && <FlagIcon className="w-3.5 h-3.5" />}
        {status === 'pending_review' && <ClockIcon className="w-3.5 h-3.5" />}
        {config.label}
      </span>
      {!compact && verifiedBy && (
        <span className="text-xs text-gray-400">
          by {verifiedBy} {verifiedAt ? `on ${formatDate(verifiedAt)}` : ''}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// ComparisonRow - Single row in the side-by-side comparison
// ============================================================================

function ComparisonRow({ label, appValue, qbValue, variance }) {
  return (
    <div className="flex items-center py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="w-28 text-right">
        <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
          {formatCurrency(appValue)}
        </span>
      </div>
      <div className="w-28 text-right">
        <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
          {formatCurrency(qbValue)}
        </span>
      </div>
      <div className="w-48 flex justify-end">
        <VarianceIndicator variance={variance} />
      </div>
    </div>
  )
}

// ============================================================================
// VerifyModal - Admin verification workflow
// ============================================================================

function VerifyModal({ isOpen, onClose, comparison, onVerify, submitting }) {
  const [status, setStatus] = useState('verified')
  const [notes, setNotes] = useState('')

  if (!isOpen || !comparison) return null

  const handleSubmit = async () => {
    try {
      await onVerify({
        status,
        notes: notes.trim() || null,
        comparisonData: comparison,
      })
      setNotes('')
      setStatus('verified')
      onClose()
    } catch (err) {
      // Error handled in hook
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        className="relative bg-white w-full max-w-lg"
        style={{
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
            Verify Financials
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center py-2 mb-1">
              <div className="flex-1" />
              <div className="w-28 text-right">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">App</span>
              </div>
              <div className="w-28 text-right">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">QuickBooks</span>
              </div>
              <div className="w-36 text-right">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</span>
              </div>
            </div>

            <ComparisonRow
              label="Total Budget / Invoiced"
              appValue={comparison.app?.budgetTotal}
              qbValue={comparison.qb?.invoicedTotal}
              variance={comparison.variances?.budgetVsInvoiced}
            />
            <ComparisonRow
              label="Spent / Expenses"
              appValue={comparison.app?.budgetSpent}
              qbValue={comparison.qb?.expensesTotal}
              variance={comparison.variances?.spentVsExpenses}
            />

            {/* Additional QB-only data */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="p-3 text-center"
                  style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
                >
                  <div className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>
                    {formatCurrency(comparison.qb?.paymentsReceived)}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Payments</div>
                </div>
                <div
                  className="p-3 text-center"
                  style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
                >
                  <div className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>
                    {formatCurrency(comparison.qb?.outstanding)}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Outstanding</div>
                </div>
                <div
                  className="p-3 text-center"
                  style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
                >
                  <div className="text-sm font-semibold" style={{ color: comparison.qb?.netIncome >= 0 ? '#22C55E' : '#EF4444' }}>
                    {formatCurrency(comparison.qb?.netIncome)}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Net Income</div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Action */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium mb-2" style={{ color: '#1D1D1F' }}>
              Verification Decision
            </label>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setStatus('verified')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: status === 'verified' ? '#F0FDF4' : '#FAFAFA',
                  color: status === 'verified' ? '#22C55E' : '#6B7280',
                  border: status === 'verified' ? '2px solid #22C55E' : '1px solid #E5E7EB',
                }}
              >
                <ShieldCheckIcon className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => setStatus('flagged')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: status === 'flagged' ? '#FEF2F2' : '#FAFAFA',
                  color: status === 'flagged' ? '#EF4444' : '#6B7280',
                  border: status === 'flagged' ? '2px solid #EF4444' : '1px solid #E5E7EB',
                }}
              >
                <FlagIcon className="w-4 h-4" />
                Flag
              </button>
              <button
                onClick={() => setStatus('pending_review')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: status === 'pending_review' ? '#FEFCE8' : '#FAFAFA',
                  color: status === 'pending_review' ? '#EAB308' : '#6B7280',
                  border: status === 'pending_review' ? '2px solid #EAB308' : '1px solid #E5E7EB',
                }}
              >
                <ClockIcon className="w-4 h-4" />
                Review
              </button>
            </div>

            <label className="block text-sm font-medium mb-1.5" style={{ color: '#1D1D1F' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add verification notes..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ color: '#374151' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse lg:flex-row gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-6 py-2.5 bg-transparent rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{ color: '#111111', border: '1px solid #111111' }}
            onMouseEnter={(e) => {
              if (!submitting) {
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
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1D1D1F' }}
          >
            {submitting ? 'Submitting...' : 'Submit Verification'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// FinancialValidation - Main component for ProjectDetail financials tab
// ============================================================================

export default function FinancialValidation({ projectId, userRole }) {
  const [modalOpen, setModalOpen] = useState(false)

  const {
    comparison,
    loading: comparisonLoading,
    error: comparisonError,
  } = useFinancialValidation({ projectId })

  const {
    verification,
    isVerified,
    isFlagged,
    submitting,
    verify,
    refetch: refetchVerification,
  } = useFinancialVerification({ projectId })

  const canVerify = userRole === 'admin' || userRole === 'project_manager'

  const handleVerify = async (data) => {
    await verify(data)
    refetchVerification()
  }

  // Loading state
  if (comparisonLoading) {
    return (
      <div
        className="bg-white mb-6"
        style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-48 mb-4" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-20 bg-gray-100 rounded-lg" />
              <div className="h-20 bg-gray-100 rounded-lg" />
            </div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (comparisonError) {
    return (
      <div
        className="bg-white mb-6"
        style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
      >
        <div className="p-6">
          <p className="text-sm text-red-500">Error loading financial comparison: {comparisonError}</p>
        </div>
      </div>
    )
  }

  // No data yet
  if (!comparison) {
    return null
  }

  const overallConfig = STATUS_CONFIG[comparison.overallStatus] || STATUS_CONFIG.match

  return (
    <>
      <div
        className="bg-white mb-6"
        style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)' }}
      >
        {/* Header */}
        <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
              Financial Validation
            </h3>
            {comparison.hasQBData && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: overallConfig.bgColor,
                  color: overallConfig.color,
                  border: `1px solid ${overallConfig.borderColor}`,
                }}
              >
                {comparison.overallStatus === 'match' && <CheckCircleIcon className="w-3.5 h-3.5" />}
                {comparison.overallStatus === 'warning' && <WarningTriangleIcon className="w-3.5 h-3.5" />}
                {comparison.overallStatus === 'mismatch' && <FlagIcon className="w-3.5 h-3.5" />}
                {overallConfig.label}
              </div>
            )}
            {verification && (
              <VerificationBadge
                status={verification.status}
                verifiedAt={verification.verified_at}
                verifiedBy={verification.verifier?.full_name}
                compact
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {canVerify && comparison.hasQBData && (
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#1D1D1F' }}
              >
                {verification ? 'Re-verify' : 'Verify Financials'}
              </button>
            )}
          </div>
        </div>

        {/* No QB data message */}
        {!comparison.hasQBData && (
          <div className="px-6 pb-6">
            <div
              className="p-4 text-center"
              style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
            >
              <p className="text-sm text-gray-500">
                No QuickBooks data synced for this project yet.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Sync data from the Settings &gt; Integrations tab to enable validation.
              </p>
            </div>
          </div>
        )}

        {/* Comparison Data */}
        {comparison.hasQBData && (
          <div className="px-6 pb-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* App Budget Card */}
              <div
                className="p-4"
                style={{ backgroundColor: '#FAFAFA', borderRadius: '12px' }}
              >
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  App Budget
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-500">Total Budget</span>
                    <span className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
                      {formatCurrency(comparison.app.budgetTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-500">Amount Spent</span>
                    <span className="text-lg font-semibold" style={{ color: '#EF4444' }}>
                      {formatCurrency(comparison.app.budgetSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Remaining</span>
                    <span className="text-lg font-semibold" style={{ color: '#22C55E' }}>
                      {formatCurrency(comparison.app.budgetRemaining)}
                    </span>
                  </div>
                </div>
              </div>

              {/* QuickBooks Actuals Card */}
              <div
                className="p-4"
                style={{ backgroundColor: '#FAFAFA', borderRadius: '12px' }}
              >
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                  QuickBooks Actuals
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-500">Total Invoiced</span>
                    <span className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
                      {formatCurrency(comparison.qb.invoicedTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-500">Total Expenses</span>
                    <span className="text-lg font-semibold" style={{ color: '#EF4444' }}>
                      {formatCurrency(comparison.qb.expensesTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Net Income</span>
                    <span
                      className="text-lg font-semibold"
                      style={{ color: comparison.qb.netIncome >= 0 ? '#22C55E' : '#EF4444' }}
                    >
                      {formatCurrency(comparison.qb.netIncome)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Variance Comparison Table - Desktop */}
            <div className="hidden lg:block">
              <div className="flex items-center py-2 mb-1">
                <div className="flex-1">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Comparison</span>
                </div>
                <div className="w-28 text-right">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">App</span>
                </div>
                <div className="w-28 text-right">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">QuickBooks</span>
                </div>
                <div className="w-48 text-right">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Status</span>
                </div>
              </div>

              <ComparisonRow
                label="Budget vs Invoiced"
                appValue={comparison.app.budgetTotal}
                qbValue={comparison.qb.invoicedTotal}
                variance={comparison.variances.budgetVsInvoiced}
              />
              <ComparisonRow
                label="Spent vs Expenses"
                appValue={comparison.app.budgetSpent}
                qbValue={comparison.qb.expensesTotal}
                variance={comparison.variances.spentVsExpenses}
              />
            </div>

            {/* Variance Cards - Mobile */}
            <div className="lg:hidden space-y-3">
              <div
                className="p-3 flex items-center justify-between"
                style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
              >
                <div>
                  <div className="text-xs text-gray-400">Budget vs Invoiced</div>
                  <div className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                    {formatCurrency(comparison.app.budgetTotal)} vs {formatCurrency(comparison.qb.invoicedTotal)}
                  </div>
                </div>
                <VarianceIndicator variance={comparison.variances.budgetVsInvoiced} />
              </div>
              <div
                className="p-3 flex items-center justify-between"
                style={{ backgroundColor: '#FAFAFA', borderRadius: '8px' }}
              >
                <div>
                  <div className="text-xs text-gray-400">Spent vs Expenses</div>
                  <div className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                    {formatCurrency(comparison.app.budgetSpent)} vs {formatCurrency(comparison.qb.expensesTotal)}
                  </div>
                </div>
                <VarianceIndicator variance={comparison.variances.spentVsExpenses} />
              </div>
            </div>

            {/* Data Counts */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                QB Data: {comparison.counts.invoices} invoices, {comparison.counts.payments} payments, {comparison.counts.expenses} expenses
              </span>
              <span className="text-xs text-gray-400">
                Tolerance: {comparison.tolerancePercent}%
              </span>
            </div>

            {/* Verification History (last verification) */}
            {verification && (
              <div
                className="mt-4 p-3 flex items-center justify-between"
                style={{
                  backgroundColor: VERIFICATION_STATUS_CONFIG[verification.status]?.bgColor || '#F9FAFB',
                  borderRadius: '8px',
                  border: `1px solid ${VERIFICATION_STATUS_CONFIG[verification.status]?.borderColor || '#E5E7EB'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <VerificationBadge status={verification.status} compact />
                  <span className="text-xs text-gray-500">
                    by {verification.verifier?.full_name || 'Unknown'} on {formatDate(verification.verified_at)}
                  </span>
                </div>
                {verification.notes && (
                  <span className="text-xs text-gray-400 truncate max-w-xs">
                    {verification.notes}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verify Modal */}
      <VerifyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        comparison={comparison}
        onVerify={handleVerify}
        submitting={submitting}
      />
    </>
  )
}

// ============================================================================
// Icon Components (matching app style - inline SVGs)
// ============================================================================

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )
}

function WarningTriangleIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

function FlagIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
    </svg>
  )
}

function ShieldCheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
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

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
