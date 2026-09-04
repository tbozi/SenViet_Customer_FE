import type { GuestForm } from "@/lib/bookings";

export interface RoomCapacity {
  adults: number;
  children: number;
  infants: number;
}

export interface RoomType {
  id: string;
  name: string;
  nameVi: string;
  beds: string;
  bedsVi: string;
  size: string;
  price: number;
  image: string;
  building: "A" | "B" | "C";
  floor: 1 | 2 | 3;
  roomCodes: string[];
  capacity: RoomCapacity;
  targetGuests: string;
  description: string;
  amenities: string[];
  inventory: number;
}

export const sharedAmenities = [
  "Điều hòa",
  "Két an toàn",
  "Tủ lạnh mini",
  "TV truyền hình cáp/vệ tinh",
  "Khăn tắm",
  "Phòng tắm vòi sen",
  "WiFi",
  "Không có cửa sổ",
  "Đèn bàn",
  "Bộ cà phê/trà",
  "Bàn là",
  "Không hút thuốc",
  "Điện thoại",
  "Máy sấy tóc",
  "Ga giường/gối",
  "Đồ dùng phòng tắm",
];

const makeRoomCodes = (floor: 1 | 2 | 3, building: "A" | "B" | "C", count: number) =>
  Array.from({ length: count }, (_, index) => `${floor}-${building}-${String(index + 1).padStart(2, "0")}`);

export const rooms: RoomType[] = [
  {
    id: "standard",
    name: "Standard Room",
    nameVi: "Phòng Tiêu Chuẩn",
    beds: "1 single bed 1m x 1.2m",
    bedsVi: "1 giường đơn 1m x 1.2m",
    size: "Khoảng 25 m²",
    price: 1_000_000,
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=900&auto=format&fit=crop",
    building: "A",
    floor: 1,
    roomCodes: makeRoomCodes(1, "A", 4),
    capacity: { adults: 1, children: 1, infants: 1 },
    targetGuests: "Cặp đôi hoặc khách công tác đi một mình",
    description: "Không gian nghỉ ngơi gọn gàng, tiện dụng ở tầng thấp, phù hợp cho kỳ lưu trú ngắn ngày.",
    amenities: sharedAmenities,
    inventory: 4,
  },
  {
    id: "superior",
    name: "Superior Room",
    nameVi: "Phòng Cao Cấp",
    beds: "2 single beds 1m x 1.2m",
    bedsVi: "2 giường đơn 1m x 1.2m",
    size: "Khoảng 30 m²",
    price: 1_500_000,
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=900&auto=format&fit=crop",
    building: "A",
    floor: 2,
    roomCodes: makeRoomCodes(2, "A", 3),
    capacity: { adults: 2, children: 2, infants: 1 },
    targetGuests: "Gia đình nhỏ hoặc hai người lớn cần hai giường riêng",
    description: "Phòng hai giường đơn thoải mái hơn, dành cho gia đình nhỏ và nhóm bạn.",
    amenities: sharedAmenities,
    inventory: 3,
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    nameVi: "Phòng Hạng Sang",
    beds: "1 king bed 1.8m x 2m",
    bedsVi: "1 giường king 1.8m x 2m",
    size: "Khoảng 45 m²",
    price: 2_000_000,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=900&auto=format&fit=crop",
    building: "A",
    floor: 3,
    roomCodes: makeRoomCodes(3, "A", 2),
    capacity: { adults: 2, children: 1, infants: 1 },
    targetGuests: "Cặp đôi hoặc gia đình cần không gian rộng rãi",
    description: "Phòng king rộng rãi ở tầng cao, mang lại trải nghiệm lưu trú thư thái và riêng tư.",
    amenities: sharedAmenities,
    inventory: 2,
  },
  {
    id: "suite",
    name: "Suite Room",
    nameVi: "Phòng Suite",
    beds: "1 king 1.8m x 2m + 1 single 1m x 1.2m",
    bedsVi: "1 giường king 1.8m x 2m + 1 giường đơn 1m x 1.2m",
    size: "Từ 60 m²",
    price: 2_500_000,
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=900&auto=format&fit=crop",
    building: "B",
    floor: 3,
    roomCodes: makeRoomCodes(3, "B", 2),
    capacity: { adults: 3, children: 1, infants: 1 },
    targetGuests: "Gia đình hoặc nhóm bạn cần phòng suite nhiều giường",
    description: "Suite rộng từ 60 m² với hai loại giường, phù hợp cho nhóm khách muốn ở cùng một không gian.",
    amenities: sharedAmenities,
    inventory: 2,
  },
];

export const emptyGuestForm = (): GuestForm => ({ adults: 1, children: 0, infants: 0 });
