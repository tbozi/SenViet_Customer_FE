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
import { useGetServicesQuery } from "@/services/hotelServiceApi";
import { formatVnd } from "@/data/hotels";

const offers = [
  {
    tag: "HOT",
    icon: Percent,
    title: "Ưu đãi Sen Việt",
    titleEn: "Sen Việt Special Offer",
    description: "Giảm 10% tổng giá trị tiền phòng (tối đa 500.000₫) cho tất cả khách hàng.",
    descriptionEn: "Enjoy 10% off room charges (up to 500,000 VND) across all hotels.",
    code: "SEN10",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1000",
    detail: "Áp dụng toàn bộ hệ thống khách sạn Sen Việt",
    detailEn: "Available at all Sen Việt hotels and resorts",
    usage: "Nhập mã SEN10 tại ô Mã ưu đãi ở bước thanh toán.",
    usageEn: "Enter SEN10 in the promo code field during checkout.",
    conditions: ["Áp dụng cho mọi hạng phòng", "Giảm tối đa 500.000₫", "Không giới hạn số đêm"],
    conditionsEn: ["Valid for all room types", "Max discount 500,000 VND", "No minimum night requirement"],
    hotels: ["Tất cả khách sạn Sen Việt"],
    hotelsEn: ["All Sen Việt hotels"],
    valid: "01/01/2026 – 31/12/2030",
    validEn: "01/01/2026 – 31/12/2030",
    accent: "from-blue-50 to-white",
  },
  {
    tag: "VIP",
    icon: Sparkles,
    title: "Ưu đãi VIP 20%",
    titleEn: "VIP 20% Discount",
    description: "Giảm ngay 20% cho các đơn đặt phòng từ 2.000.000₫ (tối đa 1.000.000₫).",
    descriptionEn: "Save 20% on bookings from 2,000,000 VND (up to 1,000,000 VND).",
    code: "VIP20",
    image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?q=80&w=1000",
    detail: "Đơn đặt phòng tối thiểu từ 2.000.000₫",
    detailEn: "Minimum booking value of 2,000,000 VND",
    usage: "Nhập mã VIP20 khi đặt phòng với tổng tiền phòng từ 2 triệu đồng.",
    usageEn: "Apply code VIP20 at checkout for bookings over 2,000,000 VND.",
    conditions: ["Giá trị đặt phòng từ 2.000.000₫", "Mức giảm tối đa 1.000.000₫", "Áp dụng toàn chuỗi"],
    conditionsEn: ["Minimum order 2,000,000 VND", "Max discount 1,000,000 VND", "Valid chainwide"],
    hotels: ["Tất cả khách sạn Sen Việt"],
    hotelsEn: ["All Sen Việt hotels"],
    valid: "01/01/2026 – 31/12/2030",
    validEn: "01/01/2026 – 31/12/2030",
    accent: "from-amber-50 to-white",
  },
  {
    tag: "SUMMER",
    icon: Waves,
    title: "Khuyến mãi Mùa Hè 2026",
    titleEn: "Summer Promotion 2026",
    description: "Chào đón mùa hè rực rỡ với ưu đãi giảm 10% giá phòng (tối đa 500.000₫).",
    descriptionEn: "Celebrate summer with 10% off room rates across our destinations.",
    code: "SUMMER2026",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000",
    detail: "Áp dụng cho mùa du lịch hè 2026",
    detailEn: "Valid for summer travel season 2026",
    usage: "Nhập mã SUMMER2026 khi đặt phòng trực tuyến.",
    usageEn: "Enter SUMMER2026 when booking online.",
    conditions: ["Áp dụng cho mọi khách hàng", "Mức giảm tối đa 500.000₫", "Có thể đặt trước"],
    conditionsEn: ["Open to all guests", "Max discount 500,000 VND", "Advance booking available"],
    hotels: ["Tất cả khách sạn Sen Việt"],
    hotelsEn: ["All Sen Việt hotels"],
    valid: "01/01/2026 – 01/01/2027",
    validEn: "01/01/2026 – 01/01/2027",
    accent: "from-emerald-50 to-white",
  },
  {
    tag: "SPECIAL",
    icon: Gift,
    title: "Đặc quyền VIP 500K",
    titleEn: "VIP Privilege 500K",
    description: "Giảm trực tiếp 500.000₫ cho đơn đặt phòng nghỉ dưỡng từ 5.000.000₫.",
    descriptionEn: "Direct 500,000 VND discount for premium stays from 5,000,000 VND.",
    code: "VIP500",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1000",
    detail: "Đơn đặt phòng tối thiểu 5.000.000₫",
    detailEn: "Minimum booking value of 5,000,000 VND",
    usage: "Nhập mã VIP500 khi đặt các phòng cao cấp hoặc kỳ nghỉ dài ngày.",
    usageEn: "Enter VIP500 at checkout for qualifying luxury bookings.",
    conditions: ["Đơn hàng từ 5.000.000₫", "Giảm thẳng 500.000₫ vào hóa đơn", "Áp dụng toàn chuỗi"],
    conditionsEn: ["Minimum order 5,000,000 VND", "Flat 500,000 VND off", "Valid chainwide"],
    hotels: ["Tất cả khách sạn Sen Việt"],
    hotelsEn: ["All Sen Việt hotels"],
    valid: "01/01/2026 – 01/01/2027",
    validEn: "01/01/2026 – 01/01/2027",
    accent: "from-orange-50 to-white",
  },
  {
    tag: "SALE",
    icon: Ticket,
    title: "Siêu ưu đãi 50%",
    titleEn: "Super Deal 50%",
    description: "Giảm 50% tiền phòng, mức giảm tối đa 300.000₫ cho mỗi đơn đặt.",
    descriptionEn: "Save 50% on your stay up to a maximum of 300,000 VND.",
    code: "MAX300K",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000",
    detail: "Ưu đãi giá sốc cho khách đặt phòng sớm",
    detailEn: "Early-bird exclusive deal",
    usage: "Nhập mã MAX300K tại bước thanh toán để nhận ngay mức giảm 50%.",
    usageEn: "Enter MAX300K at checkout to claim your 50% discount.",
    conditions: ["Giảm 50% tiền phòng", "Trần giảm giá tối đa 300.000₫", "Áp dụng toàn chuỗi"],
    conditionsEn: ["50% discount", "Max discount 300,000 VND", "Valid chainwide"],
    hotels: ["Tất cả khách sạn Sen Việt"],
    hotelsEn: ["All Sen Việt hotels"],
    valid: "01/01/2026 – 31/12/2030",
    validEn: "01/01/2026 – 31/12/2030",
    accent: "from-violet-50 to-white",
  },
  {
    tag: "DEMO",
    icon: Sparkles,
    title: "Trợ giá đồ án PayOS (2.000₫)",
    titleEn: "PayOS Demo Voucher (2,000 VND)",
    description: "Mã ưu đãi đặc biệt dùng để thử nghiệm quét mã VietQR PayOS thật chỉ với 2.000₫.",
    descriptionEn: "Special trial voucher for real VietQR PayOS testing at 2,000 VND.",
    code: "DEMO2K",
    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=1000",
    detail: "Dành riêng cho kiểm thử và demo đồ án",
    detailEn: "Designed for thesis presentation and testing",
    usage: "Nhập mã DEMO2K để hóa đơn tự động chuyển về 2.000₫ thanh toán QR ngân hàng.",
    usageEn: "Apply code DEMO2K to reduce checkout total to 2,000 VND for QR testing.",
    conditions: ["Áp dụng cho mọi phòng", "Tổng tiền thanh toán chỉ 2.000₫", "Hỗ trợ quét VietQR liên ngân hàng"],
    conditionsEn: ["Valid for all rooms", "Fixed payment of 2,000 VND", "Supports real VietQR payment"],
    hotels: ["Tất cả khách sạn Sen Việt"],
    hotelsEn: ["All Sen Việt hotels"],
    valid: "01/01/2026 – 31/12/2030",
    validEn: "01/01/2026 – 31/12/2030",
    accent: "from-rose-50 to-white",
  },
];

