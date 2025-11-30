import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { InlineError } from './InlineError.tsx';

interface GenerationFormProps {
  onGenerate: (sourceText: string) => void;
  isGenerating: boolean;
  errorMessage?: string;
  initialValue?: string;
  onValueChange?: (value: string) => void;
}

export function GenerationForm({ 
  onGenerate, 
  isGenerating, 
  errorMessage,
  initialValue = '',
  onValueChange 
}: GenerationFormProps) {
  const [sourceText, setSourceText] = useState(initialValue);
  const [validationError, setValidationError] = useState<string>('');

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setSourceText(value);
    onValueChange?.(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const validateText = (text: string): string | null => {
    if (text.length < 500) {
      return `Tekst musi mieć co najmniej 500 znaków. Obecnie: ${text.length}`;
    }
    if (text.length > 15000) {
      return `Tekst nie może przekraczać 15,000 znaków. Obecnie: ${text.length}`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateText(sourceText);
    if (error) {
      setValidationError(error);
      return;
    }

    onGenerate(sourceText);
  };

  const isValid = sourceText.length >= 500 && sourceText.length <= 15000;
  const isDisabled = !isValid || isGenerating;

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Wklej tekst do analizy</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Textarea
              data-testid="generation-source-text"
              value={sourceText}
              onChange={handleTextChange}
              placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (500-15,000 znaków)..."
              className="min-h-[200px] resize-y"
              aria-describedby={validationError || errorMessage ? "sourceTextError" : undefined}
              disabled={isGenerating}
            />
            
            <div className="flex justify-between items-center text-caption text-muted-foreground">
              <span>
                Znaki: {sourceText.length.toLocaleString()} / 15,000
              </span>
              {sourceText.length > 0 && (
                <span className={sourceText.length < 500 ? 'text-danger' : 'text-success'}>
                  {sourceText.length < 500 
                    ? `Potrzebujesz jeszcze ${500 - sourceText.length} znaków`
                    : 'Gotowe do generacji'
                  }
                </span>
              )}
            </div>

            {(validationError || errorMessage) && (
              <InlineError 
                id="sourceTextError"
                message={validationError || errorMessage || ''} 
              />
            )}
          </div>

          <Button 
            data-testid="generate-flashcards-button"
            type="submit" 
            disabled={isDisabled}
            className="w-full"
            size="lg"
          >
            {isGenerating ? 'Generuję fiszki...' : 'Generuj fiszki'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
