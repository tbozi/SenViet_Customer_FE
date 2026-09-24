import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CalendarDays,
  Check,
  Copy,
  Gift,
  HeartHandshake,
  MapPin,
  Percent,
  Sparkles,
  Ticket,
  Users,
  UtensilsCrossed,
  Utensils,
  Waves,
  Wifi,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import {
  getSavedPromotionCodes,
  toggleSavedPromotion,
} from "@/lib/savedPromotions";
import {
  useGetActivePromotionsQuery,
  useGetMySavedPromotionsQuery,
  useSavePromotionMutation,
  useUnsavePromotionMutation,
} from "@/services/promotionApi";

const offers = [
  {
    tag: "HOT",
    icon: Gift,
    title: "Ở 3 đêm, tặng 1 đêm",
    titleEn: "Stay 3 nights, get 1 free",
    description: "Tận hưởng kỳ nghỉ dài ngày với một đêm miễn phí tại các điểm đến ven biển.",
    descriptionEn: "Extend your getaway with one complimentary night at our coastal destinations.",
    code: "STAY3FREE",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1000",
    detail: "Áp dụng tại Sen Việt Đà Nẵng và Nha Trang",
    detailEn: "Available at Sen Việt Da Nang and Nha Trang",
    usage: "Nhập mã STAY3FREE tại ô Mã khuyến mãi trong bước tìm kiếm hoặc thanh toán.",
    usageEn: "Enter STAY3FREE in the promo code field during search or checkout.",
    conditions: ["Đặt tối thiểu 3 đêm liên tiếp", "Áp dụng cho phòng tiêu chuẩn trở lên", "Không áp dụng đồng thời với mã khác"],
    conditionsEn: ["Book at least 3 consecutive nights", "Valid for standard rooms and above", "Cannot be combined with another code"],
    hotels: ["Sen Việt Đà Nẵng", "Sen Việt Nha Trang"],
    hotelsEn: ["Sen Việt Da Nang", "Sen Việt Nha Trang"],
    valid: "01/09/2026 – 31/12/2026",
    validEn: "01/09/2026 – 31/12/2026",
    accent: "from-blue-50 to-white",
  },
  {
    tag: "MEMBER",
    icon: Percent,
    title: "Ưu đãi thành viên Sen Việt",
    titleEn: "Sen Việt member offer",
    description: "Giảm 15% giá phòng và nhận phòng sớm dành riêng cho thành viên.",
    descriptionEn: "Enjoy 15% off rooms and early check-in, exclusively for members.",
    code: "SENMEMBER",
    image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?q=80&w=1000",
    detail: "Đăng nhập tài khoản để nhận ưu đãi",
    detailEn: "Sign in to unlock this member benefit",
    usage: "Đăng nhập tài khoản Sen Việt trước khi chọn phòng và nhập mã khi thanh toán.",
    usageEn: "Sign in to your Sen Việt account before selecting a room and apply the code at checkout.",
    conditions: ["Dành cho tài khoản đã đăng ký", "Giảm tối đa 15% tiền phòng", "Có thể áp dụng cho tối đa 3 phòng mỗi đặt phòng"],
    conditionsEn: ["For registered accounts", "Up to 15% off room charges", "Valid for up to 3 rooms per booking"],
    hotels: ["Tất cả khách sạn Sen Việt"],
    hotelsEn: ["All Sen Việt hotels"],
    valid: "01/09/2026 – 31/12/2026",
    validEn: "01/09/2026 – 31/12/2026",
    accent: "from-amber-50 to-white",
  },
  {
    tag: "NEW",
    icon: Sparkles,
    title: "Trọn gói cuối tuần",
    titleEn: "Weekend escape",
    description: "Phòng nghỉ, bữa sáng buffet và trải nghiệm địa phương trong một gói hoàn chỉnh.",
    descriptionEn: "A complete package with a room, breakfast and a local experience.",
    code: "WEEKEND",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000",
    detail: "Lưu trú từ thứ Sáu đến Chủ nhật",
    detailEn: "Valid for stays from Friday to Sunday",
    usage: "Chọn ngày nhận phòng vào thứ Sáu hoặc thứ Bảy, sau đó nhập mã WEEKEND.",
    usageEn: "Choose a Friday or Saturday check-in, then enter the WEEKEND code.",
    conditions: ["Áp dụng cho kỳ nghỉ cuối tuần", "Bao gồm bữa sáng cho 2 khách", "Cần đặt trước ít nhất 2 ngày"],
    conditionsEn: ["Valid for weekend stays", "Includes breakfast for 2 guests", "Must be booked at least 2 days in advance"],
    hotels: ["Sen Việt Gò Công", "Sen Việt An Nhơn", "Sen Việt Hà Nội"],
    hotelsEn: ["Sen Việt Go Cong", "Sen Việt An Nhon", "Sen Việt Ha Noi"],
    valid: "01/09/2026 – 31/12/2026",
    validEn: "01/09/2026 – 31/12/2026",
    accent: "from-emerald-50 to-white",
  },
  {
    tag: "DINING",
    icon: UtensilsCrossed,
    title: "Bữa sáng trọn vị",
    titleEn: "Breakfast delight",
    description: "Tặng bữa sáng buffet cho hai khách trong mỗi đêm lưu trú.",
    descriptionEn: "Enjoy complimentary buffet breakfast for two guests every night.",
    code: "BREAKFAST",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=1000",
    detail: "Áp dụng tại khách sạn có nhà hàng buffet",
    detailEn: "Available at hotels with buffet restaurants",
    usage: "Nhập mã BREAKFAST khi đặt phòng và chọn số lượng khách chính xác.",
    usageEn: "Enter BREAKFAST while booking and provide the correct guest count.",
    conditions: ["Áp dụng cho đặt phòng từ 2 đêm", "Tối đa 2 suất sáng mỗi phòng mỗi ngày", "Không quy đổi thành tiền mặt"],
    conditionsEn: ["Valid for stays of 2 nights or more", "Up to 2 breakfasts per room per day", "Cannot be exchanged for cash"],
    hotels: ["Sen Việt Đà Nẵng", "Sen Việt Nha Trang", "Sen Việt Sài Gòn"],
    hotelsEn: ["Sen Việt Da Nang", "Sen Việt Nha Trang", "Sen Việt Saigon"],
    valid: "01/09/2026 – 31/12/2026",
    validEn: "01/09/2026 – 31/12/2026",
    accent: "from-orange-50 to-white",
  },
  {
    tag: "WELLNESS",
    icon: Waves,
    title: "Thư giãn cùng Spa",
    titleEn: "Wellness escape",
    description: "Giảm 20% liệu trình spa khi đặt phòng nghỉ dưỡng tại Sen Việt.",
    descriptionEn: "Save 20% on spa treatments when booking a Sen Việt stay.",
    code: "SPA20",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1000",
    detail: "Ưu đãi cho dịch vụ spa và massage",
    detailEn: "Offer for spa and massage services",
    usage: "Nhập mã SPA20 khi đặt phòng, sau đó chọn dịch vụ Spa ở bước bổ sung.",
    usageEn: "Enter SPA20 when booking, then select spa services in the add-ons step.",
    conditions: ["Giảm 20% giá dịch vụ spa", "Cần đặt lịch trước với lễ tân", "Tùy thuộc khung giờ còn trống"],
    conditionsEn: ["20% off spa services", "Advance reservation with reception required", "Subject to available time slots"],
    hotels: ["Sen Việt Đà Nẵng", "Sen Việt Nha Trang"],
    hotelsEn: ["Sen Việt Da Nang", "Sen Việt Nha Trang"],
    valid: "01/09/2026 – 31/12/2026",
    validEn: "01/09/2026 – 31/12/2026",
    accent: "from-violet-50 to-white",
  },
  {
    tag: "FAMILY",
    icon: Users,
    title: "Kỳ nghỉ gia đình",
    titleEn: "Family getaway",
    description: "Ưu đãi dành cho gia đình với phòng rộng hơn và quà tặng cho trẻ em.",
    descriptionEn: "A family-friendly stay with larger rooms and a welcome gift for children.",
    code: "FAMILY10",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000",
    detail: "Dành cho đặt phòng có trẻ em",
    detailEn: "For bookings that include children",
    usage: "Khai báo số trẻ em trong tìm kiếm, chọn phòng phù hợp và nhập mã FAMILY10.",
    usageEn: "Add children to your search, select a suitable room and enter FAMILY10.",
    conditions: ["Có ít nhất 1 trẻ em trong đặt phòng", "Giảm 10% tiền phòng", "Tùy thuộc sức chứa từng loại phòng"],
    conditionsEn: ["At least 1 child in the booking", "10% off room charges", "Subject to room capacity"],
    hotels: ["Sen Việt Gò Công", "Sen Việt Đà Nẵng", "Sen Việt Nha Trang"],
    hotelsEn: ["Sen Việt Go Cong", "Sen Việt Da Nang", "Sen Việt Nha Trang"],
    valid: "01/09/2026 – 31/12/2026",
    validEn: "01/09/2026 – 31/12/2026",
    accent: "from-rose-50 to-white",
  },
  {
    tag: "LONG STAY",
    icon: Ticket,
    title: "Ở lâu, tiết kiệm nhiều",
    titleEn: "Long-stay savings",
    description: "Giảm 12% cho những hành trình dài ngày từ 7 đêm trở lên.",
    descriptionEn: "Save 12% on extended stays of 7 nights or more.",
    code: "LONGSTAY12",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000",
    detail: "Phù hợp cho nghỉ dưỡng dài ngày hoặc công tác",
    detailEn: "Ideal for long holidays or business stays",
    usage: "Chọn khoảng lưu trú từ 7 đêm, sau đó nhập mã LONGSTAY12 tại thanh toán.",
    usageEn: "Choose a stay of 7 nights or more, then enter LONGSTAY12 at checkout.",
    conditions: ["Tối thiểu 7 đêm liên tiếp", "Giảm 12% tiền phòng", "Có thể yêu cầu thanh toán trước"],
    conditionsEn: ["Minimum 7 consecutive nights", "12% off room charges", "Prepayment may be required"],
    hotels: ["Tất cả khách sạn Sen Việt"],
    hotelsEn: ["All Sen Việt hotels"],
    valid: "01/09/2026 – 31/12/2026",
    validEn: "01/09/2026 – 31/12/2026",
    accent: "from-cyan-50 to-white",
  },
];

