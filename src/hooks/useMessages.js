// src/hooks/useMessages.js
// Sprint 13: Messaging system hook with real-time subscriptions
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ============================================================================
// CONVERSATIONS HOOK
// Fetches all conversations for a project with participant info
// ============================================================================
export function useConversations(projectId) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConversations = useCallback(async () => {
    if (!projectId) return

    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Fetch conversations with participants and latest message
      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          conversation_participants!inner (
            user_id,
            last_read_at,
            profiles:user_id (
              id,
              first_name,
              last_name,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      // For each conversation, get the latest message
      const conversationsWithMessages = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              image_url,
              created_at,
              sender_id,
              profiles:sender_id (
                first_name,
                last_name,
                full_name
              )
            `)
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const latestMessage = messages?.[0] || null
          
          // Get current user's participation for unread status
          const myParticipation = conv.conversation_participants.find(
            p => p.user_id === user.id
          )
          
          // Count unread messages
          let unreadCount = 0
          if (myParticipation && latestMessage) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .gt('created_at', myParticipation.last_read_at)
              .neq('sender_id', user.id)
            
            unreadCount = count || 0
          }

          // Get other participants (for 1:1 chat display)
          const otherParticipants = conv.conversation_participants
            .filter(p => p.user_id !== user.id)
            .map(p => p.profiles)

          return {
            ...conv,
            latestMessage,
            unreadCount,
            otherParticipants,
            participantCount: conv.conversation_participants.length
          }
        })
      )

      setConversations(conversationsWithMessages)
      setError(null)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Initial fetch
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Real-time subscription for conversation updates
  useEffect(() => {
    if (!projectId) return

    const channel = supabase
      .channel(`conversations-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Refresh to get updated timestamps and latest messages
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, fetchConversations])

  return { conversations, loading, error, refetch: fetchConversations }
}

// ============================================================================
// MESSAGES HOOK
// Fetches messages for a specific conversation with real-time updates
// ============================================================================
export function useMessages(conversationId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return

    try {
      setLoading(true)

      const { data, error: fetchError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            first_name,
            last_name,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      setMessages(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // Initial fetch
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:sender_id (
                id,
                first_name,
                last_name,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setMessages(prev => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  return { messages, loading, error, refetch: fetchMessages }
}

// ============================================================================
// CONVERSATION PARTICIPANTS HOOK
// Fetches participants for a conversation
// ============================================================================
export function useConversationParticipants(conversationId) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!conversationId) return

    const fetchParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from('conversation_participants')
          .select(`
            *,
            profile:user_id (
              id,
              first_name,
              last_name,
              full_name,
              avatar_url,
              status
            )
          `)
          .eq('conversation_id', conversationId)

        if (error) throw error
        setParticipants(data || [])
      } catch (err) {
        console.error('Error fetching participants:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchParticipants()
  }, [conversationId])

  return { participants, loading }
}

// ============================================================================
// MESSAGE ACTIONS
// ============================================================================

// Send a new message
export async function sendMessage(conversationId, content, imageUrl = null) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      image_url: imageUrl
    })
    .select(`
      *,
      sender:sender_id (
        id,
        first_name,
        last_name,
        full_name,
        avatar_url
      )
    `)
    .single()

  if (error) throw error
  return data
}

// Create a new conversation
export async function createConversation(projectId, participantIds, name = null, isGroup = false) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Create the conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      project_id: projectId,
      name: isGroup ? name : null,
      is_group: isGroup
    })
    .select()
    .single()

  if (convError) throw convError

  // Add all participants (including current user)
  const allParticipants = [...new Set([user.id, ...participantIds])]
  
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert(
      allParticipants.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId
      }))
    )

  if (partError) throw partError

  return conversation
}

// Mark conversation as read
export async function markConversationAsRead(conversationId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)

  if (error) throw error
}

// Upload message image
export async function uploadMessageImage(file, conversationId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fileExt = file.name.split('.').pop()
  const fileName = `${conversationId}/${user.id}-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('message-attachments')
    .upload(fileName, file)

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('message-attachments')
    .getPublicUrl(fileName)

  return publicUrl
}

// Find or create 1:1 conversation
export async function findOrCreateDirectConversation(projectId, otherUserId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Look for existing 1:1 conversation between these two users in this project
  const { data: existingConvs } = await supabase
    .from('conversations')
    .select(`
      *,
      conversation_participants (user_id)
    `)
    .eq('project_id', projectId)
    .eq('is_group', false)

  // Find one where both users are participants and only 2 participants exist
  const existingConv = existingConvs?.find(conv => {
    const participantIds = conv.conversation_participants.map(p => p.user_id)
    return participantIds.length === 2 &&
           participantIds.includes(user.id) &&
           participantIds.includes(otherUserId)
  })

  if (existingConv) {
    return existingConv
  }

  // Create new 1:1 conversation
  return createConversation(projectId, [otherUserId], null, false)
}

// Get project team members (for starting new conversations)
export async function getProjectTeamMembers(projectId) {
  // For now, get all active profiles
  // Later this could be filtered to project-specific team members
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, full_name, avatar_url, job_title')
    .eq('status', 'active')
    .neq('id', user.id)
    .order('full_name')

  if (error) throw error
  return data || []
}
