/**
 * OpenRouter Service Types
 *
 * Type definitions for the OpenRouter API integration
 */

// ============================================================================
// Chat Message Types
// ============================================================================

/**
 * Message role in the chat conversation
 */
export type ChatRole = 'system' | 'user' | 'assistant';

/**
 * Single chat message
 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// ============================================================================
// JSON Schema Types
// ============================================================================

/**
 * JSON Schema definition for structured responses
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

/**
 * Response format configuration
 */
export interface ResponseFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: JSONSchema;
  };
}

// ============================================================================
// Request Options Types
// ============================================================================

/**
 * Model parameters for the AI request
 */
export interface ModelParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Options for chat completion request
 */
export interface ChatOptions {
  model?: string;
  response_format?: ResponseFormat;
  model_params?: ModelParams;
}

/**
 * Constructor options for OpenRouterService
 */
export interface OpenRouterServiceOptions {
  baseUrl?: string;
  defaultModel?: string;
  defaultResponseFormat?: ResponseFormat;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Successful chat completion response
 */
export interface ChatResponse {
  id: string;
  model: string;
  created: number;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error class for OpenRouter API errors
 */
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'OpenRouterError';
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}
