import { baseApi, type ApiResponse } from "./baseApi";

export interface HotelServiceItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  unit: string;
  category: string;
  imageUrl?: string;
  active: boolean;
  hotelId?: number;
  hotelName?: string;
}

export interface GetServicesParams {
  hotelId?: number;
  category?: string;
  activeOnly?: boolean;
}

export const hotelServiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<HotelServiceItem[], GetServicesParams | void>({
      query: (params) => ({
        url: "/services",
        method: "GET",
        params: params || {},
      }),
      transformResponse: (response: ApiResponse<HotelServiceItem[]>) =>
        response.result || [],
      providesTags: ["HotelService"],
    }),
    getServiceById: builder.query<HotelServiceItem, number>({
      query: (id) => ({
        url: `/services/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<HotelServiceItem>) =>
        response.result,
      providesTags: ["HotelService"],
    }),
  }),
});

export const { useGetServicesQuery, useGetServiceByIdQuery } = hotelServiceApi;
