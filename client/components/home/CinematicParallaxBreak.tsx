import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flower2, Play, Sparkles, X, Compass, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/lib/i18n";

/**
 * CinematicParallaxBreak - Full-bleed Cinematic Visual Breather
 * Inspired by Luxury Hotel Brand Films (Aman, Six Senses)
 */
export function CinematicParallaxBreak() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [showVideoModal, setShowVideoModal] = useState(false);

  return (
    <>
      <section className="relative my-12 h-[520px] sm:h-[600px] w-full overflow-hidden">
        {/* Full-bleed Background Image with subtle parallax */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2200&auto=format&fit=crop')`,
            backgroundAttachment: "fixed",
          }}
        />

        {/* Cinematic Dual Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.15),transparent_70%)]" />

        {/* Content Box */}
        <div className="container relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
          {/* Lotus Flower Watermark Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-amber-400/40 bg-slate-900/60 text-amber-400 backdrop-blur-md shadow-2xl"
          >
            <Flower2 className="h-8 w-8 animate-pulse text-amber-400" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xs font-semibold uppercase tracking-[.25em] text-amber-300 drop-shadow-sm"
          >
            {isEn ? "The Art of Stillness" : "Nghệ Thuật Của Sự An Yên"}
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl max-w-4xl drop-shadow-md"
          >
            {isEn ? (
              <>
                Touch the <span className="italic font-normal text-amber-400">Eternal Moments</span>
              </>
            ) : (
              <>
                Chạm Vào Những <span className="italic font-normal text-amber-400">Khoảnh Khắc Bất Tận</span>
              </>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-200"
          >
            {isEn
              ? "Where the hectic pulse of everyday life dissolves into golden sunsets, gentle lotus breezes, and timeless serenity."
              : "Nơi nhịp sống vội vã nhường chỗ cho làn gió thoảng hương sen, hoàng hôn rực rỡ và những phút giây tĩnh tại tuyệt đối của tâm hồn."}
          </motion.p>

          {/* Interactive CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full bg-amber-500 px-8 text-slate-950 font-bold hover:bg-amber-400 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Link to="/hotels">
                <Compass className="mr-2 h-4 w-4" />
                {isEn ? "Explore Sanctuaries" : "Khám Phá Phòng Nghỉ"}
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowVideoModal(true)}
              className="rounded-full border-white/40 bg-white/10 px-7 text-white backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="mr-2 h-4 w-4 fill-white text-white" />
              {isEn ? "Virtual Tour 360°" : "Khám Phá Toàn Cảnh 360°"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* 360 Experience Virtual Tour Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-3xl border-slate-800 bg-slate-950 text-white">
          <div className="relative aspect-video w-full bg-slate-900">
            <iframe
              className="h-full w-full object-cover"
              src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0"
              title="Sen Viet Heritage 360 Tour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                {isEn ? "Sen Việt Heritage Resort & Sanctuaries Tour" : "Hành Trình Khám Phá Không Gian Sen Việt"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isEn
                  ? "Experience the architectural harmony of white lotus ponds and 5-star royal luxury."
                  : "Trải nghiệm không gian kiến trúc hồ sen thanh tao và dịch vụ chuẩn 5 sao hoàng gia."}
              </p>
            </div>
            <Button
              onClick={() => setShowVideoModal(false)}
              className="rounded-full bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
            >
              {isEn ? "Close Experience" : "Đóng trải nghiệm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
