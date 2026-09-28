import { baseApi, ApiResponse } from "./baseApi";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface ChatRequest {
  message: string;
  sessionId: string;
  history: ChatMessage[];
}

interface ChatResponse {
  reply: string;
  sessionId: string;
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    sendChatMessage: build.mutation<ApiResponse<ChatResponse>, ChatRequest>({
      query: (body) => ({ url: "/ai/chat", method: "POST", data: body }),
    }),
  }),
});

export const { useSendChatMessageMutation } = chatApi;
export type { ChatMessage, ChatRequest, ChatResponse };
