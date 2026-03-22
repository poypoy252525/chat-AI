import { useState, useCallback, useRef, useEffect } from "react";
import type { Message, ChatHook, ImageAttachment } from "@/types/chat";
import type { LLMProvider, LLMMessage } from "@/types/llm";
import { LLMServiceFactory } from "@/services/llm-registry";
import chatService from "@/services/chat-service";

// Utility function to generate unique IDs
const generateId = () =>
  Math.random().toString(36).substring(2) + Date.now().toString(36);

// Convert internal Message type to LLM Message type
const convertToLLMMessage = (message: Message): LLMMessage => ({
  role: message.role as "user" | "assistant",
  content: message.content,
  images: message.images?.map((img) => ({
    type: img.type,
    data: img.base64,
  })),
});

// Initialize LLM Service singleton
const getLLMProvider = (): LLMProvider => {
  return LLMServiceFactory.createFromEnvironment();
};

export const useChat = (conversationId?: string): ChatHook => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(!!conversationId);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const llmProvider = useRef<LLMProvider | null>(null);

  // Initialize LLM provider lazily
  const getLLM = useCallback(() => {
    if (!llmProvider.current) {
      llmProvider.current = getLLMProvider();
    }
    return llmProvider.current;
  }, []);

  // Fetch conversation history if ID is provided
  useEffect(() => {
    const fetchHistory = async () => {
      if (!conversationId) {
        setMessages([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await chatService.getMessages(conversationId);
        const history: Message[] = response.results.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role === "assistant" ? "assistant" : "user",
          timestamp: new Date(msg.created_at),
          metadata: msg.metadata,
        }));
        
        // Only set the history if we don't have active messages already
        // (to prevent overwriting a stream that started after the fetch triggered)
        setMessages((prev) => (prev.length === 0 ? history : prev));
      } catch (err) {
        console.error("Failed to fetch message history:", err);
        setError("Failed to load conversation history.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, images?: ImageAttachment[]) => {
      if ((!content.trim() && !images?.length) || isLoading) return;

      const userMessage: Message = {
        id: generateId(),
        content: content.trim(),
        role: "user",
        timestamp: new Date(),
        images,
      };

      const assistantMessageId = generateId();
      const loadingMessage: Message = {
        id: assistantMessageId,
        content: "",
        role: "assistant",
        timestamp: new Date(),
        isLoading: true,
      };

      // Add user message and loading indicator
      setMessages((prev) => [...prev, userMessage, loadingMessage]);
      setIsLoading(true);
      setError(null);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const llm = getLLM();
        let accumulatedContent = "";

        // Get all messages up to the current user message for context
        const conversationHistory = [...messages, userMessage];

        // Convert to LLM message format
        const llmMessages = conversationHistory.map(convertToLLMMessage);

        // Stream the response from the backend
        const generator = llm.generateStreamingResponse(llmMessages, {
          conversationId,
          signal: abortController.signal,
        });

        for await (const chunk of generator) {
          // Check if aborted
          if (abortController.signal.aborted) {
            break;
          }

          accumulatedContent += chunk;

          // Update the assistant message with accumulated content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: accumulatedContent,
                    isLoading: false,
                  }
                : msg
            )
          );
        }

        // Final update to ensure loading state is cleared
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: accumulatedContent || "No response generated.",
                  isLoading: false,
                }
              : msg
          )
        );
      } catch (err) {
        if (
          (err instanceof Error && (err.name === "AbortError" || err.message?.includes("canceled"))) ||
          (err && typeof err === "object" && "isAxiosError" in err && (err as any).name === "CanceledError")
        ) {
          // Request was aborted or canceled, don't show error
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Something went wrong";
        setError(errorMessage);

        // Remove loading message on error
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId)
        );
      } finally {
        setIsLoading(false);
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [isLoading, getLLM, messages, conversationId]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");

    if (!lastUserMessage || isLoading) return;

    // Remove the last assistant message if it exists
    setMessages((prev) => {
      const lastAssistantIndex = prev.length - 1;
      if (
        lastAssistantIndex >= 0 &&
        prev[lastAssistantIndex].role === "assistant"
      ) {
        return prev.slice(0, lastAssistantIndex);
      }
      return prev;
    });

    const assistantMessageId = generateId();
    const loadingMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isLoading: true,
    };

    // Add loading indicator
    setMessages((prev) => [...prev, loadingMessage]);
    setIsLoading(true);
    setError(null);

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const llm = getLLM();
      let accumulatedContent = "";

      // Get all messages up to the last user message
      let lastUserIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          lastUserIndex = i;
          break;
        }
      }
      const conversationHistory = messages.slice(0, lastUserIndex + 1);

      // Convert to LLM message format
      const llmMessages = conversationHistory.map(convertToLLMMessage);

      // Stream the response from the backend
      const generator = llm.generateStreamingResponse(llmMessages, {
        conversationId,
        signal: abortController.signal,
      });

      for await (const chunk of generator) {
        // Check if aborted
        if (abortController.signal.aborted) {
          break;
        }

        accumulatedContent += chunk;

        // Update the assistant message with accumulated content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: accumulatedContent,
                  isLoading: false,
                }
              : msg
          )
        );
      }

      // Final update to ensure loading state is cleared
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: accumulatedContent || "No response generated.",
                isLoading: false,
              }
            : msg
        )
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was aborted, don't update state
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);

      // Remove loading message on error
      setMessages((prev) =>
        prev.filter((msg) => msg.id !== assistantMessageId)
      );
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [messages, isLoading, getLLM, conversationId]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    retryLastMessage,
  };
};
