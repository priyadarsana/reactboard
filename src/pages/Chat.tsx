import { useState, useEffect, useRef } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  user_name?: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel('chat_messages_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        fetchMessages();
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_messages'
      }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(messagesData.map((m: any) => m.author_id))] as string[];

      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      // Map user names
      const userNames: Record<string, string> = {};
      profilesData?.forEach((profile: any) => {
        userNames[profile.user_id] = profile.name || profile.email || 'Anonymous';
      });

      // Add fallback for users without profiles
      userIds.forEach(userId => {
        if (!userNames[userId]) {
          userNames[userId] = `User ${userId.substring(0, 8)}`;
        }
      });

      // Enrich messages with user names
      const enrichedMessages = messagesData.map((msg: any) => ({
        ...msg,
        user_name: userNames[msg.author_id] || 'Anonymous'
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

const sendMessage = async () => {
  if (!newMessage.trim()) {
    toast.error('Please enter a message');
    return;
  }

  if (!currentUserId) {
    toast.error('Please log in to send messages');
    return;
  }

  setSending(true);

  try {
    // Use the general channel we just created
    const generalChannelId = '00000000-0000-0000-0000-000000000001';

    const { error } = await (supabase
      .from('chat_messages') as any)
      .insert({
        author_id: currentUserId,
        body: newMessage.trim(),
        channel_id: generalChannelId
      });

    if (error) throw error;

    setNewMessage('');
  } catch (error: any) {
    console.error('Error sending message:', error);
    toast.error('Failed to send message');
  } finally {
    setSending(false);
  }
};


  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            title="Back to Home"
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">General Chat</h1>
            <p className="text-sm text-gray-500">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto bg-white shadow-lg my-4 rounded-lg overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg font-semibold mb-2">No messages yet</p>
              <p className="text-sm">Be the first to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.author_id === currentUserId;
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 shadow-sm relative ${
                      isCurrentUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className={`text-xs font-semibold ${isCurrentUser ? 'text-blue-100' : 'text-gray-600'}`}>
                        {isCurrentUser ? 'You' : msg.user_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {isCurrentUser && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                              isCurrentUser ? 'hover:text-red-200' : 'hover:text-red-500'
                            }`}
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.body}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {currentUserId ? (
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={handleKeyPress}
                disabled={sending}
                maxLength={500}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={sending || !newMessage.trim()}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-semibold">
                🔒 Please log in to send messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
