// src/hooks/useFinancialValidation.js
// Sprint 16: Financial validation hook
// Compares QuickBooks actuals against app budget data
// Handles verification workflow (create, read, status checks)
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

// ============================================================================
// Variance calculation helpers
// ============================================================================

/**
 * Calculate variance between two amounts
 * Returns { amount, percent, status } where status is 'match', 'warning', or 'mismatch'
 */
function calculateVariance(appAmount, qbAmount, tolerancePercent = 5) {
  const app = parseFloat(appAmount) || 0
  const qb = parseFloat(qbAmount) || 0

  // If both are zero, it's a match
  if (app === 0 && qb === 0) {
    return { amount: 0, percent: 0, status: 'match' }
  }

  const difference = Math.abs(app - qb)
  const base = Math.max(app, qb) // Use the larger number as base to avoid division by zero
  const percent = base > 0 ? (difference / base) * 100 : 0

  let status = 'match'
  if (percent > tolerancePercent * 2) {
    status = 'mismatch' // Over 2x the tolerance = red flag
  } else if (percent > tolerancePercent) {
    status = 'warning' // Over tolerance but under 2x = yellow warning
  }

  return {
    amount: app - qb, // Positive = app higher than QB, negative = QB higher
    percent: parseFloat(percent.toFixed(2)),
    status,
  }
}

// ============================================================================
// useFinancialValidation - Main hook for project financial comparison
// ============================================================================

export function useFinancialValidation({ projectId } = {}) {
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tolerancePercent, setTolerancePercent] = useState(5)

  const fetchComparison = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch all data in parallel
      const [
        projectResult,
        invoiceResult,
        paymentResult,
        expenseResult,
        settingsResult,
      ] = await Promise.all([
        // 1. Project budget data from app
        supabase
          .from('projects')
          .select('id, name, project_number, budget_total, budget_spent, status')
          .eq('id', projectId)
          .single(),

        // 2. QB synced invoices for this project
        supabase
          .from('synced_invoices')
          .select('total_amount, balance, status')
          .eq('project_id', projectId),

        // 3. QB synced payments for this project
        supabase
          .from('synced_payments')
          .select('total_amount')
          .eq('project_id', projectId),

        // 4. QB synced expenses for this project
        supabase
          .from('synced_expenses')
          .select('total_amount, balance, status')
          .eq('project_id', projectId),

        // 5. Tolerance setting
        supabase
          .from('financial_settings')
          .select('setting_value')
          .eq('setting_key', 'variance_tolerance_percent')
          .single(),
      ])

      if (projectResult.error) throw projectResult.error

      const project = projectResult.data
      const invoices = invoiceResult.data || []
      const payments = paymentResult.data || []
      const expenses = expenseResult.data || []

      // Parse tolerance
      const tolerance = settingsResult.data
        ? parseFloat(settingsResult.data.setting_value) || 5
        : 5
      setTolerancePercent(tolerance)

      // Aggregate QB numbers
      const qbInvoicedTotal = invoices.reduce(
        (sum, i) => sum + (parseFloat(i.total_amount) || 0), 0
      )
      const qbOutstanding = invoices.reduce(
        (sum, i) => sum + (parseFloat(i.balance) || 0), 0
      )
      const qbPaymentsTotal = payments.reduce(
        (sum, p) => sum + (parseFloat(p.total_amount) || 0), 0
      )
      const qbExpensesTotal = expenses.reduce(
        (sum, e) => sum + (parseFloat(e.total_amount) || 0), 0
      )

      // App budget numbers
      const appBudgetTotal = parseFloat(project.budget_total) || 0
      const appBudgetSpent = parseFloat(project.budget_spent) || 0

      // Calculate variances
      const budgetVsInvoiced = calculateVariance(appBudgetTotal, qbInvoicedTotal, tolerance)
      const spentVsExpenses = calculateVariance(appBudgetSpent, qbExpensesTotal, tolerance)

      // Overall status: worst of the two comparisons
      const statusPriority = { match: 0, warning: 1, mismatch: 2 }
      const overallStatus = statusPriority[budgetVsInvoiced.status] >= statusPriority[spentVsExpenses.status]
        ? budgetVsInvoiced.status
        : spentVsExpenses.status

      setComparison({
        project: {
          id: project.id,
          name: project.name,
          projectNumber: project.project_number,
          status: project.status,
        },
        app: {
          budgetTotal: appBudgetTotal,
          budgetSpent: appBudgetSpent,
          budgetRemaining: appBudgetTotal - appBudgetSpent,
        },
        qb: {
          invoicedTotal: qbInvoicedTotal,
          outstanding: qbOutstanding,
          paymentsReceived: qbPaymentsTotal,
          expensesTotal: qbExpensesTotal,
          netIncome: qbPaymentsTotal - qbExpensesTotal,
        },
        variances: {
          budgetVsInvoiced,
          spentVsExpenses,
        },
        overallStatus,
        tolerancePercent: tolerance,
        hasQBData: invoices.length > 0 || payments.length > 0 || expenses.length > 0,
        counts: {
          invoices: invoices.length,
          payments: payments.length,
          expenses: expenses.length,
        },
      })
    } catch (err) {
      console.error('Error fetching financial comparison:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchComparison()
  }, [fetchComparison])

  return {
    comparison,
    loading,
    error,
    tolerancePercent,
    refetch: fetchComparison,
  }
}

