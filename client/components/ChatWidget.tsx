import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  MessageCircle,
  Send,
  X,
  Loader2,
  Sparkles,
  Building2,
  BedDouble,
  CalendarDays,
  Users,
  ArrowRight,
  QrCode,
  ExternalLink,
  CheckCircle2,
  User as UserIcon,
  Tag,
  Maximize2,
  Minimize2,
  Clock,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useSendChatMessageMutation } from "@/services/chatApi";
import type { ChatMessage as ChatMessageType } from "@/services/chatApi";
import { formatVnd } from "@/data/hotels";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

export interface RoomOptionItem {
  type: string;
  typeName?: string;
  price: number | string;
}

export interface BookingCardData {
  hotelName: string;
  hotelSlug: string;
  roomType?: string;
  roomTypeName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  pricePerNight?: number;
  roomOptions?: RoomOptionItem[];
}

export interface PayOSPaymentData {
  bookingId: string;
  orderId: string | number;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  customerName: string;
  customerPhone: string;
  services?: string;
  promotion?: string;
  totalAmount: number;
  qrCodeUrl: string;
  checkoutUrl: string;
}

export interface HotelReservationData {
  bookingId: string;
  orderId?: string | number;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  customerName: string;
  customerPhone: string;
  services?: string;
  promotion?: string;
  totalAmount: number;
  paymentMethod?: string;
}

function getSlugFromHotelName(name?: string): string {
  if (!name) return "sen-viet-an-nhon";
  const lower = name.toLowerCase();
  if (lower.includes("sài gòn") || lower.includes("sai gon") || lower.includes("hồ chí minh") || lower.includes("tphcm")) {
    return "sen-viet-sai-gon";
  }
  if (lower.includes("hà nội") || lower.includes("ha noi")) {
    return "sen-viet-ha-noi";
  }
  if (lower.includes("đà nẵng") || lower.includes("da nang")) {
    return "sen-viet-da-nang";
  }
  if (lower.includes("nha trang")) {
    return "sen-viet-nha-trang";
  }
  if (lower.includes("đà lạt") || lower.includes("da lat")) {
    return "sen-viet-da-lat";
  }
  if (lower.includes("gò công") || lower.includes("go cong")) {
    return "sen-viet-go-cong";
  }
  if (lower.includes("an nhơn") || lower.includes("an nhon")) {
    return "sen-viet-an-nhon";
  }
  return "sen-viet-an-nhon";
}

function normalizeRoomTypeName(type?: string): string {
  if (!type) return "Phòng Tiêu Chuẩn";
  const upper = type.toUpperCase();
  if (upper.includes("STANDARD")) return "Phòng Tiêu Chuẩn";
  if (upper.includes("DELUXE")) return "Phòng Cao Cấp";
  if (upper.includes("SUITE")) return "Phòng Thượng Hạng";
  if (upper.includes("FAMILY")) return "Phòng Gia Đình";
  return type;
}

function parsePriceNumber(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const numStr = String(val).replace(/[^\d]/g, "");
  return Number(numStr) || 0;
}

