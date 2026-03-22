import type { AxiosInstance } from "axios";
import axiosInstance from "./providers/axios-instance";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  next: string | null;
  previous: string | null;
  results: T[];
}

class ChatService {
  private apiClient: AxiosInstance;

  constructor(apiClient: AxiosInstance) {
    this.apiClient = apiClient;
  }

  async getChatHistory(): Promise<PaginatedResponse<Conversation>> {
    const response = await this.apiClient.get<PaginatedResponse<Conversation>>(
      "chat/conversations/",
    );
    return response.data;
  }

  async sendMessage(message: string): Promise<Conversation> {
    const response = await this.apiClient.post<Conversation>(
      "chat/conversations/",
      {
        message,
      },
    );
    return response.data;
  }
}

export default new ChatService(axiosInstance);
