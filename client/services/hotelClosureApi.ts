import { baseApi, type ApiResponse } from "./baseApi";

export type PublicHotelClosure = {
  id: string;
  startDate: string;
  endDate: string;
};

export const hotelClosureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicHotelClosures: builder.query<PublicHotelClosure[], number>({
      query: (hotelId) => ({
        url: "/hotel-closures/public",
        method: "GET",
        params: { hotelId },
      }),
      transformResponse: (response: ApiResponse<PublicHotelClosure[]>) => {
        if (!Array.isArray(response.result)) {
          throw new Error("The backend returned an invalid hotel closure list");
        }
        return response.result;
      },
      providesTags: ["HotelClosure"],
    }),
  }),
});

export const { useGetPublicHotelClosuresQuery } = hotelClosureApi;
