import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Job title options (same as Settings/Profiles)
const jobTitleOptions = [
  'Owner',
  'General Contractor',
  'Project Manager',
  'Project Admin',
  'Electrical Sub',
  'Plumbing Sub',
  'HVAC Sub',
  'Finisher',
  'Designer',
  'Architect',
  'Customer',
]

function Onboarding({ user, onComplete }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
  })

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          job_title: formData.job_title,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // Signal completion to parent
      onComplete()
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isValid = formData.first_name.trim() && formData.last_name.trim()

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F4F4F4' }}>
      <div 
        className="w-full max-w-md p-8 bg-white"
        style={{
          borderRadius: '16px',
          boxShadow: '2px 4px 12px rgba(0, 0, 0, 0.08)'
        }}
      >
        {/* Logo */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-gray-900">JMPU</h1>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600">Let's set up your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder="Mike"
              required
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder="Johnson"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Job Title */}
          <div>
            <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <div className="relative">
              <select
                id="job_title"
                value={formData.job_title}
                onChange={(e) => handleChange('job_title', e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors cursor-pointer"
              >
                <option value="">Select your role</option>
                {jobTitleOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Icon Component
function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

export default Onboarding
