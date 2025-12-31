import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Komponent nawigacji między stronami wyników
 */
export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  // Nie wyświetlaj paginacji jeśli jest tylko 1 strona lub brak stron
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center justify-between gap-4 mt-8 pt-6 border-t"
      role="navigation"
      aria-label="Paginacja"
    >
      <Button
        variant="outline"
        size="default"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        aria-label="Poprzednia strona"
        className="flex items-center gap-2"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Poprzednia</span>
      </Button>

      <span className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
        Strona <span className="font-medium text-foreground">{currentPage}</span> z{' '}
        <span className="font-medium text-foreground">{totalPages}</span>
      </span>

      <Button
        variant="outline"
        size="default"
        onClick={handleNext}
        disabled={!canGoNext}
        aria-label="Następna strona"
        className="flex items-center gap-2"
      >
        <span className="hidden sm:inline">Następna</span>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </nav>
  );
}

