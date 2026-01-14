// src/hooks/useAISummary.js
// Hook for generating AI-powered project summaries via Supabase Edge Function
// Sprint 10: AI Integration
// ============================================================================

import { useState } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// Hook
// ============================================================================

export function useAISummary() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Generate an AI summary for a project
   * @param {Object} project - Project data from Supabase
   * @param {Array} tasks - Array of tasks for the project
   * @param {Object} options - Options for what to include in the summary
   */
  const generateSummary = async (project, tasks = [], options = {}) => {
    setIsGenerating(true);
    setError(null);
    setSummary(null);

    try {
      // Get the current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to generate summaries');
      }

      // Call the Edge Function
      const { data, error: fnError } = await supabase.functions.invoke(
        'generate-project-summary',
        {
          body: {
            project,
            tasks,
            options: {
              includeTasks: options.includeTasks ?? true,
              includeFinancials: options.includeFinancials ?? true,
              includePermits: options.includePermits ?? true,
              includeTimeline: options.includeTimeline ?? true,
            },
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || 'Failed to generate summary');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary({
        text: data.summary,
        generatedAt: data.generatedAt,
        projectNumber: data.projectNumber,
      });

      return data;
    } catch (err) {
      console.error('Error generating AI summary:', err);
      setError(err.message || 'An unexpected error occurred');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Clear the current summary
   */
  const clearSummary = () => {
    setSummary(null);
    setError(null);
  };

  /**
   * Copy summary to clipboard
   */
  const copyToClipboard = async () => {
    if (!summary?.text) return false;
    
    try {
      await navigator.clipboard.writeText(summary.text);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  };

  return {
    generateSummary,
    clearSummary,
    copyToClipboard,
    isGenerating,
    summary,
    error,
  };
}

export default useAISummary;
