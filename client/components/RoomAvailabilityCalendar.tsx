import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Minus, X } from "lucide-react";
import { formatVnd } from "@/data/hotels";
import { getDailyRoomAvailability, getDailyRoomPrice } from "@/lib/bookings";

interface RoomAvailabilityCalendarProps {
  roomIndex: number;
  basePrice: number;
  requestedRooms: number;
  selectedStartDate: string;
  selectedEndDate: string;
  onSelectRange: (startDate: string, endDate: string) => void;
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10);
const parseDate = (date: string) => new Date(`${date}T12:00:00`);
const today = formatDate(new Date());
const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const formatMonth = (date: Date) => new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(date);

export default function RoomAvailabilityCalendar({ roomIndex, basePrice, requestedRooms, selectedStartDate, selectedEndDate, onSelectRange }: RoomAvailabilityCalendarProps) {
  const selected = selectedStartDate ? parseDate(selectedStartDate) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1, 12));
  const [rangeStart, setRangeStart] = useState(selectedStartDate);

  useEffect(() => {
    if (!selectedStartDate) return;
    const nextMonth = parseDate(selectedStartDate);
    setVisibleMonth(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1, 12));
    setRangeStart(selectedEndDate ? "" : selectedStartDate);
  }, [selectedStartDate, selectedEndDate]);

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1, 12);
    const leadingDays = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
    return [...Array.from({ length: leadingDays }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => formatDate(new Date(year, month, index + 1, 12)))];
  }, [visibleMonth]);

  const moveMonth = (amount: number) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));

  const selectDate = (date: string, available: boolean) => {
    if (!available) return;
    if (!rangeStart || (selectedStartDate && selectedEndDate)) {
      setRangeStart(date);
      onSelectRange(date, "");
      return;
    }
    if (date < rangeStart) {
      setRangeStart(date);
      onSelectRange(date, "");
      return;
    }
    setRangeStart("");
    onSelectRange(rangeStart, date);
  };

  return <div className="mt-4 w-full rounded-xl border border-primary/15 bg-primary/[.03] p-3 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-semibold text-primary sm:text-sm"><CalendarDays className="h-4 w-4" /><span>Chọn khoảng ngày lưu trú</span></div><div className="flex items-center gap-2"><button type="button" onClick={() => moveMonth(-1)} aria-label="Tháng trước" className="rounded-lg border border-border bg-white p-1.5 text-primary transition hover:border-primary"><ChevronLeft className="h-4 w-4" /></button><span className="min-w-32 text-center text-xs font-semibold capitalize text-primary sm:text-sm">{formatMonth(visibleMonth)}</span><button type="button" onClick={() => moveMonth(1)} aria-label="Tháng sau" className="rounded-lg border border-border bg-white p-1.5 text-primary transition hover:border-primary"><ChevronRight className="h-4 w-4" /></button></div></div><div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground sm:gap-2 sm:text-xs">{weekdays.map((weekday) => <span key={weekday} className="py-1">{weekday}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">{days.map((date, index) => { if (!date) return <span key={`empty-${index}`} aria-hidden="true" className="min-h-20 sm:min-h-24" />; const availability = getDailyRoomAvailability(roomIndex, date, requestedRooms); const price = getDailyRoomPrice(basePrice, roomIndex, date); const past = date < today; const available = availability.available && !past; const start = date === selectedStartDate; const end = date === selectedEndDate; const inRange = Boolean(selectedStartDate && selectedEndDate && date > selectedStartDate && date < selectedEndDate); const unavailableLabel = past ? "Đã qua" : "Hết phòng"; return <button type="button" key={date} onClick={() => selectDate(date, available)} disabled={!available} className={`min-h-20 rounded-lg border p-1.5 text-left transition sm:min-h-24 sm:p-2 ${start || end ? "border-primary bg-primary text-primary-foreground shadow-sm" : inRange ? "border-primary/30 bg-primary/10 text-primary" : past ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : available ? "border-border bg-white hover:border-primary hover:shadow-sm" : "cursor-not-allowed border-red-100 bg-red-50 text-red-500 opacity-80"}`}><span className="block text-[10px] font-semibold sm:text-xs">{parseDate(date).getDate()}</span><span className="mt-1 block truncate text-[9px] font-bold sm:text-[10px]">{formatVnd(price)}</span><span className={`mt-1 flex items-center gap-0.5 text-[9px] leading-tight sm:text-[10px] ${start || end ? "text-primary-foreground/80" : inRange ? "text-primary" : past ? "text-slate-400" : available ? "text-emerald-700" : "text-red-500"}`}>{available ? <><Check className="h-3 w-3 shrink-0" /><span>Còn {availability.remaining}</span></> : <><span>{past ? <Minus className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}</span><span>{unavailableLabel}</span></>}</span></button>; })}</div><p className="mt-3 text-[10px] text-muted-foreground sm:text-xs">Chọn ngày nhận phòng trước, sau đó chọn ngày trả phòng. Mỗi ngày hiển thị giá và số phòng còn lại.</p></div>;
}
