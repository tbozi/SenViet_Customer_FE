import { baseApi, type ApiResponse } from "./baseApi";

export interface PromotionItem {
  id: number | string;
  code: string;
  name: string;
  description?: string;
  type: string;
  discountType?: string;
  discountValue: number;
  maxDiscountAmount?: number;
  minBookingValue?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  available: boolean;
}

export interface SavedPromotionItem {
  savedId: number | string;
  promotionId: number | string;
  code: string;
  name: string;
  description?: string;
  type: string;
  discountType?: string;
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
    getMySavedPromotions: builder.query<SavedPromotionItem[], number | string | void>({
      query: (customerId) => ({
        url: customerId ? `/customer-promotions/customer/${customerId}` : "/customer-promotions/customer/0",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<any[]>) => {
        const list = response.result || [];
        return list.map((item) => ({
          savedId: item.id,
          promotionId: item.id,
          code: item.code || item.voucherCode,
          name: item.name || item.code,
          description: item.description,
          type: item.type,
          discountType: item.discountType,
          discountValue: item.discountValue,
          maxDiscountAmount: item.maxDiscountAmount,
          minBookingValue: item.minBookingValue,
          startDate: item.startDate,
          endDate: item.endDate,
          status: "ACTIVE",
          available: true,
          savedAt: item.savedAt || "",
        }));
      },
      providesTags: ["Promotion"],
    }),
    savePromotion: builder.mutation<any, number | string>({
      query: (promotionId) => ({
        url: "/customer-promotions/claim",
        method: "POST",
        data: { promotionId: String(promotionId) },
      }),
      invalidatesTags: ["Promotion"],
    }),
    unsavePromotion: builder.mutation<void, number>({
      queryFn: () => ({ data: undefined }),
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
