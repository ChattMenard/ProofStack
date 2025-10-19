import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNewMessageEmail } from '@/lib/email/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { conversation_id, sender_id, content } = await req.json();

    if (!conversation_id || !sender_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id,
        content: content.trim(),
        is_read: false
      })
      .select()
      .single();

    if (messageError || !message) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Failed to create message' },
        { status: 500 }
      );
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation_id);

    // Get sender and recipient info for email notification
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        profiles!user_id (
          id,
          username,
          email,
          full_name
        )
      `)
      .eq('conversation_id', conversation_id);

    if (participants && participants.length === 2) {
      const sender = participants.find((p: any) => p.user_id === sender_id);
      const recipient = participants.find((p: any) => p.user_id !== sender_id);

      if (sender && recipient && recipient.profiles) {
        const senderName = (sender.profiles as any)?.full_name || (sender.profiles as any)?.username || 'Someone';
        const recipientName = (recipient.profiles as any)?.full_name || (recipient.profiles as any)?.username || 'User';
        const recipientEmail = (recipient.profiles as any)?.email;

        if (recipientEmail) {
          // Send email notification (fire and forget - don't block message sending)
          const messagePreview = content.length > 100 
            ? content.substring(0, 100) + '...' 
            : content;

          sendNewMessageEmail(recipientEmail, {
            recipientName,
            senderName,
            messagePreview,
            conversationId: conversation_id
          }).catch(err => {
            console.error('Failed to send message notification email:', err);
            // Don't fail the message if email fails
          });
        }
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Message API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
