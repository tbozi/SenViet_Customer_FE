import { useState, FormEvent } from "react";
import { 
  Building2, 
  CheckCircle, 
  Clock, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Phone, 
  Send, 
  Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hotels } from "@/data/hotels";
import { useLanguage } from "@/lib/i18n";
import { openChatWidget } from "@/components/ChatWidget";

export default function ContactPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "all",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setForm({ name: "", email: "", phone: "", branch: "all", subject: "", message: "" });
    }, 600);
  };

  const branchContacts = [
    {
      name: "Sen Việt Sài Gòn",
      address: "125 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      phone: "(+84) 28 3822 6868",
      email: "saigon@senviet.vn",
    },
    {
      name: "Sen Việt Hà Nội",
      address: "28 Tràng Tiền, Phường Tràng Tiền, Hoàn Kiếm, Hà Nội",
      phone: "(+84) 24 3933 6868",
      email: "hanoi@senviet.vn",
    },
    {
      name: "Sen Việt Đà Nẵng",
      address: "188 Võ Nguyên Giáp, Ngũ Hành Sơn, TP. Đà Nẵng",
      phone: "(+84) 236 384 6868",
      email: "danang@senviet.vn",
    },
    {
      name: "Sen Việt Nha Trang",
      address: "72 Trần Phú, Phường Lộc Thọ, TP. Nha Trang, Khánh Hòa",
      phone: "(+84) 258 385 6868",
      email: "nhatrang@senviet.vn",
    },
    {
      name: "Sen Việt Đà Lạt",
      address: "Khu du lịch Hồ Tuyền Lâm, Phường 4, TP. Đà Lạt, Lâm Đồng",
      phone: "(+84) 263 386 6868",
      email: "dalat@senviet.vn",
    },
    {
      name: "Sen Việt Gò Công",
      address: "Đường Trương Định, Phường 1, TP. Gò Công, Tiền Giang",
      phone: "(+84) 273 387 6868",
      email: "gocong@senviet.vn",
    },
    {
      name: "Sen Việt An Nhơn",
      address: "Quốc lộ 1A, Phường Bình Định, Thị xã An Nhơn, Bình Định",
      phone: "(+84) 256 388 6868",
      email: "annhon@senviet.vn",
    },
  ];

  return (
    <main className="bg-background text-foreground">
      {/* ================= HERO BANNER ================= */}
      <section className="relative min-h-[420px] flex items-center justify-center overflow-hidden bg-primary py-20 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--gold)/.25),transparent_40%),linear-gradient(180deg,hsl(var(--primary))_0%,hsl(var(--primary)/.95)_100%)]" />
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2000&auto=format&fit=crop"
          alt="Contact Sen Viet"
          className="absolute inset-0 -z-0 h-full w-full object-cover opacity-25"
        />
        
        <div className="container relative z-10 text-center max-w-2xl px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-gold backdrop-blur mb-5">
            <MessageSquare className="h-3.5 w-3.5" />
            {isEn ? "Sen Viet Concierge & Support" : "Liên Hệ & Hỗ Trợ Khách Hàng"}
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            {isEn ? "We Are Here to Assist You" : "Luôn Sẵn Sàng Đồng Hành Cùng Bạn"}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-primary-foreground/80 leading-relaxed font-light">
            {isEn
              ? "Have a question about room bookings, corporate retreats, or special event requests? Contact our dedicated guest service team or connect instantly with our 24/7 AI Concierge."
              : "Quý khách cần tư vấn chọn phòng, tổ chức hội nghị yến tiệc hay giải đáp thắc mắc dịch vụ? Hãy liên hệ ngay với Sen Việt để được đón tiếp chu đáo nhất."}
          </p>
        </div>
      </section>

      {/* ================= CONTACT INFO & FORM ================= */}
      <section className="container py-16 px-4">
        <div className="grid gap-12 lg:grid-cols-12">
          
          {/* Cột trái: Thông tin tổng đài & Trụ sở chính (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.18em] text-gold">
                {isEn ? "Direct Contact" : "Thông tin liên lạc"}
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-primary">
                {isEn ? "Headquarters & 24/7 Hotline" : "Tổng Đài Trực 24/7 Toàn Quốc"}
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isEn
                  ? "Reach us anytime via our centralized hotline or email, or drop by our corporate office in District 1."
                  : "Đội ngũ chăm sóc khách hàng Sen Việt luôn túc trực hỗ trợ quý khách mọi thời điểm trong tuần."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-gold">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {isEn ? "Hotline 24/7 (Free)" : "Hotline 24/7 (Miễn phí)"}
                  </div>
                  <a href="tel:19006868" className="text-base font-bold text-primary hover:underline font-mono">
                    1900 6868 / (+84) 28 3822 6868
                  </a>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isEn ? "Available in Vietnamese & English" : "Hỗ trợ tiếng Việt và tiếng Anh 24/7"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-gold">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {isEn ? "Email Inquiries" : "Email tiếp nhận thông tin"}
                  </div>
                  <a href="mailto:contact@senviet.vn" className="text-base font-bold text-primary hover:underline">
                    contact@senviet.vn
                  </a>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isEn ? "Response within 2 hours" : "Phản hồi thư trong vòng tối đa 2 giờ"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-gold">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {isEn ? "Corporate Headquarters" : "Trụ sở chính điều hành"}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Tòa nhà Sen Việt Tower, 125 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-gold">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {isEn ? "Operating Hours" : "Thời gian hoạt động"}
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    {isEn ? "Hotline & Check-in: 24/7 Everyday" : "Lễ tân & Đặt phòng: 24/7 tất cả các ngày"}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isEn ? "Administrative office: Mon - Sat (8:00 - 18:00)" : "Văn phòng hành chính: T2 - T7 (8:00 - 18:00)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Khối AI Assistant gợi ý */}
            <div className="rounded-2xl border border-gold/40 bg-primary/5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-gold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary">
                    {isEn ? "Instant AI Concierge" : "Cần câu trả lời tức thì?"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEn ? "Chat with Sen Viet AI for price checks & booking" : "Trò chuyện ngay cùng Trợ lý AI Sen Việt"}
                  </p>
                </div>
              </div>
              <Button 
                onClick={openChatWidget} 
                className="mt-4 w-full rounded-xl bg-primary hover:bg-primary/90 text-xs font-semibold"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-gold" />
                {isEn ? "Start Live Chat" : "Mở cửa sổ trò chuyện AI"}
              </Button>
            </div>
          </div>

          {/* Cột phải: Form gửi liên hệ (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
              <h2 className="font-display text-2xl font-bold text-primary">
                {isEn ? "Send Us a Message" : "Gửi Thắc Mắc & Góp Ý"}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {isEn 
                  ? "Fill in the form below. We will reply to your registered contact as soon as possible."
                  : "Quý khách vui lòng điền thông tin bên dưới, chuyên viên tư vấn sẽ liên hệ lại sớm nhất."}
              </p>

              {submitted ? (
                <div className="my-8 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center text-emerald-900">
                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                  <h3 className="text-base font-bold">
                    {isEn ? "Message Sent Successfully!" : "Gửi thông tin thành công!"}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700 mt-1 max-w-md mx-auto">
                    {isEn 
                      ? "Thank you for reaching out to Sen Việt Hotels & Resorts. We will review your request and get back shortly."
                      : "Cảm ơn quý khách đã gửi thư cho Sen Việt. Chúng tôi sẽ phản hồi trong thời gian sớm nhất."}
                  </p>
                  <Button 
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="mt-5 rounded-full text-xs font-semibold"
                  >
                    {isEn ? "Send Another Message" : "Gửi thêm yêu cầu khác"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        {isEn ? "Full Name *" : "Họ và tên *"}
                      </label>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder={isEn ? "e.g. John Doe" : "Ví dụ: Nguyễn Văn An"}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        {isEn ? "Phone Number *" : "Số điện thoại *"}
                      </label>
                      <input
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder={isEn ? "e.g. 0901234567" : "Ví dụ: 0901234567"}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        {isEn ? "Email Address *" : "Địa chỉ Email *"}
                      </label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="example@domain.com"
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        {isEn ? "Select Hotel Branch" : "Chi nhánh cần liên hệ"}
                      </label>
                      <select
                        value={form.branch}
                        onChange={(e) => setForm({ ...form, branch: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <option value="all">
                          {isEn ? "All Branches / General Inquiry" : "Tất cả chi nhánh / Yêu cầu chung"}
                        </option>
                        {hotels.map((h) => (
                          <option key={h.slug} value={h.name}>
                            {h.name} ({h.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      {isEn ? "Subject" : "Tiêu đề yêu cầu"}
                    </label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder={isEn ? "e.g. Booking assistance, Group booking discount" : "Ví dụ: Đặt phòng đoàn, Hợp tác sự kiện, Góp ý dịch vụ..."}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      {isEn ? "Message Content *" : "Nội dung tin nhắn *"}
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder={isEn ? "Please provide details about your inquiry..." : "Vui lòng mô tả chi tiết thắc mắc hoặc yêu cầu của quý khách..."}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-primary hover:bg-primary/90 text-xs font-semibold py-2.5 shadow-sm"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? (isEn ? "Sending..." : "Đang gửi...") : (isEn ? "Send Message" : "Gửi thông tin liên hệ")}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================= DIRECTORY OF 7 BRANCHES ================= */}
      <section className="bg-secondary/40 py-16 border-t border-border/60">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "Branch Directory" : "Danh bạ chi nhánh"}
            </span>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-primary">
              {isEn ? "Direct Contact for 7 Hotels" : "Hotline & Địa Chỉ Trực Tiếp 7 Chi Nhánh"}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              {isEn
                ? "Contact your preferred destination directly for local arrangements, concierge, or dining reservations."
                : "Quý khách có thể gọi trực tiếp tới quầy lễ tân chi nhánh để được đón tiếp nhanh nhất."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branchContacts.map((b, idx) => (
              <div 
                key={idx} 
                className="rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gold shrink-0" />
                  <h3 className="font-display text-base font-bold text-primary">
                    {b.name}
                  </h3>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${b.phone.replace(/[^0-9+]/g, '')}`} className="font-semibold text-primary hover:underline font-mono">
                      {b.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${b.email}`} className="text-primary hover:underline">
                      {b.email}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
