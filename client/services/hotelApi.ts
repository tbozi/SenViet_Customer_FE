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

export function inferVietnamRegion(
  provinceName?: string | null,
  address?: string | null
): "north" | "central" | "south" {
  const text = `${provinceName || ""} ${address || ""}`.toLowerCase();
  if (
    /hà nội|ha noi|hải phòng|hai phong|quảng ninh|hạ long|sapa|sa pa|lào cai|ninh bình|hòa bình|vĩnh phúc|bắc ninh|thái nguyên|phú thọ|lạng sơn/.test(
      text
    )
  ) {
    return "north";
  }
  if (
    /hồ chí minh|ho chi minh|sài gòn|sai gon|tiền giang|gò công|cần thơ|can tho|phú quốc|phu quoc|kiên giang|vũng tàu|bà rịa|đồng nai|bình dương|long an|bến tre|an giang|cà mau|tây ninh/.test(
      text
    )
  ) {
    return "south";
  }
  return "central";
}

export interface PublicProvince {
  id: string;
  name: string;
  backgroundImageUrl: string | null;
}

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
            return { data: [] };
          }
          const response = result.data as ApiResponse<PublicHotel[]>;
          if (!response || !Array.isArray(response.result) || response.result.length === 0) {
            return { data: [] };
          }
          const enrichedHotels = await Promise.all(
            response.result.map(async (hotel) => {
              try {
                const roomsRes = await fetchWithBQ({
                  url: `/rooms/hotel/${hotel.id}`,
                  method: "GET",
                });
                const roomsData = (roomsRes.data as ApiResponse<any[]>)?.result;
                if (Array.isArray(roomsData) && roomsData.length > 0) {
                  const roomTotalPrices = roomsData
                    .map((r) => Number(r.totalPrice ?? r.basePrice ?? 0))
                    .filter((p) => Number.isFinite(p) && p > 0);
                  const minRoomPrice =
                    roomTotalPrices.length > 0
                      ? Math.min(...roomTotalPrices)
                      : hotel.startingPrice;
                  const fallbackImages = roomsData
                    .map((r) => r.defaultImageUrl)
                    .filter((u): u is string => Boolean(u));
                  return {
                    ...hotel,
                    startingPrice: minRoomPrice ?? hotel.startingPrice,
                    imageUrls:
                      hotel.imageUrls && hotel.imageUrls.length > 0
                        ? hotel.imageUrls
                        : fallbackImages,
                  };
                }
              } catch {
                // Keep original hotel data if room query fails
              }
              return hotel;
            }),
          );
          return { data: enrichedHotels };
        } catch {
          return { data: [] };
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
            return { data: [] };
          }
          const response = result.data as ApiResponse<PublicProvince[]>;
          if (!response || !Array.isArray(response.result) || response.result.length === 0) {
            return { data: [] };
          }
          return { data: response.result };
        } catch {
          return { data: [] };
        }
      },
      providesTags: ["Province"],
    }),
  }),
});

export const { useGetPublicHotelsQuery, useGetPublicProvincesQuery } = hotelApi;
