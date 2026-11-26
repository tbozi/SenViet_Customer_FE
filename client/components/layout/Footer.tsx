import { Link } from "react-router-dom";
import { Flower2, Globe, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";

export default function Footer() {
  const { t, language } = useLanguage();
  const { data: hotels = [], isError } = useGetPublicHotelsQuery();

  return (
    <footer className="border-t border-border/60 bg-[#0f294a] text-white dark:bg-slate-950">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <Flower2 className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold text-white">Sen Việt</span>
          </div>
          <p className="mt-4 text-sm text-white/75">{t("footer.tagline")}</p>
          <div className="mt-5 flex gap-3">
            {[Globe, Mail, Phone].map((Icon, i) => (
              <button
                key={i}
                aria-label="social"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-gold hover:text-gold-foreground"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
            {t("footer.explore")}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {hotels.slice(0, 4).map((hotel) => (
              <li key={hotel.id}>
                <Link to={`/hotels/${hotel.id}`} className="hover:text-white">
                  {hotel.name}
                </Link>
              </li>
            ))}
            {isError && (
              <li className="text-xs text-white/60">
                {language === "en"
                  ? "Unable to load hotels."
                  : "Không thể tải khách sạn."}
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
            {t("footer.company")}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <Link to="/about" className="hover:text-white">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link to="/hotels" className="hover:text-white">
                {t("nav.hotels")}
              </Link>
            </li>
            <li>
              <Link to="/guide" className="hover:text-white">
                {language === "en" ? "User Guide" : "Hướng dẫn sử dụng"}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
            {t("footer.contact")}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>1900 6868</li>
            <li>contact@senviet.vn</li>
            <li>
              <Link to="/contact" className="hover:text-white">
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/65">
        © {new Date().getFullYear()} Sen Việt Hotels & Resorts. {t("footer.rights")}
      </div>
    </footer>
  );
}
