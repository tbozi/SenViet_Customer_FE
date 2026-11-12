import React from "react";
import { motion } from "framer-motion";
import { Star, Quote, Sparkles, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

/**
 * GuestTestimonials - Editorial Social Proof & Luxury Guest Reviews
 * Delivers emotional trust, prestigious social proof, and authentic 5-star feedback
 */
export function GuestTestimonials() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const reviews = [
    {
      id: 1,
      quote: isEn
        ? "From the scent of white lotus upon arrival to the flawless private butler service, Sen Việt embodies the true essence of Vietnamese elegance. An unforgettable weekend retreat."
        : "Từ hương sen trắng thoảng nhẹ khi vừa bước chân vào sảnh đến dịch vụ quản gia riêng chu đáo đến từng chi tiết nhỏ nhất. Sen Việt chính là đỉnh cao của lòng hiếu khách Việt Nam.",
      author: "Trần Minh Quân",
      role: isEn ? "Managing Director & Art Collector" : "Tổng Giám đốc & Nhà Sưu Tập Nghệ Thuật",
      stay: isEn ? "Stayed at Lotus Presidential Suite — Sen Việt Sài Gòn" : "Nghỉ tại Lotus Presidential Suite — Sen Việt Sài Gòn",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      rating: 5,
    },
    {
      id: 2,
      quote: isEn
        ? "The ocean panorama suite in Nha Trang surpassed all our expectations. Dining beside the waves at sunset while savoring fresh seafood and royal flavors was the highlight of our journey."
        : "Căn phòng hướng trọn vịnh biển tại Nha Trang vượt xa mọi kỳ vọng của vợ chồng tôi. Thưởng thức bữa tối hoàng hôn trên cung đường Trần Phú bên tiếng sóng biển là kỷ niệm đẹp nhất năm nay.",
      author: "Elizabeth & Marcus Vance",
      role: isEn ? "Architects from London, UK" : "Kiến Trúc Sư — London, Vương Quốc Anh",
      stay: isEn ? "Stayed at Ocean Panorama Suite — Sen Việt Nha Trang" : "Nghỉ tại Ocean Panorama Suite — Sen Việt Nha Trang",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
      rating: 5,
    },
    {
      id: 3,
      quote: isEn
        ? "The Lotus Spa therapy and mineral onsen baths restored both my mind and energy. The balance between ancient architecture and modern high-tech convenience is truly world-class."
        : "Liệu trình trị liệu spa hoa sen và hồ khoáng nóng onsen đã hồi sinh trọn vẹn năng lượng cho tôi. Sự hòa quyện giữa kiến trúc cổ điển và tiện nghi thông minh thực sự đạt đẳng cấp quốc tế.",
      author: "Vũ Thu Trang",
      role: isEn ? "Fashion Designer & Wellness Author" : "Nhà Thiết Kế Thời Trang & Tác Giả Sách",
      stay: isEn ? "Stayed at Heritage Garden Villa — Sen Việt Đà Nẵng" : "Nghỉ tại Heritage Garden Villa — Sen Việt Đà Nẵng",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
      rating: 5,
    },
  ];

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
            <span className="text-xs font-bold text-primary">4.92 / 5.0</span>
            <span className="text-xs text-muted-foreground border-l border-border/60 pl-2">
              {isEn ? "+2,400 Verified Reviews" : "+2.400 Đánh giá xác thực"}
            </span>
          </div>
        </div>

        {/* 3 Editorial Cards */}
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
                  <img
                    src={rev.avatar}
                    alt={rev.author}
                    className="h-11 w-11 rounded-full object-cover ring-2 ring-amber-500/30"
                  />
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
      </div>
    </section>
  );
}
