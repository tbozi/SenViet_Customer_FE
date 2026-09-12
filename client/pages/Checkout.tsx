import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Banknote,
  CreditCard,
  LockKeyhole,
  QrCode,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingSummaryPanel from "@/components/booking/BookingSummaryPanel";
import { formatVnd, hotels } from "@/data/hotels";
import {
  calculateEarlyCheckInSurcharge,
  calculateLateCheckOutSurcharge,
  getCancellationPolicy,
  isRoomSpecificFee,
  saveBooking,
  type Booking,
  type BookingFee,
  type BookingService,
  type GuestForm,
  type RoomSelection,
  type RoomStay,
} from "@/lib/bookings";
import { useAuth } from "@/lib/auth";
import {
  getPromotionDiscount,
  getSavedPromotionCodes,
  promotionNames,
} from "@/lib/savedPromotions";
import { useLanguage } from "@/lib/i18n";

const fallbackGuestForms = (params: URLSearchParams): GuestForm[] => {
  try {
    const parsed = JSON.parse(params.get("guests") || "[]");
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    return [];
  }
  return [
    {
      adults: Number(params.get("adults") || 1),
      children: Number(params.get("children") || 0),
      infants: 0,
    },
  ];
};

function parseSelections(params: URLSearchParams): RoomSelection[] {
  try {
    const parsed = JSON.parse(params.get("roomSelections") || "null");
    if (Array.isArray(parsed) && parsed.length)
      return parsed as RoomSelection[];
  } catch {
    return [];
  }
  const roomName = params.get("room") || "Phòng Tiêu Chuẩn";
  const guests = fallbackGuestForms(params);
  const quantity = Number(params.get("rooms") || 1);
  const nightlyPrice = Number(params.get("roomPrice") || 0);
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  return [
    {
      roomId: "legacy",
      roomName,
      roomNameVi: roomName,
      quantity,
      nightlyPrice,
      guestForms: Array.from(
        { length: quantity },
        (_, index) => guests[index] || guests[0],
      ),
      includedCapacity: { adults: 1, children: 1, infants: 1 },
      checkIn,
      checkOut,
      nights: Number(params.get("nights") || 0),
      extraAdults: 0,
      extraChildren: 0,
      extraGuestCount: 0,
      extraGuestCharge: 0,
    },
  ];
}

function parseServices(params: URLSearchParams): BookingService[] {
  try {
    const parsed = JSON.parse(params.get("services") || "[]");
    return Array.isArray(parsed) ? (parsed as BookingService[]) : [];
  } catch {
    return [];
  }
}

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
  }));
}

const cancellationDeadlineFor = (checkIn: string) => {
  const deadline = new Date(`${checkIn}T00:00:00`);
  deadline.setDate(deadline.getDate() - 7);
  return deadline.toISOString();
};

