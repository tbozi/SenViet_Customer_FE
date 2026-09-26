import { baseApi, type ApiResponse } from "./baseApi";

export interface PaymentTransactionDto {
  id: number | string;
  orderId: number | string;
  amount: number;
  paymentType: string;
  cashFlowType: string;
  transactionTime: string;
  note?: string;
}

export interface OrderDto {
  id: string | number;
  bookingId: number | string;
  customerId: number | string;
  customerName: string;
  customerPhone: string;
  issueDate: string;
  closeDate?: string;
  orderStatus: "OPEN" | "CLOSED" | "CANCELLED";
  roomTotalAmount: number;
  serviceTotalAmount: number;
  discountRoomAmount: number;
  discountServiceAmount: number;
  discountAmountTotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  transactions?: PaymentTransactionDto[];
}

export interface PaymentCreateRequestDto {
  orderId: number | string;
  amount: number;
  paymentType: "CASH" | "BANK" | "EWALLET";
  cashFlowType?: "RECEIPT" | "REFUND" | "CHANGE";
  note?: string;
}

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrderByBookingId: builder.query<OrderDto, number | string>({
      query: (bookingId) => ({
        url: `/orders/booking/${bookingId}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<OrderDto>) => response.result,
      providesTags: ["Order" as any],
    }),
    getOrderById: builder.query<OrderDto, number | string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<OrderDto>) => response.result,
      providesTags: ["Order" as any],
    }),
    createPayment: builder.mutation<PaymentTransactionDto, PaymentCreateRequestDto>({
      query: (body) => ({
        url: "/orders/payments",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Order" as any, "Booking" as any],
    }),
  }),
});

export const {
  useGetOrderByBookingIdQuery,
  useGetOrderByIdQuery,
  useCreatePaymentMutation,
} = orderApi;
