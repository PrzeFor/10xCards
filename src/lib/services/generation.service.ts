import { createHash } from 'crypto';
import type { SupabaseClient } from '../../db/supabase.client';
import type { Database } from '../../db/database.types';
import { DEFAULT_USER_ID } from '../../db/supabase.client';
import type { 
  CreateGenerationResponseDto, 
  FlashcardProposalDto,
  GenerationStatus 
} from '../../types';
import { aiServiceResponseSchema, type AIServiceResponse } from '../schemas/generation';

/**
 * Service for handling flashcard generation operations
 */
export class GenerationService {
  private supabase: SupabaseClient<Database>;
  private readonly AI_TIMEOUT = 60000; // 60 seconds
  private readonly MAX_RETRIES = 2;
  private readonly MAX_FLASHCARDS = 50;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Creates a new generation request and processes it through AI service
   * @param sourceText - The source text to generate flashcards from
   */
  async createGeneration(
    sourceText: string
  ): Promise<CreateGenerationResponseDto> {
    // Use default user ID for development phase
    const userId = DEFAULT_USER_ID;
    
    // Generate MD5 hash for the generation ID based on source text and timestamp
    const generationHash = this.generateHash(sourceText + Date.now().toString());
    // Start transaction by creating initial generation record
    const { data: generation, error: insertError } = await this.supabase
      .from('generations')
      .insert({
        id: generationHash,
        user_id: userId,
        source_text: sourceText,
        status: 'pending' as GenerationStatus,
        model: 'pending', // Will be updated after AI call
        generated_count: 0
      })
      .select('id')
      .single();

    if (insertError || !generation) {
      throw new Error(`Failed to create generation record: ${insertError?.message}`);
    }

    try {
      // Call AI service to generate flashcards
      const aiResponse = await this.callAIService(sourceText);
      
      // Limit the number of flashcards
      const limitedFlashcards = aiResponse.flashcards.slice(0, this.MAX_FLASHCARDS);
      
      // Prepare flashcard proposals for database insertion
      const flashcardInserts = limitedFlashcards.map(card => ({
        user_id: userId,
        generation_id: generation.id,
        front: card.front,
        back: card.back,
        source: 'ai_full' as const
      }));

      // Batch insert flashcards
      const { data: insertedFlashcards, error: flashcardsError } = await this.supabase
        .from('flashcards')
        .insert(flashcardInserts)
        .select('id, front, back, source');

      if (flashcardsError) {
        throw new Error(`Failed to insert flashcards: ${flashcardsError.message}`);
      }

      // Update generation record with success status
      const { error: updateError } = await this.supabase
        .from('generations')
        .update({
          status: 'completed' as GenerationStatus,
          model: aiResponse.model,
          generated_count: insertedFlashcards?.length || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', generation.id);

      if (updateError) {
        throw new Error(`Failed to update generation status: ${updateError.message}`);
      }

      // Prepare response
      const flashcardProposals: FlashcardProposalDto[] = (insertedFlashcards || []).map(card => ({
        id: card.id,
        front: card.front,
        back: card.back,
        source: card.source
      }));

      return {
        id: generation.id,
        model: aiResponse.model,
        status: 'completed',
        generated_count: flashcardProposals.length,
        flashcards_proposals: flashcardProposals
      };

    } catch (error) {
      // Handle AI service or database errors
      await this.handleGenerationError(generation.id, error as Error);
      throw error;
    }
  }

  /**
   * Calls the AI service to generate flashcards from source text
   */
  private async callAIService(sourceText: string): Promise<AIServiceResponse> {
    const openrouterApiKey = import.meta.env.OPENROUTER_API_KEY;
    
    if (!openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    const prompt = this.buildAIPrompt(sourceText);
    
    let lastError: Error | null = null;
    
    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.AI_TIMEOUT);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://10xcards.app',
            'X-Title': '10xCards'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4000
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`AI service returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices?.[0]?.message?.content) {
          throw new Error('Invalid response format from AI service');
        }

        // Parse the JSON response from AI
        const aiContent = data.choices[0].message.content;
        let parsedContent: any;
        
        try {
          parsedContent = JSON.parse(aiContent);
        } catch (parseError) {
          throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
        }

        // Validate the AI response structure
        const validatedResponse = aiServiceResponseSchema.parse({
          flashcards: parsedContent.flashcards || [],
          model: data.model || 'anthropic/claude-3.5-sonnet'
        });

        return validatedResponse;

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on validation errors or abort errors
        if (error instanceof Error && 
            (error.name === 'AbortError' || error.message.includes('parse'))) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('AI service call failed after all retries');
  }

  /**
   * Builds the prompt for AI service to generate flashcards
   */
  private buildAIPrompt(sourceText: string): string {
    return `Please analyze the following text and create flashcards for learning. Generate between 5 and ${this.MAX_FLASHCARDS} flashcards based on the key concepts, facts, and important information in the text.

For each flashcard:
- Front: A clear, concise question or prompt
- Back: A comprehensive but concise answer

Return the response as a JSON object with this exact structure:
{
  "flashcards": [
    {
      "front": "Question or prompt text",
      "back": "Answer or explanation text"
    }
  ]
}

Text to analyze:
${sourceText}

Important: Return only the JSON object, no additional text or formatting.`;
  }

  /**
   * Handles errors during generation process
   */
  /**
   * Generates MD5 hash for unique identification
   */
  private generateHash(input: string): string {
    return createHash('md5').update(input).digest('hex');
  }

  private async handleGenerationError(generationId: string, error: Error): Promise<void> {
    try {
      // Log the error
      await this.supabase
        .from('generation_error_logs')
        .insert({
          generation_id: generationId,
          error_message: error.message
        });

      // Update generation status to failed
      await this.supabase
        .from('generations')
        .update({
          status: 'failed' as GenerationStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', generationId);

    } catch (logError) {
      // If we can't log the error, at least log it to console
      console.error('Failed to log generation error:', logError);
      console.error('Original error:', error);
    }
  }
}
