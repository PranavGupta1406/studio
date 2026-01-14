'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type Seriousness = 'HIGH' | 'MEDIUM' | 'LOW';

interface SeriousnessBadgeProps {
  level: Seriousness | null;
}

export function SeriousnessBadge({ level }: SeriousnessBadgeProps) {
  const badgeStyles = {
    HIGH: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    MEDIUM: 'bg-[hsl(var(--chart-4))] text-primary-foreground hover:bg-[hsl(var(--chart-4))]/80',
    LOW: 'bg-[hsl(var(--chart-2))] text-primary-foreground hover:bg-[hsl(var(--chart-2))]/80',
  };

  if (!level) {
    return <Badge variant="outline">Not Determined</Badge>;
  }

  return (
    <Badge className={cn('text-sm py-1 px-3', badgeStyles[level])}>
      {level}
    </Badge>
  );
}
