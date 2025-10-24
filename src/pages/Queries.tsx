import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, MessageSquare, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateQueryDialog } from '@/components/queries/CreateQueryDialog';
import { QueryCard } from '@/components/queries/QueryCard';
import { ChatDialog } from '@/components/queries/ChatDialog';

interface Query {
  id: string;
  student_id: string;
  student_name: string;
  student_vtu: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Queries = () => {
  const navigate = useNavigate();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('student');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getCurrentUser();
    fetchQueries();

    const channel = supabase
      .channel('queries_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queries'
      }, () => {
        fetchQueries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.id) {
      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role')
        .eq('user_id', user.id)
        .single();

      setUserRole(profile?.role || 'student');
    }
  };

  const fetchQueries = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQueries(data || []);
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredQueries = () => {
    if (!searchQuery.trim()) return queries;
    
    const query = searchQuery.toLowerCase();
    return queries.filter(q => 
      q.student_name.toLowerCase().includes(query) ||
      q.student_vtu.toLowerCase().includes(query) ||
      q.subject.toLowerCase().includes(query) ||
      q.category.toLowerCase().includes(query)
    );
  };

  const handleOpenChat = (query: Query) => {
    setSelectedQuery(query);
    setShowChatDialog(true);
  };

  const canCreateQuery = userRole === 'student';
  const canSearch = ['faculty', 'hod', 'assistant_dean', 'dean'].includes(userRole);

  const filteredQueries = getFilteredQueries();
  const openCount = filteredQueries.filter(q => q.status === 'open').length;
  const answeredCount = filteredQueries.filter(q => q.status === 'answered').length;
  const closedCount = filteredQueries.filter(q => q.status === 'closed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Queries</h1>
              <p className="text-sm text-gray-500">
                {filteredQueries.length} {searchQuery ? 'matching' : 'total'} queries
              </p>
            </div>
          </div>

          {canCreateQuery && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ask Query
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar - Only for Faculty/HOD/Dean */}
      {canSearch && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by student name, VTU, subject, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="bg-gray-100 border-b border-gray-200 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm font-medium text-gray-700">
              Open: <span className="text-yellow-600">{openCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-700">
              Answered: <span className="text-green-600">{answeredCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-sm font-medium text-gray-700">
              Closed: <span className="text-gray-600">{closedCount}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading queries...</p>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? 'No queries found matching your search' : 'No queries yet'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : canCreateQuery ? 'Ask your first question' : 'No queries to display'}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')} variant="outline" className="mb-2">
                Clear Search
              </Button>
            )}
            {!searchQuery && canCreateQuery && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Ask Query
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredQueries.map((query) => (
              <QueryCard
                key={query.id}
                query={query}
                userRole={userRole}
                onOpenChat={handleOpenChat}
              />
            ))}
          </div>
        )}
      </div>

      <CreateQueryDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={() => {
          setShowCreateDialog(false);
          fetchQueries();
        }}
      />

      {selectedQuery && (
        <ChatDialog
          open={showChatDialog}
          onClose={() => {
            setShowChatDialog(false);
            setSelectedQuery(null);
          }}
          query={selectedQuery}
          userRole={userRole}
          onUpdate={fetchQueries}
        />
      )}
    </div>
  );
};

export default Queries;