export function Offers() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<(typeof offers)[number] | null>(null);
  const isVietnamese = language === "vi";

  // Lấy danh sách ưu đãi và voucher đã lưu từ Backend
  const { data: activePromos } = useGetActivePromotionsQuery();
  const { data: savedPromos } = useGetMySavedPromotionsQuery(undefined, {
    skip: !user,
  });
  const [savePromo, { isLoading: isSaving }] = useSavePromotionMutation();
  const [unsavePromo, { isLoading: isUnsaving }] = useUnsavePromotionMutation();

  const [savedCodes, setSavedCodes] = useState<string[]>(() =>
    getSavedPromotionCodes(user?.email),
  );

  useEffect(() => {
    const update = () => {
      setSavedCodes(getSavedPromotionCodes(user?.email));
    };
    update();
    window.addEventListener("senviet_saved_promotions_changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("senviet_saved_promotions_changed", update);
      window.removeEventListener("storage", update);
    };
  }, [user?.email]);

  const isSavedCode = (code: string) => {
    const upper = code.trim().toUpperCase();
    return (
      savedCodes.some((c) => c.toUpperCase() === upper) ||
      Boolean(savedPromos?.some((sp) => sp.code.toUpperCase() === upper))
    );
  };

  const handleToggleSave = async (code: string) => {
    const upperCode = code.trim().toUpperCase();
    const updated = toggleSavedPromotion(user?.email, upperCode);
    setSavedCodes(updated);

    const isNowSaved = updated.some((c) => c.toUpperCase() === upperCode);
    if (isNowSaved) {
      toast.success(
        isVietnamese
          ? `Đã lưu voucher "${upperCode}" vào ví ưu đãi của bạn!`
          : `Saved voucher "${upperCode}" to your wallet!`,
      );
    } else {
      toast.info(
        isVietnamese
          ? `Đã bỏ lưu voucher "${upperCode}"`
          : `Removed voucher "${upperCode}"`,
      );
    }

    // Đồng thời đồng bộ sang backend nếu đã login
    if (user) {
      const saved = savedPromos?.find(
        (sp) => sp.code.toUpperCase() === upperCode,
      );
      if (saved) {
        try {
          await unsavePromo(saved.promotionId).unwrap();
        } catch {
          // bỏ qua lỗi
        }
      } else {
        const matched = activePromos?.find(
          (p) => p.code.toUpperCase() === upperCode,
        );
        if (matched) {
          try {
            await savePromo(matched.id).unwrap();
          } catch {
            // bỏ qua lỗi
          }
        }
      }
    }
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast.success(
      isVietnamese ? `Đã sao chép mã ${code}` : `Copied code ${code}`,
    );
    window.setTimeout(() => setCopiedCode(""), 1800);
  };

  return (
    <main>
      <section className="border-b border-primary/10 bg-gradient-to-br from-secondary via-background to-background">
        <div className="container py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-gold">
              Sen Việt benefits
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl lg:text-6xl">
              {isVietnamese ? "Ưu đãi dành riêng cho bạn" : "Offers made for you"}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              {isVietnamese
                ? "Khám phá những ưu đãi đặc biệt cho kỳ nghỉ trọn vẹn hơn tại Sen Việt Hotels & Resorts."
                : "Discover special benefits designed to make every stay at Sen Việt Hotels & Resorts more memorable."}
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => {
              const Icon = offer.icon;
              const copied = copiedCode === offer.code;
              const isSaved = isSavedCode(offer.code);

              return (
                <article
                  key={offer.code}
                  className={`group flex flex-col rounded-2xl border border-border bg-gradient-to-br ${offer.accent} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full bg-gold px-3 py-1 text-[10px] font-bold tracking-wide text-gold-foreground">
                      {offer.tag}
                    </span>
                  </div>
                  <h2 className="mt-6 font-display text-2xl font-bold leading-tight text-primary">
                    {isVietnamese ? offer.title : offer.titleEn}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                    {isVietnamese ? offer.description : offer.descriptionEn}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-2 rounded-xl border border-primary/10 bg-white/80 p-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">
                        {isVietnamese ? "Mã ưu đãi" : "Promo code"}
                      </p>
                      <p className="mt-1 font-bold tracking-wider text-primary">{offer.code}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyCode(offer.code)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-semibold text-primary shadow-xs transition hover:bg-secondary"
                      aria-label={isVietnamese ? "Sao chép mã" : "Copy code"}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                    {isVietnamese ? offer.detail : offer.detailEn}
                  </p>

                  {/* NÚT LƯU VOUCHER NẰM TRÊN NÚT XEM CHI TIẾT */}
                  <button
                    type="button"
                    onClick={() => handleToggleSave(offer.code)}
                    disabled={isSaving || isUnsaving}
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition ${
                      isSaved
                        ? "border-amber-400 bg-amber-100 text-amber-950 shadow-xs hover:bg-amber-200/80"
                        : "border-amber-300/80 bg-amber-50/80 text-amber-900 shadow-xs hover:border-amber-400 hover:bg-amber-100/90"
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="h-4 w-4 text-amber-700" />
                        <span>{isVietnamese ? "Đã lưu vào ví voucher" : "Saved to wallet"}</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4 text-amber-700" />
                        <span>{isVietnamese ? "Lưu voucher" : "Save voucher"}</span>
                      </>
                    )}
                  </button>

                  {/* NÚT XEM CHI TIẾT */}
                  <button
                    type="button"
                    onClick={() => setSelectedOffer(offer)}
                    className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    {isVietnamese ? "Xem chi tiết" : "View details"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Dialog open={Boolean(selectedOffer)} onOpenChange={(open) => !open && setSelectedOffer(null)}>
        {selectedOffer && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-5 sm:p-7">
            {selectedOffer.image && (
              <div className="relative -mx-5 -mt-5 mb-5 h-48 overflow-hidden rounded-t-2xl sm:-mx-7 sm:-mt-7 sm:h-60">
                <img
                  src={selectedOffer.image}
                  alt={isVietnamese ? selectedOffer.title : selectedOffer.titleEn}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
            )}
            <DialogHeader className="pr-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <selectedOffer.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold tracking-wide text-gold-foreground">{selectedOffer.tag}</span>
                  <DialogTitle className="mt-3 font-display text-2xl text-primary sm:text-3xl">
                    {isVietnamese ? selectedOffer.title : selectedOffer.titleEn}
                  </DialogTitle>
                </div>
              </div>
              <DialogDescription className="mt-3 text-sm leading-6">
                {isVietnamese ? selectedOffer.description : selectedOffer.descriptionEn}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/10 bg-secondary/40 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-gold">{isVietnamese ? "Cách sử dụng" : "How to use"}</p>
                <p className="mt-2 text-sm leading-6 text-primary">{isVietnamese ? selectedOffer.usage : selectedOffer.usageEn}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-lg border border-primary/10 bg-white px-3 py-2 font-bold tracking-wider text-primary">{selectedOffer.code}</span>
                  <button type="button" onClick={() => copyCode(selectedOffer.code)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    {copiedCode === selectedOffer.code ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCode === selectedOffer.code ? (isVietnamese ? "Đã sao chép" : "Copied") : (isVietnamese ? "Sao chép mã" : "Copy code")}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-gold">{isVietnamese ? "Điều kiện áp dụng" : "Terms & conditions"}</p>
                <ul className="mt-3 space-y-2.5">
                  {(isVietnamese ? selectedOffer.conditions : selectedOffer.conditionsEn).map((condition) => (
                    <li key={condition} className="flex gap-2 text-sm leading-5 text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{condition}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-border bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-gold">{isVietnamese ? "Khách sạn áp dụng" : "Applicable hotels"}</p>
                <ul className="mt-3 space-y-2.5">
                  {(isVietnamese ? selectedOffer.hotels : selectedOffer.hotelsEn).map((hotel) => (
                    <li key={hotel} className="flex gap-2 text-sm leading-5 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{hotel}</li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground sm:col-span-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-gold" />
                <span>{isVietnamese ? "Thời gian áp dụng:" : "Validity:"} <strong className="text-primary">{isVietnamese ? selectedOffer.valid : selectedOffer.validEn}</strong></span>
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedOffer(null)}
                className="rounded-full border border-input px-5 py-2.5 text-sm font-semibold text-primary hover:bg-secondary"
              >
                {isVietnamese ? "Đóng" : "Close"}
              </button>
              <button
                type="button"
                onClick={() => handleToggleSave(selectedOffer.code)}
                disabled={isSaving || isUnsaving}
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  isSavedCode(selectedOffer.code)
                    ? "border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200/80"
                    : "border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100"
                }`}
              >
                {isSavedCode(selectedOffer.code) ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-amber-700" />
                    <span>{isVietnamese ? "Đã lưu vào ví" : "Saved"}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 text-amber-700" />
                    <span>{isVietnamese ? "Lưu voucher này" : "Save voucher"}</span>
                  </>
                )}
              </button>
              <Link
                to={`/search?promo=${encodeURIComponent(selectedOffer.code)}`}
                onClick={() => setSelectedOffer(null)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {isVietnamese ? "Dùng ưu đãi này" : "Use this offer"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <section className="container py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <Ticket className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <h2 className="font-semibold text-primary">{isVietnamese ? "Nhập mã khi đặt phòng" : "Apply at booking"}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{isVietnamese ? "Mã ưu đãi sẽ được áp dụng tại bước thanh toán." : "Your promo code can be applied during checkout."}</p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <CalendarDays className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <h2 className="font-semibold text-primary">{isVietnamese ? "Thời gian có hạn" : "Limited availability"}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{isVietnamese ? "Ưu đãi phụ thuộc vào thời gian và số lượng phòng còn trống." : "Offers depend on travel dates and room availability."}</p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
            <Sparkles className="h-6 w-6 shrink-0 text-gold" />
            <div>
              <h2 className="font-semibold text-primary">{isVietnamese ? "Trải nghiệm trọn vẹn" : "A complete stay"}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{isVietnamese ? "Kết hợp ưu đãi với dịch vụ nhà hàng, spa và trải nghiệm tại khách sạn." : "Pair your offer with dining, spa and hotel experiences."}</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-6xl rounded-2xl bg-primary p-6 text-primary-foreground sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">Sen Việt Hotels & Resorts</p>
            <h2 className="mt-2 font-display text-2xl font-bold">{isVietnamese ? "Sẵn sàng cho kỳ nghỉ tiếp theo?" : "Ready for your next getaway?"}</h2>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/75">{isVietnamese ? "Tìm khách sạn phù hợp và bắt đầu hành trình của bạn hôm nay." : "Find your perfect stay and start your journey today."}</p>
          </div>
          <Link to="/hotels" className="mt-5 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-bold text-gold-foreground transition hover:bg-gold/90 sm:mt-0">
            {isVietnamese ? "Khám phá khách sạn" : "Explore hotels"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

export function Services() {
  const { language } = useLanguage();
  const services = language === "vi" ? [[HeartHandshake, "Chăm sóc khách hàng 24/7", "Trợ lý AI và đội ngũ Sen Việt luôn sẵn sàng hỗ trợ."], [Utensils, "Ẩm thực bản địa", "Thưởng thức hương vị đặc trưng tại nhà hàng trong khách sạn."], [Waves, "Nghỉ dưỡng & spa", "Tái tạo năng lượng với hồ bơi, spa và các liệu trình thư giãn."], [Wifi, "Không gian làm việc", "Wi-Fi tốc độ cao và phòng họp cho mọi nhu cầu công việc."]] : [[HeartHandshake, "24/7 guest care", "Our AI assistant and guest team are always here to help."], [Utensils, "Local cuisine", "Discover regional flavors at our in-house restaurants."], [Waves, "Wellness & spa", "Recharge with pools, spas and relaxing treatments."], [Wifi, "Work spaces", "High-speed Wi-Fi and meeting rooms for every work need."]];
  return <main className="container py-16"><p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt hospitality</p><h1 className="mt-3 font-display text-5xl font-bold text-primary">{language === "vi" ? "Dịch vụ của Sen Việt" : "Sen Việt services"}</h1><div className="mt-10 grid gap-5 sm:grid-cols-2">{services.map(([Icon,title,desc]) => <article key={title as string} className="flex gap-4 rounded-2xl border border-border bg-card p-6"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="h-6 w-6" /></div><div><h2 className="font-display text-xl font-bold text-primary">{title as string}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc as string}</p></div></article>)}</div></main>;
}
