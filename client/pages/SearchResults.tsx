import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Eye, MapPin, SlidersHorizontal, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QuickSearch from "@/components/QuickSearch";
import { formatHotelLocation, formatVnd, hotels, Hotel } from "@/data/hotels";
import { calculateNights } from "@/lib/bookings";
import { useLanguage } from "@/lib/i18n";

export default function SearchResults() {
  const { t, language } = useLanguage();
  const [params] = useSearchParams();
  const [sort, setSort] = useState("recommended");
  const [maxPrice, setMaxPrice] = useState("all");
  const [selectedImageHotel, setSelectedImageHotel] = useState<Hotel | null>(null);

  const location = params.get("location") || "";
  const checkIn = params.get("checkIn") || "";
  const checkOut = params.get("checkOut") || "";
  const nights = calculateNights(checkIn, checkOut);
  const rooms = Number(params.get("rooms") || 1);
  const adults = Number(params.get("adults") || 2);
  const children = Number(params.get("children") || 0);

  const matches = hotels.filter(
    (hotel) =>
      !location ||
      hotel.slug === location ||
      `${hotel.city} ${hotel.province} ${hotel.name}`
        .toLowerCase()
        .includes(location.toLowerCase())
  );

  const filtered =
    maxPrice === "all"
      ? matches
      : matches.filter((hotel) => hotel.price <= Number(maxPrice));

  const results = [...filtered].sort((a, b) =>
    sort === "price"
      ? a.price - b.price
      : sort === "rating"
      ? b.rating - a.rating
      : 0
  );

  const bookingQuery = params.toString();
  const criteriaLocation =
    hotels.find((hotel) => hotel.slug === location)?.name ||
    location ||
    "Tất cả địa điểm";

  return (
    <main className="container py-10">
      <QuickSearch />

      <div className="mt-10 rounded-2xl border border-border bg-secondary/50 p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-primary">
          <span className="font-semibold">Tìm kiếm của bạn:</span>
          <span className="rounded-full bg-white px-3 py-1">
            {criteriaLocation}
          </span>
          {checkIn && checkOut && (
            <span className="rounded-full bg-white px-3 py-1">
              {checkIn} → {checkOut} · {nights} đêm
            </span>
          )}
          <span className="rounded-full bg-white px-3 py-1">
            {rooms} phòng · {adults} người lớn · {children} trẻ em
          </span>
          {params.get("promo") && (
            <span className="rounded-full bg-gold/30 px-3 py-1">
              Mã {params.get("promo")}
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
            {language === "vi"
              ? "Kết quả tìm kiếm khách sạn"
              : "Hotel search results"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {results.length}{" "}
            {language === "vi" ? "khách sạn phù hợp" : "matching hotels"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full border border-input bg-white px-3 py-2 text-xs"
          >
            <option value="recommended">Đề xuất</option>
            <option value="price">Giá thấp nhất</option>
            <option value="rating">Rating cao nhất</option>
          </select>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-full border border-input bg-white px-3 py-2 text-xs"
          >
            <option value="all">Mọi mức giá</option>
            <option value="1000000">Dưới 1 triệu</option>
            <option value="1500000">Dưới 1,5 triệu</option>
            <option value="2000000">Dưới 2 triệu</option>
          </select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
          <h2 className="font-display text-2xl font-bold text-primary">
            Không tìm thấy khách sạn phù hợp
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Hãy thử đổi ngày, tăng khoảng giá hoặc chọn một tỉnh thành khác.
          </p>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/hotels">Xem tất cả khách sạn</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {results.map((hotel) => (
            <article
              key={hotel.slug}
              className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md md:grid-cols-[280px_1fr_auto]"
            >
              <div className="relative h-56 md:h-full overflow-hidden group">
                <Link
                  to={`/hotels/${hotel.slug}/details`}
                  className="block h-full w-full"
                  title="Nhấn để xem chi tiết khách sạn"
                >
                  <img
                    loading="lazy"
                    decoding="async"
                    src={hotel.image}
                    alt={hotel.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedImageHotel(hotel)}
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-md hover:bg-white transition cursor-pointer backdrop-blur"
                >
                  <Eye className="h-3.5 w-3.5 text-gold" /> Xem hình ảnh
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-1 text-sm text-gold">
                  <Star className="h-4 w-4 fill-gold" /> {hotel.rating} / 5
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold text-primary">
                  <Link
                    to={`/hotels/${hotel.slug}/details`}
                    className="hover:text-gold transition inline-flex items-center gap-1.5"
                    title="Nhấn để xem chi tiết chi nhánh"
                  >
                    {hotel.name}
                  </Link>
                </h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold" />
                  {formatHotelLocation(hotel)}
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {language === "vi" ? hotel.description : hotel.descriptionEn}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {hotel.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-primary"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between border-t border-border p-5 md:border-l md:border-t-0 bg-secondary/10">
                <div className="md:text-right">
                  <p className="text-xs text-muted-foreground">Từ / đêm</p>
                  <p className="text-xl font-bold text-primary">
                    {formatVnd(hotel.price)}
                  </p>
                  {nights > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tạm tính {formatVnd(hotel.price * nights * rooms)} tiền phòng
                    </p>
                  )}
                </div>
                <div className="mt-5 flex flex-col gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl border-primary/20 text-xs font-semibold hover:bg-primary/5"
                  >
                    <Link to={`/hotels/${hotel.slug}/details`}>
                      Xem chi tiết
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="whitespace-nowrap rounded-xl bg-gold text-gold-foreground hover:bg-gold/90 font-semibold text-xs"
                  >
                    <Link to={`/hotels/${hotel.slug}?${bookingQuery}`}>
                      Đặt ngay <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal xem hình ảnh chi nhánh */}
      <Dialog
        open={!!selectedImageHotel}
        onOpenChange={(open) => !open && setSelectedImageHotel(null)}
      >
        <DialogContent className="max-w-3xl overflow-hidden rounded-3xl p-0">
          {selectedImageHotel && (
            <div>
              <div className="relative max-h-[60vh] w-full overflow-hidden bg-black">
                <img
                  src={selectedImageHotel.image}
                  alt={selectedImageHotel.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  Sen Việt Luxury Hotels
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-1.5 text-sm text-gold">
                      <Star className="h-4 w-4 fill-gold" />{" "}
                      {selectedImageHotel.rating} / 5
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-bold text-primary">
                      {selectedImageHotel.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-gold" />
                      {formatHotelLocation(selectedImageHotel)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Giá từ</p>
                    <p className="text-xl font-bold text-primary">
                      {formatVnd(selectedImageHotel.price)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        / đêm
                      </span>
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {language === "vi"
                    ? selectedImageHotel.description
                    : selectedImageHotel.descriptionEn}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedImageHotel.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-primary font-medium"
                    >
                      {a}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-xl px-5"
                    onClick={() => setSelectedImageHotel(null)}
                  >
                    <Link to={`/hotels/${selectedImageHotel.slug}/details`}>
                      Xem trang chi tiết chi nhánh
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-xl bg-gold px-6 text-gold-foreground hover:bg-gold/90 font-semibold"
                    onClick={() => setSelectedImageHotel(null)}
                  >
                    <Link to={`/hotels/${selectedImageHotel.slug}?${bookingQuery}`}>
                      Đặt phòng ngay <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
