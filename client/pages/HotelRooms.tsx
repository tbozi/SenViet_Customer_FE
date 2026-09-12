import { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  BedDouble,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickSearch from "@/components/QuickSearch";
import RoomAvailabilityCalendar from "@/components/RoomAvailabilityCalendar";
import BookingSummaryPanel from "@/components/booking/BookingSummaryPanel";
import { rooms } from "@/data/rooms";
import { formatVnd, hotels } from "@/data/hotels";
import {
  calculateEarlyCheckInSurcharge,
  calculateLateCheckOutSurcharge,
  calculateNights,
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

function extraGuests(room: (typeof rooms)[number], guest: GuestForm) {
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
  onClose,
}: {
  room: (typeof rooms)[number];
  onClose: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = [
    room.image,
    ...rooms.filter((item) => item.id !== room.id).map((item) => item.image),
  ].slice(0, 3);
  const moveImage = (amount: number) =>
    setImageIndex(
      (current) => (current + amount + images.length) % images.length,
    );
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-detail-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết phòng"
          className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 text-slate-700 shadow-md transition hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid md:grid-cols-[minmax(280px,.95fr)_1.15fr]">
          <div className="relative flex min-h-[250px] items-center bg-slate-100 p-4 sm:p-6">
            <img
              src={images[imageIndex]}
              alt={`${room.nameVi} - ảnh ${imageIndex + 1}`}
              className="aspect-[4/3] max-h-[460px] w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => moveImage(-1)}
              aria-label="Ảnh trước"
              className="absolute left-6 rounded-full bg-white/95 p-2 text-primary shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => moveImage(1)}
              aria-label="Ảnh sau"
              className="absolute right-6 rounded-full bg-white/95 p-2 text-primary shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-slate-950/50 px-2 py-1">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  aria-label={`Chọn ảnh ${index + 1}`}
                  onClick={() => setImageIndex(index)}
                  className={`h-1.5 w-1.5 rounded-full ${imageIndex === index ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </div>
          <div className="p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold">
              {room.name}
            </p>
            <h2
              id="room-detail-title"
              className="mt-2 font-display text-3xl font-bold text-primary"
            >
              {room.nameVi}
            </h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {room.size} · Tòa {room.building} · Tầng {room.floor}
            </p>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              {room.description}
            </p>
            <h3 className="mt-6 text-sm font-bold text-primary">
              Tiện ích trong phòng:
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
              {room.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2 text-xs text-slate-600"
                >
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  {amenity}
                </div>
              ))}
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
  const initialCheckIn = searchParams.get("checkIn") || dateValue(today);
  const initialCheckOut =
    searchParams.get("checkOut") || nextDate(initialCheckIn);
  const [defaultDates, setDefaultDates] = useState<StayDates>({
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
  });
  const [roomStays, setRoomStays] = useState<Record<string, StayDates[]>>(() =>
    Object.fromEntries(rooms.map((room) => [room.id, []])),
  );
  const [arrivalTime, setArrivalTime] = useState("14:00");
  const [departureTime, setDepartureTime] = useState("12:00");
  const oldRoom = (searchParams.get("room") || "").toLowerCase();
  const oldRoomIndex = rooms.findIndex(
    (room) =>
      oldRoom.includes(room.id) || oldRoom.includes(room.nameVi.toLowerCase()),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial = Object.fromEntries(rooms.map((room) => [room.id, 0]));
    const legacyIndex = oldRoomIndex >= 0 ? oldRoomIndex : 0;
    initial[rooms[legacyIndex].id] = Math.min(
      4,
      Math.max(0, Number(searchParams.get("rooms") || 0)),
    );
    return initial;
  });
  const [guestForms, setGuestForms] = useState<Record<string, GuestForm[]>>(
    () => {
      const initial = Object.fromEntries(
        rooms.map((room) => [room.id, [] as GuestForm[]]),
      );
      const legacyIndex = oldRoomIndex >= 0 ? oldRoomIndex : 0;
      const quantity = Math.min(
        4,
        Math.max(0, Number(searchParams.get("rooms") || 0)),
      );
      initial[rooms[legacyIndex].id] = Array.from({ length: quantity }, () =>
        defaultGuest(searchParams),
      );
      return initial;
    },
  );
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
        const stays: RoomStay[] = Array.from(
          { length: quantity },
          (_, index) => {
            const stayDates = dates[index] || defaultDates;
            const guest = forms[index] || defaultGuest(searchParams);
            const extra = extraGuests(room, guest);
            return {
              roomCode: room.roomCodes[index],
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
    [defaultDates, guestForms, quantities, roomStays, searchParams],
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
                          className={`rounded-full px-3 py-1 font-semibold ${availability.remaining > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                        >
                          {availability.remaining > 0
                            ? `Còn ${availability.remaining} phòng`
                            : "Hết phòng"}
                        </span>
                        <span className="text-muted-foreground">
                          Tòa {item.building} · Tầng {item.floor} · Giá cố định
                        </span>
                      </div>
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
                                <p className="text-xs font-semibold text-primary">
                                  Phòng {stayIndex + 1} ·{" "}
                                  {item.roomCodes[stayIndex]}
                                </p>
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
          onClose={() => setDetailRoom(null)}
        />
      )}
    </main>
  );
}
