import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Megaphone, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateAnnouncementDialog } from '@/components/announcements/CreateAnnouncementDialog';

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  created_by: string;
  created_at: string;
  author_name?: string;
  author_role?: string;
}

const Announcements = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('student');

  useEffect(() => {
    getCurrentUser();
    fetchAnnouncements();

    // Real-time subscription
    const channel = supabase
      .channel('announcements_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'announcements'
      }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    if (user?.id) {
      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('user_id', user.id)
        .single();

      setUserRole(profile?.role || 'student');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data: announcementsData, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!announcementsData || announcementsData.length === 0) {
        setAnnouncements([]);
        setLoading(false);
        return;
      }

      // Get unique author IDs
      const authorIds = [...new Set(announcementsData.map((a: any) => a.created_by))] as string[];

      // Fetch author profiles
      const { data: profilesData } = await (supabase
        .from('profiles') as any)
        .select('user_id, name, email, role')
        .in('user_id', authorIds);

      // Map author info
      const authorInfo: Record<string, { name: string; role: string }> = {};
      profilesData?.forEach((profile: any) => {
        authorInfo[profile.user_id] = {
          name: profile.name || profile.email || 'Anonymous',
          role: profile.role || 'faculty'
        };
      });

      // Enrich announcements with author info
      const enrichedAnnouncements = announcementsData.map((ann: any) => ({
        ...ann,
        author_name: authorInfo[ann.created_by]?.name || 'Unknown',
        author_role: authorInfo[ann.created_by]?.role || 'faculty'
      }));

      setAnnouncements(enrichedAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Announcement deleted');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'exams': return 'bg-red-100 text-red-800 border-red-300';
      case 'events': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'holidays': return 'bg-green-100 text-green-800 border-green-300';
      case 'maintenance': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'dean': return 'bg-purple-100 text-purple-800';
      case 'hod': return 'bg-indigo-100 text-indigo-800';
      case 'faculty': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canPostAnnouncement = ['faculty', 'hod', 'dean'].includes(userRole);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
              <p className="text-sm text-gray-500">
                {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}
              </p>
            </div>
          </div>

          {canPostAnnouncement && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Announcements List */}
      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Megaphone className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">No announcements yet</p>
            <p className="text-sm text-gray-500">
              {canPostAnnouncement 
                ? 'Be the first to post an announcement!' 
                : 'Check back later for updates'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const isAuthor = announcement.created_by === currentUserId;
              
              return (
                <div
                  key={announcement.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(announcement.category)}`}>
                        {announcement.category.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(announcement.author_role)}`}>
                        {announcement.author_role?.toUpperCase()}
                      </span>
                    </div>
                    
                    {isAuthor && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAnnouncement(announcement.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {announcement.title}
                  </h2>

                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {announcement.body}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                    <span className="font-medium">
                      Posted by {announcement.author_name}
                    </span>
                    <span>
                      {new Date(announcement.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Announcement Dialog */}
      <CreateAnnouncementDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          fetchAnnouncements();
        }}
      />
    </div>
  );
};

export default Announcements;
