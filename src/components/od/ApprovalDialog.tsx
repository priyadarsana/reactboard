import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Clock, Users } from 'lucide-react';

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
  total_days: number;
  hod_status: string;
  dean_status: string;
}

interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  request: ODRequest;
  approvalType: 'hod' | 'dean';
  onSuccess: () => void;
}

export const ApprovalDialog = ({ open, onClose, request, approvalType, onSuccess }: ApprovalDialogProps) => {
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const students = Array.isArray(request.students) ? request.students : [];

  const handleApproval = async (status: 'approved' | 'rejected' | 'on_hold') => {
    if (status === 'on_hold' && !remarks.trim()) {
      toast.error('Please provide a reason for putting this request on hold');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in');
        return;
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (approvalType === 'hod') {
        updateData.hod_status = status;
        updateData.hod_approved_by = user.id;
        updateData.hod_approved_at = new Date().toISOString();
        updateData.hod_remarks = remarks.trim() || null;
        
        // If HOD rejects or puts on hold, final status reflects that
        if (status === 'rejected') {
          updateData.final_status = 'rejected';
        } else if (status === 'on_hold') {
          updateData.final_status = 'on_hold';
        }
      } else {
        updateData.dean_status = status;
        updateData.dean_approved_by = user.id;
        updateData.dean_approved_at = new Date().toISOString();
        updateData.dean_remarks = remarks.trim() || null;
        
        // Final status is determined by Dean's decision
        updateData.final_status = status;
      }

      const { error } = await (supabase as any)
        .from('od_requests')
        .update(updateData)
        .eq('id', request.id);

      if (error) throw error;

      const statusText = status === 'on_hold' ? 'put on hold' : status;
      toast.success(`OD request ${statusText} successfully!`);
      setRemarks('');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating OD request:', error);
      toast.error(error.message || 'Failed to update OD request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {approvalType === 'hod' ? 'HOD' : 'Dean'} Approval - {request.created_by_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">Submitted by:</span>
              <span className="text-sm text-gray-600 ml-2">
                {request.created_by_name} ({request.created_by_vtu})
              </span>
            </div>

            {students.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    All Students ({students.length}):
                  </span>
                </div>
                <div className="pl-6 space-y-1">
                  {students.map((student, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {index + 1}. {student.name} - {student.vtu_number}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-700">Duration:</span>
              <span className="text-sm text-gray-600 ml-2">
                {new Date(request.from_date).toLocaleDateString('en-IN')} to {new Date(request.to_date).toLocaleDateString('en-IN')}
                ({request.total_days} days)
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Reason:</span>
              <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Label htmlFor="remarks">Remarks / Reason (Required for On Hold) *</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add comments, notes, or reason for putting on hold..."
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
            <Button
              onClick={() => handleApproval('approved')}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Approve
            </Button>
            
            <Button
              onClick={() => handleApproval('on_hold')}
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              Put On Hold
            </Button>
            
            <Button
              onClick={() => handleApproval('rejected')}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
