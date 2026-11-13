import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  Banknote,
  Clock,
  CreditCard,
  LockKeyhole,
  QrCode,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toLocalDateStr } from "@/lib/utils";
import BookingSummaryPanel from "@/components/booking/BookingSummaryPanel";
import { formatVnd } from "@/data/hotels";
import {
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
  PROMOTION_RULES,
  getPromotionDiscount,
  getSavedPromotionCodes,
  isPromotionApplicableToHotel,
  promotionNames,
} from "@/lib/savedPromotions";
import { useLanguage } from "@/lib/i18n";
import { useGetActivePromotionsQuery, useGetMySavedPromotionsQuery } from "@/services/promotionApi";
import { useCreateCustomerBookingMutation } from "@/services/bookingApi";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";

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
      nights: Number(params.get("nights") || 1),
      extraAdults: 0,
      extraChildren: 0,
      extraGuestCount: 0,
      extraGuestCharge: 0,
      offerId: "legacy",
      offerName: "Gói ưu đãi đã chọn",
      offerCancellationPolicy: "Theo chính sách của booking.",
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
    nightlyPrice: selection.nightlyPrice,
    offerId: selection.offerId,
    offerName: selection.offerName,
    offerCancellationPolicy: selection.offerCancellationPolicy,
  }));
}

const cancellationDeadlineFor = (checkIn: string) => {
  if (!checkIn) return "";
  const checkInDate = new Date(`${checkIn}T14:00:00`);
  const deadline = new Date(checkInDate.getTime() - 72 * 3600 * 1000);
  return deadline > new Date() ? deadline.toISOString() : "";
};

