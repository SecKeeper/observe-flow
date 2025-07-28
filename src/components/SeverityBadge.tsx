import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  className?: string;
}

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
  const getBadgeVariant = () => {
    switch (severity) {
      case 'Critical':
        return 'destructive';
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getBadgeColor = () => {
    switch (severity) {
      case 'Critical':
        return 'bg-destructive text-destructive-foreground';
      case 'High':
        return 'bg-warning text-warning-foreground';
      case 'Medium':
        return 'bg-info text-info-foreground';
      case 'Low':
        return 'bg-success text-success-foreground';
      default:
        return '';
    }
  };

  return (
    <Badge 
      variant={getBadgeVariant()} 
      className={cn(getBadgeColor(), className)}
    >
      {severity}
    </Badge>
  );
};

export default SeverityBadge;