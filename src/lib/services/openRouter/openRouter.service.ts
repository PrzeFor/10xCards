import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { z } from 'zod';

import type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatRole,
  JSONSchema,
  OpenRouterServiceOptions,
  ResponseFormat
} from './openRouter.types';
import { OpenRouterError } from './openRouter.types';

// ============================================================================
// Internal Types
// ============================================================================

/**
 * Request payload sent to OpenRouter API (internal use only)
 */
interface RequestPayload {
  model: string;
  messages: ChatMessage[];
  response_format?: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

// ============================================================================
// OpenRouter Service Implementation
// ============================================================================

/**
 * Service for interacting with the OpenRouter API
 * 
 * Handles:
 * - Configuration and authorization
 * - Building and sending chat completion requests
 * - Parsing responses according to JSON schemas
 * - Error handling and logging
 * - Retry logic with exponential backoff
 * 
 * @example
 * ```ts
 * const service = new OpenRouterService(apiKey, {
 *   defaultModel: 'anthropic/claude-3.5-sonnet'
 * });
 * 
 * const messages = [
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: 'Hello!' }
 * ];
 * 
 * const response = await service.sendChatCompletion(messages);
 * ```
 */
export class OpenRouterService {
  // Public fields
  public readonly apiKey: string;
  public baseUrl: string;
  public defaultModel: string;
  public defaultResponseFormat?: ResponseFormat;

  // Private fields
  private readonly axiosInstance: AxiosInstance;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private systemMessage?: string;

  /**
   * Creates a new OpenRouterService instance
   * 
   * @param apiKey - OpenRouter API key (required)
   * @param options - Configuration options
   * @param options.baseUrl - Base URL for OpenRouter API (default: 'https://openrouter.ai/api/v1')
   * @param options.defaultModel - Default model to use (default: 'openai/gpt-4o-mini')
   * @param options.defaultResponseFormat - Default response format
   * @param options.timeout - Request timeout in milliseconds (default: 60000)
   * @param options.maxRetries - Maximum number of retries (default: 3)
   * @param options.retryDelay - Initial retry delay in milliseconds (default: 1000)
   * 
   * @throws {OpenRouterError} If API key is not provided
   */
  constructor(apiKey: string, options?: OpenRouterServiceOptions) {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new OpenRouterError(
        'API key is required',
        'MISSING_API_KEY'
      );
    }

    // Initialize public fields
    this.apiKey = apiKey;
    this.baseUrl = options?.baseUrl ?? 'https://openrouter.ai/api/v1';
    this.defaultModel = options?.defaultModel ?? 'openai/gpt-4o-mini';
    this.defaultResponseFormat = options?.defaultResponseFormat;

    // Initialize private fields
    this.timeout = options?.timeout ?? 60000; // 60 seconds
    this.maxRetries = options?.maxRetries ?? 3;
    this.retryDelay = options?.retryDelay ?? 1000; // 1 second

