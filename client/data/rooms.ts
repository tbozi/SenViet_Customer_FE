import type { GuestForm } from "@/lib/bookings";

export interface RoomCapacity {
  adults: number;
  children: number;
  infants: number;
}

export interface RoomOffer {
  id: string;
  name: string;
  nameVi: string;
  price: number;
  memberPrice: number;
  benefits: string[];
  highlight: string;
  conditions: string;
  cancellationType: "flexible" | "non-refundable";
  cancellationPolicy: string;
  cancellationPolicyVi: string;
}

export interface RoomType {
  id: string;
  name: string;
  nameVi: string;
  beds: string;
  bedsVi: string;
  size: string;
  price: number;
  offers: RoomOffer[];
  image: string;
  building: "A" | "B" | "C";
  floor: 1 | 2 | 3;
  roomCodes: string[];
  capacity: RoomCapacity;
  targetGuests: string;
  description: string;
  amenities: string[];
  inventory: number;
  roomId?: number | string;
  extraAdultFee?: number;
  extraChildFee?: number;
  standardCapacity?: number;
  maxExtraGuests?: number;
  /** Danh sách phòng TRỐNG thực tế từ backend, dùng cho dropdown chọn mã phòng */
  availableRooms?: { id: number | string; code: string }[];
}

export const sharedAmenities = [
  "Điều hòa không khí 2 chiều",
  "Két an toàn điện tử",
  "Tủ lạnh minibar",
  "Smart TV 55 inch truyền hình vệ tinh",
  "Khăn tắm & áo choàng sợi bông cao cấp",
  "Phòng tắm vòi sen đứng kính cường lực",
  "WiFi tốc độ cao 5GHz miễn phí",
  "Bàn làm việc & đèn đọc sách",
  "Bộ ấm đun nước & trà/cà phê sen miễn phí",
  "Bàn là & cầu là hơi nước",
  "Phòng không hút thuốc",
  "Điện thoại bàn quốc tế",
  "Máy sấy tóc ion",
  "Bộ đồ dùng phòng tắm thảo mộc cao cấp",
];

const roomCodes = {
  standard: [
    "Phòng 101",
    "Phòng 102",
    "Phòng 122",
    "Phòng 123",
  ],
  deluxe: [
    "Phòng 103",
    "Phòng 104",
  ],
  family: [
    "Phòng 203",
    "Phòng 204",
  ],
  suite: [
    "Phòng 201",
    "Phòng 202",
  ],
} as const;

const cancellationPolicies = {
  flexible: "Hủy từ 7 ngày trước nhận phòng: hoàn 100%; từ 3 đến dưới 7 ngày: hoàn 50%; dưới 3 ngày hoặc no-show: 0%.",
  flexibleVi: "Hủy từ 7 ngày trước nhận phòng: hoàn 100%; từ 3 đến dưới 7 ngày: hoàn 50%; dưới 3 ngày hoặc no-show: 0%.",
  nonRefundable: "Không hoàn tiền khi hủy hoặc không đến.",
  nonRefundableVi: "Không hoàn tiền khi hủy hoặc không đến.",
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
        "Bữa sáng buffet đặc sản Sen Việt",
        "Xe bus đón tiễn sân bay",
        "Giảm 15% dịch vụ ẩm thực & Spa",
      ],
      highlight: "Hủy linh hoạt",
      conditions: "Miễn phí hủy trước ngày nhận phòng 7 ngày.",
      cancellationType: "flexible",
      cancellationPolicy: cancellationPolicies.flexible,
      cancellationPolicyVi: cancellationPolicies.flexibleVi,
    },
    {
      id: "non-refundable-2026",
      name: "Non-refundable 2026",
      nameVi: "Non-refundable 2026",
      price,
      memberPrice: Math.round(price * 0.95),
      benefits: [
        "Bữa sáng buffet đặc sản Sen Việt",
        "Tặng voucher dịch vụ Spa 100.000đ",
        "Giảm 10% dịch vụ tại khách sạn",
      ],
      highlight: "Giá tiết kiệm",
      conditions: "Không hoàn tiền khi hủy hoặc không đến nhận phòng.",
      cancellationType: "non-refundable",
      cancellationPolicy: cancellationPolicies.nonRefundable,
      cancellationPolicyVi: cancellationPolicies.nonRefundableVi,
    },
  ];
}

