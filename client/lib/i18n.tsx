import { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Language = "vi" | "en";

const dictionaries = {
  vi: {
    nav: {
      home: "Trang chủ",
      hotels: "Khách sạn",
      offers: "Ưu đãi",
      services: "Dịch vụ",
      about: "Về chúng tôi",
      contact: "Liên hệ",
      admin: "Quản lý chuỗi",
      login: "Đăng nhập",
      register: "Đăng ký",
      profile: "Hồ sơ cá nhân",
      account: "Tài khoản của tôi",
      loyalty: "Loyalty",
      myBookings: "Đặt phòng của tôi",
      logout: "Đăng xuất",
    },
    hero: {
      badge: "Chuỗi khách sạn hàng đầu Việt Nam",
      title: "Sen Việt Hotels & Resorts",
      subtitle:
        "6 khách sạn trải dài từ Bắc chí Nam, cùng trợ lý AI tư vấn đặt phòng và chăm sóc khách hàng 24/7.",
      ctaPrimary: "Khám phá khách sạn",
      ctaSecondary: "Đặt phòng ngay",
      statHotels: "khách sạn",
      statProvinces: "tỉnh thành",
      statSupport: "hỗ trợ AI",
      statGuests: "khách hàng hài lòng",
    },
    hotels: {
      sectionTitle: "Hệ thống khách sạn Sen Việt",
      sectionSubtitle:
        "Từ miền sông nước Tiền Giang đến phố biển Bình Định, mỗi khách sạn mang một dấu ấn riêng.",
      viewAll: "Xem tất cả khách sạn",
      viewDetail: "Xem chi tiết",
      book: "Đặt phòng",
      from: "Chỉ từ",
      night: "/đêm",
      filterAll: "Tất cả",
      filterNorth: "Miền Bắc",
      filterCentral: "Miền Trung",
      filterSouth: "Miền Nam",
      pageTitle: "Khách sạn của chúng tôi",
      pageSubtitle:
        "6 điểm dừng chân sang trọng, rải khắp Việt Nam, sẵn sàng đón bạn.",
      regionsTitle: "Khám phá theo khu vực",
      searchLocation: "Địa điểm",
      searchCheckIn: "Ngày nhận",
      searchCheckOut: "Ngày trả",
      searchRooms: "Số phòng",
      searchPromo: "Mã khuyến mãi",
      searchButton: "Tìm phòng",
      statHotels: "khách sạn",
      roomLabel: "phòng",
    },
    ai: {
      badge: "Trợ lý AI thông minh",
      title: "AI Agent luôn sẵn sàng tư vấn cho bạn",
      subtitle:
        "Từ gợi ý phòng phù hợp đến hỗ trợ sau khi đặt phòng, trợ lý AI của Sen Việt đồng hành cùng bạn mọi lúc.",
      point1Title: "Tư vấn đặt phòng thông minh",
      point1Desc: "Gợi ý khách sạn và loại phòng phù hợp với nhu cầu, ngân sách.",
      point2Title: "Hỗ trợ 24/7",
      point2Desc: "Trả lời mọi thắc mắc về đặt phòng, chính sách, ưu đãi bất kỳ lúc nào.",
      point3Title: "Chăm sóc sau đặt phòng",
      point3Desc: "Nhắc lịch, hỗ trợ đổi/huỷ và giải đáp khi lưu trú.",
      cta: "Trò chuyện với trợ lý AI",
      widgetTitle: "Trợ lý AI Sen Việt",
      widgetGreeting:
        "Xin chào! Tôi có thể giúp bạn tìm khách sạn, tư vấn đặt phòng hoặc giải đáp thắc mắc. Bạn cần hỗ trợ gì?",
      placeholder: "Nhập câu hỏi của bạn...",
      quickBook: "Tôi muốn đặt phòng",
      quickOffer: "Ưu đãi hiện có",
      quickLocation: "Vị trí khách sạn",
      quickSupport: "Hỗ trợ khách hàng",
      genericReply:
        "Cảm ơn bạn! Đây là bản demo giao diện trợ lý AI. Khi kết nối với hệ thống AI thực tế, tôi sẽ trả lời chi tiết hơn dựa trên dữ liệu đặt phòng của bạn.",
    },
    cta: {
      title: "Chủ động đăng ký để nhận ưu đãi riêng",
      subtitle: "Thành viên Sen Việt nhận ưu đãi giá phòng và tích điểm mỗi lần lưu trú.",
      button: "Đăng ký ngay",
    },
    testimonials: {
      title: "Khách hàng nói gì về chúng tôi",
    },
    footer: {
      tagline: "Chuỗi khách sạn Việt, chăm sóc bằng công nghệ AI.",
      explore: "Khám phá",
      company: "Công ty",
      contact: "Liên hệ",
      rights: "Đã đăng ký bản quyền.",
    },
    auth: {
      loginTitle: "Đăng nhập tài khoản",
      loginSubtitle: "Chào mừng quay lại Sen Việt Hotels.",
      registerTitle: "Tạo tài khoản mới",
      registerSubtitle: "Đăng ký để đặt phòng và nhận ưu đãi thành viên.",
      name: "Họ và tên",
      email: "Email",
      password: "Mật khẩu",
      confirmPassword: "Xác nhận mật khẩu",
      loginButton: "Đăng nhập",
      registerButton: "Đăng ký",
      noAccount: "Chưa có tài khoản?",
      hasAccount: "Đã có tài khoản?",
      registerLink: "Đăng ký ngay",
      loginLink: "Đăng nhập",
      requireLoginTitle: "Vui lòng đăng nhập để đặt phòng",
      requireLoginDesc: "Bạn cần đăng nhập hoặc tạo tài khoản trước khi hoàn tất đặt phòng.",
    },
    profile: {
      title: "Hồ sơ cá nhân",
      personalInfo: "Thông tin cá nhân",
      bookingHistory: "Lịch sử đặt phòng",
      noBookings: "Bạn chưa có đặt phòng nào.",
      bookNow: "Đặt phòng ngay",
      save: "Lưu thay đổi",
      phone: "Số điện thoại",
    },
    placeholder: {
      title: "Trang đang được xây dựng",
      desc: "Nội dung chi tiết cho trang này sẽ sớm được hoàn thiện. Hãy tiếp tục yêu cầu để bổ sung nội dung.",
      back: "Về trang chủ",
    },
    common: {
      language: "Ngôn ngữ",
    },
  },
  en: {
    nav: {
      home: "Home",
      hotels: "Hotels",
      offers: "Offers",
      services: "Services",
      about: "About",
      contact: "Contact",
      admin: "Chain Management",
      login: "Log in",
      register: "Sign up",
      profile: "Profile",
      account: "My account",
      loyalty: "Loyalty",
      myBookings: "My bookings",
      logout: "Log out",
    },
    hero: {
      badge: "Vietnam's leading hotel chain",
      title: "Sen Việt Hotels & Resorts",
      subtitle:
        "6 hotels spanning the country, backed by an AI agent for booking advice and 24/7 customer care.",
      ctaPrimary: "Explore hotels",
      ctaSecondary: "Book now",
      statHotels: "hotels",
      statProvinces: "provinces",
      statSupport: "AI support",
      statGuests: "happy guests",
    },
    hotels: {
      sectionTitle: "The Sen Việt hotel network",
      sectionSubtitle:
        "From the Mekong Delta to the coast of Bình Định, every property has its own character.",
      viewAll: "View all hotels",
      viewDetail: "View details",
      book: "Book now",
      from: "From",
      night: "/night",
      filterAll: "All",
      filterNorth: "North",
      filterCentral: "Central",
      filterSouth: "South",
      pageTitle: "Our hotels",
      pageSubtitle: "6 beautiful stays across Vietnam, ready to welcome you.",
      regionsTitle: "Explore by region",
      searchLocation: "Destination",
      searchCheckIn: "Check-in",
      searchCheckOut: "Check-out",
      searchRooms: "Rooms",
      searchPromo: "Promo code",
      searchButton: "Find a room",
      statHotels: "hotels",
      roomLabel: "rooms",
    },
    ai: {
      badge: "Smart AI Agent",
      title: "An AI agent ready to assist you anytime",
      subtitle:
        "From recommending the right room to post-booking support, our AI agent is with you every step of the way.",
      point1Title: "Smart booking advice",
      point1Desc: "Get hotel and room suggestions that match your needs and budget.",
      point2Title: "24/7 support",
      point2Desc: "Get answers about bookings, policies and offers anytime.",
      point3Title: "Post-booking care",
      point3Desc: "Reminders, change/cancel support and help during your stay.",
      cta: "Chat with the AI agent",
      widgetTitle: "Sen Việt AI Assistant",
      widgetGreeting:
        "Hi there! I can help you find a hotel, plan a booking or answer questions. How can I help?",
      placeholder: "Type your question...",
      quickBook: "I want to book a room",
      quickOffer: "Current offers",
      quickLocation: "Hotel locations",
      quickSupport: "Customer support",
      genericReply:
        "Thanks! This is a demo AI assistant interface. Once connected to a real AI backend, I'll give detailed answers based on your booking data.",
    },
    cta: {
      title: "Sign up to unlock member offers",
      subtitle: "Sen Việt members get exclusive rates and earn points on every stay.",
      button: "Sign up now",
    },
    testimonials: {
      title: "What our guests say",
    },
    footer: {
      tagline: "A Vietnamese hotel chain, powered by AI care.",
      explore: "Explore",
      company: "Company",
      contact: "Contact",
      rights: "All rights reserved.",
    },
    auth: {
      loginTitle: "Log in to your account",
      loginSubtitle: "Welcome back to Sen Việt Hotels.",
      registerTitle: "Create a new account",
      registerSubtitle: "Sign up to book rooms and earn member offers.",
      name: "Full name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      loginButton: "Log in",
      registerButton: "Sign up",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      registerLink: "Sign up",
      loginLink: "Log in",
      requireLoginTitle: "Please log in to book",
      requireLoginDesc: "You need to log in or create an account before completing your booking.",
    },
    profile: {
      title: "Profile",
      personalInfo: "Personal information",
      bookingHistory: "Booking history",
      noBookings: "You have no bookings yet.",
      bookNow: "Book now",
      save: "Save changes",
      phone: "Phone number",
    },
    placeholder: {
      title: "Page under construction",
      desc: "Detailed content for this page is coming soon. Keep prompting to fill it in.",
      back: "Back to home",
    },
    common: {
      language: "Language",
    },
  },
} as const;

type Dictionary = typeof dictionaries.vi;

function getValue(obj: any, path: string) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "vi";
    return (localStorage.getItem("senviet_lang") as Language) || "vi";
  });

  const setLanguageAndPersist = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("senviet_lang", lang);
    }
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageAndPersist,
      t: (path: string) => getValue(dictionaries[language], path) ?? path,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
