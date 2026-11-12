import type { RoomType } from "@/data/rooms";

import { baseApi, type ApiResponse } from "./baseApi";







export interface BackendBed {



  bedTypeName: string;



  description?: string;



  quantity: number;



  capacity?: number;



  isExtraBed?: boolean;



}







export interface BackendAmenity {



  id?: number;



  name: string;



  price?: number;



}







export interface BackendRoomResponse {



  id: number | string;



  floorId: number;



  floorNumber: number;



  nameBuilding: string;



  roomNumber?: string;



  roomStatus: "READY" | "MAINTENANCE" | "IN_USE" | "CLEANING";



  roomType: "STANDARD" | "DELUXE" | "SUITE" | "FAMILY" | string;



  basePrice?: number;



  area?: number;

  totalAmenitiesPrice?: number;



  totalPrice?: number;



  beds?: BackendBed[];



  defaultImageUrl?: string;



  avatarUrl?: Array<{ url: string; isDefault?: boolean }>;



  amenities?: BackendAmenity[] | string[];



  standardCapacity?: number;



  maxExtraGuests?: number;



  extraAdultFee?: number;



  extraChildFee?: number;



}







const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";







export const hotelSlugToIdMap: Record<string, number> = {



  "sen-viet-sai-gon": 1,



  "sen-viet-ha-noi": 2,



  "sen-viet-da-nang": 3,



  "sen-viet-nha-trang": 4,



  "sen-viet-da-lat": 5,



  "sen-viet-go-cong": 6,



  "sen-viet-an-nhon": 7,
  "sen-viet-quy-nhon": 8,



};







export function formatRoomDisplayCode(room: { roomNumber?: string | number | null; floorNumber?: number; id?: string | number }): string {

  if (room.roomNumber && String(room.roomNumber).trim()) {



    const raw = String(room.roomNumber).trim();



    return raw.startsWith("Phòng") ? raw : `Phòng ${raw}`;



  }



  const floor = room.floorNumber || 1;



  const num = `${floor}${String(room.id || 1).padStart(2, "0")}`;



  return `Phòng ${num}`;



}







export function mapBackendRoomToUiRoom(room: BackendRoomResponse): RoomType {



  const typeMap: Record<string, { vi: string; en: string }> = {

    STANDARD: { vi: "Phòng Tiêu Chuẩn", en: "Standard Room" },

    DELUXE: { vi: "Phòng Cao Cấp", en: "Deluxe Room" },

    SUITE: { vi: "Phòng Thượng Hạng", en: "Suite Room" },

    FAMILY: { vi: "Phòng Gia Đình", en: "Family Room" },

  };







  const info = typeMap[room.roomType] || {



    vi: `Phòng ${room.roomType}`,



    en: `${room.roomType} Room`,



  };





  const finalPrice = room.totalPrice ?? room.basePrice ?? 0;

  const bedsVi =



    room.beds && room.beds.length > 0



      ? room.beds.map((b) => `${b.quantity} ${b.bedTypeName}`).join(", ")



      : "";





  const amenitiesList =



    room.amenities && room.amenities.length > 0



      ? room.amenities.map((a: any) => (typeof a === "string" ? a : a.name || ""))



      : [];





  const defaultImg =



    room.defaultImageUrl ||



    (room.avatarUrl && room.avatarUrl.length > 0 ? room.avatarUrl[0].url : "") ||



    "";





  return {



    id: String(room.id),



    name: info.en,



    nameVi: info.vi,



    beds: bedsVi,



    bedsVi: bedsVi,



    size: room.area ? `${room.area} m²` : "",

    price: finalPrice,



    offers: [],

    image: defaultImg,





    images: [...new Set([

      ...(defaultImg ? [defaultImg] : []),

      ...(room.avatarUrl || []).map((image) => image.url).filter(Boolean),

    ])],

    building: room.nameBuilding ? room.nameBuilding.replace(/^Tòa\s*/i, "") : "A",

    buildingName: room.nameBuilding || "Tòa chính",

    floor: room.floorNumber,

    roomCodes: [formatRoomDisplayCode(room)],



    capacity: {



      adults: room.standardCapacity ?? 0,

      children: room.maxExtraGuests ?? 0,

      infants: 0,

    },



    targetGuests: "",

    description: "",

    amenities: amenitiesList,



    inventory: 0,

    roomId: room.id,



    extraAdultFee: room.extraAdultFee,

    extraChildFee: room.extraChildFee,

    standardCapacity: room.standardCapacity ?? 0,

    maxExtraGuests: room.maxExtraGuests ?? 0,

  };



}







/** Gom các phòng cùng loại (roomType) thành 1 entry, với roomCodes[] chứa mã từng phòng thực */



