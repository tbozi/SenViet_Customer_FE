import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Bell, Flower2, Menu, Moon, Sun, User } from "lucide-react";
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

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const notificationCount = user
    ? getBookings().filter(
        (booking) =>
          booking.userEmail === user.email && booking.status !== "cancelled",
      ).length
    : 0;

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/hotels", label: t("nav.hotels") },
    { to: "/offers", label: t("nav.offers") },
    { to: "/services", label: t("nav.services") },
    { to: "/about", label: t("nav.about") },
    { to: "/contact", label: t("nav.contact") },
  ];

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 transition-colors">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Flower2 className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-primary">
            Sen Việt
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative rounded-full"
              aria-label="Notifications"
            >
              <Link to="/bookings">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                    {notificationCount}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* Dark / Light Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDark ? t("common.lightMode") : t("common.darkMode")}
            className="rounded-full text-foreground hover:bg-secondary transition-transform hover:scale-105"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400 transition-all rotate-0 scale-100" />
            ) : (
              <Moon className="h-4 w-4 text-primary transition-all rotate-0 scale-100" />
            )}
          </Button>

          {/* Multilingual Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 px-2.5 text-xs font-semibold rounded-full hover:bg-secondary"
                aria-label="Choose language"
              >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="hidden sm:inline uppercase tracking-wide">{currentLang.code}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
              <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("common.language")}
              </div>
              <DropdownMenuSeparator />
              {SUPPORTED_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors",
                    language === lang.code
                      ? "bg-secondary font-semibold text-primary"
                      : "hover:bg-secondary/60 text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </span>
                  {language === lang.code && (
                    <span className="text-xs font-bold text-gold">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Account / Auth buttons */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-full border-border">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl">
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
                <DropdownMenuItem onClick={logout} className="text-destructive font-medium cursor-pointer">
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="rounded-full">
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

          {/* Mobile Sheet Trigger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full">
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
                        isActive ? "bg-secondary text-primary font-semibold" : "text-muted-foreground",
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
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary"
                    >
                      {t("nav.profile")}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setOpen(false);
                      }}
                      className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive hover:bg-destructive/10"
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
                      className="rounded-md px-3 py-2 text-sm font-semibold text-primary"
                    >
                      {t("nav.register")}
                    </Link>
                  </>
                )}

                <div className="my-2 h-px bg-border" />

                {/* Mobile Dark mode button */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  <span>{t("common.theme")}</span>
                  <span className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                    {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                    {isDark ? t("common.darkMode") : t("common.lightMode")}
                  </span>
                </button>

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
                          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition",
                          language === lang.code
                            ? "border-primary bg-secondary text-primary font-semibold"
                            : "border-border text-muted-foreground hover:bg-secondary/40",
                        )}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
