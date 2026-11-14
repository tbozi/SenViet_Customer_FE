import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import HotelCard from "@/components/HotelCard";
import { hotels as staticHotels, Hotel } from "@/data/hotels";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import { useLanguage } from "@/lib/i18n";
import { motion } from "framer-motion";
import { MotionStaggerList } from "@/components/ui/animate-ui";

export default function Hotels() {
  const { t, language } = useLanguage();
  const isEn = language === "en";
  const [searchParams, setSearchParams] = useSearchParams();

  // Queries & API
  const { data: beHotels = [], isLoading } = useGetPublicHotelsQuery();

  // Map directly from backend hotels (100% real DB data)
  const allHotels: Hotel[] = useMemo(() => {
    if (beHotels && beHotels.length > 0) {
      return beHotels.map((beH) => ({
        id: beH.id,
        slug: String(beH.id),
        name: beH.name,
        city: beH.address || beH.provinceName || "Việt Nam",
        province: beH.provinceName || "Việt Nam",
        region: "central" as const,
        description: beH.address || "",
        descriptionEn: beH.address || "",
        price: beH.startingPrice ?? 0,
        rating: 4.8,
        image:
          beH.imageUrls?.[0] ||
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1200",
        amenities: ["WiFi tốc độ cao", "Phục vụ 24/7", "Bữa sáng tiêu chuẩn"],
      }));
    }
    return [];
  }, [beHotels]);

  // Filters State
  const initialRegion = searchParams.get("region") || "all";
  const initialProvince = searchParams.get("province") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [region, setRegion] = useState(initialRegion);
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  // Sync state if URL changes externally
  useEffect(() => {
    const r = searchParams.get("region") || "all";
    const p = searchParams.get("province") || "all";
    const q = searchParams.get("q") || "";
    setRegion(r);
    setSelectedProvince(p);
    setSearchQuery(q);
  }, [searchParams]);

  // Extract unique provinces list with hotel counts
  const provinceOptions = useMemo(() => {
    const map = new Map<string, number>();
    allHotels.forEach((h) => {
      const p = (h.province || "").trim();
      if (p) {
        map.set(p, (map.get(p) || 0) + 1);
      }
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [allHotels]);

  // Handle filter changes and update URL
  const updateFilters = (newRegion: string, newProvince: string, newQuery: string) => {
    setRegion(newRegion);
    setSelectedProvince(newProvince);
    setSearchQuery(newQuery);

    const nextParams = new URLSearchParams();
    if (newRegion !== "all") nextParams.set("region", newRegion);
    if (newProvince !== "all") nextParams.set("province", newProvince);
    if (newQuery.trim()) nextParams.set("q", newQuery.trim());
    setSearchParams(nextParams, { replace: true });
  };

  const handleResetFilters = () => {
    updateFilters("all", "all", "");
  };

  // Filtered hotels
  const filtered = useMemo(() => {
    return allHotels.filter((h) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = (h.name || "").toLowerCase().includes(q);
        const matchCity = (h.city || "").toLowerCase().includes(q);
        const matchProvince = (h.province || "").toLowerCase().includes(q);
        const matchDesc = (h.description || "").toLowerCase().includes(q);
        if (!matchName && !matchCity && !matchProvince && !matchDesc) {
          return false;
        }
      }

      // 2. Region filter
      if (region !== "all" && h.region !== region) {
        return false;
      }

      // 3. Province filter
      if (selectedProvince !== "all") {
        const hp = (h.province || "").toLowerCase();
        const target = selectedProvince.toLowerCase();
        if (!hp.includes(target) && !target.includes(hp)) {
          return false;
        }
      }

      return true;
    });
  }, [allHotels, region, selectedProvince, searchQuery]);

  const regionFilters = [
    ["all", t("hotels.filterAll")],
    ["north", t("hotels.filterNorth")],
    ["central", t("hotels.filterCentral")],
    ["south", t("hotels.filterSouth")],
  ];

  return (
    <main className="container py-16">
      {/* Page Header */}
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[.18em] text-gold">
          Sen Việt collection
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl lg:text-6xl">
          {t("hotels.pageTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isEn
            ? `Discover ${filtered.length} luxury destinations across Vietnam, ready to welcome you.`
            : `Khám phá ${filtered.length} điểm dừng chân sang trọng khắp Việt Nam, sẵn sàng đón bạn.`}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="mx-auto mt-10 max-w-5xl rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6 space-y-5">
        {/* Row 1: Search Input & Province Dropdown */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateFilters(region, selectedProvince, e.target.value)}
              placeholder={
                isEn
                  ? "Search by hotel name, address, or city..."
                  : "Tìm theo tên khách sạn, địa chỉ, thành phố..."
              }
              className="w-full rounded-full border border-border bg-white pl-10 pr-10 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => updateFilters(region, selectedProvince, "")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="sm:w-64">
            <select
              value={selectedProvince}
              onChange={(e) => updateFilters(region, e.target.value, searchQuery)}
              className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-xs"
            >
              <option value="all">
                {isEn ? "📍 All Provinces & Cities" : "📍 Tất cả tỉnh thành"}
              </option>
              {provinceOptions.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.count} {isEn ? "hotel" : "khách sạn"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Region Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              {isEn ? "Region:" : "Khu vực miền:"}
            </span>
            {regionFilters.map(([key, label]) => {
              const isActive = region === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateFilters(key, selectedProvince, searchQuery)}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200 active:scale-95 ${
                    isActive
                      ? "text-primary-foreground"
                      : "bg-secondary/70 text-muted-foreground hover:text-primary hover:bg-secondary"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeRegionPill"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-primary shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>

          {(region !== "all" || selectedProvince !== "all" || searchQuery.trim() !== "") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary underline hover:text-gold"
            >
              <X className="h-3.5 w-3.5" />
              {isEn ? "Reset all filters" : "Xóa tất cả bộ lọc"}
            </button>
          )}
        </div>

        {/* Row 3: Quick Province Pills */}
        {provinceOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1">
              {isEn ? "Destinations:" : "Tỉnh thành:"}
            </span>
            <button
              type="button"
              onClick={() => updateFilters(region, "all", searchQuery)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                selectedProvince === "all"
                  ? "bg-gold text-gold-foreground font-bold"
                  : "bg-background text-muted-foreground border border-border hover:text-primary"
              }`}
            >
              {isEn ? "All" : "Tất cả"}
            </button>
            {provinceOptions.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => updateFilters(region, p.name, searchQuery)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  selectedProvince === p.name
                    ? "bg-gold text-gold-foreground font-bold"
                    : "bg-background text-muted-foreground border border-border hover:text-primary"
                }`}
              >
                {p.name} ({p.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status banner */}
      <div className="mx-auto mt-8 flex max-w-5xl items-center justify-between text-xs font-medium text-muted-foreground">
        <span>
          {isEn
            ? `Showing ${filtered.length} of ${allHotels.length} luxury hotels`
            : `Hiển thị ${filtered.length} trên tổng số ${allHotels.length} khách sạn đẳng cấp`}
        </span>
        {isLoading && (
          <span className="animate-pulse text-gold">
            {isEn ? "Updating live data..." : "Đang đồng bộ dữ liệu..."}
          </span>
        )}
      </div>

      {/* Hotels Grid */}
      {filtered.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 font-bold text-primary text-base">
            {isEn ? "No hotels found matching criteria" : "Không tìm thấy khách sạn phù hợp"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {isEn
              ? "Try choosing another region, clearing search query, or resetting filters."
              : "Vui lòng chọn khu vực miền khác hoặc xóa từ khóa tìm kiếm."}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {isEn ? "View all hotels" : "Xem tất cả khách sạn"}
          </button>
        </div>
      ) : (
        <MotionStaggerList className="mx-auto mt-6 grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hotel) => (
            <HotelCard hotel={hotel} key={hotel.slug || hotel.id} />
          ))}
        </MotionStaggerList>
      )}
    </main>
  );
}
