import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, X, Plus, Trash2 } from 'lucide-react';

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
}

interface CreateODDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editMode?: boolean;
  existingRequest?: ODRequest | null;
}

export const CreateODDialog = ({ open, onClose, onSuccess, editMode = false, existingRequest = null }: CreateODDialogProps) => {
  const [mainStudent, setMainStudent] = useState({
    name: '',
    vtu_number: ''
  });
  const [additionalStudents, setAdditionalStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    reason: '',
    from_date: '',
    to_date: '',
    from_time: '',
    to_time: ''
  });
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing data when in edit mode
  useEffect(() => {
    if (editMode && existingRequest) {
      const students = existingRequest.students || [];
      if (students.length > 0) {
        setMainStudent({
          name: students[0].name,
          vtu_number: students[0].vtu_number
        });
        if (students.length > 1) {
          setAdditionalStudents(students.slice(1));
        }
      }
      setFormData({
        reason: existingRequest.reason,
        from_date: existingRequest.from_date,
        to_date: existingRequest.to_date,
        from_time: existingRequest.from_time || '',
        to_time: existingRequest.to_time || ''
      });
    } else {
      // Reset form when not in edit mode
      setMainStudent({ name: '', vtu_number: '' });
      setAdditionalStudents([]);
      setFormData({ reason: '', from_date: '', to_date: '', from_time: '', to_time: '' });
      setLetterFile(null);
      setProofFile(null);
    }
  }, [editMode, existingRequest, open]);

  const addStudent = () => {
    setAdditionalStudents([...additionalStudents, { name: '', vtu_number: '' }]);
  };

  const removeStudent = (index: number) => {
    setAdditionalStudents(additionalStudents.filter((_, i) => i !== index));
  };

  const updateStudent = (index: number, field: 'name' | 'vtu_number', value: string) => {
    const updated = [...additionalStudents];
    updated[index][field] = value;
    setAdditionalStudents(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'letter' | 'proof') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      if (type === 'letter') {
        setLetterFile(file);
      } else {
        setProofFile(file);
      }
    }
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const calculateDays = (from: string, to: string): number => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mainStudent.name.trim() || !mainStudent.vtu_number.trim()) {
      toast.error('Please fill in your name and VTU number');
      return;
    }

    if (!formData.reason.trim() || !formData.from_date || !formData.to_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.from_date) > new Date(formData.to_date)) {
      toast.error('From date cannot be after To date');
      return;
    }

    // Validate additional students
    for (let i = 0; i < additionalStudents.length; i++) {
      if (!additionalStudents[i].name.trim() || !additionalStudents[i].vtu_number.trim()) {
        toast.error(`Please fill in details for student ${i + 2}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in');
        return;
      }

      // Upload files (or keep existing URLs if no new files)
      let letterUrl = editMode && existingRequest ? existingRequest.letter_url : null;
      let proofUrl = editMode && existingRequest ? existingRequest.proof_url : null;

      if (letterFile) {
        letterUrl = await uploadFile(letterFile, 'od-letters');
      }
      if (proofFile) {
        proofUrl = await uploadFile(proofFile, 'od-proofs');
      }

      // Combine all students
      const allStudents = [
        { name: mainStudent.name.trim(), vtu_number: mainStudent.vtu_number.trim().toUpperCase() },
        ...additionalStudents.map(s => ({
          name: s.name.trim(),
          vtu_number: s.vtu_number.trim().toUpperCase()
        }))
      ];

      const totalDays = calculateDays(formData.from_date, formData.to_date);

      const requestData = {
        created_by: user.id,
        created_by_name: mainStudent.name.trim(),
        created_by_vtu: mainStudent.vtu_number.trim().toUpperCase(),
        students: allStudents,
        reason: formData.reason.trim(),
        from_date: formData.from_date,
        to_date: formData.to_date,
        from_time: formData.from_time || null,
        to_time: formData.to_time || null,
        total_days: totalDays,
        letter_url: letterUrl,
        proof_url: proofUrl,
        // Reset statuses when editing
        ...(editMode && {
          hod_status: 'pending',
          dean_status: 'pending',
          final_status: 'pending',
          hod_remarks: null,
          dean_remarks: null,
          hod_approved_by: null,
          dean_approved_by: null,
          hod_approved_at: null,
          dean_approved_at: null
        })
      };

      if (editMode && existingRequest) {
        // Update existing request
        const { error } = await (supabase as any)
          .from('od_requests')
          .update(requestData)
          .eq('id', existingRequest.id);

        if (error) throw error;
        toast.success('OD request updated successfully!');
      } else {
        // Create new request
        const { error } = await (supabase as any)
          .from('od_requests')
          .insert(requestData);

        if (error) throw error;
        toast.success('OD request submitted successfully!');
      }
      
      // Reset form
      setMainStudent({ name: '', vtu_number: '' });
      setAdditionalStudents([]);
      setFormData({ reason: '', from_date: '', to_date: '', from_time: '', to_time: '' });
      setLetterFile(null);
      setProofFile(null);
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating OD request:', error);
      toast.error(error.message || 'Failed to submit OD request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadSection = ({ file, type, label, existingUrl }: { file: File | null; type: 'letter' | 'proof'; label: string; existingUrl?: string | null }) => (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">
        {existingUrl && !file && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-700">Current file: <a href={existingUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a></p>
          </div>
        )}
        {!file ? (
          <label
            htmlFor={type}
            className="flex items-center justify-center w-full h-24 px-4 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="text-center">
              <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
              <p className="text-xs text-gray-600">{existingUrl ? 'Click to replace' : 'Click to upload'}</p>
              <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB</p>
            </div>
            <input
              id={type}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, type)}
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => type === 'letter' ? setLetterFile(null) : setProofFile(null)}
              className="text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit OD Request' : 'Create OD Request'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Student */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900">Your Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Your Name *</Label>
                <Input
                  value={mainStudent.name}
                  onChange={(e) => setMainStudent({ ...mainStudent, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <Label>Your VTU Number *</Label>
                <Input
                  value={mainStudent.vtu_number}
                  onChange={(e) => setMainStudent({ ...mainStudent, vtu_number: e.target.value })}
                  placeholder="e.g., 1VE21CS001"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Students */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Additional Students (Optional)</h3>
              <Button type="button" onClick={addStudent} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Student
              </Button>
            </div>

            {additionalStudents.map((student, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <Label>Student {index + 2} Name *</Label>
                  <Input
                    value={student.name}
                    onChange={(e) => updateStudent(index, 'name', e.target.value)}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>VTU Number *</Label>
                    <Input
                      value={student.vtu_number}
                      onChange={(e) => updateStudent(index, 'vtu_number', e.target.value)}
                      placeholder="e.g., 1VE21CS002"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStudent(index)}
                    className="mt-6 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for OD *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Describe the reason for your OD request..."
              rows={4}
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From Date *</Label>
              <Input
                type="date"
                value={formData.from_date}
                onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>To Date *</Label>
              <Input
                type="date"
                value={formData.to_date}
                onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>From Time (Optional)</Label>
              <Input
                type="time"
                value={formData.from_time}
                onChange={(e) => setFormData({ ...formData, from_time: e.target.value })}
              />
            </div>
            <div>
              <Label>To Time (Optional)</Label>
              <Input
                type="time"
                value={formData.to_time}
                onChange={(e) => setFormData({ ...formData, to_time: e.target.value })}
              />
            </div>
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-2 gap-4">
            <FileUploadSection 
              file={letterFile} 
              type="letter" 
              label="OD Letter (Optional)" 
              existingUrl={editMode && existingRequest ? existingRequest.letter_url : null}
            />
            <FileUploadSection 
              file={proofFile} 
              type="proof" 
              label="Proof/Evidence (Optional)" 
              existingUrl={editMode && existingRequest ? existingRequest.proof_url : null}
            />
          </div>

          {/* Total Days */}
          {formData.from_date && formData.to_date && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-900">
                Total Days: {calculateDays(formData.from_date, formData.to_date)} day(s)
              </p>
              <p className="text-xs text-green-700 mt-1">
                {additionalStudents.length + 1} student(s) in this request
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editMode ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                editMode ? 'Update OD Request' : 'Submit OD Request'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
