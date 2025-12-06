import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/Projectdetail'
import Reports from './pages/Reports'
import Profiles from './pages/Profiles'
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
        <Route 
          path="/login" 
          element={session ? <Navigate to="/" replace /> : <Login />} 
        />
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
        <Route 
          path="/reports" 
          element={session ? <Reports user={session.user} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profiles" 
          element={session ? <Profiles user={session.user} /> : <Navigate to="/login" replace />} 
        />
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SpeedInsights />
    </BrowserRouter>
  )
}

export default App