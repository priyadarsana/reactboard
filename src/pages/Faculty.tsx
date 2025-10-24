import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Users, MapPin, CheckCircle, XCircle, Edit2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UpdateStatusDialog } from '@/components/faculty/UpdateStatusDialog';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  subjects: string | null;
  role: string;
  cabin_number: string | null;
  is_in_cabin: boolean;
  is_on_campus: boolean;
}

const Faculty = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [filteredFaculty, setFilteredFaculty] = useState<Faculty[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserFaculty, setCurrentUserFaculty] = useState<Faculty | null>(null);
  const [userRole, setUserRole] = useState<string>('student');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserEmail) {
      fetchFaculty();
    }
  }, [currentUserEmail]);

  useEffect(() => {
    const channel = supabase
      .channel('faculty_members_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'faculty_members'
      }, () => {
        fetchFaculty();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Filter faculty based on search query
    if (searchQuery.trim() === '') {
      setFilteredFaculty(faculty);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = faculty.filter(member => 
        member.name.toLowerCase().includes(query) ||
        member.subjects?.toLowerCase().includes(query) ||
        member.cabin_number?.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
      );
      setFilteredFaculty(filtered);
    }
  }, [searchQuery, faculty]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.id) {
      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role, email')
        .eq('user_id', user.id)
        .single();

      setUserRole(profile?.role || 'student');
      setCurrentUserEmail(profile?.email || null);
    }
  };

  const fetchFaculty = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('faculty_members')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setFaculty(data || []);
      setFilteredFaculty(data || []);
      
      // Find current user's faculty record
      if (currentUserEmail) {
        const myFaculty = data?.find((f: Faculty) => f.email === currentUserEmail);
        setCurrentUserFaculty(myFaculty || null);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  const quickToggleStatus = async (field: 'is_on_campus' | 'is_in_cabin', value: boolean) => {
    if (!currentUserFaculty) return;
    
    setUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('faculty_members')
        .update({
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUserFaculty.id);

      if (error) throw error;

      toast.success('Status updated successfully!');
      fetchFaculty();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditStatus = (facultyMember: Faculty) => {
    setSelectedFaculty(facultyMember);
    setShowUpdateDialog(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'dean': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'assistant_dean': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'hod': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'faculty': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const canEditStatus = ['faculty', 'hod', 'assistant_dean', 'dean'].includes(userRole);

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
              title="Back to Home"
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Faculty Status</h1>
              <p className="text-sm text-gray-500">
                {filteredFaculty.length} of {faculty.length} {faculty.length === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by name, subject, cabin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Status Toggle - Only for faculty/HOD/Dean */}
      {canEditStatus && currentUserFaculty && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Quick Status Update - {currentUserFaculty.name}
                </h3>
                <p className="text-xs text-gray-600">
                  Update your availability status quickly
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* On Campus Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">On Campus:</span>
                  <Button
                    onClick={() => quickToggleStatus('is_on_campus', !currentUserFaculty.is_on_campus)}
                    disabled={updating}
                    size="sm"
                    className={`${
                      currentUserFaculty.is_on_campus 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {currentUserFaculty.is_on_campus ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Yes
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        No
                      </>
                    )}
                  </Button>
                </div>

                {/* In Cabin Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">In Cabin:</span>
                  <Button
                    onClick={() => quickToggleStatus('is_in_cabin', !currentUserFaculty.is_in_cabin)}
                    disabled={updating}
                    size="sm"
                    className={`${
                      currentUserFaculty.is_in_cabin 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {currentUserFaculty.is_in_cabin ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Available
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Unavailable
                      </>
                    )}
                  </Button>
                </div>

                {/* Edit Full Details Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditStatus(currentUserFaculty)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading faculty...</p>
          </div>
        ) : filteredFaculty.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? 'No faculty members found matching your search' : 'No faculty members found'}
            </p>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFaculty.map((member) => {
              const isCurrentUser = member.email === currentUserEmail;
              
              return (
                <div
                  key={member.id}
                  className={`bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow ${
                    isCurrentUser ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(member.role)}`}>
                      {member.role.toUpperCase().replace('_', ' ')}
                    </span>
                    {isCurrentUser && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        YOU
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">{member.department}</p>
                  <p className="text-xs text-gray-600 mb-3 italic">{member.subjects || 'No subjects listed'}</p>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        Cabin: <span className="font-semibold">{member.cabin_number || 'Not set'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">On Campus:</span>
                      {member.is_on_campus ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          No
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">In Cabin:</span>
                      {member.is_in_cabin ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Available
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-600 text-sm font-medium">
                          <XCircle className="w-4 h-4" />
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedFaculty && (
        <UpdateStatusDialog
          open={showUpdateDialog}
          onClose={() => {
            setShowUpdateDialog(false);
            setSelectedFaculty(null);
          }}
          faculty={selectedFaculty}
          onSuccess={() => {
            setShowUpdateDialog(false);
            setSelectedFaculty(null);
            fetchFaculty();
          }}
        />
      )}
    </div>
  );
};

export default Faculty;
