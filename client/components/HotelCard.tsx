import { Link } from "react-router-dom";
import { MapPin, Star, ArrowUpRight } from "lucide-react";
import { Hotel, formatHotelLocation, formatVnd } from "@/data/hotels";
import { useLanguage } from "@/lib/i18n";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  const { t, language } = useLanguage();

  return (
    <SpotlightCard
      enableTilt={true}
      spotlightColor="rgba(217, 119, 6, 0.16)"
      className="h-full flex flex-col justify-between shadow-xs hover:shadow-2xl transition-shadow duration-500"
    >
      <div>
        <div className="relative h-56 overflow-hidden">
          <img
            loading="lazy"
            decoding="async"
            src={hotel.image}
            alt={hotel.name}
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1200";
            }}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary backdrop-blur shadow-xs">
            Sen Việt
          </div>
          <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-xs shadow-md">
            <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {hotel.rating}
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-xl font-bold text-primary transition-colors group-hover:text-primary">
                {hotel.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
                <span className="truncate">{formatHotelLocation(hotel)}</span>
              </p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary/80 text-gold opacity-0 -translate-x-1 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

          <p className="mt-3.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {language === "vi" ? hotel.description : hotel.descriptionEn}
          </p>
        </div>
      </div>

      <div className="px-5 pb-5 pt-0">
        <div className="flex items-end justify-between border-t border-border/50 pt-3.5">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-medium">
              {t("hotels.from")}
            </span>
            <div className="font-semibold text-primary tabular-nums text-lg">
              {formatVnd(hotel.price)}
              <span className="text-xs font-normal text-muted-foreground"> /{t("hotels.night")}</span>
            </div>
          </div>
          <Link
            to={`/hotels/${hotel.slug}/details`}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:bg-gold hover:text-white active:scale-95 shadow-xs"
          >
            {t("hotels.viewDetail")}
          </Link>
        </div>
      </div>
    </SpotlightCard>
  );
}
