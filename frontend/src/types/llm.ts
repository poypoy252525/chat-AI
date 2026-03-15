/**
 * LLM Provider Types
 *
 * Defines interfaces and types for AI/LLM provider abstraction.
 * Supports multiple providers with consistent API.
 */

export interface LLMMessage {
  role: "user" | "assistant" | "system";
  content: string;
  images?: {
    type: string;
    data: string; // base64 encoded
  }[];
}

export interface LLMProvider {
  /**
   * Generate streaming response from the LLM
   * @param messages - Conversation history
   * @returns AsyncGenerator yielding text chunks
   */
  generateStreamingResponse(
    messages: LLMMessage[]
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Provider identifier
   */
  readonly name: string;

  /**
   * Check if provider is configured and ready
   */
  isConfigured(): boolean;
}

export interface LLMConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  [key: string]: string | number | boolean | undefined; // Additional provider-specific config
}

export type LLMProviderType =
  | "google-genai"
  | "openai"
  | "anthropic"
  | "custom";

/**
 * Factory function type for creating LLM providers
 */
export type LLMProviderFactory = (config: LLMConfig) => LLMProvider;

/**
 * Registry for LLM provider factories
 */
export interface LLMProviderRegistry {
  register(type: LLMProviderType, factory: LLMProviderFactory): void;
  create(type: LLMProviderType, config: LLMConfig): LLMProvider;
  getAvailableProviders(): LLMProviderType[];
}
