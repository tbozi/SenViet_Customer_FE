import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  AlertCircle,
  Bed,
  BedDouble,
  Building,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  MapPin,
  ShieldAlert,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickSearch from "@/components/QuickSearch";
import RoomAvailabilityCalendar from "@/components/RoomAvailabilityCalendar";
import BookingSummaryPanel from "@/components/booking/BookingSummaryPanel";
import { rooms as defaultRooms, type RoomType } from "@/data/rooms";
import { fetchRoomsByHotel } from "@/services/roomApi";
import { formatVnd, hotels } from "@/data/hotels";
import {
  calculateEarlyCheckInSurcharge,
  calculateLateCheckOutSurcharge,
  calculateNights,
  getCancellationNotice,
  getCancellationSchedule,
  getMockRoomAvailability,
  type GuestForm,
  type RoomSelection,
  type RoomStay,
} from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n";
const today = new Date();
const dateValue = (date: Date) => date.toISOString().slice(0, 10);
const defaultGuest = (searchParams: URLSearchParams): GuestForm => ({
  adults: Number(searchParams.get("adults") || 1),
  children: Number(searchParams.get("children") || 0),
  infants: 0,
});

type StayDates = { checkIn: string; checkOut: string };
type CalendarTarget = { roomId: string; stayIndex: number };

function nextDate(date: string) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + 1);
  return dateValue(next);
}

function extraGuests(room: RoomType, guest: GuestForm) {
  const extraAdults = Math.max(0, guest.adults - room.capacity.adults);
  const extraChildren = Math.max(0, guest.children - room.capacity.children);
  return {
    extraAdults,
    extraChildren,
    extraGuestCount: extraAdults + extraChildren,
    extraGuestCharge: (extraAdults + extraChildren) * 500000,
  };
}

