import type {
  LLMProviderRegistry,
  LLMProviderFactory,
  LLMProviderType,
  LLMProvider,
  LLMConfig,
} from "@/types/llm";
import { GoogleGenAIProvider } from "./providers/google-genai.provider";
import { OpenAIProvider } from "./providers/openai.provider";

/**
 * LLM Provider Registry Implementation
 *
 * Centralized registry for managing different LLM providers.
 * Supports dynamic registration and creation of providers.
 * Follows clean architecture and factory pattern principles.
 */
class LLMProviderRegistryImpl implements LLMProviderRegistry {
  private factories = new Map<LLMProviderType, LLMProviderFactory>();

  constructor() {
    // Register built-in providers
    this.registerBuiltInProviders();
  }

  register(type: LLMProviderType, factory: LLMProviderFactory): void {
    this.factories.set(type, factory);
  }

  create(type: LLMProviderType, config: LLMConfig): LLMProvider {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`LLM provider type '${type}' is not registered`);
    }

    return factory(config);
  }

  getAvailableProviders(): LLMProviderType[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Register built-in providers
   */
  private registerBuiltInProviders(): void {
    // Google GenAI Provider
    this.register(
      "google-genai",
      (config: LLMConfig) => new GoogleGenAIProvider(config)
    );

    // OpenAI Provider
    this.register("openai", (config: LLMConfig) => new OpenAIProvider(config));

    // Additional providers can be registered here
    // this.register("anthropic", (config: LLMConfig) => new AnthropicProvider(config));
  }
}

// Export singleton instance
export const llmRegistry = new LLMProviderRegistryImpl();

/**
 * LLM Service Factory
 *
 * High-level factory for creating LLM providers with environment-based configuration
 */
export class LLMServiceFactory {
  /**
   * Create LLM provider from environment configuration
   */
  static createFromEnvironment(): LLMProvider {
    const providerType =
      (import.meta.env.VITE_LLM_PROVIDER as LLMProviderType) || "google-genai";

    const config = LLMServiceFactory.getConfigForProvider(providerType);

    return llmRegistry.create(providerType, config);
  }

  /**
   * Create LLM provider with explicit configuration
   */
  static create(type: LLMProviderType, config: LLMConfig): LLMProvider {
    return llmRegistry.create(type, config);
  }

  /**
   * Get configuration for specific provider from environment
   */
  private static getConfigForProvider(type: LLMProviderType): LLMConfig {
    switch (type) {
      case "google-genai":
        return {
          apiKey: import.meta.env.VITE_GENAI_KEY || "",
          model: import.meta.env.VITE_GENAI_MODEL || "gemini-2.5-flash",
        };

      case "openai":
        return {
          apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
          model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4",
          baseURL: import.meta.env.VITE_OPENAI_BASE_URL,
        };

      default:
        throw new Error(
          `No environment configuration available for provider: ${type}`
        );
    }
  }

  /**
   * Get available providers
   */
  static getAvailableProviders(): LLMProviderType[] {
    return llmRegistry.getAvailableProviders();
  }
}
