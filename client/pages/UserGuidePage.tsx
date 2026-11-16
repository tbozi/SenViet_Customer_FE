import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Gift,
  HelpCircle,
  Hotel,
  KeyRound,
  Mail,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  X,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { openChatWidget } from "@/components/ChatWidget";

interface GuideImage {
  src: string;
  captionVi: string;
  captionEn: string;
}

interface GuideSection {
  id: string;
  number: string;
  icon: typeof BookOpen;
  titleVi: string;
  titleEn: string;
  summaryVi: string;
  summaryEn: string;
  stepsVi: string[];
  stepsEn: string[];
  actionTo?: string;
  actionLabelVi?: string;
  actionLabelEn?: string;
  images: GuideImage[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "account",
    number: "01",
    icon: KeyRound,
    titleVi: "Tài khoản & Bảo mật",
    titleEn: "Account & Security",
    summaryVi:
      "Đăng ký tài khoản mới bằng OTP Email, đăng nhập, khôi phục mật khẩu và quản lý hồ sơ thành viên.",
    summaryEn:
      "Register with email OTP verification, sign in, reset passwords, and manage your member profile.",
    stepsVi: [
      "Nhấn Đăng ký trên thanh điều hướng, điền Họ tên, Email, SĐT, Mật khẩu và xác thực mã OTP gửi về Email.",
      "Nhấn Đăng nhập để truy cập tài khoản. Nếu quên mật khẩu, chọn Quên mật khẩu? để nhận liên kết đặt lại.",
      "Sau khi đăng nhập, nhấn vào tên tài khoản ở góc trên bên phải để xem Hồ sơ cá nhân (/profile) và Ví ưu đãi (/account).",
      "Có thể chuyển đổi Ngôn ngữ (VI / EN), Giao diện Sáng / Tối và xem Chuông thông báo đặt phòng realtime trên thanh điều hướng.",
    ],
    stepsEn: [
      "Click Register in the header, enter your details, and verify with the OTP code sent to your email.",
      "Click Sign In with your email and password, or use Forgot Password? to receive a reset link.",
      "Click your profile name at the top right to manage Profile (/profile) and Member Account (/account).",
      "Switch between VI / EN, Light / Dark mode, and check real-time booking notifications in the top bar.",
    ],
    actionTo: "/login",
    actionLabelVi: "Đi tới Đăng nhập",
    actionLabelEn: "Go to Sign In",
    images: [
      {
        src: "/guide/02_login.png",
        captionVi: "Màn hình Đăng nhập tài khoản Sen Việt",
        captionEn: "Sen Việt Sign In screen",
      },
    ],
  },
  {
    id: "home-search",
    number: "02",
    icon: Search,
    titleVi: "Trang chủ & Tìm kiếm nhanh",
    titleEn: "Home Page & Quick Search",
    summaryVi:
      "Khám phá nhanh hệ thống chi nhánh Sen Việt, khu vực tỉnh thành và tìm phòng trống theo ngày.",
    summaryEn:
      "Explore Sen Việt branches, browse by destination, and search available rooms by date.",
    stepsVi: [
      "Trên thanh Tìm kiếm nhanh, chọn Địa điểm (chi nhánh), Ngày nhận phòng, Ngày trả phòng, Số phòng, Số người lớn/trẻ em và Mã khuyến mãi (tùy chọn), sau đó nhấn Tìm phòng.",
      "Kéo xuống mục Hệ thống khách sạn Sen Việt để xem ảnh bìa, địa chỉ, hotline và giá khởi điểm thấp nhất của từng chi nhánh.",
      "Dùng mục Khám phá theo khu vực để xem các tỉnh/thành phố đang có khách sạn hoạt động.",
    ],
    stepsEn: [
      "In the Quick Search bar, choose Destination, Check-in, Check-out, Rooms, Guests, and optional Promo code, then click Search.",
      "Scroll to Sen Việt Collection to view hotel cards with cover photos, addresses, hotlines, and starting prices.",
      "Use Destinations by Region to browse provinces where Sen Việt properties are located.",
    ],
    actionTo: "/",
    actionLabelVi: "Xem Trang chủ",
    actionLabelEn: "View Home Page",
    images: [
      {
        src: "/guide/01_home.png",
        captionVi: "Trang chủ và Thanh tìm kiếm nhanh",
        captionEn: "Home Hero & Quick Search bar",
      },
      {
        src: "/guide/01b_home_hotels.png",
        captionVi: "Danh sách Hệ thống khách sạn Sen Việt",
        captionEn: "Sen Việt Hotels Collection cards",
      },
      {
        src: "/guide/01c_home_regions.png",
        captionVi: "Khám phá khách sạn theo khu vực tỉnh thành",
        captionEn: "Explore hotels by destination province",
      },
    ],
  },
  {
    id: "hotels-details",
    number: "03",
    icon: Hotel,
    titleVi: "Danh sách & Chi tiết khách sạn",
    titleEn: "Hotels Directory & Details",
    summaryVi:
      "Lọc chi nhánh theo 3 miền Bắc – Trung – Nam và xem đầy đủ thư viện ảnh, tiện ích, đánh giá thực tế.",
    summaryEn:
      "Filter branches by North – Central – South regions and inspect photo galleries, amenities, and verified reviews.",
    stepsVi: [
      "Tại trang Khách sạn (/hotels), lọc theo Khu vực (Tất cả / Miền Bắc / Miền Trung / Miền Nam), theo Tỉnh thành hoặc tìm theo từ khóa.",
      "Nhấn Xem chi tiết để mở trang Chi tiết khách sạn (/hotels/:id/details) với thư viện ảnh phóng to, hotline chi nhánh, tiện ích và câu hỏi thường gặp.",
      "Xem điểm đánh giá trung bình và lọc các nhận xét thực tế của khách hàng theo số sao (5★, 4★, 3★...).",
    ],
    stepsEn: [
      "On Hotels (/hotels), filter by Region (All / North / Central / South), Province, or search keyword.",
      "Click View Details to open Hotel Details (/hotels/:id/details) with full photo lightbox, branch hotline, amenities, and FAQ.",
      "Inspect verified guest ratings and filter reviews by star rating.",
    ],
    actionTo: "/hotels",
    actionLabelVi: "Xem Danh sách khách sạn",
    actionLabelEn: "Browse Hotels",
    images: [
      {
        src: "/guide/03_hotels.png",
        captionVi: "Trang Danh sách khách sạn và bộ lọc khu vực",
        captionEn: "Hotels list with region & province filters",
      },
      {
        src: "/guide/04_hotel_details.png",
        captionVi: "Trang Chi tiết khách sạn Sen Việt",
        captionEn: "Hotel Details page",
      },
    ],
  },
  {
    id: "booking-payment",
    number: "04",
    icon: CreditCard,
    titleVi: "Đặt phòng, Dịch vụ & Thanh toán QR PayOS",
    titleEn: "Room Selection, Services & PayOS QR Payment",
    summaryVi:
      "Chọn số lượng phòng khớp tồn kho thực tế theo ngày, thêm dịch vụ đi kèm, áp mã giảm giá và quét VietQR PayOS.",
    summaryEn:
      "Select rooms synced with real-time availability, add extra services, apply promo codes, and pay via PayOS VietQR.",
    stepsVi: [
      "Bước 1 — Chọn phòng (/hotels/:id): Kiểm tra giờ nhận/trả dự kiến (14:00 – 12:00), chọn số lượng phòng ở mục Chọn phòng phù hợp và chỉnh riêng ngày/số khách từng phòng nếu cần. Theo dõi cột Tóm tắt lựa chọn bên phải rồi nhấn Tiếp tục.",
      "Bước 2 — Chọn dịch vụ (/booking-services, tùy chọn): Chọn thêm Spa, Nhà hàng, Đưa đón sân bay... theo từng phòng đã chọn (yêu cầu đăng nhập).",
      "Bước 3 — Thanh toán (/checkout): Kiểm tra thông tin liên hệ, nhập hoặc chọn Voucher đã lưu, xem chính sách hủy (trước > 24h được yêu cầu hoàn tiền; trong 24h không hoàn tiền) và nhấn Xác nhận & Thanh toán.",
      "Bước 4 — Quét QR PayOS (/booking-success): Dùng app ngân hàng quét mã VietQR trong thời gian đếm ngược giữ phòng. Hệ thống tự động xác nhận đơn realtime và gửi email hóa đơn ngay khi thanh toán thành công.",
    ],
    stepsEn: [
      "Step 1 — Select Rooms (/hotels/:id): Verify estimated arrival/departure time, choose room quantities matching real-time availability, and review the sticky Booking Summary panel.",
      "Step 2 — Add Services (/booking-services, optional): Attach Spa, Dining, or Transfer services per room (login required).",
      "Step 3 — Checkout (/checkout): Confirm guest info, apply a promo code or saved voucher, review the 24-hour cancellation/refund policy, and proceed to PayOS.",
      "Step 4 — Scan PayOS QR (/booking-success): Scan the VietQR code before the hold timer expires. Confirmation and invoice email update automatically in real time.",
    ],
    actionTo: "/hotels/8",
    actionLabelVi: "Thử Chọn phòng ngay",
    actionLabelEn: "Try Room Selection",
    images: [
      {
        src: "/guide/05_hotel_rooms.png",
        captionVi: "Trang Chọn phòng phù hợp và Bảng tóm tắt đặt phòng",
        captionEn: "Room Selection & Booking Summary panel",
      },
    ],
  },
  {
    id: "offers",
    number: "05",
    icon: Gift,
    titleVi: "Săn & Lưu Mã ưu đãi",
    titleEn: "Explore & Save Promotions",
    summaryVi:
      "Tìm kiếm, xem điều kiện áp dụng, sao chép nhanh hoặc lưu voucher vào tài khoản cá nhân.",
    summaryEn:
      "Search active promotions, inspect eligibility conditions, copy codes, or save vouchers to your account.",
    stepsVi: [
      "Truy cập mục Ưu đãi (/offers) để xem các chương trình khuyến mãi đang áp dụng từ hệ thống.",
      "Lọc theo Chi nhánh hoặc Loại ưu đãi (Giảm giá phòng, Giảm giá dịch vụ, Toàn bộ hóa đơn).",
      "Nhấn Sao chép để copy mã, Xem chi tiết để kiểm tra đơn tối thiểu/mức giảm tối đa, hoặc Lưu voucher để chọn nhanh ở bước thanh toán.",
    ],
    stepsEn: [
      "Open Offers (/offers) to view all currently active promotions from the database.",
      "Filter by Branch or Discount Type (Room, Service, or Total Invoice).",
      "Click Copy to copy a code, View Details for terms, or Save Voucher (when signed in) for one-click checkout.",
    ],
    actionTo: "/offers",
    actionLabelVi: "Xem Ưu đãi",
    actionLabelEn: "View Offers",
    images: [
      {
        src: "/guide/06_offers.png",
        captionVi: "Trang Ưu đãi và danh sách voucher từ hệ thống",
        captionEn: "Offers page with live promotions",
      },
    ],
  },
  {
    id: "ai-chat",
    number: "06",
    icon: MessageSquare,
    titleVi: "Trợ lý AI & Chat với Lễ tân",
    titleEn: "AI Concierge & Live Staff Chat",
    summaryVi:
      "Tư vấn, kiểm tra phòng trống, đặt phòng trực tiếp qua AI hoặc nhắn tin realtime với lễ tân chi nhánh.",
    summaryEn:
      "Get 24/7 AI assistance, check availability, book directly in chat, or message branch receptionists in real time.",
    stepsVi: [
      "Nhấn nút Liên hệ ở góc dưới bên phải màn hình để mở Trung tâm Hỗ trợ Sen Việt 24/7.",
      "Chọn Nhận tư vấn từ Trợ lý AI để hỏi đáp bằng tiếng Việt/tiếng Anh, tìm phòng trống và tạo đơn đặt phòng kèm mã QR PayOS ngay trong khung chat.",
      "Hoặc chọn Chat với Nhân viên, chọn chi nhánh cần hỗ trợ từ danh sách để nhắn tin trực tiếp với lễ tân.",
      "Có thể mở rộng sang chế độ toàn màn hình tại /chat để xem danh sách chi nhánh và các gợi ý câu hỏi nhanh.",
    ],
    stepsEn: [
      "Click the floating Contact button at the bottom-right corner to open the 24/7 Support Center.",
      "Choose AI Assistant for bilingual Q&A, availability lookup, and direct in-chat booking with PayOS QR.",
      "Or select Chat with Staff and pick a branch from the dropdown to message front-desk staff in real time.",
      "Expand to full-screen mode at /chat for quick branch shortcuts and suggested prompts.",
    ],
    actionTo: "/chat",
    actionLabelVi: "Mở Trợ lý AI toàn màn hình",
    actionLabelEn: "Open Full-Screen AI Chat",
    images: [
      {
        src: "/guide/09_chat_widget.png",
        captionVi: "Hộp thoại Trợ lý AI Sen Việt góc màn hình",
        captionEn: "Floating AI Assistant chat widget",
      },
      {
        src: "/guide/09b_chat_fullpage.png",
        captionVi: "Giao diện Trợ lý AI toàn màn hình (/chat)",
        captionEn: "Full-screen AI Concierge interface (/chat)",
      },
    ],
  },
  {
    id: "bookings-history",
    number: "07",
    icon: CalendarCheck,
    titleVi: "Quản lý đơn đặt phòng, Hóa đơn & Đánh giá",
    titleEn: "Manage Bookings, Invoices & Reviews",
    summaryVi:
      "Theo dõi lịch sử đặt phòng, thanh toán lại đơn chờ, in hóa đơn PDF, gửi yêu cầu hoàn tiền và đánh giá sau lưu trú.",
    summaryEn:
      "Track bookings, resume pending payments, print PDF invoices, request refunds, and leave stay reviews.",
    stepsVi: [
      "Vào Lịch sử đặt phòng (/bookings) từ menu tài khoản để xem trạng thái toàn bộ đơn đã đặt.",
      "Đơn Chờ thanh toán: nhấn Thanh toán để mở lại mã QR PayOS trước khi hết thời gian giữ phòng.",
      "Xem hóa đơn (/invoices/:id): kiểm tra chi tiết tiền phòng, dịch vụ, VAT, giảm giá và nhấn In hóa đơn / Lưu PDF.",
      "Hủy phòng & Hoàn tiền: với đơn đủ điều kiện (hủy trước giờ nhận > 24h), điền thông tin tài khoản ngân hàng nhận tiền để gửi yêu cầu Hoàn tiền do hủy booking.",
      "Đánh giá (/reviews/:bookingId): sau khi hoàn tất lưu trú, chấm điểm 5 tiêu chí và gửi nhận xét công khai.",
    ],
    stepsEn: [
      "Open Booking History (/bookings) from your account menu to track all reservations.",
      "Pending orders: reopen the PayOS QR code before expiration to complete payment.",
      "View Invoice (/invoices/:id): review itemized room, service, VAT, and discount details, and print or save as PDF.",
      "Cancel & Refund: for eligible paid bookings (> 24h before check-in), submit bank details to request a cancellation refund.",
      "Review (/reviews/:bookingId): after check-out, rate 5 criteria and share your feedback publicly.",
    ],
    actionTo: "/bookings",
    actionLabelVi: "Xem Lịch sử đặt phòng",
    actionLabelEn: "Go to Booking History",
    images: [],
  },
  {
    id: "contact-about",
    number: "08",
    icon: Mail,
    titleVi: "Liên hệ góp ý qua Email & Giới thiệu",
    titleEn: "Email Contact & About Us",
    summaryVi:
      "Gửi thắc mắc/góp ý qua Email trực tiếp đến CSKH, tra cứu danh bạ hotline từng chi nhánh và xem thông tin thương hiệu.",
    summaryEn:
      "Send inquiries via email directly to support, look up branch hotlines, and explore brand stories.",
    stepsVi: [
      "Tại trang Liên hệ (/contact), điền Họ tên, SĐT, Email, chọn Chi nhánh, Tiêu đề và Nội dung rồi nhấn Gửi thông tin qua Email — hệ thống sẽ gửi thư đến CSKH và gửi email xác nhận lại cho bạn.",
      "Kéo xuống phần Danh bạ chi nhánh để xem địa chỉ và bấm gọi trực tiếp số hotline từng chi nhánh.",
      "Trang Về chúng tôi (/about) giới thiệu câu chuyện thương hiệu, giá trị cốt lõi và mạng lưới chi nhánh Sen Việt.",
    ],
    stepsEn: [
      "On Contact (/contact), fill out the inquiry form and click Send Email Inquiry — the backend emails support and sends a confirmation copy to your inbox.",
      "Scroll to the Branch Directory to view verified addresses and click-to-call branch phone numbers.",
      "Visit About Us (/about) to explore Sen Việt's heritage, core values, and nationwide properties.",
    ],
    actionTo: "/contact",
    actionLabelVi: "Đi tới Trang Liên hệ",
    actionLabelEn: "Go to Contact Page",
    images: [
      {
        src: "/guide/07_contact.png",
        captionVi: "Trang Liên hệ & Gửi thắc mắc góp ý qua Email",
        captionEn: "Contact page & Email inquiry form",
      },
      {
        src: "/guide/08_about.png",
        captionVi: "Trang Về chúng tôi (/about)",
        captionEn: "About Us page (/about)",
      },
    ],
  },
];

