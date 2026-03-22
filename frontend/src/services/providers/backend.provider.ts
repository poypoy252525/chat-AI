import type { LLMProvider, LLMMessage } from "@/types/llm";
import axiosInstance from "../providers/axios-instance";
import { streamSSE } from "@/lib/sse";

/**
 * Backend LLM Provider Implementation
 * 
 * Delegates LLM generation to the Django backend.
 * Uses the backend's SSE stream endpoint for real-time responses.
 */
export class BackendLLMProvider implements LLMProvider {
  public readonly name = "backend";

  constructor() {
    // No specific config needed for backend provider as it uses axiosInstance
  }

  isConfigured(): boolean {
    // Backend provider is always "configured" as long as the API is reachable
    return true;
  }

  async *generateStreamingResponse(
    messages: LLMMessage[],
    options?: {
      conversationId?: string;
      signal?: AbortSignal;
      [key: string]: any;
    }
  ): AsyncGenerator<string, void, unknown> {
    const conversationId = options?.conversationId;
    if (!conversationId) {
      throw new Error("Conversation ID is required for backend streaming");
    }

    const lastMessage = messages[messages.length - 1];
    const url = `chat/conversations/${conversationId}/messages/stream/`;

    try {
      const stream = streamSSE<{ text: string }>(
        axiosInstance,
        url,
        {
          content: lastMessage.content,
          settings: {
            provider: "gemini", // Default or from options
            ...options
          }
        },
        options?.signal
      );

      for await (const chunk of stream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      console.error(`Error generating response from ${this.name}:`, error);
      if (error instanceof Error) {
        throw new Error(`${this.name} Error: ${error.message}`);
      }
      throw new Error(`Failed to generate response from ${this.name}`);
    }
  }
}
