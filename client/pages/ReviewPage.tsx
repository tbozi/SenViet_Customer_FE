import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBookings } from "@/lib/bookings";
import { saveReview } from "@/lib/customer";
import { useAuth } from "@/lib/auth";
import { submitReview } from "@/services/reviewApi";

const ratingLabels: Record<number, string> = {
  1: "1 sao — Rất thất vọng",
  2: "2 sao — Chưa hài lòng",
  3: "3 sao — Tạm được",
  4: "4 sao — Hài lòng",
  5: "5 sao — Tuyệt hảo",
};

export default function ReviewPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tìm booking từ danh sách cục bộ hoặc tạo thông tin hiển thị
  const localBooking = getBookings().find(
    (item) => String(item.id) === String(bookingId) && (!user || item.userEmail === user?.email)
  );

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // 4 Tiêu chí con 5 sao
  const [cleanliness, setCleanliness] = useState<number>(5);
  const [service, setService] = useState<number>(5);
  const [facilities, setFacilities] = useState<number>(5);
  const [location, setLocation] = useState<number>(5);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [sent, setSent] = useState<boolean>(false);

  // Thông tin tóm tắt đơn phòng
  const hotelName = localBooking?.hotelName || "Sen Việt Hotels & Resorts";
  const roomName = localBooking?.roomName || "Phòng nghỉ tiêu chuẩn";
  const checkIn = localBooking?.checkIn || "Gần đây";
  const checkOut = localBooking?.checkOut || "Hôm nay";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Gửi lên API Backend (chỉ gửi đánh giá sao, không bình luận)
      const numericBookingId = Number(bookingId) || 505;
      await submitReview({
        bookingId: numericBookingId,
        rating,
        cleanlinessRating: cleanliness,
        serviceRating: service,
        facilitiesRating: facilities,
        locationRating: location,
        comment: "",
      }).catch((apiErr) => {
        console.warn("Backend API not reachable or errored, saving locally:", apiErr);
      });

      // 2. Lưu vào localStorage để hỗ trợ demo offline
      saveReview({
        id: `REV-${Date.now()}`,
        bookingId: String(bookingId),
        userEmail: user?.email || "",
        hotelSlug: localBooking?.hotelSlug || "sen-viet-sai-gon",
        rating,
        comment: "",
        createdAt: new Date().toISOString(),
        status: "published",
      });

      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Không thể gửi đánh giá lúc này");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-inner">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-primary">Cảm ơn bạn đã đánh giá kỳ nghỉ!</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Đánh giá sao của bạn đã được ghi nhận vào hệ thống Sen Việt Hotels & Resorts để phục vụ nâng cao chất lượng dịch vụ.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button onClick={() => navigate("/bookings")} className="rounded-xl px-6">
            Về lịch sử đặt phòng
          </Button>
          <Button variant="outline" onClick={() => navigate("/hotels")} className="rounded-xl px-6">
            Khám phá khách sạn khác
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Nút quay lại */}
        <Link
          to="/bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách đặt phòng
        </Link>

        {/* Header trang */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-gold">Đánh giá kỳ nghỉ</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">Chấm điểm chất lượng dịch vụ</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Chỉ với 1 chạm đánh giá số sao, giúp Sen Việt hoàn thiện chất lượng phục vụ ngày một tốt hơn.
          </p>
        </div>

        {/* Thẻ tóm tắt đơn phòng */}
        <div className="mt-6 flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Sparkles className="h-6 w-6 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-primary">{hotelName}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Đã hoàn tất check-out
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {roomName} · Lưu trú: {checkIn} → {checkOut}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Mã đơn phòng: #{bookingId}</p>
          </div>
        </div>

        {/* Form đánh giá sao (không cần bình luận) */}
        <form onSubmit={submit} className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
          {/* Mục 1: Điểm sao tổng quan */}
          <div>
            <label className="block font-display text-lg font-bold text-primary">
              1. Điểm đánh giá tổng quan kỳ nghỉ <span className="text-destructive">*</span>
            </label>
            <p className="mt-1 text-xs text-muted-foreground">Chọn số sao đại diện cho mức độ hài lòng của bạn</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const active = (hoverRating || rating) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition hover:scale-110 focus:outline-none"
                    aria-label={`${starVal} sao`}
                  >
                    <Star
                      className={`h-10 w-10 sm:h-12 sm:w-12 transition ${
                        active ? "fill-gold text-gold" : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 font-display text-lg font-bold text-primary">
                {ratingLabels[hoverRating || rating]}
              </span>
            </div>
          </div>

          <hr className="my-8 border-border" />

          {/* Mục 2: 4 Tiêu chí chi tiết */}
          <div>
            <label className="block font-display text-lg font-bold text-primary">
              2. Đánh giá nhanh theo từng tiêu chí
            </label>
            <p className="mt-1 text-xs text-muted-foreground">Chấm điểm từ 1 đến 5 sao cho từng hạng mục</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {/* Tiêu chí 1: Sạch sẽ */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">Vệ sinh & Sạch sẽ</span>
                  <span className="text-xs font-bold text-gold">{cleanliness}/5 sao</span>
                </div>
                <div className="mt-2.5 flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCleanliness(val)}
                      className="p-0.5 transition hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          val <= cleanliness ? "fill-gold text-gold" : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiêu chí 2: Dịch vụ */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">Thái độ & Dịch vụ</span>
                  <span className="text-xs font-bold text-gold">{service}/5 sao</span>
                </div>
                <div className="mt-2.5 flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setService(val)}
                      className="p-0.5 transition hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${val <= service ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiêu chí 3: Tiện nghi */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">Tiện nghi phòng nghỉ</span>
                  <span className="text-xs font-bold text-gold">{facilities}/5 sao</span>
                </div>
                <div className="mt-2.5 flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFacilities(val)}
                      className="p-0.5 transition hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${val <= facilities ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiêu chí 4: Vị trí */}
              <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-primary">Vị trí & Cảnh quan</span>
                  <span className="text-xs font-bold text-gold">{location}/5 sao</span>
                </div>
                <div className="mt-2.5 flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setLocation(val)}
                      className="p-0.5 transition hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${val <= location ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          {/* Nút gửi đánh giá sao */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/bookings")}
              className="rounded-xl px-6"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary px-8 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              {loading ? "Đang gửi..." : "Hoàn tất đánh giá sao"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
