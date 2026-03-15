import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { AlertCircle, MessageSquare, RefreshCw } from "lucide-react";
import { memo, useEffect, useRef, useCallback } from "react";
import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";

interface ChatInterfaceProps {
  className?: string;
}

const ChatInterface = memo<ChatInterfaceProps>(({ className }) => {
  const { messages, isLoading, error, sendMessage, retryLastMessage } =
    useChat();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  // Check if user is at the bottom of the scroll area
  const isAtBottom = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return false;

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport) return false;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const threshold = 100; // Increased threshold for better UX
    return scrollTop + clientHeight >= scrollHeight - threshold;
  }, []);

  // Handle scroll events to detect user intent
  const handleScroll = useCallback(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const viewport = scrollArea.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport) return;

    const currentScrollTop = viewport.scrollTop;
    const previousScrollTop = lastScrollTopRef.current;

    // If user scrolled up manually (not programmatic), disable auto-scroll
    if (currentScrollTop < previousScrollTop) {
      shouldAutoScrollRef.current = false;
    }

    // If user scrolled to bottom, re-enable auto-scroll
    if (isAtBottom()) {
      shouldAutoScrollRef.current = true;
    }

    lastScrollTopRef.current = currentScrollTop;
  }, [isAtBottom]);

  // Attach scroll listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    const viewport = scrollArea?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );

    if (viewport) {
      viewport.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        viewport.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  // Auto-scroll when new content arrives (simplified logic)
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

  // Error display component
  const ErrorDisplay = memo(() => {
    if (!error) return null;

    return (
      <div className="bg-background">
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

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background overflow-hidden",
        className
      )}
    >
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-2 p-3 sm:p-4 lg:p-6">
              {messages.length === 0 ? (
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
            onSendMessage={sendMessage}
            disabled={isLoading}
            className="border-none shadow-none bg-transparent"
            placeholder={isLoading ? "AI is thinking..." : "Message Chatbot"}
          />
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";

export { ChatInterface };
