// src/components/messages/MessageBubble.jsx
// Sprint 13: Individual message bubble styling
// Own messages: dark background, right-aligned
// Other messages: light background, left-aligned
// ============================================================================

function MessageBubble({ message, isOwn }) {
  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    })
  }

  // Format date for timestamp
  const formatFullTime = (dateString) => {
    const date = new Date(dateString)
    return `Today ${formatTime(dateString)}`
  }

  // Get sender initials
  const getInitials = () => {
    if (!message.sender) return '?'
    const name = message.sender.full_name || 
                 `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim()
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (only for others' messages) */}
      {!isOwn && (
        <div className="flex-shrink-0">
          {message.sender?.avatar_url ? (
            <img
              src={message.sender.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: '#E5E7EB', color: '#4B5563' }}
            >
              {getInitials()}
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl overflow-hidden ${
            isOwn 
              ? 'rounded-br-md' 
              : 'rounded-bl-md'
          }`}
          style={{
            backgroundColor: isOwn ? '#1D1D1F' : '#FFFFFF',
            color: isOwn ? '#FFFFFF' : '#1D1D1F',
            boxShadow: isOwn ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          {/* Image if present */}
          {message.image_url && (
            <div className="max-w-xs">
              <img
                src={message.image_url}
                alt="Attachment"
                className="w-full h-auto rounded-t-2xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.image_url, '_blank')}
              />
            </div>
          )}
          
          {/* Text content */}
          {message.content && (
            <p className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {/* Timestamp */}
        <p 
          className={`text-xs mt-1 ${isOwn ? 'text-right' : 'text-left'}`}
          style={{ color: '#9CA3AF' }}
        >
          {formatFullTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}

export default MessageBubble
