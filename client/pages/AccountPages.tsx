import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Eye,
  EyeOff,
  Flower2,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import {
  useCheckCustomerRegistrationMutation,
  useRegisterRequestMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/services/authApi";

const OTP_EXPIRY_SECONDS = 5 * 60;

function RegistrationProgress({ step }: { step: 1 | 2 | 3 }) {
  const { t } = useLanguage();
  const steps = ["stepCustomerInfo", "stepAccountInfo", "stepVerifyOtp"];
  return (
    <div
      className="mb-7 grid grid-cols-3 gap-2"
      aria-label={t("auth.registrationProgress")}
    >
      {steps.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const completed = number < step;
        return (
          <div key={label} className="relative text-center">
            {index > 0 && (
              <span
                className={`absolute right-1/2 top-3 h-px w-full -translate-y-1/2 ${completed ? "bg-primary" : "bg-border"}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 mx-auto grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${active || completed ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              {completed ? "✓" : number}
            </span>
            <span
              className={`mt-2 block text-[10px] leading-tight sm:text-xs ${active ? "font-bold text-primary" : "text-muted-foreground"}`}
            >
              {t(`auth.${label}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const getBackendErrorMessage = (requestError: any) => {
  const data = requestError?.data;
  if (typeof data === "string") return data;
  return String(
    data?.message || data?.result?.message || requestError?.message || "",
  );
};

const getOtpErrorKey = (requestError: any) => {
  const data = requestError?.data;
  const code = String(data?.code || data?.errorCode || "").toUpperCase();
  const message = getBackendErrorMessage(requestError).toLowerCase();

  if (
    code.includes("OTP_LOCKED") ||
    message.includes("khóa") ||
    message.includes("locked")
  ) {
    return "auth.otpLocked";
  }
  if (
    code.includes("OTP_EXPIRED") ||
    message.includes("hết hạn") ||
    message.includes("expired")
  ) {
    return "auth.expiredOtp";
  }
  if (
    code.includes("OTP_NOT_FOUND") ||
    message.includes("không tìm thấy") ||
    message.includes("not found")
  ) {
    return "auth.otpNotFound";
  }
  if (
    code.includes("OTP_INCORRECT_2_ATTEMPTS") ||
    message.includes("còn 1 lần")
  ) {
    return "auth.otpIncorrectOneAttempt";
  }
  if (
    code.includes("OTP_INCORRECT_1_ATTEMPT") ||
    message.includes("còn 2 lần")
  ) {
    return "auth.otpIncorrectTwoAttempts";
  }
  if (code.includes("OTP") || message.includes("otp")) return "auth.invalidOtp";
  return null;
};

const isDuplicateRegistrationError = (requestError: any) => {
  const code = String(
    requestError?.data?.code || requestError?.data?.errorCode || "",
  ).toUpperCase();
  const message = getBackendErrorMessage(requestError).toLowerCase();
  return (
    ["EMAIL_EXISTED", "PHONE_EXISTED", "CCCD_EXISTED"].some((value) =>
      code.includes(value),
    ) ||
    message.includes("email đã tồn tại") ||
    message.includes("số điện thoại đã tồn tại") ||
    message.includes("cccd đã tồn tại") ||
    message.includes("email đã được đăng ký") ||
    message.includes("số điện thoại này đã được đăng ký") ||
    message.includes("cccd này đã được đăng ký")
  );
};

const isPendingOtpError = (requestError: any) => {
  const code = String(
    requestError?.data?.code || requestError?.data?.errorCode || "",
  ).toUpperCase();
  const message = getBackendErrorMessage(requestError).toLowerCase();
  return (
    code.includes("EMAIL_OTP_PENDING") ||
    code.includes("PHONE_OTP_PENDING") ||
    message.includes("đang chờ xác thực") ||
    message.includes("otp đang chờ") ||
    message.includes("mã otp") ||
    message.includes(
      "this phone number is pending verification by another request",
    ) ||
    message.includes("this email is pending verification by another request")
  );
};

const isIdentityMismatchError = (requestError: any) => {
  const code = String(
    requestError?.data?.code || requestError?.data?.errorCode || "",
  ).toUpperCase();
  const message = getBackendErrorMessage(requestError).toLowerCase();
  return (
    code.includes("CUSTOMER_IDENTITY_MISMATCH") ||
    message.includes("số điện thoại và cccd") ||
    message.includes("phone number and citizen id")
  );
};

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { t } = useLanguage();
  const { login } = useAuth();
  const [checkCustomerRegistration, { isLoading: isCheckingCustomer }] =
    useCheckCustomerRegistrationMutation();
  const [registerRequest, { isLoading: isRegistering }] =
    useRegisterRequestMutation();
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
  const [accountStep, setAccountStep] = useState(false);
  const [error, setError] = useState<string | { key: string; detail?: string }>(
    "",
  );
  const [successInfo, setSuccessInfo] = useState(
    (location.state as any)?.successMessage === "registration_success"
      ? "auth.registeredSuccess"
      : "",
  );
  const [resendMessage, setResendMessage] = useState("");
  const [otpSecondsRemaining, setOtpSecondsRemaining] =
    useState(OTP_EXPIRY_SECONDS);
  const registerLocked = useRef(false);
  const checkCustomerLocked = useRef(false);
  const verifyLocked = useRef(false);
  const resendLocked = useRef(false);
  const from = (location.state as { from?: string } | null)?.from || "/";
  const localizedMessage = (
    message: string | { key: string; detail?: string },
  ) => {
    if (typeof message !== "string") {
      return `${t(message.key)}${message.detail ? ` ${message.detail}.` : ""}`;
    }
    return message.startsWith("auth.") ? t(message) : message;
  };
  const localizedRequestError = (requestError: any, fallbackKey: string) => {
    if (isIdentityMismatchError(requestError)) return "auth.identityMismatch";
    const code = String(
      requestError?.data?.code || requestError?.data?.errorCode || "",
    ).toUpperCase();
    const message = getBackendErrorMessage(requestError).toLowerCase();
    if (code.includes("EMAIL_EXISTED") || message.includes("email"))
      return "auth.emailExists";
    if (
      code.includes("PHONE_EXISTED") ||
      message.includes("phone") ||
      message.includes("điện thoại")
    ) {
      return isPendingOtpError(requestError)
        ? "auth.verificationPending"
        : "auth.phoneExists";
    }
    if (isDuplicateRegistrationError(requestError))
      return "auth.accountAlreadyRegistered";
    return getBackendErrorMessage(requestError) || fallbackKey;
  };

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
    if (
      mode === "register" &&
      (registerLocked.current || checkCustomerLocked.current)
    ) {
      return;
    }
    setError("");
    setSuccessInfo("");

    if (mode === "register") {
      if (!/^\d{10}$/.test(phone)) return setError("auth.phoneLength");
      if (!/^\d{12}$/.test(cccd)) return setError("auth.cccdLength");
      if (!accountStep) {
        checkCustomerLocked.current = true;
        try {
          const response = await checkCustomerRegistration({
            fullName: name,
            phone,
            cccd,
          }).unwrap();
          const result = response.result;
          if (result.status === "ALREADY_REGISTERED") {
            return setError(
              result.email
                ? {
                    key: "auth.customerRegisteredWithEmail",
                    detail: result.email,
                  }
                : "auth.customerAlreadyRegistered",
            );
          }
          if (result.status === "IDENTITY_MISMATCH") {
            return setError("auth.identityMismatch");
          }
          if (
            result.status !== "NEW_CUSTOMER" &&
            result.status !== "WALK_IN_CUSTOMER_NEEDS_ACCOUNT"
          ) {
            return setError("auth.profileCheckFailed");
          }
          setSuccessInfo(
            result.status === "WALK_IN_CUSTOMER_NEEDS_ACCOUNT"
              ? "auth.walkInFound"
              : "auth.newCustomer",
          );
          setAccountStep(true);
          setError("");
        } catch (requestError: any) {
          return setError(
            localizedRequestError(requestError, "auth.profileCheckError"),
          );
        } finally {
          checkCustomerLocked.current = false;
        }
        return;
      }
      if (!email.trim()) return setError("auth.emailRequired");
      if (password.length < 6) return setError("auth.passwordLength");
      if (password !== confirmPassword)
        return setError("auth.passwordMismatch");
      const registrationEmail = email.trim().toLowerCase();
      registerLocked.current = true;
      try {
        await registerRequest({
          fullName: name,
          email: registrationEmail,
          phone,
          address: "",
          cccd,
          password,
        }).unwrap();
        setRegistrationPassword(password);
        setVerificationEmail(registrationEmail);
        setOtp("");
        setResendMessage("");
        setVerificationStep(true);
      } catch (requestError: any) {
        registerLocked.current = false;
        if (isPendingOtpError(requestError)) {
          setRegistrationPassword("");
          setError("auth.verificationPending");
          setVerificationEmail(registrationEmail);
          setOtp("");
          setResendMessage("");
          setVerificationStep(true);
          return;
        }
        return setError(
          localizedRequestError(requestError, "auth.registerError"),
        );
      }
      return;
    }

    const result = await login(email, password);
    if (!result.ok) {
      setError("auth.invalidCredentials");
      return;
    }
    navigate(from);
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (verifyLocked.current) return;
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("auth.invalidOtp");
      return;
    }
    verifyLocked.current = true;
    try {
      await verifyOtp({ email: verificationEmail, otp }).unwrap();
      // Tự động đăng nhập ngay để cập nhật session khách hàng
      if (registrationPassword) {
        const autoLoginResult = await login(
          verificationEmail,
          registrationPassword,
        );
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
          successMessage: "registration_success",
        },
      });
    } catch (requestError: any) {
      verifyLocked.current = false;
      const errorKey = getOtpErrorKey(requestError);
      setError(
        errorKey
          ? errorKey
          : localizedRequestError(requestError, "auth.verifyFailed"),
      );
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
      setResendMessage("auth.resendSuccess");
    } catch (requestError: any) {
      const errorKey = getOtpErrorKey(requestError);
      setError(
        errorKey
          ? errorKey
          : localizedRequestError(requestError, "auth.verifyFailed"),
      );
    } finally {
      resendLocked.current = false;
    }
  };

  if (verificationStep) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 px-4 py-14">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <RegistrationProgress step={3} />
          <h1 className="mt-6 font-display text-3xl font-bold text-primary">
            {t("auth.otpTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.otpSentTo")} {verificationEmail}.
          </p>
          <p
            className={`mt-3 text-center text-sm font-semibold ${otpSecondsRemaining === 0 ? "text-red-600" : "text-primary"}`}
          >
            {otpSecondsRemaining === 0
              ? t("auth.otpExpired")
              : `${t("auth.otpValidFor")} ${formattedOtpTime}`}
          </p>
          <form onSubmit={verify} className="mt-8 space-y-4">
            <label className="block text-sm font-medium text-primary">
              {t("auth.otpLabel")}
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value.replace(/\D/g, ""))}
                inputMode="numeric"
                autoFocus
                aria-label={t("auth.otpAriaLabel")}
                containerClassName="mt-2 justify-center"
              >
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </label>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {localizedMessage(error)}
              </p>
            )}
            {resendMessage && (
              <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {localizedMessage(resendMessage)}
              </p>
            )}
            <Button
              type="submit"
              disabled={
                verifyLocked.current ||
                isVerifying ||
                otp.length !== 6 ||
                otpSecondsRemaining === 0
              }
              className="w-full rounded-xl"
            >
              {isVerifying ? t("auth.verifying") : t("auth.verifyContinue")}
            </Button>
          </form>
          <button
            type="button"
            onClick={resendOtp}
            disabled={resendLocked.current || isResending}
            className="mt-4 w-full text-sm font-semibold text-primary underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? t("auth.resendingOtp") : t("auth.resendOtp")}
          </button>
          <button
            type="button"
            onClick={() => {
              setVerificationStep(false);
              setOtp("");
              setError("");
              setResendMessage("");
              registerLocked.current = false;
              verifyLocked.current = false;
            }}
            className="mt-5 w-full text-sm font-semibold text-primary underline"
          >
            {t("auth.backToRegister")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-secondary/50 px-4 py-14">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold">
          <Flower2 className="h-6 w-6" />
        </div>
        {mode === "register" && (
          <RegistrationProgress step={accountStep ? 2 : 1} />
        )}
        <h1 className="mt-6 font-display text-3xl font-bold text-primary">
          {mode === "login"
            ? t("auth.loginTitle")
            : accountStep
              ? t("auth.accountInfoTitle")
              : t("auth.registerTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login"
            ? t("auth.loginSubtitle")
            : accountStep
              ? t("auth.accountInfoSubtitle")
              : t("auth.registerSubtitle")}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "register" && !accountStep && (
            <>
              <label className="block text-sm font-medium text-primary">
                {t("auth.name")}{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <div className="relative mt-1">
                  <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-xl border border-input p-3 pl-10"
                  />
                </div>
              </label>
              <label className="block text-sm font-medium text-primary">
                {t("auth.phone")}{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-input p-3 pl-10"
                  />
                </div>
              </label>
              <label className="block text-sm font-medium text-primary">
                {t("auth.cccd")}{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <div className="relative mt-1">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    inputMode="numeric"
                    value={cccd}
                    onChange={(event) =>
                      setCccd(event.target.value.replace(/\D/g, ""))
                    }
                    className="w-full rounded-xl border border-input p-3 pl-10"
                    placeholder="012345678901"
                  />
                </div>
              </label>
            </>
          )}
          {mode === "register" && accountStep && (
            <>
              <label className="block text-sm font-medium text-primary">
                {t("auth.email")}{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-input p-3 pl-10"
                  />
                </div>
              </label>
              <label className="block text-sm font-medium text-primary">
                {t("auth.password")}{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <div className="relative mt-1">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-input p-3 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={
                      showPassword
                        ? t("auth.hidePassword")
                        : t("auth.showPassword")
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>
              <label className="block text-sm font-medium text-primary">
                {t("auth.confirmPassword")}{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
                <div className="relative mt-1">
                  <input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-input p-3 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={
                      showConfirmPassword
                        ? t("auth.hideConfirmPassword")
                        : t("auth.showConfirmPassword")
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>
            </>
          )}
          {mode === "login" && (
            <label className="block text-sm font-medium text-primary">
              {t("auth.email")}
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-input p-3 pl-10"
                />
              </div>
            </label>
          )}
          {mode === "login" && (
            <label className="block text-sm font-medium text-primary">
              {t("auth.password")}
              <div className="relative mt-1">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-input p-3 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={
                    showPassword
                      ? t("auth.hidePassword")
                      : t("auth.showPassword")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          )}
          {mode === "login" && (
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                state={{ from, email: email.trim() }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
          )}
          {false && (
            <label className="block text-sm font-medium text-primary">
              {t("auth.confirmPassword")}{" "}
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
              <div className="relative mt-1">
                <input
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-input p-3 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={
                    showConfirmPassword
                      ? t("auth.hideConfirmPassword")
                      : t("auth.showConfirmPassword")
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          )}
          {successInfo && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
              {t(successInfo)}
            </p>
          )}
          {error && (
            <div className="space-y-2">
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {localizedMessage(error)}
              </p>
              {mode === "login" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                  {t("auth.forgotPasswordPrompt")}{" "}
                  <Link
                    to="/forgot-password"
                    state={{ from, email: email.trim() }}
                    className="font-bold text-primary underline hover:text-gold"
                  >
                    {t("auth.resetPasswordLink")}
                  </Link>
                </div>
              )}
            </div>
          )}
          {mode === "register" && accountStep && (
            <button
              type="button"
              onClick={() => {
                setAccountStep(false);
                setError("");
              }}
              className="w-full text-center text-sm font-semibold text-primary underline"
            >
              {t("auth.backToCustomerInfo")}
            </button>
          )}
          <Button
            type="submit"
            disabled={
              mode === "register" &&
              (registerLocked.current ||
                checkCustomerLocked.current ||
                isRegistering ||
                isCheckingCustomer)
            }
            className="w-full rounded-xl"
          >
            {mode === "register" && isCheckingCustomer
              ? t("auth.checkingCustomer")
              : mode === "register" && isRegistering
                ? t("auth.creatingAccount")
                : mode === "login"
                  ? t("auth.loginButton")
                  : accountStep
                    ? t("auth.continueButton")
                    : t("auth.continueButton")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
          <Link
            to={mode === "login" ? "/register" : "/login"}
            className="font-semibold text-primary underline"
          >
            {mode === "login" ? t("auth.registerLink") : t("auth.loginLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}

export function Placeholder({ title }: { title: string }) {
  const { t } = useLanguage();
  return (
    <main className="container flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
        <Flower2 />
      </div>
      <h1 className="mt-6 font-display text-4xl font-bold text-primary">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {t("placeholder.desc")}
      </p>
      <Button asChild className="mt-7 rounded-full">
        <Link to="/">{t("placeholder.back")}</Link>
      </Button>
    </main>
  );
}
