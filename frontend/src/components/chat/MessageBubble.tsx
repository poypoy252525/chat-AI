import { memo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Bot, User, Copy, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
  className?: string;
}

const LoadingDots = memo(() => (
  <div className="flex items-center space-x-1 h-8">
    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
  </div>
));

LoadingDots.displayName = "LoadingDots";

const MessageBubble = memo<MessageBubbleProps>(
  ({ message, onRetry, className }) => {
    const isUser = message.role === "user";
    const isLoading = message.isLoading;
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
      if (!message.content || isLoading) return;
      try {
        // Modern clipboard API (works on desktop and secure contexts)
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(message.content);
        } else {
          // Fallback method for mobile browsers and non-secure contexts
          const textArea = document.createElement("textarea");
          textArea.value = message.content;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
        }
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500); // Reset after 1.5 seconds
      } catch (err) {
        console.error("Failed to copy message:", err);
        // Try the fallback method if modern API fails
        try {
          const textArea = document.createElement("textarea");
          textArea.value = message.content;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const successful = document.execCommand("copy");
          textArea.remove();
          if (successful) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1500);
          }
        } catch (fallbackErr) {
          console.error("Fallback copy also failed:", fallbackErr);
        }
      }
    };

    if (isUser) {
      // User message layout - aligned to the right
      return (
        <div className={cn("group w-full flex justify-end", className)}>
          <div className="flex gap-3 px-3 py-2 sm:px-6 max-w-[87%] lg:max-w-[80%]">
            {/* Message Content */}
            <div className="space-y-2 overflow-hidden w-full">
              {/* Images */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {message.images.map((image) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.name}
                      className="max-w-full max-h-48 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(image.url, "_blank")}
                      title={`Click to view ${image.name} in full size`}
                    />
                  ))}
                </div>
              )}

              {/* Text Content */}
              {message.content && (
                <div className="bg-muted text-foreground rounded-2xl px-4 py-3 w-fit ml-auto max-w-full">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-foreground transition-all duration-200",
                    isCopied && "text-green-600 scale-110"
                  )}
                  onClick={handleCopy}
                  disabled={!message.content}
                  title={isCopied ? "Copied!" : "Copy message"}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Avatar */}
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-muted text-foreground">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      );
    }

    // Assistant message layout - aligned to the left
    return (
      <div className={cn("group w-full", className)}>
        <div className="flex gap-3 sm:gap-4 px-3 py-3 sm:px-6 max-w-[95%] sm:max-w-[85%]">
          {/* Avatar */}
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>

          {/* Message Content */}
          <div className="flex-1 space-y-2 overflow-hidden">
            {isLoading ? (
              <LoadingDots />
            ) : (
              <MarkdownRenderer content={message.content} />
            )}

            {/* Action buttons */}
            {!isLoading && (
              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-muted-foreground hover:text-foreground transition-all duration-200",
                    isCopied && "text-green-600 scale-110"
                  )}
                  onClick={handleCopy}
                  disabled={!message.content}
                  title={isCopied ? "Copied!" : "Copy message"}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>

                {onRetry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={onRetry}
                    title="Retry message"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export { MessageBubble };
