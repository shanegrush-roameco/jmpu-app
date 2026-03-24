import { useState } from 'react'
import { supabase } from '../lib/supabase'

function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'join'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

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

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      console.error('Magic link error:', error.message)
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
    setLoading(false)
  }

  const resetToLogin = () => {
    setMode('login')
    setEmail('')
    setPassword('')
    setError(null)
    setMagicLinkSent(false)
  }

  const switchToJoin = () => {
    setMode('join')
    setEmail('')
    setPassword('')
    setError(null)
    setMagicLinkSent(false)
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

        {mode === 'login' ? (
          <>
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

            {/* Legal Links */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <a href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Privacy Policy
              </a>
              <span className="text-xs text-gray-300">•</span>
              <a href="/eula" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Terms of Use
              </a>
            </div>

            {/* Join Link */}
            <p className="text-center mt-6">
              <button
                onClick={switchToJoin}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                New to JMPU? Join here
              </button>
            </p>
          </>
        ) : (
          <>
            {/* Join Mode */}
            {!magicLinkSent ? (
              <>
                <p className="text-center text-gray-600 mb-6">
                  Enter your email to get started
                </p>

                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div>
                    <label htmlFor="join-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="join-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      autoFocus
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
                    {loading ? 'Sending...' : 'Send me a link'}
                  </button>
                </form>

                {/* Back to Login */}
                <p className="text-center mt-6">
                  <button
                    onClick={resetToLogin}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Already have an account? Sign in
                  </button>
                </p>
              </>
            ) : (
              <>
                {/* Magic Link Sent Confirmation */}
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
                  <p className="text-gray-600 mb-2">
                    We sent a login link to
                  </p>
                  <p className="font-medium text-gray-900 mb-6">{email}</p>
                  <p className="text-sm text-gray-500">
                    Click the link in the email to sign in.
                  </p>
                </div>

                {/* Back to Login */}
                <p className="text-center mt-6">
                  <button
                    onClick={resetToLogin}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Back to sign in
                  </button>
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Login
