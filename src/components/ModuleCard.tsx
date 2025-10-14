import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count?: number;
  gradient: string;
  onClick: () => void;
}

export const ModuleCard = ({
  title,
  description,
  icon: Icon,
  count,
  gradient,
  onClick
}: ModuleCardProps) => {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        "hover:shadow-lg border-2 hover:border-primary/20",
        "bg-gradient-to-br from-card to-card/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className={cn("p-3 rounded-xl", gradient)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {count !== undefined && (
            <Badge variant="secondary" className="font-semibold">
              {count}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
};