export const rooms: RoomType[] = [
  {
    id: "standard",
    name: "Standard Room",
    nameVi: "Phòng Tiêu Chuẩn",
    beds: "1 single bed 1m x 2m",
    bedsVi: "1 giường đơn (Single) 1m x 2m",
    size: "Khoảng 25 m²",
    price: 850_000,
    offers: createOffers(850_000),
    image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=900&auto=format&fit=crop",
    building: "A",
    floor: 1,
    roomCodes: [...roomCodes.standard],
    capacity: { adults: 2, children: 1, infants: 1 },
    standardCapacity: 2,
    maxExtraGuests: 2,
    extraAdultFee: 200_000,
    extraChildFee: 100_000,
    targetGuests: "Cặp đôi hoặc khách công tác đi một mình",
    description: "Không gian nghỉ ngơi gọn gàng, tiện dụng ở tầng 1, thoáng mát và đầy đủ tiện nghi tiêu chuẩn Sen Việt.",
    amenities: sharedAmenities,
    inventory: 4,
    roomId: "ROOM20260922101",
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    nameVi: "Phòng Hạng Sang",
    beds: "1 king bed 1.8m x 2m",
    bedsVi: "1 giường King 1.8m x 2m",
    size: "Khoảng 45 m²",
    price: 1_200_000,
    offers: createOffers(1_200_000),
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=900&auto=format&fit=crop",
    building: "A",
    floor: 1,
    roomCodes: [...roomCodes.deluxe],
    capacity: { adults: 2, children: 1, infants: 1 },
    standardCapacity: 2,
    maxExtraGuests: 2,
    extraAdultFee: 250_000,
    extraChildFee: 120_000,
    targetGuests: "Cặp đôi hoặc doanh nhân cần không gian rộng rãi, sang trọng",
    description: "Phòng Deluxe sang trọng với giường King cỡ lớn, nội thất cao cấp mang lại trải nghiệm lưu trú thư thái và riêng tư.",
    amenities: sharedAmenities,
    inventory: 2,
    roomId: "ROOM20260922103",
  },
  {
    id: "family",
    name: "Family Room",
    nameVi: "Phòng Gia Đình",
    beds: "2 queen beds 1.6m x 2m",
    bedsVi: "2 giường đôi (Queen) 1.6m x 2m",
    size: "Từ 65 m²",
    price: 2_000_000,
    offers: createOffers(2_000_000),
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=900&auto=format&fit=crop",
    building: "A",
    floor: 2,
    roomCodes: [...roomCodes.family],
    capacity: { adults: 4, children: 2, infants: 1 },
    standardCapacity: 4,
    maxExtraGuests: 2,
    extraAdultFee: 300_000,
    extraChildFee: 150_000,
    targetGuests: "Gia đình hoặc nhóm bạn 4 người cần không gian sinh hoạt chung rộng rãi",
    description: "Phòng Family thiết kế chuyên biệt cho gia đình, sở hữu 2 giường Queen rộng rãi, khu vực tiếp khách và ban công thoáng đãng.",
    amenities: sharedAmenities,
    inventory: 2,
    roomId: "ROOM20260922203",
  },
  {
    id: "suite",
    name: "Suite Room",
    nameVi: "Phòng Suite Thượng Hạng",
    beds: "1 king 1.8m x 2m + 1 single 1m x 2m",
    bedsVi: "1 giường King 1.8m x 2m + 1 giường đơn 1m x 2m",
    size: "Từ 70 m²",
    price: 2_500_000,
    offers: createOffers(2_500_000),
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=900&auto=format&fit=crop",
    building: "B",
    floor: 2,
    roomCodes: [...roomCodes.suite],
    capacity: { adults: 3, children: 1, infants: 1 },
    standardCapacity: 3,
    maxExtraGuests: 2,
    extraAdultFee: 400_000,
    extraChildFee: 200_000,
    targetGuests: "Thượng khách, chuyên gia hoặc gia đình cần không gian nghỉ dưỡng đỉnh cao",
    description: "Suite thượng hạng với phòng khách riêng biệt, bồn tắm ngâm thảo dược view panorama và đặc quyền dịch vụ quản gia cao cấp.",
    amenities: sharedAmenities,
    inventory: 2,
    roomId: "ROOM20260922201",
  },
];

export const emptyGuestForm = (): GuestForm => ({ adults: 1, children: 0, infants: 0 });