// ============================================================================
// useFinancialVerification - Verification status and actions
// ============================================================================

export function useFinancialVerification({ projectId } = {}) {
  const [verification, setVerification] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Fetch latest verification for this project
  const fetchVerification = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get latest verification
      const { data, error: queryError } = await supabase
        .from('financial_verifications')
        .select(`
          id,
          project_id,
          verified_by,
          verified_at,
          status,
          notes,
          app_budget_total,
          app_budget_spent,
          qb_invoiced_total,
          qb_payments_total,
          qb_expenses_total,
          variance_amount,
          variance_percent,
          verifier:verified_by(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('verified_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (queryError) throw queryError
      setVerification(data)
    } catch (err) {
      console.error('Error fetching verification:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Fetch full verification history
  const fetchHistory = useCallback(async () => {
    if (!projectId) return

    try {
      const { data, error: queryError } = await supabase
        .from('financial_verifications')
        .select(`
          id,
          verified_at,
          status,
          notes,
          variance_amount,
          variance_percent,
          verifier:verified_by(full_name)
        `)
        .eq('project_id', projectId)
        .order('verified_at', { ascending: false })
        .limit(20)

      if (queryError) throw queryError
      setHistory(data || [])
    } catch (err) {
      console.error('Error fetching verification history:', err)
    }
  }, [projectId])

  useEffect(() => {
    fetchVerification()
  }, [fetchVerification])

  // Submit a new verification
  const verify = useCallback(async ({ status, notes, comparisonData }) => {
    if (!projectId) return null

    try {
      setSubmitting(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const record = {
        project_id: projectId,
        verified_by: user.id,
        status: status || 'verified',
        notes: notes || null,
        app_budget_total: comparisonData?.app?.budgetTotal || null,
        app_budget_spent: comparisonData?.app?.budgetSpent || null,
        qb_invoiced_total: comparisonData?.qb?.invoicedTotal || null,
        qb_payments_total: comparisonData?.qb?.paymentsReceived || null,
        qb_expenses_total: comparisonData?.qb?.expensesTotal || null,
        variance_amount: comparisonData?.variances?.budgetVsInvoiced?.amount || null,
        variance_percent: comparisonData?.variances?.budgetVsInvoiced?.percent || null,
      }

      const { data, error: insertError } = await supabase
        .from('financial_verifications')
        .insert(record)
        .select()
        .single()

      if (insertError) throw insertError

      // Refresh the latest verification
      await fetchVerification()
      return data
    } catch (err) {
      console.error('Error submitting verification:', err)
      setError(err.message)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [projectId, fetchVerification])

  return {
    verification,
    history,
    isVerified: verification?.status === 'verified',
    isFlagged: verification?.status === 'flagged',
    isPendingReview: verification?.status === 'pending_review',
    loading,
    submitting,
    error,
    verify,
    fetchHistory,
    refetch: fetchVerification,
  }
}

// ============================================================================
// useVerificationBadges - Lightweight hook for Reports page
// Fetches verification status for multiple projects at once
// ============================================================================

export function useVerificationBadges(projectIds = []) {
  const [badges, setBadges] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchBadges = useCallback(async () => {
    if (!projectIds.length) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch the latest verification for each project using the view
      const { data, error } = await supabase
        .from('latest_financial_verifications')
        .select('project_id, status, verified_at, verified_by_name')
        .in('project_id', projectIds)

      if (error) throw error

      // Build a lookup map: projectId -> verification info
      const badgeMap = {}
      for (const row of (data || [])) {
        badgeMap[row.project_id] = {
          status: row.status,
          verifiedAt: row.verified_at,
          verifiedBy: row.verified_by_name,
        }
      }

      setBadges(badgeMap)
    } catch (err) {
      console.error('Error fetching verification badges:', err)
    } finally {
      setLoading(false)
    }
  }, [projectIds.join(',')])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  return { badges, loading, refetch: fetchBadges }
}

// ============================================================================
// useFinancialSettings - Read/update tolerance threshold
// ============================================================================

export function useFinancialSettings() {
  const [tolerancePercent, setTolerancePercent] = useState(5)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('financial_settings')
        .select('setting_value')
        .eq('setting_key', 'variance_tolerance_percent')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setTolerancePercent(parseFloat(data.setting_value) || 5)
      }
    } catch (err) {
      console.error('Error fetching financial settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTolerance = useCallback(async (newPercent) => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('financial_settings')
        .upsert({
          setting_key: 'variance_tolerance_percent',
          setting_value: String(newPercent),
          description: 'Percentage threshold for financial match/mismatch indicators',
          updated_by: user?.id || null,
        }, { onConflict: 'setting_key' })

      if (error) throw error
      setTolerancePercent(newPercent)
    } catch (err) {
      console.error('Error updating tolerance:', err)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return { tolerancePercent, loading, saving, updateTolerance }
}

// ============================================================================
// Utility exports
// ============================================================================

export { calculateVariance }
