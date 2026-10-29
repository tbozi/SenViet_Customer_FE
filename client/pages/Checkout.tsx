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
import { formatVnd, hotels, hotelSlugToId } from "@/data/hotels";
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
  const roomName = params.get("room") || "PhÃƒÂ²ng TiÃƒÂªu ChuÃ¡ÂºÂ©n";
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
      offerName: "GÃƒÂ³i Ã†Â°u Ã„â€˜ÃƒÂ£i Ã„â€˜ÃƒÂ£ chÃ¡Â»Ân",
      offerCancellationPolicy: "Theo chÃƒÂ­nh sÃƒÂ¡ch cÃ¡Â»Â§a booking.",
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
    roomCode: selection.roomCodes?.[index] || `PhÃƒÂ²ng ${index + 1}`,
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
  const checkInDate = new Date(`${checkIn}T00:00:00`);
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysBefore = Math.floor(
    (checkInDate.getTime() - todayDate.getTime()) / 86400000,
  );

  if (daysBefore >= 7) {
    const deadline = new Date(checkInDate);
    deadline.setDate(deadline.getDate() - 7);
    return deadline.toISOString();
  }
  if (daysBefore >= 3) {
    const deadline = new Date(checkInDate);
    deadline.setDate(deadline.getDate() - 3);
    return deadline.toISOString();
  }
  return "";
};

