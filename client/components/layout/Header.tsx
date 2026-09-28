import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Bell, Flower2, Globe, Menu, Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getBookings } from "@/lib/bookings";

function FlagIcon({ code, className = "h-4 w-4" }: { code: string; className?: string }) {
  switch (code) {
    case "vi":
      return (
        <svg viewBox="0 0 24 24" className={`rounded-full shrink-0 ${className}`}>
          <rect width="24" height="24" fill="#DA251D" />
          <polygon
            points="12,4 14.47,11.6 22.46,11.6 15.99,16.3 18.46,23.9 12,19.2 5.54,23.9 8.01,16.3 1.54,11.6 9.53,11.6"
            fill="#FFFF00"
          />
        </svg>
      );
    case "en":
      return (
        <svg viewBox="0 0 24 24" className={`rounded-full shrink-0 ${className}`}>
          <clipPath id="uk-flag-clip">
            <circle cx="12" cy="12" r="12" />
          </clipPath>
          <g clipPath="url(#uk-flag-clip)">
            <rect width="24" height="24" fill="#012169" />
            <path d="M0,0 L24,24 M24,0 L0,24" stroke="#FFF" strokeWidth="4" />
            <path d="M0,0 L24,24 M24,0 L0,24" stroke="#C8102E" strokeWidth="2.5" />
            <path d="M12,0 V24 M0,12 H24" stroke="#FFF" strokeWidth="6" />
            <path d="M12,0 V24 M0,12 H24" stroke="#C8102E" strokeWidth="3.5" />
          </g>
        </svg>
      );
    case "zh":
      return (
        <svg viewBox="0 0 24 24" className={`rounded-full shrink-0 ${className}`}>
          <rect width="24" height="24" fill="#DE2910" />
          <polygon points="6,4 7,7 10,7 7.5,9 8.5,12 6,10 3.5,12 4.5,9 2,7 5,7" fill="#FFDE00" />
          <circle cx="12" cy="5" r="1" fill="#FFDE00" />
          <circle cx="14" cy="7" r="1" fill="#FFDE00" />
          <circle cx="14" cy="10" r="1" fill="#FFDE00" />
          <circle cx="12" cy="12" r="1" fill="#FFDE00" />
        </svg>
      );
    case "ko":
      return (
        <svg viewBox="0 0 24 24" className={`rounded-full shrink-0 border border-gray-200/60 ${className}`}>
          <rect width="24" height="24" fill="#FFFFFF" />
          <circle cx="12" cy="12" r="6" fill="#CD2E3A" />
          <path d="M6,12 A6,6 0 0,0 18,12 A3,3 0 0,0 12,12 A3,3 0 0,1 6,12" fill="#0047A0" />
        </svg>
      );
    case "ja":
      return (
        <svg viewBox="0 0 24 24" className={`rounded-full shrink-0 border border-gray-200/60 ${className}`}>
          <rect width="24" height="24" fill="#FFFFFF" />
          <circle cx="12" cy="12" r="6" fill="#BC002D" />
        </svg>
      );
    default:
      return <Globe className={className} />;
  }
}

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const notificationCount = user ? getBookings().filter((booking) => booking.userEmail === user.email && booking.status !== "cancelled").length : 0;
  const userShortName = user?.name ? user.name.trim().split(/\s+/).pop() || user.name : "";

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/hotels", label: t("nav.hotels") },
    { to: "/offers", label: t("nav.offers") },
    { to: "/services", label: t("nav.services") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Flower2 className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-primary">
            Sen Việt
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3 xl:px-4 py-2 text-sm font-medium transition-colors hover:text-primary whitespace-nowrap shrink-0",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user && (
            <Button variant="ghost" size="icon" asChild className="relative" aria-label="Notifications">
              <Link to="/bookings">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground ring-2 ring-background">
                    {notificationCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* Toggle VI / EN trực tiếp khi bấm */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
            className="gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full hover:bg-secondary inline-flex items-center shrink-0 border border-border/40 transition-colors"
            aria-label="Chuyển đổi ngôn ngữ Tiếng Việt / English"
            title={language === "vi" ? "Bấm để đổi sang English" : "Click to switch to Tiếng Việt"}
          >
            <FlagIcon code={currentLang.code} className="h-4 w-4 shrink-0 shadow-sm" />
            <span className="uppercase tracking-wider font-bold text-primary">
              {currentLang.code}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0"
            onClick={toggleTheme}
            aria-label="Chuyển chế độ sáng/tối"
            title={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-gold transition-all" />
            ) : (
              <Moon className="h-4 w-4 text-primary transition-all" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 rounded-full px-3 py-1.5 shrink-0 border-border/60">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-xs max-w-[85px] sm:max-w-[110px] truncate">{userShortName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-2">
                  <p className="font-semibold text-primary">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.phone || "Chưa cập nhật số điện thoại"}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">{t("nav.account")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/loyalty">{t("nav.loyalty")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/crm">CRM cá nhân</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">{t("nav.profile")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>{t("nav.logout")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">{t("nav.login")}</Link>
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-gold text-gold-foreground hover:bg-gold/90"
                asChild
              >
                <Link to="/register">{t("nav.register")}</Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-1">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "rounded-md px-3 py-2 text-sm font-medium",
                        isActive ? "bg-secondary text-primary" : "text-muted-foreground",
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="my-2 h-px bg-border" />
                {user ? (
                  <>
                    <Link
                      to="/account"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
                    >
                      {t("nav.profile")}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                      className="rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground"
                    >
                      {t("nav.logout")}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-medium text-primary"
                    >
                      {t("nav.register")}
                    </Link>
                  </>
                )}
                {/* Mobile Language list */}
                <div className="mt-2 space-y-1">
                  <div className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("common.language")}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                          language === lang.code
                            ? "border-primary bg-secondary text-primary font-semibold"
                            : "border-border text-muted-foreground hover:bg-secondary/40",
                        )}
                      >
                        <FlagIcon code={lang.code} className="h-4 w-4 shadow-sm" />
                        <span>{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 text-gold" /> : <Moon className="h-4 w-4 text-primary" />}
                  {theme === "dark" ? "Giao diện: Tối (Bấm để đổi Sáng)" : "Giao diện: Sáng (Bấm để đổi Tối)"}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
