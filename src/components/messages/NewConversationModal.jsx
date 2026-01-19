// src/components/messages/NewConversationModal.jsx
// Sprint 13: Modal to start a new conversation with team members
// ============================================================================

import { useState, useEffect } from 'react'
import { Close, Search, Checkmark } from '@carbon/icons-react'
import { getProjectTeamMembers, createConversation } from '../../hooks/useMessages'

function NewConversationModal({ projectId, onClose, onCreated }) {
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState([])
  const [groupName, setGroupName] = useState('')

  // Fetch team members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const members = await getProjectTeamMembers(projectId)
        setTeamMembers(members)
      } catch (err) {
        console.error('Error fetching team members:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [projectId])

  // Filter members by search
  const filteredMembers = teamMembers.filter(member => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      member.full_name?.toLowerCase().includes(searchLower) ||
      member.first_name?.toLowerCase().includes(searchLower) ||
      member.last_name?.toLowerCase().includes(searchLower) ||
      member.job_title?.toLowerCase().includes(searchLower)
    )
  })

  // Toggle member selection
  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  // Get initials
  const getInitials = (member) => {
    const name = member.full_name || `${member.first_name || ''} ${member.last_name || ''}`.trim()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  // Handle create conversation
  const handleCreate = async () => {
    if (selectedMembers.length === 0 || creating) return

    try {
      setCreating(true)
      
      const isGroup = selectedMembers.length > 1
      const conversation = await createConversation(
        projectId,
        selectedMembers,
        isGroup ? groupName || generateGroupName() : null,
        isGroup
      )

      onCreated(conversation)
    } catch (err) {
      console.error('Error creating conversation:', err)
      alert('Failed to create conversation. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  // Generate default group name
  const generateGroupName = () => {
    const selected = teamMembers.filter(m => selectedMembers.includes(m.id))
    const names = selected.map(m => m.first_name || m.full_name?.split(' ')[0] || 'User')
    
    if (names.length <= 3) {
      return names.join(', ')
    }
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
  }

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
            New Conversation
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Close size={24} style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        </div>

        {/* Selected Members (if multiple) */}
        {selectedMembers.length > 1 && (
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Group Name (optional)
            </label>
            <input
              type="text"
              placeholder={generateGroupName()}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>
        )}

        {/* Team Members List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No team members found</p>
            </div>
          ) : (
            <div className="py-2">
              {filteredMembers.map((member) => {
                const isSelected = selectedMembers.includes(member.id)
                
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`w-full px-6 py-3 flex items-center gap-3 text-left transition-colors ${
                      isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Selection indicator */}
                    <div 
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500' 
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Checkmark size={12} style={{ color: '#FFFFFF' }} />}
                    </div>

                    {/* Avatar */}
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: '#E5E7EB', color: '#4B5563' }}
                      >
                        {getInitials(member)}
                      </div>
                    )}

                    {/* Name and title */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: '#1D1D1F' }}>
                        {member.full_name || `${member.first_name} ${member.last_name}`.trim()}
                      </p>
                      {member.job_title && (
                        <p className="text-xs text-gray-500 truncate">
                          {member.job_title}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selectedMembers.length === 0 
              ? 'Select members to chat with'
              : `${selectedMembers.length} selected`
            }
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={selectedMembers.length === 0 || creating}
              className="px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1D1D1F' }}
            >
              {creating ? 'Creating...' : 'Start Chat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewConversationModal
