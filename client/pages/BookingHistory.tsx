import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  XCircle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/data/hotels";
import {
  getBookings,
  getCancellationPolicy,
  isRoomSpecificFee,
  updateBooking,
  type Booking,
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

function downloadVoucher(booking: Booking) {
  const roomsText = roomLines(booking)
    .flatMap((selection) =>
      selection.stays?.length
        ? selection.stays.map(
            (stay) =>
              `${selection.roomNameVi} · ${stay.roomCode}: ${dateTime(stay.checkIn, booking.arrivalTime || "14:00")} - ${dateTime(stay.checkOut, booking.departureTime || "12:00")}${stay.services?.length ? `\n  Dịch vụ: ${stay.services.map((service) => `${service.name} × ${service.quantity}`).join(", ")}` : ""}`,
          )
        : [
            `${selection.roomNameVi} × ${selection.quantity}: ${dateTime(selection.checkIn || booking.checkIn, booking.arrivalTime || "14:00")} - ${dateTime(selection.checkOut || booking.checkOut, booking.departureTime || "12:00")}`,
          ],
    )
    .join("\n");
  const feesText = (booking.feeLines || [])
    .filter((fee) => !isRoomSpecificFee(fee))
    .map((fee) => `${fee.label}: ${formatVnd(fee.amount)}`)
    .join("\n");
  const content = [
    "Sen Việt Hotels & Resorts",
    `Booking: ${booking.id}`,
    `Khách sạn: ${booking.hotelName}`,
    "Phòng cụ thể:",
    roomsText,
    `Khách đại diện: ${booking.guestName}`,
    `Thanh toán: ${paymentLabels[booking.paymentMethod]}`,
    feesText ? `Các khoản phí:\n${feesText}` : "",
    `Tổng tiền: ${formatVnd(booking.total)}`,
    `Trạng thái: ${labels[booking.status]}`,
  ]
    .filter(Boolean)
    .join("\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${booking.id}-voucher.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
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

  const cancel = (booking: Booking) => {
    if (
      !window.confirm(
        "Bạn có chắc muốn hủy đặt phòng này? Chính sách hoàn tiền phụ thuộc thời điểm hủy.",
      )
    )
      return;
    const policy = getCancellationPolicy(booking.checkIn);
    const cancellation = {
      policy: policy.policy,
      refundPercent: policy.refundPercent,
      refundAmount: Math.round(
        (booking.roomTotal * policy.refundPercent) / 100,
      ),
      cancelledAt: new Date().toISOString(),
    };
    updateBooking(booking.id, { status: "cancelled", cancellation });
    setBookings((current) =>
      current.map((item) =>
        item.id === booking.id
          ? { ...item, status: "cancelled", cancellation }
          : item,
      ),
    );
    window.alert(
      `${policy.policy} Số tiền hoàn dự kiến cho tiền thuê phòng: ${formatVnd(cancellation.refundAmount)}.`,
    );
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
                Hủy dưới 3 ngày hoặc không đến.
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
        <div className="mt-8 space-y-5">
          {bookings.length ? (
            bookings.map((booking) => (
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
                      <span>VAT & phí hệ thống</span>
                      <strong>
                        {formatVnd(booking.vat + booking.serviceFee)}
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
                      onClick={() => downloadVoucher(booking)}
                      className="rounded-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Voucher
                    </Button>
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
                          onClick={() => cancel(booking)}
                          className="rounded-full text-red-600"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Hủy đặt phòng
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
                Bạn chưa có đặt phòng nào.
              </p>
              <Button asChild className="mt-5 rounded-full">
                <Link to="/hotels">Đặt phòng ngay</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