    // Create axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://10xcards.app',
        'X-Title': '10xCards'
      }
    });
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Sends a chat completion request to OpenRouter API
   * 
   * @param messages - Array of chat messages
   * @param options - Optional configuration for this request
   * @returns Promise resolving to the chat response
   * 
   * @throws {OpenRouterError} If the request fails or response is invalid
   */
  public async sendChatCompletion(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    // Validate input
    if (!messages || messages.length === 0) {
      throw new OpenRouterError(
        'At least one message is required',
        'INVALID_INPUT'
      );
    }

    // Prepend system message if set
    const allMessages = this.systemMessage
      ? [{ role: 'system' as ChatRole, content: this.systemMessage }, ...messages]
      : messages;

    // Build request payload
    const payload = this.buildPayload(allMessages, options);

    // Send request with retry logic
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.post<ChatResponse>(
          '/chat/completions',
          payload
        );

        // Handle and validate response
        return await this.handleResponse(response.data, options?.response_format);
      } catch (error) {
        lastError = error as Error;
        
        // Determine if we should retry
        const shouldRetry = this.shouldRetry(error as AxiosError, attempt);
        
        if (!shouldRetry) {
          throw this.handleError(error as AxiosError);
        }

        // Wait before retrying with exponential backoff
        const delay = this.calculateBackoffDelay(attempt);
        await this.sleep(delay);
        
        this.logError({
          message: `Retry attempt ${attempt + 1}/${this.maxRetries}`,
          error: lastError
        });
      }
    }

    // All retries exhausted
    throw new OpenRouterError(
      `Request failed after ${this.maxRetries} retries`,
      'MAX_RETRIES_EXCEEDED',
      undefined,
      lastError ?? undefined
    );
  }

  /**
   * Sets the default model for future requests
   * 
   * @param modelName - Name of the model to use
   */
  public setModel(modelName: string): void {
    if (!modelName || modelName.trim() === '') {
      throw new OpenRouterError(
        'Model name cannot be empty',
        'INVALID_MODEL_NAME'
      );
    }
    this.defaultModel = modelName;
  }

  /**
   * Sets the system message for future requests
   * 
   * @param message - System message content
   */
  public setSystemMessage(message: string): void {
    if (message && message.trim() !== '') {
      this.systemMessage = message;
    } else {
      this.systemMessage = undefined;
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Builds the request payload from messages and options
   */
  private buildPayload(
    messages: ChatMessage[],
    options?: ChatOptions
  ): RequestPayload {
    const payload: RequestPayload = {
      model: options?.model ?? this.defaultModel,
      messages: messages,
    };

    // Add response format if provided
    const responseFormat = options?.response_format ?? this.defaultResponseFormat;
    if (responseFormat) {
      payload.response_format = responseFormat;
    }

    // Add model parameters if provided
    if (options?.model_params) {
      const params = options.model_params;
      if (params.temperature !== undefined) payload.temperature = params.temperature;
      if (params.max_tokens !== undefined) payload.max_tokens = params.max_tokens;
      if (params.top_p !== undefined) payload.top_p = params.top_p;
      if (params.frequency_penalty !== undefined) payload.frequency_penalty = params.frequency_penalty;
      if (params.presence_penalty !== undefined) payload.presence_penalty = params.presence_penalty;
    }

    return payload;
  }

  /**
   * Handles and validates the API response
   */
  private async handleResponse(
    data: ChatResponse,
    responseFormat?: ResponseFormat
  ): Promise<ChatResponse> {
    // Validate basic response structure
    if (!data.choices || data.choices.length === 0) {
      throw new OpenRouterError(
        'Invalid response format: no choices returned',
        'INVALID_RESPONSE_FORMAT'
      );
    }

    const messageContent = data.choices[0]?.message?.content;
    if (!messageContent) {
      throw new OpenRouterError(
        'Invalid response format: no message content',
        'INVALID_RESPONSE_FORMAT'
      );
    }

    // Validate JSON schema if response format is specified
    if (responseFormat) {
      const isValid = this.validateSchema(messageContent, responseFormat);
      if (!isValid) {
        throw new OpenRouterError(
          'Response does not match expected schema',
          'SCHEMA_VALIDATION_FAILED'
        );
      }
    }

    return data;
  }

  /**
   * Validates response content against JSON schema
   */
  private validateSchema(content: string, format: ResponseFormat): boolean {
    try {
      // Parse JSON content
      const parsedContent = JSON.parse(content);
      
      // Convert JSON schema to Zod schema
      const zodSchema = this.jsonSchemaToZod(format.json_schema.schema);
      
      // Validate using Zod
      zodSchema.parse(parsedContent);
      
      return true;
    } catch (error) {
      this.logError({
        message: 'Schema validation failed',
        error: error as Error
      });
      return false;
    }
  }

  /**
   * Converts JSON schema to Zod schema for validation
   */
  private jsonSchemaToZod(schema: JSONSchema): z.ZodTypeAny {
    // Basic implementation - can be extended for more complex schemas
    if (schema.type === 'object' && schema.properties) {
      const shape: Record<string, z.ZodTypeAny> = {};
      
      for (const [key, value] of Object.entries(schema.properties)) {
        const propSchema = value as JSONSchema;
        
        if (propSchema.type === 'string') {
          shape[key] = z.string();
        } else if (propSchema.type === 'number') {
          shape[key] = z.number();
        } else if (propSchema.type === 'boolean') {
          shape[key] = z.boolean();
        } else if (propSchema.type === 'array') {
          shape[key] = z.array(z.any());
        } else {
          shape[key] = z.any();
        }
        
        // Make optional if not in required array
        if (!schema.required?.includes(key)) {
          shape[key] = shape[key].optional();
        }
      }
      
      return z.object(shape);
    }
    
    return z.any();
  }

  /**
   * Determines if a request should be retried
   */
  private shouldRetry(error: AxiosError, attempt: number): boolean {
    // Don't retry if max attempts reached
    if (attempt >= this.maxRetries) {
      return false;
    }

    // Retry on network errors
    if (!error.response) {
      return true;
    }

    // Retry on specific status codes
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.response.status);
  }

  /**
   * Calculates exponential backoff delay
   */
  private calculateBackoffDelay(attempt: number): number {
    return this.retryDelay * Math.pow(2, attempt);
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handles axios errors and converts them to OpenRouterError
   */
  private handleError(error: AxiosError): OpenRouterError {
    // Network error
    if (!error.response) {
      return new OpenRouterError(
        'Network error: Unable to reach OpenRouter API',
        'NETWORK_ERROR',
        undefined,
        error
      );
    }

    const status = error.response.status;
    const data = error.response.data as any;

    // Map status codes to error types
    switch (status) {
      case 401:
        return new OpenRouterError(
          'Authentication failed: Invalid API key',
          'AUTHENTICATION_FAILED',
          status,
          error
        );
      
      case 429:
        return new OpenRouterError(
          'Rate limit exceeded: Too many requests',
          'RATE_LIMIT_EXCEEDED',
          status,
          error
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        return new OpenRouterError(
          `Server error: ${data?.error?.message ?? 'OpenRouter API is temporarily unavailable'}`,
          'SERVER_ERROR',
          status,
          error
        );
      
      default:
        return new OpenRouterError(
          `API request failed: ${data?.error?.message ?? error.message}`,
          'API_REQUEST_FAILED',
          status,
          error
        );
    }
  }

  /**
   * Logs errors (can be extended to use proper logging service)
   */
  private logError(errorInfo: { message: string; error?: Error }): void {
    // In production, this should use a proper logging service
    // For now, we'll just log to console in development
    if (import.meta.env.DEV) {
      console.error('[OpenRouterService]', errorInfo.message, errorInfo.error);
    }
  }
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatRole,
  JSONSchema,
  ModelParams,
  OpenRouterServiceOptions,
  ResponseFormat
} from './openRouter.types';
export { OpenRouterError } from './openRouter.types';



