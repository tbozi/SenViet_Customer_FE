import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CreditCard, Eye, EyeOff, Flower2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useRegisterRequestMutation, useResendOtpMutation, useVerifyOtpMutation } from "@/services/authApi";

const errorMessages: Record<string, string> = {
  invalid: "Email hoặc mật khẩu chưa đúng.",
  exists: "Email này đã được đăng ký.",
  phone_exists: "Số điện thoại này đã được đăng ký.",
  verification_pending: "Số điện thoại này đang chờ xác thực bởi một yêu cầu khác.",
  invalid_code: "Mã OTP không đúng.",
  expired: "Mã OTP đã hết hạn. Vui lòng đăng ký lại.",
};

const accountAlreadyRegisteredMessage = "Tài khoản này đã được đăng ký.";
const OTP_EXPIRY_SECONDS = 5 * 60;

const getBackendErrorMessage = (requestError: any) => {
  const data = requestError?.data;
  if (typeof data === "string") return data;
  return String(data?.message || data?.result?.message || requestError?.message || "");
};

const getOtpErrorMessage = (requestError: any) => {
  const data = requestError?.data;
  const code = String(data?.code || data?.errorCode || "").toUpperCase();
  const message = getBackendErrorMessage(requestError).toLowerCase();

  if (code.includes("OTP_LOCKED") || message.includes("khóa") || message.includes("locked")) {
    return "Bạn đã nhập sai OTP quá 3 lần. Vui lòng gửi lại mã mới.";
  }
  if (code.includes("OTP_EXPIRED") || message.includes("hết hạn") || message.includes("expired")) {
    return "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.";
  }
  if (code.includes("OTP_NOT_FOUND") || message.includes("không tìm thấy") || message.includes("not found")) {
    return "Không tìm thấy yêu cầu xác thực. Vui lòng đăng ký lại.";
  }
  if (code.includes("OTP_INCORRECT_2_ATTEMPTS") || message.includes("còn 1 lần")) {
    return "Mã OTP không đúng. Bạn còn 1 lần thử.";
  }
  if (code.includes("OTP_INCORRECT_1_ATTEMPT") || message.includes("còn 2 lần")) {
    return "Mã OTP không đúng. Bạn còn 2 lần thử.";
  }
  return getBackendErrorMessage(requestError) || "Không thể xác thực tài khoản.";
};

const isDuplicateRegistrationError = (requestError: any) => {
  const code = String(requestError?.data?.code || requestError?.data?.errorCode || "").toUpperCase();
  const message = getBackendErrorMessage(requestError).toLowerCase();
  return ["EMAIL_EXISTED", "PHONE_EXISTED", "CCCD_EXISTED"].some((value) => code.includes(value))
    || message.includes("email đã tồn tại")
    || message.includes("số điện thoại đã tồn tại")
    || message.includes("cccd đã tồn tại")
    || message.includes("email đã được đăng ký")
    || message.includes("số điện thoại này đã được đăng ký")
    || message.includes("cccd này đã được đăng ký");
};

const isPendingOtpError = (requestError: any) => {
  const code = String(requestError?.data?.code || requestError?.data?.errorCode || "").toUpperCase();
  const message = getBackendErrorMessage(requestError).toLowerCase();
  return code.includes("EMAIL_OTP_PENDING")
    || code.includes("PHONE_OTP_PENDING")
    || message.includes("đang chờ xác thực")
    || message.includes("otp đang chờ")
    || message.includes("mã otp")
    || message.includes("this phone number is pending verification by another request")
    || message.includes("this email is pending verification by another request");
};

