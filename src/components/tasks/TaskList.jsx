// src/components/tasks/TaskList.jsx
// Task list component with CRUD operations for ProjectDetail page
// ============================================================================

import { useState } from 'react';
import { 
  Add, 
  Checkmark, 
  ChevronDown, 
  ChevronRight,
  Edit,
  TrashCan,
  Flag,
  Calendar,
  User,
  OverflowMenuVertical
} from '@carbon/icons-react';
import { useTasks, updateTask, deleteTask } from '../../hooks/useTasks';
import TaskModal from '../modals/TaskModal';
import { DeleteTaskModal } from '../modals/DeleteConfirmModal';

// ============================================================================
// Constants
// ============================================================================

const STATUS_CONFIG = {
  not_started: { label: 'To Do', color: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500' },
  completed: { label: 'Done', color: 'bg-green-100 text-green-700', dotColor: 'bg-green-500' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-400', dotColor: 'bg-gray-300' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'text-gray-400' },
  medium: { label: 'Medium', color: 'text-yellow-500' },
  high: { label: 'High', color: 'text-orange-500' },
  urgent: { label: 'Urgent', color: 'text-red-500' },
};

// ============================================================================
// Single Task Item Component
// ============================================================================

function TaskItem({ task, onEdit, onDelete, onStatusChange, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.not_started;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const hasSubtasks = task.subtasks?.length > 0;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    const newStatus = task.status === 'completed' ? 'not_started' : 'completed';
    onStatusChange(task.id, newStatus);
  };

  const handleMenuAction = (e, action) => {
    e.stopPropagation();
    setShowMenu(false);
    action();
  };

  return (
    <div className="group">
      {/* Task Row */}
      <div 
        className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors ${
          task.status === 'completed' ? 'opacity-60' : ''
        }`}
        style={{ paddingLeft: `${16 + level * 24}px` }}
      >
        {/* Expand/Collapse for subtasks */}
        <div className="w-5 flex-shrink-0">
          {hasSubtasks ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-400" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
            </button>
          ) : null}
        </div>

        {/* Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            task.status === 'completed'
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {task.status === 'completed' && <Checkmark size={12} />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className={`font-medium text-sm ${
                task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'
              }`}
            >
              {task.title}
            </span>
            
            {/* Priority Flag */}
            {task.priority !== 'medium' && (
              <Flag size={14} className={priority.color} />
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1">
            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
              {status.label}
            </span>

            {/* Due Date */}
            {task.due_date && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                <Calendar size={12} />
                {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}

            {/* Assignee */}
            {task.assigned_user && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <User size={12} />
                {task.assigned_user.full_name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <OverflowMenuVertical size={16} className="text-gray-500" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                <button
                  onClick={(e) => handleMenuAction(e, () => onEdit(task))}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={(e) => handleMenuAction(e, () => onDelete(task))}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <TrashCan size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="ml-4">
          {task.subtasks.map((subtask) => (
            <TaskItem
              key={subtask.id}
              task={subtask}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main TaskList Component
// ============================================================================

export default function TaskList({ projectId }) {
  const { tasks, loading, error, refetch } = useTasks({ projectId });
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);

  // Filter to only top-level tasks (no parent)
  const topLevelTasks = tasks.filter(t => !t.parent_task_id);

  const handleAddTask = (parentId = null) => {
    setEditingTask(null);
    setParentTaskId(parentId);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setParentTaskId(null);
    setShowTaskModal(true);
  };

  const handleDeleteTask = (task) => {
    setDeletingTask(task);
    setShowDeleteModal(true);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      refetch();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask.id);
      refetch();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleTaskSaved = () => {
    refetch();
  };

  // Task counts
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-[#1D1D1F]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-[#1D1D1F]">Tasks</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {completedCount} of {totalCount} completed ({completionPercent}%)
            </p>
          </div>
          <button 
            onClick={() => handleAddTask()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1D1D1F] text-white rounded-lg text-sm font-medium hover:bg-[#1D1D1F]/90 transition-colors"
          >
            <Add size={16} />
            Add Task
          </button>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="px-5 py-2 bg-gray-50">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="py-2">
          {topLevelTasks.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-gray-400 text-sm">No tasks yet</p>
              <button 
                onClick={() => handleAddTask()}
                className="mt-3 text-sm font-medium text-[#1D1D1F] hover:underline"
              >
                Add your first task
              </button>
            </div>
          ) : (
            topLevelTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleEditTask}
                onDelete={handleDeleteTask}
                onStatusChange={handleStatusChange}
              />
            ))
          )}
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
          setParentTaskId(null);
        }}
        onSuccess={handleTaskSaved}
        projectId={projectId}
        task={editingTask}
        parentTaskId={parentTaskId}
      />

      {/* Delete Confirmation */}
      <DeleteTaskModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTask(null);
        }}
        onConfirm={confirmDelete}
        task={deletingTask}
      />
    </>
  );
}
