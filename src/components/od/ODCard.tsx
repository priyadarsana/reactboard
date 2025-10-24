import { Button } from '@/components/ui/button';
import { Calendar, Clock, FileText, CheckCircle, XCircle, AlertCircle, Users, Edit2 } from 'lucide-react';

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

interface ODCardProps {
  request: ODRequest;
  userRole: string;
  onApprove: (request: ODRequest, type: 'hod' | 'dean') => void;
  onEdit?: (request: ODRequest) => void;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
}

export const ODCard = ({ request, userRole, onApprove, onEdit, getStatusColor, getStatusIcon }: ODCardProps) => {
  const students = Array.isArray(request.students) ? request.students : [];

  const isHOD = ['hod', 'assistant_dean'].includes(userRole);
  const isDean = userRole === 'dean';
  const isStudent = userRole === 'student';
  const canApproveAsHOD = isHOD && request.hod_status === 'pending';
  const canApproveAsDean = isDean && request.hod_status === 'approved' && request.dean_status === 'pending';
  const showApprovalButton = canApproveAsHOD || canApproveAsDean;
  
  const isOnHold = request.final_status === 'on_hold';
  const canEdit = isStudent && isOnHold;

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
      showApprovalButton ? 'border-blue-300 ring-2 ring-blue-100' :
      canEdit ? 'border-orange-300 ring-2 ring-orange-100' :
      'border-gray-200'
    }`}>
      {/* Header with Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{request.created_by_name}</h3>
          <p className="text-sm text-gray-500">{request.created_by_vtu}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${
          request.final_status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
          request.final_status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
          request.final_status === 'on_hold' ? 'bg-orange-100 text-orange-800 border-orange-300' :
          'bg-yellow-100 text-yellow-800 border-yellow-300'
        }`}>
          {request.final_status === 'on_hold' ? <Clock className="w-5 h-5" /> : getStatusIcon(request.final_status)}
          {request.final_status === 'on_hold' ? 'ON HOLD' : request.final_status.toUpperCase().replace('_', ' ')}
        </div>
      </div>

      {/* Edit Button for Student - When On Hold */}
      {canEdit && (
        <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-orange-900 mb-1">
                ⏸️ Request On Hold - Action Required
              </p>
              <p className="text-xs text-orange-700">
                This request needs modifications. Review the remarks below and update your request.
              </p>
            </div>
            <Button
              onClick={() => onEdit && onEdit(request)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6"
              size="lg"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Request
            </Button>
          </div>
        </div>
      )}

      {/* Action Button for HOD/Dean - TOP POSITION */}
      {showApprovalButton && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-900 mb-1">
                ⚡ Action Required: {canApproveAsHOD ? 'HOD' : 'Dean'} Approval Needed
              </p>
              <p className="text-xs text-blue-700">
                Review this OD request and approve or reject it
              </p>
            </div>
            <Button
              onClick={() => onApprove(request, canApproveAsHOD ? 'hod' : 'dean')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
              size="lg"
            >
              Review & Approve
            </Button>
          </div>
        </div>
      )}

      {/* Students List */}
      {students.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Students ({students.length})
            </span>
          </div>
          <div className="space-y-1">
            {students.map((student, index) => (
              <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="font-medium text-blue-600">{index + 1}.</span>
                <span>{student.name}</span>
                <span className="text-gray-400">-</span>
                <span className="font-mono text-xs">{student.vtu_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs font-semibold text-amber-900 mb-1">Reason for OD:</p>
        <p className="text-sm text-gray-700">{request.reason}</p>
      </div>

      {/* Date & Time Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="font-medium">
              {new Date(request.from_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} - 
              {new Date(request.to_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Total Days</p>
            <p className="font-medium">{request.total_days} day(s)</p>
          </div>
        </div>
      </div>

      {request.from_time && request.to_time && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>Time: <span className="font-medium">{request.from_time} - {request.to_time}</span></span>
        </div>
      )}

      {/* Documents */}
      {(request.letter_url || request.proof_url) && (
        <div className="flex gap-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900">Documents:</p>
          {request.letter_url && (
            <a
              href={request.letter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              <FileText className="w-4 h-4" />
              OD Letter
            </a>
          )}
          {request.proof_url && (
            <a
              href={request.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              <FileText className="w-4 h-4" />
              Proof/Evidence
            </a>
          )}
        </div>
      )}

      {/* Approval Status */}
      <div className="border-t-2 border-gray-200 pt-4 mt-4">
        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Approval Status</p>
        <div className="grid grid-cols-2 gap-4">
          {/* HOD Approval */}
          <div className={`p-3 rounded-lg border-2 ${
            request.hod_status === 'approved' ? 'bg-green-50 border-green-300' :
            request.hod_status === 'rejected' ? 'bg-red-50 border-red-300' :
            request.hod_status === 'on_hold' ? 'bg-orange-50 border-orange-300' :
            'bg-yellow-50 border-yellow-300'
          }`}>
            <p className="text-xs font-bold text-gray-700 mb-1">HOD Approval</p>
            <div className={`flex items-center gap-2 text-sm font-bold ${getStatusColor(request.hod_status)}`}>
              {request.hod_status === 'on_hold' ? <Clock className="w-4 h-4" /> : getStatusIcon(request.hod_status)}
              {request.hod_status === 'on_hold' ? 'ON HOLD' : request.hod_status.toUpperCase()}
            </div>
            {request.hod_remarks && (
              <p className="text-xs text-gray-600 mt-2 italic border-t border-gray-300 pt-2">
                "{request.hod_remarks}"
              </p>
            )}
          </div>

          {/* Dean Approval */}
          <div className={`p-3 rounded-lg border-2 ${
            request.dean_status === 'approved' ? 'bg-green-50 border-green-300' :
            request.dean_status === 'rejected' ? 'bg-red-50 border-red-300' :
            request.dean_status === 'on_hold' ? 'bg-orange-50 border-orange-300' :
            'bg-yellow-50 border-yellow-300'
          }`}>
            <p className="text-xs font-bold text-gray-700 mb-1">Dean Approval</p>
            <div className={`flex items-center gap-2 text-sm font-bold ${getStatusColor(request.dean_status)}`}>
              {request.dean_status === 'on_hold' ? <Clock className="w-4 h-4" /> : getStatusIcon(request.dean_status)}
              {request.dean_status === 'on_hold' ? 'ON HOLD' : request.dean_status.toUpperCase()}
            </div>
            {request.dean_remarks && (
              <p className="text-xs text-gray-600 mt-2 italic border-t border-gray-300 pt-2">
                "{request.dean_remarks}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
