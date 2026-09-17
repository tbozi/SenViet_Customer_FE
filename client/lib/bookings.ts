export type BookingStatus =
  "pending_payment" | "confirmed" | "completed" | "cancelled";

export interface GuestForm {
  adults: number;
  children: number;
  infants: number;
}

export interface RoomStay {
  roomCode: string;
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

const roomInventory = [4, 3, 2, 2];

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
) {
  const baseInventory = roomInventory[roomIndex] || 1;
  const seed = stableDateSeed(roomIndex, date);
  const isMockSoldOutDate = seed % 29 === 0;
  const heldRooms = baseInventory > 1 ? seed % 2 : 0;
  const remaining = isMockSoldOutDate
    ? 0
    : Math.max(0, baseInventory - heldRooms);
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
    getDailyRoomAvailability(roomIndex, date, requestedRooms),
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

export function getCancellationPolicy(checkIn: string, now = new Date()) {
  const daysBefore =
    (new Date(`${checkIn}T00:00:00`).getTime() - now.getTime()) / 86400000;
  if (daysBefore >= 7)
    return {
      refundPercent: 100,
      policy: "Hủy từ 7 ngày trước ngày nhận phòng: hoàn 100%.",
    };
  if (daysBefore >= 3)
    return {
      refundPercent: 50,
      policy: "Hủy từ 3 đến dưới 7 ngày trước ngày nhận phòng: hoàn 50%.",
    };
  return {
    refundPercent: 0,
    policy:
      "Hủy dưới 3 ngày trước ngày nhận phòng hoặc không đến: không hoàn tiền.",
  };
}
