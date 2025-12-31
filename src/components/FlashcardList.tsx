import React from 'react';
import { FileQuestion } from 'lucide-react';
import { Button } from './ui/button';
import { FlashcardItem } from './FlashcardItem';
import { FlashcardListSkeleton } from './FlashcardListSkeleton';
import type { FlashcardDto } from '../types';

interface FlashcardListProps {
  flashcards: FlashcardDto[];
  loading: boolean;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
  onCreate: () => void;
}

interface EmptyStateProps {
  onCreate: () => void;
}

/**
 * Komponent stanu pustego (brak fiszek)
 */
function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-label="Brak fiszek"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileQuestion className="size-12 text-muted-foreground" aria-hidden="true" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">
        Nie masz jeszcze żadnych fiszek
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        Zacznij tworzyć fiszki ręcznie lub wygeneruj je za pomocą AI
      </p>
      
      <Button onClick={onCreate} size="lg">
        Utwórz pierwszą fiszkę
      </Button>
    </div>
  );
}

/**
 * Komponent renderujący listę fiszek
 */
export function FlashcardList({
  flashcards,
  loading,
  onEdit,
  onDelete,
  onCreate,
}: FlashcardListProps) {
  // Stan ładowania
  if (loading) {
    return <FlashcardListSkeleton />;
  }

  // Stan pusty
  if (flashcards.length === 0) {
    return <EmptyState onCreate={onCreate} />;
  }

  // Lista fiszek
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      role="list"
      aria-label="Lista fiszek"
    >
      {flashcards.map((flashcard) => (
        <FlashcardItem
          key={flashcard.id}
          flashcard={flashcard}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
