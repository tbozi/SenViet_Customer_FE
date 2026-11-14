import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyBadge, CountUp } from "@/components/ui/TextAnimations";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import type { Hotel } from "@/data/hotels";

export interface HeroSlide {
  id: string;
  image: string;
  tagline: { vi: string; en: string };
  title: { vi: string; en: string };
  subtitle: { vi: string; en: string };
  location: { vi: string; en: string };
  hotelLink: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: "sen-viet-intro",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2200&auto=format&fit=crop",
    tagline: {
      vi: "HỆ THỐNG KHÁCH SẠN & RESORT SEN VIỆT",
      en: "SEN VIỆT HOTELS & RESORTS COLLECTION",
    },
    title: {
      vi: "Nghỉ Dưỡng Tinh Hoa Chuẩn 5 Sao Việt Nam",
      en: "Timeless Five-Star Vietnamese Hospitality",
    },
    subtitle: {
      vi: "Khám phá không gian lưu trú sang trọng, dịch vụ tận tâm 24/7 và trải nghiệm văn hóa bản địa đặc sắc tại các chi nhánh Sen Việt.",
      en: "Discover bespoke luxury accommodations, 24/7 dedicated hospitality, and authentic local experiences across Sen Việt destinations.",
    },
    location: {
      vi: "Việt Nam",
      en: "Vietnam",
    },
    hotelLink: "/hotels",
  },
];

const SLIDE_DURATION = 6500; // 6.5s per slide

export function HeroCinematicSlider({
  hotelCount = 1,
  provinceCount = 1,
  hotels = [],
}: {
  hotelCount?: number;
  provinceCount?: number;
  hotels?: Hotel[];
}) {
  const { language } = useLanguage();
  const isEn = language === "en";
  const { data: beHotels = [] } = useGetPublicHotelsQuery();

  const slides: HeroSlide[] = useMemo(() => {
    if (beHotels && beHotels.length > 0) {
      return beHotels.map((h) => ({
        id: String(h.id),
        image:
          h.imageUrls?.[0] ||
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2200&auto=format&fit=crop",
        tagline: {
          vi: `${h.name.toUpperCase()}${h.provinceName ? ` • ${h.provinceName.toUpperCase()}` : ""}`,
          en: `${h.name.toUpperCase()}${h.provinceName ? ` • ${h.provinceName.toUpperCase()}` : ""}`,
        },
        title: {
          vi: h.name,
          en: h.name,
        },
        subtitle: {
          vi: h.address
            ? `Tọa lạc tại ${h.address}${h.provinceName ? `, ${h.provinceName}` : ""}. Không gian lưu trú sang trọng chuẩn 5 sao cùng dịch vụ tận tâm 24/7 của hệ thống Sen Việt.`
            : "Không gian lưu trú sang trọng chuẩn 5 sao cùng dịch vụ tận tâm 24/7 của hệ thống Sen Việt.",
          en: h.address
            ? `Located at ${h.address}${h.provinceName ? `, ${h.provinceName}` : ""}. Five-star hospitality and 24/7 dedicated service by Sen Việt.`
            : "Five-star hospitality and 24/7 dedicated service by Sen Việt.",
        },
        location: {
          vi: [h.address, h.provinceName].filter(Boolean).join(", ") || "Việt Nam",
          en: [h.address, h.provinceName].filter(Boolean).join(", ") || "Vietnam",
        },
        hotelLink: `/hotels/${h.id}/details`,
      }));
    }
    if (hotels && hotels.length > 0) {
      return hotels.map((h) => ({
        id: String(h.id || h.slug),
        image: h.image,
        tagline: {
          vi: `${h.name.toUpperCase()}${h.province ? ` • ${h.province.toUpperCase()}` : ""}`,
          en: `${h.name.toUpperCase()}${h.province ? ` • ${h.province.toUpperCase()}` : ""}`,
        },
        title: {
          vi: h.name,
          en: h.name,
        },
        subtitle: {
          vi: h.description || "Không gian nghỉ dưỡng chuẩn 5 sao Sen Việt.",
          en: h.descriptionEn || h.description || "Five-star hospitality by Sen Việt.",
        },
        location: {
          vi: [h.city, h.province].filter(Boolean).join(", "),
          en: [h.city, h.province].filter(Boolean).join(", "),
        },
        hotelLink: `/hotels/${h.id || h.slug}/details`,
      }));
    }
    return HERO_SLIDES;
  }, [beHotels, hotels]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const safeIndex = slides.length > 0 ? currentIndex % slides.length : 0;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, slides.length));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, slides.length)) % Math.max(1, slides.length));
  }, [slides.length]);

  // Auto-play timer
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, slides.length]);

  const activeSlide = slides[safeIndex] || HERO_SLIDES[0];

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
          <span>{String(safeIndex + 1).padStart(2, "0")}</span>
          <span className="text-white/40 mx-1">/</span>
          <span className="text-white/60">{String(slides.length).padStart(2, "0")}</span>
        </div>

        {/* Slide Indicator Dots with Progress */}
        <div className="flex items-center gap-1.5">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                safeIndex === idx
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
