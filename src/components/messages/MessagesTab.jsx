// src/components/messages/MessagesTab.jsx
// Sprint 13: Main messaging container for project detail page
// Two-column layout on desktop, single column on mobile
// ============================================================================

import { useState, useEffect } from 'react'
import { useConversations } from '../../hooks/useMessages'
import ConversationList from './ConversationList'
import ConversationThread from './ConversationThread'
import NewConversationModal from './NewConversationModal'

function MessagesTab({ projectId, currentUserId }) {
  const { conversations, loading, error, refetch } = useConversations(projectId)
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [mobileView, setMobileView] = useState('list') // 'list' or 'thread'

  // Filter conversations by search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    
    // Search in conversation name
    if (conv.name?.toLowerCase().includes(searchLower)) return true
    
    // Search in participant names
    const participantMatch = conv.otherParticipants?.some(p => 
      p.full_name?.toLowerCase().includes(searchLower) ||
      p.first_name?.toLowerCase().includes(searchLower) ||
      p.last_name?.toLowerCase().includes(searchLower)
    )
    if (participantMatch) return true
    
    // Search in latest message
    if (conv.latestMessage?.content?.toLowerCase().includes(searchLower)) return true
    
    return false
  })

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (!selectedConversation && filteredConversations.length > 0 && window.innerWidth >= 1024) {
      setSelectedConversation(filteredConversations[0])
    }
  }, [filteredConversations, selectedConversation])

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation)
    setMobileView('thread')
  }

  // Handle back button on mobile
  const handleBackToList = () => {
    setMobileView('list')
  }

  // Handle new conversation created
  const handleConversationCreated = (conversation) => {
    setShowNewConversation(false)
    refetch()
    setSelectedConversation(conversation)
    setMobileView('thread')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading messages</p>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: '#1D1D1F' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden"
      style={{ 
        boxShadow: '2px 4px 12px rgba(0,0,0,0.08)',
        height: 'calc(100vh - 340px)',
        minHeight: '500px'
      }}
    >
      {/* Desktop: Two-column layout */}
      <div className="hidden lg:flex h-full">
        {/* Left: Conversation List */}
        <div className="w-[380px] border-r border-gray-100 flex flex-col">
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedConversation?.id}
            onSelect={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewConversation={() => setShowNewConversation(true)}
            currentUserId={currentUserId}
          />
        </div>

        {/* Right: Conversation Thread */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <ConversationThread
              conversation={selectedConversation}
              currentUserId={currentUserId}
              onBack={null}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ChatIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: Single column with view switching */}
      <div className="lg:hidden h-full">
        {mobileView === 'list' ? (
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedConversation?.id}
            onSelect={handleSelectConversation}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewConversation={() => setShowNewConversation(true)}
            currentUserId={currentUserId}
          />
        ) : (
          selectedConversation && (
            <ConversationThread
              conversation={selectedConversation}
              currentUserId={currentUserId}
              onBack={handleBackToList}
            />
          )
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <NewConversationModal
          projectId={projectId}
          onClose={() => setShowNewConversation(false)}
          onCreated={handleConversationCreated}
        />
      )}
    </div>
  )
}

function ChatIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
}

export default MessagesTab
