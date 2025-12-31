import { CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { StatsCard } from './StatsCard';
import type { SessionStatsDto } from '../../types';

interface SessionSummaryProps {
  stats: SessionStatsDto;
  onFinish: () => void;
  onStartNew: () => void;
}

/**
 * Displays session completion summary with statistics
 * Shows total cards reviewed, rating distribution, and session duration
 */
export function SessionSummary({ stats, onFinish, onStartNew }: SessionSummaryProps) {
  // Format duration from seconds to readable string
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate percentages
  const easyPercent = Math.round((stats.easy_count / stats.total_cards) * 100);
  const mediumPercent = Math.round((stats.medium_count / stats.total_cards) * 100);
  const hardPercent = Math.round((stats.hard_count / stats.total_cards) * 100);

  return (
    <div className="w-full max-w-4xl animate-in fade-in-0 zoom-in-95 duration-500">
      <div className="text-center">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="mb-2 sm:mb-4 flex justify-center">
            <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
          </div>
          <h1 className="mb-1 sm:mb-2 text-2xl sm:text-3xl font-bold">Sesja zakończona!</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Świetna robota! Przejrzałeś {stats.total_cards} {stats.total_cards === 1 ? 'fiszkę' : 'fiszek'}.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="mb-4 sm:mb-8 grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          {/* Total Cards */}
          <StatsCard
            icon={<TrendingUp />}
            value={stats.total_cards}
            label="Przejrzane fiszki"
            variant="default"
            compact
          />

          {/* Duration */}
          <StatsCard
            icon={<Clock />}
            value={formatDuration(stats.duration)}
            label="Czas trwania"
            variant="default"
            compact
          />

          {/* Easy Count */}
          <StatsCard
            value={`${stats.easy_count} (${easyPercent}%)`}
            label="Łatwe"
            variant="success"
            compact
          />

          {/* Medium Count */}
          <StatsCard
            value={`${stats.medium_count} (${mediumPercent}%)`}
            label="Średnie"
            variant="warning"
            compact
          />

          {/* Hard Count */}
          <div className="col-span-2 lg:col-span-4">
            <StatsCard
              value={`${stats.hard_count} (${hardPercent}%)`}
              label="Trudne"
              variant="error"
              compact
            />
          </div>
        </div>

        {/* Rating Distribution Bar */}
        <div className="mb-4 sm:mb-8">
          <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-muted-foreground">Rozkład ocen</p>
          <div className="flex h-6 sm:h-8 w-full overflow-hidden rounded-lg">
            {stats.easy_count > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${easyPercent}%` }}
                title={`Łatwe: ${stats.easy_count}`}
              />
            )}
            {stats.medium_count > 0 && (
              <div
                className="bg-yellow-500"
                style={{ width: `${mediumPercent}%` }}
                title={`Średnie: ${stats.medium_count}`}
              />
            )}
            {stats.hard_count > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${hardPercent}%` }}
                title={`Trudne: ${stats.hard_count}`}
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onFinish} size="lg" className="sm:min-w-[200px]">
            Zakończ sesję
          </Button>
          <Button onClick={onStartNew} variant="outline" size="lg" className="sm:min-w-[200px]">
            Rozpocznij nową sesję
          </Button>
        </div>
      </div>
    </div>
  );
}

