import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardCounts {
  lostAndFound: number;
  announcements: number;
  queries: number;
  odRequests: number;
  generalChat: number;
}

export const useDashboardCounts = () => {
  const [counts, setCounts] = useState<DashboardCounts>({
    lostAndFound: 0,
    announcements: 0,
    queries: 0,
    odRequests: 0,
    generalChat: 0
  });
  const [userRole, setUserRole] = useState<string>('student');

  useEffect(() => {
    fetchCounts();
    
    // Poll every 15 seconds
    const interval = setInterval(fetchCounts, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = profile?.role || 'student';
      setUserRole(role);

      const newCounts: DashboardCounts = {
        lostAndFound: 0,
        announcements: 0,
        queries: 0,
        odRequests: 0,
        generalChat: 0
      };

      // 1. Announcements - unread count
      try {
        const { count: announcementCount } = await (supabase as any)
          .from('announcements')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        newCounts.announcements = announcementCount || 0;
      } catch (error) {
        newCounts.announcements = 0;
      }

      // 2. Queries - different logic based on role
      try {
        if (role === 'student') {
          const { count: queryCount } = await (supabase as any)
            .from('queries')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', user.id)
            .eq('status', 'open');

          newCounts.queries = queryCount || 0;
        } else {
          const { count: queryCount } = await (supabase as any)
            .from('queries')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

          newCounts.queries = queryCount || 0;
        }
      } catch (error) {
        newCounts.queries = 0;
      }

      // 3. OD Requests - based on role
      try {
        if (role === 'student') {
          const { count: odCount } = await (supabase as any)
            .from('od_requests')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id)
            .in('final_status', ['pending', 'on_hold']);

          newCounts.odRequests = odCount || 0;
        } else if (role === 'hod' || role === 'assistant_dean') {
          const { count: odCount } = await (supabase as any)
            .from('od_requests')
            .select('*', { count: 'exact', head: true })
            .eq('hod_status', 'pending');

          newCounts.odRequests = odCount || 0;
        } else if (role === 'dean') {
          const { count: odCount } = await (supabase as any)
            .from('od_requests')
            .select('*', { count: 'exact', head: true })
            .eq('hod_status', 'approved')
            .eq('dean_status', 'pending');

          newCounts.odRequests = odCount || 0;
        }
      } catch (error) {
        newCounts.odRequests = 0;
      }

      // 4. General Chat - unread messages
      try {
        const { count: chatCount } = await (supabase as any)
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .neq('sender_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        newCounts.generalChat = chatCount || 0;
      } catch (error) {
        newCounts.generalChat = 0;
      }

      // 5. Lost & Found - recent items (last 7 days)
      try {
        const { count: lostFoundCount } = await (supabase as any)
          .from('lost_and_found')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        newCounts.lostAndFound = lostFoundCount || 0;
      } catch (error) {
        newCounts.lostAndFound = 0;
      }

      setCounts(newCounts);
    } catch (error) {
      console.error('Error fetching dashboard counts:', error);
    }
  };

  return { counts, userRole, refreshCounts: fetchCounts };
};
