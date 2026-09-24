import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import axiosInstance from "@/lib/axiosInstance";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "");
  const [identityNumber, setIdentityNumber] = useState(user?.identityNumber || "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  if (!user) return null;

  // ============================================================
  // Cập nhật hồ sơ
  // ============================================================
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    setError("");
    setLoading(true);
    const result = await updateProfile({ name, phone, birthDate, identityNumber });
    setLoading(false);
    if (!result.ok) {
      setError(result.error || "Không thể cập nhật hồ sơ");
    } else {
      setSaved(true);
    }
  };

  // ============================================================
  // Đổi mật khẩu
  // ============================================================
  const submitChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMsg("");
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      return setPasswordError("Mật khẩu xác nhận không khớp");
    }
    if (newPassword.length < 6) {
      return setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
    }
    setPasswordLoading(true);
    try {
      const payload = { currentPassword, newPassword, confirmPassword };
      try {
        await axiosInstance.patch("/customer/me/change-password", payload);
      } catch (e: any) {
        if (e.response?.status === 404 || e.response?.data?.message?.includes("No static resource")) {
          await axiosInstance.patch("/users/me/change-password", payload);
        } else {
          throw e;
        }
      }
      setPasswordMsg("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || "Không thể đổi mật khẩu");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <main className="container py-14">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt member</p>
            <h1 className="mt-2 font-display text-4xl font-bold text-primary">{t("profile.title")}</h1>
          </div>
          <Link to="/bookings" className="text-sm font-semibold text-primary underline">
            {t("profile.bookingHistory")}
          </Link>
        </div>

        {/* ====== Form thông tin cá nhân ====== */}
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl font-bold text-primary">{t("profile.personalInfo")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-primary">
              {t("auth.name")}
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input p-3"
              />
            </label>
            <label className="text-sm font-medium text-primary">
              {t("profile.phone")}
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input p-3"
              />
            </label>
            <label className="text-sm font-medium text-primary">
              Ngày sinh
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input p-3"
              />
            </label>
            <label className="text-sm font-medium text-primary">
              CCCD / CMND
              <input
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                className="mt-1 w-full rounded-xl border border-input p-3"
              />
            </label>
            <label className="text-sm font-medium text-primary sm:col-span-2">
              {t("auth.email")}
              <input
                disabled
                value={user.email}
                className="mt-1 w-full rounded-xl border border-input bg-muted p-3 text-muted-foreground"
              />
            </label>
          </div>
          {error && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
          <div className="mt-6 flex items-center gap-4">
            <Button type="submit" className="rounded-xl" disabled={loading}>
              {loading ? "Đang lưu..." : t("profile.save")}
            </Button>
            {saved && <span className="text-sm text-emerald-600">✓ Đã lưu thông tin</span>}
          </div>
        </form>

        {/* ====== Form đổi mật khẩu ====== */}
        <form onSubmit={submitChangePassword} className="mt-5 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold text-primary">Bảo mật tài khoản — Đổi mật khẩu</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-primary">Mật khẩu hiện tại</label>
              <div className="relative mt-1">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-input p-3 pr-11"
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                  aria-label={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary">Mật khẩu mới</label>
              <div className="relative mt-1">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-input p-3 pr-11"
                  placeholder="Ít nhất 6 ký tự"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                  aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary">Xác nhận mật khẩu mới</label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-input p-3 pr-11"
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          {passwordError && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{passwordError}</p>
          )}
          {passwordMsg && (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{passwordMsg}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="submit" variant="outline" className="rounded-xl" disabled={passwordLoading}>
              {passwordLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
            <Link to="/forgot-password" className="flex items-center text-sm font-medium text-primary underline">
              Quên mật khẩu / OTP
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
