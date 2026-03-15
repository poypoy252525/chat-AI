import type { LLMProvider, LLMMessage, LLMConfig } from "@/types/llm";

/**
 * OpenAI Provider Implementation
 *
 * Implements LLMProvider interface for OpenAI's API.
 * Ready for integration when OpenAI support is needed.
 */
export class OpenAIProvider implements LLMProvider {
  public readonly name = "openai";
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: LLMConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.apiKey = config.apiKey;
    this.model = config.model || "gpt-4";
    this.baseURL = config.baseURL || "https://api.openai.com/v1";
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async *generateStreamingResponse(
    messages: LLMMessage[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Convert messages to OpenAI format
      const openAIMessages = messages.map((msg) => {
        // If no images, use simple string content format
        if (!msg.images || msg.images.length === 0) {
          return {
            role: msg.role,
            content: msg.content,
          };
        }

        // If images exist, use array content format
        const content: Array<{
          type: string;
          text?: string;
          image_url?: { url: string };
        }> = [];

        // Add text content if it exists
        if (msg.content) {
          content.push({
            type: "text",
            text: msg.content,
          });
        }

        // Add images
        for (const image of msg.images) {
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${image.type};base64,${image.data}`,
            },
          });
        }

        return {
          role: msg.role,
          content,
        };
      });

      // Add math formatting instruction if needed
      const conversationText = messages
        .map((m) => m.content)
        .join(" ")
        .toLowerCase();
      if (this.detectMathContent(conversationText)) {
        openAIMessages.unshift({
          role: "system",
          content:
            "When providing mathematical expressions, always use LaTeX syntax with dollar signs: $expression$ for inline math and $$expression$$ for block math.",
        });
      }

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: openAIMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") return;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  yield content;
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error(`Error generating response from ${this.name}:`, error);
      if (error instanceof Error) {
        throw new Error(`${this.name} Error: ${error.message}`);
      }
      throw new Error(`Failed to generate response from ${this.name}`);
    }
  }

  /**
   * Detect if conversation contains mathematical content
   */
  private detectMathContent(text: string): boolean {
    const mathKeywords =
      /\b(equation|formula|math|solve|calculate|quadratic|algebra|geometry|calculus|function|derivative|integral|matrix|vector|polynomial|coefficient|variable|solution|theorem|proof|x\^|\^2|sqrt|fraction|percent)\b/;
    return mathKeywords.test(text);
  }
}
