import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, FileText, CheckCircle, XCircle, AlertCircle, Clock, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateODDialog } from '@/components/od/CreateODDialog';
import { ODCard } from '@/components/od/ODCard';
import { ApprovalDialog } from '@/components/od/ApprovalDialog';

interface Student {
  name: string;
  vtu_number: string;
}

interface ODRequest {
  id: string;
  created_by_name: string;
  created_by_vtu: string;
  students: Student[];
  reason: string;
  from_date: string;
  to_date: string;
  from_time: string | null;
  to_time: string | null;
  total_days: number;
  letter_url: string | null;
  proof_url: string | null;
  hod_status: string;
  dean_status: string;
  final_status: string;
  hod_remarks: string | null;
  dean_remarks: string | null;
  created_at: string;
}

const ODRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ODRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('student');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);
  const [approvalType, setApprovalType] = useState<'hod' | 'dean'>('hod');
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getCurrentUser();
    fetchRequests();

    const channel = supabase
      .channel('od_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'od_requests'
      }, () => {
        fetchRequests();
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

  const fetchRequests = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('od_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching OD requests:', error);
      toast.error('Failed to load OD requests');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequests = () => {
    if (!searchQuery.trim()) return requests;
    
    const query = searchQuery.toLowerCase();
    return requests.filter(request => {
      // Search in creator name/VTU
      const matchesCreator = 
        request.created_by_name.toLowerCase().includes(query) ||
        request.created_by_vtu.toLowerCase().includes(query);
      
      // Search in all students in the request
      const matchesStudents = Array.isArray(request.students) && 
        request.students.some(student => 
          student.name.toLowerCase().includes(query) ||
          student.vtu_number.toLowerCase().includes(query)
        );
      
      return matchesCreator || matchesStudents;
    });
  };

  const handleApprove = (request: ODRequest, type: 'hod' | 'dean') => {
    setSelectedRequest(request);
    setApprovalType(type);
    setShowApprovalDialog(true);
  };

  const handleEdit = (request: ODRequest) => {
    setSelectedRequest(request);
    setIsEditMode(true);
    setShowCreateDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'on_hold': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      case 'on_hold': return <Clock className="w-5 h-5" />;
      case 'pending': return <AlertCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const canCreateOD = userRole === 'student';
  const canSearch = ['faculty', 'hod', 'assistant_dean', 'dean'].includes(userRole);

  // Filter stats
  const filteredRequests = getFilteredRequests();
  const pendingCount = filteredRequests.filter(r => r.final_status === 'pending').length;
  const approvedCount = filteredRequests.filter(r => r.final_status === 'approved').length;
  const rejectedCount = filteredRequests.filter(r => r.final_status === 'rejected').length;
  const onHoldCount = filteredRequests.filter(r => r.final_status === 'on_hold').length;

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
              <h1 className="text-2xl font-bold text-gray-900">OD Requests</h1>
              <p className="text-sm text-gray-500">
                {filteredRequests.length} {searchQuery ? 'matching' : 'total'} requests
              </p>
            </div>
          </div>

          {canCreateOD && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setIsEditMode(false);
                setSelectedRequest(null);
                setShowCreateDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New OD Request
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
                placeholder="Search by student name or VTU number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-700">
              Pending: <span className="text-yellow-600">{pendingCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">
              On Hold: <span className="text-orange-600">{onHoldCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              Approved: <span className="text-green-600">{approvedCount}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-gray-700">
              Rejected: <span className="text-red-600">{rejectedCount}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading OD requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">
              {searchQuery ? 'No OD requests found matching your search' : 'No OD requests yet'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : canCreateOD ? 'Create your first OD request' : 'No requests to display'}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')} variant="outline" className="mb-2">
                Clear Search
              </Button>
            )}
            {!searchQuery && canCreateOD && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Create OD Request
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <ODCard
                key={request.id}
                request={request}
                userRole={userRole}
                onApprove={handleApprove}
                onEdit={handleEdit}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        )}
      </div>

      <CreateODDialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setIsEditMode(false);
          setSelectedRequest(null);
        }}
        onSuccess={() => {
          setShowCreateDialog(false);
          setIsEditMode(false);
          setSelectedRequest(null);
          fetchRequests();
        }}
        editMode={isEditMode}
        existingRequest={selectedRequest}
      />

      {selectedRequest && showApprovalDialog && (
        <ApprovalDialog
          open={showApprovalDialog}
          onClose={() => {
            setShowApprovalDialog(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          approvalType={approvalType}
          onSuccess={() => {
            setShowApprovalDialog(false);
            setSelectedRequest(null);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
};

export default ODRequests;
