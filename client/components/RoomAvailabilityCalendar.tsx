import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  X,
} from "lucide-react";
import { formatVnd } from "@/data/hotels";
import { toLocalDateStr } from "@/lib/utils";
import { getDailyRoomAvailability, getDailyRoomPrice } from "@/lib/bookings";

interface RoomAvailabilityCalendarProps {
  roomIndex: number;
  basePrice: number;
  requestedRooms: number;
  selectedStartDate: string;
  selectedEndDate: string;
  onSelectRange: (startDate: string, endDate: string) => void;
  availableCount?: number;
  roomId?: string | number;
  roomCodes?: string[];
}

type CalendarDay = {
  date: string;
  isCurrentMonth: boolean;
};

const formatDate = (date: Date) => toLocalDateStr(date);
const parseDate = (date: string) => new Date(`${date}T12:00:00`);
const addDaysStr = (dateStr: string, days: number) => {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};
const today = formatDate(new Date());
const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
  }).format(date);

export default function RoomAvailabilityCalendar({
  roomIndex,
  basePrice,
  requestedRooms,
  selectedStartDate,
  selectedEndDate,
  onSelectRange,
  availableCount,
  roomId,
  roomCodes,
}: RoomAvailabilityCalendarProps) {
  const selected = selectedStartDate
    ? parseDate(selectedStartDate)
    : new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1, 12),
  );
  const [rangeStart, setRangeStart] = useState(selectedStartDate);

  useEffect(() => {
    if (!selectedStartDate) return;
    const nextMonth = parseDate(selectedStartDate);
    setVisibleMonth(
      new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1, 12),
    );
    setRangeStart(selectedEndDate ? "" : selectedStartDate);
  }, [selectedStartDate, selectedEndDate]);

  const days = useMemo<CalendarDay[]>(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1, 12);
    const leadingDays = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0, 12).getDate();
    const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
    const gridStart = new Date(year, month, 1 - leadingDays, 12);

    return Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return {
        date: formatDate(date),
        isCurrentMonth: date.getMonth() === month,
      };
    });
  }, [visibleMonth]);

  const moveMonth = (amount: number) =>
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1, 12),
    );

  const [dragSelection, setDragSelection] = useState<{
    startDate: string;
    currentDate: string;
  } | null>(null);

  const isDateAvailable = (dateStr: string) => {
    if (dateStr < today) return false;
    return getDailyRoomAvailability(
      roomIndex,
      dateStr,
      requestedRooms,
      availableCount,
      { id: roomId, codes: roomCodes },
    ).available;
  };

  const isRangeAvailable = (start: string, endExclusive: string) => {
    if (!start || !endExclusive || start >= endExclusive) return false;
    for (let d = start; d < endExclusive; d = addDaysStr(d, 1)) {
      if (!isDateAvailable(d)) return false;
    }
    return true;
  };

  const applySingleClickDate = (clickedDate: string) => {
    if (!isDateAvailable(clickedDate)) return;
    const hasCurrentRange = Boolean(
      selectedStartDate &&
        selectedEndDate &&
        selectedStartDate < selectedEndDate,
    );

    if (hasCurrentRange) {
      const checkInDate = selectedStartDate;
      const lastNightDate = addDaysStr(selectedEndDate, -1);

      // 1. Giống hệt Web Nhân Viên: Bấm vào ngày liền kề trước ngày nhận hoặc đúng ngày trả -> nối thêm 1 đêm
      if (
        clickedDate === addDaysStr(checkInDate, -1) ||
        clickedDate === selectedEndDate
      ) {
        const newCheckIn =
          clickedDate < checkInDate ? clickedDate : checkInDate;
        const newCheckOut =
          clickedDate > lastNightDate
            ? addDaysStr(clickedDate, 1)
            : selectedEndDate;
        if (isRangeAvailable(newCheckIn, newCheckOut)) {
          onSelectRange(newCheckIn, newCheckOut);
          return;
        }
      }

      // 2. Giống hệt Web Nhân Viên: Bấm lại vào đêm đầu tiên hoặc đêm cuối cùng -> bỏ chọn đêm đó (nếu chỉ có 1 đêm thì bỏ chọn hết)
      if (clickedDate === checkInDate || clickedDate === lastNightDate) {
        const isSingleNight = checkInDate === lastNightDate;
        if (isSingleNight) {
          onSelectRange("", "");
          return;
        }
        let newCheckIn = checkInDate;
        let newCheckOut = selectedEndDate;
        if (clickedDate === checkInDate) {
          newCheckIn = addDaysStr(checkInDate, 1);
        } else if (clickedDate === lastNightDate) {
          newCheckOut = lastNightDate;
        }
        onSelectRange(newCheckIn, newCheckOut);
        return;
      }
    }

    // 3. Giống hệt Web Nhân Viên: Bấm vào một ngày khác không liền kề -> chọn mới 1 đêm tại ngày đó
    const nextDay = addDaysStr(clickedDate, 1);
    if (isRangeAvailable(clickedDate, nextDay)) {
      onSelectRange(clickedDate, nextDay);
    }
  };

  const handlePointerDown = (dateStr: string, available: boolean) => {
    if (!available) return;
    setDragSelection({ startDate: dateStr, currentDate: dateStr });
  };

  const handlePointerEnter = (dateStr: string, available: boolean) => {
    if (!dragSelection || !available) return;
    setDragSelection((prev) =>
      prev ? { ...prev, currentDate: dateStr } : null,
    );
  };

  const commitDragSelection = () => {
    if (!dragSelection) return;
    const { startDate, currentDate } = dragSelection;
    setDragSelection(null);

    if (startDate === currentDate) {
      applySingleClickDate(startDate);
      return;
    }

    const minDate = startDate < currentDate ? startDate : currentDate;
    const maxDate = startDate > currentDate ? startDate : currentDate;
    const newCheckOut = addDaysStr(maxDate, 1);
    if (isRangeAvailable(minDate, newCheckOut)) {
      onSelectRange(minDate, newCheckOut);
    }
  };

  useEffect(() => {
    if (!dragSelection) return;
    const onGlobalPointerUp = () => commitDragSelection();
    window.addEventListener("pointerup", onGlobalPointerUp);
    return () => window.removeEventListener("pointerup", onGlobalPointerUp);
  });

  const dragMin =
    dragSelection && dragSelection.startDate !== dragSelection.currentDate
      ? dragSelection.startDate < dragSelection.currentDate
        ? dragSelection.startDate
        : dragSelection.currentDate
      : "";
  const dragMax =
    dragSelection && dragSelection.startDate !== dragSelection.currentDate
      ? dragSelection.startDate > dragSelection.currentDate
        ? dragSelection.startDate
        : dragSelection.currentDate
      : "";

  return (
    <div className="mt-4 w-full rounded-xl border border-primary/15 bg-primary/[.03] p-3 sm:p-5 select-none">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary sm:text-sm">
          <CalendarDays className="h-4 w-4" />
          <span>Chọn đêm lưu trú (kéo thả hoặc bấm ngày liền kề để nối đêm, bấm lại đầu/cuối để bỏ chọn)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="Tháng trước"
            className="rounded-lg border border-border bg-white p-1.5 text-primary transition hover:border-primary"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-32 text-center text-xs font-semibold capitalize text-primary sm:text-sm">
            {formatMonth(visibleMonth)}
          </span>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="Tháng sau"
            className="rounded-lg border border-border bg-white p-1.5 text-primary transition hover:border-primary"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-muted-foreground sm:gap-2 sm:text-xs">
        {weekdays.map((weekday) => (
          <span key={weekday} className="py-1">
            {weekday}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const { date, isCurrentMonth } = day;
          const availability = getDailyRoomAvailability(
            roomIndex,
            date,
            requestedRooms,
            availableCount,
            { id: roomId, codes: roomCodes },
          );
          const price = getDailyRoomPrice(basePrice, roomIndex, date);
          const past = date < today;
          const available = availability.available && !past;
          const isDraggingOver = Boolean(
            dragMin && dragMax && date >= dragMin && date <= dragMax,
          );
          const isStayNight =
            isDraggingOver ||
            Boolean(
              selectedStartDate &&
                selectedEndDate &&
                date >= selectedStartDate &&
                date < selectedEndDate,
            );
          const start =
            isStayNight &&
            (isDraggingOver ? date === dragMin : date === selectedStartDate);
          const end =
            isStayNight &&
            (isDraggingOver
              ? date === dragMax
              : addDaysStr(date, 1) === selectedEndDate);
          const inRange = isStayNight && !start && !end;
          const unavailableLabel = past ? "Đã qua" : "Hết phòng";
          const monthLabel = `T${parseDate(date).getMonth() + 1}`;

          return (
            <button
              type="button"
              key={date}
              onPointerDown={() => handlePointerDown(date, available)}
              onPointerEnter={() => handlePointerEnter(date, available)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  applySingleClickDate(date);
                }
              }}
              disabled={!available}
              aria-label={`${date}${available ? " - còn phòng" : ` - ${unavailableLabel.toLowerCase()}`}`}
              className={`min-h-20 rounded-lg border p-1.5 text-left transition sm:min-h-24 sm:p-2 ${
                past
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : start || end
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : inRange
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : !isCurrentMonth
                        ? available
                          ? "border-dashed border-primary/25 bg-primary/[.03] text-primary/75 hover:border-primary hover:bg-primary/10"
                          : "cursor-not-allowed border-dashed border-red-100 bg-red-50/70 text-red-400 opacity-80"
                        : available
                          ? "border-border bg-white hover:border-primary hover:shadow-sm"
                          : "cursor-not-allowed border-red-100 bg-red-50 text-red-500 opacity-80"
              }`}
            >
              <span className="flex items-center justify-between gap-1 text-[10px] font-semibold sm:text-xs">
                <span>{parseDate(date).getDate()}</span>
                {!isCurrentMonth && (
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[8px] font-bold text-primary sm:text-[9px]">
                    {monthLabel}
                  </span>
                )}
              </span>
              {!past && (
                <>
                  <span className="mt-1 block truncate text-[9px] font-bold sm:text-[10px]">
                    {formatVnd(price)}
                  </span>
                  <span
                    className={`mt-1 flex items-center gap-0.5 text-[9px] leading-tight sm:text-[10px] ${
                      start || end
                        ? "text-primary-foreground/80"
                        : inRange
                          ? "text-primary"
                          : available
                            ? "text-emerald-700"
                            : "text-red-500"
                    }`}
                  >
                    {available ? (
                      <>
                        <Check className="h-3 w-3 shrink-0" />
                        <span>Còn {availability.remaining}</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 shrink-0" />
                        <span>{unavailableLabel}</span>
                      </>
                    )}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground sm:text-xs">
        Chọn ngày nhận phòng trước, sau đó chọn ngày trả phòng. Ngày có nhãn T tháng
        là ngày của tháng liền kề và vẫn có thể chọn để tạo khoảng lưu trú qua tháng.
      </p>
    </div>
  );
}
