import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Clock3,
  FileText,
  Hotel as HotelIcon,
  Printer,
  Receipt,
  Sparkles,
  Star,
  Tag,
  XCircle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatVnd } from "@/data/hotels";
import {
  getBookings,
  getCancellationPolicy,
  isRoomSpecificFee,
  updateBooking,
  type Booking,
  type BookingStatus,
  type RoomSelection,
} from "@/lib/bookings";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

const labels: Record<Booking["status"], string> = {
  pending_payment: "Chờ thanh toán",
  confirmed: "Đã xác nhận · Sắp đi",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};
const paymentLabels: Record<Booking["paymentMethod"], string> = {
  cash: "Tiền mặt",
  qr: "Bank QR",
  momo: "MoMo",
  vnpay: "VNPay",
};

function roomLines(booking: Booking): RoomSelection[] {
  return booking.roomSelections?.length
    ? booking.roomSelections
    : [
        {
          roomId: "legacy",
          roomName: booking.roomName,
          roomNameVi: booking.roomName,
          quantity: booking.rooms,
          nightlyPrice: booking.roomPrice,
          guestForms: [],
          includedCapacity: { adults: 1, children: 1, infants: 1 },
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: booking.nights,
          roomCodes: [`${booking.rooms} phòng`],
          extraAdults: 0,
          extraChildren: 0,
          extraGuestCount: 0,
          extraGuestCharge: 0,
        },
      ];
}

function dateTime(date: string, time: string) {
  return `${time}, ${new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN")}`;
}

