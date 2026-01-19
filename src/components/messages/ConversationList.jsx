// src/components/messages/ConversationList.jsx
// Sprint 13: Conversation list with search and previews
// ============================================================================

import { Search, Add } from '@carbon/icons-react'

function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect, 
  searchQuery, 
  onSearchChange,
  onNewConversation,
  currentUserId 
}) {
  
  // Format relative time
  const formatTime = (dateString) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Now'
    if (diffMins < 60) return `${diffMins} m Ago`
    if (diffHours < 24) return `${diffHours} h Ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} d Ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get display name for conversation
  const getDisplayName = (conversation) => {
    if (conversation.is_group && conversation.name) {
      return conversation.name
    }
    
    // For 1:1, show other participant's name
    const other = conversation.otherParticipants?.[0]
    if (other) {
      return other.full_name || `${other.first_name} ${other.last_name}`.trim() || 'Unknown'
    }
    
    return 'Unknown'
  }

  // Get avatar for conversation
  const getAvatar = (conversation) => {
    if (conversation.is_group) {
      // For groups, could show multiple avatars or group icon
      return null
    }
    return conversation.otherParticipants?.[0]?.avatar_url
  }

  // Get initials for avatar fallback
  const getInitials = (conversation) => {
    const name = getDisplayName(conversation)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Check if message was sent by current user
  const isOwnMessage = (message) => {
    return message?.sender_id === currentUserId
  }

  // Get message preview
  const getPreview = (conversation) => {
    const msg = conversation.latestMessage
    if (!msg) return 'No messages yet'
    
    const prefix = isOwnMessage(msg) ? 'You: ' : ''
    const content = msg.content || (msg.image_url ? '📷 Photo' : '')
    
    return `${prefix}${content}`.slice(0, 40) + (content?.length > 40 ? '...' : '')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
            style={{ backgroundColor: '#FFFFFF' }}
          />
          <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
            <ChatIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-center">No conversations yet</p>
            <button
              onClick={onNewConversation}
              className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2"
              style={{ backgroundColor: '#1D1D1F' }}
            >
              <Add size={16} />
              Start a conversation
            </button>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isSelected = conversation.id === selectedId
            const hasUnread = conversation.unreadCount > 0
            
            return (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors border-l-4 ${
                  isSelected 
                    ? 'bg-gray-50 border-l-emerald-500' 
                    : 'hover:bg-gray-50 border-l-transparent'
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {getAvatar(conversation) ? (
                    <img
                      src={getAvatar(conversation)}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ 
                        backgroundColor: conversation.is_group ? '#E5E7EB' : '#F3F4F6',
                        color: '#4B5563'
                      }}
                    >
                      {conversation.is_group ? (
                        <GroupIcon className="w-6 h-6" />
                      ) : (
                        getInitials(conversation)
                      )}
                    </div>
                  )}
                  {/* Online indicator (for 1:1) */}
                  {!conversation.is_group && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm truncate ${hasUnread ? 'font-bold' : 'font-medium'}`} style={{ color: '#1D1D1F' }}>
                      {getDisplayName(conversation)}
                      {conversation.is_group && conversation.participantCount > 2 && (
                        <span className="text-gray-400 font-normal ml-1">
                          +{conversation.participantCount - 1} more
                        </span>
                      )}
                    </h4>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(conversation.latestMessage?.created_at || conversation.updated_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                      {getPreview(conversation)}
                    </p>
                    
                    {/* Read receipt or unread indicator */}
                    <div className="flex-shrink-0 ml-2">
                      {hasUnread ? (
                        <span 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-medium"
                          style={{ backgroundColor: '#22C55E' }}
                        >
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      ) : isOwnMessage(conversation.latestMessage) ? (
                        <DoubleCheckIcon className="w-5 h-5 text-emerald-500" />
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* New Conversation Button (if conversations exist) */}
      {conversations.length > 0 && (
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onNewConversation}
            className="w-full px-4 py-2.5 text-sm font-medium text-white rounded-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1D1D1F' }}
          >
            <Add size={16} />
            New Conversation
          </button>
        </div>
      )}
    </div>
  )
}

// Icons
function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

function GroupIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

function DoubleCheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M1 12l5 5L17 6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l5 5L23 6" />
    </svg>
  )
}

export default ConversationList
