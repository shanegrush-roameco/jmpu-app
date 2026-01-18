// src/hooks/useCurrentProfile.js
// Sprint 9 + Sprint 12: Fetches the current authenticated user's profile from Supabase
// Returns profile data including role for permission checks and company for Settings
// ============================================================================

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook to fetch and manage the current user's profile
 * 
 * @returns {Object} { profile, loading, error, refetch }
 * - profile: The user's profile data including role and company, or null if not found
 * - loading: Boolean indicating if the profile is being fetched
 * - error: Error message if fetch failed, or null
 * - refetch: Function to manually refetch the profile
 */
export function useCurrentProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        throw new Error(authError.message)
      }

      if (!user) {
        // No authenticated user - not an error, just no profile
        setProfile(null)
        setLoading(false)
        return
      }

      // Fetch the profile from the profiles table with company relation
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          company:company_id(*)
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        // If profile doesn't exist yet, that's okay for new users
        if (profileError.code === 'PGRST116') {
          console.log('No profile found for user, may need to create one')
          setProfile(null)
        } else {
          throw new Error(profileError.message)
        }
      } else {
        setProfile(profileData)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    // Listen for auth state changes to refetch profile
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          fetchProfile()
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  }
}

export default useCurrentProfile
