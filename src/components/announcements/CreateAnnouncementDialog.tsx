import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateAnnouncementDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAnnouncementDialog = ({ open, onClose, onSuccess }: CreateAnnouncementDialogProps) => {
  const [formData, setFormData] = useState<{
    title: string;
    body: string;
    category: 'events' | 'exams' | 'holidays' | 'maintenance';
  }>({
    title: '',
    body: '',
    category: 'events'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in');
        return;
      }

      const { error } = await (supabase
        .from('announcements') as any)
        .insert({
          title: formData.title.trim(),
          body: formData.body.trim(),
          category: formData.category,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Announcement posted successfully!');
      setFormData({ title: '', body: '', category: 'events' });
      onSuccess();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      toast.error(error.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Announcement</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter announcement title"
              required
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="body">Content *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Enter announcement details..."
              rows={8}
              required
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.body.length}/2000 characters
            </p>
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as 'events' | 'exams' | 'holidays' | 'maintenance' })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="events">🎉 Events</option>
              <option value="exams">📝 Exams</option>
              <option value="holidays">🏖️ Holidays</option>
              <option value="maintenance">🔧 Maintenance</option>
            </select>
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
                  Posting...
                </>
              ) : (
                'Post Announcement'
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