export default function Checkout() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hotel =
    hotels.find((item) => item.slug === params.get("hotel")) || hotels[0];
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [request, setRequest] = useState("");
  const [promo, setPromo] = useState(params.get("promo") || "");
  const [savedPromotionCodes, setSavedPromotionCodes] = useState<string[]>([]);
  const [payment, setPayment] = useState<Booking["paymentMethod"]>("qr");
  const [error, setError] = useState("");
  const [paymentState, setPaymentState] = useState<"idle" | "processing">(
    "idle",
  );
  const selections = useMemo(() => parseSelections(params), [params]);
  const services = useMemo(() => parseServices(params), [params]);

  useEffect(() => {
    setSavedPromotionCodes(user ? getSavedPromotionCodes(user.email) : []);
  }, [user?.email]);
  const arrivalTime = params.get("arrivalTime") || "14:00";
  const departureTime = params.get("departureTime") || "12:00";
  const roomCount = selections.reduce(
    (sum, selection) => sum + Number(selection.quantity || 0),
    0,
  );
  const roomSubtotal = selections.reduce(
    (sum, selection) =>
      sum +
      selectionStays(selection).reduce(
        (staySum, stay) =>
          staySum + selection.nightlyPrice * Math.max(0, stay.nights),
        0,
      ),
    0,
  );
  const earlySurcharge = selections.reduce(
    (sum, selection) =>
      sum +
      selectionStays(selection).reduce(
        (staySum) =>
          staySum +
          calculateEarlyCheckInSurcharge(selection.nightlyPrice, arrivalTime),
        0,
      ),
    0,
  );
  const lateSurcharge = selections.reduce(
    (sum, selection) =>
      sum +
      selectionStays(selection).reduce(
        (staySum) =>
          staySum +
          calculateLateCheckOutSurcharge(selection.nightlyPrice, departureTime),
        0,
      ),
    0,
  );
  const surcharge = earlySurcharge + lateSurcharge;
  const extraGuestCharge = selections.reduce(
    (sum, selection) =>
      sum +
      selectionStays(selection).reduce(
        (staySum, stay) =>
          staySum +
          Number(stay.extraGuestCharge || 0) * Math.max(0, stay.nights),
        0,
      ),
    0,
  );
  const serviceTotal = services.reduce(
    (sum, service) => sum + service.total,
    0,
  );
  const roomServiceLines = useMemo<BookingService[]>(
    () =>
      selections.flatMap((selection) =>
        selectionStays(selection).flatMap((stay) =>
          (stay.services || []).map((service) => ({
            ...service,
            roomCode: service.roomCode || stay.roomCode,
            roomName: service.roomName || selection.roomNameVi,
          })),
        ),
      ),
    [selections],
  );
  const totalNights = Math.max(
    0,
    ...selections.flatMap((selection) =>
      selectionStays(selection).map((stay) => stay.nights),
    ),
  );
  const discount = getPromotionDiscount(promo, {
    roomSubtotal,
    serviceTotal,
    nights: totalNights,
    roomCount,
  });
  const taxableSubtotal = Math.max(
    0,
    roomSubtotal + surcharge + extraGuestCharge + serviceTotal - discount,
  );
  const vat = Math.round(taxableSubtotal * 0.08);
  const serviceFee = Math.round(taxableSubtotal * 0.05);
  const total = taxableSubtotal + vat + serviceFee;
  const firstCheckIn =
    selections
      .flatMap((selection) =>
        selectionStays(selection).map((stay) => stay.checkIn),
      )
      .filter(Boolean)
      .sort()[0] ||
    params.get("checkIn") ||
    "";
  const checkOutDates = selections
    .flatMap((selection) =>
      selectionStays(selection).map((stay) => stay.checkOut),
    )
    .filter(Boolean)
    .sort();
  const lastCheckOut =
    checkOutDates[checkOutDates.length - 1] || params.get("checkOut") || "";
  const feeLines = useMemo<BookingFee[]>(
    () => [
      ...(earlySurcharge > 0
        ? [
            {
              label: "Phụ thu nhận phòng sớm",
              amount: earlySurcharge,
              detail: `Giờ nhận dự kiến: ${arrivalTime}`,
              scope: "room" as const,
              kind: "surcharge" as const,
            },
          ]
        : []),
      ...(lateSurcharge > 0
        ? [
            {
              label: "Phụ thu trả phòng muộn",
              amount: lateSurcharge,
              detail: `Giờ trả dự kiến: ${departureTime}`,
              scope: "room" as const,
              kind: "surcharge" as const,
            },
          ]
        : []),
      ...(extraGuestCharge > 0
        ? [
            {
              label: "Phụ thu vượt sức chứa",
              amount: extraGuestCharge,
              detail: "500.000đ/người/đêm, không tính em bé",
              scope: "room" as const,
              kind: "surcharge" as const,
            },
          ]
        : []),
      ...(roomServiceLines.length ? roomServiceLines : services).map(
        (service) => ({
          label: `${service.roomCode ? `${service.roomName || "Phòng"} · ${service.roomCode} — ` : ""}Dịch vụ: ${service.name}`,
          amount: service.total,
          detail: `${service.quantity} đơn vị × ${formatVnd(service.unitPrice)}`,
          scope: "room" as const,
          kind: "service" as const,
        }),
      ),
    ],
    [
      arrivalTime,
      departureTime,
      extraGuestCharge,
      services,
      roomServiceLines,
      earlySurcharge,
      lateSurcharge,
    ],
  );
  const commonFeeLines = feeLines.filter((fee) => !isRoomSpecificFee(fee));
  const subtotalBeforeDiscount = taxableSubtotal + discount;
  const hasValidDraft = Boolean(
    params.get("hotel") &&
    selections.length &&
    roomCount > 0 &&
    selections.every(
      (selection) =>
        selection.nightlyPrice > 0 &&
        selectionStays(selection).every((stay) => stay.nights > 0),
    ),
  );

  if (!hasValidDraft)
    return (
      <main className="container flex min-h-[55vh] items-center justify-center py-16">
        <div className="max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
          <h1 className="font-display text-3xl font-bold text-primary">
            Thông tin đặt phòng chưa đầy đủ
          </h1>
          <p className="mt-3 text-muted-foreground">
            Vui lòng chọn khách sạn, ngày lưu trú hợp lệ và ít nhất một loại
            phòng trước khi thanh toán.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/hotels">Chọn phòng</Link>
          </Button>
        </div>
      </main>
    );
  if (!user)
    return (
      <main className="container flex min-h-[55vh] items-center justify-center py-16">
        <div className="max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
          <LockKeyhole className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-5 font-display text-3xl font-bold text-primary">
            {language === "vi"
              ? "Đăng nhập để thanh toán"
              : "Log in to continue"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {language === "vi"
              ? "Bạn có thể đăng ký ngay hoặc đăng nhập trước khi hoàn tất đặt phòng."
              : "Sign up or log in before completing your reservation."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link
                to="/register"
                state={{ from: `${location.pathname}${location.search}` }}
              >
                Đăng ký
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link
                to="/login"
                state={{ from: `${location.pathname}${location.search}` }}
              >
                Đăng nhập
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name || !phone || !email)
      return setError("Vui lòng điền đủ thông tin người đại diện nhận phòng.");
    setError("");
    setPaymentState("processing");
    await new Promise((resolve) => setTimeout(resolve, 700));
    const cancellation = getCancellationPolicy(firstCheckIn);
    const booking: Booking = {
      id: `SV-${Date.now().toString().slice(-8)}`,
      userEmail: user.email,
      hotelSlug: hotel.slug,
      hotelName: hotel.name,
      roomName: selections
        .map((selection) => `${selection.roomNameVi} × ${selection.quantity}`)
        .join("; "),
      roomSelections: selections,
      services,
      feeLines,
      checkIn: firstCheckIn,
      checkOut: lastCheckOut,
      nights: Math.max(
        ...selections.flatMap((selection) =>
          selectionStays(selection).map((stay) => stay.nights),
        ),
      ),
      rooms: roomCount,
      roomPrice: selections.reduce(
        (sum, selection) => sum + selection.nightlyPrice * selection.quantity,
        0,
      ),
      roomTotal: roomSubtotal,
      vat,
      serviceFee,
      discount,
      total,
      paymentMethod: payment,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
      guestName: name,
      phone,
      email,
      specialRequest: request,
      cancellationDeadline: cancellationDeadlineFor(firstCheckIn),
      cancellationPolicy:
        "7+ ngày hoàn 100%; 3 đến dưới 7 ngày hoàn 50%; dưới 3 ngày hoặc no-show không hoàn.",
      holdUntil: new Date(Date.now() + 15 * 60000).toISOString(),
      arrivalTime,
      departureTime,
      surcharge,
      extraGuestCharge,
    };
    saveBooking(booking);
    navigate(`/booking-success/${booking.id}`);
  };

  return (
    <main className="container py-12">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
          Sen Việt checkout
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary">
          {language === "vi" ? "Xác nhận đặt phòng" : "Confirm your booking"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thông tin người đại diện chỉ cần nhập một lần. Từng phòng cụ thể,
          khoảng ngày, dịch vụ và phụ phí được liệt kê riêng bên dưới.
        </p>
        <form
          onSubmit={submit}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-bold text-primary">
                  Thông tin người đại diện nhận phòng
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Thông tin này áp dụng cho tất cả các phòng trong cùng một lượt
                đặt.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-primary">
                  Họ tên
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary">
                  Số điện thoại
                  <input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary sm:col-span-2">
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary sm:col-span-2">
                  Yêu cầu đặc biệt
                  <textarea
                    value={request}
                    onChange={(event) => setRequest(event.target.value)}
                    rows={3}
                    placeholder="Ví dụ: đến sau 22:00, cần baby cot..."
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl font-bold text-primary">
                Phương thức thanh toán
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["qr", "Quét mã ngân hàng", QrCode],
                    ["cash", "Tiền mặt tại lễ tân", Banknote],
                    ["vnpay", "VNPay / ví điện tử", CreditCard],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPayment(value)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm ${payment === value ? "border-primary bg-secondary text-primary" : "border-border"}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </section>
          <BookingSummaryPanel
            hotelName={hotel.name}
            selections={selections}
            arrivalTime={arrivalTime}
            departureTime={departureTime}
            fallbackServices={services}
            totals={{
              subtotal: subtotalBeforeDiscount,
              commonFeeRows: commonFeeLines.map((fee) => ({
                label: fee.label,
                amount: fee.amount,
                detail: fee.detail,
              })),
              vatAndSystemFee: vat + serviceFee,
              discount,
              total,
            }}
            promo={
              <label className="mt-5 block text-sm font-medium text-primary">
                Mã khuyến mãi
                <input
                  value={promo}
                  onChange={(event) => setPromo(event.target.value.toUpperCase())}
                  placeholder="Nhập hoặc chọn mã đã lưu"
                  className="mt-1 w-full rounded-xl border border-input p-3 uppercase"
                />
                {promo && discount === 0 && (
                  <span className="mt-1 block text-xs font-normal text-amber-700">
                    Mã chưa đủ điều kiện cho đơn đặt phòng này.
                  </span>
                )}
              </label>
            }
            savedPromotions={savedPromotionCodes.map((code) => ({
              code,
              name: promotionNames[code] || "Ưu đãi Sen Việt",
            }))}
            onSelectPromotion={setPromo}
            cta={
              <>
                <Button
                  type="submit"
                  disabled={paymentState === "processing"}
                  className="w-full rounded-xl"
                >
                  {paymentState === "processing"
                    ? "Đang tạo đơn..."
                    : "Xác nhận đặt phòng"}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Nhận phòng từ 14:00 · Trả phòng trước 12:00 · Giữ phòng 15
                  phút.
                </p>
              </>
            }
          />
        </form>
      </div>
    </main>
  );
}
