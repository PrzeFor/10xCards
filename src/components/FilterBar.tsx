import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import type { FlashcardFilters, SourceFilterOption, SortOption } from '../types/viewModels';
import type { DeckWithStatsDto } from '../types';

interface FilterBarProps {
  filters: FlashcardFilters;
  onFilterChange: (filters: FlashcardFilters) => void;
  decks?: DeckWithStatsDto[];
}

const sourceOptions: SourceFilterOption[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'manual', label: 'Ręczne' },
  { value: 'ai_full', label: 'AI - pełne' },
  { value: 'ai_edited', label: 'AI - edytowane' },
];

const sortOptions: SortOption[] = [
  { field: 'created_at', order: 'desc', label: 'Najnowsze' },
  { field: 'created_at', order: 'asc', label: 'Najstarsze' },
];

/**
 * Komponent paska filtrowania i sortowania fiszek
 */
export function FilterBar({ filters, onFilterChange, decks = [] }: FilterBarProps) {
  const handleSourceChange = (value: string) => {
    onFilterChange({
      ...filters,
      source: value === 'all' ? undefined : (value as 'manual' | 'ai_full' | 'ai_edited'),
    });
  };

  const handleDeckChange = (value: string) => {
    onFilterChange({
      ...filters,
      deckId: value === 'all' ? undefined : value,
    });
  };

  const handleSortChange = (value: string) => {
    onFilterChange({
      ...filters,
      sortOrder: value as 'asc' | 'desc',
    });
  };

  const currentSourceValue = filters.source || 'all';
  const currentDeckValue = filters.deckId || 'all';
  const currentSortValue = filters.sortOrder;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Filtr źródła */}
      <div className="flex-1">
        <label htmlFor="source-filter" className="text-sm font-medium mb-2 block">
          Źródło
        </label>
        <Select value={currentSourceValue} onValueChange={handleSourceChange}>
          <SelectTrigger id="source-filter" className="w-full">
            <SelectValue placeholder="Wybierz źródło" />
          </SelectTrigger>
          <SelectContent>
            {sourceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtr zestawu */}
      <div className="flex-1">
        <label htmlFor="deck-filter" className="text-sm font-medium mb-2 block">
          Zestaw
        </label>
        <Select value={currentDeckValue} onValueChange={handleDeckChange}>
          <SelectTrigger id="deck-filter" className="w-full">
            <SelectValue placeholder="Wybierz zestaw" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie zestawy</SelectItem>
            {decks.map((deck) => (
              <SelectItem key={deck.id} value={deck.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: deck.color || '#3b82f6' }}
                  />
                  {deck.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtr sortowania */}
      <div className="flex-1">
        <label htmlFor="sort-filter" className="text-sm font-medium mb-2 block">
          Sortowanie
        </label>
        <Select value={currentSortValue} onValueChange={handleSortChange}>
          <SelectTrigger id="sort-filter" className="w-full">
            <SelectValue placeholder="Wybierz sortowanie" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.order} value={option.order}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

