import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Users, Clock, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';

const Faculty = () => {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    const { data, error } = await supabase
      .from('faculty_status')
      .select(`
        *,
        profiles:faculty_id(name, email)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Failed to load faculty status');
      return;
    }

    setFaculty(data || []);
  };

  const getStateColor = (state: string) => {
    const colors: Record<string, string> = {
      present: 'bg-success',
      absent: 'bg-muted',
      on_leave: 'bg-warning'
    };
    return colors[state] || 'bg-muted';
  };

  const filteredFaculty = faculty.filter(f =>
    f.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container py-8 px-4">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Faculty Status</h2>
          <p className="text-muted-foreground">
            Check faculty availability and presence
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFaculty.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Users className="w-6 h-6 text-muted-foreground" />
                  <Badge className={getStateColor(member.state)} variant="secondary">
                    {member.state.replace('_', ' ')}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{member.profiles?.name}</CardTitle>
                <CardDescription>{member.profiles?.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {member.office_hours && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{member.office_hours}</span>
                    </div>
                  )}
                  {member.room && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>Room {member.room}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(member.updated_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredFaculty.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No faculty found matching your search
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Faculty;