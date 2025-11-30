import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { InlineError } from './InlineError.tsx';
import { createGenerationRequestSchema } from '../lib/schemas/generation';

interface GenerationFormProps {
  onGenerate: (sourceText: string) => void;
  isGenerating: boolean;
  errorMessage?: string;
}

type GenerationFormData = {
  source_text: string;
};

export function GenerationForm({ 
  onGenerate, 
  isGenerating, 
  errorMessage
}: GenerationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    watch,
    reset
  } = useForm<GenerationFormData>({
    resolver: zodResolver(createGenerationRequestSchema),
    mode: 'onChange',
    defaultValues: {
      source_text: ''
    }
  });

  const sourceTextValue = watch('source_text');
  const charCount = sourceTextValue?.length || 0;

  const statusMessage = useMemo(() => {
    if (charCount === 0) return null;
    if (charCount < 500) {
      return {
        text: `Potrzebujesz jeszcze ${500 - charCount} znaków`,
        className: 'text-danger'
      };
    }
    return {
      text: 'Gotowe do generacji',
      className: 'text-success'
    };
  }, [charCount]);

  const onSubmit = async (data: GenerationFormData) => {
    await onGenerate(data.source_text);
    reset();
  };

  const isDisabled = !isValid || isSubmitting || isGenerating;

  return (
    <Card className="hover-lift">
      <CardHeader>
        <CardTitle className="text-brand">Wklej tekst do analizy</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3">
            <Textarea
              data-testid="generation-source-text"
              placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki (500-15,000 znaków)..."
              className="min-h-[200px] resize-y"
              aria-invalid={!!errors.source_text}
              aria-describedby={errors.source_text || errorMessage ? "sourceTextError" : undefined}
              disabled={isGenerating || isSubmitting}
              {...register('source_text')}
            />
            
            <div className="flex justify-between items-center text-caption text-muted-foreground">
              <span>
                Znaki: {charCount.toLocaleString()} / 15,000
              </span>
              {statusMessage && (
                <span className={statusMessage.className}>
                  {statusMessage.text}
                </span>
              )}
            </div>

            {(errors.source_text || errorMessage) && (
              <InlineError 
                id="sourceTextError"
                message={errors.source_text?.message || errorMessage || ''} 
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
            {isGenerating || isSubmitting ? 'Generuję fiszki...' : 'Generuj fiszki'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
