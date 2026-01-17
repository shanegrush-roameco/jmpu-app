// src/hooks/useDrawRequests.js
// Sprint 11: Draw Requests CRUD and queries
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase, subscribeToTable } from '../lib/supabase';

// ============================================================================
// useDrawRequests Hook - List draw requests with filters
// ============================================================================

export function useDrawRequests(options = {}) {
  const {
    projectId = null,
    status = null,
    startDate = null,
    endDate = null,
    limit = 50,
  } = options;

  const [drawRequests, setDrawRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDrawRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('draw_requests')
        .select(`
          id,
          draw_number,
          title,
          description,
          amount_requested,
          amount_approved,
          status,
          submitted_at,
          approved_at,
          paid_at,
          notes,
          created_at,
          project:project_id(id, name, project_number),
          submitted_by_user:submitted_by(id, full_name),
          approved_by_user:approved_by(id, full_name)
        `)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('submitted_at', startDate);
      }

      if (endDate) {
        query = query.lte('submitted_at', endDate);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDrawRequests(data || []);
    } catch (err) {
      console.error('Error fetching draw requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, status, startDate, endDate, limit]);

  useEffect(() => {
    fetchDrawRequests();
  }, [fetchDrawRequests]);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = subscribeToTable('draw_requests', (payload) => {
      if (payload.eventType === 'INSERT') {
        setDrawRequests((prev) => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setDrawRequests((prev) =>
          prev.map((d) => (d.id === payload.new.id ? { ...d, ...payload.new } : d))
        );
      } else if (payload.eventType === 'DELETE') {
        setDrawRequests((prev) => prev.filter((d) => d.id !== payload.old.id));
      }
    });

    return unsubscribe;
  }, []);

  return {
    drawRequests,
    loading,
    error,
    refetch: fetchDrawRequests,
  };
}

// ============================================================================
// useDrawRequest Hook - Single draw request
// ============================================================================

export function useDrawRequest(drawRequestId) {
  const [drawRequest, setDrawRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDrawRequest() {
      if (!drawRequestId) {
        setDrawRequest(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('draw_requests')
          .select(`
            *,
            project:project_id(id, name, project_number, address_line1, city, state),
            submitted_by_user:submitted_by(id, full_name, email),
            approved_by_user:approved_by(id, full_name, email)
          `)
          .eq('id', drawRequestId)
          .single();

        if (fetchError) throw fetchError;

        setDrawRequest(data);
      } catch (err) {
        console.error('Error fetching draw request:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDrawRequest();
  }, [drawRequestId]);

  return { drawRequest, loading, error };
}

// ============================================================================
// useDrawRequestStats Hook - Aggregated stats for dashboard/reports
// ============================================================================

export function useDrawRequestStats(options = {}) {
  const { startDate = null, endDate = null, projectId = null } = options;

  const [stats, setStats] = useState({
    totalRequested: 0,
    totalApproved: 0,
    totalPaid: 0,
    totalPending: 0,
    count: {
      total: 0,
      pending: 0,
      approved: 0,
      paid: 0,
      rejected: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('draw_requests')
          .select('amount_requested, amount_approved, status, submitted_at');

        if (projectId) {
          query = query.eq('project_id', projectId);
        }

        if (startDate) {
          query = query.gte('submitted_at', startDate);
        }

        if (endDate) {
          query = query.lte('submitted_at', endDate);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const calculated = data.reduce(
          (acc, draw) => {
            const requested = parseFloat(draw.amount_requested) || 0;
            const approved = parseFloat(draw.amount_approved) || 0;

            acc.totalRequested += requested;
            acc.count.total += 1;

            switch (draw.status) {
              case 'pending':
              case 'submitted':
                acc.totalPending += requested;
                acc.count.pending += 1;
                break;
              case 'approved':
                acc.totalApproved += approved;
                acc.count.approved += 1;
                break;
              case 'paid':
                acc.totalApproved += approved;
                acc.totalPaid += approved;
                acc.count.paid += 1;
                break;
              case 'rejected':
                acc.count.rejected += 1;
                break;
              default:
                break;
            }

            return acc;
          },
          {
            totalRequested: 0,
            totalApproved: 0,
            totalPaid: 0,
            totalPending: 0,
            count: { total: 0, pending: 0, approved: 0, paid: 0, rejected: 0 },
          }
        );

        setStats(calculated);
      } catch (err) {
        console.error('Error fetching draw request stats:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [projectId, startDate, endDate]);

  return { stats, loading, error };
}

// ============================================================================
// createDrawRequest - Create new draw request
// ============================================================================

export async function createDrawRequest(drawData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create draw requests');
  }

  // Get the next draw number for this project
  const { data: existingDraws, error: countError } = await supabase
    .from('draw_requests')
    .select('draw_number')
    .eq('project_id', drawData.project_id)
    .order('draw_number', { ascending: false })
    .limit(1);

  if (countError) throw countError;

  const nextDrawNumber = existingDraws.length > 0 
    ? (existingDraws[0].draw_number || 0) + 1 
    : 1;

  const { data, error } = await supabase
    .from('draw_requests')
    .insert({
      ...drawData,
      draw_number: nextDrawNumber,
      status: 'submitted',
      submitted_by: user.id,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ============================================================================
// updateDrawRequest - Update existing draw request
// ============================================================================

export async function updateDrawRequest(id, updates) {
  const { data, error } = await supabase
    .from('draw_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ============================================================================
// approveDrawRequest - Approve a draw request
// ============================================================================

export async function approveDrawRequest(id, approvedAmount, notes = null) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to approve draw requests');
  }

  const { data, error } = await supabase
    .from('draw_requests')
    .update({
      status: 'approved',
      amount_approved: approvedAmount,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      notes: notes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ============================================================================
// markDrawRequestPaid - Mark as paid
// ============================================================================

export async function markDrawRequestPaid(id) {
  const { data, error } = await supabase
    .from('draw_requests')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ============================================================================
// rejectDrawRequest - Reject a draw request
// ============================================================================

export async function rejectDrawRequest(id, reason) {
  const { data, error } = await supabase
    .from('draw_requests')
    .update({
      status: 'rejected',
      notes: reason,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ============================================================================
// deleteDrawRequest - Delete a draw request
// ============================================================================

export async function deleteDrawRequest(id) {
  const { error } = await supabase
    .from('draw_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useDrawRequests,
  useDrawRequest,
  useDrawRequestStats,
  createDrawRequest,
  updateDrawRequest,
  approveDrawRequest,
  markDrawRequestPaid,
  rejectDrawRequest,
  deleteDrawRequest,
};
