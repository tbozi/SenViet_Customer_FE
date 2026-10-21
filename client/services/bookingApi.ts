import { baseApi } from "./baseApi";

export interface BookingServiceRequestDto {
  serviceId: number | string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BookingDetailRequestDto {
  roomId: number | string;
  checkInTime: string;
  checkOutTime: string;
  numAdults: number;
  numChildren: number;
  numInfants: number;
  baseRoomPricePerNight: number;
  extraAdultFeePerNight?: number;
  extraChildFeePerNight?: number;
  roomSubTotal: number;
  serviceSubTotal: number;
  totalPrice: number;
  serviceRequests?: BookingServiceRequestDto[];
}

export interface BookingCreateRequestDto {
  customerId: number | string;
  customerEmail?: string;
  hotelId?: number;
  employeeId?: number | string;
  bookingChannel: "ONLINE" | "WALK_IN";
  customerPromotionId?: number | string | null;
  promotionId?: number | string | null;
  bookingDetails: BookingDetailRequestDto[];
}

export interface BookingResponseDto {
  bookingId: number | string;
  orderId?: string;
  customerId: number | string;
  customerName: string;
  bookingStatus: string;
  bookingChannel: string;
  createdAt: string;
  roomTotal: number;
  serviceTotal: number;
  discountTotal: number;
  finalAmount: number;
  bookingDetails: any[];
}

export interface BookingCancelRequestDto {
  reason?: string;
  bankName: string;
  bankCode?: string;
  bankAccountName: string;
  bankAccountNumber: string;
  refundEmail?: string;
}

export interface BookingCancellationResponseDto {
  id: number | string;
  bookingId: number | string;
  customerId?: number | string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  refundEmail?: string;
  reason?: string;
  cancellationTime?: string;
  checkInTime?: string;
  daysBeforeCheckIn?: number;
  paidAmount?: number;
  refundPercentage?: number;
  penaltyAmount?: number;
  refundAmount?: number;
  bankName?: string;
  bankCode?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  status?: string;
}

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCustomerBooking: builder.mutation<BookingResponseDto, BookingCreateRequestDto>({
      query: (body) => ({
        url: "/bookings/customer",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Booking"],
    }),
    cancelCustomerBooking: builder.mutation<
      BookingCancellationResponseDto,
      { bookingId: string | number; body: BookingCancelRequestDto }
    >({
      query: ({ bookingId, body }) => ({
        url: `/bookings/${bookingId}/cancel`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Booking"],
    }),
    updateCancellationBankDetails: builder.mutation<
      BookingCancellationResponseDto,
      { bookingId: string | number; body: BookingCancelRequestDto }
    >({
      query: ({ bookingId, body }) => ({
        url: `/bookings/${bookingId}/cancel/bank-details`,
        method: "PUT",
        data: body,
      }),
      invalidatesTags: ["Booking"],
    }),
  }),
});

export const {
  useCreateCustomerBookingMutation,
  useCancelCustomerBookingMutation,
  useUpdateCancellationBankDetailsMutation,
} = bookingApi;

