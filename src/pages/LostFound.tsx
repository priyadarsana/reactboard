import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MapPin, List, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { IndoorMap } from '@/components/IndoorMap';

const LostFound = () => {
  const [items, setItems] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('lost_items')
      .select(`
        *,
        profiles:reporter_id(name),
        pins(
          *,
          votes(vote_type)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load items');
      return;
    }

    setItems(data || []);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      electronics: 'bg-primary',
      books: 'bg-accent',
      accessories: 'bg-success',
      clothing: 'bg-warning',
      id_cards: 'bg-destructive',
      other: 'bg-muted'
    };
    return colors[category] || 'bg-muted';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'default',
      matched: 'secondary',
      returned: 'outline'
    };
    return colors[status] || 'default';
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Lost & Found</h2>
            <p className="text-muted-foreground">
              Help find lost items in the CSE department
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('map')}
            >
              <MapPin className="w-4 h-4" />
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent">
              <Plus className="w-4 h-4 mr-2" />
              Report Item
            </Button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const tickVotes = item.pins?.flatMap((p: any) => p.votes?.filter((v: any) => v.vote_type === 'tick')).length || 0;
              const crossVotes = item.pins?.flatMap((p: any) => p.votes?.filter((v: any) => v.vote_type === 'cross')).length || 0;

              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getCategoryColor(item.category)} variant="secondary">
                        {item.category}
                      </Badge>
                      <Badge variant={getStatusColor(item.status) as any}>
                        {item.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1 text-success">
                          <ThumbsUp className="w-4 h-4" />
                          <span>{tickVotes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-destructive">
                          <ThumbsDown className="w-4 h-4" />
                          <span>{crossVotes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{item.pins?.length || 0}</span>
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {item.pins?.length || 0} pins
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <IndoorMap items={items} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default LostFound;
