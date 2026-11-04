import { baseApi, type ApiResponse } from "./baseApi";

export interface PublicHotel {
  id: number;
  name: string;
  address: string;
  phone: string;
  provinceName: string | null;
  startingPrice: number | null;
  imageUrls: string[];
}

export interface PublicProvince {
  id: string;
  name: string;
  backgroundImageUrl: string | null;
}

export const hotelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicHotels: builder.query<PublicHotel[], void>({
      query: () => ({
        url: "/hotel/public/all",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<PublicHotel[]>) => {
        if (!Array.isArray(response.result)) {
          throw new Error("The backend returned an invalid hotel list");
        }
        return response.result;
      },
      providesTags: ["Hotel"],
    }),
    getPublicProvinces: builder.query<PublicProvince[], void>({
      query: () => ({
        url: "/province/public/all",
        method: "GET",
      }),
      transformResponse: (response: ApiResponse<PublicProvince[]>) => {
        if (!Array.isArray(response.result)) {
          throw new Error("The backend returned an invalid province list");
        }
        return response.result;
      },
      providesTags: ["Province"],
    }),
  }),
});

export const { useGetPublicHotelsQuery, useGetPublicProvincesQuery } = hotelApi;