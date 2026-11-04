import PublicHotelCard from "@/components/PublicHotelCard";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import { useLanguage } from "@/lib/i18n";

export default function Hotels() {
  const { t, language } = useLanguage();
  const { data: hotels = [], isLoading, isError } = useGetPublicHotelsQuery();

  return (
    <main className="container py-16">
      <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt collection</p>
      <h1 className="mt-3 font-display text-5xl font-bold text-primary">{t("hotels.pageTitle")}</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">{t("hotels.pageSubtitle")}</p>
      {isLoading && (
        <p className="mt-8 text-muted-foreground">
          {language === "en" ? "Loading hotels..." : "Đang tải khách sạn..."}
        </p>
      )}
      {isError && (
        <p role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {language === "en" ? "Unable to load hotels. Please try again later." : "Không thể tải khách sạn. Vui lòng thử lại sau."}
        </p>
      )}
      {!isLoading && !isError && hotels.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          {language === "en" ? "No hotels available." : "Chưa có khách sạn."}
        </p>
      )}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => <PublicHotelCard hotel={hotel} key={hotel.id} />)}
      </div>
    </main>
  );
}
