import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "@/store/axiosBaseQuery";

export interface ApiResponse<T> {
  code?: number;
  message?: string;
  result: T;
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["User", "Room", "Building", "Floor", "Amenity", "Booking", "Promotion"],
  endpoints: () => ({}),
});
