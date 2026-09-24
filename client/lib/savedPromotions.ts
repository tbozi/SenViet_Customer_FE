const SAVED_PROMOTIONS_KEY = "senviet_saved_promotions";

export interface PromotionRule {
  code: string;
  name: string;
  discountText: string;
  applicableHotels: string[]; // Tên hoặc slug, hoặc ["*"]
  minNights?: number;
  description: string;
}

export const PROMOTION_RULES: Record<string, PromotionRule> = {
  STAY3FREE: {
    code: "STAY3FREE",
    name: "Ở 3 đêm, tặng 1 đêm",
    discountText: "Tặng 1 đêm khi ở từ 3 đêm",
    applicableHotels: [
      "Sen Việt Đà Nẵng",
      "Sen Việt Nha Trang",
      "sen-viet-da-nang",
      "sen-viet-nha-trang",
    ],
    minNights: 3,
    description: "Chỉ áp dụng tại Sen Việt Đà Nẵng & Nha Trang",
  },
  SENMEMBER: {
    code: "SENMEMBER",
    name: "Ưu đãi thành viên Sen Việt",
    discountText: "Giảm 15% giá phòng",
    applicableHotels: ["*"],
    description: "Áp dụng cho tất cả khách sạn Sen Việt",
  },
  WEEKEND: {
    code: "WEEKEND",
    name: "Trọn gói cuối tuần",
    discountText: "Giảm 10% giá phòng",
    applicableHotels: [
      "Sen Việt Gò Công",
      "Sen Việt An Nhơn",
      "Sen Việt Hà Nội",
      "sen-viet-go-cong",
      "sen-viet-an-nhon",
      "sen-viet-ha-noi",
    ],
    description: "Áp dụng tại Sen Việt Gò Công, An Nhơn, Hà Nội",
  },
  BREAKFAST: {
    code: "BREAKFAST",
    name: "Bữa sáng trọn vị",
    discountText: "Tặng 200.000₫/phòng cho bữa sáng",
    applicableHotels: [
      "Sen Việt Đà Nẵng",
      "Sen Việt Nha Trang",
      "Sen Việt Sài Gòn",
      "sen-viet-da-nang",
      "sen-viet-nha-trang",
      "sen-viet-sai-gon",
    ],
    description: "Áp dụng tại Sen Việt Đà Nẵng, Nha Trang, Sài Gòn",
  },
  SPA20: {
    code: "SPA20",
    name: "Thư giãn cùng Spa",
    discountText: "Giảm 20% dịch vụ Spa",
    applicableHotels: [
      "Sen Việt Đà Nẵng",
      "Sen Việt Nha Trang",
      "sen-viet-da-nang",
      "sen-viet-nha-trang",
    ],
    description: "Áp dụng tại Sen Việt Đà Nẵng, Nha Trang",
  },
  FAMILY10: {
    code: "FAMILY10",
    name: "Kỳ nghỉ gia đình",
    discountText: "Giảm 10% giá phòng",
    applicableHotels: [
      "Sen Việt Gò Công",
      "Sen Việt Đà Nẵng",
      "Sen Việt Nha Trang",
      "sen-viet-go-cong",
      "sen-viet-da-nang",
      "sen-viet-nha-trang",
    ],
    description: "Áp dụng tại Sen Việt Gò Công, Đà Nẵng, Nha Trang",
  },
  LONGSTAY12: {
    code: "LONGSTAY12",
    name: "Ở lâu, tiết kiệm nhiều",
    discountText: "Giảm 12% khi ở từ 7 đêm",
    applicableHotels: ["*"],
    minNights: 7,
    description: "Áp dụng cho tất cả khách sạn khi ở từ 7 đêm",
  },
  SEN10: {
    code: "SEN10",
    name: "Ưu đãi Sen Việt",
    discountText: "Giảm 10% giá phòng",
    applicableHotels: ["*"],
    description: "Áp dụng cho tất cả khách sạn Sen Việt",
  },
};

