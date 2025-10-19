'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ConversationList from '@/components/messages/ConversationList';
import MessageThread from '@/components/messages/MessageThread';
import { useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string>('');
  const [showList, setShowList] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      // Check for conversation parameter
      const conversationParam = searchParams?.get('conversation');
      if (conversationParam) {
        // Load recipient name for this conversation
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id, profiles!user_id(username)')
          .eq('conversation_id', conversationParam)
          .neq('user_id', user.id);
        
        if (participants && participants.length > 0) {
          const recipient = participants[0] as any;
          setSelectedConversationId(conversationParam);
          setRecipientName(recipient.profiles?.username || 'User');
          setShowList(false); // Show thread on mobile
        }
      }
    }
  };

  const handleSelectConversation = (conversationId: string, name: string) => {
    setSelectedConversationId(conversationId);
    setRecipientName(name);
    setShowList(false); // Hide list on mobile when conversation is selected
  };

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-50 dark:bg-gray-900">
      {/* Conversation List */}
      <div className={`${showList ? 'block' : 'hidden'} md:block w-full md:w-96 border-r border-gray-200 dark:border-gray-700`}>
        <ConversationList
          currentUserId={currentUserId}
          selectedConversationId={selectedConversationId || undefined}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Message Thread */}
      <div className={`${showList ? 'hidden' : 'block'} md:block flex-1`}>
        {selectedConversationId ? (
          <div className="h-full flex flex-col">
            {/* Mobile back button */}
            <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <button
                onClick={() => setShowList(true)}
                className="flex items-center text-blue-600 dark:text-blue-400"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to conversations
              </button>
            </div>
            
            <MessageThread
              conversationId={selectedConversationId}
              currentUserId={currentUserId}
              recipientName={recipientName}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center px-4">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Select a conversation
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
