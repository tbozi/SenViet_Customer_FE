import { baseApi, ApiResponse } from "./baseApi";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  state?: any;
}

interface ChatRequest {
  message: string;
  sessionId: string;
  history: ChatMessage[];
  userInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

interface ChatResponse {
  reply: string;
  sessionId: string;
  state?: any;
}

interface ChatHistoryItem {
  id: number;
  role: "user" | "model";
  content: string;
  metadata?: any;
  createdAt?: string;
}

interface ChatHistoryResponse {
  sessionId: string;
  session?: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    bookingId?: string;
    currentStep?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  state?: any;
  messages: ChatHistoryItem[];
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendChatMessage: build.mutation<ApiResponse<ChatResponse>, ChatRequest>({
      query: (body) => ({ url: "/ai/chat", method: "POST", data: body }),
    }),
    getChatHistory: build.query<ApiResponse<ChatHistoryResponse>, string>({
      query: (sessionId) => ({ url: `/ai/chat/history/${sessionId}`, method: "GET" }),
    }),
    deleteChatHistory: build.mutation<ApiResponse<{ deleted: boolean; sessionId: string }>, string>({
      query: (sessionId) => ({ url: `/ai/chat/history/${sessionId}`, method: "DELETE" }),
    }),
  }),
});

export const { 
  useSendChatMessageMutation, 
  useGetChatHistoryQuery, 
  useLazyGetChatHistoryQuery,
  useDeleteChatHistoryMutation 
} = chatApi;
export type { ChatMessage, ChatRequest, ChatResponse, ChatHistoryItem, ChatHistoryResponse };
