import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

interface Query {
  id: string;
  student_id: string;
  student_name: string;
  student_vtu: string;
  subject: string;
  category: string;
  status: string;
}

interface Message {
  id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface ChatDialogProps {
  open: boolean;
  onClose: () => void;
  query: Query;
  userRole: string;
  onUpdate: () => void;
}

export const ChatDialog = ({ open, onClose, query, userRole, onUpdate }: ChatDialogProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryStatus, setQueryStatus] = useState(query.status);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<any>(null);
  
  const isStaff = ['faculty', 'hod', 'assistant_dean', 'dean'].includes(userRole);
  const isQueryOwner = currentUserId === query.student_id;
  const canReply = isStaff || (userRole === 'student' && isQueryOwner);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (open && query.id) {
      fetchMessages();
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [open, query.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('query_messages')
        .select('*')
        .eq('query_id', query.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages((prevMessages) => {
        // Only update if there's a real change to avoid unnecessary re-renders
        if (JSON.stringify(prevMessages) !== JSON.stringify(data || [])) {
          return data || [];
        }
        return prevMessages;
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const startPolling = () => {
    // Poll every 2 seconds for new messages
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in');
        setNewMessage(messageText);
        setIsSubmitting(false);
        return;
      }

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('name, role')
        .eq('user_id', user.id)
        .single();

      // Create optimistic message
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        sender_name: profile?.name || 'Unknown',
        sender_role: profile?.role || 'student',
        message: messageText,
        created_at: new Date().toISOString()
      };

      // Add to UI immediately
      setMessages((current) => [...current, optimisticMessage]);

      // Send to database
      const { data, error } = await (supabase as any)
        .from('query_messages')
        .insert({
          query_id: query.id,
          sender_id: user.id,
          sender_name: profile?.name || 'Unknown',
          sender_role: profile?.role || 'student',
          message: messageText
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one from database
      if (data) {
        setMessages((current) =>
          current.map((msg) => (msg.id === tempId ? data : msg))
        );
      }

      // Fetch messages immediately after sending to ensure sync
      setTimeout(() => fetchMessages(), 500);
      
      // If staff replies, auto-update status to answered
      if (isStaff && queryStatus === 'open') {
        await updateQueryStatus('answered');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove optimistic message on error
      setMessages((current) =>
        current.filter((msg) => !msg.id.toString().startsWith('temp-'))
      );
      
      // Restore the message text
      setNewMessage(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQueryStatus = async (newStatus: string) => {
    try {
      const { error } = await (supabase as any)
        .from('queries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', query.id);

      if (error) throw error;

      setQueryStatus(newStatus);
      toast.success(`Query status updated to ${newStatus}`);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        stopPolling();
        onClose();
      }
    }}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">{query.subject}</div>
              <div className="text-sm text-gray-500 font-normal">
                {query.student_name} ({query.student_vtu})
              </div>
            </div>
            {isStaff && (
              <Select value={queryStatus} onValueChange={updateQueryStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isSender = message.sender_role === userRole;
              const isStaffMessage = ['faculty', 'hod', 'assistant_dean', 'dean'].includes(message.sender_role);
              const isTemp = message.id.toString().startsWith('temp-');

              return (
                <div
                  key={message.id}
                  className={`flex ${isSender ? 'justify-end' : 'justify-start'} ${isTemp ? 'opacity-70' : ''}`}
                >
                  <div className="max-w-[70%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isStaffMessage ? 'text-blue-600' : 'text-gray-600'}`}>
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(message.created_at).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {isTemp && <span className="text-xs text-orange-500">Sending...</span>}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        isSender
                          ? 'bg-blue-600 text-white'
                          : isStaffMessage
                          ? 'bg-green-100 text-gray-900'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {canReply ? (
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSubmitting}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSubmitting || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        ) : (
          <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600 font-medium">
              📖 You are viewing this conversation in read-only mode
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Only the query owner and faculty can reply to this conversation
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