function RoomDetailsModal({
  room,
  remainingRooms,
  checkInDate,
  onClose,
}: {
  room: RoomType;
  remainingRooms?: number;
  checkInDate?: string;
  onClose: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = [
    room.image,
    ...defaultRooms.filter((item) => item.id !== room.id).map((item) => item.image),
  ].slice(0, 3);

  const moveImage = (amount: number) =>
    setImageIndex(
      (current) => (current + amount + images.length) % images.length,
    );

  const notice = checkInDate ? getCancellationNotice(checkInDate) : null;
  const availableCount =
    remainingRooms !== undefined ? remainingRooms : room.inventory;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-detail-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết phòng"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:bg-rose-50 hover:text-rose-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid lg:grid-cols-[minmax(320px,1fr)_1.25fr]">
          {/* CỘT TRÁI: HÌNH ẢNH & SLIDER */}
          <div className="relative flex flex-col justify-between bg-slate-900 p-4 sm:p-6">
            <div className="relative flex min-h-[280px] flex-1 items-center justify-center">
              <img
                src={images[imageIndex]}
                alt={`${room.nameVi} - ảnh ${imageIndex + 1}`}
                className="aspect-[4/3] max-h-[460px] w-full rounded-xl object-cover shadow-lg"
              />
              <button
                type="button"
                onClick={() => moveImage(-1)}
                aria-label="Ảnh trước"
                className="absolute left-3 rounded-full bg-white/90 p-2 text-primary shadow-md hover:bg-white sm:left-4"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => moveImage(1)}
                aria-label="Ảnh sau"
                className="absolute right-3 rounded-full bg-white/90 p-2 text-primary shadow-md hover:bg-white sm:right-4"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-slate-950/60 px-2.5 py-1 backdrop-blur-sm">
                {images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    aria-label={`Chọn ảnh ${index + 1}`}
                    onClick={() => setImageIndex(index)}
                    className={`h-2 w-2 rounded-full transition-all ${
                      imageIndex === index
                        ? "w-5 bg-gold"
                        : "bg-white/50 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Thumbnail selector */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setImageIndex(idx)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    imageIndex === idx
                      ? "border-gold shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt="thumbnail"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: NỘI DUNG CHI TIẾT */}
          <div className="p-5 sm:p-8">
            {/* Header phòng & Giá */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold">
                  {room.name}
                </p>
                <h2
                  id="room-detail-title"
                  className="mt-1 font-display text-2xl font-bold text-primary sm:text-3xl"
                >
                  {room.nameVi}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Giá từ</span>
                <p className="text-2xl font-black text-primary">
                  {formatVnd(room.price)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    / đêm
                  </span>
                </p>
              </div>
            </div>

            {/* Khối Thông số cơ bản (Giường, Người, Diện tích, Vị trí) */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BedDouble className="h-4 w-4 text-gold" /> Loại giường
                </span>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {room.bedsVi}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-4 w-4 text-gold" /> Sức chứa
                </span>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  Tối đa {room.capacity.adults} người lớn
                  {room.capacity.children > 0
                    ? `, ${room.capacity.children} trẻ`
                    : ""}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building className="h-4 w-4 text-gold" /> Diện tích
                </span>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  {room.size}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold" /> Vị trí
                </span>
                <p className="mt-1 text-xs font-bold text-slate-800">
                  Tòa {room.building} · Tầng {room.floor}
                </p>
              </div>
            </div>

            {/* Tình trạng phòng & Mô tả */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span
                className={`rounded-full px-3 py-1 font-bold ${
                  availableCount > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {availableCount > 0
                  ? `Còn ${availableCount} phòng trống`
                  : "Hết phòng"}
              </span>
              <span className="text-muted-foreground">
                Tòa {room.building} · Tầng {room.floor} · Giá cố định
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {room.description}
            </p>

            {/* CHÍNH SÁCH HỦY PHÒNG */}
            <div className="mt-5 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-amber-50/40 to-white p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Chính sách hủy phòng & hoàn tiền:</span>
              </div>

              <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5">
                  <span className="font-extrabold text-emerald-700">100% Hoàn tiền</span>
                  <p className="mt-0.5 text-[11px] text-emerald-900/80">
                    Hủy trước từ 7 ngày trở lên
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5">
                  <span className="font-extrabold text-amber-700">50% Hoàn tiền</span>
                  <p className="mt-0.5 text-[11px] text-amber-900/80">
                    Hủy từ 3 đến dưới 7 ngày
                  </p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-2.5">
                  <span className="font-extrabold text-rose-700">0% Không hoàn tiền</span>
                  <p className="mt-0.5 text-[11px] text-rose-900/80">
                    Hủy dưới 3 ngày nhận phòng
                  </p>
                </div>
              </div>

              {notice && (
                <div
                  className={`mt-2.5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${notice.badgeClass}`}
                >
                  {notice.type === "free" ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : notice.type === "partial" ? (
                    <span className="text-xs">⚠️</span>
                  ) : (
                    <span className="text-xs font-bold">✕</span>
                  )}
                  <span>{notice.text}</span>
                </div>
              )}
            </div>

            {/* CHÍNH SÁCH PHỤ THU CHO KHÁCH HÀNG */}
            <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Chính sách phụ thu cho khách hàng:</span>
              </div>

              <div className="mt-3 space-y-2.5 text-slate-700">
                <div className="flex items-start justify-between gap-3 border-b border-blue-100 pb-2">
                  <div>
                    <span className="font-bold text-slate-900">
                      • Phụ thu người lớn thêm (vượt sức chứa chuẩn):
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Đã bao gồm tiện ích phòng & bữa sáng (nếu gói có kèm ăn sáng)
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-primary">
                    500.000₫ / người / đêm
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 border-b border-blue-100 pb-2">
                  <div>
                    <span className="font-bold text-slate-900">
                      • Trẻ em từ 2 đến dưới 12 tuổi:
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Em bé dưới 2 tuổi: Miễn phí lưu trú (ngủ cùng giường với bố mẹ)
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-primary">
                    250.000₫ / trẻ / đêm
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 border-b border-blue-100 pb-2">
                  <div>
                    <span className="font-bold text-slate-900">
                      • Nhận phòng sớm (Check-in sớm):
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Trước 06:00: 100% giá 1 đêm · Từ 06:00 – 09:00: 50% · Từ 09:00 – 14:00: 30%
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-slate-800">
                    30% – 100% giá 1 đêm
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900">
                      • Trả phòng trễ (Check-out trễ):
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Từ 12:00 – 15:00: 30% · Từ 15:00 – 18:00: 50% · Sau 18:00: 100% giá 1 đêm
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-slate-800">
                    30% – 100% giá 1 đêm
                  </span>
                </div>
              </div>
            </div>

            {/* Tiện ích trong phòng */}
            <div className="mt-5">
              <h3 className="text-sm font-bold text-primary">
                Tiện ích & trang thiết bị có sẵn trong phòng:
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {room.amenities.map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function HotelRooms() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const hotel = hotels.find((item) => item.slug === slug) || hotels[0];
  const [rooms, setRooms] = useState<RoomType[]>(defaultRooms);

  useEffect(() => {
    let isMounted = true;
    if (slug || hotel.slug) {
      fetchRoomsByHotel(slug || hotel.slug).then((fetched) => {
        if (isMounted && fetched && fetched.length > 0) {
          setRooms(fetched);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [slug, hotel.slug]);

  const initialCheckIn = searchParams.get("checkIn") || dateValue(today);
  const initialCheckOut =
    searchParams.get("checkOut") || nextDate(initialCheckIn);
  const [defaultDates, setDefaultDates] = useState<StayDates>({
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
  });
  const [roomStays, setRoomStays] = useState<Record<string, StayDates[]>>(() =>
    Object.fromEntries(defaultRooms.map((room) => [room.id, []])),
  );
  const [arrivalTime, setArrivalTime] = useState("14:00");
  const [departureTime, setDepartureTime] = useState("12:00");
  const oldRoom = (searchParams.get("room") || "").toLowerCase();
  const oldRoomIndex = defaultRooms.findIndex(
    (room) =>
      oldRoom.includes(room.id) || oldRoom.includes(room.nameVi.toLowerCase()),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial = Object.fromEntries(defaultRooms.map((room) => [room.id, 0]));
    const legacyIndex = oldRoomIndex >= 0 ? oldRoomIndex : 0;
    initial[defaultRooms[legacyIndex].id] = Math.min(
      4,
      Math.max(0, Number(searchParams.get("rooms") || 0)),
    );
    return initial;
  });
  const [guestForms, setGuestForms] = useState<Record<string, GuestForm[]>>(
    () => {
      const initial = Object.fromEntries(
        defaultRooms.map((room) => [room.id, [] as GuestForm[]]),
      );
      const legacyIndex = oldRoomIndex >= 0 ? oldRoomIndex : 0;
      const quantity = Math.min(
        4,
        Math.max(0, Number(searchParams.get("rooms") || 0)),
      );
      initial[defaultRooms[legacyIndex].id] = Array.from({ length: quantity }, () =>
        defaultGuest(searchParams),
      );
      return initial;
    },
  );
  const [selectedRoomCodes, setSelectedRoomCodes] = useState<
    Record<string, string[]>
  >(() => {
    const initial = Object.fromEntries(
      defaultRooms.map((room) => [room.id, [] as string[]]),
    );
    const legacyIndex = oldRoomIndex >= 0 ? oldRoomIndex : 0;
    const quantity = Math.min(
      4,
      Math.max(0, Number(searchParams.get("rooms") || 0)),
    );
    initial[defaultRooms[legacyIndex].id] = defaultRooms[legacyIndex].roomCodes.slice(
      0,
      quantity,
    );
    return initial;
  });
  const [selectedRoom, setSelectedRoom] = useState(
    oldRoomIndex >= 0 ? oldRoomIndex : 0,
  );
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget | null>(
    null,
  );
  const [detailRoom, setDetailRoom] = useState<number | null>(null);
  const [error, setError] = useState("");

  const getDates = (roomId: string, index: number) =>
    roomStays[roomId]?.[index] || defaultDates;

  const maxAvailable = (roomIndex: number, dates: StayDates) => {
    const room = rooms[roomIndex];
    if (room && room.availableRooms !== undefined) {
      return room.availableRooms.length;
    }
    const result = getMockRoomAvailability(
      roomIndex,
      1,
      dates.checkIn,
      dates.checkOut,
    );
    return Math.max(0, result.remaining);
  };

  const setRoomQuantity = (roomId: string, requestedQuantity: number) => {
    const roomIndex = rooms.findIndex((room) => room.id === roomId);
    const currentDates = roomStays[roomId]?.[0] || defaultDates;
    const quantity = Math.min(
      Math.max(0, requestedQuantity),
      maxAvailable(roomIndex, currentDates),
    );
    setQuantities((current) => ({ ...current, [roomId]: quantity }));
    setGuestForms((current) => ({
      ...current,
      [roomId]: Array.from(
        { length: quantity },
        (_, index) => current[roomId]?.[index] || defaultGuest(searchParams),
      ),
    }));
    setRoomStays((current) => ({
      ...current,
      [roomId]: Array.from(
        { length: quantity },
        (_, index) => current[roomId]?.[index] || { ...defaultDates },
      ),
    }));
    setSelectedRoomCodes((current) => {
      const existing = current[roomId] || [];
      const roomDef = rooms.find((r) => r.id === roomId);
      const allCodes = roomDef?.roomCodes || [];
      const updated: string[] = [];
      for (let i = 0; i < quantity; i++) {
        if (existing[i] && !updated.includes(existing[i])) {
          updated.push(existing[i]);
        } else {
          const availableCode =
            allCodes.find((c) => !updated.includes(c)) ||
            allCodes[0] ||
            `Phòng ${i + 1}`;
          updated.push(availableCode);
        }
      }
      return { ...current, [roomId]: updated };
    });
  };

  const removeRoomStay = (roomId: string, stayIndex: number) => {
    const currentQty = quantities[roomId] || 0;
    if (currentQty <= 1) {
      setRoomQuantity(roomId, 0);
      return;
    }
    const newQty = currentQty - 1;
    setQuantities((current) => ({ ...current, [roomId]: newQty }));
    setGuestForms((current) => ({
      ...current,
      [roomId]: (current[roomId] || []).filter((_, i) => i !== stayIndex),
    }));
    setRoomStays((current) => ({
      ...current,
      [roomId]: (current[roomId] || []).filter((_, i) => i !== stayIndex),
    }));
    setSelectedRoomCodes((current) => ({
      ...current,
      [roomId]: (current[roomId] || []).filter((_, i) => i !== stayIndex),
    }));
  };

  const updateStayRoomCode = (
    roomId: string,
    stayIndex: number,
    newRoomCode: string,
  ) => {
    setSelectedRoomCodes((current) => {
      const list = [...(current[roomId] || [])];
      list[stayIndex] = newRoomCode;
      return { ...current, [roomId]: list };
    });
  };

  const updateGuest = (
    roomId: string,
    index: number,
    field: keyof GuestForm,
    value: number,
  ) =>
    setGuestForms((current) => ({
      ...current,
      [roomId]: (current[roomId] || []).map((guest, guestIndex) =>
        guestIndex === index ? { ...guest, [field]: value } : guest,
      ),
    }));

  const updateStay = (
    roomId: string,
    stayIndex: number,
    field: keyof StayDates,
    value: string,
  ) => {
    const existing = getDates(roomId, stayIndex);
    const updated =
      field === "checkIn"
        ? {
            checkIn: value,
            checkOut:
              existing.checkOut <= value ? nextDate(value) : existing.checkOut,
          }
        : { ...existing, checkOut: value };
    setRoomStays((current) => ({
      ...current,
      [roomId]: (current[roomId] || []).map((stay, index) =>
        index === stayIndex ? updated : stay,
      ),
    }));
  };

  const selectCalendarRange = (
    roomId: string,
    stayIndex: number,
    checkIn: string,
    checkOut: string,
  ) => {
    const updated = { checkIn, checkOut };
    setRoomStays((current) => ({
      ...current,
      [roomId]: (current[roomId] || []).map((stay, index) =>
        index === stayIndex ? updated : stay,
      ),
    }));
  };

  const selections = useMemo<RoomSelection[]>(
    () =>
      rooms.flatMap((room) => {
        const quantity = quantities[room.id] || 0;
        if (!quantity) return [];
        const dates = roomStays[room.id] || [];
        const forms = (guestForms[room.id] || []).slice(0, quantity);
        const codes = selectedRoomCodes[room.id] || [];
        const stays: RoomStay[] = Array.from(
          { length: quantity },
          (_, index) => {
            const stayDates = dates[index] || defaultDates;
            const guest = forms[index] || defaultGuest(searchParams);
            const extra = extraGuests(room, guest);
            const roomCode =
              codes[index] || room.roomCodes[index] || `Phòng ${index + 1}`;
            // Lookup roomId thực từ availableRooms dựa trên code được chọn
            const matchedRoom = room.availableRooms?.find((r) => r.code === roomCode);
            const stayRoomId = matchedRoom?.id ?? room.roomId;
            return {
              roomCode,
              roomId: stayRoomId,
              checkIn: stayDates.checkIn,
              checkOut: stayDates.checkOut,
              nights: calculateNights(stayDates.checkIn, stayDates.checkOut),
              guest,
              extraGuestCharge: extra.extraGuestCharge,
            };
          },
        );
        const extras = forms.reduce(
          (sum, guest) => {
            const extra = extraGuests(room, guest);
            return {
              extraAdults: sum.extraAdults + extra.extraAdults,
              extraChildren: sum.extraChildren + extra.extraChildren,
              extraGuestCount: sum.extraGuestCount + extra.extraGuestCount,
              extraGuestCharge: sum.extraGuestCharge + extra.extraGuestCharge,
            };
          },
          {
            extraAdults: 0,
            extraChildren: 0,
            extraGuestCount: 0,
            extraGuestCharge: 0,
          },
        );
        const firstStay = stays[0];
        return [
          {
            roomId: room.id,
            roomName: room.name,
            roomNameVi: room.nameVi,
            quantity,
            nightlyPrice: room.price,
            guestForms: forms,
            includedCapacity: room.capacity,
            checkIn: firstStay.checkIn,
            checkOut: firstStay.checkOut,
            nights: firstStay.nights,
            roomCodes: stays.map((stay) => stay.roomCode),
            stays,
            ...extras,
          },
        ];
      }),
    [
      defaultDates,
      guestForms,
      quantities,
      roomStays,
      searchParams,
      selectedRoomCodes,
    ],
  );

  const roomSubtotal = selections.reduce(
    (sum, selection) =>
      sum +
      (selection.stays || []).reduce(
        (staySum, stay) =>
          staySum + selection.nightlyPrice * Math.max(0, stay.nights),
        0,
      ),
    0,
  );
  const extraGuestTotal = selections.reduce(
    (sum, selection) =>
      sum +
      (selection.stays || []).reduce(
        (staySum, stay) =>
          staySum + stay.extraGuestCharge * Math.max(0, stay.nights),
        0,
      ),
    0,
  );
  const earlySurcharge = selections.reduce(
    (sum, selection) =>
      sum +
      calculateEarlyCheckInSurcharge(selection.nightlyPrice, arrivalTime) *
        selection.quantity,
    0,
  );
  const lateSurcharge = selections.reduce(
    (sum, selection) =>
      sum +
      calculateLateCheckOutSurcharge(selection.nightlyPrice, departureTime) *
        selection.quantity,
    0,
  );
  const allGuestsComplete =
    selections.length > 0 &&
    selections.every(
      (selection) =>
        selection.stays?.length === selection.quantity &&
        selection.stays.every(
          (stay) =>
            Number.isFinite(stay.guest.adults) &&
            stay.guest.adults > 0 &&
            Number.isFinite(stay.guest.children) &&
            stay.guest.children >= 0 &&
            Number.isFinite(stay.guest.infants) &&
            stay.guest.infants >= 0,
        ),
    );
  const totalRooms = selections.reduce(
    (sum, selection) => sum + selection.quantity,
    0,
  );
  const selectedAvailabilities = selections.flatMap((selection) =>
    (selection.stays || []).map((stay) =>
      getMockRoomAvailability(
        rooms.findIndex((room) => room.id === selection.roomId),
        1,
        stay.checkIn,
        stay.checkOut,
      ),
    ),
  );

  const goCheckout = () => {
    if (!selections.length)
      return setError("Vui lòng chọn ít nhất một loại phòng.");
    if (!allGuestsComplete)
      return setError("Vui lòng hoàn tất số lượng khách cho từng phòng.");
    if (
      selections.some((selection) =>
        (selection.stays || []).some((stay) => stay.nights < 1),
      )
    )
      return setError("Ngày trả phòng phải sau ngày nhận phòng ở từng phòng.");
    if (selectedAvailabilities.some((availability) => !availability.available))
      return setError(
        "Một phòng đã hết phòng trong khoảng ngày bạn chọn. Vui lòng chọn ngày khác.",
      );
    setError("");
    const first = selections[0];
    const query = new URLSearchParams({
      hotel: hotel.slug,
      room: first.roomNameVi,
      checkIn: first.checkIn || defaultDates.checkIn,
      checkOut: first.checkOut || defaultDates.checkOut,
      nights: String(first.nights || 0),
      rooms: String(totalRooms),
      roomPrice: String(first.nightlyPrice),
      surcharge: String(earlySurcharge + lateSurcharge),
      total: String(
        roomSubtotal + earlySurcharge + lateSurcharge + extraGuestTotal,
      ),
      promo: searchParams.get("promo") || "",
      roomSelections: JSON.stringify(selections),
      arrivalTime,
      departureTime,
    });
    navigate(`/hotels/${hotel.slug}/services?${query.toString()}`);
  };

  return (
    <main className="container py-12">
      <QuickSearch />
      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="grid md:grid-cols-[1fr_1.2fr]">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="h-64 w-full object-cover md:h-full"
          />
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-1 text-sm text-gold">
              <Star className="h-4 w-4 fill-gold" /> {hotel.rating} / 5
            </div>
            <h1 className="mt-3 font-display text-4xl font-bold text-primary">
              {hotel.name}
            </h1>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {hotel.city}, {hotel.province}
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              {language === "vi" ? hotel.description : hotel.descriptionEn}
            </p>
            <Link
              to={`/hotels/${hotel.slug}/details`}
              className="mt-5 inline-block text-sm font-semibold text-primary underline underline-offset-4"
            >
              {language === "vi"
                ? "Xem chi tiết khách sạn"
                : "View hotel details"}
            </Link>
          </div>
        </div>
      </div>
      <section className="mt-8 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-primary">
            Ngày mặc định cho phòng mới
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Ngày của từng phòng có thể chỉnh riêng bên dưới, kể cả các phòng cùng
          một loại.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="text-sm font-medium text-primary">
            Ngày nhận phòng
            <input
              type="date"
              min={dateValue(today)}
              value={defaultDates.checkIn}
              onChange={(event) =>
                setDefaultDates((current) => ({
                  checkIn: event.target.value,
                  checkOut:
                    current.checkOut <= event.target.value
                      ? nextDate(event.target.value)
                      : current.checkOut,
                }))
              }
              className="mt-1 w-full rounded-xl border border-input p-2.5"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Nhận phòng từ 14:00
            </span>
          </label>
          <label className="text-sm font-medium text-primary">
            Ngày trả phòng
            <input
              type="date"
              min={defaultDates.checkIn}
              value={defaultDates.checkOut}
              onChange={(event) =>
                setDefaultDates((current) => ({
                  ...current,
                  checkOut: event.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-input p-2.5"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Trả phòng trước 12:00
            </span>
          </label>
          <label className="text-sm font-medium text-primary">
            Giờ đến dự kiến
            <input
              type="time"
              value={arrivalTime}
              onChange={(event) => setArrivalTime(event.target.value)}
              className="mt-1 w-full rounded-xl border border-input p-2.5"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Sau 22:00 vui lòng ghi chú lễ tân
            </span>
          </label>
          <label className="text-sm font-medium text-primary">
            Giờ trả dự kiến
            <input
              type="time"
              value={departureTime}
              onChange={(event) => setDepartureTime(event.target.value)}
              className="mt-1 w-full rounded-xl border border-input p-2.5"
            />
          </label>
        </div>
      </section>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
              Sen Việt rooms
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary">
              Chọn phòng phù hợp
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Số lượng phòng tối đa luôn khớp với số phòng còn trống trong
              khoảng ngày đã chọn.
            </p>
          </div>
          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-5 space-y-5">
            {rooms.map((item, index) => {
              const quantity = quantities[item.id] || 0;
              const dates = getDates(item.id, 0);
              const availability = getMockRoomAvailability(
                index,
                1,
                dates.checkIn,
                dates.checkOut,
              );
              const maxQuantity = maxAvailable(index, dates);
              return (
                <article
                  key={item.id}
                  className={`overflow-hidden rounded-2xl border bg-card transition ${selectedRoom === index ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  onClick={() => setSelectedRoom(index)}
                >
                  <div className="grid md:grid-cols-[190px_1fr_auto]">
                    <div className="relative">
                      <img
                        src={item.image}
                        alt={item.nameVi}
                        className="aspect-[4/3] h-full w-full object-cover md:aspect-auto"
                      />
                      <div className="absolute bottom-3 left-3 flex gap-1">
                        <button
                          type="button"
                          aria-label="Ảnh trước"
                          className="rounded-full bg-white/90 p-1.5"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Ảnh sau"
                          className="rounded-full bg-white/90 p-1.5"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[.12em] text-gold">
                            {item.name}
                          </p>
                          <h3 className="mt-1 font-display text-2xl font-bold text-primary">
                            {item.nameVi}
                          </h3>
                        </div>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                          {item.size}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="h-4 w-4 text-gold" />
                          {item.bedsVi}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-4 w-4 text-gold" />
                          Tối đa {item.capacity.adults} người lớn
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`rounded-full px-3 py-1 font-semibold ${maxQuantity > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                        >
                          {maxQuantity > 0
                            ? `Còn ${maxQuantity} phòng`
                            : "Hết phòng"}
                        </span>
                        <span className="text-muted-foreground">
                          Tòa {item.building} · Tầng {item.floor} · Giá cố định
                        </span>
                      </div>
                      {(() => {
                        const notice = getCancellationNotice(dates.checkIn);
                        return (
                          <div
                            className={`mt-2.5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${notice.badgeClass}`}
                          >
                            {notice.type === "free" ? (
                              <Check className="h-3.5 w-3.5 shrink-0" />
                            ) : notice.type === "partial" ? (
                              <span className="text-xs">⚠️</span>
                            ) : (
                              <span className="text-xs font-bold">✕</span>
                            )}
                            <span>{notice.text}</span>
                          </div>
                        );
                      })()}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDetailRoom(index);
                          }}
                          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary"
                        >
                          Xem chi tiết phòng
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-border bg-secondary/30 p-5 md:border-l md:border-t-0">
                      <p className="text-xs text-muted-foreground">Giá từ</p>
                      <p className="mt-1 text-2xl font-bold text-primary">
                        {formatVnd(item.price)}
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}
                          / đêm
                        </span>
                      </p>
                      <label className="mt-4 block text-xs font-semibold text-primary">
                        Số phòng
                        <select
                          value={quantity}
                          onChange={(event) => {
                            event.stopPropagation();
                            setRoomQuantity(
                              item.id,
                              Number(event.target.value),
                            );
                          }}
                          onClick={(event) => event.stopPropagation()}
                          className="mt-1 w-full rounded-lg border border-input bg-white p-2.5"
                        >
                          <option value={0}>Không chọn</option>
                          {Array.from(
                            { length: maxQuantity },
                            (_, roomIndex) => (
                              <option key={roomIndex + 1} value={roomIndex + 1}>
                                {roomIndex + 1} phòng
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Tối đa {maxQuantity} phòng theo ngày đang chọn
                      </p>
                    </div>
                  </div>
                  {quantity > 0 && (
                    <div
                      className="border-t border-border bg-white p-5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-primary">
                            Thông tin từng phòng
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Mỗi phòng có mã, khách và khoảng ngày độc lập.
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-primary">
                          {quantity} phòng đã chọn
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {Array.from({ length: quantity }, (_, stayIndex) => {
                          const stayDates = getDates(item.id, stayIndex);
                          const guest =
                            guestForms[item.id]?.[stayIndex] ||
                            defaultGuest(searchParams);
                          const calendarOpen =
                            calendarTarget?.roomId === item.id &&
                            calendarTarget.stayIndex === stayIndex;
                          return (
                            <div
                              key={`${item.id}-${stayIndex}`}
                              className="rounded-xl border border-border bg-secondary/30 p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-primary">
                                    Phòng {stayIndex + 1}:
                                  </span>
                                  <select
                                    value={
                                      selectedRoomCodes[item.id]?.[stayIndex] ||
                                      item.roomCodes[stayIndex] ||
                                      ""
                                    }
                                    onChange={(event) =>
                                      updateStayRoomCode(
                                        item.id,
                                        stayIndex,
                                        event.target.value,
                                      )
                                    }
                                    className="rounded-lg border border-primary/30 bg-white px-2.5 py-1 text-xs font-bold text-primary shadow-sm hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  >
                                    {/* Dùng availableRooms (chỉ phòng READY từ backend) nếu có, fallback về roomCodes */}
                                    {(item.availableRooms
                                      ? item.availableRooms.map((r) => r.code)
                                      : item.roomCodes
                                    ).map((code) => {
                                      const isChosenByOther = (
                                        selectedRoomCodes[item.id] || []
                                      ).some(
                                        (c, idx) =>
                                          idx !== stayIndex && c === code,
                                      );
                                      return (
                                        <option
                                          key={code}
                                          value={code}
                                          disabled={isChosenByOther}
                                        >
                                          {code}
                                          {isChosenByOther
                                            ? " (Đã chọn)"
                                            : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCalendarTarget(
                                      calendarOpen
                                        ? null
                                        : { roomId: item.id, stayIndex },
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary"
                                >
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {calendarOpen
                                    ? "Ẩn lịch"
                                    : "Chọn khoảng ngày"}
                                </button>
                              </div>
                              {(() => {
                                const notice = getCancellationNotice(stayDates.checkIn);
                                return (
                                  <div
                                    className={`mt-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${notice.badgeClass}`}
                                  >
                                    {notice.type === "free" ? (
                                      <Check className="h-3 w-3 shrink-0" />
                                    ) : notice.type === "partial" ? (
                                      <span className="text-xs">⚠️</span>
                                    ) : (
                                      <span className="text-xs font-bold">✕</span>
                                    )}
                                    <span>{notice.text}</span>
                                  </div>
                                );
                              })()}
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <label className="text-xs font-semibold text-primary">
                                  Nhận phòng
                                  <input
                                    type="date"
                                    min={dateValue(today)}
                                    value={stayDates.checkIn}
                                    onChange={(event) =>
                                      updateStay(
                                        item.id,
                                        stayIndex,
                                        "checkIn",
                                        event.target.value,
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-input bg-white p-2"
                                  />
                                </label>
                                <label className="text-xs font-semibold text-primary">
                                  Trả phòng
                                  <input
                                    type="date"
                                    min={stayDates.checkIn}
                                    value={stayDates.checkOut}
                                    onChange={(event) =>
                                      updateStay(
                                        item.id,
                                        stayIndex,
                                        "checkOut",
                                        event.target.value,
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-input bg-white p-2"
                                  />
                                </label>
                              </div>
                              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                <label className="text-xs text-muted-foreground">
                                  Người lớn
                                  <select
                                    value={guest.adults}
                                    onChange={(event) =>
                                      updateGuest(
                                        item.id,
                                        stayIndex,
                                        "adults",
                                        Number(event.target.value),
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-input bg-white p-2 text-sm"
                                  >
                                    {Array.from(
                                      { length: item.capacity.adults + 3 },
                                      (_, optionIndex) => (
                                        <option
                                          key={optionIndex + 1}
                                          value={optionIndex + 1}
                                        >
                                          {optionIndex + 1}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>
                                <label className="text-xs text-muted-foreground">
                                  Trẻ em (6-11 tuổi)
                                  <select
                                    value={guest.children}
                                    onChange={(event) =>
                                      updateGuest(
                                        item.id,
                                        stayIndex,
                                        "children",
                                        Number(event.target.value),
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-input bg-white p-2 text-sm"
                                  >
                                    {Array.from(
                                      { length: item.capacity.children + 3 },
                                      (_, optionIndex) => (
                                        <option
                                          key={optionIndex}
                                          value={optionIndex}
                                        >
                                          {optionIndex}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>
                                <label className="text-xs text-muted-foreground">
                                  Em bé (0-5 tuổi)
                                  <select
                                    value={guest.infants}
                                    onChange={(event) =>
                                      updateGuest(
                                        item.id,
                                        stayIndex,
                                        "infants",
                                        Number(event.target.value),
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-input bg-white p-2 text-sm"
                                  >
                                    {Array.from(
                                      { length: item.capacity.infants + 2 },
                                      (_, optionIndex) => (
                                        <option
                                          key={optionIndex}
                                          value={optionIndex}
                                        >
                                          {optionIndex}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>
                              </div>
                              {calendarOpen && (
                                <RoomAvailabilityCalendar
                                  roomIndex={index}
                                  basePrice={item.price}
                                  requestedRooms={1}
                                  selectedStartDate={stayDates.checkIn}
                                  selectedEndDate={stayDates.checkOut}
                                  availableCount={
                                    item.availableRooms
                                      ? item.availableRooms.length
                                      : item.inventory
                                  }
                                  roomId={item.roomId || item.id}
                                  roomCodes={item.roomCodes}
                                  onSelectRange={(start, end) =>
                                    selectCalendarRange(
                                      item.id,
                                      stayIndex,
                                      start,
                                      end,
                                    )
                                  }
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
        <BookingSummaryPanel
          hotelName={hotel.name}
          selections={selections}
          arrivalTime={arrivalTime}
          departureTime={departureTime}
          onRemoveRoom={removeRoomStay}
          totals={{
            subtotal: roomSubtotal,
            total:
              roomSubtotal + earlySurcharge + lateSurcharge + extraGuestTotal,
          }}
          emptyState={
            <p className="mt-4 text-sm text-muted-foreground">
              Chọn số phòng trong từng loại phòng để bắt đầu.
            </p>
          }
          cta={
            selections.length ? (
              <Button type="button" onClick={goCheckout} className="w-full">
                Tiếp tục đến bước dịch vụ
              </Button>
            ) : null
          }
        />
      </div>
      <div className="mt-8">
        <Link
          to="/search"
          className="flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại kết quả tìm kiếm
        </Link>
      </div>
      {detailRoom !== null && (
        <RoomDetailsModal
          room={rooms[detailRoom]}
          remainingRooms={
            maxAvailable(detailRoom, getDates(rooms[detailRoom].id, 0))
          }
          checkInDate={getDates(rooms[detailRoom].id, 0).checkIn}
          onClose={() => setDetailRoom(null)}
        />
      )}
    </main>
  );
}
