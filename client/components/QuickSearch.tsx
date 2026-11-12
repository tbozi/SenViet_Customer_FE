import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, MapPin, Search, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import { useLanguage } from "@/lib/i18n";
import { toLocalDateStr } from "@/lib/utils";
import { formatDisplayDate } from "@/lib/dateTime";

export default function QuickSearch() {
  const { t, language } = useLanguage();
  const isEn = language === "en";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: hotels = [], isLoading: hotelsLoading, isError: hotelsError } = useGetPublicHotelsQuery();
  const [location, setLocation] = useState(() => searchParams.get("location") || "");
  const [checkIn, setCheckIn] = useState(() => searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(() => searchParams.get("checkOut") || "");
  const [rooms, setRooms] = useState(() => searchParams.get("rooms") || "1");
  const [adults, setAdults] = useState(() => searchParams.get("adults") || "2");
  const [children, setChildren] = useState(() => searchParams.get("children") || "0");
  const [childAges, setChildAges] = useState<string[]>(() => {
    try {
      return JSON.parse(searchParams.get("childAges") || "[]");
    } catch {
      return [];
    }
  });
  const [promo, setPromo] = useState(() => searchParams.get("promo") || "");
  const [error, setError] = useState("");
  const today = toLocalDateStr();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!location) return setError(isEn ? "Please select a destination." : "Vui lòng chọn địa điểm.");
    if (hotelsError) return setError(isEn ? "Unable to load hotels. Please try again later." : "Không thể tải danh sách khách sạn. Vui lòng thử lại sau.");
    if (!checkIn || !checkOut) return setError(isEn ? "Please select check-in and check-out dates." : "Vui lòng chọn ngày nhận phòng và ngày trả phòng.");
    if (checkIn < today) return setError(isEn ? "Check-in date cannot be in the past." : "Ngày nhận phòng không thể ở trong quá khứ (trước ngày hôm nay).");
    if (checkOut <= checkIn) return setError(isEn ? "Check-out date must be after check-in date." : "Ngày trả phòng phải sau ngày nhận phòng.");
    setError("");
    const query = new URLSearchParams({
      location,
      checkIn,
      checkOut,
      rooms,
      adults,
      children,
      childAges: JSON.stringify(childAges),
      promo,
    });
    navigate(`/hotels/${location}?${query.toString()}`);
  };

  const changeChildren = (value: string) => {
    const count = Number(value);
    setChildren(value);
    setChildAges((current) =>
      Array.from({ length: count }, (_, index) => current[index] || "6")
    );
  };

  return (
    <form
      onSubmit={submit}
      className="grid min-w-0 grid-cols-1 gap-2.5 rounded-2xl border border-border bg-card/95 text-card-foreground p-3.5 shadow-[0_16px_36px_-6px_rgba(15,25,47,0.10)] backdrop-blur-md md:grid-cols-2 xl:grid-cols-4 transition-all"
    >
      <label className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <select
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setError("");
          }}
          aria-label={t("hotels.searchLocation")}
          className="w-full bg-transparent text-sm text-foreground outline-none"
          disabled={hotelsLoading}
        >
          <option className="bg-background text-foreground" value="">{t("hotels.searchLocation")}</option>
          {hotels.map((hotel) => (
            <option className="bg-background text-foreground" value={hotel.id} key={hotel.id}>
              {hotel.name} — {hotel.provinceName || hotel.address}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col justify-center rounded-xl bg-secondary/60 px-3 py-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => {
              const next = e.target.value;
              setCheckIn(next);
              if (checkOut && checkOut <= next) {
                const nextDay = new Date(`${next}T00:00:00`);
                nextDay.setDate(nextDay.getDate() + 1);
                setCheckOut(toLocalDateStr(nextDay));
              }
              setError("");
            }}
            aria-label={t("hotels.searchCheckIn")}
            className="min-w-0 w-full bg-transparent text-sm text-foreground outline-none"
          />
        </div>
        {checkIn && (
          <span className="text-[10px] text-primary/80 font-medium pl-6">
            {formatDisplayDate(checkIn, language)}
          </span>
        )}
      </label>

      <label className="flex flex-col justify-center rounded-xl bg-secondary/60 px-3 py-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => {
              setCheckOut(e.target.value);
              setError("");
            }}
            aria-label={t("hotels.searchCheckOut")}
            className="min-w-0 w-full bg-transparent text-sm text-foreground outline-none"
          />
        </div>
        {checkOut && (
          <span className="text-[10px] text-primary/80 font-medium pl-6">
            {formatDisplayDate(checkOut, language)}
          </span>
        )}
      </label>

      <label className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
        <Users className="h-4 w-4 shrink-0 text-primary" />
        <select
          value={rooms}
          onChange={(e) => setRooms(e.target.value)}
          aria-label={t("hotels.searchRooms")}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        >
          {[1, 2, 3, 4, 5].map((count) => (
            <option className="bg-background text-foreground" value={String(count)} key={count}>
              {count} {isEn ? (count === 1 ? "Room" : "Rooms") : "phòng"}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
        <Users className="h-4 w-4 shrink-0 text-primary" />
        <select
          value={adults}
          onChange={(e) => setAdults(e.target.value)}
          aria-label={isEn ? "Adults" : "Người lớn"}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
            <option className="bg-background text-foreground" value={count} key={count}>
              {count} {isEn ? (count === 1 ? "Adult" : "Adults") : "người lớn"}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
        <Users className="h-4 w-4 shrink-0 text-primary" />
        <select
          value={children}
          onChange={(e) => changeChildren(e.target.value)}
          aria-label={isEn ? "Children" : "Trẻ em"}
          className="w-full bg-transparent text-sm text-foreground outline-none"
        >
          <option className="bg-background text-foreground" value="0">{isEn ? "No children" : "Không có trẻ em"}</option>
          {[1, 2, 3, 4].map((count) => (
            <option className="bg-background text-foreground" value={count} key={count}>
              {count} {isEn ? (count === 1 ? "Child" : "Children") : "trẻ em"}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 rounded-xl bg-secondary/60 px-3 py-2">
        <Ticket className="h-4 w-4 shrink-0 text-primary" />
        <input
          value={promo}
          onChange={(e) => setPromo(e.target.value)}
          aria-label={t("hotels.searchPromo")}
          placeholder={t("hotels.searchPromo")}
          className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>

      <Button
        type="submit"
        className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-5 text-white shadow-md shadow-amber-600/20 hover:from-amber-700 hover:to-amber-800 active:scale-95 transition-all font-semibold cursor-pointer"
      >
        <Search className="mr-2 h-4 w-4" />
        {t("hotels.searchButton")}
      </Button>

      {Number(children) > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-secondary/40 p-2 text-xs md:col-span-2 lg:col-span-full">
          <span className="font-semibold text-primary">{isEn ? "Child ages:" : "Độ tuổi trẻ em:"}</span>
          {childAges.map((age, index) => (
            <select
              key={index}
              value={age}
              onChange={(e) =>
                setChildAges((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? e.target.value : item
                  )
                )
              }
              aria-label={isEn ? `Child ${index + 1} age` : `Tuổi trẻ em ${index + 1}`}
              className="rounded-lg border border-input bg-background text-foreground p-1.5"
            >
              <option className="bg-background text-foreground" value="0">{index + 1}: {isEn ? "0–5 years old" : "0–5 tuổi"}</option>
              {[6, 7, 8, 9, 10, 11].map((a) => (
                <option className="bg-background text-foreground" value={String(a)} key={a}>
                  {index + 1}: {a} {isEn ? "years old" : "tuổi"}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {error && (
        <p className="px-2 text-xs font-medium text-destructive md:col-span-2 lg:col-span-full">
          {error}
        </p>
      )}
    </form>
  );
}
