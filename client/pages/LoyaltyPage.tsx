import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Gift, History, Medal, Percent, Sparkles, Star, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getBookings } from "@/lib/bookings";
import { getCustomerPoints } from "@/lib/customer";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axiosInstance";
import { formatVnd } from "@/data/hotels";

const tierLabels: Record<string, { name: string; color: string; badge: string; nextTier?: string; nextSpend: number }> = {
  STANDARD: { name: "Hạng Tiêu Chuẩn (Standard)", color: "text-blue-500", badge: "bg-blue-100 text-blue-800", nextTier: "Hạng Bạc (Silver)", nextSpend: 10000000 },
  SILVER: { name: "Hạng Bạc (Lotus Silver)", color: "text-slate-400", badge: "bg-slate-100 text-slate-800", nextTier: "Hạng Vàng (Gold)", nextSpend: 30000000 },
  GOLD: { name: "Hạng Vàng (Lotus Gold)", color: "text-amber-500", badge: "bg-amber-100 text-amber-800", nextTier: "Hạng Bạch Kim (Platinum)", nextSpend: 60000000 },
  PLATINUM: { name: "Hạng Bạch Kim (Platinum)", color: "text-purple-500", badge: "bg-purple-100 text-purple-800", nextTier: "Hạng Kim Cương (Diamond)", nextSpend: 100000000 },
  DIAMOND: { name: "Hạng Kim Cương (Diamond)", color: "text-emerald-500", badge: "bg-emerald-100 text-emerald-800", nextSpend: 0 },
};

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      axiosInstance
        .get("/customer/me/profile")
        .then((res) => {
          if (res.data?.result) setProfile(res.data.result);
        })
        .catch(() => {});
    }
  }, [user]);

  const bookings = useMemo(
    () => (user ? getBookings().filter((item) => item.userEmail === user.email) : []),
    [user?.email],
  );

  const localSpend = bookings
    .filter((item) => item.status !== "cancelled")
    .reduce((total, item) => total + item.total, 0);

  const totalSpend = profile?.totalSpent ?? localSpend;
  const totalBookings = profile?.totalBookings ?? bookings.length;
  const points = Math.floor(totalSpend / 10000);

  const tierKey = profile?.loyaltyTier || (points >= 5000 ? "GOLD" : points >= 2000 ? "SILVER" : "STANDARD");
  const currentTier = tierLabels[tierKey] || tierLabels.STANDARD;

  const nextSpendTarget = currentTier.nextSpend || 10000000;
  const progressPercent = currentTier.nextSpend
    ? Math.min(100, Math.round((totalSpend / nextSpendTarget) * 100))
    : 100;

  if (!user) {
    return (
      <main className="container flex min-h-[55vh] items-center justify-center py-16">
        <div className="text-center">
          <Medal className="mx-auto h-10 w-10 text-gold" />
          <h1 className="mt-4 font-display text-3xl font-bold text-primary">Đăng nhập để xem Loyalty</h1>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/login">Đăng nhập</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-14">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt Loyalty</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-primary">Đặc quyền dành cho bạn</h1>
            <p className="mt-3 text-muted-foreground">Tích điểm sau mỗi kỳ nghỉ và mở khóa những ưu đãi đặc biệt.</p>
          </div>
          <Link to="/profile" className="text-sm font-semibold text-primary underline">
            Về hồ sơ cá nhân
          </Link>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground sm:p-10">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-gold">
                <Medal className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-[.15em]">Hạng thành viên</span>
              </div>
              <h2 className="mt-3 font-display text-4xl font-bold">{currentTier.name}</h2>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-primary-foreground/80 sm:text-sm">
                <span>{points.toLocaleString("vi-VN")} điểm tích lũy</span>
                <span>•</span>
                <span>Tổng chi tiêu: {formatVnd(totalSpend)}</span>
                <span>•</span>
                <span>{totalBookings} đơn đặt phòng</span>
              </div>
            </div>

            <div className="w-full max-w-sm">
              <div className="flex justify-between text-xs text-primary-foreground/70">
                <span>Tiến độ nâng hạng</span>
                <span>{currentTier.nextTier ? `${formatVnd(nextSpendTarget)}` : "Hạng cao nhất"}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-primary-foreground/70">
                {currentTier.nextTier
                  ? `Còn ${formatVnd(Math.max(0, nextSpendTarget - totalSpend))} để nâng lên ${currentTier.nextTier}`
                  : "Chúc mừng! Bạn đang ở hạng thành viên cao nhất của Sen Việt."}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-border bg-card p-6">
            <Sparkles className="h-6 w-6 text-gold" />
            <h2 className="mt-5 font-display text-xl font-bold text-primary">Tích điểm dễ dàng</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Mỗi 10.000₫ chi tiêu hợp lệ được quy đổi thành 1 điểm Sen Việt tự động lưu vào ví.
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6">
            <Percent className="h-6 w-6 text-primary" />
            <h2 className="mt-5 font-display text-xl font-bold text-primary">Ưu đãi thành viên</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nhận giá phòng riêng theo hạng thẻ, ưu tiên nhận phòng sớm và giảm giá dịch vụ ăn uống.
            </p>
          </article>
          <article className="rounded-2xl border border-border bg-card p-6">
            <Gift className="h-6 w-6 text-gold" />
            <h2 className="mt-5 font-display text-xl font-bold text-primary">Đổi quà nghỉ dưỡng</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Dùng điểm để đổi voucher phòng miễn phí, buffet sáng hoặc liệu trình spa thư giãn.
            </p>
          </article>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-primary">Lịch sử điểm & Đặt phòng</h2>
              <p className="mt-1 text-sm text-muted-foreground">Các giao dịch hợp lệ được ghi nhận trong hệ thống</p>
            </div>
            <History className="h-5 w-5 text-muted-foreground" />
          </div>

          {bookings.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Chưa có giao dịch tích điểm nào. Hãy đặt phòng đầu tiên để nhận điểm thưởng thành viên!
            </p>
          ) : (
            <div className="mt-5 divide-y divide-border">
              {bookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium text-primary">{booking.hotelName}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.checkIn} · Mã: {booking.id}
                    </p>
                  </div>
                  <span className="font-semibold text-emerald-600">
                    +{getCustomerPoints(booking.total)} điểm
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <Button asChild className="mt-8 rounded-full bg-gold text-gold-foreground hover:bg-gold/90">
          <Link to="/offers">
            Xem ưu đãi thành viên <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