export const promotionNames: Record<string, string> = Object.fromEntries(
  Object.entries(PROMOTION_RULES).map(([code, rule]) => [code, rule.name]),
);

function readSavedPromotions(): Record<string, string[]> {
  try {
    return JSON.parse(
      localStorage.getItem(SAVED_PROMOTIONS_KEY) || "{}",
    ) as Record<string, string[]>;
  } catch {
    return {};
  }
}

function writeSavedPromotions(saved: Record<string, string[]>) {
  localStorage.setItem(SAVED_PROMOTIONS_KEY, JSON.stringify(saved));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("senviet_saved_promotions_changed"));
  }
}

export function getSavedPromotionCodes(email?: string): string[] {
  const saved = readSavedPromotions();
  const account = (email || "").toLowerCase().trim();
  const userCodes = account ? saved[account] || [] : [];
  const guestCodes = saved["guest"] || [];
  // Gộp các mã đã lưu của user và guest (tránh mất voucher khi đổi trạng thái login)
  return Array.from(new Set([...userCodes, ...guestCodes])).filter(Boolean);
}

export function toggleSavedPromotion(email: string | undefined, code: string): string[] {
  const saved = readSavedPromotions();
  const account = (email || "guest").toLowerCase().trim();
  const upperCode = code.trim().toUpperCase();
  const current = saved[account] || [];
  
  const isCurrentlySaved = current.includes(upperCode);
  saved[account] = isCurrentlySaved
    ? current.filter((item) => item !== upperCode)
    : [...current, upperCode];
  
  writeSavedPromotions(saved);
  return saved[account];
}

export function isPromotionApplicableToHotel(
  code: string,
  hotelSlugOrName: string,
): { applicable: boolean; reason?: string } {
  const normalized = code.trim().toUpperCase();
  const rule = PROMOTION_RULES[normalized];
  if (!rule) return { applicable: true };
  if (rule.applicableHotels.includes("*")) return { applicable: true };

  const target = (hotelSlugOrName || "").toLowerCase().trim();
  const isMatch = rule.applicableHotels.some((item) => {
    const it = item.toLowerCase().trim();
    return target.includes(it) || it.includes(target);
  });

  if (!isMatch) {
    return {
      applicable: false,
      reason: rule.description,
    };
  }

  return { applicable: true };
}

export function getPromotionDiscount(
  code: string,
  values: {
    roomSubtotal: number;
    serviceTotal: number;
    nights: number;
    roomCount: number;
    hotelSlugOrName?: string;
  },
) {
  const normalizedCode = code.trim().toUpperCase();
  if (values.hotelSlugOrName) {
    const { applicable } = isPromotionApplicableToHotel(
      normalizedCode,
      values.hotelSlugOrName,
    );
    if (!applicable) return 0;
  }
  const { roomSubtotal, serviceTotal, nights, roomCount } = values;
  if (normalizedCode === "STAY3FREE") {
    return nights >= 3
      ? Math.min(roomSubtotal, Math.round(roomSubtotal / nights))
      : 0;
  }
  if (normalizedCode === "SENMEMBER") return Math.round(roomSubtotal * 0.15);
  if (normalizedCode === "WEEKEND") return Math.round(roomSubtotal * 0.1);
  if (normalizedCode === "BREAKFAST")
    return Math.min(roomSubtotal, roomCount * 200000);
  if (normalizedCode === "SPA20") return Math.round(serviceTotal * 0.2);
  if (normalizedCode === "FAMILY10") return Math.round(roomSubtotal * 0.1);
  if (normalizedCode === "LONGSTAY12") {
    return nights >= 7 ? Math.round(roomSubtotal * 0.12) : 0;
  }
  if (normalizedCode === "SEN10") return Math.round(roomSubtotal * 0.1);
  return 0;
}
