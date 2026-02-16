// src/components/IntegrationsTab.jsx
// Sprint 15: QuickBooks integration settings panel
// Shows connection status, connect/disconnect buttons, sync controls
// Handles OAuth callback token exchange
// ============================================================================

import { useState, useEffect, useRef } from 'react'
import { useQuickBooksConnection, useQuickBooksSync } from '../hooks/useQuickBooks'
import { supabase } from '../lib/supabase'

function IntegrationsTab() {
  const {
    connection,
    isConnected,
    loading: connectionLoading,
    error: connectionError,
    connect,
    disconnect,
    refetch,
  } = useQuickBooksConnection()

  const { sync, syncing, lastResult, error: syncError } = useQuickBooksSync()

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [callbackProcessing, setCallbackProcessing] = useState(false)
  const [callbackError, setCallbackError] = useState(null)
  const callbackHandled = useRef(false)

  // Handle OAuth callback - exchange code for tokens
  useEffect(() => {
    if (callbackHandled.current) return
    
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const realmId = params.get('realmId')
    const error = params.get('error')

    // Handle QB OAuth error
    if (error) {
      setCallbackError(`QuickBooks authorization failed: ${error}`)
      window.history.replaceState({}, '', '/settings?tab=integrations')
      return
    }

    // Handle successful OAuth callback with auth code
    if (code && realmId) {
      callbackHandled.current = true
      setCallbackProcessing(true)
      setCallbackError(null)

      const exchangeToken = async () => {
        try {
          const { data, error: fnError } = await supabase.functions.invoke(
            'quickbooks-auth',
            {
              body: { action: 'callback', code, state, realmId },
            }
          )

          if (fnError) throw fnError
          if (data?.error) throw new Error(data.error)

          // Success - refresh connection status
          refetch()
        } catch (err) {
          console.error('Token exchange error:', err)
          setCallbackError(err.message || 'Failed to connect QuickBooks')
        } finally {
          setCallbackProcessing(false)
          window.history.replaceState({}, '', '/settings?tab=integrations')
        }
      }

      exchangeToken()
      return
    }

    // Handle legacy callback params
    if (params.get('qb_connected') === 'true') {
      refetch()
      window.history.replaceState({}, '', '/settings?tab=integrations')
    }
    if (params.get('qb_error')) {
      setCallbackError(`QuickBooks error: ${params.get('qb_error')}`)
      window.history.replaceState({}, '', '/settings?tab=integrations')
    }
  }, [refetch])

  const handleSync = async () => {
    try {
      setSyncSuccess(false)
      await sync()
      setSyncSuccess(true)
      refetch()
      setTimeout(() => setSyncSuccess(false), 5000)
    } catch {
      // Error handled by the hook
    }
  }

  const handleDisconnect = async () => {
    await disconnect()
    setShowDisconnectConfirm(false)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (connectionLoading || callbackProcessing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
          <p className="text-sm text-gray-500">
            {callbackProcessing ? 'Connecting QuickBooks...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h5 className="text-sm font-semibold mb-4" style={{ color: '#1D1D1F' }}>
        Accounting Software
      </h5>

      {/* QuickBooks Card */}
      <div
        className="border border-gray-200 rounded-xl p-5 mb-4"
        style={{ backgroundColor: isConnected ? '#F0FDF4' : '#FFFFFF' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Logo + Status */}
          <div className="flex items-center gap-4">
            {/* QB Logo */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#2CA01C' }}
            >
              <span className="text-white font-bold text-lg">QB</span>
            </div>

            <div>
              <h6 className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>
                QuickBooks Online
              </h6>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: isConnected ? '#22C55E' : '#9CA3AF',
                  }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: isConnected ? '#22C55E' : '#6B7280',
                  }}
                >
                  {isConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Button */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#1D1D1F' }}
                >
                  {syncing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                      Syncing...
                    </span>
                  ) : (
                    'Sync Now'
                  )}
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-50"
                  style={{ color: '#EF4444', border: '1px solid #EF4444' }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connect}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#2CA01C' }}
              >
                Connect QuickBooks
              </button>
            )}
          </div>
        </div>

        {/* Connection Details (when connected) */}
        {isConnected && connection && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-gray-500 block">Connected</span>
              <span className="text-sm" style={{ color: '#1D1D1F' }}>
                {formatDate(connection.connected_at)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Last Synced</span>
              <span className="text-sm" style={{ color: '#1D1D1F' }}>
                {formatDate(connection.last_sync_at)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Sync Status</span>
              <span
                className="text-sm"
                style={{
                  color:
                    connection.last_sync_status === 'success'
                      ? '#22C55E'
                      : connection.last_sync_status === 'error'
                        ? '#EF4444'
                        : connection.last_sync_status === 'in_progress'
                          ? '#3B82F6'
                          : '#6B7280',
                }}
              >
                {connection.last_sync_status === 'success'
                  ? 'Success'
                  : connection.last_sync_status === 'error'
                    ? 'Error'
                    : connection.last_sync_status === 'in_progress'
                      ? 'In Progress'
                      : 'Not synced yet'}
              </span>
            </div>
          </div>
        )}

        {/* Sync Result */}
        {syncSuccess && lastResult?.synced && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              Sync complete: {lastResult.synced.invoices} invoices, {lastResult.synced.payments} payments, {lastResult.synced.expenses} expenses
            </p>
          </div>
        )}

        {/* Sync Error */}
        {connection?.last_sync_error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{connection.last_sync_error}</p>
          </div>
        )}
      </div>

      {/* Connection/Callback Error */}
      {(connectionError || syncError || callbackError) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{callbackError || connectionError || syncError}</p>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-400 mt-2">
        Connecting your accounting software allows JMPU to display real financial data
        including invoices, payments, and expenses. Data is read-only; JMPU will never
        modify your accounting records.
      </p>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDisconnectConfirm(false)}
          />
          <div
            className="relative bg-white w-full max-w-sm p-6"
            style={{
              borderRadius: '16px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
            }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#1D1D1F' }}>
              Disconnect QuickBooks?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will remove the connection to QuickBooks. Previously synced data
              will remain in JMPU but will no longer update automatically.
            </p>
            <div className="flex flex-col-reverse lg:flex-row gap-3">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
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
                onClick={handleDisconnect}
                className="flex-1 px-6 py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors"
                style={{ backgroundColor: '#EF4444' }}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntegrationsTab
