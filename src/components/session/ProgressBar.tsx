import { cn } from '../../lib/utils';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

/**
 * Visualizes progress through a review session
 * Shows both a progress bar and text counter
 */
export function ProgressBar({ current, total, className }: ProgressBarProps) {
  // Validation
  const validCurrent = Math.max(0, Math.min(current, total));
  const validTotal = Math.max(1, total);
  
  const percentage = (validCurrent / validTotal) * 100;
  const displayPercentage = Math.round(percentage);

  return (
    <div
      className={cn('w-full space-y-2', className)}
      role="progressbar"
      aria-valuenow={validCurrent}
      aria-valuemin={0}
      aria-valuemax={validTotal}
      aria-label={`Progress: ${validCurrent} of ${validTotal} cards completed`}
    >
      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Text counter */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {validCurrent} / {validTotal} cards
        </span>
        <span>{displayPercentage}%</span>
      </div>
    </div>
  );
}

