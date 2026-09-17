import type { ReactNode } from "react";
import { CalendarDays, Users } from "lucide-react";
import { formatVnd } from "@/data/hotels";
import {
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

interface BookingSummaryPanelProps {
  hotelName: string;
  selections: RoomSelection[];
  arrivalTime: string;
  departureTime: string;
  totals?: BookingSummaryTotals;
  fallbackServices?: BookingService[];
  promo?: ReactNode;
  savedPromotions?: Array<{ code: string; name: string }>;
  onSelectPromotion?: (code: string) => void;
  callout?: ReactNode;
  children?: ReactNode;
  emptyState?: ReactNode;
  cta?: ReactNode;
  className?: string;
}

type RoomBreakdown = {
  selection: RoomSelection;
  stay: RoomStay;
  roomPrice: number;
  extraGuestSurcharge: number;
  services: BookingService[];
  subtotal: number;
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
  onSelectPromotion,
  callout,
  children,
  emptyState,
  cta,
  className = "",
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
            const { selection, stay } = breakdown;
            return (
              <section
                key={`${selection.roomId}-${stay.roomCode}`}
                className="rounded-xl border border-primary/10 bg-secondary/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
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
            <div className="mt-4 rounded-xl border border-gold/30 bg-amber-50/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-gold-foreground">
                Ưu đãi đã lưu
              </p>
              <div className="mt-2 space-y-2">
                {savedPromotions.map((promotion) => (
                  <button
                    key={promotion.code}
                    type="button"
                    onClick={() => onSelectPromotion(promotion.code)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white px-3 py-2 text-left text-xs transition hover:border-primary"
                  >
                    <span>
                      <strong className="block text-primary">{promotion.code}</strong>
                      <span className="text-muted-foreground">{promotion.name}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-primary">Áp dụng</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
                    <span>VAT & phí hệ thống</span>
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
