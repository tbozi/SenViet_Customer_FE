import { baseApi, type ApiResponse } from "./baseApi";
import { hotels as staticHotels } from "@/data/hotels";

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

const fallbackPublicHotels: PublicHotel[] = staticHotels.map((hotel, idx) => ({
  id: hotel.id ?? idx + 1,
  name: hotel.name,
  address: hotel.city,
  phone: "1900 6868",
  provinceName: hotel.province,
  startingPrice: hotel.price,
  imageUrls: [hotel.image],
}));

const fallbackPublicProvinces: PublicProvince[] = Array.from(
  new Map(
    staticHotels.map((hotel) => [
      hotel.province,
      {
        id: hotel.province.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name: hotel.province,
        backgroundImageUrl: hotel.image,
      },
    ])
  ).values()
);

export const hotelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicHotels: builder.query<PublicHotel[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const result = await fetchWithBQ({
            url: "/hotel/public/all",
            method: "GET",
          });
          if (result.error) {
            return { data: fallbackPublicHotels };
          }
          const response = result.data as ApiResponse<PublicHotel[]>;
          if (!response || !Array.isArray(response.result) || response.result.length === 0) {
            return { data: fallbackPublicHotels };
          }
          return { data: response.result };
        } catch {
          return { data: fallbackPublicHotels };
        }
      },
      providesTags: ["Hotel"],
    }),
    getPublicProvinces: builder.query<PublicProvince[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const result = await fetchWithBQ({
            url: "/province/public/all",
            method: "GET",
          });
          if (result.error) {
            return { data: fallbackPublicProvinces };
          }
          const response = result.data as ApiResponse<PublicProvince[]>;
          if (!response || !Array.isArray(response.result) || response.result.length === 0) {
            return { data: fallbackPublicProvinces };
          }
          return { data: response.result };
        } catch {
          return { data: fallbackPublicProvinces };
        }
      },
      providesTags: ["Province"],
    }),
  }),
});

export const { useGetPublicHotelsQuery, useGetPublicProvincesQuery } = hotelApi;
