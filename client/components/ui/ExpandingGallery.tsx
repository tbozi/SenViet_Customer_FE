import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DestinationItem {
  id: string;
  name: string;
  count: number;
  image: string;
}

export interface ExpandingGalleryProps {
  destinations: DestinationItem[];
  language?: string;
  className?: string;
}

export const PROVINCE_FALLBACKS: Record<string, string> = {
  "TP. Hồ Chí Minh": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200",
  "Hồ Chí Minh": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200",
  "Hà Nội": "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?q=80&w=1200",
  "Đà Nẵng": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200",
  "Khánh Hòa": "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200",
  "Nha Trang": "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=1200",
  "Lâm Đồng": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1200",
  "Đà Lạt": "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1200",
  "Tiền Giang": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1200",
  "Gò Công": "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=1200",
  "Bình Định": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200",
  "An Nhơn": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200",
};

/**
 * ExpandingGallery - Accordion Expanding Destination Showcase
 * Inspired by React Bits Flex Carousel (reactbits.dev) & Impeccable Magazine Layout
 * Smoothly expands hovered card while elegantly compressing siblings
 */
export function ExpandingGallery({
  destinations,
  language = "vi",
  className,
}: ExpandingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const getValidImage = (dest: DestinationItem) => {
    if (dest.image && !dest.image.includes("example.com")) {
      return dest.image;
    }
    return PROVINCE_FALLBACKS[dest.name] || "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200";
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop / Tablet: Expanding Accordion Flex Gallery */}
      <div className="hidden md:flex h-[440px] w-full gap-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
        {destinations.map((dest, index) => {
          const isActive = activeIndex === index;
          const formattedIndex = String(index + 1).padStart(2, "0");
          const imageUrl = getValidImage(dest);

          return (
            <motion.div
              key={dest.id}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "relative h-full overflow-hidden rounded-2xl cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-slate-900",
                isActive
                  ? "flex-[3.5] shadow-2xl ring-1 ring-amber-500/40"
                  : "flex-1 opacity-85 hover:opacity-100"
              )}
            >
              <Link
                to={`/hotels?province=${encodeURIComponent(dest.name)}`}
                className="block h-full w-full"
              >
                {/* Background Image with Fallback */}
                <img
                  src={imageUrl}
                  alt={dest.name}
                  loading="lazy"
                  onError={(e) => {
                    const fallback = PROVINCE_FALLBACKS[dest.name] || "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200";
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out",
                    isActive ? "scale-105" : "scale-100"
                  )}
                />

                {/* Dark Gradient Overlay for AAA Contrast */}
                <div
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500",
                    isActive
                      ? "bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/10"
                      : "bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent"
                  )}
                />

                {/* Top Badge: Editorial Index (e.g. 01, 02) */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <span className="font-display text-xs font-bold tracking-widest text-amber-400 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-500/30 shadow-md">
                    {formattedIndex}
                  </span>
                </div>

                {/* Bottom Content Area */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-5 transition-all duration-300">
                  <div className="flex items-center gap-1 text-xs text-amber-300 mb-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <span className="truncate">{language === "en" ? "Destination" : "Điểm đến"}</span>
                  </div>

                  <h3
                    className={cn(
                      "font-display font-bold text-white transition-all duration-300",
                      isActive ? "text-2xl sm:text-3xl" : "text-base lg:text-lg truncate"
                    )}
                  >
                    {dest.name}
                  </h3>

                  <div className="flex items-center justify-between gap-2 mt-2">
                    <p className="text-xs text-slate-300 tabular-nums shrink-0">
                      {dest.count}{" "}
                      {language === "en"
                        ? dest.count === 1
                          ? "hotel"
                          : "hotels"
                        : "khách sạn di sản"}
                    </p>

                    {isActive && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-amber-400 border border-amber-400 backdrop-blur-md px-3.5 py-1.5 rounded-full transition-all hover:bg-amber-300 whitespace-nowrap shrink-0 shadow-lg shadow-amber-400/20">
                        <span>{language === "en" ? "Explore" : "Khám phá ngay"}</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile: Horizontal scrollable cards with snap */}
      <div className="flex md:hidden gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none">
        {destinations.map((dest, index) => {
          const imageUrl = getValidImage(dest);
          return (
            <Link
              key={dest.id}
              to={`/hotels?province=${encodeURIComponent(dest.name)}`}
              className="group relative flex h-64 min-w-[240px] shrink-0 snap-start items-end overflow-hidden rounded-2xl bg-secondary p-5 text-white shadow-md active:scale-95 transition-transform"
            >
              <img
                src={imageUrl}
                alt={dest.name}
                loading="lazy"
                onError={(e) => {
                  const fallback = PROVINCE_FALLBACKS[dest.name] || "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200";
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className="font-display text-[10px] font-bold tracking-widest text-amber-400 bg-slate-950/70 backdrop-blur px-2 py-0.5 rounded-full border border-amber-500/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="relative z-10 w-full">
                <span className="text-lg font-bold text-white block">{dest.name}</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-white/80 tabular-nums">
                    {dest.count}{" "}
                    {language === "en" ? (dest.count === 1 ? "hotel" : "hotels") : "khách sạn"}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-amber-400" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
