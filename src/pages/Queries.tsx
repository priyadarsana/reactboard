import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ThumbsUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const Queries = () => {
  const [queries, setQueries] = useState<any[]>([]);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    const { data, error } = await supabase
      .from('queries')
      .select(`
        *,
        profiles:author_id(name),
        query_replies(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load queries');
      return;
    }

    setQueries(data || []);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'default',
      answered: 'secondary',
      closed: 'outline'
    };
    return colors[status] || 'default';
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Queries</h2>
            <p className="text-muted-foreground">
              Ask questions and get verified answers
            </p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-accent">
            <Plus className="w-4 h-4 mr-2" />
            Ask Question
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {queries.map((query) => (
            <Card key={query.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2 flex-wrap">
                    {query.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Badge variant={getStatusColor(query.status) as any}>
                    {query.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{query.title}</CardTitle>
                <CardDescription>
                  by {query.profiles?.name} • {new Date(query.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 line-clamp-3">{query.body}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>0 upvotes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{query.query_replies?.[0]?.count || 0} answers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Queries;