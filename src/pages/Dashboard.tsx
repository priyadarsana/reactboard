import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { ModuleCard } from '@/components/ModuleCard';
import {
  MapPin,
  MessageSquare,
  HelpCircle,
  Megaphone,
  FileText,
  Users
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const modules = [
    {
      title: 'Lost & Found',
      description: 'Report and find lost items with map pins',
      icon: MapPin,
      count: 12,
      gradient: 'bg-gradient-to-br from-primary to-primary/70',
      path: '/lost-found'
    },
    {
      title: 'General Chat',
      description: 'Connect with students and find faculty',
      icon: MessageSquare,
      gradient: 'bg-gradient-to-br from-accent to-accent/70',
      path: '/chat'
    },
    {
      title: 'Queries',
      description: 'Ask questions and get verified answers',
      icon: HelpCircle,
      count: 5,
      gradient: 'bg-gradient-to-br from-success to-success/70',
      path: '/queries'
    },
    {
      title: 'Announcements',
      description: 'Important updates and notices',
      icon: Megaphone,
      count: 3,
      gradient: 'bg-gradient-to-br from-warning to-warning/70',
      path: '/announcements'
    },
    {
      title: 'OD Requests',
      description: 'Submit and track on-duty requests',
      icon: FileText,
      gradient: 'bg-gradient-to-br from-destructive to-destructive/70',
      path: '/od-requests'
    },
    {
      title: 'Faculty Status',
      description: 'Check faculty availability and presence',
      icon: Users,
      gradient: 'bg-gradient-to-br from-primary/80 to-accent/80',
      path: '/faculty'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container py-8 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
          <p className="text-muted-foreground">
            Your centralized hub for campus life
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <ModuleCard
              key={module.title}
              {...module}
              onClick={() => navigate(module.path)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;