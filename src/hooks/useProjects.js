// src/hooks/useProjects.js
// CRUD operations for Projects
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';

// ============================================================================
// useProjects Hook - List & Search Projects
// ============================================================================

export function useProjects(options = {}) {
  const {
    status = null,
    projectType = null,
    search = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 50,
    includeArchived = false,
  } = options;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
  .from('projects')
  .select('*')
  .order(sortBy, { ascending: sortOrder === 'asc' })
  .limit(limit);

      // Apply filters
      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (projectType) {
        query = query.eq('project_type', projectType);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,project_number.ilike.%${search}%,city.ilike.%${search}%`);
      }

      const { data, error: fetchError } = await query;

console.log('Supabase response:', { data, fetchError });

if (fetchError) throw fetchError;
setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status, projectType, search, sortBy, sortOrder, limit, includeArchived]);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToTable('projects', (payload) => {
      if (payload.eventType === 'INSERT') {
        setProjects((prev) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setProjects((prev) =>
          prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p))
        );
      } else if (payload.eventType === 'DELETE') {
        setProjects((prev) => prev.filter((p) => p.id !== payload.old.id));
      }
    });

    return unsubscribe;
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}

// ============================================================================
// useProject Hook - Single Project with all relations
// ============================================================================

export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select(`
          *,
          client:client_id(id, full_name, email, phone, avatar_url),
          project_manager:project_manager_id(id, full_name, email, phone, avatar_url),
          company:company_id(id, name, logo_url),
          created_by_user:created_by(id, full_name),
          tasks(id, title, status, priority, due_date, assigned_to),
          project_contractors(
            id, role, status, hourly_rate, flat_rate,
            contractor:contractor_id(id, full_name, email, phone, avatar_url)
          ),
          project_contacts(id, name, role, email, phone, is_primary),
          permits(id, permit_type, permit_number, status, expiration_date),
          draw_requests(id, draw_number, title, amount_requested, amount_approved, status),
          messages(id, content, created_at, sender:sender_id(id, full_name, avatar_url)),
          files(id, name, file_path, file_type, folder, created_at),
          notes(id, title, content, is_internal, created_at)
        `)
        .eq('id', projectId)
        .single();

      if (fetchError) throw fetchError;
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Real-time subscription for this specific project
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeToTable(
      'projects',
      (payload) => {
        if (payload.new?.id === projectId) {
          setProject((prev) => (prev ? { ...prev, ...payload.new } : payload.new));
        }
      },
      `id=eq.${projectId}`
    );

    return unsubscribe;
  }, [projectId]);

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  };
}

// ============================================================================
// Project CRUD Operations
// ============================================================================

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Created project
 */
export async function createProject(projectData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...projectData,
      created_by: user?.id,
    })
    .select(`
      *,
      client:client_id(id, full_name, email),
      project_manager:project_manager_id(id, full_name, email),
      company:company_id(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing project
 * @param {string} projectId - Project UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject(projectId, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select(`
      *,
      client:client_id(id, full_name, email),
      project_manager:project_manager_id(id, full_name, email),
      company:company_id(id, name)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a project (soft delete by archiving)
 * @param {string} projectId - Project UUID
 * @param {boolean} hardDelete - Permanently delete instead of archive
 */
export async function deleteProject(projectId, hardDelete = false) {
  if (hardDelete) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('projects')
      .update({ is_archived: true })
      .eq('id', projectId);

    if (error) throw error;
  }
}

/**
 * Restore an archived project
 * @param {string} projectId - Project UUID
 */
export async function restoreProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .update({ is_archived: false })
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Duplicate a project (useful for templates)
 * @param {string} projectId - Source project UUID
 * @param {Object} overrides - Fields to override in the copy
 */
export async function duplicateProject(projectId, overrides = {}) {
  // Fetch original project
  const { data: original, error: fetchError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (fetchError) throw fetchError;

  // Create copy with new ID and overrides
  const { id, project_number, created_at, updated_at, ...projectData } = original;
  
  const newProject = await createProject({
    ...projectData,
    name: `${original.name} (Copy)`,
    status: 'planning',
    actual_end_date: null,
    ...overrides,
  });

  return newProject;
}

// ============================================================================
// Project Statistics
// ============================================================================

export async function getProjectStats() {
  const { data, error } = await supabase
    .from('projects')
    .select('status, budget_total, budget_spent')
    .eq('is_archived', false);

  if (error) throw error;

  const stats = {
    total: data.length,
    byStatus: {
      planning: 0,
      in_progress: 0,
      on_hold: 0,
      completed: 0,
      cancelled: 0,
    },
    financials: {
      totalBudget: 0,
      totalSpent: 0,
    },
  };

  data.forEach((project) => {
    stats.byStatus[project.status]++;
    stats.financials.totalBudget += parseFloat(project.budget_total) || 0;
    stats.financials.totalSpent += parseFloat(project.budget_spent) || 0;
  });

  return stats;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useProjects,
  useProject,
  createProject,
  updateProject,
  deleteProject,
  restoreProject,
  duplicateProject,
  getProjectStats,
};
