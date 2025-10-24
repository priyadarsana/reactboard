import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Faculty {
  id: string;
  name: string;
  cabin_number: string | null;
  is_in_cabin: boolean;
  is_on_campus: boolean;
}

interface UpdateStatusDialogProps {
  open: boolean;
  onClose: () => void;
  faculty: Faculty;
  onSuccess: () => void;
}

export const UpdateStatusDialog = ({ open, onClose, faculty, onSuccess }: UpdateStatusDialogProps) => {
  const [formData, setFormData] = useState({
    cabin_number: faculty.cabin_number || '',
    is_in_cabin: faculty.is_in_cabin,
    is_on_campus: faculty.is_on_campus
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const { error } = await (supabase as any)
        .from('faculty_members')
        .update({
          cabin_number: formData.cabin_number.trim() || null,
          is_in_cabin: formData.is_in_cabin,
          is_on_campus: formData.is_on_campus,
          updated_at: new Date().toISOString()
        })
        .eq('id', faculty.id);

      if (error) throw error;

      toast.success('Status updated successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Your Status</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cabin_number">Cabin Number</Label>
            <Input
              id="cabin_number"
              value={formData.cabin_number}
              onChange={(e) => setFormData({ ...formData, cabin_number: e.target.value })}
              placeholder="e.g., A-101"
              maxLength={20}
            />
          </div>

          <div className="space-y-3">
            <Label>Availability Status</Label>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_on_campus"
                checked={formData.is_on_campus}
                onChange={(e) => setFormData({ ...formData, is_on_campus: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_on_campus" className="cursor-pointer">
                I am on campus
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_in_cabin"
                checked={formData.is_in_cabin}
                onChange={(e) => setFormData({ ...formData, is_in_cabin: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_in_cabin" className="cursor-pointer">
                I am available in my cabin
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
