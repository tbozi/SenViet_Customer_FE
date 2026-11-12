import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyBadge, CountUp } from "@/components/ui/TextAnimations";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  id: string;
  image: string;
  tagline: { vi: string; en: string };
  title: { vi: string; en: string };
  subtitle: { vi: string; en: string };
  location: { vi: string; en: string };
  hotelLink: string;
}

/**
 * Hero Slides - Only featuring VERIFIED hotels in the Sen Việt system:
 * 1. Sen Việt Sài Gòn (123 Lê Lợi, Q.1, TP.HCM)
 * 2. Sen Việt Hà Nội (45 Tràng Tiền, Hoàn Kiếm, Hà Nội)
 * 3. Sen Việt Đà Nẵng (Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng)
 * 4. Sen Việt Nha Trang (Trần Phú, Lộc Thọ, Nha Trang, Khánh Hòa)
 * 5. Sen Việt Đà Lạt (Trần Hưng Đạo, P.10, Đà Lạt, Lâm Đồng)
 */
const HERO_SLIDES: HeroSlide[] = [
  {
    id: "sen-viet-sai-gon",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2200&auto=format&fit=crop",
    tagline: {
      vi: "SEN VIỆT SÀI GÒN • QUẬN 1",
      en: "SEN VIỆT SAIGON • DISTRICT 1",
    },
    title: {
      vi: "Nghỉ Dưỡng Thượng Lưu Giữa Trái Tim Hoa Lệ Sài Gòn",
      en: "Bespoke Luxury Living in the Heart of Saigon",
    },
    subtitle: {
      vi: "Tọa lạc tại 123 Lê Lợi, Quận 1 với hồ bơi vô cực dát vàng trên tầng thượng, spa thảo dược hoa sen độc bản và nhà hàng fine-dining chuẩn quốc tế.",
      en: "Located at 123 Le Loi, District 1 featuring a rooftop gold-accented infinity pool, signature lotus spa, and world-class fine dining.",
    },
    location: {
      vi: "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
      en: "123 Le Loi, District 1, Ho Chi Minh City",
    },
    hotelLink: "/hotels/sen-viet-sai-gon/details",
  },
  {
    id: "sen-viet-ha-noi",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=2200&auto=format&fit=crop",
    tagline: {
      vi: "SEN VIỆT HÀ NỘI • HOÀN KIẾM",
      en: "SEN VIỆT HANOI • HOAN KIEM",
    },
    title: {
      vi: "Kiệt Tác Kiến Trúc Đông Dương Kề Bên Hồ Gươm",
      en: "Indochine Architectural Masterpiece by Hoan Kiem Lake",
    },
    subtitle: {
      vi: "Tọa lạc tại 45 Tràng Tiền kề bên Hồ Gươm, tái hiện vẻ đẹp quý tộc hoàng gia Thăng Long xưa với ban công ngắm trọn tháp Rùa và trà thất cung đình.",
      en: "Located at 45 Trang Tien beside Hoan Kiem Lake, reviving ancient Thang Long nobility with lakeview balconies and imperial tea lounge.",
    },
    location: {
      vi: "45 Tràng Tiền, Hoàn Kiếm, Hà Nội",
      en: "45 Trang Tien, Hoan Kiem, Hanoi",
    },
    hotelLink: "/hotels/sen-viet-ha-noi/details",
  },
  {
    id: "sen-viet-da-nang",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2200&auto=format&fit=crop",
    tagline: {
      vi: "SEN VIỆT ĐÀ NẴNG • BIỂN MỸ KHÊ",
      en: "SEN VIỆT DA NANG • MY KHE BEACH",
    },
    title: {
      vi: "Thiên Đường Nghỉ Dưỡng Nhiệt Đới Trên Bờ Biển Mỹ Khê",
      en: "Tropical Beachfront Sanctuary on Iconic My Khe Beach",
    },
    subtitle: {
      vi: "Tọa lạc trên đường Võ Nguyên Giáp, bãi biển cát trắng riêng biệt, hồ bơi nước mặn tràn bờ uốn lượn và trung tâm chăm sóc sức khỏe đá muối Himalaya.",
      en: "Located on Vo Nguyen Giap street with a private white-sand beach, lagoon saltwater infinity pool, and Himalayan wellness sanctuary.",
    },
    location: {
      vi: "Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng",
      en: "Vo Nguyen Giap, Ngu Hanh Son, Da Nang",
    },
    hotelLink: "/hotels/sen-viet-da-nang/details",
  },
  {
    id: "sen-viet-nha-trang",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2200&auto=format&fit=crop",
    tagline: {
      vi: "SEN VIỆT NHA TRANG • ĐƯỜNG TRẦN PHÚ",
      en: "SEN VIỆT NHA TRANG • TRAN PHU BOULEVARD",
    },
    title: {
      vi: "Viên Ngọc Đại Dương Rực Rỡ Trên Vịnh Biển Nha Trang",
      en: "Shimmering Oceanic Jewel on Magnificent Nha Trang Bay",
    },
    subtitle: {
      vi: "Tọa lạc trên cung đường vàng Trần Phú, 100% phòng nghỉ sở hữu ban công kính tràn viền ôm trọn biển ngọc bích cùng Sky Bar ngắm hoàng hôn vịnh biển.",
      en: "Located along golden Tran Phu boulevard, 100% rooms feature glass-front balconies facing turquoise waters and panoramic sunset Sky Bar.",
    },
    location: {
      vi: "Trần Phú, Lộc Thọ, Nha Trang, Khánh Hòa",
      en: "Tran Phu, Loc Tho, Nha Trang, Khanh Hoa",
    },
    hotelLink: "/hotels/sen-viet-nha-trang/details",
  },
  {
    id: "sen-viet-da-lat",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2200&auto=format&fit=crop",
    tagline: {
      vi: "SEN VIỆT ĐÀ LẠT • CAO NGUYÊN THÔNG REO",
      en: "SEN VIỆT DA LAT • PINE HIGHLANDS",
    },
    title: {
      vi: "Không Gian Cổ Tích Lãng Mạn Giữa Ngàn Thông & Sương Mây",
      en: "French Heritage Romance Amidst Misty Pine Hills",
    },
    subtitle: {
      vi: "Tọa lạc tại Trần Hưng Đạo giữa ngàn thông reo, lò sưởi ấm cúng trong từng gian phòng, ban công ngắm hồ sương mù và trà chiều quý tộc Pháp thanh khiết.",
      en: "Located on Tran Hung Dao amongst whispering pines, featuring fireplaces in every room, misty valley balconies, and refined afternoon tea.",
    },
    location: {
      vi: "Trần Hưng Đạo, Phường 10, Đà Lạt, Lâm Đồng",
      en: "Tran Hung Dao, Ward 10, Da Lat, Lam Dong",
    },
    hotelLink: "/hotels/sen-viet-da-lat/details",
  },
];

