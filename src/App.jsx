// src/App.jsx
// Sprint 9: Added RoleGuard for permission-based route protection
// ============================================================================

import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
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
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/" 
          element={session ? <Dashboard user={session.user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/projects" 
          element={session ? <Projects user={session.user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/projects/:projectId" 
          element={session ? <ProjectDetail user={session.user} /> : <Navigate to="/login" replace />} 
        />
        
        {/* Reports - requires canViewReports permission */}
        <Route 
          path="/reports" 
          element={
            session ? (
              <RoleGuard 
                require="canViewReports"
                unauthorized={<AccessDenied message="You don't have permission to view reports." />}
              >
                <Reports user={session.user} />
              </RoleGuard>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Profiles - admin only (requires canViewProfiles permission) */}
        <Route 
          path="/profiles" 
          element={
            session ? (
              <RoleGuard 
                require="canViewProfiles"
                unauthorized={<AccessDenied message="Only administrators can access the Profiles page." />}
              >
                <Profiles user={session.user} />
              </RoleGuard>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Settings - accessible to all authenticated users */}
        <Route 
          path="/settings" 
          element={session ? <Settings user={session.user} /> : <Navigate to="/login" replace />} 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SpeedInsights />
    </BrowserRouter>
  )
}

export default App
