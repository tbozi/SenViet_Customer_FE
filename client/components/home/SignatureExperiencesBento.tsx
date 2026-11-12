import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UtensilsCrossed, Sparkles, Flower2, Sailboat, HeartHandshake, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * SignatureExperiencesBento - Luxury Bento Grid Showcase
 * Inspired by React Bits Magic Bento (Reel #11) & Aman Resorts Lifestyle Section
 */
export function SignatureExperiencesBento() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const experiences = [
    {
      id: "dining",
      title: isEn ? "Imperial Gastronomy & Sunset Dining" : "Ẩm Thực Hoàng Gia & Bữa Tối Hoàng Hôn",
      subtitle: isEn ? "Fine Dining & Heritage Flavors" : "Mỹ Vị Yến Tiệc Ba Miền",
      desc: isEn
        ? "Private candlelit dining perched beside lotus lagoons or ocean bluffs, featuring a 7-course royal degustation menu crafted by master chefs."
        : "Bữa tối riêng tư dưới ánh nến lung linh bên đầm sen hoặc vách biển thơ mộng, thưởng thức yến tiệc 7 món cung đình chuẩn nghệ nhân.",
      tag: isEn ? "Signature Dining" : "Đặc quyền Ẩm thực",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80",
      colSpan: "lg:col-span-8",
      aspect: "min-h-[360px] lg:min-h-[420px]",
    },
    {
      id: "spa",
      title: isEn ? "Sen Lotus Sanctuary & Thermal Spa" : "An Trú Spa & Khoáng Nóng Thảo Dược",
      subtitle: isEn ? "Holistic Body & Mind Therapy" : "Trị Liệu Thân Tâm Chuyên Sâu",
      desc: isEn
        ? "Rejuvenate with organic white lotus oil rituals, mineral-rich thermal springs, and Himalayan salt stone saunas."
        : "Tịnh dưỡng và phục hồi thể lực cùng tinh dầu sen trắng hữu cơ, hồ khoáng nóng onsen và phòng xông đá muối Himalaya.",
      tag: isEn ? "Wellness & Spa" : "Tịnh dưỡng Spa",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
      colSpan: "lg:col-span-4",
      aspect: "min-h-[360px] lg:min-h-[420px]",
    },
    {
      id: "yacht",
      title: isEn ? "Private Heritage Yacht & Island Odyssey" : "Hành Trình Du Thuyền & Khám Phá Di Sản",
      subtitle: isEn ? "Curated Private Excursions" : "Hải Trình Riêng Tư Độc Bản",
      desc: isEn
        ? "Glide through emerald bays or historic waterways aboard luxury catamarans with champagne and cultural guides."
        : "Du ngoạn vịnh ngọc hoặc dòng sông di sản trên du thuyền riêng sang trọng, nhâm nhi champagne và lắng nghe chuyện xưa tích cũ.",
      tag: isEn ? "Exclusive Excursion" : "Hải trình Độc bản",
      image: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=800&q=80",
      colSpan: "lg:col-span-5",
      aspect: "min-h-[340px]",
    },
    {
      id: "wedding",
      title: isEn ? "Coastal Weddings & Royal Gala Celebrations" : "Lễ Cưới Bờ Biển & Dạ Yến Hoàng Gia",
      subtitle: isEn ? "Unforgettable Milestones" : "Khoảnh Khắc Trọng Đại Đáng Nhớ",
      desc: isEn
        ? "From romantic sunset ceremonies on powdery sands to opulent ballroom galas for distinguished gatherings."
        : "Từ hôn lễ ngập tràn cảm xúc bên bờ cát trắng hoàng hôn đến những dạ tiệc sang trọng tại khán phòng hoàng gia nguy nga.",
      tag: isEn ? "Celebrations" : "Sự kiện & Tiệc cưới",
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&q=80",
      colSpan: "lg:col-span-7",
      aspect: "min-h-[340px]",
    },
  ];

  return (
    <section className="container py-24">
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-gold">
            {isEn ? "02 / Signature Experiences" : "02 / Trải nghiệm đặc quyền"}
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            {isEn ? "Curated Moments Beyond Accommodation" : "Bộ Sưu Tập Trải Nghiệm Độc Bản"}
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            {isEn
              ? "Discover extraordinary bespoke rituals designed to celebrate Vietnam's royal traditions and enrich every moment of your stay."
              : "Khám phá những đặc quyền nghỉ dưỡng được thiết kế riêng nhằm tôn vinh phong vị hoàng gia Việt Nam và thăng hoa từng khoảnh khắc lưu trú."}
          </p>
        </div>

        <Link
          to="/hotels"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-gold shrink-0"
        >
          <span>{isEn ? "View All Amenities" : "Xem tất cả tiện ích"}</span>
          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-gold" />
        </Link>
      </div>

      {/* Magic Bento Grid Layout */}
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {experiences.map((exp, idx) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
            className={cn(
              "group relative overflow-hidden rounded-3xl border border-border/80 bg-slate-900 shadow-lg transition-all duration-500",
              exp.colSpan,
              exp.aspect
            )}
          >
            {/* Background Image with Zoom on Hover */}
            <img
              src={exp.image}
              alt={exp.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-80 group-hover:opacity-90"
            />

            {/* Dark Gradient Overlay for AAA Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-slate-950/20 transition-opacity duration-300" />

            {/* Top Row: Pill Tag */}
            <div className="absolute top-6 left-6 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-slate-950/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-amber-400" />
                {exp.tag}
              </span>
            </div>

            {/* Bottom Content Card */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-300/90 block mb-1">
                {exp.subtitle}
              </span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug">
                {exp.title}
              </h3>
              <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-slate-200">
                {exp.desc}
              </p>

              <div className="mt-5 flex items-center gap-3">
                <Link
                  to="/hotels"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-gold hover:border-gold hover:text-slate-950 active:scale-95"
                >
                  <span>{isEn ? "Discover Experience" : "Khám phá trải nghiệm"}</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
