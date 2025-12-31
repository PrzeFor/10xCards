import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { FlashcardDto } from '../types';

interface FlashcardItemProps {
  flashcard: FlashcardDto;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}

/**
 * Komponent pojedynczej fiszki w siatce
 */
export function FlashcardItem({ flashcard, onEdit, onDelete }: FlashcardItemProps) {
  // Funkcja do skracania tekstu
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Formatowanie daty
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Dziś';
    if (diffInDays === 1) return 'Wczoraj';
    if (diffInDays < 7) return `${diffInDays} dni temu`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} tyg. temu`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} mies. temu`;
    return date.toLocaleDateString('pl-PL');
  };

  // Styling badge według źródła
  const getBadgeVariant = (source: string) => {
    switch (source) {
      case 'manual':
        return 'default'; // niebieski
      case 'ai_full':
        return 'secondary'; // zielony
      case 'ai_edited':
        return 'outline'; // żółty/outline
      default:
        return 'default';
    }
  };

  const getBadgeLabel = (source: string) => {
    switch (source) {
      case 'manual':
        return 'Ręczne';
      case 'ai_full':
        return 'AI';
      case 'ai_edited':
        return 'AI - edytowane';
      default:
        return source;
    }
  };

  return (
    <Card
      role="listitem"
      className="flex flex-col h-full transition-shadow hover:shadow-md"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={getBadgeVariant(flashcard.source)}>
            {getBadgeLabel(flashcard.source)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDate(flashcard.created_at)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Przód fiszki */}
        <div>
          <p className="text-sm font-medium text-foreground">
            {truncateText(flashcard.front, 100)}
          </p>
        </div>

        {/* Separator */}
        <div className="h-px bg-border" />

        {/* Tył fiszki */}
        <div>
          <p className="text-sm text-muted-foreground">
            {truncateText(flashcard.back, 150)}
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(flashcard)}
          className="flex-1"
          aria-label={`Edytuj fiszkę: ${flashcard.front}`}
        >
          <Pencil className="size-4 mr-2" />
          Edytuj
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(flashcard)}
          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label={`Usuń fiszkę: ${flashcard.front}`}
        >
          <Trash2 className="size-4 mr-2" />
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
}
