import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Compass, UtensilsCrossed, Flower2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

/**
 * HeritageManifesto - Brand Philosophy & Signature Pillars
 * Delivers emotional depth and authentic storytelling for Sen Việt Luxury Hotels & Resorts
 */
export function HeritageManifesto() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const pillars = [
    {
      icon: Compass,
      number: "01",
      title: isEn ? "Indigenous Architecture" : "Kiến Trúc Bản Sắc",
      subtitle: isEn ? "Heritage & Soul" : "Di Sản & Hồn Việt",
      desc: isEn
        ? "Harmonizing sacred lotus motifs with traditional woodwork, terracotta, and native stone to craft timeless sanctuaries of serenity."
        : "Hòa quyện biểu tượng hoa sen thanh tao cùng nghệ thuật mộc truyền thống và đá tự nhiên, kiến tạo không gian nghỉ dưỡng thanh tịnh vượt thời gian.",
    },
    {
      icon: UtensilsCrossed,
      number: "02",
      title: isEn ? "Royal Gastronomy" : "Mỹ Vị Hoàng Gia",
      subtitle: isEn ? "Culinary Artistry" : "Tinh Hoa Ba Miền",
      desc: isEn
        ? "Curated imperial banquets and Vietnamese coastal delicacies elevated to international 5-star fine dining standards."
        : "Tinh hoa yến tiệc cung đình Huế và phong vị ba miền được các bếp trưởng nghệ nhân nâng tầm thành kiệt tác ẩm thực 5 sao quốc tế.",
    },
    {
      icon: Flower2,
      number: "03",
      title: isEn ? "Holistic Wellness" : "Tịnh Dưỡng Thân Tâm",
      subtitle: isEn ? "Revitalize & Restore" : "Hồi Phục Tự Nhiên",
      desc: isEn
        ? "Awakening all senses through organic lotus essential oil therapies, mineral thermal onsen, and ancient herbal wellness traditions."
        : "Đánh thức mọi giác quan với liệu trình trị liệu hoa sen độc quyền, hồ khoáng nóng onsen và phương pháp bấm huyệt thảo mộc cổ truyền.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-50/80 via-white to-stone-50/40 py-20 border-b border-border/50">
      {/* Decorative Subtle Watermark Background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <Flower2 className="h-[550px] w-[550px] text-amber-900" />
      </div>

      <div className="container relative z-10">
        {/* Section Header with Refined Editorial Typography */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-amber-700"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>{isEn ? "The Heritage Manifesto" : "Triết Lý Di Sản Sen Việt"}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 font-display text-3xl font-bold leading-snug tracking-tight text-primary sm:text-4xl lg:text-5xl"
          >
            {isEn ? (
              <>
                Where Timeless Vietnamese Heritage Meets{" "}
                <span className="italic font-normal text-amber-700">Artful Luxury</span>
              </>
            ) : (
              <>
                Nơi Nét Đẹp Di Sản Ngàn Năm Giao Hòa Cùng{" "}
                <span className="italic font-normal text-amber-700">Nghệ Thuật Hiếu Khách</span> Thượng Lưu
              </>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {isEn
              ? "Every Sen Việt resort is an architectural tribute to the spirit of Vietnam — where subtle elegance, authentic cultural preservation, and heartfelt hospitality embrace your soul."
              : "Mỗi khách sạn và resort trong bộ sưu tập Sen Việt là một tác phẩm kiến trúc tôn vinh bản sắc dân tộc — nơi nét trang nhã thanh khiết, sự gìn giữ văn hóa và lòng hiếu khách chân thành ôm trọn tâm hồn bạn."}
          </motion.p>
        </div>

        {/* 3 Signature Pillars */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                whileHover={{ y: -6 }}
                className="group relative rounded-2xl border border-border/70 bg-white/90 p-8 shadow-xs transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl backdrop-blur-xs"
              >
                {/* Index tag & Top row */}
                <div className="flex items-center justify-between border-b border-border/40 pb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors duration-300 group-hover:bg-primary group-hover:text-amber-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-display text-2xl font-bold tracking-wider text-amber-600/30 group-hover:text-amber-600/70 transition-colors">
                    {pillar.number}
                  </span>
                </div>

                {/* Pillar content */}
                <div className="mt-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 block">
                    {pillar.subtitle}
                  </span>
                  <h3 className="mt-1 font-display text-xl font-bold text-primary group-hover:text-primary transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {pillar.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
