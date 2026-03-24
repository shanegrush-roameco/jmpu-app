
import { useState, useEffect } from 'react';
import { Close, ChevronDown } from '@carbon/icons-react';
import { createTask, updateTask } from '../../hooks/useTasks';
import { useProfiles } from '../../hooks/useProfiles';
import { useProjects } from '../../hooks/useProjects';

// ============================================================================
// Constants
// ============================================================================

const TASK_STATUSES = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
];

const TASK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' },
];

// ============================================================================
// Component
// ============================================================================

export default function TaskModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  projectId, 
  task = null, // If provided, we're editing; otherwise creating
  parentTaskId = null, // For creating subtasks
}) {
  const isEditing = !!task;
  const { profiles: teamMembers } = useProfiles({ status: 'active' });

  // Only fetch projects when no projectId is provided (Dashboard context)
  const { projects } = useProjects(projectId ? { limit: 0 } : { limit: 50, sortBy: 'name', sortOrder: 'asc' });
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'not_started',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
    completion_percent: 0,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when task changes (for editing)
  useEffect(() => {
    setSelectedProjectId(projectId || '');
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'not_started',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        assigned_to: task.assigned_to || '',
        completion_percent: task.completion_percent ?? 0,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'not_started',
        priority: 'medium',
        due_date: '',
        assigned_to: '',
        completion_percent: 0,
      });
    }
  }, [task, isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }
    if (!projectId && !isEditing && !selectedProjectId) {
      newErrors.project = 'Please select a project';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        completion_percent: Math.min(100, Math.max(0, parseInt(formData.completion_percent) || 0)),
      };

      let result;
      
      if (isEditing) {
        result = await updateTask(task.id, taskData);
      } else {
        const resolvedProjectId = projectId || selectedProjectId || null;
        result = await createTask({
          ...taskData,
          project_id: resolvedProjectId,
          parent_task_id: parentTaskId || null,
        });
      }

      onSuccess?.(result);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({ submit: error.message || 'Failed to save task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div 
        className="relative bg-white rounded-2xl shadow-lg w-full max-w-lg overflow-hidden"
        style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">
            {isEditing ? 'Edit Task' : parentTaskId ? 'Add Subtask' : 'Add Task'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Close size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Project selector -- only shown when opening from Dashboard (no projectId context) */}
            {!projectId && !isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Project <span style={{ color: '#E8500A' }}>*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full appearance-none px-4 py-2 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                  >
                    <option value="">Select a project...</option>
                    {projects?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.address_line1 ? ` — ${p.address_line1}` : p.asset_number ? ` (#${p.asset_number})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Task Title <span style={{ color: '#E8500A' }}>*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter task title..."
                autoFocus
                className={`w-full px-4 py-2 rounded-xl border ${
                  errors.title ? 'border-red-300' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]`}
                style={{ fontSize: '16px', letterSpacing: '0.16px' }}
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add details about this task..."
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] resize-none"
                style={{ fontSize: '16px', letterSpacing: '0.16px' }}
              />
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full appearance-none px-4 py-2 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority
                </label>
                <div className="relative">
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full appearance-none px-4 py-2 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                  >
                    {TASK_PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>
            </div>

            {/* Due Date & Assignee Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]"
                  style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Assign To
                </label>
                <div className="relative">
                  <select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={handleChange}
                    className="w-full appearance-none px-4 py-2 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F] bg-white"
                    style={{ fontSize: '16px', letterSpacing: '0.16px' }}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>
                  <ChevronIcon />
                </div>
              </div>
            </div>

            {/* Completion % */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Completion %
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${formData.completion_percent}%`,
                      backgroundColor: formData.completion_percent === 100 ? '#22C55E' : formData.completion_percent >= 30 ? '#EAB308' : '#9CA3AF'
                    }}
                  />
                </div>
                <input
                  type="number"
                  name="completion_percent"
                  min="0"
                  max="100"
                  value={formData.completion_percent}
                  onChange={handleChange}
                  className="w-16 text-sm text-right px-2 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1D1D1F]/10 focus:border-[#1D1D1F]"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors"
              style={{ color: '#111111', border: '1px solid #111111', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#111111'
                e.currentTarget.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#111111'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-[#1D1D1F] hover:bg-[#1D1D1F]/90 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Positioned chevron for appearance-none selects
function ChevronIcon() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
      <ChevronDown size={16} className="text-gray-500" />
    </div>
  )
}
