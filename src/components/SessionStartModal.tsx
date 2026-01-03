import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Brain, Calendar, Shuffle, Loader2 } from 'lucide-react';
import type { DeckWithStatsDto } from '../types';

interface SessionStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalFlashcards: number;
  dueFlashcards: number;
  decks?: DeckWithStatsDto[];
}

type SessionMode = 'due' | 'all' | 'random';

/**
 * Modal do wyboru trybu rozpoczęcia sesji nauki
 * Pozwala użytkownikowi wybrać między:
 * - Tylko fiszki zaplanowane do powtórki (algorytm SRS)
 * - Wszystkie fiszki (ignorując harmonogram)
 * - Losowe fiszki
 */
export function SessionStartModal({
  isOpen,
  onClose,
  totalFlashcards,
  dueFlashcards,
  decks = [],
}: SessionStartModalProps) {
  const [mode, setMode] = useState<SessionMode>('due');
  const [maxCards, setMaxCards] = useState(20);
  const [selectedDeckId, setSelectedDeckId] = useState<string | undefined>(undefined);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    // Walidacja
    if (maxCards < 1 || maxCards > 100) {
      toast.error('Liczba fiszek musi być między 1 a 100');
      return;
    }

    if (mode === 'due' && dueFlashcards === 0) {
      toast.info('Nie masz fiszek zaplanowanych do powtórki', {
        description: 'Wybierz inny tryb lub wróć później.',
      });
      return;
    }

    setIsStarting(true);

    try {
      let flashcardIds: string[] | undefined;

      // Dla trybów "all" i "random" musimy najpierw pobrać fiszki
      if (mode === 'all' || mode === 'random') {
        const limit = Math.min(maxCards, totalFlashcards);
        const sortParam = mode === 'random' ? '' : 'sort[created_at]=desc';
        const deckParam = selectedDeckId ? `&filter[deck_id]=${selectedDeckId}` : '';
        
        const response = await fetch(`/api/flashcards?limit=${limit}&${sortParam}${deckParam}`);
        
        if (!response.ok) {
          throw new Error('Nie udało się pobrać fiszek');
        }

        const data = await response.json();
        flashcardIds = data.items.map((f: { id: string }) => f.id);

        // Dla trybu random - przetasuj
        if (mode === 'random' && flashcardIds && flashcardIds.length > 0) {
          flashcardIds = shuffleArray(flashcardIds);
        }

        if (!flashcardIds || flashcardIds.length === 0) {
          toast.error('Nie znaleziono fiszek do nauki');
          setIsStarting(false);
          return;
        }
      }

      // Utwórz sesję
      const requestBody = {
        flashcard_ids: flashcardIds,
        max_cards: maxCards,
      };

      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}));
        
        if (sessionResponse.status === 404) {
          toast.error('Brak fiszek do nauki', {
            description: 'Utwórz najpierw kilka fiszek.',
          });
          setIsStarting(false);
          onClose();
          return;
        }

        throw new Error(errorData.message || 'Nie udało się utworzyć sesji');
      }

      const sessionData = await sessionResponse.json();

      // Przekieruj do sesji
      window.location.href = `/sessions/${sessionData.session_id}`;
    } catch (error) {
      console.error('Error starting session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd';
      toast.error(errorMessage);
      setIsStarting(false);
    }
  };

  const handleModeChange = (newMode: SessionMode) => {
    setMode(newMode);
    
    // Automatycznie dostosuj maxCards do dostępnych fiszek
    if (newMode === 'due' && dueFlashcards > 0) {
      setMaxCards(Math.min(20, dueFlashcards));
    } else if (newMode !== 'due' && totalFlashcards > 0) {
      setMaxCards(Math.min(20, totalFlashcards));
    }
  };

  const getMaxAvailableCards = () => {
    if (mode === 'due') {
      return dueFlashcards;
    }
    return totalFlashcards;
  };

  const maxAvailable = getMaxAvailableCards();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Rozpocznij sesję nauki</DialogTitle>
          <DialogDescription>
            Wybierz tryb nauki i liczbę fiszek do powtórzenia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 overflow-y-auto flex-1 min-h-0">
          {/* Wybór trybu */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-sm sm:text-base font-semibold">Tryb nauki</Label>
            
            {/* Tryb: Tylko zaplanowane */}
            <button
              type="button"
              onClick={() => handleModeChange('due')}
              disabled={dueFlashcards === 0}
              className={`
                w-full rounded-lg border-2 p-3 sm:p-4 text-left transition-all
                ${
                  mode === 'due'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }
                ${dueFlashcards === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              `}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`mt-0.5 ${mode === 'due' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold">Tylko zaplanowane</span>
                    {mode === 'due' && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Wybrane
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                    Fiszki wymagające powtórki według algorytmu SRS
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-primary">
                    {dueFlashcards === 0 ? 'Brak fiszek' : `${dueFlashcards} ${getCardLabel(dueFlashcards)}`}
                  </p>
                </div>
              </div>
            </button>

            {/* Tryb: Wszystkie fiszki */}
            <button
              type="button"
              onClick={() => handleModeChange('all')}
              disabled={totalFlashcards === 0}
              className={`
                w-full rounded-lg border-2 p-3 sm:p-4 text-left transition-all
                ${
                  mode === 'all'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }
                ${totalFlashcards === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              `}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`mt-0.5 ${mode === 'all' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Brain className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold">Wszystkie fiszki</span>
                    {mode === 'all' && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Wybrane
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                    Naucz dowolne fiszki, ignorując harmonogram powtórek
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium">
                    {totalFlashcards} {getCardLabel(totalFlashcards)} dostępnych
                  </p>
                </div>
              </div>
            </button>

            {/* Tryb: Losowe */}
            <button
              type="button"
              onClick={() => handleModeChange('random')}
              disabled={totalFlashcards === 0}
              className={`
                w-full rounded-lg border-2 p-3 sm:p-4 text-left transition-all
                ${
                  mode === 'random'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }
                ${totalFlashcards === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              `}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`mt-0.5 ${mode === 'random' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Shuffle className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-semibold">Losowe fiszki</span>
                    {mode === 'random' && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        Wybrane
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground">
                    Wylosuj fiszki z całej kolekcji
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium">
                    {totalFlashcards} {getCardLabel(totalFlashcards)} w kolekcji
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Wybór zestawu */}
          {decks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="deck-select" className="text-sm sm:text-base font-semibold">
                Zestaw (opcjonalnie)
              </Label>
              <Select
                value={selectedDeckId || 'all'}
                onValueChange={(value) => setSelectedDeckId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="deck-select">
                  <SelectValue placeholder="Wszystkie zestawy" />
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
                        {deck.name} ({deck.flashcard_count})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ogranicz sesję do fiszek z wybranego zestawu
              </p>
            </div>
          )}

          {/* Liczba fiszek */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-cards" className="text-sm sm:text-base font-semibold">
                Liczba fiszek
              </Label>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Max: {maxAvailable}
              </span>
            </div>
            <Input
              id="max-cards"
              type="number"
              min={1}
              max={Math.min(100, maxAvailable)}
              value={maxCards}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  setMaxCards(Math.min(value, maxAvailable, 100));
                }
              }}
              disabled={maxAvailable === 0}
              className="text-base sm:text-lg font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Wybierz liczbę fiszek do nauki w tej sesji (1-100)
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isStarting} className="w-full sm:w-auto">
            Anuluj
          </Button>
          <Button onClick={handleStart} disabled={isStarting || maxAvailable === 0} size="lg" className="w-full sm:w-auto">
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tworzenie sesji...
              </>
            ) : (
              'Rozpocznij sesję'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper: przetasuj tablicę (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Helper: poprawna polska forma liczby mnogiej dla "fiszka"
 */
function getCardLabel(count: number): string {
  if (count === 1) return 'fiszka';
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return 'fiszki';
  }
  return 'fiszek';
}

