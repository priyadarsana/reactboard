import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, User } from 'lucide-react';

interface Query {
  id: string;
  student_name: string;
  student_vtu: string;
  subject: string;
  category: string;
  status: string;
  created_at: string;
}

interface QueryCardProps {
  query: Query;
  userRole: string;
  onOpenChat: (query: Query) => void;
}

export const QueryCard = ({ query, userRole, onOpenChat }: QueryCardProps) => {
  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    answered: 'bg-green-100 text-green-800 border-green-300',
    closed: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const categoryColors = {
    hackathon: 'bg-purple-100 text-purple-700',
    procedure: 'bg-blue-100 text-blue-700',
    academic: 'bg-green-100 text-green-700',
    event: 'bg-orange-100 text-orange-700',
    other: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[query.category as keyof typeof categoryColors]}`}>
              {query.category.toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[query.status as keyof typeof statusColors]}`}>
              {query.status.toUpperCase()}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{query.subject}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{query.student_name} ({query.student_vtu})</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(query.created_at).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => onOpenChat(query)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Open Chat
        </Button>
      </div>
    </div>
  );
};
