import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Building2, MapPin, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuickSearch from "@/components/QuickSearch";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import { formatVnd } from "@/data/hotels";
import { useLanguage } from "@/lib/i18n";

export default function SearchResults() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [params] = useSearchParams();
  const [sort, setSort] = useState("recommended");
  const [maxPrice, setMaxPrice] = useState("all");
  const { data: hotels = [], isLoading, isError } = useGetPublicHotelsQuery();

  const location = params.get("location") || "";
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const rooms = Number(params.get("rooms") || 1);
  const adults = Number(params.get("adults") || 2);
  const children = Number(params.get("children") || 0);
  const bookingQuery = params.toString();

  const results = useMemo(() => {
    const normalizedLocation = location.trim().toLocaleLowerCase();
    const matchingHotels = hotels.filter((hotel) => {
      if (!normalizedLocation) return true;
      if (String(hotel.id) === normalizedLocation) return true;
      return [hotel.name, hotel.address, hotel.provinceName]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(normalizedLocation));
    });
    const priceFiltered =
      maxPrice === "all"
        ? matchingHotels
        : matchingHotels.filter(
            (hotel) =>
              hotel.startingPrice != null &&
              hotel.startingPrice <= Number(maxPrice),
          );
    return [...priceFiltered].sort((a, b) =>
      sort === "price"
        ? (a.startingPrice ?? Number.POSITIVE_INFINITY) -
          (b.startingPrice ?? Number.POSITIVE_INFINITY)
        : 0,
    );
  }, [hotels, location, maxPrice, sort]);

  const selectedLocation =
    hotels.find((hotel) => String(hotel.id) === location)?.name || location;

  return (
    <main className="container py-10">
      <QuickSearch />

      <div className="mt-10 rounded-2xl border border-border bg-secondary/50 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-primary">
          <span className="font-semibold">
            {isEn ? "Your search:" : "Tìm kiếm của bạn:"}
          </span>
          {selectedLocation && (
            <span className="rounded-full bg-white px-3 py-1">
              {selectedLocation}
            </span>
          )}
          {checkIn && checkOut && (
            <span className="rounded-full bg-white px-3 py-1">
              {checkIn} → {checkOut}
            </span>
          )}
          <span className="rounded-full bg-white px-3 py-1">
            {rooms} {isEn ? "rooms" : "phòng"} · {adults}{" "}
            {isEn ? "adults" : "người lớn"} · {children}{" "}
            {isEn ? "children" : "trẻ em"}
          </span>
          {params.get("promo") && (
            <span className="rounded-full bg-gold/30 px-3 py-1">
              {isEn ? "Code" : "Mã"} {params.get("promo")}
            </span>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
            Sen Việt search
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary">
            {isEn ? "Hotel search results" : "Kết quả tìm kiếm khách sạn"}
          </h1>
          {!isLoading && !isError && (
            <p className="mt-2 text-sm text-muted-foreground">
              {results.length}{" "}
              {isEn ? "matching hotels" : "khách sạn phù hợp"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-full border border-input bg-white px-3 py-2 text-xs"
            aria-label={isEn ? "Sort hotels" : "Sắp xếp khách sạn"}
          >
            <option value="recommended">{isEn ? "Recommended" : "Đề xuất"}</option>
            <option value="price">{isEn ? "Lowest price" : "Giá thấp nhất"}</option>
          </select>
          <select
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="rounded-full border border-input bg-white px-3 py-2 text-xs"
            aria-label={isEn ? "Maximum price" : "Giá tối đa"}
          >
            <option value="all">{isEn ? "Any price" : "Mọi mức giá"}</option>
            <option value="1000000">{isEn ? "Under 1M" : "Dưới 1 triệu"}</option>
            <option value="1500000">{isEn ? "Under 1.5M" : "Dưới 1,5 triệu"}</option>
            <option value="2000000">{isEn ? "Under 2M" : "Dưới 2 triệu"}</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <p className="mt-8 text-muted-foreground">
          {isEn ? "Loading hotels..." : "Đang tải khách sạn..."}
        </p>
      )}
      {isError && (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {isEn
            ? "Unable to load hotels. Please try again later."
            : "Không thể tải khách sạn. Vui lòng thử lại sau."}
        </p>
      )}
      {!isLoading && !isError && results.length === 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
          <h2 className="font-display text-2xl font-bold text-primary">
            {isEn ? "No matching hotels" : "Không tìm thấy khách sạn phù hợp"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {isEn
              ? "Try another destination or price range."
              : "Hãy thử đổi địa điểm hoặc khoảng giá."}
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/hotels">
              {isEn ? "Browse all hotels" : "Xem tất cả khách sạn"}
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && results.length > 0 && (
        <div className="mt-8 space-y-5">
          {results.map((hotel) => {
            const hotelHref = `/hotels/${hotel.id}${bookingQuery ? `?${bookingQuery}` : ""}`;
            return (
              <article
                key={hotel.id}
                className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md md:grid-cols-[100px_1fr_auto]"
              >
                <div className="flex items-center justify-center bg-secondary/60 p-6 text-primary">
                  <Building2 className="h-9 w-9" />
                </div>
                <div className="p-5">
                  <h2 className="font-display text-2xl font-bold text-primary">
                    <Link to={hotelHref} className="transition hover:text-gold">
                      {hotel.name}
                    </Link>
                  </h2>
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 text-gold" />
                    {[hotel.address, hotel.provinceName]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <div className="flex flex-col justify-between border-t border-border bg-secondary/10 p-5 md:border-l md:border-t-0">
                  <div className="md:text-right">
                    <p className="text-xs text-muted-foreground">
                      {isEn ? "From / night" : "Giá từ / đêm"}
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {hotel.startingPrice == null
                        ? "—"
                        : formatVnd(hotel.startingPrice)}
                    </p>
                  </div>
                  <Button
                    asChild
                    className="mt-5 whitespace-nowrap rounded-xl bg-gold text-xs font-semibold text-gold-foreground hover:bg-gold/90"
                  >
                    <Link to={hotelHref}>
                      {isEn ? "View rooms" : "Xem phòng"}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
