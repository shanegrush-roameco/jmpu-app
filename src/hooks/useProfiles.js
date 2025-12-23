// src/hooks/useProfiles.js
// CRUD operations for Profiles (User Management)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';

// ============================================================================
// useProfiles Hook - List & Search Profiles
// ============================================================================

export function useProfiles(options = {}) {
  const {
    role = null,
    status = null,
    companyId = null,
    search = '',
    sortBy = 'full_name',
    sortOrder = 'asc',
    limit = 100,
  } = options;

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select(`
          *,
          company:company_id(id, name, logo_url)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .limit(limit);

      // Apply filters
      if (role) {
        if (Array.isArray(role)) {
          query = query.in('role', role);
        } else {
          query = query.eq('role', role);
        }
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,job_title.ilike.%${search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role, status, companyId, search, sortBy, sortOrder, limit]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToTable('profiles', (payload) => {
      if (payload.eventType === 'INSERT') {
        setProfiles((prev) => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setProfiles((prev) =>
          prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
        );
      } else if (payload.eventType === 'DELETE') {
        setProfiles((prev) => prev.filter((p) => p.id !== payload.old.id));
      }
    });

    return unsubscribe;
  }, []);

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
  };
}

// ============================================================================
// useProfile Hook - Single Profile
// ============================================================================

export function useProfile(profileId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!profileId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          *,
          company:company_id(*)
        `)
        .eq('id', profileId)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

// ============================================================================
// useCurrentProfile Hook - Logged-in User's Profile
// ============================================================================

export function useCurrentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          *,
          company:company_id(*)
        `)
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching current profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

// ============================================================================
// Profile CRUD Operations
// ============================================================================

/**
 * Update a profile
 * @param {string} profileId - Profile UUID
 * @param {Object} updates - Fields to update
 */
export async function updateProfile(profileId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select(`
      *,
      company:company_id(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update current user's profile
 * @param {Object} updates - Fields to update
 */
export async function updateCurrentProfile(updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  return updateProfile(user.id, updates);
}

/**
 * Update profile status (admin function)
 * @param {string} profileId - Profile UUID
 * @param {string} status - New status ('active', 'inactive', 'suspended')
 */
export async function setProfileStatus(profileId, status) {
  return updateProfile(profileId, { status });
}

/**
 * Update profile role (admin function)
 * @param {string} profileId - Profile UUID
 * @param {string} role - New role
 */
export async function setProfileRole(profileId, role) {
  return updateProfile(profileId, { role });
}

/**
 * Bulk update profile statuses
 * @param {string[]} profileIds - Array of profile UUIDs
 * @param {string} status - New status
 */
export async function bulkUpdateProfileStatus(profileIds, status) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .in('id', profileIds)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Delete a user (deletes from auth, profile cascades)
 * Note: This requires admin privileges in Supabase
 * @param {string} profileId - Profile/User UUID
 */
export async function deleteUser(profileId) {
  // Note: In production, this should call a server function with admin privileges
  // For now, we'll delete the profile (auth deletion needs server-side handling)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', profileId);

  if (error) throw error;
}

/**
 * Update notification preferences
 * @param {string} profileId - Profile UUID
 * @param {Object} preferences - Notification preference updates
 */
export async function updateNotificationPreferences(profileId, preferences) {
  const { data: current } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', profileId)
    .single();

  const mergedPreferences = {
    ...(current?.notification_preferences || {}),
    ...preferences,
  };

  return updateProfile(profileId, { 
    notification_preferences: mergedPreferences 
  });
}

/**
 * Upload and update avatar
 * @param {string} profileId - Profile UUID
 * @param {File} file - Image file
 */
export async function updateAvatar(profileId, file) {
  const fileExt = file.name.split('.').pop();
  const filePath = `avatars/${profileId}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // Update profile with new avatar URL
  return updateProfile(profileId, { avatar_url: publicUrl });
}

// ============================================================================
// Profile Statistics
// ============================================================================

export async function getProfileStats() {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, status');

  if (error) throw error;

  const stats = {
    total: data.length,
    byRole: {
      admin: 0,
      project_manager: 0,
      contractor: 0,
      client: 0,
      viewer: 0,
    },
    byStatus: {
      active: 0,
      inactive: 0,
      suspended: 0,
    },
  };

  data.forEach((profile) => {
    stats.byRole[profile.role]++;
    stats.byStatus[profile.status]++;
  });

  return stats;
}

// ============================================================================
// Contractors List (filtered profiles)
// ============================================================================

export function useContractors(options = {}) {
  return useProfiles({
    ...options,
    role: 'contractor',
    status: 'active',
  });
}

export function useProjectManagers(options = {}) {
  return useProfiles({
    ...options,
    role: ['admin', 'project_manager'],
    status: 'active',
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useProfiles,
  useProfile,
  useCurrentProfile,
  useContractors,
  useProjectManagers,
  updateProfile,
  updateCurrentProfile,
  setProfileStatus,
  setProfileRole,
  bulkUpdateProfileStatus,
  deleteUser,
  updateNotificationPreferences,
  updateAvatar,
  getProfileStats,
};
