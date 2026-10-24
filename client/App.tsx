import { createRoot, Root } from "react-dom/client";
import { useEffect, lazy, Suspense, ReactNode } from "react";
import "@/global.css";
import { BrowserRouter, Route, Routes, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { disconnectCustomerSocket, initCustomerSocket } from "@/lib/socket";
import SiteLayout from "@/components/layout/SiteLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "@/pages/Index";
import { store } from "@/store";
import { ThemeProvider } from "@/lib/theme";

// Lazy-loaded pages for optimal bundle splitting
const Hotels = lazy(() => import("@/pages/Hotels"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const HotelRooms = lazy(() => import("@/pages/HotelRooms"));
const HotelDetails = lazy(() => import("@/pages/HotelDetails"));
const BookingServices = lazy(() => import("@/pages/BookingServices"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const BookingSuccess = lazy(() => import("@/pages/BookingSuccess"));
const BookingHistory = lazy(() => import("@/pages/BookingHistory"));
const InvoicePage = lazy(() => import("@/pages/InvoicePage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const CustomerAccount = lazy(() => import("@/pages/CustomerAccount"));
const ReviewPage = lazy(() => import("@/pages/ReviewPage"));
const LoyaltyPage = lazy(() => import("@/pages/LoyaltyPage"));
const CustomerCRM = lazy(() => import("@/pages/CustomerCRM"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Lazy imports for sub-components
const ExplorePages = lazy(() => import("@/pages/ExplorePages").then((m) => ({ default: m.Offers })));
const ExploreServices = lazy(() => import("@/pages/ExplorePages").then((m) => ({ default: m.Services })));
const AuthPage = lazy(() => import("@/pages/AccountPages").then((m) => ({ default: m.AuthPage })));
const Placeholder = lazy(() => import("@/pages/AccountPages").then((m) => ({ default: m.Placeholder })));

const queryClient = new QueryClient();

function PageLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold/20 border-t-gold" />
        <p className="text-xs font-medium tracking-wide text-muted-foreground">Đang tải trang...</p>
      </div>
    </div>
  );
}

function ServicesRoute() {
  const [params] = useSearchParams();
  if (params.get("hotel") || params.get("roomSelections") || params.get("room")) {
    return <BookingServices />;
  }
  return <ExploreServices />;
}

function CustomerSocketLifecycle() {
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) initCustomerSocket(token, user?.userId, user?.accountId, user?.email);
    else disconnectCustomerSocket();

    return () => disconnectCustomerSocket();
  }, [token, user?.userId, user?.accountId, user?.email]);

  return null;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const location = useLocation();
  const hasLocalToken = typeof window !== "undefined" && !!localStorage.getItem("senviet_token");

  if (!user && !token && !hasLocalToken) {
    return <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LanguageProvider>
            <ThemeProvider>
              <AuthProvider>
                <CustomerSocketLifecycle />
                <BrowserRouter>
                  <SiteLayout>
                    <ErrorBoundary>
                      <Suspense fallback={<PageLoadingFallback />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/hotels" element={<Hotels />} />
                          <Route path="/search" element={<SearchResults />} />
                          <Route path="/hotels/:slug" element={<HotelRooms />} />
                          <Route path="/hotels/:slug/details" element={<HotelDetails />} />
                          <Route path="/hotels/:slug/services" element={<BookingServices />} />
                          <Route path="/booking-services" element={<BookingServices />} />
                          <Route path="/checkout" element={<Checkout />} />
                          <Route path="/booking-success" element={<BookingSuccess />} />
                          <Route path="/booking-success/:bookingId" element={<BookingSuccess />} />
                          <Route
                            path="/bookings"
                            element={
                              <ProtectedRoute>
                                <BookingHistory />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/history" element={<Navigate to="/bookings" replace />} />
                          <Route
                            path="/invoices"
                            element={
                              <ProtectedRoute>
                                <InvoicePage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/invoices/:id"
                            element={
                              <ProtectedRoute>
                                <InvoicePage />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/offers" element={<ExplorePages />} />
                          <Route path="/services" element={<ServicesRoute />} />
                          <Route path="/login" element={<AuthPage mode="login" />} />
                          <Route path="/register" element={<AuthPage mode="register" />} />
                          <Route
                            path="/account"
                            element={
                              <ProtectedRoute>
                                <CustomerAccount />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/loyalty"
                            element={
                              <ProtectedRoute>
                                <LoyaltyPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/crm"
                            element={
                              <ProtectedRoute>
                                <CustomerCRM />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/reviews/:bookingId" element={<ReviewPage />} />
                          <Route
                            path="/profile"
                            element={
                              <ProtectedRoute>
                                <ProfilePage />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="/change-password" element={<Navigate to="/profile" replace />} />
                          <Route path="/about" element={<AboutPage />} />
                          <Route path="/contact" element={<ContactPage />} />
                          <Route path="/admin" element={<Placeholder title="Hệ thống Quản lý Chuỗi Sen Việt" />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </ErrorBoundary>
                  </SiteLayout>
                </BrowserRouter>
              </AuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

const container = document.getElementById("root") as (HTMLElement & { __senvietReactRoot?: Root }) | null;
if (!container) throw new Error("Missing #root container");
const root = container.__senvietReactRoot ?? createRoot(container);
container.__senvietReactRoot = root;
root.render(<App />);