export default function Checkout() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hotel =
    hotels.find((item) => item.slug === params.get("hotel")) || hotels[0];
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

  useEffect(() => {
    const update = () => {
      const localCodes = getSavedPromotionCodes(user?.email);
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

  const hotelTarget = hotel.slug || hotel.name;

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
      const backendDiscountText = backendMatch
        ? backendMatch.discountType === "PERCENTAGE" || backendMatch.discountValue <= 100
          ? `GiÃ¡ÂºÂ£m ${backendMatch.discountValue}%`
          : `GiÃ¡ÂºÂ£m ${formatVnd(backendMatch.discountValue)}`
        : activeMatch
          ? activeMatch.discountType === "PERCENTAGE" || activeMatch.discountValue <= 100
            ? `GiÃ¡ÂºÂ£m ${activeMatch.discountValue}%`
            : `GiÃ¡ÂºÂ£m ${formatVnd(activeMatch.discountValue)}`
          : undefined;
      return {
        code,
        name:
          rule?.name ||
          backendMatch?.title ||
          activeMatch?.name ||
          promotionNames[code] ||
          "Ã†Â¯u Ã„â€˜ÃƒÂ£i Sen ViÃ¡Â»â€¡t",
        discountText: rule?.discountText || backendDiscountText,
        applicable,
        reason,
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

  const isDemoPromo =
    promo.trim().toUpperCase() === "DEMO" ||
    promo.trim().toUpperCase() === "TESTPAY";
  const standardDiscount = getPromotionDiscount(promo, {
    roomSubtotal,
    serviceTotal,
    nights: totalNights,
    roomCount,
    hotelSlugOrName: hotelTarget,
  });
  const effectiveDiscount = matchedActivePromo ? backendDiscount : standardDiscount;
  const discount = isDemoPromo
    ? Math.max(0, roomSubtotal + extraGuestCharge + serviceTotal - 1852)
    : effectiveDiscount;
  const taxableSubtotal = Math.max(
    0,
    roomSubtotal + extraGuestCharge + serviceTotal - discount,
  );
  const vat = Math.round(taxableSubtotal * 0.08);
  const serviceFee = 0;
  const total = isDemoPromo ? 2000 : taxableSubtotal + vat;
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
              label: "PhÃ¡Â»Â¥ thu vÃ†Â°Ã¡Â»Â£t sÃ¡Â»Â©c chÃ¡Â»Â©a",
              amount: extraGuestCharge,
              detail: "Theo chÃƒÂ­nh sÃƒÂ¡ch khÃƒÂ¡ch sÃ¡ÂºÂ¡n (ngÃ†Â°Ã¡Â»Âi lÃ¡Â»â€ºn / trÃ¡ÂºÂ» em, miÃ¡Â»â€¦n phÃƒÂ­ em bÃƒÂ©)",
              scope: "room" as const,
              kind: "surcharge" as const,
            },
          ]
        : []),
      ...(roomServiceLines.length ? roomServiceLines : services).map(
        (service) => ({
          label: `${service.roomCode ? `${service.roomName || "PhÃƒÂ²ng"} Ã‚Â· ${service.roomCode} Ã¢â‚¬â€ ` : ""}DÃ¡Â»â€¹ch vÃ¡Â»Â¥: ${service.name}`,
          amount: service.total,
          detail: `${service.quantity} Ã„â€˜Ã†Â¡n vÃ¡Â»â€¹ Ãƒâ€” ${formatVnd(service.unitPrice)}`,
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
            ThÃƒÂ´ng tin Ã„â€˜Ã¡ÂºÂ·t phÃƒÂ²ng chÃ†Â°a Ã„â€˜Ã¡ÂºÂ§y Ã„â€˜Ã¡Â»Â§
          </h1>
          <p className="mt-3 text-muted-foreground">
            Vui lÃƒÂ²ng chÃ¡Â»Ân khÃƒÂ¡ch sÃ¡ÂºÂ¡n, ngÃƒÂ y lÃ†Â°u trÃƒÂº hÃ¡Â»Â£p lÃ¡Â»â€¡ vÃƒÂ  ÃƒÂ­t nhÃ¡ÂºÂ¥t mÃ¡Â»â„¢t loÃ¡ÂºÂ¡i
            phÃƒÂ²ng trÃ†Â°Ã¡Â»â€ºc khi thanh toÃƒÂ¡n.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/hotels">ChÃ¡Â»Ân phÃƒÂ²ng</Link>
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
              ? "Ã„ÂÃ„Æ’ng nhÃ¡ÂºÂ­p Ã„â€˜Ã¡Â»Æ’ thanh toÃƒÂ¡n"
              : "Log in to continue"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {language === "vi"
              ? "BÃ¡ÂºÂ¡n cÃƒÂ³ thÃ¡Â»Æ’ Ã„â€˜Ã„Æ’ng kÃƒÂ½ ngay hoÃ¡ÂºÂ·c Ã„â€˜Ã„Æ’ng nhÃ¡ÂºÂ­p trÃ†Â°Ã¡Â»â€ºc khi hoÃƒÂ n tÃ¡ÂºÂ¥t Ã„â€˜Ã¡ÂºÂ·t phÃƒÂ²ng."
              : "Sign up or log in before completing your reservation."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link
                to="/register"
                state={{ from: `${location.pathname}${location.search}` }}
              >
                Ã„ÂÃ„Æ’ng kÃƒÂ½
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link
                to="/login"
                state={{ from: `${location.pathname}${location.search}` }}
              >
                Ã„ÂÃ„Æ’ng nhÃ¡ÂºÂ­p
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name || !phone || !email)
      return setError("Vui lÃƒÂ²ng Ã„â€˜iÃ¡Â»Ân Ã„â€˜Ã¡Â»Â§ thÃƒÂ´ng tin ngÃ†Â°Ã¡Â»Âi Ã„â€˜Ã¡ÂºÂ¡i diÃ¡Â»â€¡n nhÃ¡ÂºÂ­n phÃƒÂ²ng.");
    if (!cccd)
      return setError("Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p sÃ¡Â»â€˜ CCCD / CMND cÃ¡Â»Â§a ngÃ†Â°Ã¡Â»Âi Ã„â€˜Ã¡ÂºÂ¡i diÃ¡Â»â€¡n nhÃ¡ÂºÂ­n phÃƒÂ²ng.");
    setError("");
    setPaymentState("processing");

    const hotelId = hotel.id || (hotel.slug ? hotelSlugToId[hotel.slug] : 1) || 1;

    // ChuÃ¡ÂºÂ©n bÃ¡Â»â€¹ danh sÃƒÂ¡ch chi tiÃ¡ÂºÂ¿t Ã„â€˜Ã¡ÂºÂ·t phÃƒÂ²ng (BookingDetails) khÃ¡Â»â€ºp vÃ¡Â»â€ºi Backend DTO
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
          if (typeKey.includes("tiÃƒÂªu chuÃ¡ÂºÂ©n") || typeKey.includes("standard") || roomId === "101" || roomId === "102") {
            roomId = `ROOM_H${hotelId}_${suffix}`;
          } else if (typeKey.includes("cao cÃ¡ÂºÂ¥p") || typeKey.includes("deluxe") || roomId === "103" || roomId === "104") {
            roomId = `ROOM_H${hotelId}_${suffixDlx}`;
          } else if (typeKey.includes("suite") || roomId === "201" || roomId === "202") {
            roomId = `ROOM_H${hotelId}_${suffixSui}`;
          } else if (typeKey.includes("gia Ã„â€˜ÃƒÂ¬nh") || typeKey.includes("family") || roomId === "203" || roomId === "204") {
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
      const hotelId = hotel.id || (hotel.slug ? hotelSlugToId[hotel.slug] : 1) || 1;
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
      } else {
        throw new Error("Backend khÃƒÂ´ng trÃ¡ÂºÂ£ vÃ¡Â»Â bookingId hÃ¡Â»Â£p lÃ¡Â»â€¡");
      }
    } catch (err: any) {
      console.error("LÃ†Â°u booking vÃƒÂ o Backend thÃ¡ÂºÂ¥t bÃ¡ÂºÂ¡i:", err);
      setPaymentState("idle");
      const errorMsg =
        err?.data?.message ||
        err?.message ||
        "KhÃƒÂ´ng thÃ¡Â»Æ’ kÃ¡ÂºÂ¿t nÃ¡Â»â€˜i Ã„â€˜Ã¡ÂºÂ¿n Backend (Port 8081). HÃƒÂ£y Ã„â€˜Ã¡ÂºÂ£m bÃ¡ÂºÂ£o Backend trong IntelliJ Ã„â€˜ang chÃ¡ÂºÂ¡y!";
      setError(`Ã„ÂÃ¡ÂºÂ·t phÃƒÂ²ng chÃ†Â°a thÃƒÂ nh cÃƒÂ´ng: ${errorMsg}`);
      return;
    }

    const booking: Booking = {
      id: generatedId,
      userEmail: user.email,
      hotelSlug: hotel.slug,
      hotelName: hotel.name,
      roomName: selections
        .map((selection) => `${selection.roomNameVi} Ãƒâ€” ${selection.quantity}`)
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
          Sen ViÃ¡Â»â€¡t checkout
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary">
          {language === "vi" ? "XÃƒÂ¡c nhÃ¡ÂºÂ­n Ã„â€˜Ã¡ÂºÂ·t phÃƒÂ²ng" : "Confirm your booking"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ThÃƒÂ´ng tin ngÃ†Â°Ã¡Â»Âi Ã„â€˜Ã¡ÂºÂ¡i diÃ¡Â»â€¡n chÃ¡Â»â€° cÃ¡ÂºÂ§n nhÃ¡ÂºÂ­p mÃ¡Â»â„¢t lÃ¡ÂºÂ§n. TÃ¡Â»Â«ng phÃƒÂ²ng cÃ¡Â»Â¥ thÃ¡Â»Æ’,
          khoÃ¡ÂºÂ£ng ngÃƒÂ y, dÃ¡Â»â€¹ch vÃ¡Â»Â¥ vÃƒÂ  phÃ¡Â»Â¥ phÃƒÂ­ Ã„â€˜Ã†Â°Ã¡Â»Â£c liÃ¡Â»â€¡t kÃƒÂª riÃƒÂªng bÃƒÂªn dÃ†Â°Ã¡Â»â€ºi.
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
                  ThÃƒÂ´ng tin ngÃ†Â°Ã¡Â»Âi Ã„â€˜Ã¡ÂºÂ¡i diÃ¡Â»â€¡n nhÃ¡ÂºÂ­n phÃƒÂ²ng
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                ThÃƒÂ´ng tin nÃƒÂ y ÃƒÂ¡p dÃ¡Â»Â¥ng cho tÃ¡ÂºÂ¥t cÃ¡ÂºÂ£ cÃƒÂ¡c phÃƒÂ²ng trong cÃƒÂ¹ng mÃ¡Â»â„¢t lÃ†Â°Ã¡Â»Â£t
                Ã„â€˜Ã¡ÂºÂ·t.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-primary">
                  HÃ¡Â»Â tÃƒÂªn
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary">
                  SÃ¡Â»â€˜ Ã„â€˜iÃ¡Â»â€¡n thoÃ¡ÂºÂ¡i
                  <input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary">
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary">
                  SÃ¡Â»â€˜ CCCD / CMND
                  <input
                    required
                    value={cccd}
                    onChange={(event) => setCccd(event.target.value)}
                    placeholder="NhÃ¡ÂºÂ­p sÃ¡Â»â€˜ CCCD (12 sÃ¡Â»â€˜)"
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
                <label className="text-sm font-medium text-primary sm:col-span-2">
                  YÃƒÂªu cÃ¡ÂºÂ§u Ã„â€˜Ã¡ÂºÂ·c biÃ¡Â»â€¡t
                  <textarea
                    value={request}
                    onChange={(event) => setRequest(event.target.value)}
                    rows={3}
                    placeholder="VÃƒÂ­ dÃ¡Â»Â¥: Ã„â€˜Ã¡ÂºÂ¿n sau 22:00, cÃ¡ÂºÂ§n baby cot..."
                    className="mt-1 w-full rounded-xl border border-input p-3"
                  />
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl font-bold text-primary">
                PhÃ†Â°Ã†Â¡ng thÃ¡Â»Â©c thanh toÃƒÂ¡n
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["qr", "QuÃƒÂ©t mÃƒÂ£ ngÃƒÂ¢n hÃƒÂ ng", QrCode],
                    ["cash", "TiÃ¡Â»Ân mÃ¡ÂºÂ·t tÃ¡ÂºÂ¡i lÃ¡Â»â€¦ tÃƒÂ¢n", Banknote],
                    ["vnpay", "VNPay / vÃƒÂ­ Ã„â€˜iÃ¡Â»â€¡n tÃ¡Â»Â­", CreditCard],
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
                    <span className="font-semibold text-amber-950">Chế độ Thử nghiệm (Demo):</span>{" "}
                    Đơn đặt phòng sẽ được giữ chỗ ở trạng thái &quot;Chờ thanh toán tại quầy&quot;. Quý khách sẽ thanh toán tiền mặt trực tiếp cho Lễ tân khi làm thủ tục Check-in (không mất phí tài khoản online).
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
            hotelName={hotel.name}
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
                  MÃƒÂ£ khuyÃ¡ÂºÂ¿n mÃƒÂ£i
                  <div className="mt-1 flex gap-2">
                    <input
                      value={promo}
                      onChange={(event) =>
                        setPromo(event.target.value.toUpperCase().trim())
                      }
                      placeholder="NhÃ¡ÂºÂ­p hoÃ¡ÂºÂ·c chÃ¡Â»Ân mÃƒÂ£ Ã†Â°u Ã„â€˜ÃƒÂ£i"
                      className="w-full rounded-xl border border-input p-3 font-mono font-bold uppercase tracking-wider text-primary"
                    />
                    {promo && (
                      <button
                        type="button"
                        onClick={() => setPromo("")}
                        className="shrink-0 whitespace-nowrap rounded-xl border border-input px-4 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-primary"
                      >
                        XÃƒÂ³a
                      </button>
                    )}
                  </div>
                </label>
                {promo && !promoApplicability.applicable && (
                  <p className="rounded-lg bg-rose-50 p-2 text-xs font-medium text-rose-700">
                    Ã¢Å“â€¢ {promoApplicability.reason || "MÃƒÂ£ khÃƒÂ´ng ÃƒÂ¡p dÃ¡Â»Â¥ng cho khÃƒÂ¡ch sÃ¡ÂºÂ¡n nÃƒÂ y."}
                  </p>
                )}
                {promo && promoMinBookingFailed && (
                  <p className="rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">
                    Ã¢Å¡Â  MÃƒÂ£ {matchedActivePromo?.code} yÃƒÂªu cÃ¡ÂºÂ§u giÃƒÂ¡ trÃ¡Â»â€¹ tiÃ¡Â»Ân phÃƒÂ²ng tÃ¡Â»â€˜i thiÃ¡Â»Æ’u {matchedActivePromo?.minBookingValue?.toLocaleString("vi-VN")}Ã„â€˜ (hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i: {roomSubtotal.toLocaleString("vi-VN")}Ã„â€˜).
                  </p>
                )}
                {promo && promoApplicability.applicable && !promoMinBookingFailed && discount === 0 && (
                  <p className="rounded-lg bg-amber-50 p-2 text-xs font-medium text-amber-800">
                    Ã¢Å¡Â  MÃƒÂ£ chÃ†Â°a Ã„â€˜Ã¡Â»Â§ Ã„â€˜iÃ¡Â»Âu kiÃ¡Â»â€¡n cho Ã„â€˜Ã†Â¡n nÃƒÂ y (vÃƒÂ­ dÃ¡Â»Â¥: sÃ¡Â»â€˜ Ã„â€˜ÃƒÂªm tÃ¡Â»â€˜i thiÃ¡Â»Æ’u).
                  </p>
                )}
                {promo && discount > 0 && (
                  <p className="rounded-lg bg-emerald-50 p-2 text-xs font-semibold text-emerald-700">
                    Ã¢Å“â€œ ÃƒÂp dÃ¡Â»Â¥ng thÃƒÂ nh cÃƒÂ´ng: giÃ¡ÂºÂ£m {formatVnd(discount)} {isDemoPromo ? "(ChÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ Demo: TÃ¡Â»â€¢ng tiÃ¡Â»Ân 2.000Ã„â€˜)" : ""}
                  </p>
                )}

                {/* NÃƒÂºt bÃ¡ÂºÂ¥m nhanh chÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ Demo Ã„ÂÃ¡Â»â€œ ÃƒÂ¡n 2.000Ã„â€˜ */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setPromo("DEMO")}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                      promo === "DEMO"
                        ? "border-emerald-500 bg-emerald-100/80 text-emerald-900 font-bold"
                        : "border-dashed border-emerald-400 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white font-bold">Ã¢Å¡Â¡</span>
                      <span>ChÃ¡ÂºÂ¿ Ã„â€˜Ã¡Â»â„¢ Demo (Thanh toÃƒÂ¡n 2.000Ã„â€˜)</span>
                    </span>
                    <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {promo === "DEMO" ? "Ã„Âang ÃƒÂ¡p dÃ¡Â»Â¥ng" : "BÃ¡ÂºÂ­t mÃƒÂ£ DEMO"}
                    </span>
                  </button>
                </div>
              </div>
            }
            savedPromotions={savedPromotionItems}
            selectedPromotionCode={promo}
            onSelectPromotion={setPromo}
            cta={
              <>
                <Button
                  type="submit"
                  disabled={paymentState === "processing"}
                  className="w-full rounded-xl"
                >
                  {paymentState === "processing"
                    ? "Ã„Âang tÃ¡ÂºÂ¡o Ã„â€˜Ã†Â¡n..."
                    : "XÃƒÂ¡c nhÃ¡ÂºÂ­n Ã„â€˜Ã¡ÂºÂ·t phÃƒÂ²ng"}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  NhÃ¡ÂºÂ­n phÃƒÂ²ng tÃ¡Â»Â« 14:00 Ã‚Â· TrÃ¡ÂºÂ£ phÃƒÂ²ng trÃ†Â°Ã¡Â»â€ºc 12:00 Ã‚Â· GiÃ¡Â»Â¯ phÃƒÂ²ng 15
                  phÃƒÂºt.
                </p>
              </>
            }
          />
        </form>
      </div>
    </main>
  );
}
