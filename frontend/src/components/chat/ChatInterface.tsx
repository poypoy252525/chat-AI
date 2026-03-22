import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { AlertCircle, MessageSquare, RefreshCw } from "lucide-react";
import { memo, useEffect, useRef, useCallback, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import chatService from "@/services/chat-service";
import type { ImageAttachment } from "@/types/chat";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = memo<ChatInterfaceProps>(({ className }) => {
  const { id: conversationId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isHomeRoute = !conversationId;

  const { messages, isLoading, error, sendMessage, retryLastMessage } =
    useChat(conversationId);

  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const location = useLocation();
  const initialSendTriggered = useRef<string | null>(null);

  // Reset loading state when conversation ID changes
  useEffect(() => {
    setIsCreatingConversation(false);
  }, [conversationId]);

  // Handle initial message from navigation state
  useEffect(() => {
    const state = location.state as {
      initialMessage?: string;
      initialImages?: ImageAttachment[];
    } | null;
    
    // Check if we have an initial message and it's for this specific conversation
    // and we haven't already triggered it for this ID.
    if (
      state?.initialMessage && 
      conversationId && 
      initialSendTriggered.current !== conversationId &&
      messages.length === 0 && 
      !isLoading
    ) {
      initialSendTriggered.current = conversationId;
      sendMessage(state.initialMessage, state.initialImages);
      // Clear state so it doesn't refire on internal component updates or refreshes
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [conversationId, messages.length, isLoading, location.state, sendMessage, navigate, location.pathname]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  // Check if user is at the bottom of the scroll area
  const isAtBottom = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return false;

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return false;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const threshold = 100;
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, []);

  // Handle scroll events to detect user intent
  const handleScroll = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;

    const currentScrollTop = viewport.scrollTop;
    const previousScrollTop = lastScrollTopRef.current;

    if (currentScrollTop < previousScrollTop) {
      shouldAutoScrollRef.current = false;
    }

    if (isAtBottom()) {
      shouldAutoScrollRef.current = true;
    }

    lastScrollTopRef.current = currentScrollTop;
  }, [isAtBottom]);

  // Attach scroll listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    const viewport = scrollArea?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );

    if (viewport) {
      viewport.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        viewport.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // Auto-scroll when new content arrives
  useEffect(() => {
    if (shouldAutoScrollRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  // Reset auto-scroll when new conversation starts
  useEffect(() => {
    if (messages.length === 0) {
      shouldAutoScrollRef.current = true;
    }
  }, [messages.length]);

  /**
   * When at the home route ("/"), intercept the first send:
   *  1. Call the backend to create a new conversation (returns Conversation with id)
   *  2. Navigate to /chat/:id  (this remounts ChatInterface with the new id)
   *  3. The initial message will be handled by the useEffect above
   */
  const handleSendMessage = useCallback(
    async (content: string, images?: ImageAttachment[]) => {
      if (!content.trim() && !images?.length) return;

      if (isHomeRoute) {
        setIsCreatingConversation(true);
        try {
          // Send to backend — creates conversation and returns its id
          const conversation = await chatService.sendMessage(content);
          // Navigate to the new conversation with the initial message in state
          navigate(`/chat/${conversation.id}`, { 
            replace: true,
            state: { initialMessage: content, initialImages: images }
          });
        } catch (err) {
          console.error("Failed to create conversation:", err);
          setIsCreatingConversation(false);
          // Fall back to local chat so user isn't blocked
          sendMessage(content, images);
        }
      } else {
        sendMessage(content, images);
      }
    },
    [isHomeRoute, navigate, sendMessage],
  );

  // Error display component
  const ErrorDisplay = memo(() => {
    if (!error) return null;

    return (
      <div className="flex-1 bg-background">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-6 pb-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-3">
              <span className="flex-1">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={retryLastMessage}
                disabled={isLoading}
                className="h-8 px-3 text-xs shrink-0"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  });

  ErrorDisplay.displayName = "ErrorDisplay";

  const busy = isLoading || isCreatingConversation;

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full bg-background overflow-hidden",
        className,
      )}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-2 p-3 sm:p-4 lg:p-6">
              {messages.length === 0 ? (
                isLoading && conversationId ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                    <p className="text-muted-foreground">Loading conversation...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
                    <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mb-4 sm:mb-6" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                      Delfin Chatbot
                    </h2>
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 ">
                      How can I help you today?
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-sm sm:max-w-md tracking-tight">
                      Start a conversation by typing a message below.
                    </p>
                  </div>
                )
              ) : (
                messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onRetry={
                      index === messages.length - 1
                        ? retryLastMessage
                        : undefined
                    }
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Error Display */}
      <ErrorDisplay />

      {/* Input Area */}
      <div className="bg-background">
        <div className="max-w-3xl mx-auto">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={busy}
            className="border-none shadow-none bg-transparent"
            placeholder={busy ? "Creating conversation…" : "Message Chatbot"}
          />
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";

export { ChatInterface };
