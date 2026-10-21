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
  SEN10: {
    code: "SEN10",
    name: "Ưu đãi Sen Việt - Giảm 10%",
    discountText: "Giảm 10% giá phòng (tối đa 500.000₫)",
    applicableHotels: ["*"],
    description: "Áp dụng cho tất cả khách sạn Sen Việt",
  },
  VIP20: {
    code: "VIP20",
    name: "Ưu đãi VIP - Giảm 20%",
    discountText: "Giảm 20% cho đơn từ 2.000.000₫ (tối đa 1.000.000₫)",
    applicableHotels: ["*"],
    description: "Áp dụng cho đơn đặt phòng từ 2.000.000₫ toàn chuỗi",
  },
  SUMMER2026: {
    code: "SUMMER2026",
    name: "Khuyến mãi Mùa Hè 2026",
    discountText: "Giảm 10% giá phòng (tối đa 500.000₫)",
    applicableHotels: ["*"],
    description: "Áp dụng chào hè cho toàn bộ các chi nhánh Sen Việt",
  },
  VIP500: {
    code: "VIP500",
    name: "Đặc quyền VIP - Giảm 500K",
    discountText: "Giảm 500.000₫ cho đơn từ 5.000.000₫",
    applicableHotels: ["*"],
    description: "Áp dụng cho đơn đặt phòng cao cấp từ 5.000.000₫",
  },
  MAX300K: {
    code: "MAX300K",
    name: "Siêu ưu đãi 50%",
    discountText: "Giảm 50% tiền phòng (tối đa 300.000₫)",
    applicableHotels: ["*"],
    description: "Ưu đãi giảm 50% giá trị tiền phòng tối đa 300.000₫",
  },
  DEMO2K: {
    code: "DEMO2K",
    name: "Trợ giá đồ án PayOS (2.000₫)",
    discountText: "Chỉ thanh toán 2.000₫ để quét mã QR thật",
    applicableHotels: ["*"],
    description: "Áp dụng toàn chuỗi để demo thanh toán VietQR thật 2.000₫",
  },
  DEMO: {
    code: "DEMO",
    name: "Ưu đãi Demo Đồ án (2.000₫)",
    discountText: "Chỉ thanh toán 2.000₫ để quét mã QR thật",
    applicableHotels: ["*"],
    description: "Áp dụng toàn chuỗi để demo quét mã VietQR thật 2.000₫",
  },
  TESTPAY: {
    code: "TESTPAY",
    name: "Ưu đãi Test Payment (2.000₫)",
    discountText: "Chỉ thanh toán 2.000₫",
    applicableHotels: ["*"],
    description: "Áp dụng toàn chuỗi để demo quét mã VietQR thật 2.000₫",
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
  if (normalizedCode === "SEN10") return Math.min(500000, Math.round(roomSubtotal * 0.1));
  if (normalizedCode === "SUMMER2026") return Math.min(500000, Math.round(roomSubtotal * 0.1));
  if (normalizedCode === "VIP20") {
    return roomSubtotal >= 2000000 ? Math.min(1000000, Math.round(roomSubtotal * 0.2)) : 0;
  }
  if (normalizedCode === "VIP500") {
    return roomSubtotal >= 5000000 ? 500000 : 0;
  }
  if (normalizedCode === "MAX300K") {
    return Math.min(300000, Math.round(roomSubtotal * 0.5));
  }
  if (normalizedCode === "DEMO" || normalizedCode === "DEMO2K" || normalizedCode === "TESTPAY") {
    return Math.max(0, roomSubtotal + (serviceTotal || 0) - 1852);
  }
  return 0;
}
