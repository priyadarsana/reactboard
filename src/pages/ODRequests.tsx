import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';

const ODRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchRequests();
    }
  }, [userId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('od_requests')
      .select(`
        *,
        applicant:applicant_id(name),
        approver:approver_id(name)
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load OD requests');
      return;
    }

    setRequests(data || []);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning',
      approved: 'bg-success',
      rejected: 'bg-destructive'
    };
    return colors[status] || 'bg-muted';
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">OD Requests</h2>
            <p className="text-muted-foreground">
              Submit and track on-duty requests
            </p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-accent">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                  <Badge className={getStatusColor(request.status)} variant="secondary">
                    {request.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{request.purpose}</CardTitle>
                <CardDescription>
                  Requested on {new Date(request.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  {request.approver && (
                    <div className="text-sm text-muted-foreground">
                      Approver: {request.approver.name}
                    </div>
                  )}
                  {request.status === 'approved' && (
                    <Button variant="outline" size="sm" className="w-full">
                      Download Approval Letter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {requests.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No OD requests yet. Create your first request!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default ODRequests;