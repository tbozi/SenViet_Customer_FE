import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Hotel as HotelIcon,
  Loader2,
  QrCode,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/data/hotels";
import {
  getBookings,
  isRoomSpecificFee,
  updateBooking,
  type Booking,
} from "@/lib/bookings";
import { toast } from "sonner";

function dateTime(date: string, time: string) {
  return `${time}, ${new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN")}`;
}

export default function BookingSuccess() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const targetId = bookingId || searchParams.get("id") || searchParams.get("bookingId");

  const [bookingsList, setBookingsList] = useState<Booking[]>(() => getBookings());
  const foundBooking = targetId
    ? bookingsList.find((item) => String(item.id) === String(targetId))
    : bookingsList[0];

  const [booking, setBooking] = useState<Booking | undefined>(foundBooking);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"BANK" | "EWALLET" | "CASH">("BANK");

  useEffect(() => {
    const list = getBookings();
    setBookingsList(list);
    const b = targetId
      ? list.find((item) => String(item.id) === String(targetId))
      : list[0];
    setBooking(b);
  }, [targetId]);

  const handlePayment = async () => {
    if (!booking) return;
    setIsPaying(true);
    try {
      let orderId: number | null = null;
      let payAmount = booking.total;

      // 1. Tra cứu Order của booking từ Backend
      try {
        const orderRes = await fetch(`http://localhost:8081/orders/booking/${booking.id}`);
        if (orderRes.ok) {
          const orderJson = await orderRes.json();
          if (orderJson.result?.id) {
            orderId = orderJson.result.id;
            if (orderJson.result.remainingAmount) {
              payAmount = orderJson.result.remainingAmount;
            }
          }
        }
      } catch (e) {
        console.warn("Không tra cứu được Order từ backend:", e);
      }

      // 2. Gửi request thanh toán lên Backend nếu có orderId
      if (orderId) {
        try {
          const paymentRes = await fetch("http://localhost:8081/orders/payments", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId,
              amount: payAmount,
              paymentType: paymentMethod,
              cashFlowType: "RECEIPT",
              note: "Khách thanh toán trực tuyến trên website",
            }),
          });
          if (!paymentRes.ok) {
            console.warn("Backend payment trả về status:", paymentRes.status);
          }
        } catch (e) {
          console.warn("Gửi payment backend thất bại:", e);
        }
      }

      // 3. Cập nhật trạng thái thành công trong local storage và state
      updateBooking(booking.id, { status: "confirmed" });
      setBooking((prev) => (prev ? { ...prev, status: "confirmed" } : undefined));
      toast.success("Thanh toán đơn đặt phòng thành công!");
    } catch (err) {
      console.error("Lỗi khi xử lý thanh toán:", err);
      toast.error("Thanh toán thất bại, vui lòng thử lại!");
    } finally {
      setIsPaying(false);
    }
  };

  if (!booking)
    return (
      <main className="container flex min-h-[55vh] items-center justify-center py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary">
            Không tìm thấy đơn đặt phòng
          </h1>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/hotels">Quay lại chọn phòng</Link>
          </Button>
        </div>
      </main>
    );

  const pending = booking.status === "pending_payment";
  const roomLines = booking.roomSelections || [];
  const hasRoomServices = roomLines.some((selection) =>
    selection.stays?.some((stay) => stay.services?.length),
  );
  const subtotalBeforeDiscount =
    booking.total - booking.vat - booking.serviceFee + booking.discount;
  const commonFeeLines = (booking.feeLines || []).filter(
    (fee) => !isRoomSpecificFee(fee),
  );
  return (
    <main className="container py-12">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${pending ? "bg-gold/20 text-amber-700" : "bg-emerald-100 text-emerald-600"}`}
          >
            {pending ? (
              <Clock3 className="h-8 w-8" />
            ) : (
              <CheckCircle2 className="h-8 w-8" />
            )}
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[.16em] text-gold">
            Sen Việt booking
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary">
            {pending ? "Đơn đang chờ thanh toán" : "Đặt phòng & Thanh toán thành công"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {pending
              ? "Phòng đang được giữ trong 15 phút. Vui lòng hoàn tất thanh toán để xác nhận booking."
              : "Cảm ơn bạn đã lựa chọn Sen Việt Hotels & Resorts. Đơn đặt phòng của bạn đã được thanh toán thành công."}
          </p>
        </header>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <HotelIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-primary">{booking.hotelName}</p>
                <p className="text-sm text-muted-foreground">
                  Mã booking: {booking.id}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {roomLines.length ? (
                roomLines.flatMap((selection) =>
                  selection.stays?.length ? (
                    selection.stays.map((stay) => (
                      <div
                        key={stay.roomCode}
                        className="rounded-xl bg-secondary/50 p-4 text-sm"
                      >
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-primary">
                            {selection.roomNameVi} · {stay.roomCode}
                          </span>
                          <span>{stay.nights} đêm</span>
                        </div>
                        {(stay.offerName || selection.offerName) && (
                          <p className="mt-1 text-xs font-medium text-primary">
                            {stay.offerName || selection.offerName}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Nhận phòng: {" "}
                          {dateTime(stay.checkIn, booking.arrivalTime || "14:00")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Trả phòng: {" "}
                          {dateTime(
                            stay.checkOut,
                            booking.departureTime || "12:00",
                          )}
                        </p>
                        <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                          <p className="font-semibold text-primary">
                            Tiền phòng: {" "}
                            {formatVnd(
                              (stay.nightlyPrice || selection.nightlyPrice) * Math.max(0, stay.nights),
                            )}
                          </p>
                          {Number(stay.extraGuestCharge || 0) *
                            Math.max(0, stay.nights) >
                            0 && (
                            <p>
                              Khách thêm: {" "}
                              {formatVnd(
                                Number(stay.extraGuestCharge || 0) *
                                  Math.max(0, stay.nights),
                              )}
                            </p>
                          )}
                        </div>
                        {stay.services?.length ? (
                          <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                            <p className="font-semibold text-primary">Dịch vụ</p>
                            {stay.services.map((service) => (
                              <p key={service.id}>
                                {service.name} × {service.quantity} · {" "}
                                {formatVnd(service.total)}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div
                      key={selection.roomId}
                      className="rounded-xl bg-secondary/50 p-4 text-sm"
                    >
                      <p className="font-semibold text-primary">
                        {selection.roomNameVi} × {selection.quantity}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Nhận phòng: {" "}
                        {dateTime(
                          selection.checkIn || booking.checkIn,
                          booking.arrivalTime || "14:00",
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Trả phòng: {" "}
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
                          Phụ thu khách thêm: {" "}
                          {formatVnd(booking.extraGuestCharge)}
                        </p>
                      ) : null}
                    </div>
                  ),
                )
              ) : (
                <div className="rounded-xl bg-secondary/50 p-4 text-sm">
                  <p className="font-semibold text-primary">{booking.roomName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nhận phòng: {" "}
                    {dateTime(booking.checkIn, booking.arrivalTime || "14:00")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Trả phòng: {" "}
                    {dateTime(booking.checkOut, booking.departureTime || "12:00")}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-primary">
                    Tiền phòng: {formatVnd(booking.roomTotal)}
                  </p>
                  {booking.extraGuestCharge && booking.extraGuestCharge > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Phụ thu khách thêm: {formatVnd(booking.extraGuestCharge)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            {!hasRoomServices && booking.services?.length ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-semibold text-primary">Dịch vụ đã chọn</p>
                {booking.services.map((service) => (
                  <div
                    key={service.id}
                    className="mt-1 flex justify-between text-sm"
                  >
                    <span>
                      {service.name} × {service.quantity}
                    </span>
                    <span>{formatVnd(service.total)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            {booking.cancellationPolicy && (
              <div className="mt-5 rounded-xl border border-amber-200/70 bg-amber-50/50 p-4 text-xs">
                <p className="font-semibold text-amber-900">Chính sách hủy phòng áp dụng</p>
                <p className="mt-1 text-amber-800/90">{booking.cancellationPolicy}</p>
              </div>
            )}
          </section>
          <aside className="rounded-2xl border border-border bg-white p-6 shadow-lg lg:sticky lg:top-6">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
              Thanh toán
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary">
              Chi tiết thanh toán
            </h2>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span>Tạm tính các phòng</span>
                <strong>{formatVnd(subtotalBeforeDiscount)}</strong>
              </div>
              {commonFeeLines.map((fee) => (
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
                  <strong className="shrink-0">{formatVnd(fee.amount)}</strong>
                </div>
              ))}
              <div className="flex justify-between gap-3 border-t border-border/70 pt-2">
                <span>Thuế VAT (8%)</span>
                <strong>{formatVnd(booking.vat)}</strong>
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

            {pending && (
              <div className="mt-5 space-y-3 rounded-xl border border-primary/15 bg-secondary/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Phương thức thanh toán
                </p>
                <div className="space-y-2 text-xs">
                  <label
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition ${
                      paymentMethod === "BANK"
                        ? "border-primary bg-white shadow-sm font-semibold text-primary"
                        : "border-border bg-white/60 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="BANK"
                      checked={paymentMethod === "BANK"}
                      onChange={() => setPaymentMethod("BANK")}
                      className="accent-primary"
                    />
                    <QrCode className="h-4 w-4 text-primary" />
                    <span>Chuyển khoản / Quét mã QR</span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition ${
                      paymentMethod === "EWALLET"
                        ? "border-primary bg-white shadow-sm font-semibold text-primary"
                        : "border-border bg-white/60 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="EWALLET"
                      checked={paymentMethod === "EWALLET"}
                      onChange={() => setPaymentMethod("EWALLET")}
                      className="accent-primary"
                    />
                    <Wallet className="h-4 w-4 text-primary" />
                    <span>Ví MoMo / VNPay</span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition ${
                      paymentMethod === "CASH"
                        ? "border-primary bg-white shadow-sm font-semibold text-primary"
                        : "border-border bg-white/60 text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={paymentMethod === "CASH"}
                      onChange={() => setPaymentMethod("CASH")}
                      className="accent-primary"
                    />
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span>Thanh toán tại quầy lễ tân</span>
                  </label>
                </div>

                <Button
                  type="button"
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="mt-3 w-full rounded-full bg-emerald-600 py-6 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý thanh toán...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      Thanh toán ngay ({formatVnd(booking.total)})
                    </>
                  )}
                </Button>
              </div>
            )}

            {!pending && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Đã thanh toán thành công
                </p>
                <p className="mt-1 text-[11px] text-emerald-600">
                  Đơn đặt phòng của bạn đã được thanh toán và xác nhận đảm bảo giữ phòng.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild className="rounded-full">
                <Link to={`/bookings?created=${booking.id}`}>
                  Xem lịch sử đặt phòng
                </Link>
              </Button>
              {!pending && (
                <Button asChild variant="outline" className="rounded-full">
                  <Link to={`/invoices/${booking.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Xem & in hóa đơn
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/hotels">
                  <HotelIcon className="mr-2 h-4 w-4" />
                  Đặt thêm phòng
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
