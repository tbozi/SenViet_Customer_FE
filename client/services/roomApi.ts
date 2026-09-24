import { rooms as fallbackRooms, sharedAmenities, type RoomOffer, type RoomType } from "@/data/rooms";

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

const API_BASE_URL = "http://localhost:8081";

export const hotelSlugToIdMap: Record<string, number> = {
  "sen-viet-sai-gon": 1,
  "sen-viet-ha-noi": 2,
  "sen-viet-go-cong": 1,
  "sen-viet-an-nhon": 1,
  "sen-viet-da-nang": 2,
  "sen-viet-nha-trang": 1,
};

function createOffers(price: number): RoomOffer[] {
  const flexiblePrice = Math.round(price * 1.1);
  return [
    {
      id: "free-cancel-2026",
      name: "Free Cancel 2026",
      nameVi: "Free Cancel 2026",
      price: flexiblePrice,
      memberPrice: Math.round(flexiblePrice * 0.95),
      benefits: [
        "Bữa sáng buffet",
        "Xe bus đón tiễn sân bay",
        "Giảm 15% dịch vụ ẩm thực",
      ],
      highlight: "Hủy linh hoạt",
      conditions: "Miễn phí hủy trước ngày nhận phòng 7 ngày.",
      cancellationType: "flexible",
      cancellationPolicy: "Hủy từ 7 ngày trước nhận phòng: hoàn 100%; từ 3 đến dưới 7 ngày: hoàn 50%; dưới 3 ngày hoặc no-show: 0%.",
      cancellationPolicyVi: "Hủy từ 7 ngày trước nhận phòng: hoàn 100%; từ 3 đến dưới 7 ngày: hoàn 50%; dưới 3 ngày hoặc no-show: 0%.",
    },
    {
      id: "non-refundable-2026",
      name: "Non-refundable 2026",
      nameVi: "Non-refundable 2026",
      price,
      memberPrice: Math.round(price * 0.95),
      benefits: [
        "Bữa sáng buffet",
        "Tặng voucher dịch vụ nghỉ dưỡng",
        "Giảm 10% dịch vụ tại khách sạn",
      ],
      highlight: "Giá tiết kiệm",
      conditions: "Không hoàn tiền khi hủy hoặc không đến nhận phòng.",
      cancellationType: "non-refundable",
      cancellationPolicy: "Không hoàn tiền khi hủy hoặc không đến.",
      cancellationPolicyVi: "Không hoàn tiền khi hủy hoặc không đến.",
    },
  ];
}

export function mapBackendRoomToUiRoom(room: BackendRoomResponse): RoomType {
  const typeMap: Record<string, { vi: string; en: string; size: string }> = {
    STANDARD: { vi: "Phòng Tiêu Chuẩn", en: "Standard Room", size: "Khoảng 25 m²" },
    DELUXE: { vi: "Phòng Cao Cấp", en: "Deluxe Room", size: "Khoảng 35 m²" },
    SUITE: { vi: "Phòng Thượng Hạng", en: "Suite Room", size: "Từ 55 m²" },
    FAMILY: { vi: "Phòng Gia Đình", en: "Family Room", size: "Từ 60 m²" },
  };

  const info = typeMap[room.roomType] || {
    vi: `Phòng ${room.roomType}`,
    en: `${room.roomType} Room`,
    size: "Khoảng 30 m²",
  };

  const finalPrice = room.totalPrice || room.basePrice || 1_000_000;
  const bedsVi =
    room.beds && room.beds.length > 0
      ? room.beds.map((b) => `${b.quantity} ${b.bedTypeName}`).join(", ")
      : "1 Giường King";

  const amenitiesList =
    room.amenities && room.amenities.length > 0
      ? room.amenities.map((a: any) => (typeof a === "string" ? a : a.name || ""))
      : sharedAmenities;

  const defaultImg =
    room.defaultImageUrl ||
    (room.avatarUrl && room.avatarUrl.length > 0 ? room.avatarUrl[0].url : "") ||
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=900&auto=format&fit=crop";

  return {
    id: String(room.id),
    name: info.en,
    nameVi: info.vi,
    beds: bedsVi,
    bedsVi: bedsVi,
    size: info.size,
    price: finalPrice,
    offers: createOffers(finalPrice),
    image: defaultImg,
    building: (room.nameBuilding?.includes("B") ? "B" : "A") as "A" | "B" | "C",
    floor: (room.floorNumber || 1) as 1 | 2 | 3,
    roomCodes: [
      room.roomNumber ? `Phòng ${room.roomNumber}` : `${room.floorNumber || 1}-${room.nameBuilding?.includes("B") ? "B" : "A"}-${room.id}`,
    ],
    capacity: {
      adults: room.standardCapacity || 2,
      children: Math.max(0, (room.maxExtraGuests || 2) - 1),
      infants: 1,
    },
    targetGuests: "Phù hợp cho khách lẻ, cặp đôi hoặc gia đình",
    description: `Phòng ${info.vi} thuộc ${room.nameBuilding || "Tòa chính"}, tầng ${room.floorNumber || 1}. Tiện nghi đầy đủ và không gian nghỉ dưỡng sang trọng.`,
    amenities: amenitiesList,
    inventory: 5,
    roomId: room.id,
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

export async function fetchRoomsByHotel(hotelIdOrSlug: number | string): Promise<RoomType[]> {
  const hotelId =
    typeof hotelIdOrSlug === "number"
      ? hotelIdOrSlug
      : hotelSlugToIdMap[hotelIdOrSlug] || 1;

  const buildGroupedRooms = (rawRooms: BackendRoomResponse[]): RoomType[] => {
    // Tạo mã phòng từ dữ liệu backend
    const codeOf = (r: BackendRoomResponse) =>
      r.roomNumber ? `Phòng ${r.roomNumber}` : `${r.floorNumber || 1}-${r.nameBuilding?.includes("B") ? "B" : "A"}-${r.id}`;

    // Group theo loại phòng
    const grouped = groupByRoomType(rawRooms);
    return grouped.map((group) => {
      const sameType = rawRooms.filter((r) => r.roomType === group.roomType);
      // Chỉ lấy phòng READY (trống) để khách có thể chọn
      const readyRooms = sameType.filter((r) => r.roomStatus === "READY");

      const ui = mapBackendRoomToUiRoom(group);
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

  try {
    const res = await fetch(`${API_BASE_URL}/room/public/hotel/${hotelId}`);
    if (!res.ok) {
      const fallbackRes = await fetch(`${API_BASE_URL}/room/public/all?hotelId=${hotelId}`);
      if (!fallbackRes.ok) throw new Error("API failed");
      const json = await fallbackRes.json();
      if (json.result && Array.isArray(json.result) && json.result.length > 0) {
        return buildGroupedRooms(json.result);
      }
    } else {
      const json = await res.json();
      if (json.result && Array.isArray(json.result) && json.result.length > 0) {
        return buildGroupedRooms(json.result);
      }
    }
  } catch (error) {
    console.warn("fetchRoomsByHotel failed, falling back to mock rooms:", error);
  }

  return fallbackRooms;
}
