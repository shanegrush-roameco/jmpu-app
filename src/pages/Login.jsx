import { supabase } from '../lib/supabase'

function Login() {
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
    }
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
          className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#fff"/>
            <rect x="11" y="1" width="9" height="9" fill="#fff"/>
            <rect x="1" y="11" width="9" height="9" fill="#fff"/>
            <rect x="11" y="11" width="9" height="9" fill="#fff"/>
          </svg>
          Sign in with Microsoft
        </button>

        {/* Terms Text */}
        <p className="text-xs text-gray-500 leading-relaxed">
          By logging into this system, I expressly consent to allow the company to monitor, intercept, record, and search any communications or data transiting, travelling to and from, or stored on this information system at any time and for any lawful purpose.
        </p>
      </div>
    </div>
  )
}

export default Login