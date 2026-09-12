import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Flower2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

const errorMessages: Record<string, string> = { invalid: "Email hoặc mật khẩu chưa đúng.", unverified: "Tài khoản chưa được xác thực. Vui lòng nhập mã OTP.", exists: "Email này đã được đăng ký.", invalid_code: "Mã OTP không đúng.", expired: "Mã OTP đã hết hạn. Vui lòng đăng ký lại.", not_found: "Không tìm thấy yêu cầu đăng ký." };

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { t } = useLanguage();
  const { login, register, verifyRegistration } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [error, setError] = useState("");
  const from = (location.state as { from?: string } | null)?.from || "/";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (mode === "register") {
      if (password.length < 6) return setError("Mật khẩu cần có ít nhất 6 ký tự.");
      if (password !== confirmPassword) return setError("Mật khẩu xác nhận không khớp.");
      const result = await register(name, email, password, phone);
      if (!result.ok) return setError(errorMessages[result.error || ""] || "Không thể tạo tài khoản.");
      setVerificationEmail(email);
      setVerificationStep(true);
      return;
    }
    const result = await login(email, password);
    if (!result.ok) return setError(errorMessages[result.error || ""] || "Không thể đăng nhập.");
    navigate(from);
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const result = await verifyRegistration(verificationEmail, otp);
    if (!result.ok) return setError(errorMessages[result.error || ""] || "Không thể xác thực tài khoản.");
    navigate(from);
  };

  if (verificationStep) return <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 px-4 py-14"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold"><LockKeyhole className="h-6 w-6" /></div><h1 className="mt-6 font-display text-3xl font-bold text-primary">Xác thực tài khoản</h1><p className="mt-2 text-sm text-muted-foreground">Nhập mã OTP đã gửi đến {verificationEmail}. Trong bản demo, mã xác thực là <strong className="text-primary">123456</strong>.</p><form onSubmit={verify} className="mt-8 space-y-4"><label className="block text-sm font-medium text-primary">Mã OTP<input required inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} className="mt-1 w-full rounded-xl border border-input p-3 text-center text-xl tracking-[.4em]" placeholder="123456" /></label>{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button type="submit" className="w-full rounded-xl">Xác thực và tiếp tục</Button></form><button type="button" onClick={() => { setVerificationStep(false); setError(""); }} className="mt-5 w-full text-sm font-semibold text-primary underline">Quay lại đăng ký</button></div></main>;

  return <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 px-4 py-14"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold"><Flower2 className="h-6 w-6" /></div><h1 className="mt-6 font-display text-3xl font-bold text-primary">{mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}</h1><p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}</p><form onSubmit={submit} className="mt-8 space-y-4">{mode === "register" && <><label className="block text-sm font-medium text-primary">{t("auth.name")}<div className="relative mt-1"><UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-input p-3 pl-10" /></div></label><label className="block text-sm font-medium text-primary">Số điện thoại<div className="relative mt-1"><Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input required value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-input p-3 pl-10" /></div></label></>}<label className="block text-sm font-medium text-primary">{t("auth.email")}<div className="relative mt-1"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-input p-3 pl-10" /></div></label><label className="block text-sm font-medium text-primary">{t("auth.password")}<input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-input p-3" /></label>{mode === "register" && <label className="block text-sm font-medium text-primary">{t("auth.confirmPassword")}<input required type="password" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-input p-3" /></label>}{error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button type="submit" className="w-full rounded-xl">{mode === "login" ? t("auth.loginButton") : t("auth.registerButton")}</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")} <Link to={mode === "login" ? "/register" : "/login"} state={{ from }} className="font-semibold text-primary underline">{mode === "login" ? t("auth.registerLink") : t("auth.loginLink")}</Link></p></div></main>;
}

export function Placeholder({ title }: { title: string }) { const { t } = useLanguage(); return <main className="container flex min-h-[55vh] flex-col items-center justify-center py-20 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary"><Flower2 /></div><h1 className="mt-6 font-display text-4xl font-bold text-primary">{title}</h1><p className="mt-3 max-w-md text-muted-foreground">{t("placeholder.desc")}</p><Button asChild className="mt-7 rounded-full"><Link to="/">{t("placeholder.back")}</Link></Button></main>; }
