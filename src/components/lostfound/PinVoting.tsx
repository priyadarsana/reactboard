import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PinVotingProps {
  pinId: string;
  votes: any[];
  userId: string | null;
}

export const PinVoting = ({ pinId, votes = [], userId }: PinVotingProps) => {
  const [isVoting, setIsVoting] = useState(false);

  const tickVotes = votes.filter((v: any) => v.vote_type === 'tick').length;
  const crossVotes = votes.filter((v: any) => v.vote_type === 'cross').length;
  
  const userVote = votes.find((v: any) => v.user_id === userId);

  const handleVote = async (voteType: 'tick' | 'cross') => {
    if (!userId) {
      toast.error('Please log in to vote');
      return;
    }

    setIsVoting(true);

    try {
      // If user already voted, delete old vote first
      if (userVote) {
        await supabase.from('votes').delete().eq('id', userVote.id);
      }

      // If clicking same vote type, just remove it (toggle off)
      if (userVote?.vote_type === voteType) {
        toast.success('Vote removed');
        window.location.reload();
        return;
      }

      // Add new vote
      const { error } = await supabase
        .from('votes')
        .insert({
          pin_id: pinId,
          user_id: userId,
          vote_type: voteType
        });

      if (error) throw error;

      toast.success(voteType === 'tick' ? 'Marked as helpful!' : 'Marked as not helpful');
      window.location.reload();
    } catch (error: any) {
      console.error('Vote error:', error);
      toast.error('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={userVote?.vote_type === 'tick' ? 'default' : 'outline'}
        className="flex items-center gap-1"
        onClick={() => handleVote('tick')}
        disabled={isVoting}
      >
        <ThumbsUp className="w-3 h-3" />
        <span>{tickVotes}</span>
      </Button>
      
      <Button
        size="sm"
        variant={userVote?.vote_type === 'cross' ? 'destructive' : 'outline'}
        className="flex items-center gap-1"
        onClick={() => handleVote('cross')}
        disabled={isVoting}
      >
        <ThumbsDown className="w-3 h-3" />
        <span>{crossVotes}</span>
      </Button>
    </div>
  );
};
