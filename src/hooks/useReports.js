// src/hooks/useReports.js
// Sprint 11: Reports data fetching hook
// Provides aggregated data for Financial Outlook, Draws Summary, Jobs, and Action Center
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// useFinancialOutlook Hook - Aggregates budget/spend data from projects
// ============================================================================

export function useFinancialOutlook(options = {}) {
  const { startDate = null, endDate = null } = options;
  
  const [data, setData] = useState({ income: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query for projects within date range
      let query = supabase
        .from('projects')
        .select('budget_total, budget_spent, created_at, start_date, status')
        .eq('is_archived', false);

      // Filter by date range if provided
      if (startDate) {
        query = query.gte('start_date', startDate);
      }
      if (endDate) {
        query = query.lte('start_date', endDate);
      }

      const { data: projects, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Calculate totals
      // Income = total budgets from all projects (expected revenue)
      // Expenses = total spent across all projects (actual costs)
      const totals = projects.reduce(
        (acc, project) => {
          acc.income += parseFloat(project.budget_total) || 0;
          acc.expenses += parseFloat(project.budget_spent) || 0;
          return acc;
        },
        { income: 0, expenses: 0 }
      );

      setData(totals);
    } catch (err) {
      console.error('Error fetching financial outlook:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================================================
// useDrawsSummary Hook - Aggregates draw request data
// ============================================================================

export function useDrawsSummary(options = {}) {
  const { startDate = null, endDate = null } = options;
  
  const [data, setData] = useState({ pending: 0, total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query for draw requests
      let query = supabase
        .from('draw_requests')
        .select('amount_requested, amount_approved, status, submitted_at');

      // Filter by date range if provided
      if (startDate) {
        query = query.gte('submitted_at', startDate);
      }
      if (endDate) {
        query = query.lte('submitted_at', endDate);
      }

      const { data: draws, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Calculate totals by status
      const totals = draws.reduce(
        (acc, draw) => {
          const amount = parseFloat(draw.amount_requested) || 0;
          const approved = parseFloat(draw.amount_approved) || 0;
          
          acc.total += amount;
          
          // Status: 'pending', 'approved', 'paid', 'rejected'
          if (draw.status === 'pending' || draw.status === 'submitted') {
            acc.pending += amount;
          } else if (draw.status === 'approved' || draw.status === 'paid') {
            acc.completed += approved;
          }
          
          return acc;
        },
        { pending: 0, total: 0, completed: 0 }
      );

      setData(totals);
    } catch (err) {
      console.error('Error fetching draws summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================================================
// useJobs Hook - Tasks that need sign-off, filtered by contractor/project
// ============================================================================

export function useJobs(options = {}) {
  const {
    contractorId = null,
    projectId = null,
    status = null,
    limit = 10,
  } = options;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Query tasks that need attention (not completed, not signed off)
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          requires_signoff,
          signed_off_at,
          signed_off_by,
          project:project_id(id, name, project_number),
          assigned_user:assigned_to(id, full_name, company_id)
        `)
        .or('status.neq.completed,requires_signoff.eq.true,signed_off_at.is.null')
        .order('due_date', { ascending: true })
        .limit(limit);

      // Filter by contractor/assigned user's company
      // This requires a join - we'll filter in-memory for now
      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: tasks, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform tasks into jobs format
      const jobsData = tasks.map(task => ({
        id: task.id,
        title: task.title,
        project: task.project?.name || 'Unknown Project',
        projectNumber: task.project?.project_number,
        status: task.signed_off_at ? 'Signed Off' : 'Not Signed Off',
        dueDate: task.due_date,
        priority: task.priority,
        assignedTo: task.assigned_user?.full_name,
      }));

      // Filter by contractor if specified (in-memory filter)
      let filteredJobs = jobsData;
      if (contractorId) {
        filteredJobs = jobsData.filter(job => 
          job.assignedUser?.company_id === contractorId
        );
      }

      setJobs(filteredJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contractorId, projectId, status, limit]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}

// ============================================================================
// useActionCenter Hook - Items needing immediate attention
// ============================================================================

export function useActionCenter(options = {}) {
  const { projectId = null, limit = 10 } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];

      // Query tasks that are overdue or due today
      let query = supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          due_date,
          project:project_id(id, name, project_number)
        `)
        .neq('status', 'completed')
        .lte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data: tasks, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform into action items with urgency
      const actionItems = tasks.map(task => {
        const dueDate = new Date(task.due_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - dueDate) / (1000 * 60 * 60 * 24));

        let statusText;
        let urgent = false;

        if (diffDays > 0) {
          statusText = `Overdue ${diffDays} Day${diffDays > 1 ? 's' : ''}`;
          urgent = true;
        } else if (diffDays === 0) {
          statusText = 'Due Today';
          urgent = true;
        } else {
          statusText = `Due in ${Math.abs(diffDays)} Day${Math.abs(diffDays) > 1 ? 's' : ''}`;
        }

        return {
          id: task.id,
          title: task.title,
          project: task.project?.name || 'Unknown Project',
          projectNumber: task.project?.project_number,
          status: statusText,
          dueDate: task.due_date,
          priority: task.priority,
          urgent,
        };
      });

      setItems(actionItems);
    } catch (err) {
      console.error('Error fetching action center items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, limit]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}

// ============================================================================
// useContractors Hook - For dropdown filters
// ============================================================================

export function useContractors() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchContractors() {
      try {
        setLoading(true);
        setError(null);

        // Get companies that are contractors (have projects assigned)
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('id, name')
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;

        setContractors(data || []);
      } catch (err) {
        console.error('Error fetching contractors:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchContractors();
  }, []);

  return { contractors, loading, error };
}

// ============================================================================
// useProjectsForFilter Hook - Minimal project data for dropdowns
// ============================================================================

export function useProjectsForFilter() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('id, name, project_number, status')
          .eq('is_archived', false)
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;

        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects for filter:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  return { projects, loading, error };
}

// ============================================================================
// useReportsData Hook - Combined hook for full reports page
// ============================================================================

export function useReportsData(options = {}) {
  const {
    financialStartDate,
    financialEndDate,
    drawsStartDate,
    drawsEndDate,
    selectedContractorId,
    selectedProjectId,
  } = options;

  const financial = useFinancialOutlook({
    startDate: financialStartDate,
    endDate: financialEndDate,
  });

  const draws = useDrawsSummary({
    startDate: drawsStartDate,
    endDate: drawsEndDate,
  });

  const jobs = useJobs({
    contractorId: selectedContractorId,
    limit: 10,
  });

  const actionCenter = useActionCenter({
    projectId: selectedProjectId,
    limit: 10,
  });

  const { contractors } = useContractors();
  const { projects: projectsFilter } = useProjectsForFilter();

  return {
    financial,
    draws,
    jobs,
    actionCenter,
    contractors,
    projectsFilter,
    refetchAll: () => {
      financial.refetch();
      draws.refetch();
      jobs.refetch();
      actionCenter.refetch();
    },
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useFinancialOutlook,
  useDrawsSummary,
  useJobs,
  useActionCenter,
  useContractors,
  useProjectsForFilter,
  useReportsData,
};
