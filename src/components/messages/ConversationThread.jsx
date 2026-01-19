// src/components/messages/ConversationThread.jsx
// Sprint 13: Chat thread with messages and composer
// ============================================================================

import { useEffect, useRef, useState } from 'react'
import { useMessages, markConversationAsRead } from '../../hooks/useMessages'
import MessageBubble from './MessageBubble'
import MessageComposer from './MessageComposer'
import { ChevronLeft, VideoChat, Phone } from '@carbon/icons-react'

function ConversationThread({ conversation, currentUserId, onBack }) {
  const { messages, loading, error } = useMessages(conversation.id)
  const messagesEndRef = useRef(null)
  const [hasScrolled, setHasScrolled] = useState(false)

  // Get display name
  const getDisplayName = () => {
    if (conversation.is_group && conversation.name) {
      return conversation.name
    }
    const other = conversation.otherParticipants?.[0]
    if (other) {
      return other.full_name || `${other.first_name} ${other.last_name}`.trim() || 'Unknown'
    }
    return 'Unknown'
  }

  // Get avatar
  const getAvatar = () => {
    if (conversation.is_group) return null
    return conversation.otherParticipants?.[0]?.avatar_url
  }

  // Get initials
  const getInitials = () => {
    const name = getDisplayName()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      // Only auto-scroll on initial load or new messages
      messagesEndRef.current.scrollIntoView({ 
        behavior: hasScrolled ? 'smooth' : 'auto' 
      })
      setHasScrolled(true)
    }
  }, [messages])

  // Mark as read when viewing
  useEffect(() => {
    if (conversation.id && conversation.unreadCount > 0) {
      markConversationAsRead(conversation.id).catch(console.error)
    }
  }, [conversation.id, conversation.unreadCount])

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = []
    let currentDate = null

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at).toDateString()
      
      if (messageDate !== currentDate) {
        currentDate = messageDate
        groups.push({
          type: 'date',
          date: message.created_at
        })
      }
      
      groups.push({
        type: 'message',
        message
      })
    })

    return groups
  }

  // Format date separator
  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  const groupedMessages = groupMessagesByDate()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Back button (mobile) */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 -ml-1 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <ChevronLeft size={24} style={{ color: '#1D1D1F' }} />
            </button>
          )}
          
          {/* Avatar */}
          <div className="relative">
            {getAvatar() ? (
              <img
                src={getAvatar()}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ backgroundColor: '#F3F4F6', color: '#4B5563' }}
              >
                {conversation.is_group ? (
                  <GroupIcon className="w-5 h-5" />
                ) : (
                  getInitials()
                )}
              </div>
            )}
            {/* Online indicator */}
            {!conversation.is_group && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </div>

          {/* Name and status */}
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#1D1D1F' }}>
              {getDisplayName()}
            </h3>
            <p className="text-xs text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Video call"
          >
            <VideoChat size={20} style={{ color: '#6B7280' }} />
          </button>
          <button 
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Phone call"
          >
            <Phone size={20} style={{ color: '#6B7280' }} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: '#FAFAFA' }}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500 text-sm">
            Error loading messages
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            <div className="text-center">
              <p>No messages yet</p>
              <p className="text-xs mt-1">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {groupedMessages.map((item, index) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${index}`} className="flex justify-center my-4">
                    <span 
                      className="px-4 py-1.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: '#1D1D1F', color: '#FFFFFF' }}
                    >
                      {formatDateSeparator(item.date)}
                    </span>
                  </div>
                )
              }
              
              return (
                <MessageBubble
                  key={item.message.id}
                  message={item.message}
                  isOwn={item.message.sender_id === currentUserId}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <MessageComposer conversationId={conversation.id} />
    </div>
  )
}

function GroupIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

export default ConversationThread
