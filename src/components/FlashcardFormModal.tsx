import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { InlineError } from './InlineError';
import type { FlashcardFormData, FlashcardFormErrors } from '../types/viewModels';
import type { DeckWithStatsDto } from '../types';

interface FlashcardFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: FlashcardFormData;
  onSave: (data: FlashcardFormData) => Promise<void>;
  onClose: () => void;
  decks?: DeckWithStatsDto[];
}

/**
 * Modal do tworzenia nowej fiszki lub edycji istniejącej
 */
export function FlashcardFormModal({
  isOpen,
  mode,
  initialData,
  onSave,
  onClose,
  decks = [],
}: FlashcardFormModalProps) {
  const [formData, setFormData] = useState<FlashcardFormData>({
    front: '',
    back: '',
    deckId: undefined,
  });
  const [errors, setErrors] = useState<FlashcardFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill formularza w trybie edit lub reset w trybie create
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData(initialData);
      } else {
        setFormData({ front: '', back: '', deckId: undefined });
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [mode, initialData, isOpen]);

  // Walidacja pojedynczego pola
  const validateField = (name: 'front' | 'back', value: string): string | undefined => {
    if (!value.trim()) {
      return name === 'front' ? 'Przód fiszki jest wymagany' : 'Tył fiszki jest wymagany';
    }

    const maxLength = name === 'front' ? 300 : 500;
    if (value.length > maxLength) {
      return `Maksymalnie ${maxLength} znaków`;
    }

    return undefined;
  };

  // Walidacja całego formularza
  const validateForm = (data: FlashcardFormData): FlashcardFormErrors => {
    const newErrors: FlashcardFormErrors = {};

    const frontError = validateField('front', data.front);
    if (frontError) newErrors.front = frontError;

    const backError = validateField('back', data.back);
    if (backError) newErrors.back = backError;

    return newErrors;
  };

  // Sprawdzenie czy formularz jest poprawny
  const isFormValid = (data: FlashcardFormData): boolean => {
    const validationErrors = validateForm(data);
    return Object.keys(validationErrors).length === 0;
  };

  // Handler dla pola Front
  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, front: value }));

    // Real-time walidacja
    const error = validateField('front', value);
    setErrors((prev) => ({ ...prev, front: error }));
  };

  // Handler dla pola Back
  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, back: value }));

    // Real-time walidacja
    const error = validateField('back', value);
    setErrors((prev) => ({ ...prev, back: error }));
  };

  // Handler submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Walidacja przed submitem
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(formData);
      // Modal zostanie zamknięty przez rodzica po sukcesie
    } catch (error) {
      console.error('Error saving flashcard:', error);
      // Błąd zostanie obsłużony przez rodzica (toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kolor licznika znaków
  const getCharCountColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage > 100) return 'text-destructive';
    if (percentage > 90) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  const title = mode === 'create' ? 'Nowa fiszka' : 'Edytuj fiszkę';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pole Front */}
          <div className="space-y-2">
            <Label htmlFor="front">
              Przód fiszki <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="front"
              value={formData.front}
              onChange={handleFrontChange}
              placeholder="Wprowadź treść przodu fiszki..."
              rows={3}
              className={errors.front ? 'border-destructive' : ''}
              aria-invalid={!!errors.front}
              aria-describedby={errors.front ? 'front-error' : undefined}
            />
            <div className="flex justify-between items-center">
              <span
                className={`text-xs ${getCharCountColor(formData.front.length, 300)}`}
                aria-live="polite"
              >
                {formData.front.length}/300
              </span>
            </div>
            {errors.front && <InlineError message={errors.front} id="front-error" />}
          </div>

          {/* Pole Back */}
          <div className="space-y-2">
            <Label htmlFor="back">
              Tył fiszki <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="back"
              value={formData.back}
              onChange={handleBackChange}
              placeholder="Wprowadź treść tyłu fiszki..."
              rows={4}
              className={errors.back ? 'border-destructive' : ''}
              aria-invalid={!!errors.back}
              aria-describedby={errors.back ? 'back-error' : undefined}
            />
            <div className="flex justify-between items-center">
              <span
                className={`text-xs ${getCharCountColor(formData.back.length, 500)}`}
                aria-live="polite"
              >
                {formData.back.length}/500
              </span>
            </div>
            {errors.back && <InlineError message={errors.back} id="back-error" />}
          </div>

          {/* Pole Deck */}
          {decks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="deck">Zestaw (opcjonalnie)</Label>
              <Select
                value={formData.deckId || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, deckId: value === 'none' ? undefined : value })
                }
              >
                <SelectTrigger id="deck">
                  <SelectValue placeholder="Wybierz zestaw" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bez zestawu</SelectItem>
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
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!isFormValid(formData) || isSubmitting}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

