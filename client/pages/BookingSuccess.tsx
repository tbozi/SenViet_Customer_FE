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
  Copy,
  Check,
  ExternalLink,
  Lightbulb,
  RefreshCw,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
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

  // QR Modal States (Chuẩn giao diện POS / VietQR của Dung)
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300);
  const [qrData, setQrData] = useState<{
    orderId: string;
    amount: number;
    accountNo: string;
    accountName: string;
    bankName: string;
    description: string;
    customerName?: string;
    qrUrl: string;
    checkoutUrl?: string;
  } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0 && booking?.status === "pending_payment") {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            toast.error("Thời gian giữ phòng (5 phút) đã hết hạn! Đơn đặt phòng đã được tự động hủy.");
            setQrModalOpen(false);
            if (booking) {
              updateBooking(booking.id, { status: "cancelled" });
              setBooking((curr) => (curr ? { ...curr, status: "cancelled" } : undefined));
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, booking?.id, booking?.status]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  useEffect(() => {
    const list = getBookings();
    setBookingsList(list);
    const b = targetId
      ? list.find((item) => String(item.id) === String(targetId))
      : list[0];
    setBooking(b);

    if (b && b.status === "pending_payment" && b.createdAt) {
      const createdTime = new Date(b.createdAt).getTime();
      const now = Date.now();
      const elapsedSeconds = (now - createdTime) / 1000;
      if (elapsedSeconds >= 300) {
        updateBooking(b.id, { status: "cancelled" });
        setBooking((curr) => (curr ? { ...curr, status: "cancelled" } : undefined));
        setCountdown(0);
      } else {
        const remaining = Math.max(5, Math.floor(300 - elapsedSeconds));
        setCountdown(remaining);
      }
    }
  }, [targetId]);

  const handlePayment = async () => {
    if (!booking) return;
    setIsPaying(true);
    try {
      let orderId = "";
      const payAmount = booking.total;

      // 1. Tra cứu Order của booking từ Backend
      try {
        const orderRes = await fetch(`http://localhost:8081/orders/booking/${booking.id}`);
        if (orderRes.ok) {
          const orderJson = await orderRes.json();
          if (orderJson.result?.id) {
            orderId = String(orderJson.result.id);
          }
        }
      } catch (e) {
        console.warn("Không tra cứu được Order từ backend:", e);
      }

      const activeOrderId = orderId || String(booking.id);
      
      // Trích xuất tên khách hàng không dấu ngắn gọn
      let customerShortName = "";
      if (booking.guestName) {
        const parts = booking.guestName.trim().split(/\s+/);
        const lastName = parts[parts.length - 1];
        customerShortName = lastName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/gi, "d")
          .replace(/[^a-zA-Z0-9]/g, "")
          .toUpperCase();
      }
      // Rút gọn mã hóa đơn: lấy HD + 5 ký tự cuối
      const shortOrderCode = activeOrderId.length > 7 ? `HD${activeOrderId.slice(-5)}` : activeOrderId;
      let paymentDescription = customerShortName 
        ? `${customerShortName}_${shortOrderCode}_${Math.round(payAmount)}`
        : `HD_${shortOrderCode}_${Math.round(payAmount)}`;
      if (paymentDescription.length > 25) {
        paymentDescription = paymentDescription.substring(0, 25).trim();
      }

      // 2. Nếu chọn Chuyển khoản / Quét mã QR -> Mở màn hình quét mã VietQR PayOS
      if (paymentMethod === "BANK") {
        let checkoutUrl: string | undefined = undefined;
        let qrCodeUrl = `https://img.vietqr.io/image/BIDV-V3CAS6811679267-compact2.png?amount=${Math.round(payAmount)}&addInfo=${encodeURIComponent(paymentDescription)}&accountName=NGUYEN+LE+ANH+PHONG`;

        try {
          const qrRes = await fetch("http://localhost:8081/payment/create-qr", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: activeOrderId,
              amount: Math.round(payAmount),
            }),
          });
          if (qrRes.ok) {
            const qrJson = await qrRes.json();
            if (qrJson.description) {
              paymentDescription = qrJson.description;
            }
            if (qrJson.checkoutUrl) {
              checkoutUrl = qrJson.checkoutUrl;
              if (qrJson.qrCode && qrJson.qrCode.startsWith("000201")) {
                qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrJson.qrCode)}`;
              } else if (qrJson.qrCode && qrJson.qrCode.startsWith("http")) {
                qrCodeUrl = qrJson.qrCode;
              } else {
                qrCodeUrl = `https://img.vietqr.io/image/BIDV-V3CAS6811679267-compact2.png?amount=${Math.round(payAmount)}&addInfo=${encodeURIComponent(paymentDescription)}&accountName=NGUYEN+LE+ANH+PHONG`;
              }
            }
          }
        } catch (e) {
          console.warn("Lỗi gọi /payment/create-qr:", e);
        }

        setQrData({
          orderId: activeOrderId,
          amount: payAmount,
          customerName: booking.guestName || "Khách đặt phòng",
          bankName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)",
          accountNo: "V3CAS6811679267",
          accountName: "NGUYEN LE ANH PHONG",
          description: paymentDescription,
          qrUrl: qrCodeUrl,
          checkoutUrl,
        });
        setCountdown(300);
        setQrModalOpen(true);
        setIsPaying(false);
        return;
      }

      // 3. Nếu là tiền mặt hoặc ví điện tử khác
      if (activeOrderId) {
        const token = localStorage.getItem("accessToken");
        const payRes = await fetch("http://localhost:8081/orders/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            orderId: activeOrderId,
            amount: payAmount,
            paymentType: paymentMethod,
            cashFlowType: "RECEIPT",
            note: "Khách thanh toán trực tuyến trên website",
          }),
        });
        if (!payRes.ok) {
          const errText = await payRes.text().catch(() => "");
          throw new Error(errText || `HTTP ${payRes.status}`);
        }
      }

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

  // Tự động kiểm tra trạng thái thanh toán từ PayOS mỗi 2 giây khi modal QR mở
  useEffect(() => {
    if (!qrModalOpen || !qrData?.orderId || booking?.status === "confirmed") {
      return;
    }

    let isSubscribed = true;

    const checkStatus = async () => {
      if (!isSubscribed) return;
      try {
        const res = await fetch(`http://localhost:8081/payment/check-order-status/${qrData.orderId}`);
        if (res.ok && isSubscribed) {
          const data = await res.json();
          if (data.isPaid && isSubscribed) {
            isSubscribed = false;
            toast.success("Ngân hàng đã xác nhận thanh toán thành công!");
            if (booking?.id) {
              updateBooking(booking.id, { status: "confirmed" });
            }
            setBooking((prev) => (prev ? { ...prev, status: "confirmed" } : undefined));
            setTimeout(() => {
              setQrModalOpen(false);
            }, 800);
          }
        }
      } catch (e) {
        console.warn("Polling payment status error:", e);
      }
    };

    // Kiểm tra ngay sau 1.2s và sau đó lặp lại đều đặn mỗi 2 giây
    const initialTimer = setTimeout(checkStatus, 1200);
    const interval = setInterval(checkStatus, 2000);

    return () => {
      isSubscribed = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [qrModalOpen, qrData?.orderId, booking?.id, booking?.status]);

  const handleCheckPaymentStatus = async () => {
    if (!booking || !qrData?.orderId) return;
    setIsPaying(true);
    try {
      const res = await fetch(`http://localhost:8081/payment/check-order-status/${qrData.orderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.isPaid) {
          toast.success("Ngân hàng đã xác nhận thanh toán thành công!");
          updateBooking(booking.id, { status: "confirmed" });
          setBooking((prev) => (prev ? { ...prev, status: "confirmed" } : undefined));
          setQrModalOpen(false);
          return;
        }
      }
      toast.warning("Hệ thống chưa nhận được tiền từ ngân hàng. Nếu bạn vừa chuyển khoản, vui lòng đợi vài giây để ngân hàng xử lý hoặc kiểm tra lại thông tin chuyển khoản.");
    } catch (e) {
      console.error("Lỗi xác nhận thanh toán:", e);
      toast.error("Không thể kết nối đến máy chủ kiểm tra thanh toán!");
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

  const isCancelled = booking.status === "cancelled";
  const pending = booking.status === "pending_payment" && !isCancelled;
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
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              isCancelled
                ? "bg-rose-100 text-rose-600"
                : pending
                ? "bg-gold/20 text-amber-700"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {isCancelled ? (
              <AlertCircle className="h-8 w-8" />
            ) : pending ? (
              <Clock3 className="h-8 w-8" />
            ) : (
              <CheckCircle2 className="h-8 w-8" />
            )}
          </div>
          <p
            className={`mt-6 text-sm font-semibold uppercase tracking-[.16em] ${
              isCancelled ? "text-rose-600" : "text-gold"
            }`}
          >
            Sen Việt booking
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary">
            {isCancelled
              ? "Đơn đặt phòng đã hết hạn thanh toán"
              : pending
              ? "Đơn đang chờ thanh toán"
              : "Đặt phòng & Thanh toán thành công"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {isCancelled
              ? "Thời gian giữ phòng (5 phút) đã kết thúc. Phòng đã được hệ thống tự động hoàn trả để phục vụ khách hàng khác. Quý khách vui lòng đặt lại phòng nếu vẫn có nhu cầu lưu trú."
              : pending
              ? "Phòng đang được giữ trong 5 phút. Vui lòng hoàn tất thanh toán để xác nhận booking."
              : "Cảm ơn bạn đã lựa chọn Sen Việt Hotels & Resorts. Đơn đặt phòng của bạn đã được thanh toán thành công."}
          </p>
        </header>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <section className="rounded-2xl border border-border bg-card p-6">
            {isCancelled && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 flex items-start gap-3 shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-rose-900">
                    Đơn đặt phòng đã bị hủy tự động
                  </p>
                  <p className="mt-1 text-rose-700 leading-relaxed">
                    Theo quy định của chuỗi khách sạn Sen Việt, sau 5 phút nếu đơn đặt phòng chưa hoàn tất thanh toán, hệ thống sẽ tự động hủy đơn và mở lại phòng cho các khách hàng khác.
                  </p>
                </div>
              </div>
            )}
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

            {isCancelled && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-center">
                <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                  Đã hết hạn giữ phòng
                </p>
                <p className="mt-1 text-xs text-rose-600">
                  Thời gian giữ phòng 5 phút đã kết thúc và phòng đã được nhả về hệ thống.
                </p>
                <Button asChild className="mt-4 w-full rounded-full bg-rose-600 font-bold text-white shadow-md hover:bg-rose-700">
                  <Link to={booking.hotelSlug ? `/hotels/${booking.hotelSlug}` : "/hotels"}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Đặt lại phòng này
                  </Link>
                </Button>
              </div>
            )}

            {!pending && !isCancelled && (
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
              {!pending && !isCancelled && (
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
                  {isCancelled ? "Tìm khách sạn khác" : "Đặt thêm phòng"}
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* MÀN HÌNH QUÉT MÃ QR THANH TOÁN (VIETQR / PAYOS - BẢN RỘNG RÃI SANG TRỌNG) */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-[800px] max-h-[92vh] overflow-y-auto rounded-2xl p-0 sm:max-w-[800px] border-none shadow-2xl">
          {/* Header Modal */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white px-7 py-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Thanh toán qua mã QR</h2>
              <p className="text-xs text-slate-500 mt-0.5">Mã QR có hiệu lực trong 5 phút</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>payOS</span>
            </div>
          </div>

          <div className="p-6 sm:p-7 space-y-4 bg-white">
            {/* Top Hotel Branding & Tip Banner */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50/90 px-4 py-3 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                  🏨
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                    QUẢN LÝ KHÁCH SẠN
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    {booking?.hotelName || "Sen Việt Hotel"}
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-600 font-mono font-semibold bg-white px-2.5 py-1 rounded-md border border-slate-200">
                {booking?.id}
              </span>
            </div>

            {/* Instruction Tip */}
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/80 px-4 py-3 text-xs text-amber-900 border border-amber-200/80">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span className="leading-relaxed">
                Mở <strong>App Ngân hàng bất kỳ</strong> để <strong>quét mã VietQR</strong> hoặc <strong>chuyển khoản</strong> chính xác số tiền, nội dung bên dưới
              </span>
            </div>

            {/* Main Content: QR Code Left + Bank Info Right */}
            {qrData && (
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 items-stretch">
                {/* Cột trái: QR Code */}
                <div className="flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                  <div className="mb-2 flex items-center justify-center gap-1.5">
                    <span className="text-sm font-black tracking-wider text-rose-600">VIET</span>
                    <span className="text-sm font-black tracking-wider text-blue-800">QR</span>
                    <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">PRO</span>
                  </div>

                  <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-inner">
                    <img
                      src={qrData.qrUrl}
                      alt="VietQR PayOS"
                      className={`h-52 w-52 object-contain transition duration-300 ${countdown === 0 ? "filter blur-[2px] opacity-20 grayscale" : ""}`}
                    />
                    {countdown === 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 p-3 text-center rounded-xl">
                        <AlertCircle className="h-9 w-9 text-rose-500 mb-1" />
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">
                          Mã QR đã hết hạn
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">
                          Vui lòng bấm tạo mã mới
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
                    <span className="text-blue-600 font-bold">napas 247</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-700 font-bold truncate max-w-[180px]" title={qrData.bankName}>
                      {qrData.bankName || "BIDV"}
                    </span>
                  </div>
                </div>

                {/* Cột phải: Thông tin thanh toán & chuyển khoản */}
                <div className="space-y-3 text-xs">
                  {/* Hàng 1: Khách hàng & Mã hóa đơn */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <p className="text-[11px] text-slate-500">Khách hàng</p>
                      <p className="font-bold text-slate-900 text-xs truncate mt-0.5" title={qrData.customerName || booking.guestName}>
                        {qrData.customerName || booking.guestName || "Khách đặt"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="min-w-0 pr-1">
                        <p className="text-[11px] text-slate-500">Mã hóa đơn</p>
                        <p className="font-mono font-bold text-slate-900 text-xs truncate mt-0.5" title={qrData.orderId}>
                          {qrData.orderId}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(qrData.orderId, "Mã hóa đơn")}
                        className="h-6 w-6 p-0 shrink-0 text-slate-400 hover:text-primary hover:bg-slate-200/60"
                        title="Sao chép mã hóa đơn"
                      >
                        {copiedField === "Mã hóa đơn" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Hàng 2: Số tiền cần thanh toán (Không có nút sao chép) */}
                  <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3.5 py-2.5">
                    <p className="text-[11px] font-medium text-emerald-800">Số tiền thanh toán</p>
                    <p className="font-mono font-bold text-emerald-600 text-xl tracking-tight mt-0.5">
                      {formatVnd(qrData.amount)}
                    </p>
                  </div>

                  {/* Hàng 3: Ngân hàng & Chủ tài khoản */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] text-slate-500 shrink-0">Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-slate-900 text-xs text-right leading-tight">
                        {qrData.bankName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/70 pt-1.5">
                      <span className="text-[11px] text-slate-500 shrink-0">Chủ tài khoản:</span>
                      <span className="font-bold text-slate-900 text-xs uppercase text-right">
                        {qrData.accountName}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 4: Số tài khoản */}
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                    <div>
                      <p className="text-[11px] text-slate-500">Số tài khoản</p>
                      <p className="font-mono font-bold text-slate-900 text-sm tracking-wide">{qrData.accountNo}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(qrData.accountNo, "Số tài khoản")}
                      className="h-7 px-2.5 gap-1 rounded-lg text-xs font-medium border-slate-200 hover:bg-slate-100"
                    >
                      {copiedField === "Số tài khoản" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>Sao chép</span>
                    </Button>
                  </div>

                  {/* Hàng 5: Nội dung chuyển khoản */}
                  <div className="flex items-center justify-between rounded-xl border border-amber-200/90 bg-amber-50/70 px-3 py-2">
                    <div className="min-w-0 pr-2">
                      <p className="text-[11px] font-semibold text-amber-900">Nội dung chuyển khoản</p>
                      <p className="font-mono font-bold text-amber-950 text-xs truncate tracking-wide mt-0.5" title={qrData.description}>
                        {qrData.description}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(qrData.description, "Nội dung")}
                      className="h-7 px-2.5 gap-1 rounded-lg text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
                    >
                      {copiedField === "Nội dung" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      <span>Sao chép</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Countdown & External Link */}
            <div className="border-t border-slate-100 pt-2.5 text-center space-y-1">
              {countdown > 0 ? (
                <p className="text-xs font-semibold text-amber-700">
                  Thời gian còn lại: <span className="font-mono text-sm font-bold">{formatCountdown(countdown)}</span>
                </p>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Mã QR đã hết thời gian hiệu lực (5 phút)</span>
                </div>
              )}
              {qrData?.checkoutUrl && qrData.checkoutUrl.startsWith("http") && countdown > 0 && (
                <div>
                  <a
                    href={qrData.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary underline hover:text-primary/80"
                  >
                    <span>Mở trang thanh toán trong tab mới</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Realtime detection message */}
            {countdown > 0 ? (
              <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50/80 px-3 py-2 text-xs text-emerald-800 border border-emerald-200/60">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-[11px] text-center">
                  Đang tự động đồng bộ với ngân hàng... Hệ thống sẽ tự chuyển trang ngay khi bạn chuyển tiền thành công
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-1 text-xs text-rose-600 font-medium">
                <span>Giao dịch này đã hết hạn. Vui lòng bấm tạo mã mới để thanh toán.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQrModalOpen(false)}
                className="w-1/3 rounded-xl border-slate-300"
              >
                Đóng
              </Button>
              {countdown > 0 ? (
                <Button
                  type="button"
                  onClick={handleCheckPaymentStatus}
                  disabled={isPaying}
                  className="w-2/3 rounded-xl bg-emerald-600 font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang kiểm tra từ ngân hàng...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Kiểm tra thanh toán ngay
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="w-2/3 rounded-xl bg-primary font-bold text-white shadow-md hover:bg-primary/90"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo mã QR mới...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tạo lại mã QR mới
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
