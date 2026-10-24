import { Link } from "react-router-dom";
import { 
  Award, 
  CheckCircle2, 
  HeartHandshake, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Star 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { hotels } from "@/data/hotels";
import { useLanguage } from "@/lib/i18n";
import { openChatWidget } from "@/components/ChatWidget";

export default function AboutPage() {
  const { language } = useLanguage();
  const isEn = language === "en";

  const coreValues = [
    {
      icon: HeartHandshake,
      title: isEn ? "Hospitality from the Heart" : "Hiếu khách từ tâm",
      desc: isEn 
        ? "Every guest is welcomed as family, treated with gentle grace and utmost devotion."
        : "Đón tiếp bằng sự chân thành, chăm sóc bằng sự tận tụy như người thân trong gia đình.",
    },
    {
      icon: Award,
      title: isEn ? "Five-Star Heritage" : "Đẳng cấp di sản 5 sao",
      desc: isEn
        ? "Harmonizing Vietnamese architectural soul with world-class international hospitality standards."
        : "Giao hòa trọn vẹn giữa hồn cốt kiến trúc Việt và tiêu chuẩn dịch vụ lưu trú quốc tế.",
    },
    {
      icon: Sparkles,
      title: isEn ? "Pioneering AI Technology" : "Tiên phong công nghệ AI",
      desc: isEn
        ? "24/7 intelligent AI concierge seamlessly assisting bookings, personalization, and 24/7 support."
        : "Trợ lý ảo AI thông minh 24/7 tư vấn thông minh, cá nhân hóa kỳ nghỉ và hỗ trợ tức thì.",
    },
    {
      icon: ShieldCheck,
      title: isEn ? "Sustainable Luxury" : "Phát triển bền vững",
      desc: isEn
        ? "Preserving local eco-systems, honoring indigenous cultures, and delivering eco-friendly stays."
        : "Gìn giữ môi trường sinh thái địa phương, tôn vinh văn hóa bản địa qua từng trải nghiệm.",
    },
  ];

  const milestones = [
    {
      year: "2018",
      title: isEn ? "The Inception of Lotus Spirit" : "Khởi nguồn tinh hoa hoa sen",
      desc: isEn 
        ? "Established with the aspiration to elevate Vietnamese hospitality to international prominence."
        : "Thành lập với khát vọng nâng tầm dịch vụ khách sạn mang bản sắc văn hóa Việt Nam ra thế giới.",
    },
    {
      year: "2020 - 2022",
      title: isEn ? "Expansion Across 3 Regions" : "Mở rộng 3 miền Bắc - Trung - Nam",
      desc: isEn
        ? "Expanding luxury destinations to Hanoi, Da Nang, Nha Trang, Da Lat, Tien Giang, and Binh Dinh."
        : "Liên tục hiện diện tại các thành phố du lịch hàng đầu: Hà Nội, Đà Nẵng, Nha Trang, Đà Lạt...",
    },
    {
      year: "2024 - Nay",
      title: isEn ? "Digital Transformation & AI Concierge" : "Số hóa toàn diện & Chuỗi 7 khách sạn",
      desc: isEn
        ? "Complete nationwide network of 7 flagship hotels, powered by 24/7 AI-driven guest experiences."
        : "Hoàn thiện chuỗi 7 khách sạn đẳng cấp cùng nền tảng quản trị thông minh và Trợ lý AI 24/7.",
    },
  ];

  return (
    <main className="bg-background text-foreground">
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden bg-primary py-24 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--gold)/.25),transparent_40%),linear-gradient(180deg,hsl(var(--primary))_0%,hsl(var(--primary)/.95)_100%)]" />
        <img loading="lazy" decoding="async"
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop"
          alt="Sen Viet Hotels & Resorts"
          className="absolute inset-0 -z-0 h-full w-full object-cover opacity-25"
        />
        
        <div className="container relative z-10 text-center max-w-3xl px-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-gold backdrop-blur mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {isEn ? "About Sen Viet Hotels & Resorts" : "Về Sen Việt Hotels & Resorts"}
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            {isEn ? "A Symphony of Vietnamese Grace & Luxury" : "Bản Giao Hưởng Của Bản Sắc & Nghỉ Dưỡng Thượng Lưu"}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-primary-foreground/85 leading-relaxed font-light">
            {isEn
              ? "Inspired by the pure elegance of the sacred Lotus, Sen Việt curates unforgettable stays where ancient Vietnamese warmth meets modern five-star sophistication."
              : "Lấy cảm hứng từ nét đẹp thanh cao, tinh khiết của quốc hoa Sen, Sen Việt Hotels & Resorts tự hào kiến tạo những không gian lưu trú sang trọng, nơi văn hóa truyền thống thăng hoa cùng tiện nghi đẳng cấp thế giới."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-full bg-gold px-8 font-semibold text-gold-foreground hover:bg-gold/90">
              <Link to="/hotels">
                {isEn ? "Explore 7 Hotels" : "Khám phá 7 Khách sạn"}
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={openChatWidget}
              className="rounded-full border-primary-foreground/40 bg-transparent px-8 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Sparkles className="mr-2 h-4 w-4 text-gold" />
              {isEn ? "Ask AI Concierge" : "Tư vấn cùng AI"}
            </Button>
          </div>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section className="border-y border-border/60 bg-secondary/40 py-10">
        <div className="container px-4">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-center">
            <div className="space-y-1">
              <div className="font-display text-3xl sm:text-4xl font-bold text-primary">07</div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {isEn ? "Hotels & Resorts" : "Khách sạn & Khu nghỉ"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-display text-3xl sm:text-4xl font-bold text-primary">07</div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {isEn ? "Prime Destinations" : "Tỉnh thành trọng điểm"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-display text-3xl sm:text-4xl font-bold text-gold">98%</div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {isEn ? "Guest Satisfaction" : "Khách hàng hài lòng"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-display text-3xl sm:text-4xl font-bold text-primary">24/7</div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {isEn ? "AI Support & Concierge" : "Hỗ trợ AI đa ngôn ngữ"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STORY & PHILOSOPHY ================= */}
      <section className="container py-20 px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "Our Heritage Story" : "Câu chuyện thương hiệu"}
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-primary leading-snug">
              {isEn ? "Grounded in Vietnamese Soil, Reaching for Global Stars" : "Vươn mình từ đất mẹ, tỏa sáng nét đẹp Á Đông"}
            </h2>
            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
              <p>
                {isEn
                  ? "Sen Việt was born from a deep love for Vietnam's breathtaking landscapes and timeless hospitality traditions. Just like the lotus blossom rising above water to unfurl pristine petals, our mission is to deliver pure, uplifting and memorable hospitality moments."
                  : "Sen Việt khởi nguồn từ niềm tự hào sâu sắc với cảnh sắc gấm hoa và tấm lòng hiếu khách chân phương của người Việt. Tựa như đóa sen tinh khôi vươn mình đón nắng sớm, Sen Việt mang trọn tinh hoa của sự thanh lịch, tôn quý và chân thành vào từng trải nghiệm lưu trú."}
              </p>
              <p>
                {isEn
                  ? "Across each of our 7 properties in Saigon, Hanoi, Da Nang, Nha Trang, Da Lat, Tien Giang, and Binh Dinh, we seamlessly weave architectural motifs of each locality with bespoke service, creating a tranquil oasis for travelers from around the globe."
                  : "Từ nhịp sống phồn hoa tại Quận 1 Sài Gòn, vẻ thâm trầm cổ kính bên Hồ Gươm Hà Nội, làn gió mát lành từ biển Mỹ Khê Đà Nẵng đến rừng thông thơ mộng Đà Lạt hay nét mộc mạc hữu tình của miền Tây sông nước... mỗi khách sạn Sen Việt là một dấu ấn kiến trúc độc bản tôn vinh vùng đất ấy."}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {[
                isEn ? "Tailored personalized experiences for every guest" : "Trải nghiệm cá nhân hóa tinh tế đến từng chi tiết",
                isEn ? "Fresh local culinary masterpieces & spa botanicals" : "Ẩm thực bản địa trứ danh & liệu trình spa thảo mộc độc quyền",
                isEn ? "Integrated 24/7 AI concierge for seamless booking" : "Tích hợp trợ lý AI thông minh đồng hành xuyên suốt kỳ nghỉ",
              ].map((point, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-gold" />
                  <span className="text-sm font-medium text-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
              <img loading="lazy" decoding="async"
                src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop"
                alt="Sen Viet interior luxury"
                className="h-[450px] w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-card border border-border p-5 shadow-lg hidden sm:block max-w-[240px]">
              <div className="flex items-center gap-1 text-gold mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold" />
                ))}
              </div>
              <p className="text-xs font-bold text-foreground">
                {isEn ? "Top Rated Luxury Chain" : "Chuỗi Khách Sạn Được Yêu Thích"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isEn ? "Recognized for excellence across 7 provinces" : "Khẳng định chất lượng hàng đầu tại 7 tỉnh thành"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE VALUES ================= */}
      <section className="bg-secondary/40 py-20">
        <div className="container px-4">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "Our Foundations" : "Giá trị cốt lõi"}
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-primary">
              {isEn ? "The Pillars of Sen Việt" : "Bốn Trụ Cột Tinh Hoa Của Sen Việt"}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {isEn 
                ? "Guiding principles that shape every greeting, every room detail, and every unforgettable journey."
                : "Kim chỉ nam định hình mọi nụ cười chào đón, từng tiện nghi buồng phòng và từng kỷ niệm trọn vẹn của quý khách."}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-gold transition group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-primary font-display">
                    {val.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {val.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= SYSTEM OF 7 HOTELS ================= */}
      <section className="container py-20 px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "Nationwide Presence" : "Mạng lưới lưu trú"}
            </span>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-primary">
              {isEn ? "System of 7 Flagship Hotels" : "Hệ Thống 7 Khách Sạn & Resort"}
            </h2>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/hotels">
              {isEn ? "View All Hotel Details" : "Xem tất cả phòng & giá"}
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <div 
              key={hotel.slug}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:shadow-lg transition"
            >
              <div className="relative h-48 overflow-hidden">
                <img loading="lazy" decoding="async" 
                  src={hotel.image} 
                  alt={hotel.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-white flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gold" />
                  {hotel.province}
                </div>
                <div className="absolute bottom-3 right-3 rounded-lg bg-primary/90 text-primary-foreground px-2 py-0.5 text-xs font-bold font-mono">
                  {isEn ? `Rating ${hotel.rating}` : `Đánh giá ${hotel.rating} ★`}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-primary group-hover:text-gold transition">
                  {hotel.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {hotel.city}
                </p>
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {isEn ? hotel.descriptionEn : hotel.description}
                </p>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <Link 
                    to={`/hotels/${hotel.slug}`}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {isEn ? "View Rooms & Book →" : "Chọn phòng & Đặt ngay →"}
                  </Link>
                  <Link 
                    to={`/hotels/${hotel.slug}/details`}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isEn ? "Details" : "Chi tiết"}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= TIMELINE ================= */}
      <section className="bg-secondary/40 py-20 border-t border-border/60">
        <div className="container px-4 max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-gold">
              {isEn ? "Our Journey" : "Hành trình phát triển"}
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary">
              {isEn ? "Milestones of Excellence" : "Các Cột Mốc Đáng Tự Hào"}
            </h2>
          </div>

          <div className="relative border-l-2 border-primary/30 pl-6 sm:pl-8 space-y-10 ml-4">
            {milestones.map((m, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold ring-4 ring-background">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div>
                  <span className="inline-block rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold font-mono text-primary">
                    {m.year}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-foreground">
                    {m.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CALL TO ACTION ================= */}
      <section className="container py-20 px-4">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center sm:px-16 text-primary-foreground">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <Sparkles className="mx-auto h-8 w-8 text-gold" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              {isEn ? "Ready for an Unforgettable Stay?" : "Sẵn Sàng Cho Kỳ Nghỉ Đáng Nhớ Cùng Sen Việt?"}
            </h2>
            <p className="text-sm sm:text-base text-primary-foreground/80 leading-relaxed font-light">
              {isEn
                ? "Let our 24/7 AI Concierge guide you to the perfect room rate, exclusive discounts, and heartwarming hospitality across our 7 destinations."
                : "Hãy để Trợ lý AI và đội ngũ Sen Việt mang đến cho bạn không gian nghỉ dưỡng tuyệt vời, mức giá ưu đãi nhất cùng sự phục vụ chân thành tại 7 tỉnh thành."}
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="rounded-full bg-gold px-8 font-semibold text-gold-foreground hover:bg-gold/90">
                <Link to="/hotels">
                  {isEn ? "Book Your Room" : "Đặt phòng ngay"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/contact">
                  {isEn ? "Contact Us" : "Liên hệ hợp tác"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}