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

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : 14 * 60;
}

export function getEarlyCheckInRate(arrivalTime: string) {
  const minutes = timeToMinutes(arrivalTime);
  if (minutes < 6 * 60) return 1;
  if (minutes < 9 * 60) return 0.5;
  if (minutes < 14 * 60) return 0.3;
  return 0;
}

export function getLateCheckOutRate(departureTime: string) {
  const minutes = timeToMinutes(departureTime);
  if (minutes >= 18 * 60) return 1;
  if (minutes >= 15 * 60) return 0.5;
  if (minutes >= 12 * 60) return 0.3;
  return 0;
}

export function calculateEarlyCheckInSurcharge(
  price: number,
  arrivalTime: string,
) {
  return Math.round(price * getEarlyCheckInRate(arrivalTime));
}

export function calculateLateCheckOutSurcharge(
  price: number,
  departureTime: string,
) {
  return Math.round(price * getLateCheckOutRate(departureTime));
}

export function calculateSurcharge(
  price: number,
  arrivalTime: string,
  departureTime: string,
) {
  return (
    calculateEarlyCheckInSurcharge(price, arrivalTime) +
    calculateLateCheckOutSurcharge(price, departureTime)
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