export default function BookingHistory() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setBookings(getBookings().filter((item) => item.userEmail === user?.email));
  }, [user?.email]);

  useEffect(() => {
    const createdId = params.get("created");
    const created = createdId
      ? getBookings().find((item) => item.id === createdId)
      : undefined;
    if (!created || created.status !== "pending_payment") {
      setSecondsLeft(0);
      return;
    }
    const tick = () =>
      setSecondsLeft(
        Math.max(
          0,
          Math.floor(
            (new Date(created.holdUntil).getTime() - Date.now()) / 1000,
          ),
        ),
      );
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [bookings, params]);

  const completePayment = (booking: Booking) => {
    if (new Date(booking.holdUntil).getTime() <= Date.now())
      return window.alert(
        "Thời gian giữ phòng đã hết. Vui lòng tạo lại đơn đặt phòng.",
      );
    updateBooking(booking.id, { status: "confirmed" });
    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id ? { ...item, status: "confirmed" } : item,
      ),
    );
    setSuccess(
      `Thanh toán thành công cho đơn ${booking.id}. Đặt phòng đã được xác nhận.`,
    );
  };

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelResult, setCancelResult] = useState<{
    bookingId: string;
    hotelName: string;
    refundAmount: number;
    refundPercent: number;
    policy: string;
  } | null>(null);
  const [invoiceTarget, setInvoiceTarget] = useState<Booking | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");

  const counts = useMemo(
    () => ({
      all: bookings.length,
      pending_payment: bookings.filter((b) => b.status === "pending_payment").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    if (statusFilter === "all") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const filterTabs: Array<{ id: "all" | BookingStatus; label: string; count: number }> = [
    { id: "all", label: "Tất cả", count: counts.all },
    { id: "pending_payment", label: "Chờ thanh toán", count: counts.pending_payment },
    { id: "confirmed", label: "Đã xác nhận", count: counts.confirmed },
    { id: "completed", label: "Đã hoàn thành", count: counts.completed },
    { id: "cancelled", label: "Đã hủy", count: counts.cancelled },
  ];

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const policy = getCancellationPolicy(cancelTarget.checkIn);
    const refundAmount = Math.round(
      (cancelTarget.roomTotal * policy.refundPercent) / 100,
    );
    const cancellation = {
      policy: policy.policy,
      refundPercent: policy.refundPercent,
      refundAmount,
      cancelledAt: new Date().toISOString(),
    };
    updateBooking(cancelTarget.id, { status: "cancelled", cancellation });
    setBookings((current) =>
      current.map((item) =>
        item.id === cancelTarget.id
          ? { ...item, status: "cancelled", cancellation }
          : item,
      ),
    );

    const resultInfo = {
      bookingId: cancelTarget.id,
      hotelName: cancelTarget.hotelName,
      refundAmount,
      refundPercent: policy.refundPercent,
      policy: policy.policy,
    };
    setCancelTarget(null);
    setCancelResult(resultInfo);
  };

  const createdBooking = bookings.find(
    (booking) => booking.id === params.get("created"),
  );
  if (!user)
    return (
      <main className="container flex min-h-[55vh] items-center justify-center py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary">
            Vui lòng đăng nhập
          </h1>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/login">Đăng nhập</Link>
          </Button>
        </div>
      </main>
    );
  return (
    <main className="container py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
          Sen Việt member
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary">
          {language === "vi" ? "Lịch sử đặt phòng" : "Booking history"}
        </h1>
        <section className="mt-5 overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-sm">
          <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-100/70 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-amber-950">
                Chính sách hủy phòng — cần lưu ý
              </h2>
              <p className="mt-1 text-sm text-amber-900/80">
                Mức hoàn tiền được tính theo thời điểm bạn gửi yêu cầu hủy so
                với ngày nhận phòng.
              </p>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-2xl font-extrabold text-emerald-700">100%</p>
              <p className="mt-1 text-sm font-bold text-emerald-900">
                Hoàn tiền đầy đủ
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800/80">
                Hủy trước từ 7 ngày trở lên.
              </p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-2xl font-extrabold text-amber-700">50%</p>
              <p className="mt-1 text-sm font-bold text-amber-900">
                Hoàn một phần
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800/80">
                Hủy từ 3 đến dưới 7 ngày.
              </p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-2xl font-extrabold text-red-700">0%</p>
              <p className="mt-1 text-sm font-bold text-red-900">
                Không hoàn tiền
              </p>
              <p className="mt-1 text-xs leading-relaxed text-red-800/80">
                Hủy dưới 3 ngày hoặc không đến nhận phòng.
              </p>
            </div>
          </div>
        </section>
        {success && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            {success}
          </div>
        )}
        {createdBooking?.status === "pending_payment" && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Clock3 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Đặt phòng đang chờ thanh toán</p>
              <p className="mt-1">
                {secondsLeft > 0
                  ? `Phòng được giữ trong ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}.`
                  : "Thời gian giữ phòng đã hết."}
              </p>
            </div>
          </div>
        )}
        {/* BỘ LỌC TRẠNG THÁI */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-border/70 pb-4">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-primary"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-background text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 space-y-5">
          {filteredBookings.length ? (
            filteredBookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-gold">
                      {booking.id}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-primary">
                      {booking.hotelName}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {booking.guestName} · {booking.phone}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === "cancelled" ? "bg-red-50 text-red-700" : booking.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                  >
                    {labels[booking.status]}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {roomLines(booking).flatMap((selection) =>
                    selection.stays?.length ? (
                      selection.stays.map((stay) => {
                        const roomPrice =
                          (stay.nightlyPrice || selection.nightlyPrice) * Math.max(0, stay.nights);
                        const extraGuestSurcharge =
                          Number(stay.extraGuestCharge || 0) *
                          Math.max(0, stay.nights);
                        return (
                          <div
                            key={stay.roomCode}
                            className="rounded-xl bg-secondary/50 p-3 text-sm"
                          >
                            <p className="font-semibold text-primary">
                              {selection.roomNameVi} · {stay.roomCode}
                            </p>
                            {(stay.offerName || selection.offerName) && (
                              <p className="mt-1 text-xs font-medium text-primary">
                                {stay.offerName || selection.offerName}
                                  </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Nhận phòng:{" "}
                              {dateTime(
                                stay.checkIn,
                                booking.arrivalTime || "14:00",
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Trả phòng:{" "}
                              {dateTime(
                                stay.checkOut,
                                booking.departureTime || "12:00",
                              )}
                            </p>
                            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                              <p className="font-semibold text-primary">
                                Tiền phòng: {formatVnd(roomPrice)}
                              </p>
                              {extraGuestSurcharge > 0 && (
                                <p>
                                  Khách thêm: {formatVnd(extraGuestSurcharge)}
                                </p>
                              )}
                            </div>
                            {stay.services?.length ? (
                              <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                                <p className="font-semibold text-primary">
                                  Dịch vụ
                                </p>
                                {stay.services.map((service) => (
                                  <p key={service.id}>
                                    {service.name} × {service.quantity} ·{" "}
                                    {formatVnd(service.total)}
                                  </p>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    ) : (
                      <div
                        key={selection.roomId}
                        className="rounded-xl bg-secondary/50 p-3 text-sm"
                      >
                        <p className="font-semibold text-primary">
                          {selection.roomNameVi} × {selection.quantity}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Nhận phòng:{" "}
                          {dateTime(
                            selection.checkIn || booking.checkIn,
                            booking.arrivalTime || "14:00",
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Trả phòng:{" "}
                          {dateTime(
                            selection.checkOut || booking.checkOut,
                            booking.departureTime || "12:00",
                          )}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-primary">
                          Tiền phòng: {formatVnd(booking.roomTotal)}
                        </p>
                          {booking.extraGuestCharge &&
                        booking.extraGuestCharge > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Phụ thu khách thêm:{" "}
                            {formatVnd(booking.extraGuestCharge)}
                          </p>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-5 rounded-xl border border-border bg-slate-50 p-4 text-sm">
                  <p className="font-semibold text-primary">
                    Chi tiết thanh toán
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between gap-3">
                      <span>Tạm tính các phòng</span>
                      <strong>
                        {formatVnd(
                          booking.total -
                            booking.vat -
                            booking.serviceFee +
                            booking.discount,
                        )}
                      </strong>
                    </div>
                    {booking.feeLines
                      ?.filter((fee) => !isRoomSpecificFee(fee))
                      .map((fee) => (
                        <div
                          key={`${fee.label}-${fee.amount}`}
                          className="flex items-start justify-between gap-3 border-t border-border/70 pt-2"
                        >
                          <span>
                            {fee.label}
                            {fee.detail && (
                              <small className="mt-0.5 block text-xs text-muted-foreground">
                                {fee.detail}
                              </small>
                            )}
                          </span>
                          <strong className="shrink-0">
                            {formatVnd(fee.amount)}
                          </strong>
                        </div>
                      ))}
                    <div className="flex justify-between gap-3 border-t border-border/70 pt-2">
                      <span>Thuế VAT (8%)</span>
                      <strong>
                        {formatVnd(booking.vat)}
                      </strong>
                    </div>
                    {booking.discount > 0 && (
                      <div className="flex justify-between gap-3 text-emerald-700">
                        <span>Giảm giá</span>
                        <strong>-{formatVnd(booking.discount)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between gap-3 border-t-2 border-primary/20 pt-3 text-base font-bold text-primary">
                      <span>Tổng thanh toán</span>
                      <span>{formatVnd(booking.total)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="text-lg font-bold text-primary">
                    Tổng: {formatVnd(booking.total)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInvoiceTarget(booking)}
                      className="rounded-full border-primary/40 text-primary hover:bg-primary/10 shadow-sm font-semibold"
                    >
                      <Receipt className="mr-1.5 h-4 w-4 text-primary" />
                      Xem chi tiết hóa đơn
                    </Button>
                    {booking.status !== "pending_payment" && (
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link to={`/invoices/${booking.id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          In hóa đơn
                        </Link>
                      </Button>
                    )}
                    {booking.status === "completed" && (
                      <Button
                        asChild
                        className="rounded-full bg-gold text-primary font-bold shadow-md hover:bg-gold/90 transition"
                      >
                        <Link to={`/reviews/${booking.id}`}>
                          <Star className="mr-1.5 h-4 w-4 fill-primary text-primary" />
                          Đánh giá kỳ nghỉ
                        </Link>
                      </Button>
                    )}
                    {booking.status === "pending_payment" && (
                      <Button
                        type="button"
                        onClick={() => completePayment(booking)}
                        className="rounded-full"
                      >
                        Thanh toán
                      </Button>
                    )}
                    {booking.status !== "cancelled" &&
                      booking.status !== "completed" && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setCancelTarget(booking)}
                          className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Hủy phòng
                        </Button>
                      )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">
                {statusFilter === "all"
                  ? "Bạn chưa có đặt phòng nào."
                  : `Không có đặt phòng nào ở trạng thái "${filterTabs.find((t) => t.id === statusFilter)?.label}".`}
              </p>
              {statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  onClick={() => setStatusFilter("all")}
                  className="mt-5 rounded-full"
                >
                  Xem tất cả đặt phòng
                </Button>
              ) : (
                <Button asChild className="mt-5 rounded-full">
                  <Link to="/hotels">Đặt phòng ngay</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: XÁC NHẬN HỦY ĐẶT PHÒNG */}
      <Dialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        {cancelTarget && (() => {
          const policy = getCancellationPolicy(cancelTarget.checkIn);
          const refundAmt = Math.round(
            (cancelTarget.roomTotal * policy.refundPercent) / 100,
          );

          return (
            <DialogContent className="max-w-md rounded-2xl p-6 sm:p-7">
              <DialogHeader>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    policy.refundPercent === 0
                      ? "bg-rose-100 text-rose-600"
                      : policy.refundPercent === 50
                        ? "bg-amber-100 text-amber-600"
                        : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <DialogTitle className="mt-2 text-xl font-bold text-slate-900">
                  Xác nhận hủy đặt phòng
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Mã đơn: <strong className="font-mono text-primary">{cancelTarget.id}</strong> · {cancelTarget.hotelName}
                </DialogDescription>
              </DialogHeader>

              <div className="my-2 space-y-3">
                <div
                  className={`rounded-xl border p-4 text-xs ${
                    policy.refundPercent === 0
                      ? "border-rose-200 bg-rose-50/80 text-rose-950"
                      : policy.refundPercent === 50
                        ? "border-amber-200 bg-amber-50/80 text-amber-950"
                        : "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">
                      {policy.refundPercent === 0
                        ? "Hủy sát ngày (dưới 3 ngày)"
                        : policy.refundPercent === 50
                          ? "Hủy từ 3 đến dưới 7 ngày"
                          : "Miễn phí hủy phòng (trước 7 ngày)"}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        policy.refundPercent === 0
                          ? "bg-rose-200 text-rose-800"
                          : policy.refundPercent === 50
                            ? "bg-amber-200 text-amber-900"
                            : "bg-emerald-200 text-emerald-800"
                      }`}
                    >
                      Hoàn {policy.refundPercent}%
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between border-t border-black/10 pt-2 text-muted-foreground">
                    <span>Tổng tiền phòng:</span>
                    <span className="font-semibold text-slate-900">
                      {formatVnd(cancelTarget.roomTotal)}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm font-bold">
                    <span>Số tiền hoàn lại:</span>
                    <span
                      className={
                        policy.refundPercent === 0
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }
                    >
                      {formatVnd(refundAmt)}
                    </span>
                  </div>

                  {policy.refundPercent === 0 ? (
                    <p className="mt-2.5 rounded-lg bg-white/70 p-2.5 text-[11px] leading-relaxed text-rose-700">
                      ⚠️ <strong>Lưu ý quan trọng:</strong> Theo chính sách của Sen Việt Hotels, hủy phòng dưới 3 ngày trước nhận phòng ({cancelTarget.checkIn}) sẽ <strong>không được hoàn tiền</strong>. Sau khi xác nhận, phòng sẽ được giải phóng trên hệ thống.
                    </p>
                  ) : (
                    <p className="mt-2.5 text-[11px] leading-relaxed text-slate-600">
                      Tiền hoàn dự kiến {formatVnd(refundAmt)} sẽ được chuyển về tài khoản thanh toán của bạn trong 3-5 ngày làm việc.
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelTarget(null)}
                  className="rounded-full"
                >
                  Giữ lại phòng
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={confirmCancel}
                  className="rounded-full"
                >
                  Xác nhận hủy phòng
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>

      {/* MODAL 2: THÔNG BÁO HỦY THÀNH CÔNG */}
      <Dialog
        open={Boolean(cancelResult)}
        onOpenChange={(open) => !open && setCancelResult(null)}
      >
        {cancelResult && (
          <DialogContent className="max-w-md rounded-2xl p-6 text-center sm:p-7">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="mt-4 text-center text-xl font-bold text-slate-900">
              Đã hủy đặt phòng thành công!
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Mã booking: <strong className="font-mono text-primary">{cancelResult.bookingId}</strong> · {cancelResult.hotelName}
            </DialogDescription>

            <div className="my-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Số tiền hoàn lại:</span>
                <strong
                  className={
                    cancelResult.refundPercent === 0
                      ? "text-slate-800 font-bold"
                      : "text-emerald-700 font-bold text-base"
                  }
                >
                  {formatVnd(cancelResult.refundAmount)}
                </strong>
              </div>
              {cancelResult.refundPercent === 0 ? (
                <p className="text-[11px] leading-relaxed text-rose-700">
                  Theo chính sách hủy sát ngày (dưới 3 ngày trước nhận phòng), số tiền hoàn lại là: <strong>0₫</strong>. Phòng đã được giải phóng trên hệ thống.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Số tiền hoàn {formatVnd(cancelResult.refundAmount)} sẽ được hoàn về phương thức thanh toán của bạn trong <strong>3 - 5 ngày làm việc</strong>.
                </p>
              )}
            </div>

            <DialogFooter className="sm:justify-center">
              <Button
                type="button"
                onClick={() => setCancelResult(null)}
                className="w-full sm:w-auto rounded-full px-8"
              >
                Đã hiểu
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* MODAL 3: XEM CHI TIẾT HÓA ĐƠN ĐẶT PHÒNG */}
      <Dialog
        open={Boolean(invoiceTarget)}
        onOpenChange={(open) => !open && setInvoiceTarget(null)}
      >
        {invoiceTarget && (() => {
          const booking = invoiceTarget;
          const pending = booking.status === "pending_payment";
          const isCancelled = booking.status === "cancelled";
          const selections = booking.roomSelections || [];
          const generalFees = (booking.feeLines || []).filter(
            (fee) => !isRoomSpecificFee(fee),
          );

          return (
            <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-7">
              <DialogHeader className="border-b border-border pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-primary">
                        Chi tiết hóa đơn đặt phòng
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                        Mã đặt phòng: <strong className="font-mono text-primary font-bold">#{booking.id}</strong> · Ngày tạo: {new Date(booking.createdAt).toLocaleDateString("vi-VN")}
                      </DialogDescription>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3.5 py-1 text-xs font-bold ${
                      isCancelled
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : pending
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {isCancelled
                      ? "Đã hủy"
                      : pending
                        ? "Chờ thanh toán"
                        : "Đã thanh toán · Xác nhận"}
                  </span>
                </div>

                {/* Thông tin khách sạn & khách nhận phòng */}
                <div className="mt-4 grid gap-3 rounded-xl bg-secondary/50 p-4 text-xs sm:grid-cols-2 border border-border/60 text-left">
                  <div>
                    <p className="font-bold text-primary flex items-center gap-1.5 text-sm">
                      <HotelIcon className="h-4 w-4 text-gold" />
                      {booking.hotelName}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Người nhận phòng: <strong className="text-slate-800">{booking.guestName}</strong>
                    </p>
                    <p className="text-muted-foreground">
                      Liên hệ: <strong className="text-slate-800">{booking.phone}</strong> · {booking.email}
                    </p>
                  </div>
                  <div className="space-y-1 sm:text-right">
                    <p className="text-muted-foreground">
                      Nhận phòng: <strong className="text-primary">{dateTime(booking.checkIn, booking.arrivalTime || "14:00")}</strong>
                    </p>
                    <p className="text-muted-foreground">
                      Trả phòng: <strong className="text-primary">{dateTime(booking.checkOut, booking.departureTime || "12:00")}</strong>
                    </p>
                    <p className="text-muted-foreground">
                      Thời lượng lưu trú: <strong className="text-slate-800">{booking.nights} đêm</strong> ({booking.rooms} phòng)
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* PHẦN 1: CHI TIẾT THEO PHÒNG (Room breakdown cards chuẩn theo mockup) */}
              <div className="my-3 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-gold" />
                    Chi tiết theo phòng
                  </h3>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary font-semibold hover:bg-primary/10 h-7"
                  >
                    <Link to={`/invoices/${booking.id}`}>
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      Mở trang hóa đơn
                    </Link>
                  </Button>
                </div>

                <div className="space-y-3">
                  {selections.flatMap((selection) =>
                    selection.stays?.length ? (
                      selection.stays.map((stay, idx) => {
                        const nightly = stay.nightlyPrice || selection.nightlyPrice;
                        const roomPrice = nightly * Math.max(1, stay.nights);
                        const extraGuestCharge =
                          Number(stay.extraGuestCharge || 0) * Math.max(1, stay.nights);
                        const servicesTotal = (stay.services || []).reduce(
                          (sum, s) => sum + (s.total || 0),
                          0,
                        );
                        const staySubTotal = roomPrice + extraGuestCharge + servicesTotal;

                        return (
                          <div
                            key={`${selection.roomId}-${stay.roomCode}-${idx}`}
                            className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5 shadow-sm"
                          >
                            {/* Room Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-white font-mono">
                                    {stay.roomCode}
                                  </span>
                                  <span className="text-sm font-bold text-slate-900">
                                    {selection.roomNameVi}
                                  </span>
                                  {(stay.offerName || selection.offerName) && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                                      <Sparkles className="h-2.5 w-2.5 text-gold" />
                                      {stay.offerName || selection.offerName}
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  Nhận <strong className="text-slate-800">{dateTime(stay.checkIn, booking.arrivalTime || "14:00")}</strong> — Trả <strong className="text-slate-800">{dateTime(stay.checkOut, booking.departureTime || "12:00")}</strong> · {stay.nights} đêm · {stay.guest?.adults || 1} người lớn{(stay.guest?.children || 0) > 0 ? `, ${stay.guest.children} trẻ em` : ""}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Cộng phòng này
                                </span>
                                <span className="text-base font-bold text-primary">
                                  {formatVnd(staySubTotal)}
                                </span>
                              </div>
                            </div>

                            {/* Line items */}
                            <div className="border-t border-slate-200 pt-2 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-800">Tiền phòng</span>
                                <span className="text-muted-foreground">
                                  {stay.nights} đêm × {formatVnd(nightly).replace(" đ", "").replace(" ₫", "")}
                                </span>
                                <span className="font-semibold text-slate-900">
                                  {formatVnd(roomPrice)}
                                </span>
                              </div>

                              {extraGuestCharge > 0 && (
                                <div className="flex items-center justify-between text-amber-800">
                                  <span>Phụ thu thêm người</span>
                                  <span className="text-muted-foreground">—</span>
                                  <span className="font-semibold">+{formatVnd(extraGuestCharge)}</span>
                                </div>
                              )}

                              {stay.services && stay.services.length > 0 && (
                                stay.services.map((srv) => (
                                  <div key={srv.id} className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-slate-700">
                                      <span className="rounded bg-slate-200 px-1 py-0.2 text-[10px] font-mono text-slate-600">
                                        DV
                                      </span>
                                      {srv.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {srv.quantity} × {formatVnd(srv.unitPrice || srv.total / (srv.quantity || 1)).replace(" đ", "").replace(" ₫", "")}
                                    </span>
                                    <span className="font-semibold text-slate-900">
                                      {formatVnd(srv.total)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        key={selection.roomId}
                        className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-sm text-slate-900">{selection.roomNameVi} ({selection.quantity} phòng)</p>
                          <p className="font-bold text-base text-primary">{formatVnd(booking.roomTotal)}</p>
                        </div>
                        <p className="text-slate-500">
                          {booking.checkIn} – {booking.checkOut} ({booking.nights} đêm)
                        </p>
                      </div>
                    ),
                  )}
                </div>

                {/* Dịch vụ chung của đơn nếu có */}
                {booking.services && booking.services.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="font-bold text-xs uppercase tracking-wider text-primary mb-2">
                      Dịch vụ chung đặt kèm
                    </p>
                    <div className="space-y-1.5 text-xs">
                      {booking.services.map((srv) => (
                        <div key={srv.id} className="flex justify-between items-center text-slate-700">
                          <span>{srv.name} (SL: {srv.quantity})</span>
                          <strong className="text-slate-900">{formatVnd(srv.total)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phụ phí khác nếu có */}
                {generalFees.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-3 space-y-1 text-xs">
                    <p className="font-bold text-primary text-[11px]">Phụ phí khác:</p>
                    {generalFees.map((fee) => (
                      <div key={fee.label} className="flex justify-between text-slate-700">
                        <span>{fee.label} {fee.detail && `(${fee.detail})`}</span>
                        <strong>{formatVnd(fee.amount)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* PHẦN 2: CHƯƠNG TRÌNH KHUYẾN MÃI & ƯU ĐÃI ĐÃ ÁP DỤNG */}
                {booking.discount > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold">Ưu đãi / Khuyến mãi đã áp dụng</p>
                        <p className="text-[11px] text-emerald-700">Mã giảm giá đặt phòng hoặc chiết khấu thành viên</p>
                      </div>
                    </div>
                    <strong className="text-sm font-extrabold text-emerald-700">
                      -{formatVnd(booking.discount)}
                    </strong>
                  </div>
                )}

                {/* PHẦN 3: BẢNG TỔNG KẾT TÀI CHÍNH */}
                <div className="rounded-2xl border-2 border-primary/20 bg-slate-50 p-5 text-xs space-y-2">
                  <p className="font-bold uppercase tracking-wider text-primary text-xs pb-1.5 border-b border-border">
                    Bảng kê quyết toán hóa đơn
                  </p>

                  <div className="flex justify-between text-slate-600">
                    <span>Tổng tiền phòng:</span>
                    <strong className="text-slate-900">{formatVnd(booking.roomTotal)}</strong>
                  </div>

                  {booking.services && booking.services.length > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tổng tiền dịch vụ:</span>
                      <strong className="text-slate-900">
                        {formatVnd(booking.services.reduce((s, item) => s + (item.total || 0), 0))}
                      </strong>
                    </div>
                  )}

                  {booking.extraGuestCharge && booking.extraGuestCharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tổng phụ thu khách thêm:</span>
                      <strong className="text-slate-900">{formatVnd(booking.extraGuestCharge)}</strong>
                    </div>
                  )}

                  {booking.discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Giảm giá khuyến mãi:</span>
                      <strong>-{formatVnd(booking.discount)}</strong>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>Thuế giá trị gia tăng (VAT 8%):</span>
                    <strong className="text-slate-900">{formatVnd(booking.vat)}</strong>
                  </div>

                  {booking.serviceFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Phí dịch vụ khách sạn:</span>
                      <strong className="text-slate-900">{formatVnd(booking.serviceFee)}</strong>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t-2 border-primary/30 pt-3 text-base font-extrabold text-primary">
                    <span>TỔNG CỘNG THANH TOÁN:</span>
                    <span className="text-xl text-primary font-display font-bold">
                      {formatVnd(booking.total)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap justify-between items-center border-t border-border pt-2.5 text-muted-foreground text-[11px]">
                    <span>Phương thức thanh toán: <strong className="text-slate-800">{paymentLabels[booking.paymentMethod] || "Chuyển khoản"}</strong></span>
                    <span>Trạng thái: <strong className={pending ? "text-amber-700" : "text-emerald-700"}>{labels[booking.status]}</strong></span>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between items-center border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInvoiceTarget(null)}
                  className="rounded-full w-full sm:w-auto px-6"
                >
                  Đóng
                </Button>

                <Button
                  asChild
                  className="rounded-full w-full sm:w-auto px-6 bg-primary"
                >
                  <Link to={`/invoices/${booking.id}`}>
                    <Printer className="mr-2 h-4 w-4" />
                    Xem & in hóa đơn chi tiết
                  </Link>
                </Button>
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>
    </main>
  );
}
