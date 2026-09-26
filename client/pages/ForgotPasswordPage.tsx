import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Flower2, KeyRound, Lock, Mail, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axiosInstance";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const from = (location.state as any)?.from;
  const passedEmail = (location.state as any)?.email;

  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  // Cho phép khách tự nhập tự do, hoặc lấy email kéo từ trang login qua nếu có
  const [email, setEmail] = useState(passedEmail || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (passedEmail) {
      setEmail(passedEmail);
    }
  }, [passedEmail]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/forgot-password/request", {
        email: email.trim(),
      });
      setSuccessInfo(res.data?.message || "Mã OTP đã được gửi đến email của bạn.");
      setStep("reset");
      setCountdown(300); // 5 phút
    } catch (err: any) {
      const msg = err.response?.data?.message || "Không tìm thấy tài khoản với email này.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading || countdown > 240) return;
    setError("");
    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/forgot-password/request", {
        email: email.trim(),
      });
      setSuccessInfo(res.data?.message || "Đã gửi lại mã OTP mới.");
      setCountdown(300);
      setOtp("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gửi lại OTP thất bại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp với mật khẩu mới.");
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post("/auth/forgot-password/reset", {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
        confirmPassword,
      });

      // Tự động đăng nhập với mật khẩu mới để cập nhật session
      const loginRes = await login(email.trim(), newPassword);

      const destination = from && from !== "/login" ? from : "/profile";

      if (loginRes?.ok) {
        // Điều hướng trực tiếp về trang trước đó (ví dụ /profile) kèm thông báo thành công
        navigate(destination, {
          replace: true,
          state: { successMessage: "Đặt lại mật khẩu thành công!" },
        });
        return;
      }

      // Nếu không tự login được, chuyển sang màn hình success
      setSuccessInfo(res.data?.message || "Đặt lại mật khẩu thành công!");
      setStep("success");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 px-4 py-14">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold">
          <Flower2 className="h-6 w-6" />
        </div>

        {step === "email" && (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold text-primary">Quên mật khẩu</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nhập email đăng ký của bạn. Hệ thống sẽ gửi mã OTP 6 số để xác minh danh tính.
            </p>

            <form onSubmit={handleRequestOtp} className="mt-8 space-y-4">
              <label className="block text-sm font-medium text-primary">
                Địa chỉ email
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@senviet.vn"
                    className="w-full rounded-xl border border-input bg-background p-3 pl-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full rounded-xl">
                {loading ? "Đang gửi mã..." : "Gửi mã xác thực OTP"}
              </Button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <h1 className="mt-6 font-display text-3xl font-bold text-primary">Đặt lại mật khẩu</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nhập mã OTP đã gửi tới <strong className="text-primary">{email}</strong> và mật khẩu mới của bạn.
            </p>

            {countdown > 0 ? (
              <p className="mt-3 text-center text-xs font-semibold text-primary">
                Mã OTP có hiệu lực trong: <span className="text-gold">{formatCountdown(countdown)}</span>
              </p>
            ) : (
              <p className="mt-3 text-center text-xs font-semibold text-red-600">
                Mã OTP đã hết hiệu lực. Vui lòng bấm gửi lại mã mới.
              </p>
            )}

            <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
              <div>
                <label className="block text-center text-sm font-medium text-primary">
                  Nhập mã OTP 6 chữ số
                </label>
                <div className="mt-2 flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(val) => setOtp(val.replace(/\D/g, ""))}
                    inputMode="numeric"
                    autoFocus
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <label className="block text-sm font-medium text-primary">
                Mật khẩu mới (ít nhất 6 ký tự)
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type={showNewPassword ? "text" : "password"}
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full rounded-xl border border-input bg-background p-3 pl-10 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="block text-sm font-medium text-primary">
                Xác nhận mật khẩu mới
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-xl border border-input bg-background p-3 pl-10 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              {successInfo && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {successInfo}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl"
              >
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
              >
                <RotateCw className="h-3 w-3" /> Gửi lại mã OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                  setSuccessInfo("");
                }}
                className="text-muted-foreground hover:underline"
              >
                Đổi email khác
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="text-center">
            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-primary">Thành công!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Mật khẩu của bạn đã được cập nhật thành công.
            </p>
            <Button
              onClick={() => {
                const destination = from && from !== "/login" ? from : (user ? "/profile" : "/login");
                navigate(destination, { replace: true });
              }}
              className="mt-6 w-full rounded-xl bg-gold text-gold-foreground hover:bg-gold/90"
            >
              {user ? "Quay về trang cá nhân" : "Đăng nhập ngay"}
            </Button>
          </div>
        )}

        <div className="mt-8 border-t border-border pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              if (from) {
                navigate(from);
              } else if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/profile");
              }
            }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Quay lại trang trước
          </button>
        </div>
      </div>
    </main>
  );
}