export default function Checkout() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEn = language === "en";
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: publicHotels = [], isLoading: hotelsLoading, isError: hotelsError } = useGetPublicHotelsQuery();
  const hotelId = Number(params.get("hotel"));
  const hotel = publicHotels.find((item) => item.id === hotelId);
  const [name, setName] = useState(
    user?.name || params.get("fullName") || params.get("name") || "",
  );
  const [phone, setPhone] = useState(
    user?.phone || params.get("phone") || "",
  );
  const [email, setEmail] = useState(
    user?.email || params.get("email") || "",
  );
  const [cccd, setCccd] = useState(user?.cccd || user?.identityNumber || "");
  const [request, setRequest] = useState("");

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
      if (user.cccd || user.identityNumber) setCccd(user.cccd || user.identityNumber || "");
    }
  }, [user]);
  const [promo, setPromo] = useState(params.get("promo") || "");
  const [savedPromotionCodes, setSavedPromotionCodes] = useState<string[]>(() =>
    getSavedPromotionCodes(user?.email),
  );
  const [payment, setPayment] = useState<Booking["paymentMethod"]>("qr");
  const [error, setError] = useState("");
  const [paymentState, setPaymentState] = useState<"idle" | "processing">(
    "idle",
  );

  // Bộ đếm thời gian giữ phòng 5 phút (300 giây)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const key = `senviet_checkout_timer_${params.get("hotel") || "draft"}`;
    const saved = sessionStorage.getItem(key);
    const now = Date.now();
    if (saved) {
      const startTime = parseInt(saved, 10);
      const elapsed = Math.floor((now - startTime) / 1000);
      const left = 300 - elapsed;
      if (left > 0) return left;
    }
    sessionStorage.setItem(key, String(now));
    return 300;
  });

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const [selections, setSelections] = useState<RoomSelection[]>(() =>
    parseSelections(params),
  );
  useEffect(() => {
    setSelections(parseSelections(params));
  }, [params]);

  const handleRemoveRoom = (
    roomId: string,
    stayIndex: number,
    roomCode?: string,
  ) => {
    setSelections((current) => {
      const next: RoomSelection[] = [];
      for (const sel of current) {
        if (sel.roomId !== roomId) {
          next.push(sel);
          continue;
        }
        if (sel.quantity <= 1) {
          continue;
        }
        const nextQty = sel.quantity - 1;
        const nextStays = sel.stays
          ? sel.stays.filter((_, i) => i !== stayIndex)
          : undefined;
        const nextGuestForms = (sel.guestForms || []).filter(
          (_, i) => i !== stayIndex,
        );
        const nextRoomCodes = (sel.roomCodes || []).filter(
          (_, i) => i !== stayIndex,
        );
        next.push({
          ...sel,
          quantity: nextQty,
          stays: nextStays,
          guestForms: nextGuestForms,
          roomCodes: nextRoomCodes,
        });
      }
      return next;
    });
  };

  const services = useMemo(() => parseServices(params), [params]);
  const [createCustomerBooking] = useCreateCustomerBookingMutation();
  const { data: activePromotions = [] } = useGetActivePromotionsQuery();

  const { data: savedPromosBackend } = useGetMySavedPromotionsQuery(user?.userId, {
    skip: !user || !user.userId,
  });

  const usedPromoCodesSet = useMemo(() => {
    const set = new Set<string>();
    try {
      const key = `senviet_used_promos_${(user?.email || "guest").toLowerCase()}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => set.add(String(c).trim().toUpperCase()));
        }
      }
    } catch {}
    if (savedPromosBackend) {
      savedPromosBackend
        .filter((sp) => sp.isUsed)
        .forEach((sp) => {
          const codeVal = sp.promotionCode || (sp.code ? sp.code.split("-")[0] : sp.code);
          if (codeVal) set.add(String(codeVal).trim().toUpperCase());
        });
    }
    return set;
  }, [user?.email, savedPromosBackend]);

  useEffect(() => {
    const update = () => {
      const localCodes = getSavedPromotionCodes(user?.email).filter(
        (c) => !usedPromoCodesSet.has(String(c).trim().toUpperCase()),
      );
      const backendCodes = savedPromosBackend
        ? savedPromosBackend
            .filter((sp) => !sp.isUsed)
            .map((sp) => sp.promotionCode || (sp.code ? sp.code.split("-")[0] : sp.code))
        : [];
      const allCodes = Array.from(new Set([...backendCodes, ...localCodes]));
      setSavedPromotionCodes(allCodes);
    };

    update();
    window.addEventListener("senviet_saved_promotions_changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("senviet_saved_promotions_changed", update);
      window.removeEventListener("storage", update);
    };
  }, [user?.email, savedPromosBackend]);

  const hotelTarget = hotel?.name || String(hotelId);

  const savedPromotionItems = useMemo(() => {
    return savedPromotionCodes.map((code) => {
      const cleanCode = code.trim().toUpperCase();
      const rule = PROMOTION_RULES[cleanCode];
      const backendMatch = savedPromosBackend?.find(
        (sp) =>
          (sp.promotionCode && sp.promotionCode.toUpperCase() === cleanCode) ||
          (sp.code && sp.code.toUpperCase().startsWith(cleanCode)),
      );
      const activeMatch = activePromotions.find(
        (ap) => ap.code.trim().toUpperCase() === cleanCode,
      );
      const { applicable, reason } = isPromotionApplicableToHotel(
        code,
        hotelTarget,
      );
      const isAlreadyUsed = Boolean(backendMatch?.isUsed);
      const backendDiscountText = backendMatch
        ? backendMatch.discountType === "PERCENTAGE" || backendMatch.discountValue <= 100
          ? `Giảm ${backendMatch.discountValue}%`
          : `Giảm ${formatVnd(backendMatch.discountValue)}`
        : activeMatch
          ? activeMatch.discountType === "PERCENTAGE" || activeMatch.discountValue <= 100
            ? `Giảm ${activeMatch.discountValue}%`
            : `Giảm ${formatVnd(activeMatch.discountValue)}`
          : undefined;
      return {
        code,
        name:
          rule?.name ||
          backendMatch?.title ||
          activeMatch?.name ||
          promotionNames[code] ||
          "Ưu đãi Sen Việt",
        discountText: rule?.discountText || backendDiscountText,
        applicable: isAlreadyUsed ? false : applicable,
        reason: isAlreadyUsed
          ? (isEn ? "Already used (1 use per account)" : "Mã đã được sử dụng (mỗi tài khoản chỉ dùng 1 lần)")
          : reason,
      };
    });
  }, [savedPromotionCodes, hotelTarget, savedPromosBackend, activePromotions]);

  const promoApplicability = useMemo(() => {
    if (!promo) return { applicable: true };
    return isPromotionApplicableToHotel(promo, hotelTarget);
  }, [promo, hotelTarget]);
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
          staySum +
          (stay.stayTotal ??
            (stay.nightlyPrice || selection.nightlyPrice) *
              Math.max(0, stay.nights)),
        0,
      ),
    0,
  );
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
  const matchedActivePromo = useMemo(() => {
    if (!promo.trim()) return null;
    return activePromotions.find(
      (p) => p.code.trim().toUpperCase() === promo.trim().toUpperCase(),
    );
  }, [promo, activePromotions]);

  const promoMinBookingFailed = useMemo(() => {
    if (!matchedActivePromo || !matchedActivePromo.minBookingValue) return false;
    return roomSubtotal < matchedActivePromo.minBookingValue;
  }, [matchedActivePromo, roomSubtotal]);

  const backendDiscount = useMemo(() => {
    if (!matchedActivePromo || promoMinBookingFailed) return 0;
    const isPercentage =
      matchedActivePromo.discountType === "PERCENTAGE" ||
      String(matchedActivePromo.type).toUpperCase().includes("PERCENT") ||
      matchedActivePromo.discountValue <= 100;

    const scope = String(matchedActivePromo.type).toUpperCase();
    const applicableAmount =
      scope === "SERVICE"
        ? serviceTotal
        : scope === "TOTAL"
        ? roomSubtotal + serviceTotal
        : roomSubtotal;

    if (isPercentage) {
      const calculated = Math.round((applicableAmount * matchedActivePromo.discountValue) / 100);
      return matchedActivePromo.maxDiscountAmount
        ? Math.min(calculated, matchedActivePromo.maxDiscountAmount)
        : calculated;
    }
    return matchedActivePromo.discountValue || 0;
  }, [matchedActivePromo, promoMinBookingFailed, roomSubtotal, serviceTotal]);

  const promoAlreadyUsed = useMemo(() => {
    const clean = promo.trim().toUpperCase();
    if (!clean) return false;
    return usedPromoCodesSet.has(clean);
  }, [promo, usedPromoCodesSet]);

  const standardDiscount = getPromotionDiscount(promo, {
    roomSubtotal,
    serviceTotal,
    nights: totalNights,
    roomCount,
    hotelSlugOrName: hotelTarget,
  });
  const effectiveDiscount = matchedActivePromo ? backendDiscount : standardDiscount;
  const discount = promoAlreadyUsed ? 0 : effectiveDiscount;
  const taxableSubtotal = Math.max(
    0,
    roomSubtotal + extraGuestCharge + serviceTotal - discount,
  );
  const vat = 0; // Website không áp dụng thuế VAT
  const serviceFee = 0;
  const total = taxableSubtotal + vat;
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
      ...(extraGuestCharge > 0
        ? [
            {
              label: "Phụ thu vượt sức chứa",
              amount: extraGuestCharge,
              detail: "Theo chính sách khách sạn (người lớn / trẻ em, miễn phí em bé)",
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
      extraGuestCharge,
      services,
      roomServiceLines,
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
    if (remainingSeconds <= 0) {
      return setError(isEn ? "The 5-minute reservation hold has expired. Please click 'Renew Hold' to continue." : "Đã hết 5 phút giữ phòng tạm thời. Quý khách vui lòng bấm 'Tải lại giữ phòng' để tiếp tục thanh toán.");
    }
    if (promo && promoAlreadyUsed) {
      return setError(isEn ? "This promo code has already been used by your account. Please clear or choose a different code." : "Mã ưu đãi này đã được tài khoản của bạn sử dụng ở đơn trước. Vui lòng xóa mã hoặc chọn mã khác.");
    }
    if (!hotel || !Number.isSafeInteger(hotelId) || hotelId <= 0) {
      return setError(
        hotelsError
          ? (isEn ? "Unable to load hotel information." : "Không thể tải thông tin khách sạn.")
          : (isEn ? "Hotel information is still loading." : "Thông tin khách sạn đang được tải."),
      );
    }
    if (!name || !phone || !email)
      return setError(isEn ? "Please fill in all guest representative information." : "Vui lòng điền đủ thông tin người đại diện nhận phòng.");
    if (!cccd)
      return setError(isEn ? "Please enter the Citizen ID / Passport of the guest representative." : "Vui lòng nhập số CCCD / CMND của người đại diện nhận phòng.");
    const todayStr = toLocalDateStr();
    const pastSelection = selections.find((s) => s.checkIn && s.checkIn < todayStr);
    if (pastSelection) {
      return setError(isEn ? `Check-in date (${pastSelection.checkIn}) is in the past compared to today (${todayStr}). Please choose valid stay dates.` : `Ngày nhận phòng (${pastSelection.checkIn}) đã ở trong quá khứ so với ngày hiện tại (${todayStr}). Vui lòng chọn lại ngày lưu trú.`);
    }
    setError("");
    setPaymentState("processing");

    // Chuẩn bị danh sách chi tiết đặt phòng (BookingDetails) khớp với Backend DTO
    const bookingDetailsPayload = selections.flatMap((selection) => {
      const stays = selectionStays(selection);
      return stays.map((stay, stayIndex) => {
        const rawRoomId = String(stay.roomId || selection.roomId || "");
        let roomId = rawRoomId;
        const typeKey = (selection.roomNameVi || selection.roomName || String(selection.roomId) || "").toLowerCase();
        const suffix = stayIndex > 0 ? "102" : "101";
        const suffixDlx = stayIndex > 0 ? "202" : "201";
        const suffixSui = stayIndex > 0 ? "302" : "301";
        const suffixFam = stayIndex > 0 ? "402" : "401";

        if (!roomId || roomId === "undefined" || roomId === "legacy" || roomId.length < 5 || roomId.startsWith("ROOM20260922")) {
          if (typeKey.includes("tiêu chuẩn") || typeKey.includes("standard") || roomId === "101" || roomId === "102") {
            roomId = `ROOM_H${hotelId}_${suffix}`;
          } else if (typeKey.includes("cao cấp") || typeKey.includes("deluxe") || roomId === "103" || roomId === "104") {
            roomId = `ROOM_H${hotelId}_${suffixDlx}`;
          } else if (typeKey.includes("suite") || roomId === "201" || roomId === "202") {
            roomId = `ROOM_H${hotelId}_${suffixSui}`;
          } else if (typeKey.includes("gia đình") || typeKey.includes("family") || roomId === "203" || roomId === "204") {
            roomId = `ROOM_H${hotelId}_${suffixFam}`;
          } else {
            roomId = `ROOM_H${hotelId}_${suffix}`;
          }
        }
        const checkInTime = `${stay.checkIn || firstCheckIn}T${arrivalTime}:00`;
        const checkOutTime = `${stay.checkOut || lastCheckOut}T${departureTime}:00`;
        const numAdults = stay.guest?.adults ?? 1;
        const numChildren = stay.guest?.children ?? 0;
        const numInfants = stay.guest?.infants ?? 0;
        const nightly = stay.nightlyPrice || selection.nightlyPrice;
        const baseRoomPricePerNight = nightly;
        const roomSubTotal =
          nightly * Math.max(1, stay.nights) +
          (stay.extraGuestCharge || 0) * Math.max(1, stay.nights);
        const serviceRequests = (stay.services || []).map((srv) => ({
          serviceId: String(srv.id || 1),
          quantity: srv.quantity || 1,
          unitPrice: srv.unitPrice || 0,
          totalPrice: srv.total || ((srv.unitPrice || 0) * (srv.quantity || 1)),
        }));
        const serviceSubTotal = (stay.services || []).reduce(
          (s, item) => s + (item.total || (item.unitPrice || 0) * (item.quantity || 1)),
          0,
        );
        const totalPrice = roomSubTotal + serviceSubTotal;

        return {
          roomId,
          checkInTime,
          checkOutTime,
          numAdults,
          numChildren,
          numInfants,
          baseRoomPricePerNight,
          roomSubTotal,
          serviceSubTotal,
          totalPrice,
          serviceRequests: serviceRequests.length ? serviceRequests : undefined,
        };
      });
    });

    let generatedId = "";

    try {
      const rawCustomerId = (user as any)?.customerId || (user as any)?.userId;
      let customerId = String(rawCustomerId || "");
      if (!customerId || customerId === "0" || customerId === "undefined" || customerId === "4" || customerId === "201") {
        if (user?.email === "huynhvanhieu416@gmail.com") customerId = "64375436-23e0-4ff9-b48e-53658df5cb45";
        else if (user?.email === "customer@senviet.vn") customerId = "CUS_201";
        else customerId = user?.email || "CUS_201";
      }
      const cleanPromo = promo.trim().toUpperCase();
      const matchedSavedPromo =
        cleanPromo && !promoMinBookingFailed
          ? savedPromosBackend?.find(
              (sp) =>
                !sp.isUsed &&
                ((sp.promotionCode && sp.promotionCode.toUpperCase() === cleanPromo) ||
                  (sp.code && sp.code.toUpperCase().startsWith(cleanPromo))),
            )
          : undefined;
      const customerPromotionIdToSend = matchedSavedPromo ? String(matchedSavedPromo.id ?? matchedSavedPromo.savedId ?? matchedSavedPromo.promotionId ?? "") : null;
      const promotionIdToSend =
        !customerPromotionIdToSend && matchedActivePromo && !promoMinBookingFailed
          ? String(matchedActivePromo.id)
          : null;
      const res = await createCustomerBooking({
        customerId,
        customerEmail: user?.email,
        hotelId,
        bookingChannel: "ONLINE",
        customerPromotionId: customerPromotionIdToSend,
        promotionId: promotionIdToSend,
        bookingDetails: bookingDetailsPayload,
      }).unwrap();

      if (res && res.bookingId) {
        generatedId = String(res.bookingId);
        if (cleanPromo && !promoAlreadyUsed) {
          try {
            const mapRaw = localStorage.getItem("senviet_booking_promos");
            const map = mapRaw ? JSON.parse(mapRaw) : {};
            map[generatedId] = cleanPromo;
            localStorage.setItem("senviet_booking_promos", JSON.stringify(map));
          } catch {}
        }
      } else {
        throw new Error("Backend không trả về bookingId hợp lệ");
      }
    } catch (err: any) {
      console.error("Lưu booking vào Backend thất bại:", err);
      setPaymentState("idle");
      const errorMsg =
        err?.data?.message ||
        err?.message ||
        "Không thể kết nối đến Backend (Port 8081). Hãy đảm bảo Backend trong IntelliJ đang chạy!";
      setError(`Đặt phòng chưa thành công: ${errorMsg}`);
      return;
    }

    const booking: Booking = {
      id: generatedId,
      userEmail: user.email,
      hotelSlug: String(hotel.id),
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
        (sum, selection) =>
          sum +
          selectionStays(selection).reduce(
            (staySum, stay) =>
              staySum + (stay.nightlyPrice || selection.nightlyPrice),
            0,
          ),
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
      cccd,
      specialRequest: request,
      cancellationDeadline: cancellationDeadlineFor(firstCheckIn),
      cancellationPolicy: getCancellationPolicy(firstCheckIn).policy,
      holdUntil: new Date(Date.now() + 5 * 60000).toISOString(),
      arrivalTime,
      departureTime,
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
          {isEn
            ? "Guest representative information only needs to be entered once. Specific rooms, stay dates, services, and fees are itemized below."
            : "Thông tin người đại diện chỉ cần nhập một lần. Từng phòng cụ thể, khoảng ngày, dịch vụ và phụ phí được liệt kê riêng bên dưới."}
        </p>

        {/* BỘ ĐẾM THỜI GIAN GIỮ PHÒNG 5 PHÚT */}
        <div
          className={`mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4 transition shadow-xs ${
            remainingSeconds > 60
              ? "border-amber-300/90 bg-amber-50/90 dark:border-amber-600/50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200"
              : remainingSeconds > 0
                ? "border-rose-400/90 bg-rose-50/90 dark:border-rose-600/50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 animate-pulse"
                : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                remainingSeconds > 60
                  ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                  : remainingSeconds > 0
                    ? "bg-rose-500/20 text-rose-800 dark:text-rose-300"
                    : "bg-slate-300/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">
                {remainingSeconds > 0
                  ? (isEn ? "Room Reserved Exclusively for You" : "Hệ thống đang tạm giữ phòng cho quý khách")
                  : (isEn ? "Reservation Hold Expired" : "Hết thời gian tạm giữ phòng")}
              </p>
              <p className="text-xs opacity-85 mt-0.5">
                {remainingSeconds > 0
                  ? (isEn
                      ? "Complete booking within 5 minutes to guarantee your rate and room."
                      : "Vui lòng hoàn tất trong vòng 5 phút để đảm bảo phòng không bị mở bán lại cho khách khác.")
                  : (isEn
                      ? "The 5-minute hold window has ended. Please refresh to renew hold."
                      : "Đã quá 5 phút giữ phòng. Vui lòng làm mới trang để tiếp tục giữ phòng.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {remainingSeconds > 0 ? (
              <div className="flex items-center gap-1.5 rounded-xl bg-white/95 dark:bg-slate-800/95 border border-current/25 px-3 py-1.5 shadow-2xs font-mono font-bold text-base">
                <span className="text-xs uppercase tracking-wider opacity-70 font-sans mr-0.5">
                  {isEn ? "Left:" : "Còn lại:"}
                </span>
                <span>{formatCountdown(remainingSeconds)}</span>
              </div>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const key = `senviet_checkout_timer_${params.get("hotel") || "draft"}`;
                  try { sessionStorage.setItem(key, String(Date.now())); } catch {}
                  setRemainingSeconds(300);
                  setError("");
                }}
                className="rounded-full text-xs gap-1.5 border-current hover:bg-current/10"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{isEn ? "Renew Hold" : "Tải lại giữ phòng"}</span>
              </Button>
            )}
          </div>
        </div>
        <form
          onSubmit={submit}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-bold text-primary">
                  {isEn ? "Guest Representative Information" : "Thông tin người đại diện nhận phòng"}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isEn ? "This information applies to all rooms within this reservation." : "Thông tin này áp dụng cho tất cả các phòng trong cùng một lượt đặt."}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-primary">
                  {isEn ? "Full Name" : "Họ tên"}
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background text-foreground p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary">
                  {isEn ? "Phone Number" : "Số điện thoại"}
                  <input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background text-foreground p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary">
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input bg-background text-foreground p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary">
                  {isEn ? "Citizen ID / Passport" : "Số CCCD / CMND"}
                  <input
                    required
                    value={cccd}
                    onChange={(event) => setCccd(event.target.value)}
                    placeholder={isEn ? "Enter Citizen ID / Passport number" : "Nhập số CCCD (12 số)"}
                    className="mt-1 w-full rounded-xl border border-input bg-background text-foreground p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary sm:col-span-2">
                  {isEn ? "Special Requests" : "Yêu cầu đặc biệt"}
                  <textarea
                    value={request}
                    onChange={(event) => setRequest(event.target.value)}
                    rows={3}
                    placeholder={isEn ? "e.g. arrival after 22:00, need baby cot..." : "Ví dụ: đến sau 22:00, cần baby cot..."}
                    className="mt-1 w-full rounded-xl border border-input bg-background text-foreground p-3"
                  />
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl font-bold text-primary">
                {isEn ? "Payment Method" : "Phương thức thanh toán"}
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["qr", isEn ? "Bank QR Code" : "Quét mã ngân hàng", QrCode],
                    ["cash", isEn ? "Pay at Front Desk" : "Tiền mặt tại lễ tân", Banknote],
                    ["vnpay", isEn ? "VNPay / E-wallet" : "VNPay / ví điện tử", CreditCard],
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
              {payment === "cash" && (
                <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                  <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div>
                    <span className="font-semibold text-amber-950">{isEn ? "Demo Mode:" : "Chế độ Thử nghiệm (Demo):"}</span>{" "}
                    {isEn ? "Reservation will be held in 'Pending payment at front desk' status." : 'Đơn đặt phòng sẽ được giữ chỗ ở trạng thái "Chờ thanh toán tại quầy".'}
                  </div>
                </div>
              )}
            </div>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </section>
          <BookingSummaryPanel
            hotelName={
              hotel?.name ||
              (hotelsLoading
                ? (isEn ? "Loading hotel…" : "Đang tải khách sạn…")
                : (isEn ? "Hotel" : "Khách sạn"))
            }
            selections={selections}
            arrivalTime={arrivalTime}
            departureTime={departureTime}
            onRemoveRoom={handleRemoveRoom}
            fallbackServices={services}
            totals={{
              subtotal: subtotalBeforeDiscount,
              commonFeeRows: commonFeeLines.map((fee) => ({
                label: fee.label,
                amount: fee.amount,
                detail: fee.detail,
              })),
              vatAndSystemFee: vat,
              discount,
              total,
            }}
            promo={
              <div className="mt-5 space-y-2">
                <label className="block text-sm font-medium text-primary">
                  {isEn ? "Promo code" : "Mã khuyến mãi"}
                  <div className="mt-1 flex gap-2">
                    <input
                      value={promo}
                      onChange={(event) =>
                        setPromo(event.target.value.toUpperCase().trim())
                      }
                      placeholder={isEn ? "Enter or select promo code" : "Nhập hoặc chọn mã ưu đãi"}
                      className="w-full rounded-xl border border-input bg-background p-3 font-mono font-bold uppercase tracking-wider text-primary"
                    />
                    {promo && (
                      <button
                        type="button"
                        onClick={() => setPromo("")}
                        className="shrink-0 whitespace-nowrap rounded-xl border border-input px-4 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-primary"
                      >
                        {isEn ? "Remove" : "Xóa"}
                      </button>
                    )}
                  </div>
                </label>
                {promo && promoAlreadyUsed && (
                  <p className="rounded-lg bg-rose-50 p-2 text-xs font-medium text-rose-700">
                    ✕ {isEn ? "You have already used this promo code on a previous booking. Each account may use it once." : "Bạn đã sử dụng mã ưu đãi này cho một đơn đặt phòng thành công trước đó. Mỗi tài khoản chỉ dùng 1 lần."}
                  </p>
                )}
                {promo && !promoAlreadyUsed && !promoApplicability.applicable && (
                  <p className="rounded-lg bg-rose-50 p-2 text-xs font-medium text-rose-700">
                    ✕ {promoApplicability.reason || "Mã không áp dụng cho khách sạn này."}
                  </p>
                )}
                {promo && !promoAlreadyUsed && promoMinBookingFailed && (
                  <p className="rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">
                    ⚠ Mã {matchedActivePromo?.code} yêu cầu giá trị tiền phòng tối thiểu {matchedActivePromo?.minBookingValue?.toLocaleString("vi-VN")}đ (hiện tại: {roomSubtotal.toLocaleString("vi-VN")}đ).
                  </p>
                )}
                {promo && !promoAlreadyUsed && promoApplicability.applicable && !promoMinBookingFailed && discount === 0 && (
                  <p className="rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">
                    ⚠ Mã chưa đủ điều kiện cho đơn này (ví dụ: số đêm tối thiểu).
                  </p>
                )}
                {promo && discount > 0 && (
                  <p className="rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">
                    ✓ Áp dụng thành công: giảm {formatVnd(discount)}
                  </p>
                )}
              </div>
            }
            savedPromotions={savedPromotionItems}
            selectedPromotionCode={promo}
            onSelectPromotion={setPromo}
            cta={
              <>
                <Button
                  type="submit"
                  disabled={paymentState === "processing" || remainingSeconds <= 0}
                  className="w-full rounded-xl"
                >
                  {paymentState === "processing"
                    ? (isEn ? "Processing..." : "Đang tạo đơn...")
                    : (isEn ? "Confirm Booking" : "Xác nhận đặt phòng")}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  {isEn ? "Check-in 14:00 · Check-out 12:00 · Room held for 5 minutes." : "Nhận phòng từ 14:00 · Trả phòng trước 12:00 · Giữ phòng 5 phút."}
                </p>
              </>
            }
          />
        </form>
      </div>
    </main>
  );
}
