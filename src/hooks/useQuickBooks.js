// src/hooks/useQuickBooks.js
// Sprint 15: QuickBooks integration hook
// Manages connection status, OAuth flow, manual sync, and synced data retrieval
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ============================================================================
// useQuickBooksConnection - Connection status and management
// ============================================================================

export function useQuickBooksConnection() {
  const [connection, setConnection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fnError } = await supabase.functions.invoke(
        'quickbooks-auth',
        {
          body: { action: 'status' },
        }
      )

      if (fnError) throw fnError
      setConnection(data?.connection || null)
    } catch (err) {
      console.error('Error fetching QB status:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Start OAuth flow - redirects to QB login in same window
  const connect = useCallback(async () => {
    try {
      setError(null)

      const { data, error: fnError } = await supabase.functions.invoke(
        'quickbooks-auth',
        {
          body: { action: 'authorize' },
        }
      )

      if (fnError) throw fnError
      if (!data?.authUrl) throw new Error('No auth URL returned')

      // Redirect to QuickBooks authorization in the same window
      window.location.href = data.authUrl
    } catch (err) {
      console.error('Error connecting QB:', err)
      setError(err.message)
    }
  }, [])

  // Disconnect QuickBooks
  const disconnect = useCallback(async () => {
    try {
      setError(null)

      const { error: fnError } = await supabase.functions.invoke(
        'quickbooks-auth',
        {
          body: { action: 'disconnect' },
        }
      )

      if (fnError) throw fnError
      setConnection(null)
    } catch (err) {
      console.error('Error disconnecting QB:', err)
      setError(err.message)
    }
  }, [])

  return {
    connection,
    isConnected: connection?.status === 'connected',
    loading,
    error,
    connect,
    disconnect,
    refetch: fetchStatus,
  }
}

// ============================================================================
// useQuickBooksSync - Trigger and monitor data sync
// ============================================================================

export function useQuickBooksSync() {
  const [syncing, setSyncing] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [error, setError] = useState(null)

  const sync = useCallback(async () => {
    try {
      setSyncing(true)
      setError(null)
      setLastResult(null)

      const { data, error: fnError } = await supabase.functions.invoke(
        'quickbooks-sync',
        {
          body: {},
        }
      )

      if (fnError) throw fnError
      setLastResult(data)
      return data
    } catch (err) {
      console.error('Sync error:', err)
      setError(err.message)
      throw err
    } finally {
      setSyncing(false)
    }
  }, [])

  return {
    sync,
    syncing,
    lastResult,
    error,
  }
}

// ============================================================================
// useQuickBooksInvoices - Fetch synced invoices from Supabase
// ============================================================================

export function useQuickBooksInvoices({ projectId = null, limit = 50 } = {}) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('synced_invoices')
        .select('*')
        .order('txn_date', { ascending: false })
        .limit(limit)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error: queryError } = await query
      if (queryError) throw queryError
      setInvoices(data || [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, limit])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  return { invoices, loading, error, refetch: fetchInvoices }
}

// ============================================================================
// useQuickBooksPayments - Fetch synced payments from Supabase
// ============================================================================

export function useQuickBooksPayments({ projectId = null, limit = 50 } = {}) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('synced_payments')
        .select('*')
        .order('txn_date', { ascending: false })
        .limit(limit)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error: queryError } = await query
      if (queryError) throw queryError
      setPayments(data || [])
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, limit])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  return { payments, loading, error, refetch: fetchPayments }
}

// ============================================================================
// useQuickBooksExpenses - Fetch synced expenses from Supabase
// ============================================================================

export function useQuickBooksExpenses({ projectId = null, limit = 50 } = {}) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('synced_expenses')
        .select('*')
        .order('txn_date', { ascending: false })
        .limit(limit)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error: queryError } = await query
      if (queryError) throw queryError
      setExpenses(data || [])
    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, limit])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  return { expenses, loading, error, refetch: fetchExpenses }
}

// ============================================================================
// useQuickBooksFinancialSummary - Aggregated financial data
// ============================================================================

export function useQuickBooksFinancialSummary({ projectId = null } = {}) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)

      let invoiceQuery = supabase
        .from('synced_invoices')
        .select('total_amount, balance, status')
      let paymentQuery = supabase
        .from('synced_payments')
        .select('total_amount')
      let expenseQuery = supabase
        .from('synced_expenses')
        .select('total_amount, balance, status')

      if (projectId) {
        invoiceQuery = invoiceQuery.eq('project_id', projectId)
        paymentQuery = paymentQuery.eq('project_id', projectId)
        expenseQuery = expenseQuery.eq('project_id', projectId)
      }

      const [invoiceResult, paymentResult, expenseResult] = await Promise.all([
        invoiceQuery,
        paymentQuery,
        expenseQuery,
      ])

      const invoices = invoiceResult.data || []
      const payments = paymentResult.data || []
      const expenses = expenseResult.data || []

      const totalInvoiced = invoices.reduce(
        (sum, i) => sum + (parseFloat(i.total_amount) || 0),
        0
      )
      const totalOutstanding = invoices.reduce(
        (sum, i) => sum + (parseFloat(i.balance) || 0),
        0
      )
      const totalPaymentsReceived = payments.reduce(
        (sum, p) => sum + (parseFloat(p.total_amount) || 0),
        0
      )
      const totalExpenses = expenses.reduce(
        (sum, e) => sum + (parseFloat(e.total_amount) || 0),
        0
      )
      const totalExpensesUnpaid = expenses.reduce(
        (sum, e) => sum + (parseFloat(e.balance) || 0),
        0
      )

      setSummary({
        totalInvoiced,
        totalOutstanding,
        totalPaymentsReceived,
        totalExpenses,
        totalExpensesUnpaid,
        netIncome: totalPaymentsReceived - totalExpenses,
        invoiceCount: invoices.length,
        paymentCount: payments.length,
        expenseCount: expenses.length,
        overdueInvoices: invoices.filter((i) => i.status === 'Overdue').length,
        paidInvoices: invoices.filter((i) => i.status === 'Paid').length,
        openInvoices: invoices.filter((i) => i.status === 'Open').length,
      })
    } catch (err) {
      console.error('Error fetching financial summary:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return { summary, loading, error, refetch: fetchSummary }
}
