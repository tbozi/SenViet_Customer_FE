import { useMemo, useState } from "react";
import { Check, ChevronLeft, Copy, Hotel, Minus, Plus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BookingSummaryPanel from "@/components/booking/BookingSummaryPanel";
import { formatVnd, hotels } from "@/data/hotels";
import {
  services,
  serviceTabs,
  type ServiceCatalogItem,
} from "@/data/services";
import { useGetServicesQuery } from "@/services/hotelServiceApi";
import {
  calculateEarlyCheckInSurcharge,
  calculateLateCheckOutSurcharge,
  type BookingService,
  type GuestForm,
  type RoomSelection,
  type RoomStay,
} from "@/lib/bookings";

const fallbackGuest = (params: URLSearchParams): GuestForm => ({
  adults: Number(params.get("adults") || 1),
  children: Number(params.get("children") || 0),
  infants: 0,
});

function parseSelections(params: URLSearchParams): RoomSelection[] {
  try {
    const parsed = JSON.parse(params.get("roomSelections") || "null");
    if (Array.isArray(parsed) && parsed.length)
      return parsed as RoomSelection[];
  } catch {
    // Continue with the legacy query-string fallback below.
  }

  const quantity = Math.max(1, Number(params.get("rooms") || 1));
  const guest = fallbackGuest(params);
  const roomName = params.get("room") || "Phòng Tiêu Chuẩn";
  const nightlyPrice = Number(params.get("roomPrice") || 0);
  const legacyStayServices = parseServices(params);
  return [
    {
      roomId: "legacy",
      roomName,
      roomNameVi: roomName,
      quantity,
      nightlyPrice,
      guestForms: Array.from({ length: quantity }, () => guest),
      includedCapacity: { adults: 1, children: 1, infants: 1 },
      checkIn: params.get("checkIn") || "",
      checkOut: params.get("checkOut") || "",
      nights: Number(params.get("nights") || 0),
      roomCodes: Array.from(
        { length: quantity },
        (_, index) => `Phòng ${index + 1}`,
      ),
      extraAdults: 0,
      extraChildren: 0,
      extraGuestCount: 0,
      extraGuestCharge: 0,
      stays: Array.from({ length: quantity }, (_, index) => ({
        roomCode: `Phòng ${index + 1}`,
        checkIn: params.get("checkIn") || "",
        checkOut: params.get("checkOut") || "",
        nights: Number(params.get("nights") || 0),
        guest,
        extraGuestCharge: 0,
        services: index === 0 ? legacyStayServices : [],
      })),
    },
  ];
}

function parseServices(params: URLSearchParams): BookingService[] {
  try {
    const parsed = JSON.parse(params.get("services") || "[]");
    return Array.isArray(parsed) ? (parsed as BookingService[]) : [];
  } catch {
    return [];
  }
}

function selectionStays(selection: RoomSelection): RoomStay[] {
  if (selection.stays?.length) return selection.stays;
  return Array.from({ length: selection.quantity }, (_, index) => ({
    roomCode: selection.roomCodes?.[index] || `Phòng ${index + 1}`,
    checkIn: selection.checkIn || "",
    checkOut: selection.checkOut || "",
    nights: selection.nights || 0,
    guest: selection.guestForms[index] ||
      selection.guestForms[0] || { adults: 1, children: 0, infants: 0 },
    extraGuestCharge:
      selection.extraGuestCharge / Math.max(1, selection.quantity),
    services: [],
  }));
}

type ConcreteStay = {
  selection: RoomSelection;
  stay: RoomStay;
};

function stayServiceQuantity(stay: RoomStay, serviceId: string) {
  return (
    stay.services?.find((service) => service.id === serviceId)?.quantity || 0
  );
}

function serviceTotal(stay: RoomStay) {
  return (stay.services || []).reduce((sum, service) => sum + service.total, 0);
}

export default function BookingServices() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const hotel =
    hotels.find((item) => item.slug === params.get("hotel")) || hotels[0];
  const arrivalTime = params.get("arrivalTime") || "14:00";
  const departureTime = params.get("departureTime") || "12:00";
  const [selections, setSelections] = useState<RoomSelection[]>(() =>
    parseSelections(params),
  );
  const [activeRoomCode, setActiveRoomCode] = useState(() => {
    const initialSelection = parseSelections(params)[0];
    return initialSelection
      ? selectionStays(initialSelection)[0]?.roomCode || ""
      : "";
  });
  const [activeCategory, setActiveCategory] = useState<
    (typeof serviceTabs)[number][0]
  >(serviceTabs[0][0]);

  const { data: backendServices } = useGetServicesQuery({
    hotelId: hotel?.id,
    activeOnly: true,
  });

  const availableServices: ServiceCatalogItem[] = useMemo(() => {
    if (backendServices && backendServices.length > 0) {
      return backendServices.map((bs) => ({
        id: String(bs.id),
        category:
          bs.category?.toLowerCase().includes("nhà hàng") ||
          bs.category?.toLowerCase().includes("ẩm thực") ||
          bs.category?.toLowerCase().includes("minibar")
            ? "restaurant"
            : bs.category?.toLowerCase().includes("hội nghị") ||
              bs.category?.toLowerCase().includes("meeting")
            ? "meeting"
            : "hotel",
        name: bs.name,
        image:
          bs.imageUrl ||
          "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?q=80&w=800",
        hours: bs.category || "Dịch vụ khách sạn",
        detail: bs.description || "Dịch vụ tiêu chuẩn 5 sao Sen Việt",
        price: bs.price || 0,
        unit: bs.unit || "lượt",
      }));
    }
    return services;
  }, [backendServices]);

  const concreteStays = useMemo<ConcreteStay[]>(
    () =>
      selections.flatMap((selection) =>
        selectionStays(selection).map((stay) => ({ selection, stay })),
      ),
    [selections],
  );
  const filteredServices = availableServices.filter(
    (service) => service.category === activeCategory,
  );

  const handleRemoveRoom = (
    roomId: string,
    stayIndex: number,
    roomCode?: string,
  ) => {
    setSelections((current) => {
      const next: RoomSelection[] = [];
      for (const sel of current) {
        if (sel.roomId !== roomId) {
          next.push(sel);
          continue;
        }
        if (sel.quantity <= 1) {
          continue;
        }
        const nextQty = sel.quantity - 1;
        const nextStays = sel.stays
          ? sel.stays.filter((_, i) => i !== stayIndex)
          : undefined;
        const nextGuestForms = (sel.guestForms || []).filter(
          (_, i) => i !== stayIndex,
        );
        const nextRoomCodes = (sel.roomCodes || []).filter(
          (_, i) => i !== stayIndex,
        );
        next.push({
          ...sel,
          quantity: nextQty,
          stays: nextStays,
          guestForms: nextGuestForms,
          roomCodes: nextRoomCodes,
        });
      }
      return next;
    });

    setTimeout(() => {
      setSelections((latest) => {
        const remainingStays = latest.flatMap((s) => selectionStays(s));
        if (remainingStays.length > 0) {
          if (!remainingStays.some((s) => s.roomCode === activeRoomCode)) {
            setActiveRoomCode(remainingStays[0].roomCode);
          }
        } else {
          setActiveRoomCode("");
        }
        return latest;
      });
    }, 0);
  };

  const updateService = (
    roomCode: string,
    service: ServiceCatalogItem,
    amount: number,
  ) => {
    setSelections((current) =>
      current.map((selection) => {
        const stays = selectionStays(selection).map((stay) => {
          if (stay.roomCode !== roomCode) return stay;
          const currentQuantity = stayServiceQuantity(stay, service.id);
          const quantity = Math.max(0, currentQuantity + amount);
          const nextServices = (stay.services || []).filter(
            (item) => item.id !== service.id,
          );
          if (quantity > 0) {
            nextServices.push({
              id: service.id,
              name: service.name,
              category: service.category,
              quantity,
              unitPrice: service.price,
              total: service.price * quantity,
              roomCode: stay.roomCode,
              roomName: selection.roomNameVi,
            });
          }
          return { ...stay, services: nextServices };
        });
        return { ...selection, stays };
      }),
    );
  };

  const roomBreakdowns = concreteStays.map(({ selection, stay }) => {
    const roomPrice = selection.nightlyPrice * Math.max(0, stay.nights);
    const earlySurcharge = calculateEarlyCheckInSurcharge(
      selection.nightlyPrice,
      arrivalTime,
    );
    const lateSurcharge = calculateLateCheckOutSurcharge(
      selection.nightlyPrice,
      departureTime,
    );
    const extraGuestSurcharge =
      Number(stay.extraGuestCharge || 0) * Math.max(0, stay.nights);
    const subtotal =
      roomPrice +
      earlySurcharge +
      lateSurcharge +
      extraGuestSurcharge +
      serviceTotal(stay);
    return {
      selection,
      stay,
      roomPrice,
      earlySurcharge,
      lateSurcharge,
      extraGuestSurcharge,
      subtotal,
    };
  });
  const roomSubtotal = roomBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.roomPrice,
    0,
  );
  const earlySurcharge = roomBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.earlySurcharge,
    0,
  );
  const lateSurcharge = roomBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.lateSurcharge,
    0,
  );
  const extraGuestSurcharge = roomBreakdowns.reduce(
    (sum, breakdown) => sum + breakdown.extraGuestSurcharge,
    0,
  );
  const allServices = roomBreakdowns.flatMap(({ stay }) => stay.services || []);
  const aggregatedServices = allServices.reduce<BookingService[]>(
    (aggregated, service) => {
      const existing = aggregated.find((item) => item.id === service.id);
      if (existing) {
        existing.quantity += service.quantity;
        existing.total += service.total;
      } else {
        aggregated.push({
          ...service,
          roomCode: undefined,
          roomName: undefined,
        });
      }
      return aggregated;
    },
    [],
  );
  const serviceTotalAmount = allServices.reduce(
    (sum, service) => sum + service.total,
    0,
  );
  const total =
    roomSubtotal +
    earlySurcharge +
    lateSurcharge +
    extraGuestSurcharge +
    serviceTotalAmount;
  const activeBreakdown =
    roomBreakdowns.find(({ stay }) => stay.roomCode === activeRoomCode) ||
    roomBreakdowns[0];

  const applyServicesToAllRooms = () => {
    const sourceServices = activeBreakdown?.stay.services || [];
    if (!sourceServices.length) return;
    setSelections((current) =>
      current.map((selection) => ({
        ...selection,
        stays: selectionStays(selection).map((stay) => ({
          ...stay,
          services: sourceServices.map((service) => ({
            ...service,
            roomCode: stay.roomCode,
            roomName: selection.roomNameVi,
          })),
        })),
      })),
    );
  };

  const continueToCheckout = () => {
    if (!roomBreakdowns.length) return;
    const first = roomBreakdowns[0];
    const query = new URLSearchParams({
      hotel: hotel.slug,
      room: first.selection.roomNameVi,
      checkIn: first.stay.checkIn,
      checkOut: first.stay.checkOut,
      nights: String(first.stay.nights),
      rooms: String(roomBreakdowns.length),
      roomPrice: String(first.selection.nightlyPrice),
      surcharge: String(earlySurcharge + lateSurcharge),
      total: String(total),
      promo: params.get("promo") || "",
      roomSelections: JSON.stringify(selections),
      services: JSON.stringify(aggregatedServices),
      arrivalTime,
      departureTime,
    });
    navigate(`/checkout?${query.toString()}`);
  };

  return (
    <main className="container py-8 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <Link
          to={`/hotels/${hotel.slug}?${params.toString()}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại chọn phòng
        </Link>

        <div className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
            Bước 2/3 · Dịch vụ bổ sung
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
            Đặt thêm dịch vụ
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
            Chọn dịch vụ cho từng mã phòng. Hóa đơn bên phải sẽ cập nhật ngay
            theo lựa chọn của bạn.
          </p>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3 border-b border-border pb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Hotel className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold">
                  Dịch vụ theo phòng
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-primary">
                  Chọn dịch vụ cho phòng
                </h2>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">
                Mã phòng đang chọn
              </p>
              <div className="flex gap-2 overflow-x-auto pb-2" role="tablist">
                {roomBreakdowns.map(({ selection, stay }) => {
                  const isActive =
                    stay.roomCode === activeBreakdown?.stay.roomCode;
                  return (
                    <button
                      key={stay.roomCode}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveRoomCode(stay.roomCode)}
                      className={`min-w-[150px] shrink-0 rounded-xl border px-4 py-3 text-left transition ${isActive ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-primary hover:border-primary/50"}`}
                    >
                      <span className="block truncate text-xs font-semibold uppercase tracking-wide opacity-75">
                        {selection.roomNameVi}
                      </span>
                      <span className="mt-1 block font-semibold">
                        {stay.roomCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {activeBreakdown ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-secondary/50 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold">
                      {activeBreakdown.selection.roomNameVi}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-bold text-primary">
                      {activeBreakdown.stay.roomCode}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <p className="text-sm text-muted-foreground">
                      {activeBreakdown.stay.nights} đêm ·{" "}
                      {activeBreakdown.stay.guest.adults} người lớn ·{" "}
                      {activeBreakdown.stay.guest.children} trẻ em
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!activeBreakdown.stay.services?.length}
                      onClick={applyServicesToAllRooms}
                      title="Sao chép các dịch vụ đang chọn sang tất cả phòng"
                    >
                      <Copy className="h-4 w-4" />
                      Áp dụng dịch vụ cho tất cả các phòng
                    </Button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-b border-border">
                  {serviceTabs.map(([category, label]) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeCategory === category ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-primary"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {filteredServices.map((service) => {
                    const quantity = stayServiceQuantity(
                      activeBreakdown.stay,
                      service.id,
                    );
                    const selected = quantity > 0;
                    return (
                      <article
                        key={service.id}
                        className={`overflow-hidden rounded-xl border bg-card transition ${selected ? "border-primary ring-2 ring-primary/15" : "border-border"}`}
                      >
                        <img
                          src={service.image}
                          alt={service.name}
                          className="aspect-[16/9] w-full object-cover"
                        />
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="font-semibold text-primary">
                                {service.name}
                              </h4>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                {service.detail}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-primary">
                              {formatVnd(service.price)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {service.hours} · tính theo {service.unit}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              updateService(
                                activeBreakdown.stay.roomCode,
                                service,
                                selected ? -quantity : 1,
                              )
                            }
                            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold ${selected ? "bg-primary text-primary-foreground" : "border border-primary text-primary"}`}
                          >
                            {selected ? (
                              <>
                                <Check className="h-4 w-4" />
                                Đã thêm · Bỏ dịch vụ
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                                Thêm dịch vụ
                              </>
                            )}
                          </button>
                          {selected && (
                            <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary px-3 py-2 text-xs">
                              <span>Số lượng: {quantity}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  aria-label={`Giảm ${service.name} cho ${activeBreakdown.stay.roomCode}`}
                                  onClick={() =>
                                    updateService(
                                      activeBreakdown.stay.roomCode,
                                      service,
                                      -1,
                                    )
                                  }
                                  className="rounded bg-white p-1 text-primary"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Tăng ${service.name} cho ${activeBreakdown.stay.roomCode}`}
                                  onClick={() =>
                                    updateService(
                                      activeBreakdown.stay.roomCode,
                                      service,
                                      1,
                                    )
                                  }
                                  className="rounded bg-white p-1 text-primary"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-secondary/50 p-4 text-sm text-muted-foreground">
                Chưa có phòng để chọn dịch vụ.
              </p>
            )}
          </section>

          <BookingSummaryPanel
            hotelName={hotel.name}
            selections={selections}
            arrivalTime={arrivalTime}
            departureTime={departureTime}
            onRemoveRoom={handleRemoveRoom}
            cta={
              <Button
                type="button"
                onClick={continueToCheckout}
                className="w-full"
                disabled={!selections.length}
              >
                Tiếp tục đến thanh toán
              </Button>
            }
          />
        </div>
      </div>
    </main>
  );
}