function groupByRoomType(rooms: BackendRoomResponse[]): BackendRoomResponse[] {



  const map = new Map<string, BackendRoomResponse & { _allIds: (number | string)[] }>();



  for (const room of rooms) {



    const key = room.roomType;



    if (!map.has(key)) {



      map.set(key, { ...room, _allIds: [room.id] });



    } else {



      map.get(key)!._allIds.push(room.id);



    }



  }



  return [...map.values()];



}







export async function fetchRoomsByHotel(



  hotelIdOrSlug: number | string,



  checkIn?: string,



  checkOut?: string,



): Promise<RoomType[]> {



  const hotelId =



    typeof hotelIdOrSlug === "number"



      ? hotelIdOrSlug



      : /^\d+$/.test(hotelIdOrSlug)

        ? Number(hotelIdOrSlug)

        : hotelSlugToIdMap[hotelIdOrSlug];

  if (!Number.isSafeInteger(hotelId) || hotelId <= 0) {

    throw new Error("A valid hotel ID is required to load rooms");

  }





  const buildGroupedRooms = (rawRooms: BackendRoomResponse[]): RoomType[] => {



    // Tạo mã phòng chuẩn hóa từ dữ liệu backend



    const codeOf = (r: BackendRoomResponse) => formatRoomDisplayCode(r);







    // Group theo loại phòng



    const grouped = groupByRoomType(rawRooms);



    return grouped.map((group) => {



      const sameType = rawRooms.filter((r) => r.roomType === group.roomType);



      // Chỉ lấy phòng READY (trống và chưa có đơn đặt trùng ngày) để khách có thể chọn



      const readyRooms = sameType.filter((r) => r.roomStatus === "READY");







      const ui = mapBackendRoomToUiRoom(group);



      const imageSource = readyRooms[0] ?? group;

      const allImages = [...new Set([

        ...(imageSource.defaultImageUrl ? [imageSource.defaultImageUrl] : []),

        ...(imageSource.avatarUrl || []).map((image) => image.url).filter(Boolean),

      ])];

      ui.images = allImages;

      ui.image = allImages[0] || ui.image;

      // roomCodes chỉ chứa phòng TRỐNG



      ui.roomCodes = readyRooms.map(codeOf);



      // availableRooms: id thực + mã để dùng trong dropdown và khi gửi booking



      ui.availableRooms = readyRooms.map((r) => ({ id: r.id, code: codeOf(r) }));



      // inventory = số phòng trống thực tế



      ui.inventory = readyRooms.length;



      // roomId = id đại diện (phòng đầu tiên READY)



      ui.roomId = readyRooms[0]?.id ?? group.id;



      return ui;



    });



  };







  const queryParams = new URLSearchParams();



  if (checkIn) queryParams.set("checkIn", checkIn);



  if (checkOut) queryParams.set("checkOut", checkOut);



  const qs = queryParams.toString();



  let response = await fetch(

    `${API_BASE_URL}/room/public/hotel/${hotelId}${qs ? `?${qs}` : ""}`,

  );

  if (!response.ok) {

    throw new Error(`Unable to load rooms from the backend (HTTP ${response.status})`);

  }



  const json: { result?: unknown } = await response.json();

  if (!Array.isArray(json.result)) {

    throw new Error("The backend returned an invalid room list");

  }



  return buildGroupedRooms(json.result);

}





export type RoomDailyPricesResponse = Record<string, Record<string, number>>;







export const branchRoomPricesApi = baseApi.injectEndpoints({



  endpoints: (builder) => ({



    getBranchRoomDailyPrices: builder.query<RoomDailyPricesResponse, { hotelId: number; startDate: string; endDate: string }>({



      query: ({ hotelId, startDate, endDate }) => ({



        url: "/management-rooms/branch-prices",



        method: "GET",



        params: { hotelId, startDate, endDate },



      }),



      transformResponse: (response: any) => (response?.result !== undefined ? response.result : response) ?? {},



    }),



  }),



});







export const { useGetBranchRoomDailyPricesQuery } = branchRoomPricesApi;







export async function fetchBranchRoomDailyPrices(hotelId: number, startDate: string, endDate: string): Promise<RoomDailyPricesResponse> {



  try {



    const res = await fetch(`${API_BASE_URL}/management-rooms/branch-prices?hotelId=${hotelId}&startDate=${startDate}&endDate=${endDate}`);



    if (res.ok) {



      const json = await res.json();



      return (json?.result !== undefined ? json.result : json) || {};



    }



  } catch (e) {



    console.warn("fetchBranchRoomDailyPrices error:", e);



  }



  return {};



}