/** Tách JSON booking_card hoặc payos_payment nếu bot trả về để hiển thị card tương tác */
function parseBotMessage(rawText: string): {
  cleanText: string;
  bookingCard?: BookingCardData;
  payosPayment?: PayOSPaymentData;
  hotelReservation?: HotelReservationData;
} {
  let cleanText = rawText;
  let bookingCard: BookingCardData | undefined;
  let payosPayment: PayOSPaymentData | undefined;
  let hotelReservation: HotelReservationData | undefined;

  // 1. PayOS payment block
  const payosRegex = /```(?:json)?(?::payos_payment)?\s*(\{[\s\S]*?"(?:checkoutUrl|qrCodeUrl)"[\s\S]*?\})\s*```/;
  const payosMatch = cleanText.match(payosRegex);
  if (payosMatch) {
    try {
      payosPayment = JSON.parse(payosMatch[1]);
      cleanText = cleanText.replace(payosMatch[0], "").trim();
    } catch (e) {
      console.error("Failed to parse payos_payment", e);
    }
  }

  // 1.5 Hotel Reservation block (Thanh toán tại quầy lễ tân)
  const resRegex = /```(?:json)?(?::hotel_reservation)?\s*(\{[\s\S]*?"paymentMethod"[\s\S]*?\})\s*```/;
  const resMatch = cleanText.match(resRegex);
  if (resMatch) {
    try {
      hotelReservation = JSON.parse(resMatch[1]);
      cleanText = cleanText.replace(resMatch[0], "").trim();
    } catch (e) {
      console.error("Failed to parse hotel_reservation", e);
    }
  }

  // 2. Booking card block (bắt linh hoạt: có tag booking_card hoặc có hotel/hotelSlug/rooms)
  const bookingRegex = /```(?:json)?(?::booking_card)?\s*(\{[\s\S]*?(?:"hotel"|"hotelSlug"|"hotelName")[\s\S]*?\})\s*```/;
  const bookingMatch = cleanText.match(bookingRegex);
  if (bookingMatch) {
    try {
      const parsed = JSON.parse(bookingMatch[1]);
      const hotelName = parsed.hotelName || parsed.hotel || "Khách sạn Sen Việt";
      const hotelSlug = parsed.hotelSlug || getSlugFromHotelName(hotelName);
      const checkInDate = parsed.checkInDate || parsed.checkIn || "";
      const checkOutDate = parsed.checkOutDate || parsed.checkOut || "";

      // Parse room options if present
      let roomOptions: RoomOptionItem[] | undefined;
      if (Array.isArray(parsed.rooms)) {
        roomOptions = parsed.rooms.map((r: any) => ({
          type: r.type || "DELUXE",
          typeName: r.typeName || normalizeRoomTypeName(r.type),
          price: parsePriceNumber(r.price),
        }));
      }

      const primaryRoomType = parsed.roomType || (roomOptions && roomOptions[0]?.type) || "DELUXE";
      const primaryPrice = parsed.pricePerNight
        ? parsePriceNumber(parsed.pricePerNight)
        : roomOptions && roomOptions[0]?.price
        ? parsePriceNumber(roomOptions[0].price)
        : undefined;

      bookingCard = {
        hotelName,
        hotelSlug,
        checkInDate,
        checkOutDate,
        roomType: primaryRoomType,
        roomTypeName: parsed.roomTypeName || normalizeRoomTypeName(primaryRoomType),
        adults: parsed.adults || 2,
        children: parsed.children || 0,
        rooms: typeof parsed.rooms === "number" ? parsed.rooms : 1,
        pricePerNight: primaryPrice,
        roomOptions,
      };

      cleanText = cleanText.replace(bookingMatch[0], "").trim();
    } catch (e) {
      console.error("Failed to parse booking_card", e);
    }
  }

  // 3. Xử lý triệt để trường hợp JSON bị ngắt cụt ở cuối tin nhắn (unclosed code fence)
  const unclosedBookingMatch = cleanText.match(/```(?:json)?(?::\w+)?\s*\{[\s\S]*$/);
  if (unclosedBookingMatch) {
    if (!bookingCard) {
      const rawJsonPart = unclosedBookingMatch[0];
      const hotelMatch = rawJsonPart.match(/"hotel(?:Name)?"\s*:\s*"([^"]+)"/);
      const checkInMatch = rawJsonPart.match(/"checkIn(?:Date)?"\s*:\s*"([^"]+)"/);
      const checkOutMatch = rawJsonPart.match(/"checkOut(?:Date)?"\s*:\s*"([^"]+)"/);

      if (hotelMatch) {
        const hotelName = hotelMatch[1];
        const hotelSlug = getSlugFromHotelName(hotelName);
        bookingCard = {
          hotelName,
          hotelSlug,
          checkInDate: checkInMatch ? checkInMatch[1] : "",
          checkOutDate: checkOutMatch ? checkOutMatch[1] : "",
          roomType: "DELUXE",
          roomTypeName: "Phòng Cao Cấp",
          adults: 2,
          children: 0,
          rooms: 1,
        };
      }
    }
    // Xóa ngay lập tức phần code dở dang bị cắt cụt này khỏi tin nhắn chữ
    cleanText = cleanText.replace(unclosedBookingMatch[0], "").trim();
  }

  // 4. Cơ chế bảo vệ tuyệt đối: Xóa bất kỳ khối code markdown kỹ thuật nào còn sót lại
  cleanText = cleanText.replace(/```(?:json)?(?::\w+)?[\s\S]*?```/g, "").trim();
  cleanText = cleanText.replace(/```[\s\S]*$/g, "").trim();

  return { cleanText, bookingCard, payosPayment };
}

const CHAT_OPEN_EVENT = "senviet:open-chat";

