// src/components/messages/MessageComposer.jsx
// Sprint 13: Message input with attachment and send
// ============================================================================

import { useState, useRef } from 'react'
import { sendMessage, uploadMessageImage } from '../../hooks/useMessages'
import { Attachment, SendFilled } from '@carbon/icons-react'

function MessageComposer({ conversationId }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const fileInputRef = useRef(null)

  // Handle send
  const handleSend = async () => {
    if ((!content.trim() && !imageFile) || sending) return

    try {
      setSending(true)

      let imageUrl = null
      
      // Upload image if present
      if (imageFile) {
        setUploading(true)
        imageUrl = await uploadMessageImage(imageFile, conversationId)
        setUploading(false)
      }

      // Send the message
      await sendMessage(conversationId, content.trim() || null, imageUrl)

      // Clear form
      setContent('')
      setImagePreview(null)
      setImageFile(null)
    } catch (err) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
      setUploading(false)
    }
  }

  // Handle key press (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    setImageFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Clear image
  const clearImage = () => {
    setImagePreview(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="border-t border-gray-100 bg-white">
      {/* Image Preview */}
      {imagePreview && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="h-20 w-auto rounded-lg object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 flex items-end gap-3">
        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send your message..."
            rows={1}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-transparent"
            style={{ 
              minHeight: '48px',
              maxHeight: '120px',
              backgroundColor: '#FFFFFF'
            }}
            disabled={sending}
          />
        </div>

        {/* Attachment Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || uploading}
          className="p-3 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-50"
          style={{ backgroundColor: '#1D1D1F' }}
          title="Attach image"
        >
          <Attachment size={20} style={{ color: '#FFFFFF' }} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!content.trim() && !imageFile) || sending}
          className="p-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#1D1D1F' }}
          title="Send message"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <SendFilled size={20} style={{ color: '#FFFFFF' }} />
          )}
        </button>
      </div>
    </div>
  )
}

export default MessageComposer