const SLIDE_DURATION = 6500; // 6.5s per slide

export function HeroCinematicSlider({
  hotelCount = 7,
  provinceCount = 7,
}: {
  hotelCount?: number;
  provinceCount?: number;
}) {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  const activeSlide = HERO_SLIDES[currentIndex];

  return (
    <section
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-[700px] lg:min-h-[740px] w-full overflow-hidden bg-slate-950"
    >
      {/* 1. Ken Burns Cinematic Background Slide Layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          {/* Ken Burns Slow Zoom Motion (1.0 -> 1.07 over 7s) */}
          <motion.img
            src={activeSlide.image}
            alt={activeSlide.title[isEn ? "en" : "vi"]}
            initial={{ scale: 1 }}
            animate={{ scale: 1.07 }}
            transition={{ duration: 7, ease: [0.16, 1, 0.3, 1] }}
            className="h-full w-full object-cover object-center"
          />

          {/* Luxury Dual Gradient Overlays for High-Contrast Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,rgba(217,119,6,0.18),transparent_65%)]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* 2. Slide Content & Foreground Typography */}
      <div className="container relative z-10 flex min-h-[700px] lg:min-h-[740px] items-center py-24">
        <div className="max-w-3xl text-primary-foreground">
          {/* Tagline & Location Pill */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <ShinyBadge>
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>{activeSlide.tagline[isEn ? "en" : "vi"]}</span>
            </ShinyBadge>

            <motion.div
              key={`loc-${activeSlide.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-md"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>{activeSlide.location[isEn ? "en" : "vi"]}</span>
            </motion.div>
          </div>

          {/* Animated Headline Transition */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={`title-${activeSlide.id}`}
              initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(6px)" }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-6xl lg:text-7xl drop-shadow-md"
            >
              {activeSlide.title[isEn ? "en" : "vi"]}
            </motion.h1>
          </AnimatePresence>

          {/* Animated Subtitle */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${activeSlide.id}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200 sm:text-xl drop-shadow-xs"
            >
              {activeSlide.subtitle[isEn ? "en" : "vi"]}
            </motion.p>
          </AnimatePresence>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-amber-500 px-8 text-slate-950 font-bold hover:bg-amber-400 shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
            >
              <Link to={activeSlide.hotelLink}>
                {isEn ? "View Hotel Details" : "Xem Chi Tiết Khách Sạn"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document
                  .getElementById("quick-search")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              className="rounded-full border-white/40 bg-white/10 px-8 text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer font-medium"
            >
              {isEn ? "Quick Availability Check" : "Tìm Kiếm Phòng Nhanh"}
            </Button>
          </div>

          {/* Anchored Stats Row */}
          <div className="mt-14 flex flex-wrap gap-8 border-t border-white/20 pt-6">
            <div>
              <div className="font-display text-2xl font-bold text-amber-400">
                <CountUp end={hotelCount} />
              </div>
              <div className="text-xs text-slate-300">
                {isEn ? "Luxury Hotels" : "Khách Sạn Thuộc Hệ Thống"}
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-amber-400">
                <CountUp end={provinceCount} />
              </div>
              <div className="text-xs text-slate-300">
                {isEn ? "Provinces Covered" : "Tỉnh Thành Phủ Sóng"}
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-amber-400 tabular-nums">
                24/7
              </div>
              <div className="text-xs text-slate-300">
                {isEn ? "Dedicated Butler" : "Dịch Vụ Quản Gia 24/7"}
              </div>
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-amber-400">
                <CountUp end={98} suffix="%" />
              </div>
              <div className="text-xs text-slate-300">
                {isEn ? "Guest Satisfaction" : "Tỷ Lệ Hài Lòng"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Slider Navigation Controls */}
      <div className="absolute bottom-10 right-6 sm:right-12 z-20 flex items-center gap-4 bg-slate-950/60 border border-white/20 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-2xl">
        {/* Slide Counter (e.g. 01 / 05) */}
        <div className="font-mono text-xs font-bold tracking-wider text-amber-400">
          <span>{String(currentIndex + 1).padStart(2, "0")}</span>
          <span className="text-white/40 mx-1">/</span>
          <span className="text-white/60">{String(HERO_SLIDES.length).padStart(2, "0")}</span>
        </div>

        {/* Slide Indicator Dots with Progress */}
        <div className="flex items-center gap-1.5">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentIndex === idx
                  ? "w-7 bg-amber-400 shadow-xs shadow-amber-400/50"
                  : "w-2 bg-white/30 hover:bg-white/60"
              )}
            />
          ))}
        </div>

        {/* Prev / Next Navigation Arrows */}
        <div className="flex items-center gap-1 border-l border-white/20 pl-2">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-all active:scale-90"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4. Slim Automatic Progress Bar at the Top Edge */}
      {!isPaused && (
        <motion.div
          key={`bar-${currentIndex}`}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
          className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 z-30"
        />
      )}
    </section>
  );
}
