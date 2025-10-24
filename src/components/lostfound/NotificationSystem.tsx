import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const NotificationSystem = ({ userId }: { userId: string }) => {
  useEffect(() => {
    // Subscribe to notifications for this user
    const subscription = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const notification = payload.new;
        
        if (notification.type === 'pin_vote') {
          toast.info('Someone voted on a pin location for your item!');
        } else if (notification.type === 'pin_added') {
          toast.info('Someone suggested a location for your item!');
        } else if (notification.type === 'pin_comment') {
          toast.info('New comment on your lost item');
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return null;
};
