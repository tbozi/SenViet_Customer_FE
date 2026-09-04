import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [birthDate, setBirthDate] = useState(user?.birthDate || "");
  const [identityNumber, setIdentityNumber] = useState(user?.identityNumber || "");
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    updateProfile({ name, phone, birthDate, identityNumber });
    setSaved(true);
  };

  return <main className="container py-14"><div className="mx-auto max-w-3xl"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt member</p><h1 className="mt-2 font-display text-4xl font-bold text-primary">{t("profile.title")}</h1></div><Link to="/bookings" className="text-sm font-semibold text-primary underline">{t("profile.bookingHistory")}</Link></div><form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-6"><h2 className="font-display text-2xl font-bold text-primary">{t("profile.personalInfo")}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-primary">{t("auth.name")}<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-input p-3" /></label><label className="text-sm font-medium text-primary">{t("profile.phone")}<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-xl border border-input p-3" /></label><label className="text-sm font-medium text-primary">Ngày sinh<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className="mt-1 w-full rounded-xl border border-input p-3" /></label><label className="text-sm font-medium text-primary">CCCD / CMND<input value={identityNumber} onChange={(event) => setIdentityNumber(event.target.value)} className="mt-1 w-full rounded-xl border border-input p-3" /></label><label className="text-sm font-medium text-primary sm:col-span-2">{t("auth.email")}<input disabled value={user.email} className="mt-1 w-full rounded-xl border border-input bg-muted p-3" /></label></div><div className="mt-6 flex items-center gap-4"><Button type="submit" className="rounded-xl">{t("profile.save")}</Button>{saved && <span className="text-sm text-emerald-600">Đã lưu thông tin</span>}</div></form><div className="mt-5 rounded-2xl border border-border bg-secondary/60 p-5"><h2 className="font-semibold text-primary">Bảo mật tài khoản</h2><div className="mt-3 flex flex-wrap gap-3"><Link to="/forgot-password" className="text-sm font-medium text-primary underline">Quên mật khẩu / OTP</Link><Link to="/change-password" className="text-sm font-medium text-primary underline">Đổi mật khẩu</Link></div></div></div></main>;
}
