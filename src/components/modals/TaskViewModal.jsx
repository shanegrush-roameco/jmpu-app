// src/components/modals/TaskViewModal.jsx
// Read-only view of a task. Edit button opens TaskModal in edit mode.
// ============================================================================

import { useState, useEffect } from 'react';
import { Close, Edit } from '@carbon/icons-react';
import TaskModal from './TaskModal';

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', bg: '#F3F4F6', color: '#374151' },
  in_progress:  { label: 'In Progress', bg: '#EFF6FF', color: '#1D4ED8' },
  blocked:      { label: 'Blocked',     bg: '#FEE2E2', color: '#B91C1C' },
  completed:    { label: 'Completed',   bg: '#DCFCE7', color: '#166534' },
  cancelled:    { label: 'Cancelled',   bg: '#F3F4F6', color: '#6B7280' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    bg: '#F3F4F6', color: '#6B7280' },
  medium: { label: 'Medium', bg: '#EFF6FF', color: '#1D4ED8' },
  high:   { label: 'High',   bg: '#FEF3C7', color: '#92400E' },
  urgent: { label: 'Urgent', bg: '#FEE2E2', color: '#B91C1C' },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
}

export default function TaskViewModal({ isOpen, onClose, task, projectId, onSuccess }) {
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.low;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div
          className="relative bg-white rounded-2xl w-full max-w-lg overflow-hidden"
          style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-[#1D1D1F]">Task</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                style={{ color: '#111111', border: '1px solid #E5E7EB' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Edit size={14} />
                Edit
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Close size={20} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <p className="text-xl font-semibold" style={{ color: '#1D1D1F' }}>{task.title}</p>
            </div>

            {/* Status + Priority */}
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {status.label}
              </span>
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ backgroundColor: priority.bg, color: priority.color }}
              >
                {priority.label}
              </span>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Assigned To</p>
                <p className="text-sm text-gray-700">
                  {task.assigned_to_profile?.full_name || <span className="text-gray-400">Unassigned</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Due Date</p>
                <p className="text-sm" style={{ color: isOverdue ? '#EF4444' : '#374151' }}>
                  {formatDate(task.due_date) || <span className="text-gray-400">No due date</span>}
                  {isOverdue && <span className="ml-1 text-xs">Overdue</span>}
                </p>
              </div>
            </div>

            {/* Completion */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Completion</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${task.completion_percent ?? 0}%`,
                      backgroundColor: (task.completion_percent ?? 0) === 100 ? '#22C55E' : (task.completion_percent ?? 0) >= 30 ? '#EAB308' : '#9CA3AF'
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-10 text-right">{task.completion_percent ?? 0}%</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors"
              style={{ color: '#111111', border: '1px solid #111111', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111111'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#111111'; }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal -- opens on top */}
      <TaskModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={(updated) => {
          setEditOpen(false);
          onSuccess?.(updated);
          onClose();
        }}
        projectId={projectId}
        task={task}
      />
    </>
  );
}
