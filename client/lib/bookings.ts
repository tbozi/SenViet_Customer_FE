export type BookingStatus =
  "pending_payment" | "confirmed" | "completed" | "cancelled";

export interface GuestForm {
  adults: number;
  children: number;
  infants: number;
}

export interface RoomStay {
  roomCode: string;
  /** ID thực của phòng từ backend, tương ứng với roomCode được chọn */
  roomId?: number | string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guest: GuestForm;
  extraGuestCharge: number;
  nightlyPrice?: number;
  stayTotal?: number;
  offerId?: string;
  offerName?: string;
  offerCancellationPolicy?: string;
  services?: BookingService[];
}

export interface BookingService {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
  roomCode?: string;
  roomName?: string;
}

export interface BookingFee {
  label: string;
  amount: number;
  detail?: string;
  scope?: "room" | "booking";
  kind?: "surcharge" | "service";
}

export interface RoomSelection {
  roomId: string;
  roomName: string;
  roomNameVi: string;
  quantity: number;
  nightlyPrice: number;
  offerId?: string;
  offerName?: string;
  offerCancellationPolicy?: string;
  guestForms: GuestForm[];
  includedCapacity: GuestForm;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  roomCodes?: string[];
  stays?: RoomStay[];
  extraAdults: number;
  extraChildren: number;
  extraGuestCount: number;
  extraGuestCharge: number;
}

export interface CancellationInfo {
  policy: string;
  refundPercent: number;
  refundAmount: number;
  cancelledAt?: string;
  reason?: string;
  bankName?: string;
  bankCode?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  refundEmail?: string;
}

export interface Booking {
  id: string;
  userEmail: string;
  hotelSlug: string;
  hotelName: string;
  roomName: string;
  roomSelections?: RoomSelection[];
  services?: BookingService[];
  feeLines?: BookingFee[];
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  roomPrice: number;
  roomTotal: number;
  vat: number;
  serviceFee: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "qr" | "momo" | "vnpay";
  status: BookingStatus;
  createdAt: string;
  guestName: string;
  phone: string;
  email: string;
  cccd?: string;
  specialRequest: string;
  cancellationDeadline: string;
  cancellationPolicy?: string;
  cancellation?: CancellationInfo;
  holdUntil: string;
  arrivalTime?: string;
  departureTime?: string;
  surcharge?: number;
  extraGuestCharge?: number;
}

export function isRoomSpecificFee(fee: BookingFee) {
  if (fee.scope) return fee.scope === "room";
  return /phụ thu|dịch vụ/i.test(fee.label);
}

const KEY = "senviet_bookings";

export function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Booking[];
  } catch {
    return [];
  }
}

export function saveBooking(booking: Booking) {
  localStorage.setItem(KEY, JSON.stringify([booking, ...getBookings()]));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("senviet_booking_updated", { detail: { booking } }));
    window.dispatchEvent(new Event("storage"));
  }
}

export function updateBooking(id: string, patch: Partial<Booking>) {
  localStorage.setItem(
    KEY,
    JSON.stringify(
      getBookings().map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    ),
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("senviet_booking_updated", { detail: { id, patch } }));
    window.dispatchEvent(new Event("storage"));
  }
}

