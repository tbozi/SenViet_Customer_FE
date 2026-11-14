import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import { fetchHotelReviews } from "@/services/reviewApi";

interface DisplayReview {
  id: string;
  quote: string;
  author: string;
  role: string;
  stay: string;
  rating: number;
}

export function GuestTestimonials() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const { data: beHotels = [] } = useGetPublicHotelsQuery();
  const [reviews, setReviews] = useState<DisplayReview[]>([]);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(5.0);

  useEffect(() => {
    let active = true;
    if (!beHotels || beHotels.length === 0) return;

    Promise.all(
      beHotels.map(async (h) => {
        try {
          const summary = await fetchHotelReviews(h.id);
          return { hotel: h, summary };
        } catch {
          return { hotel: h, summary: null };
        }
      }),
    ).then((results) => {
      if (!active) return;
      const allRevs: DisplayReview[] = [];
      let totalCount = 0;
      let weightedSum = 0;

      for (const { hotel, summary } of results) {
        if (!summary || !Array.isArray(summary.reviews)) continue;
        const count = summary.totalReviews || summary.reviews.length;
        totalCount += count;
        weightedSum += (summary.averageRating || 5) * count;
        for (const r of summary.reviews) {
          allRevs.push({
            id: `${hotel.id}-${r.id}`,
            quote:
              r.comment ||
              (isEn
                ? "Great stay and attentive service."
                : "Trải nghiệm lưu trú tuyệt vời, dịch vụ chu đáo."),
            author: r.customerName || (isEn ? "Verified Guest" : "Khách hàng xác thực"),
            role: r.createdAt
              ? new Date(r.createdAt).toLocaleDateString(isEn ? "en-US" : "vi-VN")
              : isEn
                ? "Verified Booking"
                : "Đặt phòng xác thực",
            stay: [r.roomTypeName, hotel.name].filter(Boolean).join(" — "),
            rating: Math.max(1, Math.min(5, Math.round(r.rating || 5))),
          });
        }
      }

      setReviews(allRevs.slice(0, 6));
      setTotalReviewsCount(totalCount);
      setAverageRating(
        totalCount > 0 ? Number((weightedSum / totalCount).toFixed(1)) : 5.0,
      );
    });

    return () => {
      active = false;
    };
  }, [beHotels, isEn]);

  return (
    <section className="bg-stone-50/70 py-24 border-t border-border/50">
      <div className="container">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>{isEn ? "Guest Reflections" : "Lời Khen Từ Khách Quý"}</span>
          </div>

          <h2 className="mt-4 font-display text-4xl font-bold text-primary sm:text-5xl">
            {isEn ? "Cherished Memories at Sen Việt" : "Dấu Ấn Lưu Lại Trong Lòng Du Khách"}
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {isEn
              ? "Authentic stories shared by distinguished guests who experienced our bespoke hospitality."
              : "Những dòng cảm xúc chân thành từ các khách quý sau mỗi kỳ nghỉ dưỡng đáng nhớ cùng chúng tôi."}
          </p>

          {/* Social Proof Aggregate Badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 shadow-xs border border-border/60">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-xs font-bold text-primary">{averageRating} / 5.0</span>
            <span className="text-xs text-muted-foreground border-l border-border/60 pl-2">
              {isEn
                ? `${totalReviewsCount} Verified Reviews`
                : `${totalReviewsCount} Đánh giá xác thực từ hệ thống`}
            </span>
          </div>
        </div>

        {/* Editorial Cards from DB */}
        {reviews.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center text-sm text-muted-foreground">
            {isEn
              ? "No guest reviews have been submitted yet."
              : "Chưa có đánh giá nào được gửi trên hệ thống."}
          </div>
        ) : (
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {reviews.map((rev, idx) => (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              whileHover={{ y: -5 }}
              className="relative flex flex-col justify-between rounded-3xl border border-border/70 bg-white p-8 shadow-xs transition-all duration-300 hover:shadow-xl hover:border-amber-500/40"
            >
              {/* Quote mark decoration */}
              <Quote className="h-8 w-8 text-amber-500/20 mb-4" />

              {/* Star Rating */}
              <div className="flex gap-1 text-amber-400 mb-4">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-sm leading-relaxed text-slate-700 italic flex-1">
                "{rev.quote}"
              </p>

              {/* Verified Stay Tag */}
              <div className="mt-6 pt-5 border-t border-border/50">
                <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md block truncate">
                  {rev.stay}
                </span>

                {/* Author Info */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ring-2 ring-amber-500/30">
                    {(rev.author || "K").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-display text-sm font-bold text-primary">
                      {rev.author}
                    </h4>
                    <p className="text-xs text-muted-foreground">{rev.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
}
