'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Conversation {
  id: string;
  subject?: string;
  last_message_at: string;
  participants: {
    user_id: string;
    username: string;
    last_read_at?: string;
  }[];
  last_message?: {
    content: string;
    sender_id: string;
  };
  unread_count: number;
}

interface ConversationListProps {
  currentUserId: string;
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string, recipientName: string) => void;
}

export default function ConversationList({ 
  currentUserId, 
  selectedConversationId, 
  onSelectConversation 
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
    subscribeToConversations();
  }, [currentUserId]);

  const loadConversations = async () => {
    try {
      // Get conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (participantError) throw participantError;

      const conversationIds = participantData.map((p: any) => p.conversation_id);

      if (conversationIds.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get conversation details
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          subject,
          last_message_at,
          conversation_participants!inner (
            user_id,
            last_read_at
          )
        `)
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Get participant profiles
      const enrichedConversations = await Promise.all(
        conversationsData.map(async (conv: any) => {
          // Get other participants (not current user)
          const otherParticipants = conv.conversation_participants.filter(
            (p: any) => p.user_id !== currentUserId
          );

          const participantIds = otherParticipants.map((p: any) => p.user_id);

          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', participantIds);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Count unread messages
          const currentParticipant = conv.conversation_participants.find(
            (p: any) => p.user_id === currentUserId
          );
          
          let unreadCount = 0;
          if (currentParticipant?.last_read_at) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', currentUserId)
              .gt('created_at', currentParticipant.last_read_at);
            unreadCount = count || 0;
          } else {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', currentUserId);
            unreadCount = count || 0;
          }

          return {
            id: conv.id,
            subject: conv.subject,
            last_message_at: conv.last_message_at,
            participants: profiles?.map((p: any) => ({
              user_id: p.id,
              username: p.username
            })) || [],
            last_message: lastMessage,
            unread_count: unreadCount
          };
        })
      );

      setConversations(enrichedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          loadConversations();
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
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p =>
      p.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            {!searchQuery && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Start a conversation from the Discover page
              </p>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const recipientName = conversation.participants[0]?.username || 'Unknown';
            const isSelected = conversation.id === selectedConversationId;

            return (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id, recipientName)}
                className={`w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {recipientName[0]?.toUpperCase() || '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold truncate ${
                        conversation.unread_count > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {recipientName}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${
                        conversation.unread_count > 0 
                          ? 'text-gray-900 dark:text-white font-medium' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {conversation.last_message?.sender_id === currentUserId && 'You: '}
                        {conversation.last_message?.content || 'No messages yet'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