export function calculateNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T14:00:00`).getTime();
  const end = new Date(`${checkOut}T12:00:00`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  const nights = Math.round((end - start) / 86400000);
  return nights > 0 ? nights : 0;
}

const roomInventory = [6, 6, 5, 4];

function stableDateSeed(roomIndex: number, date: string) {
  return Array.from(`${roomIndex}-${date}`).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0,
  );
}

export function getDailyRoomAvailability(
  roomIndex: number,
  date: string,
  requestedRooms = 1,
  overrideInventory?: number,
  roomIdentifier?: { id?: string | number; codes?: string[] },
) {
  const baseInventory =
    overrideInventory !== undefined
      ? overrideInventory
      : roomInventory[roomIndex] || 1;

  // Tính số lượng phòng đã bị đặt trên khoảng ngày này
  let bookedCount = 0;
  try {
    const activeBookings = getBookings().filter(
      (b) => b.status !== "cancelled" && b.checkIn <= date && date < b.checkOut,
    );
    for (const b of activeBookings) {
      if (b.roomSelections) {
        for (const sel of b.roomSelections) {
          const matchId =
            roomIdentifier?.id !== undefined &&
            String(sel.roomId) === String(roomIdentifier.id);
          const matchCodes =
            roomIdentifier?.codes &&
            sel.roomCodes?.some((c) => roomIdentifier.codes!.includes(c));
          if (matchId || matchCodes) {
            bookedCount += sel.quantity || 1;
          }
        }
      }
    }
  } catch {
    bookedCount = 0;
  }

  const remaining = Math.max(0, baseInventory - bookedCount);
  return { available: remaining >= requestedRooms, remaining };
}

export function getDailyRoomPrice(
  basePrice: number,
  _roomIndex: number,
  _date: string,
) {
  return basePrice;
}

export function getMockRoomAvailability(
  roomIndex: number,
  requestedRooms: number,
  checkIn: string,
  checkOut: string,
  overrideInventory?: number,
  roomIdentifier?: { id?: string | number; codes?: string[] },
) {
  if (
    !checkIn ||
    !checkOut ||
    requestedRooms < 1 ||
    calculateNights(checkIn, checkOut) < 1
  )
    return { available: false, remaining: 0 };
  const dates = Array.from(
    { length: calculateNights(checkIn, checkOut) },
    (_, index) => {
      const date = new Date(`${checkIn}T12:00:00`);
      date.setDate(date.getDate() + index);
      return date.toISOString().slice(0, 10);
    },
  );
  const daily = dates.map((date) =>
    getDailyRoomAvailability(
      roomIndex,
      date,
      requestedRooms,
      overrideInventory,
      roomIdentifier,
    ),
  );
  return {
    available: daily.every((item) => item.available),
    remaining: Math.min(...daily.map((item) => item.remaining)),
  };
}

export function getCancellationSchedule(checkIn: string) {
  const checkInDate = new Date(`${checkIn}T14:00:00`);
  const fullRefundUntil = new Date(checkInDate);
  fullRefundUntil.setDate(fullRefundUntil.getDate() - 3);
  const halfRefundFrom = new Date(fullRefundUntil);
  halfRefundFrom.setDate(halfRefundFrom.getDate() + 1);
  const halfRefundUntil = new Date(checkInDate);
  halfRefundUntil.setDate(halfRefundUntil.getDate() - 1);
  const noRefundFrom = new Date(halfRefundUntil);
  noRefundFrom.setDate(noRefundFrom.getDate() + 1);
  const format = (date: Date) => date.toLocaleDateString("vi-VN");
  return {
    fullRefundUntil: format(fullRefundUntil),
    halfRefundFrom: format(halfRefundFrom),
    halfRefundUntil: format(halfRefundUntil),
    noRefundFrom: format(noRefundFrom),
  };
}

export function getCancellationScheduleText(checkIn: string) {
  if (!checkIn) {
    return "Chính sách hoàn hủy: Hủy trước giờ nhận phòng từ 72 giờ (3 ngày) hoàn 100%; hủy từ 24 đến dưới 72 giờ hoàn 50%; hủy trong vòng 24 giờ trước nhận phòng không hoàn tiền.";
  }
  const schedule = getCancellationSchedule(checkIn);
  return `Chính sách hoàn hủy: Hủy trước ngày ${schedule.fullRefundUntil} (từ 72 giờ trước nhận phòng) được hoàn 100%; hủy từ ${schedule.halfRefundFrom} đến ${schedule.halfRefundUntil} (24–72 giờ) hoàn 50%; hủy từ ngày ${schedule.noRefundFrom} (dưới 24 giờ) không hoàn tiền.`;
}

export function getCancellationNotice(checkIn: string, now = new Date(), isEn = false) {
  if (!checkIn) {
    return {
      type: "free" as const,
      text: isEn ? "Free 100% cancellation up to 72 hours before check-in" : "Miễn phí hủy 100% khi báo trước từ 72 giờ (3 ngày)",
      badgeClass: "text-emerald-700 bg-emerald-50/80 border-emerald-200/60",
      statusText: isEn ? "100% Refund" : "Hoàn 100%",
      detail: isEn ? "Cancel 72+ hours before check-in" : "Hủy trước giờ nhận phòng từ 72 giờ",
    };
  }

  const checkInDate = new Date(`${checkIn}T14:00:00`);
  const diffHours = (checkInDate.getTime() - now.getTime()) / (1000 * 3600);
  const daysBefore = Math.floor(diffHours / 24);

  // TH1: Hạn hoàn 100% (trước 72h)
  if (diffHours >= 72) {
    const fullRefundUntil = new Date(checkInDate);
    fullRefundUntil.setDate(fullRefundUntil.getDate() - 3);
    const format = (date: Date) => date.toLocaleDateString(isEn ? "en-US" : "vi-VN");
    return {
      type: "free" as const,
      text: isEn ? `100% free cancellation until ${format(fullRefundUntil)} (72h prior to check-in)` : `Miễn phí hủy 100% đến hết ngày ${format(fullRefundUntil)} (trước 72 giờ nhận phòng)`,
      badgeClass: "text-emerald-700 bg-emerald-50/80 border-emerald-200/60",
      statusText: isEn ? "100% Refund" : "Hoàn 100%",
      detail: isEn ? "Cancel 72+ hours before check-in" : "Hủy trước giờ nhận phòng từ 72 giờ",
    };
  }

  // TH2: Từ 24h đến dưới 72h (hoàn 50%)
  if (diffHours >= 24) {
    return {
      type: "partial" as const,
      text: isEn ? "Cancellation 24–72h before check-in: 50% refund applies" : "Hủy phòng hiện tại (còn 24–72 giờ trước nhận phòng): hoàn 50% phí đặt phòng",
      badgeClass: "text-amber-700 bg-amber-50/80 border-amber-200/60",
      statusText: isEn ? "50% Refund" : "Hoàn 50%",
      detail: isEn ? "Free 100% cancellation window passed (under 72h)" : "Còn từ 24 đến dưới 72 giờ trước giờ nhận phòng",
    };
  }

  // TH3: Sát giờ nhận phòng (dưới 24h)
  return {
    type: "non-refundable" as const,
    text: isEn ? "Non-refundable if cancelled (within 24h of check-in)" : "Đặt phòng sát ngày (dưới 24 giờ trước nhận phòng): không hoàn tiền nếu hủy",
    badgeClass: "text-rose-700 bg-rose-50/80 border-rose-200/60",
    statusText: isEn ? "Non-refundable" : "Không hoàn tiền",
    detail: isEn ? "Cancel under 24 hours before check-in: 0% refund" : "Hủy trong vòng 24 giờ trước nhận phòng: hoàn 0%",
  };
}

export function getCancellationPolicy(checkIn: string, now = new Date(), isEn = false) {
  if (!checkIn) {
    return {
      canCancel: true,
      refundPercent: 100,
      policy: isEn ? "Cancel 72+ hours before check-in: 100% refund." : "Hủy trước 72 giờ (3 ngày) trước ngày nhận phòng: hoàn 100%.",
      daysBefore: 999,
    };
  }
  const checkInDate = new Date(`${checkIn}T14:00:00`);
  const diffHours = (checkInDate.getTime() - now.getTime()) / (1000 * 3600);
  const daysBefore = Math.floor(diffHours / 24);

  if (diffHours >= 72)
    return {
      canCancel: true,
      refundPercent: 100,
      policy: isEn ? "Cancel 72+ hours (3+ days) before check-in: 100% refund." : "Hủy trước 72 giờ (từ 3 ngày trước ngày nhận phòng): hoàn 100%.",
      daysBefore,
    };
  if (diffHours >= 24)
    return {
      canCancel: true,
      refundPercent: 50,
      policy: isEn ? "Cancel 24 to 72 hours (1-3 days) before check-in: 50% refund." : "Hủy từ 24 đến 72 giờ (từ 1 đến dưới 3 ngày trước nhận phòng): hoàn 50%.",
      daysBefore,
    };
  return {
    canCancel: true,
    refundPercent: 0,
    policy: isEn
      ? "Cancel less than 24 hours before check-in: non-refundable (0% refund)."
      : "Hủy dưới 24 giờ trước ngày nhận phòng: không hoàn tiền (hoàn 0%).",
    daysBefore,
  };
}

export function calculateEarlyCheckInSurcharge(
  nightlyPrice: number,
  arrivalTime: string,
): number {
  if (!arrivalTime) return 0;
  const [hour] = arrivalTime.split(":").map(Number);
  if (isNaN(hour)) return 0;
  if (hour < 6) return nightlyPrice;
  if (hour < 9) return Math.round(nightlyPrice * 0.5);
  if (hour < 14) return Math.round(nightlyPrice * 0.3);
  return 0;
}

export function calculateLateCheckOutSurcharge(
  nightlyPrice: number,
  departureTime: string,
): number {
  if (!departureTime) return 0;
  const [hour] = departureTime.split(":").map(Number);
  if (isNaN(hour)) return 0;
  if (hour >= 18) return nightlyPrice;
  if (hour >= 15) return Math.round(nightlyPrice * 0.5);
  if (hour > 12) return Math.round(nightlyPrice * 0.3);
  return 0;
}
