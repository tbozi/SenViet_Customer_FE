import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "@/components/ChatWidget";
import ScrollToTop from "@/components/ScrollToTop";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background"><Header />{children}<Footer /><ScrollToTop /><ChatWidget /></div>;
}
