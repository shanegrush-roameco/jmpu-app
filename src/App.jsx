// src/App.jsx
// Sprint 12: Added Onboarding for new users
// Sprint 15: Added QuickBooks OAuth callback route
// ============================================================================

import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/Projectdetail'
import Reports from './pages/Reports'
import Profiles from './pages/Profiles'
import Settings from './pages/Settings'
import RoleGuard, { AccessDenied } from './components/RoleGuard'
import { SpeedInsights } from "@vercel/speed-insights/react"

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Fetch user profile
  const fetchProfile = async (userId) => {
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check if profile is incomplete (missing first_name)
  const needsOnboarding = session && profile && !profile.first_name

  // Callback for when onboarding completes
  const handleOnboardingComplete = () => {
    if (session?.user) {
      fetchProfile(session.user.id)
    }
  }

  if (loading || profileLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F4F4F4' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route 
          path="/login" 
          element={session ? <Navigate to="/" replace /> : <Login />} 
        />
        
        {/* Onboarding route - for new users with incomplete profiles */}
        <Route 
          path="/onboarding" 
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Onboarding user={session.user} onComplete={handleOnboardingComplete} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Protected routes - require authentication AND completed profile */}
        <Route 
          path="/" 
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Dashboard user={session.user} />
            )
          } 
        />
        <Route 
          path="/projects" 
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Projects user={session.user} />
            )
          } 
        />
        <Route 
          path="/projects/:projectId" 
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <ProjectDetail user={session.user} />
            )
          } 
        />
        
        {/* Reports - requires canViewReports permission */}
        <Route 
          path="/reports" 
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <RoleGuard 
                require="canViewReports"
                unauthorized={<AccessDenied message="You don't have permission to view reports." />}
              >
                <Reports user={session.user} />
              </RoleGuard>
            )
          } 
        />
        
        {/* Profiles - admin only (requires canViewProfiles permission) */}
        <Route 
          path="/profiles" 
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <RoleGuard 
                require="canViewProfiles"
                unauthorized={<AccessDenied message="Only administrators can access the Profiles page." />}
              >
                <Profiles user={session.user} />
              </RoleGuard>
            )
          } 
        />
        
        {/* Settings - accessible to all authenticated users */}
        <Route 
          path="/settings" 
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Settings user={session.user} />
            )
          } 
        />

        {/* QuickBooks OAuth callback - redirects to Settings with params */}
        <Route 
          path="/settings/integrations/callback" 
          element={
            !session ? (
              <Navigate to="/login" replace />
            ) : (
              <Settings user={session.user} />
            )
          } 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SpeedInsights />
    </BrowserRouter>
  )
}

export default App
