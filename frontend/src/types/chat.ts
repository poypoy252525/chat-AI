// Chat message types and interfaces

export interface ImageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
  url: string; // For preview
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  isLoading?: boolean;
  images?: ImageAttachment[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatActions {
  sendMessage: (content: string, images?: ImageAttachment[]) => Promise<void>;
  clearChat: () => void;
  retryLastMessage: () => Promise<void>;
}

export type ChatHook = ChatState & ChatActions;
