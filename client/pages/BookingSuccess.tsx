import {
  CheckCircle2,
  Clock3,
  Download,
  Hotel as HotelIcon,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/data/hotels";
import {
  calculateEarlyCheckInSurcharge,
  calculateLateCheckOutSurcharge,
  getBookings,
  isRoomSpecificFee,
  type Booking,
} from "@/lib/bookings";

function dateTime(date: string, time: string) {
  return `${time}, ${new Date(`${date}T12:00:00`).toLocaleDateString("vi-VN")}`;
}

export default function BookingSuccess() {
  const { bookingId } = useParams();
  const booking = getBookings().find((item) => item.id === bookingId);
  if (!booking)
    return (
      <main className="container flex min-h-[55vh] items-center justify-center py-16">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-primary">
            Không tìm thấy đơn đặt phòng
          </h1>
          <Button asChild className="mt-5 rounded-full">
            <Link to="/hotels">Quay lại chọn phòng</Link>
          </Button>
        </div>
      </main>
    );
  const pending = booking.status === "pending_payment";
  const roomLines = booking.roomSelections || [];
  const hasRoomServices = roomLines.some((selection) =>
    selection.stays?.some((stay) => stay.services?.length),
  );
  const subtotalBeforeDiscount =
    booking.total - booking.vat - booking.serviceFee + booking.discount;
  const commonFeeLines = (booking.feeLines || []).filter(
    (fee) => !isRoomSpecificFee(fee),
  );
  return (
    <main className="container py-12">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${pending ? "bg-gold/20 text-amber-700" : "bg-emerald-100 text-emerald-600"}`}
          >
            {pending ? (
              <Clock3 className="h-8 w-8" />
            ) : (
              <CheckCircle2 className="h-8 w-8" />
            )}
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[.16em] text-gold">
            Sen Việt booking
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary">
            {pending ? "Đơn đang chờ thanh toán" : "Đặt phòng thành công"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {pending
              ? "Phòng đang được giữ trong 15 phút. Vui lòng hoàn tất thanh toán để xác nhận booking."
              : "Cảm ơn bạn đã lựa chọn Sen Việt Hotels & Resorts."}
          </p>
        </header>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
          <section className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <HotelIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-primary">{booking.hotelName}</p>
                <p className="text-sm text-muted-foreground">
                  Mã booking: {booking.id}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {roomLines.length ? (
                roomLines.flatMap((selection) =>
                  selection.stays?.length ? (
                    selection.stays.map((stay) => (
                      <div
                        key={stay.roomCode}
                        className="rounded-xl bg-secondary/50 p-4 text-sm"
                      >
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-primary">
                            {selection.roomNameVi} · {stay.roomCode}
                          </span>
                          <span>{stay.nights} đêm</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Nhận phòng: {" "}
                          {dateTime(stay.checkIn, booking.arrivalTime || "14:00")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Trả phòng: {" "}
                          {dateTime(
                            stay.checkOut,
                            booking.departureTime || "12:00",
                          )}
                        </p>
                        <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                          <p className="font-semibold text-primary">
                            Tiền phòng: {" "}
                            {formatVnd(
                              selection.nightlyPrice * Math.max(0, stay.nights),
                            )}
                          </p>
                          {calculateEarlyCheckInSurcharge(
                            selection.nightlyPrice,
                            booking.arrivalTime || "14:00",
                          ) > 0 && (
                            <p>
                              Nhận phòng sớm: {" "}
                              {formatVnd(
                                calculateEarlyCheckInSurcharge(
                                  selection.nightlyPrice,
                                  booking.arrivalTime || "14:00",
                                ),
                              )}
                            </p>
                          )}
                          {calculateLateCheckOutSurcharge(
                            selection.nightlyPrice,
                            booking.departureTime || "12:00",
                          ) > 0 && (
                            <p>
                              Trả phòng muộn: {" "}
                              {formatVnd(
                                calculateLateCheckOutSurcharge(
                                  selection.nightlyPrice,
                                  booking.departureTime || "12:00",
                                ),
                              )}
                            </p>
                          )}
                          {Number(stay.extraGuestCharge || 0) *
                            Math.max(0, stay.nights) >
                            0 && (
                            <p>
                              Khách thêm: {" "}
                              {formatVnd(
                                Number(stay.extraGuestCharge || 0) *
                                  Math.max(0, stay.nights),
                              )}
                            </p>
                          )}
                        </div>
                        {stay.services?.length ? (
                          <div className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
                            <p className="font-semibold text-primary">Dịch vụ</p>
                            {stay.services.map((service) => (
                              <p key={service.id}>
                                {service.name} × {service.quantity} · {" "}
                                {formatVnd(service.total)}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div
                      key={selection.roomId}
                      className="rounded-xl bg-secondary/50 p-4 text-sm"
                    >
                      <p className="font-semibold text-primary">
                        {selection.roomNameVi} × {selection.quantity}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Nhận phòng: {" "}
                        {dateTime(
                          selection.checkIn || booking.checkIn,
                          booking.arrivalTime || "14:00",
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Trả phòng: {" "}
                        {dateTime(
                          selection.checkOut || booking.checkOut,
                          booking.departureTime || "12:00",
                        )}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-primary">
                        Tiền phòng: {formatVnd(booking.roomTotal)}
                      </p>
                      {booking.surcharge && booking.surcharge > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Phụ thu giờ: {formatVnd(booking.surcharge)}
                        </p>
                      ) : null}
                      {booking.extraGuestCharge &&
                      booking.extraGuestCharge > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Phụ thu khách thêm: {" "}
                          {formatVnd(booking.extraGuestCharge)}
                        </p>
                      ) : null}
                    </div>
                  ),
                )
              ) : (
                <div className="rounded-xl bg-secondary/50 p-4 text-sm">
                  <p className="font-semibold text-primary">{booking.roomName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nhận phòng: {" "}
                    {dateTime(booking.checkIn, booking.arrivalTime || "14:00")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Trả phòng: {" "}
                    {dateTime(booking.checkOut, booking.departureTime || "12:00")}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-primary">
                    Tiền phòng: {formatVnd(booking.roomTotal)}
                  </p>
                  {booking.surcharge && booking.surcharge > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Phụ thu giờ: {formatVnd(booking.surcharge)}
                    </p>
                  ) : null}
                  {booking.extraGuestCharge && booking.extraGuestCharge > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Phụ thu khách thêm: {formatVnd(booking.extraGuestCharge)}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
            {!hasRoomServices && booking.services?.length ? (
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-semibold text-primary">Dịch vụ đã chọn</p>
                {booking.services.map((service) => (
                  <div
                    key={service.id}
                    className="mt-1 flex justify-between text-sm"
                  >
                    <span>
                      {service.name} × {service.quantity}
                    </span>
                    <span>{formatVnd(service.total)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
          <aside className="rounded-2xl border border-border bg-white p-6 shadow-lg lg:sticky lg:top-6">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-gold">
              Thanh toán
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-primary">
              Chi tiết thanh toán
            </h2>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span>Tạm tính các phòng</span>
                <strong>{formatVnd(subtotalBeforeDiscount)}</strong>
              </div>
              {commonFeeLines.map((fee) => (
                <div
                  key={`${fee.label}-${fee.amount}`}
                  className="flex items-start justify-between gap-3 border-t border-border/70 pt-2"
                >
                  <span>
                    {fee.label}
                    {fee.detail && (
                      <small className="mt-0.5 block text-xs text-muted-foreground">
                        {fee.detail}
                      </small>
                    )}
                  </span>
                  <strong className="shrink-0">{formatVnd(fee.amount)}</strong>
                </div>
              ))}
              <div className="flex justify-between gap-3 border-t border-border/70 pt-2">
                <span>VAT & phí hệ thống</span>
                <strong>{formatVnd(booking.vat + booking.serviceFee)}</strong>
              </div>
              {booking.discount > 0 && (
                <div className="flex justify-between gap-3 text-emerald-700">
                  <span>Giảm giá</span>
                  <strong>-{formatVnd(booking.discount)}</strong>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t-2 border-primary/20 pt-3 text-base font-bold text-primary">
                <span>Tổng thanh toán</span>
                <span>{formatVnd(booking.total)}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild className="rounded-full">
                <Link to={`/bookings?created=${booking.id}`}>
                  Xem lịch sử đặt phòng
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/hotels">
                  <Download className="mr-2 h-4 w-4" />
                  Đặt thêm phòng
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
