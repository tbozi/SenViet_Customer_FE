import { Link } from "react-router-dom";
import { Flower2, Globe, Mail, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { hotels } from "@/data/hotels";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border/60 bg-primary text-primary-foreground">
      <div className="container grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <Flower2 className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">Sen Việt</span>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/70">{t("footer.tagline")}</p>
          <div className="mt-5 flex gap-3">
            {[Globe, Mail, Phone].map((Icon, i) => (
              <button
                key={i}
                aria-label="social"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/10 text-primary-foreground/80 transition hover:bg-gold hover:text-gold-foreground"
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
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
            {hotels.slice(0, 4).map((h) => (
              <li key={h.slug}>
                <Link to={`/hotels/${h.slug}`} className="hover:text-primary-foreground">
                  {h.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
            {t("footer.company")}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
            <li>
              <Link to="/about" className="hover:text-primary-foreground">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link to="/hotels" className="hover:text-primary-foreground">
                {t("nav.hotels")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wide text-gold">
            {t("footer.contact")}
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/70">
            <li>1800 6868</li>
            <li>hello@senviet.vn</li>
            <li>
              <Link to="/contact" className="hover:text-primary-foreground">
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} Sen Việt Hotels & Resorts. {t("footer.rights")}
      </div>
    </footer>
  );
}
