import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import { hotelSlugToIdMap } from "@/services/roomApi";
import { formatVnd } from "@/data/hotels";
import { useLanguage } from "@/lib/i18n";

export default function HotelDetails() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isEn = language === "en";
  const { data: hotels = [], isLoading, isError } = useGetPublicHotelsQuery();
  const hotelId =
    slug && /^\d+$/.test(slug)
      ? Number(slug)
      : hotelSlugToIdMap[slug || ""] || 0;
  const hotel = hotels.find((item) => item.id === hotelId);
  const images = hotel?.imageUrls || [];
  const [selectedImage, setSelectedImage] = useState(0);
  useEffect(() => setSelectedImage(0), [hotelId]);
  const bookingQuery = searchParams.toString();
  const roomsHref = `/hotels/${hotelId}${bookingQuery ? `?${bookingQuery}` : ""}`;

  if (isLoading) {
    return (
      <main className="container py-16 text-muted-foreground">
        {isEn ? "Loading hotel details..." : "Đang tải thông tin khách sạn..."}
      </main>
    );
  }

  if (isError) {
    return (
      <main className="container py-16">
        <p role="alert" className="text-red-700">
          {isEn ? "Unable to load hotel details." : "Không thể tải thông tin khách sạn."}
        </p>
        <Link to="/hotels" className="mt-4 inline-flex items-center gap-2 text-primary underline">
          <ArrowLeft className="h-4 w-4" />
          {isEn ? "Browse hotels" : "Xem danh sách khách sạn"}
        </Link>
      </main>
    );
  }

  if (!hotel) {
    return (
      <main className="container py-16 text-center">
        <h1 className="text-3xl font-bold text-primary">
          {isEn ? "Hotel not found" : "Không tìm thấy khách sạn"}
        </h1>
        <Link to="/hotels" className="mt-5 inline-flex items-center gap-2 text-primary underline">
          <ArrowLeft className="h-4 w-4" />
          {isEn ? "Browse hotels" : "Xem danh sách khách sạn"}
        </Link>
      </main>
    );
  }

  return (
    <main className="container py-8 pb-16">
      <Link to="/hotels" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
        <ArrowLeft className="h-4 w-4" />
        {isEn ? "All hotels" : "Tất cả khách sạn"}
      </Link>

      <header className="mt-6 flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-gold">
            Sen Việt Hotels
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
            {hotel.name}
          </h1>
          <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            {[hotel.address, hotel.provinceName].filter(Boolean).join(", ")}
          </p>
          {hotel.phone && (
            <a href={`tel:${hotel.phone}`} className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Phone className="h-4 w-4" />
              {hotel.phone}
            </a>
          )}
        </div>
        <div className="flex items-center justify-between gap-5 sm:justify-end">
          <div>
            <p className="text-xs text-muted-foreground">
              {isEn ? "Starting price / night" : "Giá phòng từ / đêm"}
            </p>
            <p className="mt-1 text-xl font-bold text-primary">
              {hotel.startingPrice == null ? "—" : formatVnd(hotel.startingPrice)}
            </p>
          </div>
          <Button asChild className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90">
            <Link to={roomsHref}>
              {isEn ? "View rooms" : "Xem phòng"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mt-8" aria-label={isEn ? "Branch photos" : "Hình ảnh chi nhánh"}>
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gold" />
          <h2 className="font-display text-xl font-bold text-primary">
            {isEn ? "Branch photos" : "Hình ảnh chi nhánh"}
          </h2>
        </div>

        {images.length > 0 ? (
          <>
            <div className="overflow-hidden rounded-2xl bg-secondary">
              <img
                src={images[selectedImage] || images[0]}
                alt={`${hotel.name} ${selectedImage + 1}`}
                className="h-[280px] w-full object-cover sm:h-[480px]"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={isEn ? `Show photo ${index + 1}` : `Xem ảnh ${index + 1}`}
                    aria-pressed={selectedImage === index}
                    className={`overflow-hidden rounded-xl border-2 ${selectedImage === index ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={image} alt="" className="h-20 w-full object-cover sm:h-28" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 p-8 text-center text-sm text-muted-foreground">
            {isEn
              ? "This branch has not added photos yet."
              : "Chi nhánh chưa cập nhật hình ảnh."}
          </div>
        )}
      </section>
    </main>
  );
}