export function Offers() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState("");
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const isVietnamese = language === "vi";

  // Lấy danh sách ưu đãi và voucher đã lưu từ Backend
  const { data: activePromos } = useGetActivePromotionsQuery();
  const { data: savedPromos } = useGetMySavedPromotionsQuery(undefined, {
    skip: !user,
  });
  const [savePromo, { isLoading: isSaving }] = useSavePromotionMutation();
  const [unsavePromo, { isLoading: isUnsaving }] = useUnsavePromotionMutation();

  const displayOffers = (activePromos && activePromos.length > 0)
    ? activePromos.map((p, idx) => {
        const isPercent = p.discountType === "PERCENTAGE" || (p as any).promotionDiscountType === "PERCENTAGE" || p.discountValue <= 100;
        const discountText = isPercent ? `Giảm ${p.discountValue}%` : `Giảm ${formatVnd(p.discountValue)}`;
        const accents = [
          "from-amber-50 to-white",
          "from-blue-50 to-white",
          "from-emerald-50 to-white",
          "from-rose-50 to-white",
          "from-violet-50 to-white",
          "from-orange-50 to-white",
        ];
        return {
          id: p.id,
          tag: p.type === "ROOM" ? "PHÒNG" : p.type === "SERVICE" ? "DỊCH VỤ" : "TOÀN BỘ",
          icon: isPercent ? Percent : Gift,
          title: p.name,
          titleEn: p.name,
          description: p.description || `${discountText} cho đơn đặt phòng tại Sen Việt Luxury.`,
          descriptionEn: p.description || `${discountText} for booking at Sen Việt Luxury.`,
          code: p.code,
          image: (p as any).imageUrl || "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1000",
          detail: p.minBookingValue ? `Đơn tối thiểu ${formatVnd(p.minBookingValue)}` : "Áp dụng toàn bộ hệ thống Sen Việt",
          detailEn: p.minBookingValue ? `Min order ${formatVnd(p.minBookingValue)}` : "All Sen Việt branches",
          usage: `Nhập mã ${p.code} tại ô Mã khuyến mãi khi đặt phòng hoặc thanh toán.`,
          usageEn: `Enter ${p.code} at promo code during booking.`,
          conditions: [
            p.minBookingValue ? `Áp dụng cho đơn từ ${formatVnd(p.minBookingValue)}` : "Áp dụng cho đặt phòng",
            p.maxDiscountAmount ? `Giảm tối đa ${formatVnd(p.maxDiscountAmount)}` : "Không giới hạn mức giảm tối đa",
            "Mỗi khách hàng áp dụng 1 lần / đơn",
          ],
          conditionsEn: [
            p.minBookingValue ? `Valid for orders from ${formatVnd(p.minBookingValue)}` : "Valid for bookings",
            "Non-transferable",
          ],
          hotels: ["Tất cả khách sạn Sen Việt"],
          hotelsEn: ["All Sen Việt hotels"],
          valid: p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "31/12/2026",
          validEn: p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "31/12/2026",
          accent: accents[idx % accents.length],
        };
      })
    : offers;

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

  const matchSavedPromo = (code: string, offerId?: string | number) => {
    const upper = code.trim().toUpperCase();
    return savedPromos?.find(
      (sp) =>
        (offerId && String(sp.promotionId) === String(offerId)) ||
        sp.code.toUpperCase() === upper ||
        (sp.promotionCode && sp.promotionCode.toUpperCase() === upper) ||
        sp.code.toUpperCase().startsWith(`${upper}-`),
    );
  };

  const isSavedCode = (code: string, offerId?: string | number) => {
    const upper = code.trim().toUpperCase();
    if (user && savedPromos) {
      return Boolean(matchSavedPromo(code, offerId)) || savedCodes.some((c) => c.toUpperCase() === upper);
    }
    return savedCodes.some((c) => c.toUpperCase() === upper);
  };

  const handleToggleSave = async (code: string, offerId?: string | number) => {
    const upperCode = code.trim().toUpperCase();
    const currentlySaved = isSavedCode(upperCode, offerId);

    // Đồng bộ localStorage
    const updated = toggleSavedPromotion(user?.email, upperCode);
    setSavedCodes(updated);

    // Đồng bộ sang Backend nếu đã đăng nhập
    if (user) {
      const saved = matchSavedPromo(upperCode, offerId);
      if (currentlySaved && saved) {
        try {
          await unsavePromo(saved.promotionId || saved.savedId).unwrap();
          toast.info(
            isVietnamese
              ? `Đã bỏ lưu mã khuyến mãi "${upperCode}" khỏi Ví voucher`
              : `Removed voucher "${upperCode}" from wallet`,
          );
          return;
        } catch (err: any) {
          toast.error(err?.data?.message || "Không thể bỏ lưu mã khuyến mãi này");
          return;
        }
      } else {
        const matched = activePromos?.find(
          (p) => (offerId && String(p.id) === String(offerId)) || p.code.toUpperCase() === upperCode,
        );
        if (matched) {
          try {
            await savePromo(matched.id).unwrap();
            toast.success(
              isVietnamese
                ? `Đã lưu mã "${upperCode}" vào Ví voucher của bạn!`
                : `Saved voucher "${upperCode}" to your wallet!`,
            );
            return;
          } catch (err: any) {
            // Nếu đã lưu trên DB trước đó và khách muốn bấm để bỏ lưu
            if (currentlySaved) {
              try {
                await unsavePromo(matched.id).unwrap();
                toast.info(isVietnamese ? `Đã bỏ lưu voucher "${upperCode}"` : `Removed voucher "${upperCode}"`);
                return;
              } catch {
                // ignore
              }
            }
          }
        }
      }
    }

    if (!currentlySaved) {
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
            {displayOffers.map((offer) => {
              const Icon = offer.icon;
              const copied = copiedCode === offer.code;
              const offerId = (offer as any).id;
              const isSaved = isSavedCode(offer.code, offerId);

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

                  {/* NÚT LƯU / BỎ LƯU VOUCHER NẰM TRÊN NÚT XEM CHI TIẾT */}
                  <button
                    type="button"
                    onClick={() => handleToggleSave(offer.code, offerId)}
                    disabled={isSaving || isUnsaving}
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full border py-2.5 text-sm font-semibold transition ${
                      isSaved
                        ? "border-amber-400 bg-amber-100 text-amber-950 shadow-xs hover:bg-rose-100 hover:border-rose-300 hover:text-rose-900"
                        : "border-amber-300/80 bg-amber-50/80 text-amber-900 shadow-xs hover:border-amber-400 hover:bg-amber-100/90"
                    }`}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="h-4 w-4 text-amber-700" />
                        <span>{isVietnamese ? "Đã lưu · Bấm để bỏ lưu" : "Saved · Click to unsave"}</span>
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
  const isVietnamese = language === "vi";
  const { data: backendServices } = useGetServicesQuery({ activeOnly: true });

  const staticServices =
    language === "vi"
      ? [
          [HeartHandshake, "Chăm sóc khách hàng 24/7", "Trợ lý AI và đội ngũ Sen Việt luôn sẵn sàng hỗ trợ."],
          [Utensils, "Ẩm thực bản địa", "Thưởng thức hương vị đặc trưng tại nhà hàng trong khách sạn."],
          [Waves, "Nghỉ dưỡng & spa", "Tái tạo năng lượng với hồ bơi, spa và các liệu trình thư giãn."],
          [Wifi, "Không gian làm việc", "Wi-Fi tốc độ cao và phòng họp cho mọi nhu cầu công việc."],
        ]
      : [
          [HeartHandshake, "24/7 guest care", "Our AI assistant and guest team are always here to help."],
          [Utensils, "Local cuisine", "Discover regional flavors at our in-house restaurants."],
          [Waves, "Wellness & spa", "Recharge with pools, spas and relaxing treatments."],
          [Wifi, "Work spaces", "High-speed Wi-Fi and meeting rooms for every work need."],
        ];

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt hospitality</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
          {isVietnamese ? "Dịch vụ đẳng cấp Sen Việt" : "Sen Việt Services & Experiences"}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isVietnamese
            ? "Tận hưởng trọn vẹn kỳ nghỉ với chuỗi tiện ích đa dạng: ẩm thực cao cấp, spa thư giãn, tour trải nghiệm và dịch vụ phòng chu đáo."
            : "Complete your getaway with our curated dining, rejuvenating spa, local tours and attentive room services."}
        </p>
      </div>

      {backendServices && backendServices.length > 0 ? (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {backendServices.map((srv) => (
            <article
              key={srv.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {srv.imageUrl && (
                <div className="h-48 overflow-hidden bg-secondary">
                  <img
                    src={srv.imageUrl}
                    alt={srv.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gold">
                  <span>{srv.category || "Dịch vụ"}</span>
                  <span>{srv.hotelName || "Toàn chuỗi"}</span>
                </div>
                <h2 className="mt-2 font-display text-xl font-bold text-primary">{srv.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {srv.description || "Dịch vụ tiêu chuẩn 5 sao phục vụ quý khách."}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-bold text-primary">
                    {formatVnd(srv.price)}
                    {srv.unit && <span className="text-xs font-normal text-muted-foreground"> / {srv.unit}</span>}
                  </span>
                  <Link
                    to="/hotels"
                    className="text-xs font-semibold text-primary underline hover:text-gold"
                  >
                    {isVietnamese ? "Đặt phòng & dịch vụ" : "Book with room"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {staticServices.map(([Icon, title, desc]) => (
            <article key={title as string} className="flex gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-primary">{title as string}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc as string}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
