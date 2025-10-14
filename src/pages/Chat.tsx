import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Send, Hash } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const Chat = () => {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchChannels();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      subscribeToMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchChannels = async () => {
    const { data, error } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('type', 'general')
      .order('created_at');

    if (error) {
      toast.error('Failed to load channels');
      return;
    }

    setChannels(data || []);
    if (data && data.length > 0 && !selectedChannel) {
      setSelectedChannel(data[0]);
    }
  };

  const fetchMessages = async (channelId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        profiles:author_id(name)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load messages');
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = (channelId: string) => {
    const subscription = supabase
      .channel(`chat-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', payload.new.author_id)
            .single();

          setMessages((prev) => [...prev, { ...payload.new, profiles: profile }]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: selectedChannel.id,
        author_id: userId,
        body: newMessage,
        attachments: [],
        flags: []
      });

    if (error) {
      toast.error('Failed to send message');
      return;
    }

    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container py-8 px-4">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">General Chat</h2>
          <p className="text-muted-foreground">
            Connect with students and find faculty
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="md:col-span-1">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Channels</h3>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <Button
                    key={channel.id}
                    variant={selectedChannel?.id === channel.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <Hash className="w-4 h-4 mr-2" />
                    {channel.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardContent className="p-0">
              <div className="border-b p-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold">{selectedChannel?.name}</h3>
                </div>
              </div>

              <ScrollArea className="h-[500px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {message.profiles?.name || 'Unknown'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Chat;