export function openChatWidget() {
  window.dispatchEvent(new Event(CHAT_OPEN_EVENT));
}

/** Simple markdown-like formatting: **bold**, bullet points, line breaks */
function formatReply(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\s*[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-1 space-y-0.5">$&</ul>')
    .replace(/\n/g, "<br/>");
}

export default function ChatWidget() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const historyRef = useRef<ChatMessageType[]>([]);

  const [sendChatMessage] = useSendChatMessageMutation();

  // Initialize greeting
  useEffect(() => {
    setMessages([{ id: 1, from: "bot", text: t("ai.widgetGreeting") }]);
  }, [t]);

  // Listen for external open events
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      // Add user message to UI
      const userMsg: Message = { id: Date.now(), from: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      // Add to history for context
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: text },
      ].slice(-10); // Keep last 10 messages

      try {
        const result = await sendChatMessage({
          message: text,
          sessionId: sessionIdRef.current,
          history: historyRef.current.slice(0, -1), // Exclude current message (sent in 'message' field)
        }).unwrap();

        const reply = result.result?.reply || t("ai.genericReply");

        // Add bot reply to UI
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, from: "bot", text: reply },
        ]);

        // Update session ID from server
        if (result.result?.sessionId) {
          sessionIdRef.current = result.result.sessionId;
        }

        // Add bot reply to history
        historyRef.current = [
          ...historyRef.current,
          { role: "model", content: reply },
        ].slice(-10);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            from: "bot",
            text: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau giây lát nhé! 🙏",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, sendChatMessage, t],
  );

  const quickReplies = [
    t("ai.quickBook"),
    t("ai.quickOffer"),
    t("ai.quickLocation"),
    t("ai.quickSupport"),
  ];

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="AI assistant"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg shadow-black/20 transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 ease-in-out ${
            isExpanded
              ? "bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[48rem] md:w-[56rem] lg:w-[62rem] h-[93vh] max-h-[58rem]"
              : "bottom-24 right-5 w-[26rem] max-w-[calc(100vw-2rem)] sm:w-[28rem] h-[35rem] max-h-[82vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-sm">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <div className="text-base font-semibold leading-tight flex items-center gap-2">
                  <span>{t("ai.widgetTitle")}</span>
                  {isExpanded && (
                    <span className="hidden sm:inline-block rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-medium text-gold">
                      Chế độ mở rộng
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-80">Powered by Google Gemini AI</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="rounded-full p-1.5 text-primary-foreground/80 transition hover:bg-white/10 hover:text-white"
                title={isExpanded ? "Thu nhỏ về góc" : "Phóng to cửa sổ chat để đọc thoải mái hơn"}
              >
                {isExpanded ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-primary-foreground/80 transition hover:bg-white/10 hover:text-white"
                title="Đóng chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className={`flex-1 space-y-3.5 overflow-y-auto leading-relaxed transition-all ${
              isExpanded ? "px-6 py-5 text-[15px]" : "px-4 py-3.5 text-[14.5px]"
            }`}
          >
            {messages.map((m) => {
              if (m.from === "user") {
                return (
                  <div
                    key={m.id}
                    className={`ml-auto rounded-2xl bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm ${
                      isExpanded ? "max-w-[70%]" : "max-w-[88%]"
                    }`}
                  >
                    {m.text}
                  </div>
                );
              }

              // Bot message: parse text & optional booking card / payos payment / hotel reservation
              const { cleanText, bookingCard, payosPayment, hotelReservation } = parseBotMessage(m.text);

              return (
                <div
                  key={m.id}
                  className={`rounded-2xl bg-secondary px-3.5 py-2.5 text-secondary-foreground shadow-sm ${
                    isExpanded ? "max-w-[75%]" : "max-w-[88%]"
                  }`}
                >
                  {cleanText && (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert [&_li]:my-0.5 [&_ul]:my-1.5 [&_p]:my-1"
                      dangerouslySetInnerHTML={{ __html: formatReply(cleanText) }}
                    />
                  )}

                  {/* THẺ XÁC NHẬN GIỮ PHÒNG TẠI QUẦY */}
                  {hotelReservation && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-blue-500/50 bg-card p-4 shadow-lg">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          <CheckCircle2 className="h-4 w-4" /> Phiếu giữ phòng tại quầy
                        </span>
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          Mã #{hotelReservation.orderId || hotelReservation.bookingId}
                        </span>
                      </div>

                      <div className={isExpanded ? "mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground" : "mt-2.5 space-y-1.5 text-xs text-muted-foreground"}>
                        <div className="flex items-center gap-1.5 font-semibold text-primary">
                          <Building2 className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span className="truncate">{hotelReservation.hotelName}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <BedDouble className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span className="font-medium text-foreground">{hotelReservation.roomName}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span>{hotelReservation.checkIn} ➔ {hotelReservation.checkOut}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <UserIcon className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span>{hotelReservation.customerName} · {hotelReservation.customerPhone}</span>
                        </div>

                        {hotelReservation.services && (
                          <div className="flex items-center gap-1.5 text-[11.5px]">
                            <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>Dịch vụ: <strong className="text-foreground">{hotelReservation.services}</strong></span>
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between rounded-lg bg-blue-500/10 px-2.5 py-1.5 sm:col-span-2">
                          <span className="text-xs font-medium text-foreground">Thanh toán khi nhận phòng:</span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatVnd(hotelReservation.totalAmount)}
                          </span>
                        </div>

                        <div className="mt-2 rounded-lg bg-muted/60 p-2 text-[11px] text-muted-foreground sm:col-span-2">
                          📌 Quý khách vui lòng thanh toán trực tiếp tại quầy lễ tân khi làm thủ tục check-in lúc 14:00 ngày nhận phòng.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* THẺ THANH TOÁN PAYOS / VIETQR (AI AGENT CREATED BOOKING) */}
                  {payosPayment && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-emerald-500/50 bg-card p-4 shadow-lg">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          <Clock className="h-4 w-4" /> Đơn giữ chỗ tạm thời (15 phút)
                        </span>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Mã #{payosPayment.orderId || payosPayment.bookingId}
                        </span>
                      </div>

                      <div className={isExpanded ? "mt-3 grid grid-cols-1 sm:grid-cols-2 gap-5 items-center" : "mt-2.5 space-y-1.5 text-xs text-muted-foreground"}>
                        {/* Thông tin phòng & khách */}
                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-semibold text-primary">
                            <Building2 className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span className="truncate">{payosPayment.hotelName}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <BedDouble className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span className="font-medium text-foreground">{payosPayment.roomName}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>{payosPayment.checkIn} ➔ {payosPayment.checkOut}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>{payosPayment.customerName} · {payosPayment.customerPhone}</span>
                          </div>

                          {payosPayment.services && (
                            <div className="flex items-center gap-1.5 text-[11.5px]">
                              <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                              <span>Dịch vụ thêm: <strong className="text-foreground">{payosPayment.services}</strong></span>
                            </div>
                          )}

                          {payosPayment.promotion && (
                            <div className="flex items-center gap-1.5 text-[11.5px]">
                              <Tag className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span>Ưu đãi: <strong className="text-emerald-600 dark:text-emerald-400">{payosPayment.promotion}</strong></span>
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-1.5">
                            <span className="text-xs font-medium text-foreground">Tổng thanh toán:</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {formatVnd(payosPayment.totalAmount)}
                            </span>
                          </div>

                          {payosPayment.checkoutUrl && (
                            <div className="mt-2.5">
                              <Button
                                asChild
                                size="sm"
                                className="w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
                              >
                                <a href={payosPayment.checkoutUrl} target="_blank" rel="noopener noreferrer">
                                  Mở cổng thanh toán PayOS <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* QR Code PayOS */}
                        {payosPayment.qrCodeUrl && (
                          <div className="text-center">
                            <div className="inline-block rounded-xl border-2 border-dashed border-emerald-500/40 bg-white p-2 shadow-inner">
                              <img
                                src={
                                  payosPayment.qrCodeUrl.startsWith("http")
                                    ? payosPayment.qrCodeUrl
                                    : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payosPayment.qrCodeUrl)}`
                                }
                                alt="Mã QR PayOS"
                                className="h-44 w-44 object-contain mx-auto"
                              />
                            </div>
                            <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                              <QrCode className="h-3.5 w-3.5 text-emerald-500" /> Quét mã bằng ứng dụng ngân hàng bất kỳ
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* THẺ ĐẶT PHÒNG TƯƠNG TÁC (AI AGENT ACTION CARD) */}
                  {bookingCard && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-gold/40 bg-card p-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold">
                          <Sparkles className="h-3.5 w-3.5 fill-gold text-gold" /> Thẻ đặt phòng nhanh
                        </span>
                        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold">
                          AI Agent
                        </span>
                      </div>

                      <div className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-semibold text-primary">
                          <Building2 className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span className="truncate">{bookingCard.hotelName || "Khách sạn Sen Việt"}</span>
                        </div>

                        {(bookingCard.checkInDate || bookingCard.checkOutDate) && (
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>
                              {bookingCard.checkInDate || "Hôm nay"} ➔ {bookingCard.checkOutDate || "Ngày mai"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Nếu AI trả về danh sách nhiều loại phòng (như khi hỏi phòng còn trống): hiển thị danh sách chọn nhanh */}
                      {bookingCard.roomOptions && bookingCard.roomOptions.length > 0 ? (
                        <div className="mt-3 space-y-2 border-t border-border/50 pt-2.5">
                          <p className="text-[11px] font-medium text-foreground">Chọn hạng phòng để đặt nhanh:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {bookingCard.roomOptions.map((opt) => (
                              <div
                                key={opt.type}
                                className="flex items-center justify-between rounded-lg border border-border/70 bg-card/70 p-2.5 shadow-sm transition hover:border-gold/60"
                              >
                                <div>
                                  <div className="font-semibold text-xs text-primary flex items-center gap-1.5">
                                    <BedDouble className="h-3.5 w-3.5 text-gold" />
                                    <span>{opt.typeName || opt.type}</span>
                                  </div>
                                  <div className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {typeof opt.price === "number" ? formatVnd(opt.price) : opt.price}
                                    <span className="text-[10px] font-normal text-muted-foreground"> / đêm</span>
                                  </div>
                                </div>
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-7 rounded-lg bg-gold px-3 text-xs font-semibold text-gold-foreground shadow-sm hover:bg-gold/90"
                                >
                                  <Link
                                    to={`/hotels/${bookingCard.hotelSlug}?roomType=${opt.type}&checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&adults=${bookingCard.adults || 2}&children=${bookingCard.children || 0}&rooms=${bookingCard.rooms || 1}`}
                                    onClick={() => setOpen(false)}
                                  >
                                    Đặt ngay <ArrowRight className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Thẻ đơn lẻ 1 loại phòng */
                        <>
                          <div className={isExpanded ? "mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground" : "mt-2.5 space-y-1.5 text-xs text-muted-foreground"}>
                            <div className="flex items-center gap-1.5">
                              <BedDouble className="h-3.5 w-3.5 text-gold shrink-0" />
                              <span className="font-medium text-foreground">
                                {bookingCard.roomTypeName || bookingCard.roomType || "Phòng tiêu chuẩn"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-gold shrink-0" />
                              <span>
                                {bookingCard.adults || 2} người lớn
                                {bookingCard.children ? ` · ${bookingCard.children} trẻ em` : ""}
                                {bookingCard.rooms ? ` · ${bookingCard.rooms} phòng` : ""}
                              </span>
                            </div>

                            {bookingCard.pricePerNight && (
                              <div className={`mt-2 flex items-center justify-between border-t border-border/50 pt-2 ${isExpanded ? "sm:col-span-2" : ""}`}>
                                <span className="text-muted-foreground">Giá tham khảo:</span>
                                <span className="text-sm font-bold text-primary">
                                  {formatVnd(bookingCard.pricePerNight)}
                                  <span className="text-[10px] font-normal text-muted-foreground"> / đêm</span>
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3">
                            <Button
                              asChild
                              size="sm"
                              className="w-full rounded-xl bg-gold font-semibold text-gold-foreground shadow-sm hover:bg-gold/90"
                            >
                              <Link
                                to={`/hotels/${bookingCard.hotelSlug || "sen-viet-an-nhon"}?checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&adults=${bookingCard.adults || 2}&children=${bookingCard.children || 0}&rooms=${bookingCard.rooms || 1}`}
                                onClick={() => setOpen(false)}
                              >
                                Tiến hành đặt phòng ngay <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex max-w-[88%] items-center gap-2 rounded-2xl bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-gold" />
                <span className="animate-pulse">Trợ lý AI đang soạn câu trả lời...</span>
              </div>
            )}
          </div>

          {/* Quick replies */}
          <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto border-t border-border bg-muted/30 px-3 py-2">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={isTyping}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-gold hover:text-primary disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              disabled={isTyping}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-50"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={isTyping || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
