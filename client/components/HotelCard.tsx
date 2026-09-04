import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { Hotel, formatVnd } from "@/data/hotels";
import { useLanguage } from "@/lib/i18n";

export default function HotelCard({ hotel }: { hotel: Hotel }) {
  const { t, language } = useLanguage();
  return (
    <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56 overflow-hidden">
        <img src={hotel.image} alt={hotel.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">Sen Việt</div>
        <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"><Star className="h-3.5 w-3.5 fill-gold text-gold" /> {hotel.rating}</div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><h3 className="font-display text-xl font-bold text-primary">{hotel.name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-gold" />{hotel.city}, {hotel.province}</p></div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition group-hover:text-gold" />
        </div>
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{language === "vi" ? hotel.description : hotel.descriptionEn}</p>
        <div className="mt-5 flex items-end justify-between"><div><span className="text-xs text-muted-foreground">{t("hotels.from")}</span><div className="font-semibold text-primary">{formatVnd(hotel.price)}<span className="text-xs font-normal text-muted-foreground"> {t("hotels.night")}</span></div></div><Link to={`/hotels/${hotel.slug}/details`} className="rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-primary transition hover:bg-gold">{t("hotels.viewDetail")}</Link></div>
      </div>
    </article>
  );
}
