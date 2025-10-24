import { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PinChatProps {
  pinId: string;
  userId: string | null;
}

interface Comment {
  id: string;
  pin_id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_name?: string;
}

export const PinChat = ({ pinId, userId }: PinChatProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchComments();
    
    // Real-time subscription
    const channel = supabase
      .channel(`pin_comments_${pinId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'pin_comments',
        filter: `pin_id=eq.${pinId}`
      }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pinId]);

  const fetchComments = async () => {
    setFetching(true);
    
    try {
      // Fetch comments
      const { data: commentsData, error: commentsError } = await (supabase as any)
        .from('pin_comments')
        .select('*')
        .eq('pin_id', pinId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Fetch comments error:', commentsError);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map((c: any) => c.user_id))] as string[];

      // Fetch profiles for these users - FIXED: use user_id column
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', userIds);

      // Create a map of user_id to name - FIXED: use profile.user_id
      const userNames: Record<string, string> = {};
      
      if (profilesData && profilesData.length > 0) {
        profilesData.forEach((profile: any) => {
          userNames[profile.user_id] = profile.name || profile.email || 'User';
        });
      }

      // For users without profiles, use first 8 chars of ID
      userIds.forEach(userId => {
        if (!userNames[userId]) {
          userNames[userId] = `User ${userId.substring(0, 8)}`;
        }
      });

      // Merge comments with user names
      const enrichedComments = commentsData.map((comment: any) => ({
        ...comment,
        user_name: userNames[comment.user_id] || 'Anonymous'
      }));

      setComments(enrichedComments);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setFetching(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!userId) {
      toast.error('Please log in to send messages');
      return;
    }

    setLoading(true);

    try {
      const { error } = await (supabase as any)
        .from('pin_comments')
        .insert({
          pin_id: pinId,
          user_id: userId,
          message: newMessage.trim()
        });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      setNewMessage('');
      toast.success('Comment posted!');
      fetchComments();
    } catch (error: any) {
      console.error('Send error:', error);
      toast.error('Failed to post comment: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-3">
      {/* Comments List */}
      <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
        {fetching ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            💬 No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => {
            const userName = comment.user_name || 'Anonymous';
            const isCurrentUser = comment.user_id === userId;
            
            return (
              <div 
                key={comment.id} 
                className={`rounded-lg p-3 shadow-sm ${
                  isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    isCurrentUser ? 'bg-blue-500' : 'bg-gray-500'
                  }`}>
                    {userName[0]?.toUpperCase()}
                  </div>
                  <p className="text-xs font-semibold text-gray-700">
                    {isCurrentUser ? 'You' : userName}
                  </p>
                  <p className="text-xs text-gray-400 ml-auto">
                    {new Date(comment.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
                <p className="text-sm text-gray-800 break-words">{comment.message}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      {userId ? (
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a comment..."
            onKeyDown={handleKeyPress}
            disabled={loading}
            maxLength={500}
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !newMessage.trim()}
            size="icon"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-2 bg-yellow-50 rounded border border-yellow-200">
          🔒 Please log in to comment
        </p>
      )}
    </div>
  );
};
