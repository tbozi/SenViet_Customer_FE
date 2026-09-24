import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  Check,
  Clock3,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Star,
  Users,
  Wifi,
} from "lucide-react";
import HotelCard from "@/components/HotelCard";
import { formatVnd, hotels, hotelSlugToId } from "@/data/hotels";
import { rooms as fallbackRooms, type RoomType } from "@/data/rooms";
import { fetchRoomsByHotel } from "@/services/roomApi";
import { fetchHotelReviews, type HotelReviewSummary } from "@/services/reviewApi";

const fallbackGallery = [
  "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop",
];

const today = new Date();
const dateValue = (date: Date) => date.toISOString().slice(0, 10);
const nextDay = new Date(today.getTime() + 86400000);

const regionLabels = {
  north: "miền Bắc",
  central: "miền Trung",
  south: "miền Nam",
} as const;

const propertyHighlights = [
  { label: "Lễ tân", value: "Hỗ trợ 24/7", icon: Clock3 },
  { label: "WiFi", value: "Miễn phí toàn khu", icon: Wifi },
  { label: "Bãi đỗ xe", value: "Có sẵn tại khách sạn", icon: Car },
  { label: "Nhận phòng", value: "Từ 14:00", icon: CalendarDays },
  { label: "Trả phòng", value: "Trước 12:00", icon: Clock3 },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-primary md:text-4xl">{title}</h2>
      {description && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}

export default function HotelDetails() {
  const { slug } = useParams();
  const hotel = hotels.find((item) => item.slug === slug);
  const [selectedImage, setSelectedImage] = useState(0);
  const [checkIn, setCheckIn] = useState(dateValue(today));
  const [checkOut, setCheckOut] = useState(dateValue(nextDay));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [roomsCount, setRoomsCount] = useState(1);
  const [promo, setPromo] = useState("");

  const [roomList, setRoomList] = useState<RoomType[]>(fallbackRooms);

  useEffect(() => {
    let isMounted = true;
    if (slug) {
      fetchRoomsByHotel(slug).then((rooms) => {
        if (isMounted && rooms && rooms.length > 0) {
          setRoomList(rooms);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const [reviewSummary, setReviewSummary] = useState<HotelReviewSummary | null>(null);
  const [starFilter, setStarFilter] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const hotelId = (hotel as any)?.id || (slug ? hotelSlugToId[slug] : undefined) || 1;
    fetchHotelReviews(hotelId).then((res) => {
      if (isMounted && res) {
        setReviewSummary(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug, hotel]);

  const galleryImages = useMemo(() => Array.from(new Set([hotel?.image, ...fallbackGallery].filter(Boolean) as string[])), [hotel?.image]);
  const sortedRooms = useMemo(() => [...roomList].sort((a, b) => a.price - b.price), [roomList]);
  const filteredReviews = useMemo(() => {
    if (!reviewSummary?.reviews) return [];
    if (starFilter === 0) return reviewSummary.reviews;
    return reviewSummary.reviews.filter((r) => r.rating === starFilter);
  }, [reviewSummary, starFilter]);

  if (!hotel) {
    return (
      <main className="container flex min-h-[60vh] items-center justify-center py-16">
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt Hotels & Resorts</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-primary">Không tìm thấy khách sạn</h1>
          <p className="mt-4 text-muted-foreground">Địa chỉ bạn truy cập không còn tồn tại hoặc khách sạn chưa được cập nhật.</p>
          <Link to="/hotels" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            <ArrowLeft className="h-4 w-4" /> Xem danh sách khách sạn
          </Link>
        </div>
      </main>
    );
  }

  const bookingQuery = new URLSearchParams({
    checkIn,
    checkOut,
    adults: String(adults),
    children: String(children),
    rooms: String(roomsCount),
    promo,
  }).toString();
  const bookingHref = `/hotels/${hotel.slug}?${bookingQuery}`;
  const similarHotels = hotels.filter((item) => item.slug !== hotel.slug).slice(0, 3);
  const allAmenities = Array.from(new Set([...hotel.amenities.filter((amenity) => !/bữa sáng|ăn sáng|buffet/i.test(amenity)), "Lễ tân 24/7", "WiFi miễn phí", "Bãi đỗ xe", "Không bao gồm ăn uống"]));

  return (
    <main className="container py-8 pb-16 md:py-12">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link to="/hotels" className="transition hover:text-primary">Khách sạn</Link>
        <span>/</span>
        <span className="text-primary">{hotel.name}</span>
      </nav>
      <Link to="/hotels" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách khách sạn
      </Link>

      <section className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="relative h-[300px] sm:h-[420px] lg:h-[500px]">
              <img src={galleryImages[selectedImage]} alt={`${hotel.name} - ảnh ${selectedImage + 1}`} className="h-full w-full object-cover" />
              <div className="absolute bottom-5 left-5 rounded-full bg-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground backdrop-blur">Sen Việt Collection</div>
              <div className="absolute bottom-5 right-5 flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-sm font-bold text-primary shadow-sm"><Star className="h-4 w-4 fill-gold text-gold" /> {hotel.rating} / 5</div>
            </div>
            <div className="grid grid-cols-4 gap-2 bg-white p-2 sm:gap-3 sm:p-3">
              {galleryImages.map((image, index) => (
                <button key={image} type="button" onClick={() => setSelectedImage(index)} className={`relative h-20 overflow-hidden rounded-xl sm:h-24 ${selectedImage === index ? "ring-2 ring-primary ring-offset-2" : "opacity-75 transition hover:opacity-100"}`} aria-label={`Xem ảnh ${index + 1}`}>
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><MapPin className="h-4 w-4 text-gold" /> {hotel.city}, {hotel.province}</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-primary md:text-5xl">{hotel.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-semibold text-primary"><Star className="h-4 w-4 fill-gold text-gold" /> {hotel.rating} đánh giá</span><span className="rounded-full border border-border px-3 py-1.5 text-muted-foreground">Khách sạn {regionLabels[hotel.region]}</span></div>
            <p className="mt-6 text-base leading-8 text-muted-foreground">{hotel.description}</p>
            <div className="mt-5 rounded-2xl border-l-4 border-gold bg-secondary/60 p-5"><div className="flex items-start gap-3"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-semibold text-primary">Một điểm đến trong hệ thống Sen Việt</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{hotel.name} mang tinh thần hiếu khách của Sen Việt Hotels & Resorts, kết hợp nét riêng của {hotel.city} với dịch vụ nhất quán và sự chăm sóc tận tâm.</p></div></div></div>
          </div>
        </div>

        <aside className="rounded-3xl border border-primary/15 bg-white p-5 shadow-xl shadow-primary/10 sm:p-6 lg:sticky lg:top-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.12em] text-gold">Đặt phòng trực tiếp</p><h2 className="mt-2 font-display text-2xl font-bold text-primary">Bắt đầu kỳ nghỉ</h2></div><CalendarDays className="h-7 w-7 text-primary" /></div>
          <p className="mt-3 text-sm text-muted-foreground">Giá tốt nhất từ Sen Việt, minh bạch và không bao gồm ăn uống.</p>
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-primary">Nhận phòng<input type="date" min={dateValue(today)} value={checkIn} onChange={(event) => { const next = event.target.value; setCheckIn(next); if (checkOut <= next) { const following = new Date(`${next}T12:00:00`); following.setDate(following.getDate() + 1); setCheckOut(dateValue(following)); } }} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
            <label className="block text-sm font-semibold text-primary">Trả phòng<input type="date" min={checkIn} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-primary">Người lớn<select value={adults} onChange={(event) => setAdults(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"><option value={1}>1 người</option><option value={2}>2 người</option><option value={3}>3 người</option><option value={4}>4 người</option><option value={5}>5 người</option><option value={6}>6 người</option></select></label>
              <label className="block text-sm font-semibold text-primary">Trẻ em<select value={children} onChange={(event) => setChildren(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"><option value={0}>0 trẻ</option><option value={1}>1 trẻ</option><option value={2}>2 trẻ</option><option value={3}>3 trẻ</option><option value={4}>4 trẻ</option></select></label>
              <label className="block text-sm font-semibold text-primary">Phòng<select value={roomsCount} onChange={(event) => setRoomsCount(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"><option value={1}>1 phòng</option><option value={2}>2 phòng</option><option value={3}>3 phòng</option><option value={4}>4 phòng</option></select></label>
            </div>
            <label className="block text-sm font-semibold text-primary">Mã khuyến mãi<input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="Nhập mã nếu có" className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 font-normal uppercase outline-none focus:border-primary" /></label>
          </div>
          <div className="mt-6 flex items-end justify-between border-t border-border pt-5"><div><p className="text-xs text-muted-foreground">Giá phòng từ</p><p className="mt-1 text-2xl font-bold text-primary">{formatVnd(sortedRooms[0]?.price || hotel.price)}<span className="text-xs font-normal text-muted-foreground"> / đêm</span></p></div><span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><ShieldCheck className="h-4 w-4 text-gold" /> Giá cố định</span></div>
          <Link to={bookingHref} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90">Tìm phòng trống <ArrowRight className="h-4 w-4" /></Link>
          <Link to="#rooms" className="mt-4 flex items-center justify-center text-sm font-semibold text-primary underline decoration-gold decoration-2 underline-offset-4">Xem các loại phòng</Link>
        </aside>
      </section>

      <section className="mt-12">
        <SectionHeading eyebrow="Tiện nghi & dịch vụ" title="Mọi điều bạn cần cho kỳ lưu trú" description="Các tiện nghi được chuẩn bị chu đáo để bạn nghỉ ngơi thoải mái, làm việc hiệu quả và tận hưởng điểm đến." />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {allAmenities.map((amenity) => <div key={amenity} className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 text-sm font-medium text-primary shadow-sm"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Check className="h-4 w-4" /></span>{amenity}</div>)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {propertyHighlights.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-border bg-card p-4"><Icon className="h-5 w-5 text-gold" /><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-primary">{value}</p></div>)}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-8"><SectionHeading eyebrow="Thông tin cần biết" title="Chính sách khách sạn" /><div className="mt-7 space-y-5"><div className="flex gap-4"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-gold" /><div><p className="font-semibold text-primary">Giờ nhận và trả phòng</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Nhận phòng từ 14:00 · Trả phòng trước 12:00. Vui lòng liên hệ lễ tân nếu bạn cần hỗ trợ giờ linh hoạt.</p></div></div><div className="flex gap-4"><Users className="mt-0.5 h-5 w-5 shrink-0 text-gold" /><div><p className="font-semibold text-primary">Lưu trú cùng gia đình</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Trẻ em được chào đón. Sức chứa cụ thể và phụ thu (nếu có) sẽ hiển thị ở bước chọn phòng.</p></div></div><div className="flex gap-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" /><div><p className="font-semibold text-primary">Đặt phòng minh bạch</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Giá phòng là giá cố định theo đêm và không bao gồm ăn uống. Chính sách hủy sẽ được xác nhận trước khi hoàn tất.</p></div></div></div></div>
        <div className="rounded-3xl border border-border bg-primary p-6 text-primary-foreground sm:p-8"><p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Liên hệ & vị trí</p><h2 className="mt-2 font-display text-3xl font-bold">Luôn có người hỗ trợ bạn</h2><p className="mt-3 text-sm leading-relaxed text-primary-foreground/75">Đội ngũ Sen Việt sẵn sàng tư vấn hành trình, đặt phòng và các nhu cầu trong thời gian lưu trú.</p><div className="mt-6 space-y-4 text-sm"><a href="tel:+842873012345" className="flex items-center gap-3 transition hover:text-gold"><Phone className="h-4 w-4 text-gold" /> +84 28 7301 2345</a><a href="mailto:booking@senviet.vn" className="flex items-center gap-3 transition hover:text-gold"><Mail className="h-4 w-4 text-gold" /> booking@senviet.vn</a><p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> Trung tâm {hotel.city}, {hotel.province}</p></div><div className="relative mt-7 h-40 overflow-hidden rounded-2xl border border-white/15 bg-[#16589a]" aria-label={`Bản đồ minh họa vị trí ${hotel.name}`}><div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(28deg, transparent 46%, #cfe5ff 47%, #cfe5ff 49%, transparent 50%), linear-gradient(112deg, transparent 43%, #cfe5ff 44%, #cfe5ff 46%, transparent 47%), linear-gradient(0deg, transparent 69%, #cfe5ff 70%, #cfe5ff 72%, transparent 73%)", backgroundSize: "140px 110px, 180px 130px, 100% 80px" }} /><div className="absolute left-[48%] top-[40%] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gold text-primary shadow-lg"><Navigation className="h-5 w-5 fill-primary" /></div><div className="absolute bottom-3 left-3 rounded-lg bg-primary/80 px-3 py-1.5 text-xs font-semibold backdrop-blur">Vị trí trung tâm {hotel.city}</div></div></div>
      </section>

      <section id="rooms" className="mt-16 scroll-mt-6"><SectionHeading eyebrow="Sen Việt rooms" title="Chọn căn phòng phù hợp" description="Bốn hạng phòng hiện có, sắp xếp theo giá từ thấp đến cao. Không bao gồm ăn uống." /><div className="mt-7 space-y-5">
        {sortedRooms.map((room) => <article key={room.id} className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm transition hover:shadow-md"><div className="grid md:grid-cols-[230px_minmax(0,1fr)_190px]"><img src={room.image} alt={room.nameVi} className="h-56 w-full object-cover md:h-full" /><div className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-gold">{room.name}</p><h3 className="mt-1 font-display text-2xl font-bold text-primary">{room.nameVi}</h3></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">Không bao gồm ăn uống</span></div><div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2"><p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gold" /> Tòa {room.building} · Tầng {room.floor}</p><p className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-gold" /> {room.bedsVi}</p><p className="flex items-center gap-2"><Navigation className="h-4 w-4 text-gold" /> {room.size}</p><p className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> {room.capacity.adults} người lớn · {room.capacity.children} trẻ em</p></div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{room.description}</p><p className="mt-4 text-xs text-muted-foreground">Mã phòng mẫu: <span className="font-semibold text-primary">{room.roomCodes.slice(0, 2).join(", ")}</span></p></div><div className="flex flex-col justify-between border-t border-border bg-secondary/40 p-5 md:border-l md:border-t-0"><div><p className="text-xs text-muted-foreground">Giá từ / đêm</p><p className="mt-1 text-2xl font-bold text-primary">{formatVnd(room.price)}</p><p className="mt-1 text-xs text-muted-foreground">Còn {room.inventory} phòng mẫu</p></div><Link to={`/hotels/${hotel.slug}?${new URLSearchParams({ checkIn, checkOut, adults: String(adults), children: "0", rooms: "1", room: room.id }).toString()}`} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90">Chọn phòng <ArrowRight className="h-4 w-4" /></Link></div></div></article>)}
      </div></section>

      {/* ====== Khối Đánh giá từ khách hàng ====== */}
      <section id="reviews" className="mt-16 scroll-mt-6 border-t border-border pt-12">
        <SectionHeading
          eyebrow="Xếp hạng & Đánh giá"
          title="Đánh giá chất lượng dịch vụ"
          description="Điểm xếp hạng sao từ du khách sau khi hoàn tất thủ tục trả phòng tại Sen Việt."
        />

        {reviewSummary && (
          <div className="mt-8 grid gap-8 lg:grid-cols-[340px_1fr]">
            {/* Cột trái: Thống kê điểm số và tiêu chí */}
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl font-extrabold text-primary">
                  {reviewSummary.averageRating}
                </span>
                <div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= Math.round(reviewSummary.averageRating)
                            ? "fill-gold text-gold"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">
                    Dựa trên {reviewSummary.totalReviews} đánh giá đã xác thực
                  </p>
                </div>
              </div>

              {/* 4 Thước đo tiêu chí */}
              <div className="mt-6 space-y-3.5 border-t border-border pt-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-primary">
                    <span>Vệ sinh & Sạch sẽ</span>
                    <span className="text-gold font-bold">{reviewSummary.avgCleanliness} / 5</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(reviewSummary.avgCleanliness / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-primary">
                    <span>Thái độ & Phục vụ</span>
                    <span className="text-gold font-bold">{reviewSummary.avgService} / 5</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(reviewSummary.avgService / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-primary">
                    <span>Tiện nghi phòng nghỉ</span>
                    <span className="text-gold font-bold">{reviewSummary.avgFacilities} / 5</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(reviewSummary.avgFacilities / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-primary">
                    <span>Vị trí & Cảnh quan</span>
                    <span className="text-gold font-bold">{reviewSummary.avgLocation} / 5</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(reviewSummary.avgLocation / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lọc theo số sao */}
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lọc theo số sao</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStarFilter(0)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      starFilter === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary hover:bg-secondary/80"
                    }`}
                  >
                    Tất cả ({reviewSummary.totalReviews})
                  </button>
                  {[5, 4, 3].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarFilter(star)}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        starFilter === star
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-primary hover:bg-secondary/80"
                      }`}
                    >
                      {star} <Star className="h-3 w-3 fill-gold text-gold" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cột phải: Danh sách nhận xét của khách hàng */}
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
                  Chưa có đánh giá nào cho mức lọc này.
                </div>
              ) : (
                filteredReviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="rounded-3xl border border-border bg-white p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-base font-bold text-primary">{rev.customerName}</h4>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            <ShieldCheck className="h-3.5 w-3.5" /> Đã xác thực kỳ nghỉ
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {rev.roomTypeName || "Phòng nghỉ Sen Việt"} · {rev.createdAt}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${
                              s <= rev.rating ? "fill-gold text-gold" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.title && (
                      <h5 className="mt-3 font-semibold text-primary">{rev.title}</h5>
                    )}

                    {rev.comment && rev.comment.trim().length > 0 && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {rev.comment}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      <section className="mt-16 border-t border-border pt-12"><SectionHeading eyebrow="Bạn có thể thích" title="Khám phá thêm Sen Việt" description="Những điểm đến khác trong cùng hệ thống, mỗi nơi mang một sắc thái riêng của Việt Nam." /><div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{similarHotels.map((item) => <HotelCard hotel={item} key={item.slug} />)}</div><Link to="/hotels" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-gold">Xem toàn bộ hệ thống <ArrowRight className="h-4 w-4" /></Link></section>
    </main>
  );
}
