const SAVED_PROMOTIONS_KEY = "senviet_saved_promotions";

export const promotionNames: Record<string, string> = {
  STAY3FREE: "Ở 3 đêm, tặng 1 đêm",
  SENMEMBER: "Ưu đãi thành viên Sen Việt",
  WEEKEND: "Trọn gói cuối tuần",
  BREAKFAST: "Bữa sáng trọn vị",
  SPA20: "Thư giãn cùng Spa",
  FAMILY10: "Kỳ nghỉ gia đình",
  LONGSTAY12: "Ở lâu, tiết kiệm nhiều",
  SEN10: "Ưu đãi Sen Việt",
};

function readSavedPromotions() {
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
}

export function getSavedPromotionCodes(email: string) {
  return readSavedPromotions()[email.toLowerCase()] || [];
}

export function toggleSavedPromotion(email: string, code: string) {
  const saved = readSavedPromotions();
  const account = email.toLowerCase();
  const current = saved[account] || [];
  saved[account] = current.includes(code)
    ? current.filter((item) => item !== code)
    : [...current, code];
  writeSavedPromotions(saved);
  return saved[account];
}

export function getPromotionDiscount(
  code: string,
  values: {
    roomSubtotal: number;
    serviceTotal: number;
    nights: number;
    roomCount: number;
  },
) {
  const normalizedCode = code.trim().toUpperCase();
  const { roomSubtotal, serviceTotal, nights, roomCount } = values;
  if (normalizedCode === "STAY3FREE") {
    return nights >= 3 ? Math.min(roomSubtotal, Math.round(roomSubtotal / nights)) : 0;
  }
  if (normalizedCode === "SENMEMBER") return Math.round(roomSubtotal * 0.15);
  if (normalizedCode === "WEEKEND") return Math.round(roomSubtotal * 0.1);
  if (normalizedCode === "BREAKFAST") return Math.min(roomSubtotal, roomCount * 200000);
  if (normalizedCode === "SPA20") return Math.round(serviceTotal * 0.2);
  if (normalizedCode === "FAMILY10") return Math.round(roomSubtotal * 0.1);
  if (normalizedCode === "LONGSTAY12") {
    return nights >= 7 ? Math.round(roomSubtotal * 0.12) : 0;
  }
  if (normalizedCode === "SEN10") return Math.round(roomSubtotal * 0.1);
  return 0;
}
