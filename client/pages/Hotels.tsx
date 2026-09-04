import { useState } from "react";
import HotelCard from "@/components/HotelCard";
import { hotels } from "@/data/hotels";
import { useLanguage } from "@/lib/i18n";

export default function Hotels() {
  const { t } = useLanguage();
  const [region, setRegion] = useState("all");
  const filtered = region === "all" ? hotels : hotels.filter((h) => h.region === region);
  const filters = [["all", t("hotels.filterAll")], ["north", t("hotels.filterNorth")], ["central", t("hotels.filterCentral")], ["south", t("hotels.filterSouth")]];
  return <main className="container py-16"><p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">Sen Việt collection</p><h1 className="mt-3 font-display text-5xl font-bold text-primary">{t("hotels.pageTitle")}</h1><p className="mt-4 max-w-xl text-muted-foreground">{t("hotels.pageSubtitle")}</p><div className="mt-10 flex flex-wrap gap-2">{filters.map(([key,label]) => <button key={key} onClick={() => setRegion(key)} className={`rounded-full px-5 py-2 text-sm font-semibold transition ${region === key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-primary"}`}>{label}</button>)}</div><div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map((hotel) => <HotelCard hotel={hotel} key={hotel.slug} />)}</div></main>;
}
