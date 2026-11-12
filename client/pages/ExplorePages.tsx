import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarDays,
  Check,
  Copy,
  Gift,
  HeartHandshake,
  MapPin,
  Percent,
  Search,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  Users,
  UtensilsCrossed,
  Utensils,
  Waves,
  Wifi,
  X,
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
import { formatDisplayDate } from "@/lib/dateTime";
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
import { formatVnd, hotels } from "@/data/hotels";

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
        const hotelName = (p as any).hotelName || "Toàn hệ thống";
        const isSpecificHotel = Boolean((p as any).hotelId && hotelName !== "Toàn hệ thống");
        const appliesText = isSpecificHotel ? `Chỉ áp dụng tại ${hotelName}` : "Áp dụng toàn bộ hệ thống Sen Việt";
        const appliesTextEn = isSpecificHotel ? `Valid only at ${hotelName}` : "All Sen Việt branches";

        const detailVi = p.minBookingValue
          ? `Đơn tối thiểu ${formatVnd(p.minBookingValue)} • ${appliesText}`
          : appliesText;
        const detailEn = p.minBookingValue
          ? `Min order ${formatVnd(p.minBookingValue)} • ${appliesTextEn}`
          : appliesTextEn;

        return {
          id: p.id,
          hotelId: (p as any).hotelId,
          hotelName: hotelName,
          rawType: p.type,
          tag: p.type === "ROOM" ? "PHÒNG" : p.type === "SERVICE" ? "DỊCH VỤ" : "TOÀN BỘ",
          icon: isPercent ? Percent : Gift,
          title: p.name,
          titleEn: p.name,
          description: p.description || `${discountText} cho đơn đặt phòng tại Sen Việt Luxury.`,
          descriptionEn: p.description || `${discountText} for booking at Sen Việt Luxury.`,
          code: p.code,
          image: (p as any).imageUrl || "https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1000",
          detail: detailVi,
          detailEn: detailEn,
          usage: `Nhập mã ${p.code} tại ô Mã khuyến mãi khi đặt phòng hoặc thanh toán.`,
          usageEn: `Enter ${p.code} at promo code during booking.`,
          conditions: [
            p.minBookingValue ? `Áp dụng cho đơn từ ${formatVnd(p.minBookingValue)}` : "Áp dụng cho đặt phòng",
            p.maxDiscountAmount ? `Giảm tối đa ${formatVnd(p.maxDiscountAmount)}` : "Không giới hạn mức giảm tối đa",
            isSpecificHotel ? `Chỉ áp dụng tại chi nhánh ${hotelName}` : "Áp dụng cho toàn bộ chuỗi Sen Việt",
            "Mỗi khách hàng áp dụng 1 lần / đơn",
          ],
          conditionsEn: [
            p.minBookingValue ? `Valid for orders from ${formatVnd(p.minBookingValue)}` : "Valid for bookings",
            isSpecificHotel ? `Applicable strictly at ${hotelName}` : "Valid across all Sen Việt locations",
            "Non-transferable",
          ],
          hotels: isSpecificHotel ? [hotelName] : ["Tất cả khách sạn Sen Việt"],
          hotelsEn: isSpecificHotel ? [hotelName] : ["All Sen Việt hotels"],
          valid: p.endDate ? formatDisplayDate(p.endDate, "vi") : "31/12/2026",
          validEn: p.endDate ? formatDisplayDate(p.endDate, "en") : "31 Dec 2026",
          accent: accents[idx % accents.length],
        };
      })
    : offers;

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredOffers = useMemo(() => {
    return displayOffers.filter((offer: any) => {
      // Search term (by name, code, or description)
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchTitle = (offer.title || "").toLowerCase().includes(term) || (offer.titleEn || "").toLowerCase().includes(term);
        const matchCode = (offer.code || "").toLowerCase().includes(term);
        const matchDesc = (offer.description || "").toLowerCase().includes(term) || (offer.descriptionEn || "").toLowerCase().includes(term);
        if (!matchTitle && !matchCode && !matchDesc) return false;
      }
      // Hotel filter
      if (selectedHotel !== "all") {
        if (selectedHotel === "system") {
          if (offer.hotelId && offer.hotelName && !offer.hotelName.toLowerCase().includes("toàn")) {
            return false;
          }
        } else {
          const offerHotelId = offer.hotelId ? String(offer.hotelId) : "";
          const offerHotelName = (offer.hotelName || "").toLowerCase();
          const target = selectedHotel.toLowerCase();
          const isSystemWide = !offer.hotelId || offerHotelName.includes("toàn");
          const isExactHotel = offerHotelId === selectedHotel || offerHotelName.includes(target);
          if (!isSystemWide && !isExactHotel) {
            return false;
          }
        }
      }
      // Type filter (ROOM, SERVICE, TOTAL)
      if (selectedType !== "all") {
        const rawType = offer.rawType || offer.type || (offer.tag === "PHÒNG" ? "ROOM" : offer.tag === "DỊCH VỤ" ? "SERVICE" : "TOTAL");
        if (rawType !== selectedType) return false;
      }
      return true;
    });
  }, [displayOffers, searchTerm, selectedHotel, selectedType]);

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

          {/* Search and Filters Bar */}
          <div className="mx-auto mt-8 max-w-6xl space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isVietnamese ? "Tìm kiếm theo tên ưu đãi, mã voucher..." : "Search by promotion name, promo code..."}
                  className="w-full rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 pl-10 pr-10 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Hotel Filter Dropdown */}
              <div className="sm:w-72">
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="w-full rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isVietnamese ? "🏨 Tất cả chi nhánh & khách sạn" : "🏨 All hotels & branches"}</option>
                  <option value="system" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isVietnamese ? "⭐ Toàn hệ thống Sen Việt" : "⭐ Entire Sen Việt system"}</option>
                  {hotels.map((h) => (
                    <option key={h.slug} value={String(h.id || h.slug)}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Chips (Scope / Type) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                {isVietnamese ? "Loại ưu đãi:" : "Category:"}
              </span>
              {[
                { key: "all", labelVi: "Tất cả", labelEn: "All" },
                { key: "ROOM", labelVi: "Giảm giá phòng", labelEn: "Room discount" },
                { key: "SERVICE", labelVi: "Giảm giá dịch vụ", labelEn: "Service discount" },
                { key: "TOTAL", labelVi: "Toàn bộ hóa đơn", labelEn: "Total bill" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setSelectedType(f.key)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    selectedType === f.key
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:text-primary hover:bg-white dark:hover:bg-slate-700"
                  }`}
                >
                  {isVietnamese ? f.labelVi : f.labelEn}
                </button>
              ))}

              {(searchTerm || selectedHotel !== "all" || selectedType !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedHotel("all");
                    setSelectedType("all");
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary underline hover:text-gold"
                >
                  <X className="h-3 w-3" />
                  {isVietnamese ? "Đặt lại bộ lọc" : "Reset filters"}
                </button>
              )}
            </div>

            {/* Results Count Banner */}
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-1">
              <span>
                {isVietnamese
                  ? `Tìm thấy ${filteredOffers.length} chương trình khuyến mãi phù hợp`
                  : `Found ${filteredOffers.length} matching promotions`}
              </span>
            </div>
          </div>

          {filteredOffers.length === 0 ? (
            <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center">
              <Ticket className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-3 font-bold text-primary">
                {isVietnamese ? "Không tìm thấy ưu đãi phù hợp" : "No promotions found"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {isVietnamese
                  ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn lại chi nhánh khách sạn."
                  : "Try adjusting your search query or select another hotel branch."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedHotel("all");
                  setSelectedType("all");
                }}
                className="mt-4 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {isVietnamese ? "Xem tất cả ưu đãi" : "View all offers"}
              </button>
            </div>
          ) : (
            <div className="mx-auto mt-8 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer) => {
              const Icon = offer.icon;
              const copied = copiedCode === offer.code;
              const offerId = (offer as any).id;
              const isSaved = isSavedCode(offer.code, offerId);

              return (
                <article
                  key={offer.code}
                  className={`group flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br ${offer.accent} dark:from-slate-900 dark:to-slate-950 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-6`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-amber-400 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] ${
                        (offer as any).hotelId
                          ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-xs"
                          : "bg-secondary/80 text-primary font-medium"
                      }`}>
                        <Building2 className="h-3 w-3 text-gold" />
                        {(offer as any).hotelName || "Toàn hệ thống"}
                      </span>
                      <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold tracking-wide text-gold-foreground">
                        {offer.tag}
                      </span>
                    </div>
                  </div>
                  <h2 className="mt-6 font-display text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100">
                    {isVietnamese ? offer.title : offer.titleEn}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {isVietnamese ? offer.description : offer.descriptionEn}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 p-3 shadow-xs">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">
                        {isVietnamese ? "Mã ưu đãi" : "Promo code"}
                      </p>
                      <p className="mt-1 font-bold tracking-wider text-slate-900 dark:text-amber-400">{offer.code}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyCode(offer.code)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs transition hover:bg-slate-100 dark:hover:bg-slate-600"
                      aria-label={isVietnamese ? "Sao chép mã" : "Copy code"}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
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
        )}
        </div>
      </section>

      <Dialog open={Boolean(selectedOffer)} onOpenChange={(open) => !open && setSelectedOffer(null)}>
        {selectedOffer && (
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl p-5 sm:p-7">
            {selectedOffer.image && (
              <div className="relative -mx-5 -mt-5 mb-5 h-48 overflow-hidden rounded-t-2xl sm:-mx-7 sm:-mt-7 sm:h-60">
                <img loading="lazy" decoding="async"
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

      <section className="container py-12 sm:py-16 pb-24 sm:pb-28">
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

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHotel, setSelectedHotel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Dynamic categories
  const categories = useMemo(() => {
    if (!backendServices || backendServices.length === 0) return ["all"];
    const set = new Set<string>();
    backendServices.forEach((s) => {
      if (s.category && s.category.trim()) {
        set.add(s.category.trim());
      }
    });
    return ["all", ...Array.from(set)];
  }, [backendServices]);

  // Filtered services
  const filteredServices = useMemo(() => {
    if (!backendServices || backendServices.length === 0) return [];
    return backendServices.filter((srv) => {
      // 1. Search term (by name, description, category)
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const matchName = (srv.name || "").toLowerCase().includes(term);
        const matchDesc = (srv.description || "").toLowerCase().includes(term);
        const matchCat = (srv.category || "").toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      // 2. Hotel filter
      if (selectedHotel !== "all") {
        if (selectedHotel === "system") {
          if (srv.hotelId && srv.hotelName && !srv.hotelName.toLowerCase().includes("toàn")) {
            return false;
          }
        } else {
          const srvHotelId = srv.hotelId ? String(srv.hotelId) : "";
          const srvHotelName = (srv.hotelName || "").toLowerCase();
          const target = selectedHotel.toLowerCase();
          const isChainWide = !srv.hotelId || srvHotelName.includes("toàn chuỗi") || srvHotelName.includes("toàn");
          const isExactHotel = srvHotelId === selectedHotel || srvHotelName.includes(target);
          if (!isChainWide && !isExactHotel) {
            return false;
          }
        }
      }
      // 3. Category filter
      if (selectedCategory !== "all") {
        if ((srv.category || "").trim() !== selectedCategory) return false;
      }
      return true;
    });
  }, [backendServices, searchTerm, selectedHotel, selectedCategory]);

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

      {backendServices && backendServices.length > 0 && (
        <div className="mx-auto mt-8 max-w-6xl space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isVietnamese ? "Tìm theo tên dịch vụ, món ăn, spa, đưa đón..." : "Search services, dining, spa, transfer..."}
                className="w-full rounded-full border border-border bg-white pl-10 pr-10 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Hotel Filter Dropdown */}
            <div className="sm:w-72">
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
              >
                <option value="all">{isVietnamese ? "🏨 Tất cả khách sạn / chi nhánh" : "🏨 All hotels & branches"}</option>
                <option value="system">{isVietnamese ? "⭐ Toàn chuỗi Sen Việt" : "⭐ Chain-wide services"}</option>
                {hotels.map((h) => (
                  <option key={h.slug} value={String(h.id || h.slug)}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Filter Chips */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                {isVietnamese ? "Danh mục:" : "Category:"}
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-white/80 text-muted-foreground border border-border hover:text-primary hover:bg-white"
                  }`}
                >
                  {cat === "all" ? (isVietnamese ? "Tất cả" : "All") : cat}
                </button>
              ))}

              {(searchTerm || selectedHotel !== "all" || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedHotel("all");
                    setSelectedCategory("all");
                  }}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary underline hover:text-gold"
                >
                  <X className="h-3 w-3" />
                  {isVietnamese ? "Đặt lại bộ lọc" : "Reset filters"}
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground pt-1">
            <span>
              {isVietnamese
                ? `Tìm thấy ${filteredServices.length} dịch vụ đáp ứng yêu cầu`
                : `Found ${filteredServices.length} matching services`}
            </span>
          </div>
        </div>
      )}

      {backendServices && backendServices.length > 0 ? (
        filteredServices.length === 0 ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h3 className="mt-3 font-bold text-primary">
              {isVietnamese ? "Không tìm thấy dịch vụ phù hợp" : "No services found"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {isVietnamese
                ? "Vui lòng thử lại với từ khóa khác hoặc bỏ chọn bộ lọc chi nhánh."
                : "Please try another keyword or clear hotel branch filters."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedHotel("all");
                setSelectedCategory("all");
              }}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {isVietnamese ? "Xem tất cả dịch vụ" : "View all services"}
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((srv) => (
              <article
                key={srv.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {srv.imageUrl && (
                  <div className="h-48 overflow-hidden bg-secondary">
                    <img loading="lazy" decoding="async"
                      src={srv.imageUrl}
                      alt={srv.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gold">
                    <span className="rounded-md bg-secondary/80 px-2 py-0.5">{srv.category || "Dịch vụ"}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Building2 className="h-3 w-3 text-gold" />
                      {srv.hotelName || "Toàn chuỗi"}
                    </span>
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
        )
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
