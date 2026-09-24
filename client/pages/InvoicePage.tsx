import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  Printer,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatVnd, hotels } from "@/data/hotels";
import { getBookings } from "@/lib/bookings";
import { useAuth } from "@/lib/auth";

interface RoomStayCard {
  roomCode: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsText: string;
  roomRate: number;
  roomTotal: number;
  extraGuestCharge: number;
  services: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totalForRoom: number;
}

export default function InvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Tìm booking từ localStorage nếu có, hoặc tạo dữ liệu mẫu chuẩn theo đúng mockup
  const foundBooking = useMemo(() => {
    if (!id) return null;
    const all = getBookings();
    return (
      all.find(
        (b) =>
          String(b.id) === String(id) ||
          String(b.id) === id.replace(/^SV-/, "")
      ) || null
    );
  }, [id]);

  // Thông tin hiển thị hóa đơn
  const invoiceData = useMemo(() => {
    const isMock = !foundBooking;

    // 1. Tên khách, SĐT, Email
    const customerName =
      foundBooking?.guestName || user?.name || "Nguyễn Văn A";
    const customerPhone =
      foundBooking?.phone || user?.phone || "0912 345 678";
    const customerEmail =
      foundBooking?.email || user?.email || "nguyen.vana@example.com";

    // 2. Khách sạn & Chi nhánh
    const hotelObj = foundBooking
      ? hotels.find(
          (h) =>
            h.slug === foundBooking.hotelSlug ||
            h.name === foundBooking.hotelName
        )
      : null;
    const hotelName = "Sen Việt Hotels & Resorts";
    const branchName = foundBooking
      ? `${foundBooking.hotelName || hotelObj?.name || "Sen Việt An Nhơn"} · ${
          hotelObj?.province || "An Nhơn, Bình Định"
        }`
      : "Sen Việt An Nhơn · An Nhơn, Bình Định";
    const hotelPhone = "1900 8888 · www.senviet.vn";

    // 3. Mã đặt phòng & Số hóa đơn
    const bookingCode = foundBooking
      ? String(foundBooking.id).replace(/^SV-/, "")
      : id ? id.replace(/^SV-/, "") : "3";
    const invoiceNo = `HD-2026-${bookingCode}`;

    // 4. Danh sách các phòng (Room Stay Cards)
    const roomStays: RoomStayCard[] = [];

    if (foundBooking) {
      if (
        foundBooking.roomSelections &&
        foundBooking.roomSelections.length > 0
      ) {
        foundBooking.roomSelections.forEach((sel) => {
          if (sel.stays && sel.stays.length > 0) {
            sel.stays.forEach((stay) => {
              const stayNights = Math.max(1, stay.nights || foundBooking.nights || 1);
              const nightlyRate = stay.nightlyPrice || sel.nightlyPrice;
              const roomPrice = nightlyRate * stayNights;
              const extraCharge =
                Number(stay.extraGuestCharge || 0) * stayNights;
              const srvs = (stay.services || []).map((s) => ({
                name: s.name,
                quantity: s.quantity || 1,
                unitPrice: s.unitPrice || s.total,
                total: s.total || (s.quantity || 1) * (s.unitPrice || 0),
              }));
              const srvsTotal = srvs.reduce((acc, s) => acc + s.total, 0);
              const totalForRoom = roomPrice + extraCharge + srvsTotal;

              roomStays.push({
                roomCode: stay.roomCode || "P.101",
                roomName: sel.roomNameVi || sel.roomName || "Phòng nghỉ dưỡng",
                checkIn: stay.checkIn || foundBooking.checkIn,
                checkOut: stay.checkOut || foundBooking.checkOut,
                nights: stayNights,
                guestsText: `${stay.guest?.adults || 1} người lớn${
                  stay.guest?.children ? `, ${stay.guest.children} trẻ em` : ""
                }`,
                roomRate: nightlyRate,
                roomTotal: roomPrice,
                extraGuestCharge: extraCharge,
                services: srvs,
                totalForRoom,
              });
            });
          } else {
            // Trường hợp không có stays chi tiết, chia theo roomCodes hoặc quantity
            const codes =
              sel.roomCodes && sel.roomCodes.length > 0
                ? sel.roomCodes
                : Array.from(
                    { length: sel.quantity || 1 },
                    (_, i) => `Phòng ${i + 1}`
                  );
            const stayNights = Math.max(1, sel.nights || foundBooking.nights || 1);
            const nightlyRate = sel.nightlyPrice;
            const roomPrice = nightlyRate * stayNights;

            codes.forEach((code, idx) => {
              const extraCharge =
                idx === 0
                  ? Number(foundBooking.extraGuestCharge || 0)
                  : 0;
              const srvs =
                idx === 0
                  ? (foundBooking.services || []).map((s) => ({
                      name: s.name,
                      quantity: s.quantity || 1,
                      unitPrice: s.unitPrice || s.total,
                      total: s.total,
                    }))
                  : [];
              const srvsTotal = srvs.reduce((acc, s) => acc + s.total, 0);
              const totalForRoom = roomPrice + extraCharge + srvsTotal;

              roomStays.push({
                roomCode: code,
                roomName: sel.roomNameVi || sel.roomName || "Phòng nghỉ dưỡng",
                checkIn: foundBooking.checkIn,
                checkOut: foundBooking.checkOut,
                nights: stayNights,
                guestsText: `${
                  sel.guestForms?.[idx]?.adults || 1
                } người lớn${
                  sel.guestForms?.[idx]?.children
                    ? `, ${sel.guestForms[idx].children} trẻ em`
                    : ""
                }`,
                roomRate: nightlyRate,
                roomTotal: roomPrice,
                extraGuestCharge: extraCharge,
                services: srvs,
                totalForRoom,
              });
            });
          }
        });
      } else {
        // Single room fallback
        const stayNights = Math.max(1, foundBooking.nights || 1);
        const nightlyRate =
          foundBooking.roomPrice ||
          Math.round(foundBooking.roomTotal / stayNights);
        const roomPrice = foundBooking.roomTotal;
        const extraCharge = Number(foundBooking.extraGuestCharge || 0);
        const srvs = (foundBooking.services || []).map((s) => ({
          name: s.name,
          quantity: s.quantity || 1,
          unitPrice: s.unitPrice || s.total,
          total: s.total,
        }));
        const srvsTotal = srvs.reduce((acc, s) => acc + s.total, 0);
        const totalForRoom = roomPrice + extraCharge + srvsTotal;

        roomStays.push({
          roomCode: "1-A-05",
          roomName: foundBooking.roomName || "Phòng Tiêu Chuẩn",
          checkIn: foundBooking.checkIn,
          checkOut: foundBooking.checkOut,
          nights: stayNights,
          guestsText: "2 người lớn",
          roomRate: nightlyRate,
          roomTotal: roomPrice,
          extraGuestCharge: extraCharge,
          services: srvs,
          totalForRoom,
        });
      }
    } else {
      // Mock data chuẩn theo chính xác hình ảnh user đã gửi (media_1789804337098.png)
      roomStays.push(
        {
          roomCode: "1-A-05",
          roomName: "Phòng Tiêu Chuẩn",
          checkIn: "23/09",
          checkOut: "25/09/2026",
          nights: 2,
          guestsText: "1 người lớn",
          roomRate: 700000,
          roomTotal: 1400000,
          extraGuestCharge: 0,
          services: [
            { name: "Basil", quantity: 1, unitPrice: 350000, total: 350000 },
            { name: "Peppercorns", quantity: 1, unitPrice: 450000, total: 450000 },
            { name: "Cilantro", quantity: 1, unitPrice: 200000, total: 200000 },
          ],
          totalForRoom: 2400000,
        },
        {
          roomCode: "1-A-06",
          roomName: "Phòng Cao Cấp",
          checkIn: "23/09",
          checkOut: "25/09/2026",
          nights: 2,
          guestsText: "1 người lớn",
          roomRate: 1000000,
          roomTotal: 2000000,
          extraGuestCharge: 0,
          services: [
            { name: "Basil", quantity: 1, unitPrice: 350000, total: 350000 },
            { name: "Peppercorns", quantity: 1, unitPrice: 450000, total: 450000 },
            { name: "Cilantro", quantity: 1, unitPrice: 250000, total: 250000 },
            { name: "Daffodil", quantity: 1, unitPrice: 1800000, total: 1800000 },
          ],
          totalForRoom: 4850000,
        },
        {
          roomCode: "1-A-07",
          roomName: "Phòng Thượng Hạng",
          checkIn: "27/09",
          checkOut: "30/09/2026",
          nights: 3,
          guestsText: "1 người lớn",
          roomRate: 2000000,
          roomTotal: 6000000,
          extraGuestCharge: 0,
          services: [
            { name: "Basil", quantity: 1, unitPrice: 350000, total: 350000 },
            { name: "Peppercorns", quantity: 1, unitPrice: 450000, total: 450000 },
            { name: "Cilantro", quantity: 1, unitPrice: 250000, total: 250000 },
            { name: "Grand Hall", quantity: 1, unitPrice: 5000000, total: 5000000 },
          ],
          totalForRoom: 13550000,
        }
      );
    }

    // 5. Tính toán tài chính tổng hợp
    const roomsCount = roomStays.length;
    const roomsCountText = `${roomsCount} phòng`;

    // Tính tổng số lượng khách
    let totalAdults = 0;
    let totalChildren = 0;
    if (foundBooking?.roomSelections?.length) {
      foundBooking.roomSelections.forEach((s) => {
        if (s.stays?.length) {
          s.stays.forEach((st) => {
            totalAdults += st.guest?.adults || 1;
            totalChildren += st.guest?.children || 0;
          });
        } else if (s.guestForms?.length) {
          s.guestForms.forEach((gf) => {
            totalAdults += gf.adults || 1;
            totalChildren += gf.children || 0;
          });
        }
      });
    }
    const guestsText =
      totalAdults > 0
        ? `${totalAdults} người lớn${
            totalChildren > 0 ? `, ${totalChildren} trẻ em` : ""
          }`
        : "3 người lớn";

    // Tạm tính (tổng tiền các phòng và dịch vụ)
    const computedSubTotal = roomStays.reduce(
      (sum, r) => sum + r.totalForRoom,
      0
    );
    const subTotal = isMock ? 24950000 : computedSubTotal;
    const discount = foundBooking ? foundBooking.discount || 0 : 0;
    const promoCode =
      foundBooking && discount > 0 ? "ƯU ĐÃI THÀNH VIÊN" : "";
    const vat = isMock
      ? 1996000
      : foundBooking?.vat || Math.round((subTotal - discount) * 0.08);
    const totalAmount = isMock
      ? 26946000
      : foundBooking?.total || subTotal - discount + vat;

    const isPaidInFull = foundBooking
      ? foundBooking.status === "confirmed" ||
        foundBooking.status === "completed"
      : true;
    const depositAmount = isPaidInFull ? totalAmount : 0;
    const remainingAmount = Math.max(0, totalAmount - depositAmount);

    const paymentMethodText =
      foundBooking?.paymentMethod === "qr"
        ? "Chuyển khoản ngân hàng (Vietcombank QR)"
        : foundBooking?.paymentMethod === "vnpay"
        ? "VNPAY QR / Thẻ ATM"
        : foundBooking?.paymentMethod === "momo"
        ? "Ví điện tử MoMo"
        : "Chuyển khoản ngân hàng (Vietcombank QR)";

    const createdDate = foundBooking?.createdAt
      ? new Date(foundBooking.createdAt).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "14:23 19/09/2026";

    return {
      hotelName,
      branchName,
      hotelPhone,
      invoiceNo,
      bookingCode,
      customerName,
      customerPhone,
      customerEmail,
      roomsCountText,
      guestsText,
      roomStays,
      subTotal,
      discount,
      promoCode,
      vat,
      totalAmount,
      depositAmount,
      remainingAmount,
      paymentMethod: paymentMethodText,
      createdDate,
      symbolCode: "1C26MSV",
      isPaidInFull,
    };
  }, [foundBooking, id, user]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const prevTitle = document.title;
    document.title = `${invoiceData.invoiceNo}_SenViet`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 sm:py-10 text-slate-800 print:bg-white print:p-0">
      {/* Top Action Bar */}
      <div className="mx-auto mb-5 max-w-2xl px-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/bookings")}
            className="text-xs text-slate-600 hover:bg-white hover:text-primary gap-1.5 px-3 py-1.5 h-auto rounded-lg font-medium shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Lịch sử đặt phòng
          </Button>

          {/* 2 nút riêng biệt: In hóa đơn & Tải PDF */}
          <div className="flex items-center gap-2.5">
            {/* Nút 1: In hóa đơn */}
            <Button
              onClick={handlePrint}
              variant="outline"
              className="h-auto px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition gap-2 shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              In hóa đơn
            </Button>

            {/* Nút 2: Tải PDF */}
            <Button
              onClick={handleDownloadPdf}
              className="h-auto px-4 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition gap-1.5 shadow-xs"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Tải PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Invoice Card (Nền trắng đồng bộ với giao diện web Sen Việt) */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm print:max-w-none print:border-none print:p-0 print:shadow-none">
        
        {/* ================= KHỐI HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Bên trái: Tên Khách sạn, Chi nhánh & Liên hệ */}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-primary font-display">
              {invoiceData.hotelName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {invoiceData.branchName}
            </p>
            <p className="text-xs text-slate-500">
              {invoiceData.hotelPhone}
            </p>
          </div>

          {/* Bên phải: Tiêu đề hóa đơn, Mã số & Trạng thái */}
          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              HÓA ĐƠN DỊCH VỤ LƯU TRÚ
            </p>
            <p className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
              {invoiceData.invoiceNo}
            </p>
            <div className="mt-1">
              <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                {invoiceData.isPaidInFull
                  ? "Đã thanh toán toàn bộ"
                  : "Chờ thanh toán"}
              </span>
            </div>
          </div>
        </div>

        {/* ================= THÔNG TIN KHÁCH HÀNG & MÃ ĐẶT PHÒNG ================= */}
        <div className="my-5 border-y border-slate-200 bg-slate-50/70 rounded-xl py-3 px-3.5 text-xs flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600">
          <div>
            <span>Khách hàng</span>{" "}
            <strong className="text-slate-900 font-bold ml-1">
              {invoiceData.customerName}
            </strong>
          </div>
          <div>
            <span>SĐT</span>{" "}
            <strong className="text-slate-900 font-bold ml-1">
              {invoiceData.customerPhone}
            </strong>
          </div>
          <div>
            <span>Mã đặt phòng</span>{" "}
            <strong className="text-primary font-bold ml-1 font-mono">
              #{invoiceData.bookingCode}
            </strong>
          </div>
          <div>
            <span>Số phòng</span>{" "}
            <strong className="text-slate-900 font-bold ml-1">
              {invoiceData.roomsCountText}
            </strong>
          </div>
          <div className="w-full sm:w-auto">
            <span>Khách</span>{" "}
            <strong className="text-slate-900 font-bold ml-1">
              {invoiceData.guestsText}
            </strong>
          </div>
        </div>

        {/* ================= CHI TIẾT THEO PHÒNG ================= */}
        <div className="mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            CHI TIẾT THEO PHÒNG
          </h2>

          <div className="space-y-3.5">
            {invoiceData.roomStays.map((room, rIdx) => (
              <div
                key={rIdx}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 shadow-xs hover:border-slate-300 transition"
              >
                {/* Header từng phòng */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-white font-mono">
                        {room.roomCode}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {room.roomName}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Nhận <strong className="text-slate-800">{room.checkIn}</strong> — Trả{" "}
                      <strong className="text-slate-800">{room.checkOut}</strong> ·{" "}
                      {room.nights} đêm · {room.guestsText}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      CỘNG PHÒNG NÀY
                    </span>
                    <span className="text-base font-bold text-primary">
                      {formatVnd(room.totalForRoom)}
                    </span>
                  </div>
                </div>

                {/* Các khoản mục tính tiền trong phòng */}
                <div className="border-t border-slate-200/80 pt-2.5 space-y-2 text-xs">
                  {/* Tiền phòng cơ sở */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 font-medium">
                      Tiền phòng
                    </span>
                    <span className="text-slate-500">
                      {room.nights} đêm × {formatVnd(room.roomRate).replace(" đ", "").replace(" ₫", "")}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatVnd(room.roomTotal).replace(" đ", "").replace(" ₫", "")}
                    </span>
                  </div>

                  {/* Phụ thu nếu có */}
                  {room.extraGuestCharge > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-amber-800 font-medium">
                        Phụ thu thêm người
                      </span>
                      <span className="text-slate-500">—</span>
                      <span className="font-semibold text-amber-800">
                        {formatVnd(room.extraGuestCharge).replace(" đ", "").replace(" ₫", "")}
                      </span>
                    </div>
                  )}

                  {/* Các dịch vụ đã dùng */}
                  {room.services.map((srv, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="rounded bg-slate-200 px-1 py-0.5 text-[10px] font-mono text-slate-700 font-semibold">
                          DV
                        </span>
                        <span>{srv.name}</span>
                      </div>
                      <span className="text-slate-500">
                        {srv.quantity} × {formatVnd(srv.unitPrice).replace(" đ", "").replace(" ₫", "")}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {formatVnd(srv.total).replace(" đ", "").replace(" ₫", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= TỔNG KẾT TÀI CHÍNH ================= */}
        <div className="mt-5 space-y-2 text-xs pt-1">
          <div className="flex justify-between text-slate-600">
            <span>Tạm tính ({invoiceData.roomsCountText})</span>
            <span className="font-semibold text-slate-800">
              {formatVnd(invoiceData.subTotal)}
            </span>
          </div>

          {invoiceData.discount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>
                Giảm giá / Ưu đãi ({invoiceData.promoCode || "Thành viên"})
              </span>
              <span>
                -{formatVnd(invoiceData.discount)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>Thuế GTGT (8%)</span>
            <span className="font-semibold text-slate-800">
              {formatVnd(invoiceData.vat)}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm font-bold text-slate-900">
            <span>Tổng thanh toán</span>
            <span className="text-lg text-primary font-display font-bold">
              {formatVnd(invoiceData.totalAmount)}
            </span>
          </div>

          <div className="flex justify-between text-slate-600 text-xs">
            <span>Đã đặt cọc / đã thu</span>
            <span className="font-semibold text-slate-800">
              {formatVnd(invoiceData.depositAmount)}
            </span>
          </div>

          {/* Ô Nổi bật Còn phải thu (Hài hòa theo phong cách web Sen Việt) */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50/80 border border-amber-200/80 px-4 py-3">
            <span className="text-xs font-bold text-amber-950">
              Còn phải thu
            </span>
            <span className="text-base font-bold text-amber-900 font-mono">
              {formatVnd(invoiceData.remainingAmount)}
            </span>
          </div>
        </div>

        {/* ================= KHỐI FOOTER & MÃ QR ================= */}
        <div className="mt-6 border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="space-y-1">
            <p>
              Phương thức:{" "}
              <strong className="text-slate-800 font-semibold">
                {invoiceData.paymentMethod}
              </strong>
            </p>
            <p>
              Thời gian:{" "}
              <strong className="text-slate-800 font-semibold">
                {invoiceData.createdDate}
              </strong>{" "}
              · Ký hiệu:{" "}
              <strong className="text-slate-800 font-semibold font-mono">
                {invoiceData.symbolCode}
              </strong>
            </p>
            <p>
              Mã đặt phòng xác thực:{" "}
              <strong className="text-slate-800 font-semibold font-mono">
                #{invoiceData.bookingCode}
              </strong>
            </p>
          </div>

          {/* Ô Mã QR */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
              <QrCode className="h-full w-full text-slate-700" />
            </div>
            <span className="text-[10px] leading-tight text-slate-500">
              MÃ QR<br />tra cứu
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
