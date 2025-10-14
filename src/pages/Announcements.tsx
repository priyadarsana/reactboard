import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Pin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        profiles:created_by(name)
      `)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load announcements');
      return;
    }

    setAnnouncements(data || []);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      events: 'bg-primary',
      holidays: 'bg-success',
      exams: 'bg-warning',
      maintenance: 'bg-destructive'
    };
    return colors[category] || 'bg-muted';
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container py-8 px-4">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Announcements</h2>
          <p className="text-muted-foreground">
            Important updates and notices
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {announcements.map((announcement) => (
            <Card 
              key={announcement.id}
              className={announcement.pinned ? 'border-2 border-primary shadow-lg' : ''}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getCategoryColor(announcement.category)} variant="secondary">
                    {announcement.category}
                  </Badge>
                  {announcement.pinned && (
                    <Badge variant="default" className="gap-1">
                      <Pin className="w-3 h-3" />
                      Pinned
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{announcement.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(announcement.created_at).toLocaleDateString()}
                  {announcement.schedule_at && ` • Scheduled for ${new Date(announcement.schedule_at).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.body}</p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Posted by {announcement.profiles?.name}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Announcements;