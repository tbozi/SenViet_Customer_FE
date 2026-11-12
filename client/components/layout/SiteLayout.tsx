import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "@/components/ChatWidget";
import ScrollToTop from "@/components/ScrollToTop";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/chat",
  ].some((path) => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      <Header />
      <div className="flex-1">{children}</div>
      {!isAuthPage && <Footer />}
      <ScrollToTop />
      {!isAuthPage && <ChatWidget />}
    </div>
  );
}
