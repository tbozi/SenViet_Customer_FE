import { createRoot, Root } from "react-dom/client";
import "@/global.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider, useLanguage } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import SiteLayout from "@/components/layout/SiteLayout";
import Index from "@/pages/Index";
import Hotels from "@/pages/Hotels";
import SearchResults from "@/pages/SearchResults";
import HotelRooms from "@/pages/HotelRooms";
import HotelDetails from "@/pages/HotelDetails";
import Checkout from "@/pages/Checkout";
import BookingSuccess from "@/pages/BookingSuccess";
import BookingHistory from "@/pages/BookingHistory";
import ProfilePage from "@/pages/ProfilePage";
import CustomerAccount from "@/pages/CustomerAccount";
import ReviewPage from "@/pages/ReviewPage";
import LoyaltyPage from "@/pages/LoyaltyPage";
import CustomerCRM from "@/pages/CustomerCRM";
import { Offers, Services } from "@/pages/ExplorePages";
import { AuthPage, Placeholder } from "@/pages/AccountPages";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedProfile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (!user) return <AuthPage mode="login" />;
  return <main className="container py-16"><div className="mx-auto max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt member</p><h1 className="mt-3 font-display text-4xl font-bold text-primary">{t("profile.title")}</h1><div className="mt-8 rounded-2xl border border-border bg-card p-6"><h2 className="font-display text-xl font-bold text-primary">{t("profile.personalInfo")}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">{t("auth.name")}</p><p className="mt-1 font-medium">{user.name}</p></div><div><p className="text-xs text-muted-foreground">{t("auth.email")}</p><p className="mt-1 font-medium">{user.email}</p></div></div></div><div className="mt-5 rounded-2xl border border-border bg-card p-6"><h2 className="font-display text-xl font-bold text-primary">{t("profile.bookingHistory")}</h2><p className="mt-4 text-sm text-muted-foreground">{t("profile.noBookings")}</p></div></div></main>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Toaster /><Sonner /><LanguageProvider><AuthProvider><BrowserRouter><SiteLayout><Routes><Route path="/" element={<Index />} /><Route path="/hotels" element={<Hotels />} /><Route path="/search" element={<SearchResults />} /><Route path="/hotels/:slug" element={<HotelRooms />} /><Route path="/hotels/:slug/details" element={<HotelDetails />} /><Route path="/checkout" element={<Checkout />} /><Route path="/booking-success/:bookingId" element={<BookingSuccess />} /><Route path="/bookings" element={<BookingHistory />} /><Route path="/offers" element={<Offers />} /><Route path="/services" element={<Services />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/account" element={<CustomerAccount />} /><Route path="/loyalty" element={<LoyaltyPage />} /><Route path="/crm" element={<CustomerCRM />} /><Route path="/reviews/:bookingId" element={<ReviewPage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/forgot-password" element={<Placeholder title="Quên mật khẩu / OTP" />} /><Route path="/change-password" element={<Placeholder title="Đổi mật khẩu" />} /><Route path="/about" element={<Placeholder title="About Sen Việt" />} /><Route path="/contact" element={<Placeholder title="Contact Sen Việt" />} /><Route path="/admin" element={<Placeholder title="Chain management" />} /><Route path="*" element={<NotFound />} /></Routes></SiteLayout></BrowserRouter></AuthProvider></LanguageProvider></TooltipProvider></QueryClientProvider>;
}

const container = document.getElementById("root") as (HTMLElement & { __senvietReactRoot?: Root }) | null;
if (!container) throw new Error("Missing #root container");
const root = container.__senvietReactRoot ?? createRoot(container);
container.__senvietReactRoot = root;
root.render(<App />);
