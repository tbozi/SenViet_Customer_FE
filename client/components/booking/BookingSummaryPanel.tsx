import type { ReactNode } from "react";
import { AlertCircle, BookmarkCheck, CalendarDays, Check, Tag, Users, X } from "lucide-react";
import { Link } from "react-router-dom";
import { formatVnd } from "@/data/hotels";
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

function dateTimeLabel(date: string, time: string) {
  if (!date) return "Chưa chọn";
  return `${time}, ${new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN")}`;
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
  const roomBreakdowns = selections.flatMap((selection, selectionIndex) =>
    selectionStays(selection).map((stay, stayIndex) => {
      const nightlyPrice = stay.nightlyPrice || selection.nightlyPrice;
      const roomPrice = nightlyPrice * Math.max(0, stay.nights);
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
      className={`h-fit rounded-2xl border border-primary/20 bg-white p-5 shadow-lg sm:p-6 lg:sticky lg:top-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold">
            Tóm tắt lựa chọn
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold text-primary">
            Chi tiết đặt phòng
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{hotelName}</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
          {roomCount} phòng
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
                  <span className="text-sm font-bold text-primary">
                    {formatVnd(breakdown.subtotal)}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    Nhận: {dateTimeLabel(stay.checkIn, arrivalTime)}
                  </p>
                  <p className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    Trả: {dateTimeLabel(stay.checkOut, departureTime)}
                  </p>
                  <p className="flex items-start gap-2">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    {stay.guest.adults} người lớn · {stay.guest.children} trẻ em
                    · {stay.guest.infants} em bé · {stay.nights} đêm
                  </p>
                  {stay.checkIn ? (() => {
                    const notice = getCancellationNotice(stay.checkIn);
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
                    <span>Tiền phòng</span>
                    <span>{formatVnd(breakdown.roomPrice)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Phụ thu khách thêm</span>
                    <span>{formatVnd(breakdown.extraGuestSurcharge)}</span>
                  </div>
                  <div className="border-t border-primary/10 pt-2">
                    <p className="mb-1 font-semibold text-primary">Dịch vụ</p>
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
                            <span>{formatVnd(service.total)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Chưa chọn dịch vụ</p>
                    )}
                  </div>
                  <div className="flex justify-between gap-3 border-t border-primary/10 pt-2 font-bold text-primary">
                    <span>Tạm tính phòng</span>
                    <span>{formatVnd(breakdown.subtotal)}</span>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        emptyState || (
          <p className="mt-4 text-sm text-muted-foreground">
            Chưa có phòng được chọn.
          </p>
        )
      )}

      {roomCount ? (
        <>
          {promo}
          {savedPromotions.length > 0 && onSelectPromotion ? (
            <div className="mt-4 rounded-xl border border-amber-300/80 bg-amber-50/60 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900">
                  <BookmarkCheck className="h-4 w-4 text-amber-700" />
                  <p className="text-xs font-bold uppercase tracking-wider">
                    Ưu đãi đã lưu ({savedPromotions.length})
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground">Chọn để áp dụng</span>
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
                          ? "border-slate-200 bg-slate-100/80 opacity-45 cursor-not-allowed"
                          : isSelected
                            ? "border-emerald-500 bg-emerald-50/90 shadow-2xs"
                            : "border-amber-200/90 bg-white hover:border-primary hover:shadow-2xs"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <strong className="font-mono text-xs font-bold tracking-wider text-primary">
                            {promotion.code}
                          </strong>
                          {isSelected && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              Đang áp dụng
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 font-medium text-slate-800 line-clamp-1">
                          {promotion.name}
                        </p>
                        {promotion.discountText && (
                          <p className="text-[10px] font-semibold text-amber-800">
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
                          {isSelected ? "Bỏ chọn" : "Áp dụng"}
                        </button>
                      ) : (
                        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-200/80 px-2.5 py-1 text-xs font-medium text-slate-500">
                          Không áp dụng
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground">
              Chưa lưu mã giảm giá?{" "}
              <Link
                to="/offers"
                className="font-semibold text-primary underline hover:text-gold"
              >
                Xem & lưu voucher
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
                    <span>{totals.subtotalLabel || "Tạm tính các phòng"}</span>
                    <span>{formatVnd(totals.subtotal)}</span>
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
                    <span className="shrink-0">{formatVnd(fee.amount)}</span>
                  </div>
                ))}
                {vatAndSystemFee > 0 && (
                  <div className="flex justify-between gap-3">
                    <span>Thuế VAT (8%)</span>
                    <span>{formatVnd(vatAndSystemFee)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between gap-3 text-emerald-700">
                    <span>Giảm giá</span>
                    <span>-{formatVnd(discount)}</span>
                  </div>
                )}
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 text-lg font-bold text-primary">
              <span>{showOuterBreakdown ? "Tổng cộng" : "Tạm tính"}</span>
              <span>{formatVnd(total)}</span>
            </div>
            {!showOuterBreakdown && (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Tổng hợp tất cả phòng, phụ thu và dịch vụ đã chọn.
              </p>
            )}
          </div>
          {cta ? <div className="mt-5">{cta}</div> : null}
        </>
      ) : null}
    </aside>
  );
}
