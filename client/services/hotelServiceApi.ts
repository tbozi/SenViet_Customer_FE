import { baseApi, type ApiResponse } from "./baseApi";

export interface HotelServiceDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  category?: string;
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
    getServices: builder.query<HotelServiceDto[], GetServicesParams | void>({
      query: (params) => ({
        url: "/services",
        method: "GET",
        params: params || {},
      }),
      transformResponse: (response: ApiResponse<HotelServiceDto[]>) => response.result || [],
      providesTags: ["Service" as any],
    }),
    getServiceById: builder.query<HotelServiceDto, number>({
      query: (id) => ({
        url: `/services/${id}`,
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<HotelServiceDto>) => response.result,
      providesTags: ["Service" as any],
    }),
  }),
});

export const { useGetServicesQuery, useGetServiceByIdQuery } = hotelServiceApi;
