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
}

export function calculateNights(checkIn: string, checkOut: string) {
  return Math.round(
    (new Date(`${checkOut}T12:00:00`).getTime() -
      new Date(`${checkIn}T14:00:00`).getTime()) /
      86400000,
  );
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
  const checkInDate = new Date(`${checkIn}T00:00:00`);
  const fullRefundUntil = new Date(checkInDate);
  fullRefundUntil.setDate(fullRefundUntil.getDate() - 7);
  const halfRefundFrom = new Date(checkInDate);
  halfRefundFrom.setDate(halfRefundFrom.getDate() - 6);
  const halfRefundUntil = new Date(checkInDate);
  halfRefundUntil.setDate(halfRefundUntil.getDate() - 3);
  const noRefundFrom = new Date(checkInDate);
  noRefundFrom.setDate(noRefundFrom.getDate() - 2);
  const format = (date: Date) => date.toLocaleDateString("vi-VN");

  return {
    fullRefundUntil: format(fullRefundUntil),
    halfRefundFrom: format(halfRefundFrom),
    halfRefundUntil: format(halfRefundUntil),
    noRefundFrom: format(noRefundFrom),
  };
}

export function getCancellationScheduleText(checkIn: string) {
  const schedule = getCancellationSchedule(checkIn);
  return `Hoàn 100% nếu hủy trước hoặc trong ngày ${schedule.fullRefundUntil}; hoàn 50% từ ${schedule.halfRefundFrom} đến ${schedule.halfRefundUntil}; từ ${schedule.noRefundFrom} hoặc no-show: không hoàn.`;
}

export function getCancellationNotice(checkIn: string, now = new Date()) {
  if (!checkIn) {
    return {
      type: "free" as const,
      text: "Miễn phí hủy trước ngày nhận phòng 7 ngày",
      badgeClass: "text-emerald-700 bg-emerald-50/80 border-emerald-200/60",
      statusText: "Hoàn 100%",
      detail: "Hủy trước 7 ngày nhận phòng",
    };
  }

  const checkInDate = new Date(`${checkIn}T00:00:00`);
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Hạn hủy hoàn 100% (7 ngày trước nhận phòng)
  const fullRefundUntil = new Date(checkInDate);
  fullRefundUntil.setDate(fullRefundUntil.getDate() - 7);

  // Hạn hủy hoàn 50% (3 ngày trước nhận phòng)
  const halfRefundUntil = new Date(checkInDate);
  halfRefundUntil.setDate(halfRefundUntil.getDate() - 3);

  const format = (date: Date) => date.toLocaleDateString("vi-VN");

  // TH1: Hạn hoàn 100% vẫn còn trong tương lai hoặc hôm nay
  if (fullRefundUntil.getTime() >= todayDate.getTime()) {
    return {
      type: "free" as const,
      text: `Miễn phí hủy trước ngày ${format(fullRefundUntil)}`,
      badgeClass: "text-emerald-700 bg-emerald-50/80 border-emerald-200/60",
      statusText: "Hoàn 100%",
      detail: "Hủy trước 7 ngày nhận phòng",
    };
  }

  // TH2: Đã quá hạn 100%, nhưng vẫn còn trước hạn hoàn 50% (từ 3 đến dưới 7 ngày)
  if (halfRefundUntil.getTime() >= todayDate.getTime()) {
    return {
      type: "partial" as const,
      text: `Hủy trước ngày ${format(halfRefundUntil)}: hoàn 50%`,
      badgeClass: "text-amber-700 bg-amber-50/80 border-amber-200/60",
      statusText: "Hoàn 50%",
      detail: "Đã quá hạn miễn phí hủy 100%",
    };
  }

  // TH3: Đặt sát ngày (dưới 3 ngày trước nhận phòng)
  return {
    type: "non-refundable" as const,
    text: "Không hoàn tiền khi hủy (dưới 3 ngày)",
    badgeClass: "text-rose-700 bg-rose-50/80 border-rose-200/60",
    statusText: "Không hoàn tiền",
    detail: "Hủy dưới 3 ngày trước nhận phòng: hoàn 0%",
  };
}

export function getCancellationPolicy(checkIn: string, now = new Date()) {
  if (!checkIn) {
    return {
      canCancel: true,
      refundPercent: 100,
      policy: "Hủy từ 7 ngày trước ngày nhận phòng: hoàn 100%.",
      daysBefore: 999,
    };
  }
  const checkInDate = new Date(`${checkIn}T00:00:00`);
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysBefore = Math.floor(
    (checkInDate.getTime() - todayDate.getTime()) / 86400000,
  );
  if (daysBefore >= 7)
    return {
      canCancel: true,
      refundPercent: 100,
      policy: "Hủy từ 7 ngày trước ngày nhận phòng: hoàn 100%.",
      daysBefore,
    };
  if (daysBefore >= 3)
    return {
      canCancel: true,
      refundPercent: 50,
      policy: "Hủy từ 3 đến dưới 7 ngày trước ngày nhận phòng: hoàn 50%.",
      daysBefore,
    };
  return {
    canCancel: true,
    refundPercent: 0,
    policy:
      "Hủy dưới 3 ngày trước ngày nhận phòng: không hoàn tiền (hoàn 0%).",
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
