import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronRight, Clock3, Headphones, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import HotelCard from "@/components/HotelCard";
import QuickSearch from "@/components/QuickSearch";
import { hotels as staticHotels, Hotel } from "@/data/hotels";
import { useGetPublicHotelsQuery, useGetPublicProvincesQuery } from "@/services/hotelApi";
import { useLanguage } from "@/lib/i18n";
import { openChatWidget } from "@/components/ChatWidget";

export default function Index() {
  const { t, language } = useLanguage();
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
            price: beH.startingPrice || found.price,
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
          price: beH.startingPrice || 1200000,
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
        return {
          id: p.id,
          name: p.name,
          count: count > 0 ? count : 1,
          image:
            p.backgroundImageUrl ||
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

  const hotelCount = String(effectiveHotels.length).padStart(2, "0");
  const provinceCount = String(provinceDestinations.length).padStart(2, "0");

  const benefits = [
    { icon: Sparkles, title: t("ai.point1Title"), desc: t("ai.point1Desc") },
    { icon: Clock3, title: t("ai.point2Title"), desc: t("ai.point2Desc") },
    { icon: Headphones, title: t("ai.point3Title"), desc: t("ai.point3Desc") },
  ];

  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-[650px] overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--gold)/.25),transparent_28%),linear-gradient(90deg,hsl(var(--primary))_15%,transparent_75%)]" />
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop"
          alt="Sen Viet resort"
          className="absolute inset-0 -z-0 h-full w-full object-cover opacity-50"
        />
        <div className="container relative z-10 flex min-h-[650px] items-center py-20">
          <div className="max-w-2xl text-primary-foreground">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-primary-foreground/10 px-4 py-2 text-xs font-semibold uppercase tracking-[.15em] text-gold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {t("hero.badge")}
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.08] tracking-tight sm:text-7xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/80">
              {t("hero.subtitle")}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gold px-7 text-gold-foreground hover:bg-gold/90">
                <Link to="/hotels">
                  {t("hero.ctaPrimary")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("quick-search")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="rounded-full border-primary-foreground/50 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground/10 cursor-pointer"
              >
                {t("hero.ctaSecondary")}
              </Button>
            </div>
            <div className="mt-14 flex flex-wrap gap-8 border-t border-primary-foreground/20 pt-6">
              <div>
                <div className="font-display text-2xl font-bold text-gold">{hotelCount}</div>
                <div className="text-xs text-primary-foreground/60">{t("hero.statHotels")}</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-gold">{provinceCount}</div>
                <div className="text-xs text-primary-foreground/60">{t("hero.statProvinces")}</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-gold">24/7</div>
                <div className="text-xs text-primary-foreground/60">{t("hero.statSupport")}</div>
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-gold">98%</div>
                <div className="text-xs text-primary-foreground/60">{t("hero.statGuests")}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search Section */}
      <section id="quick-search" className="relative z-20 -mt-16 container">
        <QuickSearch />
      </section>

      {/* Section 01: Hotel Collection */}
      <section className="container py-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
              01 / Sen Việt collection
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
              {t("hotels.sectionTitle")}
            </h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              {t("hotels.sectionSubtitle")}
            </p>
          </div>
          <Link to="/hotels" className="group flex items-center gap-2 text-sm font-semibold text-primary">
            {t("hotels.viewAll")}
            <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {effectiveHotels.slice(0, 6).map((hotel) => (
            <HotelCard hotel={hotel} key={hotel.slug || hotel.id} />
          ))}
        </div>
      </section>

      {/* Section 02: Destinations by Province */}
      <section className="container pb-24">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
              02 / Vietnam destinations
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
              {t("hotels.regionsTitle")}
            </h2>
          </div>
          <Link to="/hotels" className="text-sm font-semibold text-primary">
            {t("hotels.viewAll")} <ArrowRight className="inline h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {provinceDestinations.map((province) => (
            <Link
              key={province.id}
              to={`/hotels?province=${encodeURIComponent(province.name)}`}
              className="group relative flex min-h-56 items-end overflow-hidden rounded-2xl bg-secondary p-5 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                src={province.image}
                alt={province.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent" />
              <div className="relative">
                <span className="text-lg font-bold">{province.name}</span>
                <p className="text-xs text-white/80 mt-1">
                  {province.count} {language === "en" ? (province.count === 1 ? "hotel" : "hotels") : "khách sạn"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 03: AI Concierge */}
      <section className="overflow-hidden bg-secondary/60">
        <div className="container grid items-center gap-12 py-24 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
              03 / Sen Việt AI
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
            <Button onClick={openChatWidget} className="mt-9 rounded-full bg-primary px-6">
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
                  {language === "en" ? "I found the perfect stay for you." : "Tôi đã tìm được nơi nghỉ hoàn hảo cho bạn."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 04: Call To Action */}
      <section className="container py-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center sm:px-16">
          <div className="relative">
            <Users className="mx-auto h-8 w-8 text-gold" />
            <h2 className="mx-auto mt-4 max-w-xl font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/70">
              {t("cta.subtitle")}
            </p>
            <Button asChild className="mt-7 rounded-full bg-gold px-7 text-gold-foreground hover:bg-gold/90">
              <Link to="/register">{t("cta.button")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
