// src/components/modals/DeleteConfirmModal.jsx
// Reusable delete confirmation modal
// ============================================================================

import { useState } from 'react';
import { Close, TrashCan, Warning } from '@carbon/icons-react';

// ============================================================================
// Component
// ============================================================================

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName = null,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning'
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
      // Keep modal open on error
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      button: 'bg-red-600 hover:bg-red-700',
      iconBg: 'bg-red-50',
    },
    warning: {
      icon: 'text-yellow-500',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      iconBg: 'bg-yellow-50',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden"
        style={{ boxShadow: '2px 4px 12px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#1D1D1F]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Close size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex gap-4">
            {/* Icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              {variant === 'danger' ? (
                <TrashCan size={24} className={styles.icon} />
              ) : (
                <Warning size={24} className={styles.icon} />
              )}
            </div>

            {/* Message */}
            <div className="flex-1">
              <p className="text-gray-700" style={{ fontSize: '16px', letterSpacing: '0.16px' }}>
                {message}
              </p>
              
              {itemName && (
                <p className="mt-2 font-medium text-gray-900">
                  "{itemName}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white ${styles.button} rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <TrashCan size={16} />
            {isDeleting ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Specialized Delete Modals
// ============================================================================

export function DeleteProjectModal({ isOpen, onClose, onConfirm, project }) {
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Project"
      message="Are you sure you want to delete this project? All associated tasks, messages, and files will be permanently removed."
      itemName={project?.name}
      confirmText="Delete Project"
    />
  );
}

export function DeleteTaskModal({ isOpen, onClose, onConfirm, task }) {
  const hasSubtasks = task?.subtasks?.length > 0;
  
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Task"
      message={
        hasSubtasks 
          ? `This task has ${task.subtasks.length} subtask(s). Deleting it will also remove all subtasks.`
          : "Are you sure you want to delete this task? This action cannot be undone."
      }
      itemName={task?.title}
      confirmText="Delete Task"
    />
  );
}

export function ArchiveProjectModal({ isOpen, onClose, onConfirm, project }) {
  return (
    <DeleteConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Archive Project"
      message="Archiving will hide this project from the main list. You can restore it later from the archived projects view."
      itemName={project?.name}
      confirmText="Archive Project"
      variant="warning"
    />
  );
}
