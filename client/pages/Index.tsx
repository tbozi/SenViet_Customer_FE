import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronRight, Clock3, Headphones, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import HotelCard from "@/components/HotelCard";
import QuickSearch from "@/components/QuickSearch";
import { MotionStaggerList } from "@/components/ui/animate-ui";
import { ExpandingGallery, PROVINCE_FALLBACKS } from "@/components/ui/ExpandingGallery";
import { HeroCinematicSlider } from "@/components/home/HeroCinematicSlider";
import { HeritageManifesto } from "@/components/home/HeritageManifesto";
import { SignatureExperiencesBento } from "@/components/home/SignatureExperiencesBento";
import { CinematicParallaxBreak } from "@/components/home/CinematicParallaxBreak";
import { CuratedPromotions } from "@/components/home/CuratedPromotions";
import { GuestTestimonials } from "@/components/home/GuestTestimonials";
import { hotels as staticHotels, Hotel } from "@/data/hotels";
import { useGetPublicHotelsQuery, useGetPublicProvincesQuery } from "@/services/hotelApi";
import { useLanguage } from "@/lib/i18n";
import { openChatWidget } from "@/components/ChatWidget";

export default function Index() {
  const { t, language } = useLanguage();
  const isEn = language === "en";
  const { data: hotels = [] } = useGetPublicHotelsQuery();
  const { data: provinces = [] } = useGetPublicProvincesQuery();

  // Merge backend data with verified static hotels
  const effectiveHotels: Hotel[] = useMemo(() => {
    if (hotels && hotels.length > 0) {
      return hotels.map((beH) => {
        const found = staticHotels.find(
          (s) => s.id === beH.id || s.name.toLowerCase().includes(beH.name.toLowerCase()),
        );
        if (found) {
          return {
            ...found,
            name: beH.name || found.name,
            city: beH.provinceName || found.city,
            province: beH.provinceName || found.province,
            description: beH.address || found.description,
            price: beH.startingPrice && beH.startingPrice >= 1000 ? beH.startingPrice : found.price,
            image: beH.imageUrls?.[0] || found.image,
          };
        }
        return {
          id: beH.id,
          slug: String(beH.id),
          name: beH.name,
          city: beH.provinceName || "Việt Nam",
          province: beH.provinceName || "Việt Nam",
          region: "central" as const,
          description: beH.address || "",
          descriptionEn: beH.address || "",
          price: beH.startingPrice && beH.startingPrice >= 1000 ? beH.startingPrice : 200000,
          rating: 4.8,
          image: beH.imageUrls?.[0] || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200",
          amenities: ["WiFi tốc độ cao", "Phục vụ 24/7", "Bữa sáng tiêu chuẩn"],
        };
      });
    }
    return staticHotels;
  }, [hotels]);

  // Group destinations by province dynamically
  const provinceDestinations = useMemo(() => {
    if (provinces && provinces.length > 0) {
      return provinces.map((p) => {
        const count = effectiveHotels.filter((h) =>
          (h.province || "").toLowerCase().includes(p.name.toLowerCase()),
        ).length;
        const validBackendImg =
          p.backgroundImageUrl && !p.backgroundImageUrl.includes("example.com")
            ? p.backgroundImageUrl
            : null;
        return {
          id: String(p.id),
          name: p.name,
          count: count > 0 ? count : 1,
          image:
            validBackendImg ||
            PROVINCE_FALLBACKS[p.name] ||
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200",
        };
      });
    }
    const provMap = new Map<string, { count: number; image: string }>();
    effectiveHotels.forEach((h) => {
      const p = h.province || "Việt Nam";
      const existing = provMap.get(p);
      if (existing) {
        existing.count += 1;
      } else {
        provMap.set(p, { count: 1, image: h.image });
      }
    });
    return Array.from(provMap.entries()).map(([name, data], idx) => ({
      id: String(idx + 1),
      name,
      count: data.count,
      image: data.image,
    }));
  }, [provinces, effectiveHotels]);

  const hotelCountNumber = effectiveHotels.length || 6;
  const provinceCountNumber = provinceDestinations.length || 6;

  const benefits = [
    { icon: Sparkles, title: t("ai.point1Title"), desc: t("ai.point1Desc") },
    { icon: Clock3, title: t("ai.point2Title"), desc: t("ai.point2Desc") },
    { icon: Headphones, title: t("ai.point3Title"), desc: t("ai.point3Desc") },
  ];

  return (
    <main>
      {/* 1. Hero Cinematic Slider (Mường Thanh Style Ken Burns Zoom & Auto-play) */}
      <HeroCinematicSlider
        hotelCount={hotelCountNumber}
        provinceCount={provinceCountNumber}
      />

      {/* 2. Quick Search Section */}
      <section id="quick-search" className="relative z-20 -mt-16 container">
        <QuickSearch />
      </section>

      {/* 3. The Heritage Manifesto (Brand Philosophy & 3 Pillars) */}
      <HeritageManifesto />

      {/* 4. Section 01: Hotel Collection */}
      <section className="container py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-gold">
              01 / Sen Việt collection
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
              {t("hotels.sectionTitle")}
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground leading-relaxed">
              {t("hotels.sectionSubtitle")}
            </p>
          </div>
          <Link to="/hotels" className="group flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-gold">
            {t("hotels.viewAll")}
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1 text-gold" />
          </Link>
        </div>
        <MotionStaggerList className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {effectiveHotels.slice(0, 6).map((hotel) => (
            <HotelCard hotel={hotel} key={hotel.slug || hotel.id} />
          ))}
        </MotionStaggerList>
      </section>

      {/* 5. Section 02: Signature Experiences Bento Grid */}
      <SignatureExperiencesBento />

      {/* 6. Cinematic Parallax Visual Breather */}
      <CinematicParallaxBreak />

      {/* 7. Section 03: Vietnam Destinations with Expanding Gallery */}
      <section className="container py-20">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-gold">
              03 / Vietnam destinations
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
              {t("hotels.regionsTitle")}
            </h2>
          </div>
          <Link to="/hotels" className="group text-sm font-semibold text-primary transition-colors hover:text-gold">
            {t("hotels.viewAll")}{" "}
            <ArrowRight className="inline h-4 w-4 transition group-hover:translate-x-1 text-gold" />
          </Link>
        </div>

        {/* Dynamic Expanding Accordion Gallery */}
        <ExpandingGallery
          destinations={provinceDestinations}
          language={language}
        />
      </section>

      {/* 8. Section 04: Curated Seasonal Promotions */}
      <CuratedPromotions />

      {/* 9. Section 05: AI Concierge */}
      <section className="overflow-hidden bg-secondary/60">
        <div className="container grid items-center gap-12 py-24 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-gold">
              05 / Sen Việt AI
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-primary sm:text-5xl">
              {t("ai.title")}
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
              {t("ai.subtitle")}
            </p>
            <div className="mt-8 space-y-5">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={openChatWidget} className="mt-9 rounded-full bg-primary px-6 hover:bg-gold hover:text-white transition-all shadow-md">
              {t("ai.cta")} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] bg-primary p-6 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-primary-foreground/10 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold text-gold-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-primary-foreground">{t("ai.widgetTitle")}</div>
                  <div className="flex items-center gap-1 text-xs text-primary-foreground/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online now
                  </div>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-primary-foreground/10 p-4 text-sm leading-relaxed text-primary-foreground/90">
                  {t("ai.widgetGreeting")}
                </div>
                <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-gold p-4 text-sm text-gold-foreground">
                  {t("ai.quickBook")}
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-primary-foreground/10 p-4 text-sm leading-relaxed text-primary-foreground/90">
                  <Check className="mb-2 h-4 w-4 text-gold" />
                  {isEn ? "I found the perfect stay for you." : "Tôi đã tìm được nơi nghỉ hoàn hảo cho bạn."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Section 06: Editorial Guest Testimonials (Social Proof) */}
      <GuestTestimonials />

      {/* 11. Section 07: Call To Action */}
      <section className="container py-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center sm:px-16 shadow-2xl">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
          <div className="relative">
            <Users className="mx-auto h-9 w-9 text-gold" />
            <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl font-bold text-primary-foreground sm:text-5xl leading-tight">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80 leading-relaxed text-base">
              {t("cta.subtitle")}
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-gold px-8 text-gold-foreground font-semibold hover:bg-gold/90 shadow-xl shadow-amber-600/30 active:scale-95 transition-all">
              <Link to="/register">{t("cta.button")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
