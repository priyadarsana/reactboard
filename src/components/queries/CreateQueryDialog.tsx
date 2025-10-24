import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateQueryDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateQueryDialog = ({ open, onClose, onSuccess }: CreateQueryDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    vtu: '',
    subject: '',
    category: 'hackathon',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.vtu.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please log in');
        return;
      }

      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('role, name')
        .eq('user_id', user.id)
        .single();

      // Create query
      const { data: queryData, error: queryError } = await (supabase as any)
        .from('queries')
        .insert({
          student_id: user.id,
          student_name: formData.name.trim(),
          student_vtu: formData.vtu.trim().toUpperCase(),
          subject: formData.subject.trim(),
          category: formData.category,
          status: 'open'
        })
        .select()
        .single();

      if (queryError) throw queryError;

      // Create first message
      const { error: messageError } = await (supabase as any)
        .from('query_messages')
        .insert({
          query_id: queryData.id,
          sender_id: user.id,
          sender_name: formData.name.trim(),
          sender_role: profile?.role || 'student',
          message: formData.message.trim()
        });

      if (messageError) throw messageError;

      toast.success('Query submitted successfully!');
      setFormData({ name: '', vtu: '', subject: '', category: 'hackathon', message: '' });
      onSuccess();
    } catch (error: any) {
      console.error('Error creating query:', error);
      toast.error(error.message || 'Failed to submit query');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ask a Query</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Your Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <Label htmlFor="vtu">VTU Number *</Label>
              <Input
                id="vtu"
                value={formData.vtu}
                onChange={(e) => setFormData({ ...formData, vtu: e.target.value })}
                placeholder="e.g., 1VE21CS001"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hackathon">Hackathon</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief subject of your query"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Your Question *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe your question in detail..."
              rows={6}
              required
            />
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
                  Submitting...
                </>
              ) : (
                'Submit Query'
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
