import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
  compact?: boolean;
}

/**
 * Reusable card component for displaying a single statistic
 * Used in session summary to show metrics like card count, duration, etc.
 */
export function StatsCard({ icon, value, label, variant = 'default', className, compact = false }: StatsCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500/50 bg-green-500/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    error: 'border-red-500/50 bg-red-500/5',
  };

  const valueStyles = {
    default: 'text-foreground',
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
    error: 'text-red-700 dark:text-red-400',
  };

  return (
    <Card className={cn('border-2', variantStyles[variant], className)}>
      <CardContent className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'p-3 sm:p-6' : 'p-6'
      )}>
        {icon && <div className={cn('text-3xl', compact && 'mb-1 sm:mb-3')}>{icon}</div>}
        
        <div className={cn(
          'font-bold',
          compact ? 'text-xl sm:text-3xl' : 'text-3xl',
          valueStyles[variant]
        )}>
          {value}
        </div>
        
        <div className={cn(
          'text-muted-foreground',
          compact ? 'mt-0.5 sm:mt-1 text-xs sm:text-sm' : 'mt-1 text-sm'
        )}>
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