const isEmailAlreadyRegisteredError = (requestError: any) => {
  const code = String(requestError?.data?.code || requestError?.data?.errorCode || "").toUpperCase();
  const message = getBackendErrorMessage(requestError).toLowerCase();
  return code.includes("EMAIL_EXISTED")
    || message.includes("email này đã được đăng ký")
    || message.includes("email đã tồn tại");
};

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [registerRequest, { isLoading: isRegistering }] = useRegisterRequestMutation();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtpRequest, { isLoading: isResending }] = useResendOtpMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cccd, setCccd] = useState("");
  const [email, setEmail] = useState((location.state as any)?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationPassword, setRegistrationPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [error, setError] = useState("");
  const [successInfo, setSuccessInfo] = useState((location.state as any)?.successMessage || "");
  const [resendMessage, setResendMessage] = useState("");
  const [otpSecondsRemaining, setOtpSecondsRemaining] = useState(OTP_EXPIRY_SECONDS);
  const registerLocked = useRef(false);
  const verifyLocked = useRef(false);
  const resendLocked = useRef(false);
  const from = (location.state as { from?: string } | null)?.from || "/";

  useEffect(() => {
    if (!verificationStep) return;

    setOtpSecondsRemaining(OTP_EXPIRY_SECONDS);
    const timer = window.setInterval(() => {
      setOtpSecondsRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [verificationStep]);

  const formattedOtpTime = `${String(Math.floor(otpSecondsRemaining / 60)).padStart(2, "0")}:${String(otpSecondsRemaining % 60).padStart(2, "0")}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register" && registerLocked.current) return;
    setError("");

    if (mode === "register") {
      if (!/^\d{12}$/.test(cccd)) return setError("CCCD phải gồm 12 chữ số.");
      if (password.length < 6) return setError("Mật khẩu cần có ít nhất 6 ký tự.");
      if (password !== confirmPassword) return setError("Mật khẩu xác nhận không khớp.");
      registerLocked.current = true;
      setRegistrationPassword(password);
      try {
        await registerRequest({ fullName: name, email, phone, address: "", cccd, password }).unwrap();
        setVerificationEmail(email);
        setOtp("");
        setResendMessage("");
        setVerificationStep(true);
      } catch (requestError: any) {
        registerLocked.current = false;
        const message = getBackendErrorMessage(requestError) || "Không thể tạo tài khoản.";
        const normalizedMessage = String(message).toLowerCase();
        if (isPendingOtpError(requestError)) {
          setVerificationEmail(email);
          setOtp("");
          setResendMessage("");
          setVerificationStep(true);
          return;
        }
        if (isEmailAlreadyRegisteredError(requestError)) {
          setVerificationEmail(email);
          setOtp("");
          setResendMessage("");
          setVerificationStep(true);
          return;
        }
        if (isDuplicateRegistrationError(requestError)) return setError(accountAlreadyRegisteredMessage);
        if (normalizedMessage.includes("email")) return setError(errorMessages.exists);
        if (normalizedMessage.includes("điện thoại")) {
          return setError(normalizedMessage.includes("chờ xác thực") ? errorMessages.verification_pending : errorMessages.phone_exists);
        }
        return setError(message);
      }
      return;
    }

    const result = await login(email, password);
    if (!result.ok) {
      setError(errorMessages[result.error || ""] || "Không thể đăng nhập.");
      return;
    }
    navigate(from);
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (verifyLocked.current) return;
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Mã OTP phải gồm 6 chữ số.");
      return;
    }
    verifyLocked.current = true;
    try {
      await verifyOtp({ email: verificationEmail, otp }).unwrap();
      // Tự động đăng nhập ngay để cập nhật session khách hàng
      if (registrationPassword) {
        const autoLoginResult = await login(verificationEmail, registrationPassword);
        if (autoLoginResult.ok) {
          navigate(from);
          return;
        }
      }
      // Nếu không có mật khẩu tạm hoặc đăng nhập thất bại thì chuyển về trang đăng nhập với thông báo
      navigate("/login", {
        replace: true,
        state: {
          from,
          email: verificationEmail,
          successMessage: "Đăng ký tài khoản thành công! Vui lòng nhập mật khẩu để đăng nhập.",
        },
      });
    } catch (requestError: any) {
      verifyLocked.current = false;
      setError(getOtpErrorMessage(requestError));
    }
  };

  const resendOtp = async () => {
    if (resendLocked.current || isResending) return;
    resendLocked.current = true;
    setError("");
    setResendMessage("");
    try {
      await resendOtpRequest({ email: verificationEmail }).unwrap();
      setOtp("");
      setOtpSecondsRemaining(OTP_EXPIRY_SECONDS);
      setResendMessage("Mã OTP mới đã được gửi. Vui lòng kiểm tra email.");
    } catch (requestError: any) {
      setError(getOtpErrorMessage(requestError));
    } finally {
      resendLocked.current = false;
    }
  };

  if (verificationStep) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 px-4 py-14">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold"><LockKeyhole className="h-6 w-6" /></div>
          <h1 className="mt-6 font-display text-3xl font-bold text-primary">Xác thực tài khoản</h1>
          <p className="mt-2 text-sm text-muted-foreground">Nhập mã OTP đã gửi đến {verificationEmail}.</p>
          <p className={`mt-3 text-center text-sm font-semibold ${otpSecondsRemaining === 0 ? "text-red-600" : "text-primary"}`}>
            {otpSecondsRemaining === 0 ? "Mã OTP đã hết hạn" : `Mã có hiệu lực trong ${formattedOtpTime}`}
          </p>
          <form onSubmit={verify} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-primary">Mã OTP
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoFocus
                aria-label="Mã OTP gồm 6 chữ số"
                containerClassName="mt-2 justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} />)}
                </InputOTPGroup>
              </InputOTP>
            </label>
            {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {resendMessage && <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{resendMessage}</p>}
            <Button type="submit" disabled={verifyLocked.current || isVerifying || otp.length !== 6 || otpSecondsRemaining === 0} className="w-full rounded-xl">{isVerifying ? "Đang xác thực..." : "Xác thực và tiếp tục"}</Button>
          </form>
          <button type="button" onClick={resendOtp} disabled={resendLocked.current || isResending} className="mt-4 w-full text-sm font-semibold text-primary underline disabled:cursor-not-allowed disabled:opacity-50">
            {isResending ? "Đang gửi lại mã..." : "Gửi lại mã"}
          </button>
          <button type="button" onClick={() => { setVerificationStep(false); setOtp(""); setError(""); setResendMessage(""); registerLocked.current = false; verifyLocked.current = false; }} className="mt-5 w-full text-sm font-semibold text-primary underline">Quay lại đăng ký</button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 px-4 py-14">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold"><Flower2 className="h-6 w-6" /></div>
        <h1 className="mt-6 font-display text-3xl font-bold text-primary">{mode === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? t("auth.loginSubtitle") : t("auth.registerSubtitle")}</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "register" && <>
            <label className="block text-sm font-medium text-primary">{t("auth.name")} <span className="text-red-500" aria-hidden="true">*</span>
              <div className="relative mt-1"><UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-input p-3 pl-10" /></div>
            </label>
            <label className="block text-sm font-medium text-primary">Số điện thoại <span className="text-red-500" aria-hidden="true">*</span>
              <div className="relative mt-1"><Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input required value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full rounded-xl border border-input p-3 pl-10" /></div>
            </label>
            <label className="block text-sm font-medium text-primary">{t("auth.cccd")} <span className="text-red-500" aria-hidden="true">*</span>
              <div className="relative mt-1"><CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input required inputMode="numeric" maxLength={12} pattern="[0-9]{12}" value={cccd} onChange={(event) => setCccd(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-input p-3 pl-10" placeholder="012345678901" /></div>
            </label>
          </>}
          <label className="block text-sm font-medium text-primary">{t("auth.email")} {mode === "register" && <span className="text-red-500" aria-hidden="true">*</span>}
            <div className="relative mt-1"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-input p-3 pl-10" /></div>
          </label>
          <label className="block text-sm font-medium text-primary">{t("auth.password")} {mode === "register" && <span className="text-red-500" aria-hidden="true">*</span>}
            <div className="relative mt-1"><input required type={showPassword ? "text" : "password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-input p-3 pr-11" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
          </label>
          {mode === "register" && <label className="block text-sm font-medium text-primary">{t("auth.confirmPassword")} <span className="text-red-500" aria-hidden="true">*</span>
            <div className="relative mt-1"><input required type={showConfirmPassword ? "text" : "password"} minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-input p-3 pr-11" /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
          </label>}
          {successInfo && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{successInfo}</p>}
          {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={mode === "register" && (registerLocked.current || isRegistering)} className="w-full rounded-xl">{mode === "register" && isRegistering ? "Đang gửi mã OTP..." : mode === "login" ? t("auth.loginButton") : t("auth.registerButton")}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">{mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <Link to={mode === "login" ? "/register" : "/login"} className="font-semibold text-primary underline">{mode === "login" ? "Đăng ký" : "Đăng nhập"}</Link>
        </p>
      </div>
    </main>
  );
}

export function Placeholder({ title }: { title: string }) {
  const { t } = useLanguage();
  return <main className="container flex min-h-[55vh] flex-col items-center justify-center py-20 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary"><Flower2 /></div><h1 className="mt-6 font-display text-4xl font-bold text-primary">{title}</h1><p className="mt-3 max-w-md text-muted-foreground">{t("placeholder.desc")}</p><Button asChild className="mt-7 rounded-full"><Link to="/">{t("placeholder.back")}</Link></Button></main>;
}
