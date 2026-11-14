import { useEffect, useMemo, useRef, useState } from "react";
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

import { type RoomType } from "@/data/rooms";
import { fetchRoomsByHotel, hotelSlugToIdMap, useGetBranchRoomDailyPricesQuery } from "@/services/roomApi";
import { formatVnd } from "@/data/hotels";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import {

  calculateEarlyCheckInSurcharge,
  calculateLateCheckOutSurcharge,
  calculateNights,
  type GuestForm,
  type RoomSelection,

  type RoomStay,

} from "@/lib/bookings";

import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "@/components/ui/use-toast";

import { toLocalDateStr } from "@/lib/utils";

const today = new Date();

const dateValue = (date: Date) => toLocalDateStr(date);

const defaultGuest = (searchParams: URLSearchParams, maxCapacity = 4): GuestForm => {

  const rawAdults = Number(searchParams.get("adults") || 2);

  const adults = Math.min(maxCapacity, Math.max(1, rawAdults > maxCapacity ? 2 : rawAdults));

  const rawChildren = Number(searchParams.get("children") || 0);

  const children = Math.min(Math.max(0, maxCapacity - adults), Math.max(0, rawChildren));

  return {

    adults,

    children,

    infants: 0,

  };

};



type StayDates = { checkIn: string; checkOut: string };

type CalendarTarget = { roomId: string; stayIndex: number };



function normalizeRoomDisplayName(code: string): string {

  if (!code) return "";

  const trimmed = code.trim();

  if (trimmed.startsWith("Phòng")) return trimmed;

  const match = trimmed.match(/^(\d+)-[A-Za-z]-(\d+)$/);

  if (match) {

    const floor = match[1];

    const num = match[2].padStart(2, "0");

    return `Phòng ${floor}${num}`;

  }

  return `Phòng ${trimmed}`;

}



function nextDate(date: string) {

  const next = new Date(`${date}T12:00:00`);

  next.setDate(next.getDate() + 1);

  return dateValue(next);

}



function extraGuests(room: RoomType, guest: GuestForm) {

  const standardCapacity = room.standardCapacity ?? room.capacity?.adults ?? 0;
  if (standardCapacity <= 0) {
    return {
      extraAdults: 0,
      extraChildren: 0,
      extraGuestCount: 0,
      extraGuestCharge: 0,
    };
  }
  const actualAdults = guest.adults || 0;

  const actualChildren = guest.children || 0;

  const totalActualGuests = actualAdults + actualChildren;



  // Nếu tổng khách (người lớn + trẻ em) <= sức chứa tiêu chuẩn -> Miễn phí hoàn toàn

  if (totalActualGuests <= standardCapacity) {

    return {

      extraAdults: 0,

      extraChildren: 0,

      extraGuestCount: 0,

      extraGuestCharge: 0,

    };

  }



  // Ưu tiên lấp đầy suất tiêu chuẩn cho Người lớn trước, phần còn dư suất tiêu chuẩn cho Trẻ em hưởng

  const actualAdultsCoveredByStandard = Math.min(actualAdults, standardCapacity);

  const remainingStandardSlots = standardCapacity - actualAdultsCoveredByStandard;



  const extraAdults = Math.max(0, actualAdults - actualAdultsCoveredByStandard);

  const extraChildren = Math.max(0, actualChildren - remainingStandardSlots);



  const adultFee = room.extraAdultFee ?? 0;
  const childFee = room.extraChildFee ?? 0;
  const extraGuestCharge = extraAdults * adultFee + extraChildren * childFee;



  return {

    extraAdults,

    extraChildren,

    extraGuestCount: extraAdults + extraChildren,

    extraGuestCharge,

  };

}



