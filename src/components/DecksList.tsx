import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Pencil, Trash2, BookOpen } from 'lucide-react';
import type { DeckWithStatsDto } from '../types';

interface DecksListProps {
  decks: DeckWithStatsDto[];
  loading: boolean;
  onEdit: (deck: DeckWithStatsDto) => void;
  onDelete: (deck: DeckWithStatsDto) => void;
  onSelect: (deckId: string) => void;
}

export function DecksList({ decks, loading, onEdit, onDelete, onSelect }: DecksListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-muted rounded mb-4" />
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (decks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Brak zestawów</h3>
        <p className="text-muted-foreground mb-4">
          Utwórz swój pierwszy zestaw, aby organizować fiszki w kategorie
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck) => (
        <Card
          key={deck.id}
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          onClick={() => onSelect(deck.id)}
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: deck.color || '#3b82f6' }}
            >
              {deck.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(deck);
                }}
                aria-label="Edytuj zestaw"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(deck);
                }}
                aria-label="Usuń zestaw"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{deck.name}</h3>

          {deck.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{deck.description}</p>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {deck.flashcard_count} {deck.flashcard_count === 1 ? 'fiszka' : 'fiszek'}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

