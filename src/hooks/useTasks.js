// src/hooks/useTasks.js
// CRUD operations for Tasks
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';

// ============================================================================
// useTasks Hook - List tasks for a project or all tasks
// ============================================================================

export function useTasks(options = {}) {
  const {
    projectId = null,
    assignedTo = null,
    status = null,
    priority = null,
    sortBy = 'sort_order',
    sortOrder = 'asc',
    limit = 100,
  } = options;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoaded = useRef(false);

  const fetchTasks = useCallback(async () => {
    try {
      if (!hasLoaded.current) setLoading(true);
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:assigned_to(id, full_name, email, avatar_url),
          created_by_user:created_by(id, full_name),
          project:project_id(id, name, project_number),
          parent_task:parent_task_id(id, title),
          subtasks:tasks!parent_task_id(id, title, status)
        `)
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .limit(limit);

      // Apply filters
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (assignedTo) {
        query = query.eq('assigned_to', assignedTo);
      }

      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }

      if (priority) {
        query = query.eq('priority', priority);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
  setLoading(false);
  hasLoaded.current = true;  // ← add it here
}
  }, [projectId, assignedTo, status, priority, sortBy, sortOrder, limit]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    const filter = projectId ? `project_id=eq.${projectId}` : null;
    
    const unsubscribe = subscribeToTable('tasks', (payload) => {
      if (payload.eventType === 'INSERT') {
        // Only add if it matches our filters
        if (!projectId || payload.new.project_id === projectId) {
          fetchTasks(); // Refetch to get relations
        }
      } else if (payload.eventType === 'UPDATE') {
        setTasks((prev) =>
          prev.map((t) => (t.id === payload.new.id ? { ...t, ...payload.new } : t))
        );
      } else if (payload.eventType === 'DELETE') {
        setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
      }
    }, filter);

    return unsubscribe;
  }, [projectId, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
  };
}

// ============================================================================
// useTask Hook - Single Task
// ============================================================================

export function useTask(taskId) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTask = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:assigned_to(id, full_name, email, phone, avatar_url),
          created_by_user:created_by(id, full_name),
          project:project_id(id, name, project_number, status),
          parent_task:parent_task_id(id, title, status),
          subtasks:tasks!parent_task_id(
            id, title, status, priority, due_date,
            assigned_user:assigned_to(id, full_name, avatar_url)
          )
        `)
        .eq('id', taskId)
        .single();

      if (fetchError) throw fetchError;
      setTask(data);
    } catch (err) {
      console.error('Error fetching task:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  return {
    task,
    loading,
    error,
    refetch: fetchTask,
  };
}

// ============================================================================
// Task CRUD Operations
// ============================================================================

/**
 * Create a new task
 * @param {Object} taskData - Task data (must include project_id)
 * @returns {Promise<Object>} Created task
 */
export async function createTask(taskData) {
  const { data: { user } } = await supabase.auth.getUser();

  // Get the next sort order for this project
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('project_id', taskData.project_id)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = existingTasks?.[0]?.sort_order 
    ? existingTasks[0].sort_order + 1 
    : 0;

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      sort_order: taskData.sort_order ?? nextSortOrder,
      created_by: user?.id,
    })
    .select(`
      *,
      assigned_user:assigned_to(id, full_name, avatar_url),
      project:project_id(id, name, project_number)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing task
 * @param {string} taskId - Task UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated task
 */
export async function updateTask(taskId, updates) {
  // If marking as completed, set completed_at timestamp
  if (updates.status === 'completed') {
    updates.completed_at = new Date().toISOString();
  } else if (updates.status && updates.status !== 'completed') {
    updates.completed_at = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select(`
      *,
      assigned_user:assigned_to(id, full_name, avatar_url),
      project:project_id(id, name, project_number)
    `)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a task
 * @param {string} taskId - Task UUID
 * @param {boolean} deleteSubtasks - Also delete subtasks (default: true)
 */
export async function deleteTask(taskId, deleteSubtasks = true) {
  if (deleteSubtasks) {
    // Subtasks will be deleted via CASCADE
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } else {
    // First, unparent any subtasks
    await supabase
      .from('tasks')
      .update({ parent_task_id: null })
      .eq('parent_task_id', taskId);

    // Then delete the task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }
}

/**
 * Bulk update multiple tasks
 * @param {string[]} taskIds - Array of task UUIDs
 * @param {Object} updates - Fields to update
 */
export async function bulkUpdateTasks(taskIds, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .in('id', taskIds)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Bulk delete multiple tasks
 * @param {string[]} taskIds - Array of task UUIDs
 */
export async function bulkDeleteTasks(taskIds) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .in('id', taskIds);

  if (error) throw error;
}

/**
 * Reorder tasks within a project
 * @param {string} projectId - Project UUID
 * @param {Object[]} taskOrder - Array of { id, sort_order } objects
 */
export async function reorderTasks(projectId, taskOrder) {
  // Use a transaction-like approach with multiple updates
  const updates = taskOrder.map(({ id, sort_order }) =>
    supabase
      .from('tasks')
      .update({ sort_order })
      .eq('id', id)
      .eq('project_id', projectId)
  );

  await Promise.all(updates);
}

/**
 * Move task to different project
 * @param {string} taskId - Task UUID
 * @param {string} newProjectId - Target project UUID
 */
export async function moveTaskToProject(taskId, newProjectId) {
  // Get new sort order in target project
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('project_id', newProjectId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = existingTasks?.[0]?.sort_order 
    ? existingTasks[0].sort_order + 1 
    : 0;

  const { data, error } = await supabase
    .from('tasks')
    .update({
      project_id: newProjectId,
      sort_order: nextSortOrder,
      parent_task_id: null, // Remove parent when moving
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Duplicate a task
 * @param {string} taskId - Source task UUID
 * @param {Object} overrides - Fields to override
 */
export async function duplicateTask(taskId, overrides = {}) {
  const { data: original, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (fetchError) throw fetchError;

  const { id, created_at, updated_at, completed_at, ...taskData } = original;

  const newTask = await createTask({
    ...taskData,
    title: `${original.title} (Copy)`,
    status: 'not_started',
    ...overrides,
  });

  return newTask;
}

// ============================================================================
// Task Status Updates (Common Operations)
// ============================================================================

export async function markTaskComplete(taskId) {
  return updateTask(taskId, { status: 'completed' });
}

export async function markTaskInProgress(taskId) {
  return updateTask(taskId, { status: 'in_progress' });
}

export async function markTaskBlocked(taskId) {
  return updateTask(taskId, { status: 'blocked' });
}

export async function assignTask(taskId, userId) {
  return updateTask(taskId, { assigned_to: userId });
}

export async function unassignTask(taskId) {
  return updateTask(taskId, { assigned_to: null });
}

export async function setTaskPriority(taskId, priority) {
  return updateTask(taskId, { priority });
}

export async function setTaskDueDate(taskId, dueDate) {
  return updateTask(taskId, { due_date: dueDate });
}

// ============================================================================
// Task Statistics
// ============================================================================

export async function getTaskStats(projectId = null) {
  let query = supabase
    .from('tasks')
    .select('status, priority');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats = {
    total: data.length,
    byStatus: {
      not_started: 0,
      in_progress: 0,
      blocked: 0,
      completed: 0,
      cancelled: 0,
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
    completionRate: 0,
  };

  data.forEach((task) => {
    stats.byStatus[task.status]++;
    stats.byPriority[task.priority]++;
  });

  if (stats.total > 0) {
    stats.completionRate = (stats.byStatus.completed / stats.total) * 100;
  }

  return stats;
}

/**
 * Get overdue tasks
 * @param {string} projectId - Optional project filter
 */
export async function getOverdueTasks(projectId = null) {
  const today = new Date().toISOString().split('T')[0];
  
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assigned_user:assigned_to(id, full_name, avatar_url),
      project:project_id(id, name, project_number)
    `)
    .lt('due_date', today)
    .not('status', 'in', '("completed","cancelled")')
    .order('due_date', { ascending: true });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

/**
 * Get tasks due soon (within N days)
 * @param {number} days - Number of days
 * @param {string} projectId - Optional project filter
 */
export async function getTasksDueSoon(days = 7, projectId = null) {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  
  let query = supabase
    .from('tasks')
    .select(`
      *,
      assigned_user:assigned_to(id, full_name, avatar_url),
      project:project_id(id, name, project_number)
    `)
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .not('status', 'in', '("completed","cancelled")')
    .order('due_date', { ascending: true });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useTasks,
  useTask,
  createTask,
  updateTask,
  deleteTask,
  bulkUpdateTasks,
  bulkDeleteTasks,
  reorderTasks,
  moveTaskToProject,
  duplicateTask,
  markTaskComplete,
  markTaskInProgress,
  markTaskBlocked,
  assignTask,
  unassignTask,
  setTaskPriority,
  setTaskDueDate,
  getTaskStats,
  getOverdueTasks,
  getTasksDueSoon,
};
