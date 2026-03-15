import type { LLMProvider, LLMMessage, LLMConfig } from "@/types/llm";
import { GoogleGenAI } from "@google/genai";

/**
 * Google GenAI Provider Implementation
 *
 * Implements LLMProvider interface for Google's GenAI service.
 * Handles math content detection and LaTeX formatting instructions.
 */
export class GoogleGenAIProvider implements LLMProvider {
  public readonly name = "google-genai";
  private client: GoogleGenAI;
  private model: string;

  constructor(config: LLMConfig) {
    if (!config.apiKey) {
      throw new Error("Google GenAI API key is required");
    }

    this.client = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || "gemini-2.5-flash-lite";
  }

  async loadPrompt(): Promise<string> {
    const response = await fetch("/prompt.txt");
    return response.text();
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  async *generateStreamingResponse(
    messages: LLMMessage[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Use direct system prompt for faster response
      const prompt = await this.loadPrompt();

      console.log(prompt);

      // Convert messages to Google GenAI format
      const contents = messages.map((msg) => {
        const parts: Array<
          { text: string } | { inlineData: { mimeType: string; data: string } }
        > = [];

        // Add text content if it exists
        if (msg.content) {
          // No longer prepend system prompt to user messages
          parts.push({ text: msg.content });
        }

        // Add images if they exist
        if (msg.images && msg.images.length > 0) {
          for (const image of msg.images) {
            parts.push({
              inlineData: {
                mimeType: image.type,
                data: image.data,
              },
            });
          }
        }

        return {
          role: msg.role === "user" ? "user" : "model",
          parts,
        };
      });

      // Smart math detection and instruction injection
      const conversationText = messages
        .map((m) => m.content)
        .join(" ")
        .toLowerCase();
      const hasMathKeywords = this.detectMathContent(conversationText);

      if (hasMathKeywords) {
        const mathInstruction = this.createMathInstruction();
        contents.unshift(mathInstruction);
      }

      const response = await this.client.models.generateContentStream({
        model: this.model,
        config: {
          systemInstruction: prompt,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
        contents,
      });

      for await (const chunk of response) {
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

  /**
   * Detect if conversation contains mathematical content
   */
  private detectMathContent(text: string): boolean {
    const mathKeywords =
      /\b(equation|formula|math|solve|calculate|quadratic|algebra|geometry|calculus|function|derivative|integral|matrix|vector|polynomial|coefficient|variable|solution|theorem|proof|x\^|\^2|sqrt|fraction|percent)\b/;
    return mathKeywords.test(text);
  }

  /**
   * Create math formatting instruction for the model
   */
  private createMathInstruction() {
    return {
      role: "model" as const,
      parts: [
        {
          text: "",
          //   text: "IMPORTANT: When providing mathematical expressions, always use LaTeX syntax with dollar signs for proper rendering:\n- For inline math: $expression$\n- For block math: $$expression$$\n\nExamples:\n- Quadratic formula: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n- Equation: $ax^2 + bx + c = 0$\n- Fractions: $\\frac{1}{2}$\n- Square roots: $\\sqrt{x}$\n- Superscripts: $x^2$\n- Subscripts: $H_2O$\n\nAlways format ALL mathematical content this way.",
        },
      ],
    };
  }
}