function getStayPrice(

  roomId: string | number,

  checkIn: string,

  checkOut: string,

  fallbackNightlyPrice: number,

  dailyPrices?: Record<string, Record<string, number>>,

) {

  if (!checkIn || !checkOut || checkOut <= checkIn) return { total: 0, avgNightly: fallbackNightlyPrice };

  const start = new Date(`${checkIn}T00:00:00`);

  const end = new Date(`${checkOut}T00:00:00`);

  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));



  const roomRates = dailyPrices ? (dailyPrices[String(roomId)] || dailyPrices[Number(roomId)]) : null;

  if (!roomRates) {

    return { total: fallbackNightlyPrice * nights, avgNightly: fallbackNightlyPrice };

  }



  let total = 0;

  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {

    const yyyy = d.getFullYear();

    const mm = String(d.getMonth() + 1).padStart(2, "0");

    const dd = String(d.getDate()).padStart(2, "0");

    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (roomRates[dateStr] !== undefined && roomRates[dateStr] > 0) {

      total += roomRates[dateStr];

    } else {

      total += fallbackNightlyPrice;

    }

  }

  return { total, avgNightly: Math.round(total / nights) };

}



function RoomDetailsModal({
  room,
  remainingRooms,
  onClose,
}: {
  room: RoomType;
  remainingRooms?: number;
  onClose: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);

  const images = room.images?.length
    ? room.images
    : [room.image || "/placeholder.svg"];


  const moveImage = (amount: number) =>

    setImageIndex(

      (current) => (current + amount + images.length) % images.length,

    );



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

              <span className="absolute left-3 top-3 z-10 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                {imageIndex + 1} / {images.length} ảnh
              </span>

              <img loading="lazy" decoding="async"

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

                  <img loading="lazy" decoding="async"

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

                  {room.standardCapacity > 0 || room.capacity.adults > 0
                    ? `Chuẩn ${room.standardCapacity || room.capacity.adults} người`
                    : "Chưa có thông tin sức chứa"}
                  {room.maxExtraGuests ? ` (thêm tối đa ${room.maxExtraGuests})` : ""}
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

                  {room.buildingName && `Tòa ${room.buildingName} · `}
                  {room.floor > 0 && `Tầng ${room.floor}`}
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

                {room.buildingName && `Tòa ${room.buildingName} · `}
                {room.floor > 0 && `Tầng ${room.floor} · `}
                Giá cố định
              </span>

            </div>



            <p className="mt-3 text-sm leading-relaxed text-slate-600">

              {room.description}

            </p>



            {(room.extraAdultFee != null || room.extraChildFee != null) && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-xs">
                <h3 className="text-sm font-bold text-blue-950">
                  Phụ thu khách thêm
                </h3>
                <div className="mt-3 space-y-2 text-slate-700">
                  {room.extraAdultFee != null && (
                    <p>
                      Người lớn thêm: {formatVnd(room.extraAdultFee)} / người / đêm
                    </p>
                  )}
                  {room.extraChildFee != null && (
                    <p>
                      Trẻ em thêm: {formatVnd(room.extraChildFee)} / trẻ / đêm
                    </p>
                  )}
                </div>
              </div>
            )}


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
  const { user } = useAuth();

  const isEn = language === "en";

  const [searchParams] = useSearchParams();

  const { data: publicHotels = [], isError: hotelListError } = useGetPublicHotelsQuery();
  const routeHotelId = slug && /^\d+$/.test(slug)
    ? Number(slug)
    : hotelSlugToIdMap[slug || ""] || 0;
  const hotel = publicHotels.find((item) => item.id === routeHotelId);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [roomsLoadError, setRoomsLoadError] = useState("");
  const initializedSelectionKey = useRef<string | null>(null);


  const initialCheckIn = searchParams.get("checkIn") || dateValue(today);

  const initialCheckOut =

    searchParams.get("checkOut") || nextDate(initialCheckIn);

  const [defaultDates, setDefaultDates] = useState<StayDates>({

    checkIn: initialCheckIn,

    checkOut: initialCheckOut,

  });



  useEffect(() => {

    let isMounted = true;

    if (Number.isSafeInteger(routeHotelId) && routeHotelId > 0) {
      setRooms([]);
      setRoomsLoadError("");
      fetchRoomsByHotel(
        routeHotelId,
        defaultDates.checkIn,
        defaultDates.checkOut,
      ).then((fetched) => {
        if (isMounted) {
          const selectionKey = `${routeHotelId}:${searchParams.toString()}`;
          const shouldSeedSelection = initializedSelectionKey.current !== selectionKey;
          initializedSelectionKey.current = selectionKey;
          const requestedRoom = (searchParams.get("room") || "").toLowerCase();
          const requestedRoomCount = Math.min(
            4,
            Math.max(0, Number(searchParams.get("rooms") || 0)),
          );
          const preferredRoom =
            fetched.find(
              (room) =>
                requestedRoom &&
                (room.id.toLowerCase().includes(requestedRoom) ||
                  room.nameVi.toLowerCase().includes(requestedRoom) ||
                  room.name.toLowerCase().includes(requestedRoom)),
            ) || fetched[0];
          setRooms(fetched);
          setQuantities((prev) => {
            const next: Record<string, number> = {};
            for (const r of fetched) {
              const availCount = r.availableRooms?.length ?? r.inventory;
              next[r.id] = Math.min(prev[r.id] || 0, availCount);
            }
            if (shouldSeedSelection && preferredRoom && requestedRoomCount > 0) {
              next[preferredRoom.id] = Math.min(
                requestedRoomCount,
                preferredRoom.availableRooms?.length ?? preferredRoom.inventory,
              );
            }
            return next;
          });
          if (shouldSeedSelection && preferredRoom && requestedRoomCount > 0) {
            const initialQuantity = Math.min(
              requestedRoomCount,
              preferredRoom.availableRooms?.length ?? preferredRoom.inventory,
            );
            setGuestForms((prev) => ({
              ...prev,
              [preferredRoom.id]: Array.from(
                { length: initialQuantity },
                (_, index) =>
                  prev[preferredRoom.id]?.[index] || defaultGuest(searchParams),
              ),
            }));
            setRoomStays((prev) => ({
              ...prev,
              [preferredRoom.id]: Array.from(
                { length: initialQuantity },
                (_, index) => prev[preferredRoom.id]?.[index] || { ...defaultDates },
              ),
            }));
            setSelectedRoomCodes((prev) => ({
              ...prev,
              [preferredRoom.id]: preferredRoom.roomCodes
                .slice(0, initialQuantity)
                .map(normalizeRoomDisplayName),
            }));
          }
          setSelectedRoomCodes((prev) => {

            const next = { ...prev };

            for (const r of fetched) {

              const availCodes = (

                r.availableRooms

                  ? r.availableRooms.map((ar) => ar.code)

                  : r.roomCodes

              ).map(normalizeRoomDisplayName);

              const currentSelected = next[r.id] || [];

              const updated: string[] = [];

              for (let i = 0; i < currentSelected.length; i++) {

                const norm = normalizeRoomDisplayName(currentSelected[i]);

                if (availCodes.includes(norm) && !updated.includes(norm)) {

                  updated.push(norm);

                } else {

                  const replacement = availCodes.find(

                    (c) => !updated.includes(c),

                  );

                  if (replacement) updated.push(replacement);

                }

              }

              next[r.id] = updated;

            }

            return next;

          });

        }

      }).catch((error: unknown) => {
        if (isMounted) {
          console.warn("Failed to load hotel rooms:", error);
          setRooms([]);
          setRoomsLoadError(
            isEn
              ? "Could not load rooms for this hotel."
              : "Không thể tải danh sách phòng cho khách sạn này."
          );
        }
      });
    } else {
      setRooms([]);
      setRoomsLoadError(isEn ? "Hotel not found." : "Không tìm thấy khách sạn.");
    }
    return () => {

      isMounted = false;

    };

  }, [routeHotelId, defaultDates.checkIn, defaultDates.checkOut, isEn, searchParams]);
  const [roomStays, setRoomStays] = useState<Record<string, StayDates[]>>({});
  const [roomPhotoIndices, setRoomPhotoIndices] = useState<Record<string, number>>({});
  const [arrivalTime, setArrivalTime] = useState("14:00");

  const [departureTime, setDepartureTime] = useState("12:00");

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [guestForms, setGuestForms] = useState<Record<string, GuestForm[]>>({});
  const [selectedRoomCodes, setSelectedRoomCodes] = useState<Record<string, string[]>>({});
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget | null>(

    null,

  );

  const [detailRoom, setDetailRoom] = useState<number | null>(null);

  const [error, setError] = useState("");



  const hotelId = routeHotelId;
  const { data: dailyPrices } = useGetBranchRoomDailyPricesQuery(

    {

      hotelId,

      startDate: defaultDates.checkIn,

      endDate: defaultDates.checkOut,

    },

    { skip: !hotelId || !defaultDates.checkIn || !defaultDates.checkOut },

  );



  const getDates = (roomId: string, index: number) =>

    roomStays[roomId]?.[index] || defaultDates;



  const maxAvailable = (roomIndex: number) => {
    const room = rooms[roomIndex];
    return room?.availableRooms?.length ?? room?.inventory ?? 0;
  };
  const getRoomAvailability = (roomIndex: number, requestedRooms: number) => {
    const remaining = maxAvailable(roomIndex);
    return {
      available: roomIndex >= 0 && remaining >= requestedRooms,
      remaining,
    };
  };


  const setRoomQuantity = (roomId: string, requestedQuantity: number) => {

    const roomIndex = rooms.findIndex((room) => room.id === roomId);

    const quantity = Math.min(

      Math.max(0, requestedQuantity),

      maxAvailable(roomIndex),
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

      const allCodes = (roomDef?.roomCodes || []).map(normalizeRoomDisplayName);

      const updated: string[] = [];

      for (let i = 0; i < quantity; i++) {

        if (existing[i] && !updated.includes(normalizeRoomDisplayName(existing[i]))) {

          updated.push(normalizeRoomDisplayName(existing[i]));

        } else {

          const availableCode =

            allCodes.find((c) => !updated.includes(c)) ||

            allCodes[0] ||

            `Phòng ${i + 1}`;

          updated.push(normalizeRoomDisplayName(availableCode));

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

      list[stayIndex] = normalizeRoomDisplayName(newRoomCode);

      return { ...current, [roomId]: list };

    });

  };



  const updateGuest = (

    roomId: string,

    index: number,

    field: keyof GuestForm,

    value: number,

  ) => {

    const room = rooms.find((r) => r.id === roomId);

    const standardGuests = room?.standardCapacity ?? room?.capacity?.adults ?? 0;
    const maxExtra = room?.maxExtraGuests ?? 0;
    const maxTotalCapacity = Math.max(1, standardGuests + maxExtra);


    setGuestForms((current) => ({

      ...current,

      [roomId]: (current[roomId] || []).map((guest, guestIndex) => {

        if (guestIndex !== index) return guest;

        const next = { ...guest, [field]: value };

        if (field === "adults") {

          if (next.adults + next.children > maxTotalCapacity) {

            next.children = Math.max(0, maxTotalCapacity - next.adults);

          }

        } else if (field === "children") {

          if (next.adults + next.children > maxTotalCapacity) {

            next.adults = Math.max(1, maxTotalCapacity - next.children);

          }

        }

        return next;

      }),

    }));

  };



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

        : {
            ...existing,
            checkOut:
              value && existing.checkIn && value <= existing.checkIn
                ? nextDate(existing.checkIn)
                : value,
          };

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

            const rawRoomCode =

              codes[index] || room.roomCodes[index] || `Phòng ${index + 1}`;

            const roomCode = normalizeRoomDisplayName(rawRoomCode);

            // Lookup roomId thực từ availableRooms dựa trên code được chọn

            const matchedRoom = room.availableRooms?.find(

              (r) =>

                normalizeRoomDisplayName(r.code) === roomCode ||

                r.code === rawRoomCode,

            );

            const stayRoomId = matchedRoom?.id ?? room.roomId;

            const priceCalc = getStayPrice(

              stayRoomId || room.id,

              stayDates.checkIn,

              stayDates.checkOut,

              room.price,

              dailyPrices,

            );

            return {

              roomCode,

              roomId: stayRoomId,

              checkIn: stayDates.checkIn,

              checkOut: stayDates.checkOut,

              nights: calculateNights(stayDates.checkIn, stayDates.checkOut),

              nightlyPrice: priceCalc.avgNightly,

              stayTotal: priceCalc.total,

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

            nightlyPrice: firstStay?.nightlyPrice ?? room.price,

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

      dailyPrices,

    ],

  );



  const roomSubtotal = selections.reduce(

    (sum, selection) =>

      sum +

      (selection.stays || []).reduce(

        (staySum, stay) =>

          staySum + (stay.stayTotal ?? (stay.nightlyPrice || selection.nightlyPrice) * Math.max(0, stay.nights)),

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
      getRoomAvailability(
        rooms.findIndex((room) => room.id === selection.roomId),
        selection.quantity,
      ),
    ),
  );


  const goCheckout = () => {
    const failWithToast = (msg: string) => {
      setError(msg);
      toast({
        title: isEn ? "Incomplete Room Selection" : "Chưa đủ thông tin đặt phòng",
        description: msg,
        variant: "destructive",
      });
    };

    if (!selections.length)
      return failWithToast(isEn ? "Please select at least one room type." : "Vui lòng chọn ít nhất một loại phòng.");

    if (!allGuestsComplete)
      return failWithToast("Vui lòng hoàn tất số lượng khách cho từng phòng.");

    if (
      selections.some((selection) =>
        (selection.stays || []).some(
          (stay) =>
            !stay.checkIn ||
            !stay.checkOut ||
            !Number.isFinite(stay.nights) ||
            stay.nights < 1,
        ),
      )
    )
      return failWithToast(
        "Vui lòng chọn ngày nhận phòng và ngày trả phòng (ít nhất 1 đêm lưu trú) trên lịch trước khi qua bước tiếp theo.",
      );

    if (selectedAvailabilities.some((availability) => !availability.available))
      return failWithToast(
        "Một phòng đã hết phòng trong khoảng ngày bạn chọn. Vui lòng chọn ngày khác.",
      );

    setError("");

    const first = selections[0];

    const query = new URLSearchParams({

      hotel: String(hotelId),
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

    const nextPath = `/hotels/${hotelId}/services?${query.toString()}`;
    if (!user) {
      toast({
        title: isEn ? "Login Required to Book" : "Yêu cầu đăng nhập để đặt phòng",
        description: isEn
          ? "Guests may browse rooms and rates freely. Please sign in to proceed with your reservation."
          : "Khách vãng lai có thể xem phòng và giá tự do. Quý khách vui lòng đăng nhập tài khoản để tiếp tục đặt phòng nhé ạ! 🌸",
      });
      navigate("/login", { state: { from: nextPath } });
      return;
    }
    navigate(nextPath);
  };



  return (

    <main className="container py-12">

      <QuickSearch />

      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">

        <div className="grid md:grid-cols-[1fr_1.2fr]">

          <div className="relative h-64 md:h-72 overflow-hidden bg-secondary text-xl font-semibold text-primary">
            {hotel?.imageUrls && hotel.imageUrls.length === 2 ? (
              <div className="grid h-full grid-cols-2 gap-1.5 p-1.5">
                {hotel.imageUrls.map((imgUrl, idx) => (
                  <div key={imgUrl + idx} className="overflow-hidden rounded-xl">
                    <img
                      src={imgUrl}
                      alt={`${hotel.name} ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
                <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {isEn ? "2 photos" : "Tổng 2 ảnh"}
                </span>
              </div>
            ) : hotel?.imageUrls && hotel.imageUrls.length >= 3 ? (
              <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5 p-1.5">
                <div className="col-span-2 row-span-2 overflow-hidden rounded-xl">
                  <img
                    src={hotel.imageUrls[0]}
                    alt={hotel.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                {hotel.imageUrls.slice(1, 3).map((imgUrl, idx) => (
                  <div key={imgUrl + idx} className="relative overflow-hidden rounded-xl">
                    <img
                      src={imgUrl}
                      alt={`${hotel.name} ${idx + 2}`}
                      className="h-full w-full object-cover"
                    />
                    {idx === 1 && hotel.imageUrls.length > 3 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs font-bold text-white">
                        +{hotel.imageUrls.length - 3} ảnh
                      </div>
                    )}
                  </div>
                ))}
                <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {isEn ? `${hotel.imageUrls.length} photos` : `Tổng ${hotel.imageUrls.length} ảnh`}
                </span>
              </div>
            ) : hotel?.imageUrls?.[0] ? (
              <>
                <img
                  src={hotel.imageUrls[0]}
                  alt={hotel.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                  {isEn ? "1 photo" : "Tổng 1 ảnh"}
                </span>
              </>
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center">
                <span>Sen Việt</span>
              </div>
            )}
          </div>
          <div className="p-6 md:p-8">
            <h1 className="mt-3 font-display text-4xl font-bold text-primary">
              {hotel?.name || (isEn ? "Hotel" : "Khách sạn")}
            </h1>
            <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {[hotel?.address, hotel?.provinceName].filter(Boolean).join(", ")}
            </p>
            {hotelListError && !hotel && (
              <p role="alert" className="mt-4 text-sm text-rose-600 dark:text-rose-400 font-medium">
                {isEn ? "Unable to load hotel details." : "Không thể tải thông tin khách sạn."}
              </p>
            )}
          </div>
        </div>

      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-sm">

        <div className="flex items-center gap-2">

          <CalendarDays className="h-5 w-5 text-primary" />

          <h2 className="font-display text-xl font-bold text-primary">

            {isEn ? "Default Stay Dates" : "Ngày mặc định cho phòng mới"}

          </h2>

        </div>

        <p className="mt-1 text-sm text-muted-foreground">

          {isEn

            ? "Stay dates can be customized individually for each room below, even within the same type."

            : "Ngày của từng phòng có thể chỉnh riêng bên dưới, kể cả các phòng cùng một loại."}

        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-4">

          <label className="text-sm font-medium text-primary">

            {isEn ? "Check-in Date" : "Ngày nhận phòng"}

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

              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-foreground p-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition"

            />

            <span className="mt-1 block text-xs text-muted-foreground">

              {isEn ? "Check-in from 14:00" : "Nhận phòng từ 14:00"}

            </span>

          </label>

          <label className="text-sm font-medium text-primary">

            {isEn ? "Check-out Date" : "Ngày trả phòng"}

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

              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-foreground p-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition"

            />

            <span className="mt-1 block text-xs text-muted-foreground">

              {isEn ? "Check-out before 12:00" : "Trả phòng trước 12:00"}

            </span>

          </label>

          <label className="text-sm font-medium text-primary">

            {isEn ? "Estimated Arrival Time" : "Giờ đến dự kiến"}

            <input

              type="time"

              value={arrivalTime}

              onChange={(event) => setArrivalTime(event.target.value)}

              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-foreground p-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition"

            />

            <span className="mt-1 block text-xs text-muted-foreground">

              {isEn ? "Please notify front desk if arriving after 22:00" : "Sau 22:00 vui lòng ghi chú lễ tân"}

            </span>

          </label>

          <label className="text-sm font-medium text-primary">

            {isEn ? "Estimated Departure Time" : "Giờ trả dự kiến"}

            <input

              type="time"

              value={departureTime}

              onChange={(event) => setDepartureTime(event.target.value)}

              className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-background text-foreground p-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition"

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

              {isEn ? "Select Your Rooms" : "Chọn phòng phù hợp"}

            </h2>

            <p className="mt-2 text-sm text-muted-foreground">

              {isEn

                ? "Maximum room selection matches live availability for the selected dates."

                : "Số lượng phòng tối đa luôn khớp với số phòng còn trống trong khoảng ngày đã chọn."}

            </p>

          </div>

          {error && (

            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">

              {error}

            </p>

          )}

          {roomsLoadError && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {roomsLoadError}
            </p>
          )}
          {!roomsLoadError && rooms.length === 0 && (
            <p className="mt-4 rounded-xl border border-border bg-card p-3 text-sm text-muted-foreground">
              {isEn ? "No rooms are currently available." : "Hiện chưa có dữ liệu phòng."}
            </p>
          )}
          <div className="mt-5 space-y-5">

            {rooms.map((item, index) => {

              const quantity = quantities[item.id] || 0;

              const dates = getDates(item.id, 0);

              const maxQuantity = maxAvailable(index);
              const stayRoomId = item.roomId || item.id;

              const priceCalc = getStayPrice(

                stayRoomId,

                dates.checkIn,

                dates.checkOut,

                item.price,

                dailyPrices,

              );

              const hasDynamicPricing = Boolean(

                dailyPrices &&

                (dailyPrices[String(stayRoomId)] || dailyPrices[Number(stayRoomId)])

              );

              const displayNightlyPrice = priceCalc.avgNightly;

              const standardGuests = item.standardCapacity ?? item.capacity.adults;
              const maxTotalGuests = standardGuests + (item.maxExtraGuests ?? 0);
              return (

                <article

                  key={item.id}

                  className={`overflow-hidden rounded-2xl border bg-card transition ${selectedRoom === index ? "border-primary ring-2 ring-primary/20" : "border-border"}`}

                  onClick={() => setSelectedRoom(index)}

                >

                  <div className="grid md:grid-cols-[190px_1fr_auto]">

                    <div className="relative">
                      {(() => {
                        const roomImgs =
                          item.images && item.images.length > 0
                            ? item.images
                            : [item.image || "/placeholder.svg"];
                        const curImgIdx =
                          (roomPhotoIndices[item.id] || 0) % roomImgs.length;
                        return (
                          <>
                            <img
                              loading="lazy"
                              decoding="async"
                              src={roomImgs[curImgIdx]}
                              alt={item.nameVi}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailRoom(index);
                              }}
                              className="aspect-[4/3] h-full w-full cursor-pointer object-cover md:aspect-auto"
                            />
                            <span className="absolute right-2.5 top-2.5 rounded-full bg-slate-950/75 px-2.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm">
                              {curImgIdx + 1}/{roomImgs.length} ảnh
                            </span>
                            {roomImgs.length > 1 && (
                              <div className="absolute bottom-3 left-3 flex gap-1">
                                <button
                                  type="button"
                                  aria-label="Ảnh trước"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRoomPhotoIndices((prev) => ({
                                      ...prev,
                                      [item.id]:
                                        ((prev[item.id] || 0) - 1 + roomImgs.length) %
                                        roomImgs.length,
                                    }));
                                  }}
                                  className="rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Ảnh sau"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRoomPhotoIndices((prev) => ({
                                      ...prev,
                                      [item.id]:
                                        ((prev[item.id] || 0) + 1) % roomImgs.length,
                                    }));
                                  }}
                                  className="rounded-full bg-white/90 p-1.5 shadow hover:bg-white"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
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

                          {standardGuests > 0
                            ? (isEn ? `Standard ${standardGuests} adults${maxTotalGuests > standardGuests ? ` (max ${maxTotalGuests} guests)` : ""}` : `Chuẩn ${standardGuests} người lớn${maxTotalGuests > standardGuests ? ` (tối đa ${maxTotalGuests} khách)` : ""}`)
                            : (isEn ? "Capacity not provided" : "Chưa có thông tin sức chứa")}
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

                            ? (isEn ? `${maxQuantity} rooms left` : `Còn ${maxQuantity} phòng`)

                            : (isEn ? "Sold out" : "Hết phòng")}

                        </span>

                        <span className="text-muted-foreground">

                          {item.buildingName && `${isEn ? "Building" : "Tòa"} ${item.buildingName} · `}
                          {item.floor > 0 && `${isEn ? "Floor" : "Tầng"} ${item.floor} · `}
                          {hasDynamicPricing ? (isEn ? "Daily pricing" : "Giá theo ngày") : (isEn ? "Standard rate" : "Giá tiêu chuẩn")}
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

                          {isEn ? "View room details" : "Xem chi tiết phòng"}

                        </button>

                      </div>

                    </div>

                    <div className="border-t border-border bg-secondary/30 p-5 md:border-l md:border-t-0">

                      <p className="text-xs text-muted-foreground">{hasDynamicPricing ? (isEn ? "Selected date rate" : "Giá ngày đã chọn") : (isEn ? "Rates from" : "Giá từ")}</p>

                      <p className="mt-1 text-2xl font-bold text-primary">

                        {formatVnd(displayNightlyPrice)}

                        <span className="text-xs font-normal text-muted-foreground">

                          {" "}

                          / {isEn ? "night" : "đêm"}

                        </span>

                      </p>

                      <label className="mt-4 block text-xs font-semibold text-primary">

                        {isEn ? "Rooms" : "Số phòng"}

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

                          <option value={0}>{isEn ? "None selected" : "Không chọn"}</option>

                          {Array.from(

                            { length: maxQuantity },

                            (_, roomIndex) => (

                              <option key={roomIndex + 1} value={roomIndex + 1}>

                                {roomIndex + 1} {isEn ? (roomIndex === 0 ? "room" : "rooms") : "phòng"}

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

                                      normalizeRoomDisplayName(

                                        selectedRoomCodes[item.id]?.[stayIndex] ||

                                        item.roomCodes[stayIndex] ||

                                        "",

                                      )

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

                                    ).map((rawCode, codeIdx) => {

                                      const code = normalizeRoomDisplayName(rawCode);

                                      const isChosenByOther = (

                                        selectedRoomCodes[item.id] || []

                                      ).some(

                                        (c, idx) =>

                                          idx !== stayIndex &&

                                          normalizeRoomDisplayName(c) === code,

                                      );

                                      return (

                                        <option

                                          key={`${code}-${codeIdx}`}

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

                                    min={stayDates.checkIn ? nextDate(stayDates.checkIn) : dateValue(today)}

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

                                {(() => {

                                  const standardGuests =

                                    item.standardCapacity ??
                                    item.capacity?.adults ??
                                    0;
                                  const maxExtra = item.maxExtraGuests ?? 0;
                                  const maxTotalCapacity = Math.max(
                                    1,
                                    standardGuests + maxExtra,
                                  );
                                  const maxAdultsAllowed = Math.max(

                                    1,

                                    maxTotalCapacity - (guest.children || 0),

                                  );

                                  const maxChildrenAllowed = Math.max(

                                    0,

                                    maxTotalCapacity - (guest.adults || 1),

                                  );



                                  return (

                                    <>

                                      <label className="text-xs text-muted-foreground">

                                        Người lớn (từ 12 tuổi)

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

                                          className="mt-1 w-full rounded-lg border border-input bg-white p-2 text-sm font-semibold text-primary"

                                        >

                                          {Array.from(

                                            { length: maxAdultsAllowed },

                                            (_, optionIndex) => (

                                              <option

                                                key={optionIndex + 1}

                                                value={optionIndex + 1}

                                              >

                                                {optionIndex + 1} người lớn

                                              </option>

                                            ),

                                          )}

                                        </select>

                                      </label>

                                      <label className="text-xs text-muted-foreground">

                                        Trẻ em (2–11 tuổi)

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

                                          className="mt-1 w-full rounded-lg border border-input bg-white p-2 text-sm font-semibold text-primary"

                                        >

                                          {Array.from(

                                            { length: maxChildrenAllowed + 1 },

                                            (_, optionIndex) => (

                                              <option

                                                key={optionIndex}

                                                value={optionIndex}

                                              >

                                                {optionIndex} trẻ em

                                              </option>

                                            ),

                                          )}

                                        </select>

                                      </label>

                                      <label className="text-xs text-muted-foreground">

                                        Em bé (&lt; 2 tuổi, miễn phí)

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

                                          className="mt-1 w-full rounded-lg border border-input bg-white p-2 text-sm font-semibold text-primary"

                                        >

                                          {[0, 1, 2].map((count) => (

                                            <option key={count} value={count}>

                                              {count} em bé

                                            </option>

                                          ))}

                                        </select>

                                      </label>

                                    </>

                                  );

                                })()}

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

          hotelName={hotel?.name || ""}
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

            maxAvailable(detailRoom)
          }

          onClose={() => setDetailRoom(null)}

        />

      )}

    </main>

  );

}

