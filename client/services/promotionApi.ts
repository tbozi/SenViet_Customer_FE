import { baseApi, type ApiResponse } from "./baseApi";

export interface PromotionItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  type: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minBookingValue?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  available: boolean;
}

export interface SavedPromotionItem {
  savedId: number;
  promotionId: number;
  code: string;
  name: string;
  description?: string;
  type: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minBookingValue?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  available: boolean;
  savedAt: string;
}

export const promotionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivePromotions: builder.query<PromotionItem[], void>({
      query: () => ({ url: "/promotions/active", method: "GET" }),
      transformResponse: (response: ApiResponse<PromotionItem[]>) => response.result || [],
      providesTags: ["Promotion"],
    }),
    getMySavedPromotions: builder.query<SavedPromotionItem[], void>({
      query: () => ({ url: "/promotions/saved", method: "GET" }),
      transformResponse: (response: ApiResponse<SavedPromotionItem[]>) => response.result || [],
      providesTags: ["Promotion"],
    }),
    savePromotion: builder.mutation<void, number>({
      query: (id) => ({
        url: `/promotions/${id}/save`,
        method: "POST",
      }),
      invalidatesTags: ["Promotion"],
    }),
    unsavePromotion: builder.mutation<void, number>({
      query: (id) => ({
        url: `/promotions/${id}/save`,
        method: "DELETE",
      }),
      invalidatesTags: ["Promotion"],
    }),
  }),
});

export const {
  useGetActivePromotionsQuery,
  useGetMySavedPromotionsQuery,
  useSavePromotionMutation,
  useUnsavePromotionMutation,
} = promotionApi;
