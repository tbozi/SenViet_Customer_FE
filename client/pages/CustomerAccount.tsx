import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleUserRound,
  Copy,
  CreditCard,
  FileText,
  Headphones,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  User,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getBookings, Booking } from "@/lib/bookings";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useGetMyBookingsQuery } from "@/services/bookingApi";
import {
  useGetActivePromotionsQuery,
  useGetMySavedPromotionsQuery,
  useUnsavePromotionMutation,
} from "@/services/promotionApi";
import {
  getSavedPromotionCodes,
  toggleSavedPromotion,
} from "@/lib/savedPromotions";
import { formatVnd } from "@/data/hotels";

export default function CustomerAccount() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isEn = language === "en";

  const [activeTab, setActiveTab] = useState<"bookings" | "vouchers">("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [localSavedCodes, setLocalSavedCodes] = useState<string[]>(() =>
    getSavedPromotionCodes(user?.email),
  );

  const { data: serverBookings } = useGetMyBookingsQuery(undefined, {
    skip: !user,
  });

  const { data: savedPromosBackend, refetch: refetchSavedPromos } =
    useGetMySavedPromotionsQuery(user?.userId, {
      skip: !user,
    });

  const { data: activePromotions = [] } = useGetActivePromotionsQuery();
  const [unsavePromotion] = useUnsavePromotionMutation();

  useEffect(() => {
    setLocalSavedCodes(getSavedPromotionCodes(user?.email));
  }, [user?.email]);

  useEffect(() => {
    const local = user
      ? getBookings().filter((item) => item.userEmail === user.email)
      : [];
    if (!serverBookings || !Array.isArray(serverBookings) || serverBookings.length === 0) {
      setBookings(local);
      return;
    }

    const serverMapped: Booking[] = serverBookings.map((sb) => {
      let status: Booking["status"] = "confirmed";
      const rawStatus = (sb.bookingStatus || "").toUpperCase();
      if (rawStatus === "PENDING") {
        status = "pending_payment";
      } else if (rawStatus === "CANCELLED" || rawStatus === "REFUNDED") {
        status = "cancelled";
      } else if (
        rawStatus === "COMPLETED" ||
        rawStatus === "CHECKED_OUT" ||
        rawStatus === "CHECKED_IN"
      ) {
        status = "completed";
      } else {
        status = "confirmed";
      }

      const firstDetail = sb.bookingDetails?.[0];
      const hotelName =
        firstDetail?.room?.hotel?.hotelName || "Sen Việt Hotel & Resort";
      const hotelSlug =
        firstDetail?.room?.hotel?.hotelSlug || "sen-viet-sai-gon";
      const roomName =
        sb.bookingDetails
          ?.map((d: any) => d.room?.roomName || d.roomTypeName || "Phòng nghỉ")
          .join(", ") || "Phòng nghỉ tiêu chuẩn";

      const checkIn = firstDetail?.checkInTime
        ? String(firstDetail.checkInTime).slice(0, 10)
        : "";
      const checkOut = firstDetail?.checkOutTime
        ? String(firstDetail.checkOutTime).slice(0, 10)
        : "";
      const nights =
        checkIn && checkOut
          ? Math.max(
              1,
              Math.round(
                (new Date(checkOut).getTime() -
                  new Date(checkIn).getTime()) /
                  (1000 * 3600 * 24),
              ),
            )
          : 1;

      return {
        id: String(sb.bookingId),
        userEmail: user?.email || "",
        hotelSlug,
        hotelName,
        roomName,
        checkIn,
        checkOut,
        nights,
        rooms: sb.bookingDetails?.length || 1,
        roomPrice: sb.roomTotal || 0,
        roomTotal: sb.roomTotal || 0,
        vat: 0,
        serviceFee: sb.serviceTotal || 0,
        discount: sb.discountTotal || 0,
        total: sb.finalAmount || 0,
        paymentMethod: "qr",
        status,
        createdAt: sb.createdAt || new Date().toISOString(),
        guestName: sb.customerName || user?.name || "Khách hàng",
        phone: "",
        email: user?.email || "",
        specialRequest: "",
        cancellationDeadline: checkIn ? `${checkIn}T14:00:00` : "",
        holdUntil: new Date(Date.now() + 5 * 60000).toISOString(),
      };
    });

    const map = new Map<string, Booking>();
    for (const b of local) {
      map.set(String(b.id), b);
    }
    for (const sb of serverMapped) {
      const existing = map.get(String(sb.id));
      if (existing) {
        map.set(String(sb.id), {
          ...existing,
          status: sb.status,
          total: sb.total || existing.total,
          roomTotal: sb.roomTotal || existing.roomTotal,
        });
      } else {
        map.set(String(sb.id), sb);
      }
    }

    const merged = Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );
    setBookings(merged);
  }, [user?.email, user?.name, serverBookings]);

  const active = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "pending_payment" ||
          booking.status === "confirmed",
      ),
    [bookings],
  );

  // Danh sách ưu đãi đã lưu tổng hợp từ cả Backend và LocalStorage
  const savedPromotions = useMemo(() => {
    const list: Array<{
      id: string | number;
      savedId?: number | string;
      code: string;
      title: string;
      description?: string;
      discountText: string;
      hotelName?: string;
      isUsed?: boolean;
      startDate?: string;
      endDate?: string;
      minValue?: number;
    }> = [];

    const addedCodes = new Set<string>();

    if (savedPromosBackend && Array.isArray(savedPromosBackend)) {
      for (const sp of savedPromosBackend) {
        const cleanCode = (sp.promotionCode || sp.code || "").toUpperCase();
        if (!cleanCode) continue;
        addedCodes.add(cleanCode);

        const discountText =
          sp.discountType === "PERCENTAGE" || Number(sp.discountValue) <= 100
            ? `Giảm ${sp.discountValue}%`
            : `Giảm ${formatVnd(Number(sp.discountValue || 0))}`;

        list.push({
          id: sp.id || cleanCode,
          savedId: sp.savedId || sp.id,
          code: cleanCode,
          title: sp.title || sp.name || `Ưu đãi ${cleanCode}`,
          description: sp.description,
          discountText,
          hotelName: sp.hotelName || "Toàn hệ thống",
          isUsed: sp.isUsed || false,
          startDate: sp.startDate,
          endDate: sp.endDate,
          minValue: sp.minBookingValue,
        });
      }
    }

    for (const code of localSavedCodes) {
      const cleanCode = code.toUpperCase();
      if (addedCodes.has(cleanCode)) continue;
      addedCodes.add(cleanCode);

      const activeMatch = activePromotions.find(
        (ap) => ap.code.trim().toUpperCase() === cleanCode,
      );

      const discountText = activeMatch
        ? activeMatch.discountType === "PERCENTAGE" ||
          Number(activeMatch.discountValue) <= 100
          ? `Giảm ${activeMatch.discountValue}%`
          : `Giảm ${formatVnd(Number(activeMatch.discountValue || 0))}`
        : "Ưu đãi đặc quyền";

      list.push({
        id: cleanCode,
        code: cleanCode,
        title: activeMatch?.name || `Mã ưu đãi ${cleanCode}`,
        description: activeMatch?.description,
        discountText,
        hotelName: activeMatch?.hotelName || "Toàn hệ thống",
        isUsed: false,
        startDate: activeMatch?.startDate,
        endDate: activeMatch?.endDate,
        minValue: activeMatch?.minBookingValue,
      });
    }

    return list;
  }, [savedPromosBackend, localSavedCodes, activePromotions]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode((curr) => (curr === code ? null : curr));
    }, 2000);
  };

  const handleUnsave = async (promo: {
    id: string | number;
    savedId?: number | string;
    code: string;
  }) => {
    if (user?.email) {
      toggleSavedPromotion(user.email, promo.code);
      setLocalSavedCodes(getSavedPromotionCodes(user.email));
    }
    if (promo.savedId) {
      try {
        await unsavePromotion(promo.savedId).unwrap();
        if (refetchSavedPromos) refetchSavedPromos();
      } catch (err) {
        console.warn("Lỗi khi hủy lưu khuyến mãi phía BE:", err);
      }
    }
  };

  const handleOpenAiAssistant = () => {
    window.dispatchEvent(new Event("senviet:open-chat"));
  };

  if (!user) {
    return (
      <main className="container flex min-h-[55vh] items-center justify-center py-16">
        <div className="text-center">
          <CircleUserRound className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h1 className="mt-4 font-display text-2xl font-bold text-primary">
            {t("auth.loginPrompt")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.loginToContinue")}
          </p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link to="/login">{t("auth.login")}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-8 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* HERO BANNER SANG TRỌNG */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0c2238] via-[#112a45] to-[#183b5e] p-6 text-white shadow-md sm:p-8 border border-[#1d436a]">
          <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-2xl font-bold text-slate-950 shadow-inner ring-2 ring-amber-300/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-amber-200 backdrop-blur-sm">
                  <User className="h-3 w-3" />
                  {isEn ? "Customer Account" : "Tài khoản khách hàng"}
                </span>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {isEn ? `Welcome, ${user.name}` : `Xin chào, ${user.name}`}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  {user.email} {user.phone ? `· ${user.phone}` : ""}
                </p>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="rounded-full border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white transition self-start sm:self-auto shrink-0"
            >
              <Link to="/profile" className="flex items-center gap-1.5">
                <CircleUserRound className="h-4 w-4" />
                <span>{t("profile.personalInfo")}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* 2 THẺ THỐNG KÊ GỌN GÀNG (ĐÃ ẨN ĐIỂM THƯỞNG & HẠNG THÀNH VIÊN) */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Thẻ Đặt phòng */}
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
              activeTab === "bookings"
                ? "border-primary bg-primary/[0.03] shadow-sm ring-1 ring-primary/20"
                : "border-border/80 bg-card hover:border-border hover:shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                activeTab === "bookings" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              }`}>
                <CalendarDays className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-2xl font-bold text-primary">
                  {active.length}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {isEn ? "Active Bookings" : "Đặt phòng đang hoạt động"}
                </p>
              </div>
            </div>
            <span className={`text-xs font-semibold flex items-center gap-1 ${
              activeTab === "bookings" ? "text-primary" : "text-muted-foreground"
            }`}>
              {isEn ? "View" : "Xem"}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>

          {/* Thẻ Ưu đãi đã lưu */}
          <button
            type="button"
            onClick={() => setActiveTab("vouchers")}
            className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
              activeTab === "vouchers"
                ? "border-amber-500 bg-amber-500/[0.04] shadow-sm ring-1 ring-amber-500/20"
                : "border-border/80 bg-card hover:border-border hover:shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl transition ${
                activeTab === "vouchers" ? "bg-amber-500 text-white" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}>
                <Ticket className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-2xl font-bold text-primary">
                  {savedPromotions.length}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {isEn ? "Saved Vouchers" : "Ưu đãi & Voucher đã lưu"}
                </p>
              </div>
            </div>
            <span className={`text-xs font-semibold flex items-center gap-1 ${
              activeTab === "vouchers" ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
            }`}>
              {isEn ? "View" : "Xem"}
              <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>

        {/* KHU VỰC CHÍNH (2 CỘT CÂN ĐỐI) */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* CỘT TRÁI: TAB NỘI DUNG (ĐẶT PHÒNG / ƯU ĐÃI) */}
          <div className="space-y-4">
            {/* Thanh Tab chuyển đổi thông minh */}
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("bookings")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "bookings"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>{isEn ? "My Bookings" : "Đặt phòng của tôi"}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === "bookings"
                      ? "bg-primary-foreground/20 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {active.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("vouchers")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    activeTab === "vouchers"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Ticket className="h-4 w-4" />
                  <span>{isEn ? "Saved Offers" : "Ưu đãi đã lưu"}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    activeTab === "vouchers"
                      ? "bg-primary-foreground/20 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {savedPromotions.length}
                  </span>
                </button>
              </div>

              {activeTab === "bookings" && (
                <Link
                  to="/bookings"
                  className="hidden sm:flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <span>{isEn ? "Booking history" : "Lịch sử đặt phòng"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}

              {activeTab === "vouchers" && (
                <Link
                  to="/offers"
                  className="hidden sm:flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isEn ? "Explore offers" : "Khám phá thêm"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            {/* TAB 1: ĐẶT PHÒNG CỦA TÔI */}
            {activeTab === "bookings" && (
              <div className="space-y-4">
                {active.length === 0 ? (
                  <div className="rounded-2xl border border-border/80 bg-card p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <CalendarDays className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold text-primary">
                      {isEn ? "No active bookings" : "Chưa có đặt phòng hoạt động"}
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                      {isEn
                        ? "You currently have no upcoming reservations. Explore our luxury hotels and book your next stay."
                        : "Quý khách hiện chưa có kỳ nghỉ nào sắp diễn ra. Khám phá ngay hệ thống khách sạn Sen Việt."}
                    </p>
                    <Button asChild size="sm" className="mt-4 rounded-full px-5">
                      <Link to="/hotels">
                        {isEn ? "Explore Hotels" : "Khám phá khách sạn"}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {active.map((booking) => (
                      <article
                        key={booking.id}
                        className="rounded-2xl border border-border/80 bg-card p-5 transition hover:border-primary/30 hover:shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold text-primary/70">
                                #{booking.id}
                              </span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-xs text-muted-foreground">
                                {booking.nights} {isEn ? "night(s)" : "đêm"} ({booking.rooms} {isEn ? "room" : "phòng"})
                              </span>
                            </div>

                            <h3 className="font-display text-lg font-bold text-primary">
                              {booking.hotelName}
                            </h3>

                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {booking.roomName}
                            </p>

                            <div className="flex items-center gap-1.5 pt-1 text-xs text-foreground/80 font-medium">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              <span>{booking.checkIn}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <span>{booking.checkOut}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                            <span
                              className={`self-start sm:self-auto rounded-full px-3 py-0.5 text-xs font-semibold ${
                                booking.status === "pending_payment"
                                  ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                                  : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                              }`}
                            >
                              {booking.status === "pending_payment"
                                ? isEn ? "Pending Payment" : "Chờ thanh toán"
                                : isEn ? "Confirmed" : "Đã xác nhận"}
                            </span>

                            <div className="sm:text-right">
                              <span className="text-[11px] text-muted-foreground block">
                                {isEn ? "Total Amount" : "Tổng thanh toán"}
                              </span>
                              <span className="font-display text-base font-bold text-primary">
                                {formatVnd(booking.total)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                                <Link to="/bookings">
                                  {isEn ? "Manage" : "Quản lý"}
                                </Link>
                              </Button>
                              {booking.status === "pending_payment" && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-8 rounded-lg text-xs bg-gold text-gold-foreground hover:bg-gold/90"
                                >
                                  <Link to="/bookings">
                                    {isEn ? "Pay Now" : "Thanh toán ngay"}
                                  </Link>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ƯU ĐÃI & VOUCHER ĐÃ LƯU */}
            {activeTab === "vouchers" && (
              <div className="space-y-4">
                {savedPromotions.length === 0 ? (
                  <div className="rounded-2xl border border-border/80 bg-card p-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Ticket className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold text-primary">
                      {isEn ? "No saved vouchers" : "Chưa có ưu đãi nào được lưu"}
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                      {isEn
                        ? "Save discount codes to apply them automatically at checkout. Each code can be used once per account."
                        : "Lưu các mã giảm giá hấp dẫn để sử dụng khi đặt phòng. Mỗi mã áp dụng 1 lần cho 1 tài khoản."}
                    </p>
                    <Button asChild size="sm" className="mt-4 rounded-full px-5 bg-gold text-gold-foreground hover:bg-gold/90">
                      <Link to="/offers">
                        {isEn ? "Explore Offers" : "Xem danh sách ưu đãi"}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    {savedPromotions.map((promo) => {
                      const isCopied = copiedCode === promo.code;
                      return (
                        <div
                          key={promo.code}
                          className={`flex flex-col justify-between rounded-2xl border p-4.5 transition ${
                            promo.isUsed
                              ? "border-border/60 bg-muted/40 opacity-70"
                              : "border-border/80 bg-card hover:border-amber-400/50 hover:shadow-sm"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                <Sparkles className="h-3 w-3" />
                                {promo.discountText}
                              </span>
                              {promo.isUsed ? (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                  {isEn ? "Used" : "Đã sử dụng"}
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  {isEn ? "Available" : "Khả dụng"}
                                </span>
                              )}
                            </div>

                            <h3 className="mt-2 font-display text-base font-bold text-primary line-clamp-1">
                              {promo.title}
                            </h3>

                            {promo.description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                {promo.description}
                              </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                              <span>🏨 {promo.hotelName}</span>
                              {promo.minValue && promo.minValue > 0 && (
                                <span>· Đơn từ {formatVnd(promo.minValue)}</span>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyCode(promo.code)}
                              className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary/30 bg-secondary/50 px-2.5 py-1 text-xs font-mono font-bold text-primary hover:bg-secondary transition"
                              title={isEn ? "Copy code" : "Sao chép mã"}
                            >
                              <span>{promo.code}</span>
                              {isCopied ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleUnsave(promo)}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 transition"
                                title={isEn ? "Remove offer" : "Bỏ lưu ưu đãi"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: TIỆN ÍCH HỖ TRỢ & BẢO MẬT THANH TOÁN */}
          <aside className="space-y-4">
            {/* HỘP TRUNG TÂM HỖ TRỢ TINH GIẢN */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
              <h2 className="font-display text-base font-bold text-primary">
                {isEn ? "Support & Services" : "Trung tâm hỗ trợ"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isEn ? "Quick actions & assistance" : "Tiện ích và chăm sóc khách hàng"}
              </p>

              <div className="mt-3.5 space-y-2">
                <Link
                  to="/bookings"
                  className="flex items-center justify-between rounded-xl p-2.5 transition hover:bg-secondary/60 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Bell className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition">
                        {isEn ? "Notifications" : "Thông báo"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isEn ? "Booking updates" : "Cập nhật ngày check-in"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </Link>

                <Link
                  to="/bookings"
                  className="flex items-center justify-between rounded-xl p-2.5 transition hover:bg-secondary/60 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition">
                        {isEn ? "Booking History" : "Lịch sử đặt phòng"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isEn ? "All past & active stays" : "Xem tất cả đơn phòng"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center justify-between rounded-xl p-2.5 transition hover:bg-secondary/60 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition">
                        {isEn ? "Security & Profile" : "Bảo mật tài khoản"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isEn ? "Password & personal data" : "Đổi mật khẩu & thông tin"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </Link>

                <button
                  type="button"
                  onClick={handleOpenAiAssistant}
                  className="w-full flex items-center justify-between rounded-xl p-2.5 transition hover:bg-secondary/60 group text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20 text-gold-foreground">
                      <Headphones className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition flex items-center gap-1.5">
                        <span>{isEn ? "AI Concierge" : "Trợ lý AI Sen Việt"}</span>
                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                          24/7
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {isEn ? "Instant booking support" : "Tư vấn & hỗ trợ đặt phòng"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition" />
                </button>
              </div>
            </div>

            {/* HỘP BẢO MẬT THANH TOÁN GỌN GÀNG (TÍCH HỢP SIDEBAR) */}
            <div className="rounded-2xl border border-border/80 bg-secondary/40 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    {isEn ? "Secure Bank Payment" : "Thanh toán an toàn"}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                    {isEn
                      ? "Direct VietQR & PayOS banking integration. 256-bit encryption for all transactions."
                      : "Giao dịch mã hóa an toàn qua chuẩn ngân hàng VietQR & PayOS. Không lưu trữ thông tin thẻ trái phép."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
