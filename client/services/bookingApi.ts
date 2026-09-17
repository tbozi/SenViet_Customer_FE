import { baseApi } from "./baseApi";

export interface BookingServiceRequestDto {
  serviceId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface BookingDetailRequestDto {
  roomId: number;
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
  customerId: number;
  employeeId?: number;
  bookingChannel: "ONLINE" | "WALK_IN";
  customerPromotionId?: number | null;
  promotionId?: number | null;
  bookingDetails: BookingDetailRequestDto[];
}

export interface BookingResponseDto {
  bookingId: number;
  customerId: number;
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
  }),
});

export const { useCreateCustomerBookingMutation } = bookingApi;