export default function UserGuidePage() {
  const { language } = useLanguage();
  const isEn = language === "en";
  const [lightboxImage, setLightboxImage] = useState<GuideImage | null>(null);

  return (
    <main className="bg-background text-foreground">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-primary py-16 sm:py-20 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,hsl(var(--gold)/.22),transparent_45%),linear-gradient(180deg,hsl(var(--primary))_0%,hsl(var(--primary)/.95)_100%)]" />
        <div className="container relative z-10 px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-gold backdrop-blur mb-5">
            <BookOpen className="h-3.5 w-3.5" />
            {isEn ? "Customer User Manual" : "Tài liệu hướng dẫn khách hàng"}
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            {isEn
              ? "Sen Việt Website User Guide"
              : "Hướng Dẫn Sử Dụng Website Sen Việt"}
          </h1>
          <p className="mt-4 text-sm sm:text-base text-primary-foreground/85 max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? "Step-by-step visual walkthrough covering hotel search, online room reservation, PayOS QR payment, AI Concierge, vouchers, and booking management."
              : "Hướng dẫn trực quan từng bước: tìm kiếm khách sạn, chọn phòng, thanh toán VietQR PayOS, đặt phòng qua Trợ lý AI, săn ưu đãi và quản lý đơn đặt phòng."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gold px-7 text-gold-foreground font-semibold hover:bg-gold/90"
            >
              <Link to="/hotels">
                {isEn ? "Start Booking" : "Bắt đầu đặt phòng"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={openChatWidget}
              className="rounded-full border-white/50 bg-transparent px-7 text-white hover:bg-white/10"
            >
              <Sparkles className="mr-2 h-4 w-4 text-gold" />
              {isEn ? "Ask AI Assistant" : "Hỏi Trợ lý AI"}
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content with Sticky TOC */}
      <section className="container py-12 sm:py-16 px-4">
        <div className="grid gap-10 lg:grid-cols-[300px_1fr]">
          {/* Sticky Table of Contents */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold mb-4">
                <HelpCircle className="h-4 w-4" />
                <span>{isEn ? "Quick Navigation" : "Mục lục nhanh"}</span>
              </div>
              <nav className="space-y-1.5">
                {GUIDE_SECTIONS.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="flex items-start gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/70 hover:text-primary transition"
                    >
                      <span className="mt-0.5 shrink-0 whitespace-nowrap font-mono text-[11px] font-bold text-gold">
                        {sec.number}
                      </span>
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="leading-snug">
                        {isEn ? sec.titleEn : sec.titleVi}
                      </span>
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Guide Sections */}
          <div className="space-y-10">
            {GUIDE_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const steps = isEn ? sec.stepsEn : sec.stepsVi;
              return (
                <article
                  key={sec.id}
                  id={sec.id}
                  className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-gold shadow-xs">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gold font-mono">
                          {isEn ? `Section ${sec.number}` : `Phần ${sec.number}`}
                        </span>
                        <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-primary">
                          {isEn ? sec.titleEn : sec.titleVi}
                        </h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {isEn ? sec.summaryEn : sec.summaryVi}
                        </p>
                      </div>
                    </div>

                    {sec.actionTo && (
                      <Button asChild variant="outline" size="sm" className="rounded-full shrink-0">
                        <Link to={sec.actionTo}>
                          {isEn ? sec.actionLabelEn : sec.actionLabelVi}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Step list */}
                  <ol className="mt-6 space-y-3">
                    {steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/90">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>

                  {/* Screenshots */}
                  {sec.images.length > 0 && (
                    <div
                      className={`mt-6 grid gap-4 ${
                        sec.images.length === 1
                          ? "grid-cols-1"
                          : sec.images.length === 2
                            ? "sm:grid-cols-2"
                            : "sm:grid-cols-2 lg:grid-cols-3"
                      }`}
                    >
                      {sec.images.map((img) => (
                        <figure
                          key={img.src}
                          className="group overflow-hidden rounded-2xl border border-border bg-secondary/20"
                        >
                          <button
                            type="button"
                            onClick={() => setLightboxImage(img)}
                            className="relative block w-full overflow-hidden text-left cursor-zoom-in"
                          >
                            <img
                              loading="lazy"
                              src={img.src}
                              alt={isEn ? img.captionEn : img.captionVi}
                              className="h-56 sm:h-64 w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                            />
                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
                              <ZoomIn className="h-3 w-3" />
                              {isEn ? "Zoom" : "Phóng to"}
                            </span>
                          </button>
                          <figcaption className="border-t border-border/60 px-4 py-2.5 text-xs font-medium text-muted-foreground">
                            {isEn ? img.captionEn : img.captionVi}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/80 text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImage.src}
              alt={isEn ? lightboxImage.captionEn : lightboxImage.captionVi}
              className="max-h-[82vh] w-full object-contain bg-slate-950"
            />
            <div className="border-t border-white/10 px-5 py-3 text-center text-xs sm:text-sm font-medium text-slate-200">
              {isEn ? lightboxImage.captionEn : lightboxImage.captionVi}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
