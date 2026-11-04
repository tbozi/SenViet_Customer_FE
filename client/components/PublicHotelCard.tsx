import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import type { PublicHotel } from "@/services/hotelApi";
import { formatVnd } from "@/data/hotels";
import { useLanguage } from "@/lib/i18n";

export default function PublicHotelCard({ hotel }: { hotel: PublicHotel }) {
  const { t } = useLanguage();

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      {hotel.imageUrls.length > 0 && (
        <Link to={`/hotels/${hotel.id}/details`} aria-label={`${t("hotels.viewDetail")}: ${hotel.name}`}>
          <img
            src={hotel.imageUrls[0]}
            alt={hotel.name}
            loading="lazy"
            className="h-52 w-full object-cover"
          />
        </Link>
      )}
      <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-primary">{hotel.name}</h3>
          <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-gold" />
            {[hotel.address, hotel.provinceName].filter(Boolean).join(", ")}
          </p>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <span className="text-xs text-muted-foreground">{t("hotels.from")}</span>
          <div className="font-semibold text-primary">
            {hotel.startingPrice == null ? "—" : formatVnd(hotel.startingPrice)}
            {hotel.startingPrice != null && (
              <span className="text-xs font-normal text-muted-foreground"> {t("hotels.night")}</span>
            )}
          </div>
        </div>
        <Link
          to={`/hotels/${hotel.id}/details`}
          className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-gold"
        >
          {t("hotels.viewDetail")}
        </Link>
      </div>
      </div>
    </article>
  );
}
