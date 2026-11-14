import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Tag, Sparkles, Copy, Check, ArrowRight, Clock, Gift } from "lucide-react";
import { useGetActivePromotionsQuery } from "@/services/promotionApi";
import { useLanguage } from "@/lib/i18n";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CuratedPromotions() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const { data: activePromos = [] } = useGetActivePromotionsQuery();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(
      isEn ? `Promotion code ${code} copied to clipboard!` : `Đã sao chép mã ưu đãi ${code} vào bộ nhớ tạm!`
    );
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Fallback curated seasonal offers if backend list is empty
  const fallbackOffers = [
    {
      id: "promo-1",
      code: "HERITAGE25",
      name: isEn ? "Heritage Early Bird Privilege" : "Ưu Đãi Đặt Sớm Di Sản 2026",
      discountBadge: isEn ? "25% OFF" : "GIẢM 25%",
      description: isEn
        ? "Enjoy 25% off when booking your stay 30 days in advance. Includes complimentary gourmet buffet breakfast."
        : "Tiết kiệm 25% giá phòng khi đặt trước 30 ngày. Miễn phí bữa sáng buffet thượng hạng mỗi ngày.",
      validity: isEn ? "Valid until Dec 31, 2026" : "Áp dụng đến 31/12/2026",
      tag: isEn ? "Early Bird" : "Đặt sớm",
      color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    },
    {
      id: "promo-2",
      code: "HONEYMOON",
      name: isEn ? "Golden Lotus Honeymoon Retreat" : "Tuần Trăng Mật Hoàng Kim",
      discountBadge: isEn ? "FREE SPA & DINNER" : "TẶNG SPA & DINNER",
      description: isEn
        ? "Bespoke romantic getaway: complimentary 60-min Lotus Spa ritual, candlelit lagoon dinner, and sparkling wine."
        : "Kỳ nghỉ ngọt ngào cho cặp đôi: tặng liệu trình spa 60 phút, bữa tối lãng mạn bên hồ sen và rượu vang.",
      validity: isEn ? "Exclusive for 2 Guests" : "Đặc quyền cho 2 khách",
      tag: isEn ? "Honeymoon" : "Trăng mật",
      color: "from-rose-500/20 to-rose-600/10 border-rose-500/30",
    },
    {
      id: "promo-3",
      code: "WEEKENDVIP",
      name: isEn ? "Weekend Serenity & Late Check-out" : "Cuối Tuần Tịnh Dưỡng & Trả Phòng Muộn",
      discountBadge: isEn ? "UPGRADE + 15:00" : "NÂNG HẠNG + 15:00",
      description: isEn
        ? "Complimentary room upgrade subject to availability, late check-out at 15:00, and welcome royal herbal tea."
        : "Ưu tiên nâng hạng phòng miễn phí, kéo dài thời gian trả phòng đến 15:00 và set trà sen chào đón.",
      validity: isEn ? "Friday - Sunday Stays" : "Áp dụng Thứ 6 - Chủ Nhật",
      tag: isEn ? "Weekend" : "Cuối tuần",
      color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    },
  ];

  // Display real backend promos from Database (no fake hardcoded vouchers)
  const displayOffers = activePromos.slice(0, 6).map((p, idx) => {
    const isPercent =
      p.discountType === "PERCENTAGE" ||
      (p as any).promotionDiscountType === "PERCENTAGE" ||
      p.type === "PERCENTAGE" ||
      Number(p.discountValue) <= 100;
    const colors = [
      "from-amber-500/20 to-amber-600/10 border-amber-500/30",
      "from-rose-500/20 to-rose-600/10 border-rose-500/30",
      "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    ];
    return {
      id: String(p.id),
      code: p.code,
      name: p.name,
      discountBadge: isPercent
        ? `GIẢM ${p.discountValue}%`
        : `GIẢM ${Number(p.discountValue).toLocaleString("vi-VN")}₫`,
      description:
        p.description ||
        (isEn
          ? "Exclusive discount for direct bookings at Sen Việt Hotels & Resorts."
          : "Ưu đãi đặc biệt áp dụng cho khách hàng đặt phòng trực tiếp tại Sen Việt."),
      validity: p.endDate ? `Đến ${p.endDate}` : "Đang áp dụng",
      tag: (p as any).hotelName || p.type || "Ưu đãi",
      color: colors[idx % colors.length],
    };
  });

  return (
    <section className="container py-24 border-t border-border/60">
      {/* Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end mb-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-gold">
            {isEn ? "04 / Seasonal Privileges" : "04 / Ưu đãi & Đặc quyền mùa"}
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            {isEn ? "Exclusive Sanctuaries & Privileges" : "Gói Nghỉ Dưỡng Mùa Lễ Hội"}
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            {isEn
              ? "Reserve directly to enjoy exclusive member rates, complimentary upgrades, and bespoke resort amenities."
              : "Đặt phòng trực tiếp để nhận mức giá ưu đãi tốt nhất, đặc quyền nâng hạng và các trải nghiệm chào đón riêng biệt."}
          </p>
        </div>

        <Link
          to="/offers"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-gold shrink-0"
        >
          <span>{isEn ? "View All Promotions" : "Xem tất cả ưu đãi"}</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1 text-gold" />
        </Link>
      </div>

      {/* Grid of Curated Offers from DB */}
      {displayOffers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-10 text-center text-sm text-muted-foreground">
          {isEn
            ? "No active promotions in the system right now."
            : "Hiện chưa có chương trình khuyến mãi đang áp dụng trong hệ thống."}
        </div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {displayOffers.map((offer, idx) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ y: -6 }}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-gradient-to-br p-7 shadow-xs transition-all duration-300 hover:shadow-xl ${offer.color}`}
          >
            <div>
              {/* Top Tag & Discount Badge */}
              <div className="flex items-center justify-between gap-2 pb-5 border-b border-border/40">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-xs backdrop-blur-xs">
                  <Gift className="h-3.5 w-3.5 text-gold" />
                  {offer.tag}
                </span>
                <span className="font-display text-sm font-bold text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full">
                  {offer.discountBadge}
                </span>
              </div>

              {/* Offer Details */}
              <div className="mt-5">
                <h3 className="font-display text-xl font-bold text-primary group-hover:text-primary leading-snug">
                  {offer.name}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {offer.description}
                </p>
              </div>
            </div>

            {/* Voucher Code Box & Action Button */}
            <div className="mt-7 pt-5 border-t border-border/40">
              <div className="flex items-center justify-between gap-2 bg-white/90 rounded-2xl p-2.5 border border-dashed border-amber-500/50">
                <div className="flex items-center gap-2 pl-2">
                  <Tag className="h-4 w-4 text-gold shrink-0" />
                  <span className="font-mono text-sm font-bold tracking-wider text-primary">
                    {offer.code}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleCopyCode(offer.code)}
                  className="rounded-xl bg-primary text-white hover:bg-gold hover:text-white transition-all text-xs h-8 px-3"
                >
                  {copiedCode === offer.code ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-emerald-400" />
                      {isEn ? "Copied" : "Đã chép"}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      {isEn ? "Copy" : "Chép mã"}
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {offer.validity}
                </span>
                <Link
                  to={`/hotels?promo=${encodeURIComponent(offer.code)}`}
                  className="font-semibold text-primary hover:text-gold transition-colors inline-flex items-center gap-1"
                >
                  {isEn ? "Book Now" : "Đặt phòng ngay"} &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      )}
    </section>
  );
}
