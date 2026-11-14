import type { ReactNode } from "react";
import { AlertCircle, BookmarkCheck, CalendarDays, Check, Tag, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatVnd } from "@/data/hotels";
import { formatDisplayDate } from "@/lib/dateTime";
import { useLanguage } from "@/lib/i18n";
import {
  getCancellationNotice,
  getCancellationSchedule,
  type BookingService,
  type RoomSelection,
  type RoomStay,
} from "@/lib/bookings";

export interface BookingSummaryFee {
  label: string;
  amount: number;
  detail?: string;
}

export interface BookingSummaryTotals {
  subtotal?: number;
  commonFeeRows?: BookingSummaryFee[];
  vatAndSystemFee?: number;
  discount?: number;
  total?: number;
  subtotalLabel?: string;
}

export interface SavedPromotionSummaryItem {
  code: string;
  name: string;
  discountText?: string;
  applicable?: boolean;
  reason?: string;
}

interface BookingSummaryPanelProps {
  hotelName: string;
  selections: RoomSelection[];
  arrivalTime: string;
  departureTime: string;
  totals?: BookingSummaryTotals;
  fallbackServices?: BookingService[];
  promo?: ReactNode;
  savedPromotions?: SavedPromotionSummaryItem[];
  selectedPromotionCode?: string;
  onSelectPromotion?: (code: string) => void;
  callout?: ReactNode;
  children?: ReactNode;
  emptyState?: ReactNode;
  cta?: ReactNode;
  className?: string;
  onRemoveRoom?: (roomId: string, stayIndex: number, roomCode?: string) => void;
}

type RoomBreakdown = {
  selection: RoomSelection;
  stay: RoomStay;
  roomPrice: number;
  extraGuestSurcharge: number;
  services: BookingService[];
  subtotal: number;
  stayIndex?: number;
};

function selectionStays(selection: RoomSelection): RoomStay[] {
  if (selection.stays?.length) return selection.stays;
  return Array.from({ length: selection.quantity }, (_, index) => ({
    roomCode: selection.roomCodes?.[index] || `Phòng ${index + 1}`,
    checkIn: selection.checkIn || "",
    checkOut: selection.checkOut || "",
    nights: selection.nights || 0,
    guest: selection.guestForms[index] ||
      selection.guestForms[0] || { adults: 1, children: 0, infants: 0 },
    extraGuestCharge:
      selection.extraGuestCharge / Math.max(1, selection.quantity),
    nightlyPrice: selection.nightlyPrice,
    offerId: selection.offerId,
    offerName: selection.offerName,
    offerCancellationPolicy: selection.offerCancellationPolicy,
  }));
}

function dateTimeLabel(date: string, time: string, isEn = false) {
  if (!date) return isEn ? "Not selected" : "Chưa chọn";
  const dateFormatted = formatDisplayDate(date, isEn ? "en" : "vi");
  return `${time}, ${dateFormatted}`;
}

