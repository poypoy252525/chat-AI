import { useState, useRef, memo, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageAttachment } from "@/types/chat";

interface ChatInputProps {
  onSendMessage: (message: string, images?: ImageAttachment[]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const ChatInput = memo<ChatInputProps>(
  ({
    onSendMessage,
    disabled = false,
    className,
    placeholder = "Message ChatBot...",
  }) => {
    const [message, setMessage] = useState("");
    const [images, setImages] = useState<ImageAttachment[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
      const trimmedMessage = message.trim();
      if ((!trimmedMessage && images.length === 0) || disabled) return;

      onSendMessage(trimmedMessage, images.length > 0 ? images : undefined);
      setMessage("");
      setImages([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert("Please select only image files.");
          return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          alert("Image must be smaller than 5MB.");
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          const imageAttachment: ImageAttachment = {
            id:
              Math.random().toString(36).substring(2) + Date.now().toString(36),
            name: file.name,
            type: file.type,
            size: file.size,
            base64: base64.split(",")[1], // Remove data:image/xxx;base64, prefix
            url: base64, // Keep full data URL for preview
          };

          setImages((prev) => [...prev, imageAttachment]);
        };
        reader.readAsDataURL(file);
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const removeImage = (imageId: string) => {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    };

    const handleAttachClick = () => {
      fileInputRef.current?.click();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const handleTextareaChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      setMessage(e.target.value);

      // Auto-resize textarea
      const textarea = e.target;
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of ~8 lines
      textarea.style.height = `${newHeight}px`;
    };

    const canSend =
      (message.trim().length > 0 || images.length > 0) && !disabled;

    return (
      <div className={cn("px-3 pb-4 ", className)}>
        <div className="relative w-full border border-input rounded-2xl bg-background transition-all overflow-hidden">
          {/* Image previews */}
          {images.length > 0 && (
            <div className="px-4 pt-3 pb-2">
              <div className="flex flex-wrap gap-2">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-16 h-16 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "min-h-[48px] max-h-[200px] resize-none w-full",
              "px-4 lg:px-6 py-4", // Normal padding for text area
              "border-0 bg-transparent outline-none shadow-none", // Completely remove any borders and outline
              "focus-visible:ring-0 focus-visible:ring-offset-0", // Remove focus ring since parent handles it
              "placeholder:text-muted-foreground",
              "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent" // Custom scrollbar
            )}
            rows={1}
          />

          {/* Button area - seamlessly connected */}
          <div className="flex items-center justify-between px-4 py-2">
            {/* Left side - Attach file button */}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              disabled={disabled}
              onClick={handleAttachClick}
              title="Attach image"
            >
              <Image className="h-4 w-4" />
            </Button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Right side - Send button */}
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSend}
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-all",
                canSend
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground cursor-not-allowed"
              )}
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = "ChatInput";

export { ChatInput };
