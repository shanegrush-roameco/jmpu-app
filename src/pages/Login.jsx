import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleMicrosoftLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email profile',
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      console.error('Login error:', error.message)
      setError(error.message)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error.message)
      setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F4F4F4' }}>
      {/* Login Card */}
      <div 
        className="w-full max-w-md p-8 bg-white"
        style={{
          borderRadius: '16px',
          boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">JMPU</h1>
        </div>

        {/* Microsoft SSO Button */}
        <button
          onClick={handleMicrosoftLogin}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#fff"/>
            <rect x="11" y="1" width="9" height="9" fill="#fff"/>
            <rect x="1" y="11" width="9" height="9" fill="#fff"/>
            <rect x="11" y="11" width="9" height="9" fill="#fff"/>
          </svg>
          Sign in with Microsoft
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-4 text-sm text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@jmpu.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Terms Text */}
        <p className="text-xs text-gray-500 leading-relaxed mt-6">
          By logging into this system, I expressly consent to allow the company to monitor, intercept, record, and search any communications or data transiting, travelling to and from, or stored on this information system at any time and for any lawful purpose.
        </p>
      </div>
    </div>
  )
}

export default Login