export default function BookingSummaryPanel({
  hotelName,
  selections,
  arrivalTime,
  departureTime,
  totals,
  fallbackServices = [],
  promo,
  savedPromotions = [],
  selectedPromotionCode,
  onSelectPromotion,
  callout,
  children,
  emptyState,
  cta,
  className = "",
  onRemoveRoom,
}: BookingSummaryPanelProps) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const roomBreakdowns = selections.flatMap((selection, selectionIndex) =>
    selectionStays(selection).map((stay, stayIndex) => {
      const nightlyPrice = stay.nightlyPrice || selection.nightlyPrice;
      const roomPrice =
        stay.stayTotal !== undefined
          ? stay.stayTotal
          : nightlyPrice * Math.max(0, stay.nights);
      const extraGuestSurcharge =
        Number(stay.extraGuestCharge || 0) * Math.max(0, stay.nights);
      const concreteStayIndex =
        selections
          .slice(0, selectionIndex)
          .reduce((count, item) => count + selectionStays(item).length, 0) +
        stayIndex;
      const services =
        stay.services?.length || concreteStayIndex > 0
          ? stay.services || []
          : fallbackServices;
      const serviceTotal = services.reduce(
        (sum, service) => sum + service.total,
        0,
      );
      return {
        selection,
        stay,
        stayIndex,
        roomPrice,
        extraGuestSurcharge,
        services,
        subtotal: roomPrice + extraGuestSurcharge + serviceTotal,
      } satisfies RoomBreakdown;
    }),
  );
  const roomSubtotal = roomBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.subtotal,
    0,
  );
  const commonFeeRows = totals?.commonFeeRows || [];
  const discount = totals?.discount || 0;
  const vatAndSystemFee = totals?.vatAndSystemFee || 0;
  const total =
    totals?.total ??
    roomSubtotal +
      commonFeeRows.reduce((sum, fee) => sum + fee.amount, 0) +
      vatAndSystemFee -
      discount;
  const showOuterBreakdown = Boolean(
    totals?.subtotal !== undefined ||
    commonFeeRows.length ||
    vatAndSystemFee ||
    discount,
  );
  const roomCount = roomBreakdowns.length;

  return (
    <aside
      className={`h-fit rounded-2xl border border-primary/20 bg-card text-card-foreground p-5 shadow-lg sm:p-6 lg:sticky lg:top-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold">
            {isEn ? "Selection Summary" : "Tóm tắt lựa chọn"}
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-primary">
            {isEn ? "Reservation Details" : "Chi tiết đặt phòng"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{hotelName}</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
          {roomCount} {isEn ? (roomCount === 1 ? "Room" : "Rooms") : "phòng"}
        </span>
      </div>

      {roomCount ? (
        <div className="mt-4 space-y-4">
          {roomBreakdowns.map((breakdown) => {
            const { selection, stay, stayIndex = 0 } = breakdown;
            return (
              <section
                key={`${selection.roomId}-${stay.roomCode}-${stayIndex}`}
                className="relative rounded-xl border border-primary/10 bg-secondary/30 p-4 transition-all hover:border-primary/20"
              >
                {onRemoveRoom && (
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveRoom(selection.roomId, stayIndex, stay.roomCode)
                    }
                    title={`Hủy ${stay.roomCode || selection.roomNameVi}`}
                    aria-label={`Hủy ${stay.roomCode || selection.roomNameVi}`}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-rose-100 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                <div
                  className={`flex items-start justify-between gap-3 ${
                    onRemoveRoom ? "pr-8" : ""
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.1em] text-gold">
                      {selection.roomNameVi}
                    </p>
                    <h3 className="mt-1 font-semibold text-primary">
                      {stay.roomCode}
                    </h3>
                    {(stay.offerName || selection.offerName) && (
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        {stay.offerName || selection.offerName}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary tabular-nums">
                    {formatVnd(breakdown.subtotal)}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    {isEn ? "Check-in:" : "Nhận:"} {dateTimeLabel(stay.checkIn, arrivalTime, isEn)}
                  </p>
                  <p className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    {isEn ? "Check-out:" : "Trả:"} {dateTimeLabel(stay.checkOut, departureTime, isEn)}
                  </p>
                  <p className="flex items-start gap-2">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    {stay.guest.adults} {isEn ? (stay.guest.adults === 1 ? "Adult" : "Adults") : "người lớn"} · {stay.guest.children} {isEn ? (stay.guest.children === 1 ? "Child" : "Children") : "trẻ em"}
                    · {stay.guest.infants} {isEn ? (stay.guest.infants === 1 ? "Infant" : "Infants") : "em bé"} · {stay.nights} {isEn ? (stay.nights === 1 ? "night" : "nights") : "đêm"}
                  </p>
                  {stay.checkIn ? (() => {
                    const notice = getCancellationNotice(stay.checkIn, new Date(), isEn);
                    return (
                      <p
                        className={`flex items-center gap-1.5 text-[11px] font-medium ${
                          notice.type === "free"
                            ? "text-emerald-700"
                            : notice.type === "partial"
                              ? "text-amber-700"
                              : "text-rose-700"
                        }`}
                      >
                        {notice.type === "free" ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : notice.type === "partial" ? (
                          <span className="text-xs">⚠️</span>
                        ) : (
                          <span className="text-xs font-bold">✕</span>
                        )}
                        <span>{notice.text}</span>
                      </p>
                    );
                  })() : null}
                </div>

                <div className="mt-3 space-y-2 border-t border-primary/10 pt-3 text-xs">
                  <div className="flex justify-between gap-3">
                    <span>{isEn ? `Room rate (${stay.nights} ${stay.nights === 1 ? "night" : "nights"})` : `Tiền phòng (${stay.nights} đêm)`}</span>
                    <span className="font-semibold text-foreground tabular-nums">{formatVnd(breakdown.roomPrice)}</span>
                  </div>
                  {breakdown.extraGuestSurcharge > 0 && (
                    <div className="flex justify-between gap-3 font-medium text-amber-700">
                      <span>{isEn ? "Extra guest surcharge" : "Phụ thu vượt sức chứa"}</span>
                      <span className="tabular-nums">+{formatVnd(breakdown.extraGuestSurcharge)}</span>
                    </div>
                  )}
                  <div className="border-t border-primary/10 pt-2">
                    <p className="mb-1 font-semibold text-primary">{isEn ? "Services" : "Dịch vụ"}</p>
                    {breakdown.services.length ? (
                      <div className="space-y-1">
                        {breakdown.services.map((service) => (
                          <div
                            key={`${service.id}-${service.roomCode || "room"}`}
                            className="flex justify-between gap-3"
                          >
                            <span>
                              {service.name} × {service.quantity}
                            </span>
                            <span className="tabular-nums">{formatVnd(service.total)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{isEn ? "No services selected" : "Chưa chọn dịch vụ"}</p>
                    )}
                  </div>
                  <div className="flex justify-between gap-3 border-t border-primary/10 pt-2 font-bold text-primary">
                    <span>{isEn ? "Room Subtotal" : "Tạm tính phòng"}</span>
                    <span className="tabular-nums">{formatVnd(breakdown.subtotal)}</span>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        emptyState || (
          <p className="mt-4 text-sm text-muted-foreground">
            {isEn ? "No rooms selected." : "Chưa có phòng được chọn."}
          </p>
        )
      )}

      {roomCount ? (
        <>
          {promo}
          {savedPromotions.length > 0 && onSelectPromotion ? (
            <div className="mt-4 rounded-xl border border-amber-300/80 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/30 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <BookmarkCheck className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {isEn ? `Saved Offers (${savedPromotions.length})` : `Ưu đãi đã lưu (${savedPromotions.length})`}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground">{isEn ? "Select to apply" : "Chọn để áp dụng"}</span>
              </div>
              <div className="mt-2.5 space-y-2">
                {savedPromotions.map((promotion) => {
                  const isApplicable = promotion.applicable !== false;
                  const isSelected =
                    Boolean(selectedPromotionCode) &&
                    selectedPromotionCode.toUpperCase() ===
                      promotion.code.toUpperCase();

                  return (
                    <div
                      key={promotion.code}
                      className={`relative flex items-start justify-between gap-2.5 rounded-lg border p-2.5 text-left text-xs transition ${
                        !isApplicable
                          ? "border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/60 opacity-45 cursor-not-allowed"
                          : isSelected
                            ? "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 shadow-2xs"
                            : "border-amber-200/90 dark:border-amber-700/50 bg-card hover:border-primary hover:shadow-2xs"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <strong className="font-mono text-xs font-bold tracking-wider text-primary">
                            {promotion.code}
                          </strong>
                          {isSelected && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              {isEn ? "Applied" : "Đang áp dụng"}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 font-medium text-foreground line-clamp-1">
                          {promotion.name}
                        </p>
                        {promotion.discountText && (
                          <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                            {promotion.discountText}
                          </p>
                        )}
                        {!isApplicable && promotion.reason && (
                          <p className="mt-1 flex items-start gap-1 text-[10px] text-slate-600 italic leading-tight">
                            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                            <span>{promotion.reason}</span>
                          </p>
                        )}
                      </div>

                      {isApplicable ? (
                        <button
                          type="button"
                          onClick={() =>
                            onSelectPromotion(isSelected ? "" : promotion.code)
                          }
                          className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                            isSelected
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {isSelected ? (isEn ? "Remove" : "Bỏ chọn") : (isEn ? "Apply" : "Áp dụng")}
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-500">
                          {isEn ? "Not applicable" : "Không áp dụng"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground">
              {isEn ? "No saved vouchers?" : "Chưa lưu mã giảm giá?"}{" "}
              <Link
                to="/offers"
                className="font-semibold text-primary underline hover:text-gold"
              >
                {isEn ? "Browse & save offers" : "Xem & lưu voucher"}
              </Link>
            </div>
          )}
          {callout}
          {children}

          <div className="mt-5 border-t border-border pt-4">
            {showOuterBreakdown ? (
              <div className="space-y-2 text-sm">
                {totals?.subtotal !== undefined && (
                  <div className="flex justify-between gap-3">
                    <span>{totals.subtotalLabel || (isEn ? "Room Subtotal" : "Tạm tính các phòng")}</span>
                    <span className="tabular-nums font-semibold">{formatVnd(totals.subtotal)}</span>
                  </div>
                )}
                {commonFeeRows.map((fee) => (
                  <div
                    key={`${fee.label}-${fee.amount}`}
                    className="flex justify-between gap-4"
                  >
                    <span>
                      {fee.label}
                      {fee.detail && (
                        <small className="block text-xs text-muted-foreground">
                          {fee.detail}
                        </small>
                      )}
                    </span>
                    <span className="shrink-0 tabular-nums font-semibold">{formatVnd(fee.amount)}</span>
                  </div>
                ))}
                {vatAndSystemFee > 0 && (
                  <div className="flex justify-between gap-3">
                    <span>{isEn ? "VAT (8%)" : "Thuế VAT (8%)"}</span>
                    <span className="tabular-nums font-semibold">{formatVnd(vatAndSystemFee)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between gap-3 text-emerald-700">
                    <span>{isEn ? "Discount" : "Giảm giá"}</span>
                    <span className="tabular-nums font-semibold">-{formatVnd(discount)}</span>
                  </div>
                )}
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 text-lg font-bold text-primary">
              <span>{showOuterBreakdown ? (isEn ? "Total" : "Tổng cộng") : (isEn ? "Subtotal" : "Tạm tính")}</span>
              <span className="tabular-nums text-xl font-extrabold text-amber-700">{formatVnd(total)}</span>
            </div>
            {!showOuterBreakdown && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {isEn ? "Includes all selected rooms, surcharges, and services." : "Tổng hợp tất cả phòng, phụ thu và dịch vụ đã chọn."}
              </p>
            )}
          </div>
          {roomBreakdowns.some(
            (b) => !b.stay.checkIn || !b.stay.checkOut || !Number.isFinite(b.stay.nights) || b.stay.nights < 1,
          ) && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>
                {isEn
                  ? "Please select valid check-in and check-out dates (at least 1 night) on the calendar before proceeding."
                  : "Vui lòng chọn đầy đủ ngày nhận phòng và ngày trả phòng (ít nhất 1 đêm lưu trú) trên lịch trước khi qua bước tiếp theo."}
              </span>
            </div>
          )}
          <div className="mt-4 rounded-xl border border-border/80 bg-secondary/20 p-3.5 text-xs">
            <p className="font-bold text-primary">
              {isEn ? "Booking Cancellation & Refund Policy" : "Hoàn tiền do hủy booking"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {isEn
                ? "Room charge deduction depends on the cancellation request time relative to the first check-in time of the booking."
                : "Mức khấu trừ tiền phòng phụ thuộc vào thời điểm yêu cầu hủy so với giờ check-in đầu tiên của booking."}
            </p>
            <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground list-disc pl-4">
              <li>
                {isEn
                  ? "72 hours or more before check-in: no room penalty (100% refund)."
                  : "Từ 72 giờ trước check-in trở lên: không áp dụng phạt tiền phòng."}
              </li>
              <li>
                {isEn
                  ? "From 24 to under 72 hours: 50% penalty on allocated room amount."
                  : "Từ 24 đến dưới 72 giờ: mức phạt là 50% phần tiền phòng được phân bổ."}
              </li>
              <li>
                {isEn
                  ? "Under 24 hours or no-show: 100% penalty on allocated room amount."
                  : "Dưới 24 giờ hoặc khách không đến: mức phạt là 100% phần tiền phòng được phân bổ."}
              </li>
              <li>
                {isEn
                  ? "100% of paid service amounts are refunded; cancellation penalties apply only to room charges."
                  : "Toàn bộ phần tiền đã thanh toán được phân bổ cho dịch vụ được hoàn; mức phạt hủy chỉ khấu trừ vào phần tiền phòng."}
              </li>
            </ul>
          </div>
          {cta ? <div className="mt-5">{cta}</div> : null}
        </>
      ) : null}
    </aside>
  );
}
