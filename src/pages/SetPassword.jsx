// src/pages/SetPassword.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function SetPassword({ user, onComplete }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)

    try {
      // Set the password on the auth user
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError

      // Flip the flag on the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ password_set: true })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Refresh profile in App.jsx then navigate to Settings
      onComplete()
      navigate('/settings')
    } catch (err) {
      console.error('Error setting password:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#F4F4F4' }}
    >
      <div
        className="bg-white w-full max-w-sm p-8"
        style={{ borderRadius: '16px', boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* Logo */}
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: '#1D1D1F' }}>
          JMPU
        </h1>

        <p className="text-sm text-center text-gray-500 mb-8">
          Create a password to finish setting up your account.
        </p>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" style={{ color: '#1D1D1F' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Confirm */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" style={{ color: '#1D1D1F' }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-2.5 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#1D1D1F' }}
        >
          {saving ? 'Setting up...' : 'Create Password'}
        </button>
      </div>
    </div>
  )
}

export default SetPassword
