import { formatStayDates, formatDisplayDate } from "@/lib/dateTime";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

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

  Mic,

  RotateCcw,

  Headset,

  PhoneCall,

  MessageSquareText,

  AlertTriangle,

  AlertCircle,

  XCircle,

} from "lucide-react";

import { Button } from "@/components/ui/button";

import { toast } from "@/components/ui/use-toast";

import { ToastAction } from "@/components/ui/toast";

import { useLanguage } from "@/lib/i18n";

import { useAuth } from "@/lib/auth";

import { useSendChatMessageMutation, useLazyGetChatHistoryQuery } from "@/services/chatApi";

import type { ChatMessage as ChatMessageType } from "@/services/chatApi";

import { formatVnd, hotels } from "@/data/hotels";
import { AnimatePresence, motion, chatWindowVariants } from "@/components/ui/animate-ui";

import { toLocalDateStr } from "@/lib/utils";

import { sendCustomerChatMessage, initCustomerSocket, checkBranchOnline, type StaffReplyPayload } from "@/lib/socket";

import {

  saveBooking,

  getBookings,

  updateBooking,

  type BookingService,

  type RoomSelection,

  type RoomStay,

} from "@/lib/bookings";



interface Message {

  id: number;

  from: "bot" | "user";

  text: string;

  state?: any;

}



interface StaffMessage {

  id: string | number;

  from: "staff" | "user";

  senderName?: string;

  branchName?: string;

  time: string;

  text: string;

  isRead?: boolean;

}



const SENVIET_ZALO_HOTLINE = "0989809036";

const SENVIET_ZALO_URL = `https://zalo.me/${SENVIET_ZALO_HOTLINE}`;

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";



/**

 * Phát chuông thông báo (Hospitality Chime) bằng Web Audio API

 */

export function playHospitalityChime() {

  try {

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;

    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    if (ctx.state === "suspended") {

      ctx.resume().catch(() => {});

    }

    const now = ctx.currentTime;



    // Nốt thứ 1: D5 (587.33 Hz)

    const osc1 = ctx.createOscillator();

    const gain1 = ctx.createGain();

    osc1.type = "sine";

    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0.2, now);

    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);

    gain1.connect(ctx.destination);

    osc1.start(now);

    osc1.stop(now + 0.35);



    // Nốt thứ 2: A5 (880.00 Hz)

    const osc2 = ctx.createOscillator();

    const gain2 = ctx.createGain();

    osc2.type = "sine";

    osc2.frequency.setValueAtTime(880, now + 0.12);

    gain2.gain.setValueAtTime(0.25, now + 0.12);

    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);

    gain2.connect(ctx.destination);

    osc2.start(now + 0.12);

    osc2.stop(now + 0.6);

  } catch (e) {

    console.warn("Could not play notification chime:", e);

  }

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

  customerName?: string;

  customerPhone?: string;

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



const hotelIdToSlugMap: Record<number, string> = {

  1: "sen-viet-sai-gon",

  2: "sen-viet-ha-noi",

  3: "sen-viet-da-nang",

  4: "sen-viet-nha-trang",

  5: "sen-viet-da-lat",

  6: "sen-viet-go-cong",

  7: "sen-viet-an-nhon",

  8: "sen-viet-quy-nhon",

};



function getSlugFromHotelName(name?: string, id?: number): string {

  if (id && hotelIdToSlugMap[id]) return hotelIdToSlugMap[id];

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

  if (lower.includes("quy nhơn") || lower.includes("quy nhon")) {

    return "sen-viet-quy-nhon";

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

        customerName: parsed.customerName || parsed.name || parsed.fullName || "",

        customerPhone: parsed.customerPhone || parsed.phone || "",

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



  return { cleanText, bookingCard, payosPayment, hotelReservation };

}



const CHAT_OPEN_EVENT = "senviet:open-chat";



export function openChatWidget() {

  window.dispatchEvent(new Event(CHAT_OPEN_EVENT));

}



/** Simple markdown-like formatting: **bold**, bullet points, line breaks */

function escapeHtml(str: string): string {

  return str

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}



function formatShortBranchName(name?: string): string {
  if (!name) return "Toàn hệ thống";
  const lower = name.toLowerCase();
  if (lower.includes("toàn hệ thống") || lower.includes("toan he thong")) return "Toàn hệ thống";
  if (lower.includes("an nhơn") || lower.includes("an nhon")) return "An Nhơn";
  if (lower.includes("quy nhơn") || lower.includes("quy nhon")) return "Quy Nhơn";
  if (lower.includes("đà nẵng") || lower.includes("da nang")) return "Đà Nẵng";
  if (lower.includes("sài gòn") || lower.includes("sai gon") || lower.includes("hcm")) return "Sài Gòn";
  if (lower.includes("hà nội") || lower.includes("ha noi")) return "Hà Nội";
  if (lower.includes("nha trang")) return "Nha Trang";
  if (lower.includes("đà lạt") || lower.includes("da lat")) return "Đà Lạt";
  if (lower.includes("gò công") || lower.includes("go cong")) return "Gò Công";
  return name.length > 15 ? name.slice(0, 15) + "…" : name;
}

function formatReply(text: string): string {
  if (!text) return "";
  const safe = escapeHtml(text.trim());
  const formatted = safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const lines = formatted.split("\n");
  const processed: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const listMatch = trimmed.match(/^[-•*]\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        processed.push('<ul class="my-1.5 space-y-1 list-disc pl-5">');
        inList = true;
      }
      processed.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        processed.push("</ul>");
        inList = false;
      }
      processed.push(trimmed);
    }
  }
  if (inList) {
    processed.push("</ul>");
  }

  const res: string[] = [];
  for (const item of processed) {
    if (item.startsWith("<ul") || item.endsWith("</ul>") || item.startsWith("<li>")) {
      res.push(item);
    } else if (!item) {
      res.push("<br/>");
    } else {
      res.push(`<span>${item}</span><br/>`);
    }
  }

  let output = res.join("");
  while (output.endsWith("<br/>")) {
    output = output.slice(0, -5);
  }
  return output;
}



function getUserStorageKey(email?: string | null): string {

  const raw = email || (typeof window !== "undefined" ? localStorage.getItem("email") : null) || "guest";

  return raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");

}



function getStoredSessionId(sessionKey: string): string {

  try {

    const saved = localStorage.getItem(sessionKey);

    if (saved && saved.trim()) return saved.trim();

    const newId = crypto.randomUUID();

    localStorage.setItem(sessionKey, newId);

    return newId;

  } catch {

    return crypto.randomUUID();

  }

}



function deduplicateMessages(msgs: Message[]): Message[] {

  const seenSuccessBookings = new Set<string>();

  const result: Message[] = [];

  for (const m of msgs) {

    if (m.text.includes("Chúc mừng quý khách") && (m.text.includes("PayOS") || m.text.includes("thanh toán thành công"))) {

      const match = m.text.match(/#([a-zA-Z0-9_-]+)/);

      const code = match ? match[1] : "default";

      if (seenSuccessBookings.has(code)) {

        continue;

      }

      seenSuccessBookings.add(code);

    }

    result.push(m);

  }

  return result;

}



function getInitialCachedMessages(cacheKey: string): Message[] {

  try {

    const raw = localStorage.getItem(cacheKey);

    if (raw) {

      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length > 0) {

        return deduplicateMessages(parsed);

      }

    }

  } catch {}

  return [];

}



export default function ChatWidget() {

  const { t, language } = useLanguage();

  const isEn = language === "en";

  const { user } = useAuth();

  const userKey = getUserStorageKey(user?.email);

  const sessionKey = `senviet_chat_session_${userKey}`;

  const cacheKey = `senviet_cached_chat_messages_${userKey}`;



  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [isExpanded, setIsExpanded] = useState(false);

  const [customWidth, setCustomWidth] = useState<number | null>(null);

  const [isResizing, setIsResizing] = useState(false);

  const handleStartResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    const onMouseMove = (moveEvent: MouseEvent) => {
      const rightOffset = 24;
      const newWidth = Math.max(460, Math.min(window.innerWidth * 0.65, window.innerWidth - moveEvent.clientX - rightOffset));
      setCustomWidth(Math.round(newWidth));
    };
    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  const handleGuestProtectedBooking = useCallback(
    (e: React.MouseEvent, targetUrl: string) => {
      if (!user) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        toast({
          title: isEn ? "Login Required to Book" : "Yêu cầu đăng nhập để đặt phòng",
          description: isEn
            ? "Guests may browse and inquire freely. Please sign in to confirm your room reservation."
            : "Khách vãng lai có thể tra cứu thông tin tự do. Quý khách vui lòng đăng nhập tài khoản để tiến hành đặt và giữ phòng nhé ạ! 🌸",
        });
        navigate("/login", { state: { from: targetUrl } });
        return;
      }
      setOpen(false);
    },
    [user, isEn, navigate]
  );

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>(() => getInitialCachedMessages(cacheKey));

  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const sessionIdRef = useRef<string>(getStoredSessionId(sessionKey));

  const historyRef = useRef<ChatMessageType[]>([]);

  const [activePaymentOrderId, setActivePaymentOrderId] = useState<string | null>(null);

  const currentBookingIdRef = useRef<string | null>(null);

  const confirmedOrdersRef = useRef<Set<string>>(new Set());

  const [confirmedBookingIds, setConfirmedBookingIds] = useState<string[]>([]);

  const cancelledOrdersRef = useRef<Set<string>>(new Set());

  const [cancelledBookingIds, setCancelledBookingIds] = useState<string[]>([]);

  const [botUnreadCount, setBotUnreadCount] = useState(0);

  const [staffUnreadCount, setStaffUnreadCount] = useState(0);

  const [isBranchOnline, setIsBranchOnline] = useState(true);



  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wantsListeningRef = useRef(false);
  const voiceBaseInputRef = useRef("");
  const finalTranscriptRef = useRef("");
  const voiceTargetRef = useRef<"ai" | "staff">("ai");
  const staffInputRef = useRef<HTMLInputElement>(null);

  // Draggable floating chat launcher position (offset from bottom-right)
  const [fabPos, setFabPos] = useState<{ right: number; bottom: number } | null>(null);
  const fabDragRef = useRef<{ startX: number; startY: number; startRight: number; startBottom: number; moved: boolean } | null>(null);
  const didDragFabRef = useRef(false);

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const currentRight = fabPos ? fabPos.right : Math.max(12, window.innerWidth - rect.right);
    const currentBottom = fabPos ? fabPos.bottom : Math.max(12, window.innerHeight - rect.bottom);
    fabDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: currentRight,
      startBottom: currentBottom,
      moved: false,
    };
    didDragFabRef.current = false;

    const onMove = (ev: PointerEvent) => {
      if (!fabDragRef.current) return;
      const dx = ev.clientX - fabDragRef.current.startX;
      const dy = ev.clientY - fabDragRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        fabDragRef.current.moved = true;
        didDragFabRef.current = true;
      }
      if (fabDragRef.current.moved) {
        const nextRight = Math.min(Math.max(8, fabDragRef.current.startRight - dx), window.innerWidth - 72);
        const nextBottom = Math.min(Math.max(8, fabDragRef.current.startBottom - dy), window.innerHeight - 64);
        setFabPos({ right: nextRight, bottom: nextBottom });
      }
    };

    const onUp = () => {
      fabDragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language === "en" ? "en-US" : "vi-VN";

    rec.onresult = (event: any) => {
      let interim = "";
      let addedFinal = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = res[0]?.transcript || "";
        if (res.isFinal) {
          addedFinal += txt + " ";
        } else {
          interim += txt;
        }
      }
      if (addedFinal) {
        finalTranscriptRef.current = (finalTranscriptRef.current + " " + addedFinal).trim();
      }
      const combined = [voiceBaseInputRef.current, finalTranscriptRef.current, interim.trim()]
        .filter(Boolean)
        .join(" ");
      if (voiceTargetRef.current === "staff") {
        setStaffInput(combined);
      } else {
        setInput(combined);
      }
    };

    rec.onend = () => {
      if (wantsListeningRef.current) {
        voiceBaseInputRef.current = (
          (voiceTargetRef.current === "staff" ? staffInputRef.current?.value : inputRef.current?.value) || ""
        ).trim();
        finalTranscriptRef.current = "";
        setTimeout(() => {
          if (!wantsListeningRef.current) return;
          try {
            rec.start();
          } catch {
            wantsListeningRef.current = false;
            setIsListening(false);
          }
        }, 150);
      } else {
        setIsListening(false);
      }
    };

    rec.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      console.error("Speech recognition error", event.error);
      wantsListeningRef.current = false;
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast({
          title: isEn ? "Microphone Access Denied" : "Chưa cấp quyền Micro",
          description: isEn
            ? "Please allow microphone access in your browser to use voice input."
            : "Quý khách vui lòng cấp quyền sử dụng Micro trên trình duyệt để nhập bằng giọng nói nhé ạ.",
          variant: "destructive",
        });
      }
    };

    recognitionRef.current = rec;
    return () => {
      wantsListeningRef.current = false;
      try { rec.abort(); } catch {}
    };
  }, [language, isEn]);



  // Tự động đồng bộ các đơn đã xác nhận / đã bị hủy từ bộ nhớ lưu trữ

  useEffect(() => {

    try {

      const stored = getBookings();

      const cancelled = stored.filter((b) => b.status === "cancelled").map((b) => b.id);

      if (cancelled.length > 0) {

        cancelled.forEach((id) => cancelledOrdersRef.current.add(id));

        setCancelledBookingIds((prev) => Array.from(new Set([...prev, ...cancelled])));

      }

      const confirmed = stored.filter((b) => b.status === "confirmed").map((b) => b.id);

      if (confirmed.length > 0) {

        confirmed.forEach((id) => confirmedOrdersRef.current.add(id));

        setConfirmedBookingIds((prev) => Array.from(new Set([...prev, ...confirmed])));

      }

    } catch {}

  }, []);



  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới hoặc thông báo hủy

  useEffect(() => {

    if (open) {

      const timer = setTimeout(() => {

        scrollRef.current?.scrollTo({

          top: scrollRef.current.scrollHeight,

          behavior: "smooth",

        });

      }, 100);

      return () => clearTimeout(timer);

    }

  }, [messages, open]);



  // Xử lý xác nhận thanh toán thành công tập trung trong chatbot

  const handleBookingConfirmation = useCallback(

    (targetBookingId: string, targetOrderId?: string) => {

      const cleanBookingId = String(targetBookingId || "").trim();

      const cleanOrderId = String(targetOrderId || targetBookingId || "").trim();

      if (!cleanBookingId && !cleanOrderId) return;



      const primaryId = cleanBookingId || cleanOrderId;

      if (confirmedOrdersRef.current.has(primaryId) && confirmedOrdersRef.current.has(cleanOrderId)) {

        return;

      }



      if (cleanBookingId) confirmedOrdersRef.current.add(cleanBookingId);

      if (cleanOrderId) confirmedOrdersRef.current.add(cleanOrderId);



      setConfirmedBookingIds((prev) =>

        Array.from(new Set([...prev, ...(cleanBookingId ? [cleanBookingId] : []), ...(cleanOrderId ? [cleanOrderId] : [])]))

      );

      setCancelledBookingIds((prev) =>

        prev.filter((id) => id !== cleanBookingId && id !== cleanOrderId)

      );

      setActivePaymentOrderId(null);



      if (cleanBookingId) {

        updateBooking(cleanBookingId, { status: "confirmed" });

      }



      toast({ title: "🎉 Thanh toán thành công!", description: `Đã nhận thanh toán thành công cho đơn #${primaryId}!` });



      const savedBooking = getBookings().find(

        (b) => b.id === cleanBookingId || b.id === cleanOrderId

      );

      const hotelName = savedBooking?.hotelName || "Chi nhánh Sen Việt Luxury";

      const roomName = savedBooking?.roomName || "Phòng nghỉ Sen Việt";

      const nights = savedBooking?.nights || 1;

      const rooms = savedBooking?.rooms || 1;

      const checkIn = savedBooking?.checkIn || "";

      const checkOut = savedBooking?.checkOut || "";

      const totalFormatted = formatVnd(savedBooking?.total || 2000);



      setMessages((prev) => {

        const updatedPrev = prev.map((m) =>

          m.state &&

          (m.state.bookingId === cleanBookingId ||

            m.state.orderId === cleanOrderId ||

            m.state.bookingId === cleanOrderId)

            ? {

                ...m,

                state: {

                  ...m.state,

                  status: "CONFIRMED",

                  currentStep: "COMPLETED",

                },

              }

            : m

        );



        const alreadyNotified = updatedPrev.some(

          (m) =>

            (m.text.includes("XÁC NHẬN THANH TOÁN THÀNH CÔNG") || m.text.includes("Chúc mừng quý khách")) &&

            (m.text.includes(primaryId) || (cleanOrderId && m.text.includes(cleanOrderId)))

        );

        if (alreadyNotified) return updatedPrev;



        return [

          ...updatedPrev,

          {

            id: Date.now() + 2,

            from: "bot",

            text: `🎉 **XÁC NHẬN THANH TOÁN THÀNH CÔNG!**\n\nHệ thống Sen Việt Luxury đã ghi nhận thanh toán thành công qua PayOS VietQR cho đơn đặt phòng **#${primaryId}**!\n\n📋 **Thông tin phòng đã xác nhận:**\n- **Khách sạn:** ${hotelName}\n- **Hạng phòng:** ${roomName} (${rooms} phòng, ${nights} đêm)\n- **Thời gian lưu trú:** ${formatStayDates(checkIn, checkOut, language)}\n- **Số tiền đã thanh toán:** **${totalFormatted}** (Đã thanh toán đủ)\n- **Trạng thái đơn:** **Đã xác nhận (Confirmed)** ✅\n\nQuý khách có thể xem đầy đủ chi tiết dịch vụ, phòng và xuất hóa đơn điện tử trong mục **[Lịch sử booking](/history)**. Chúc quý khách có kỳ nghỉ tuyệt vời cùng Sen Việt Luxury!`,

          },

        ];

      });

    },

    []

  );



  // Xử lý thông báo hủy phòng tập trung trong chatbot

  const handleBookingCancellation = useCallback(

    (targetBookingId: string, cancelReason?: string) => {

      if (!targetBookingId) return;

      const cleanId = String(targetBookingId).trim();



      // Nếu đơn này đã được xác nhận thanh toán thì tuyệt đối không báo hủy

      if (confirmedOrdersRef.current.has(cleanId)) return;



      cancelledOrdersRef.current.add(cleanId);

      setCancelledBookingIds((prev) => (prev.includes(cleanId) ? prev : [...prev, cleanId]));

      setActivePaymentOrderId((cur) => (cur === cleanId ? null : cur));

      updateBooking(cleanId, { status: "cancelled" });



      // Nếu khách đã đặt sang một đơn mới khác đơn cũ vừa hết hạn, không chèn tin nhắn báo hủy của đơn cũ làm rối cuộc trò chuyện

      if (

        currentBookingIdRef.current &&

        currentBookingIdRef.current !== cleanId &&

        activePaymentOrderId !== cleanId

      ) {

        return;

      }



      const savedBooking = getBookings().find(

        (b) => b.id === cleanId || b.id === cleanId.replace(/^BK_?/, "")

      );

      const hotelName = savedBooking?.hotelName;

      const roomName = savedBooking?.roomName;

      const cleanReason = cancelReason || "Quá thời gian chờ thanh toán";



      // Khách tự hủy phòng thủ công thì không báo trong chat AI

      const manualSet: Set<string> | undefined = (window as any).__senvietManualCancelled;

      if (manualSet && (manualSet.has(cleanId) || manualSet.has(cleanId.replace(/^BK[-_]?/i, "")))) {

        return;

      }



      setMessages((prev) => {

        const alreadyNotified = prev.some(

          (m) =>

            m.text.includes("THÔNG BÁO HỦY ĐẶT PHÒNG") &&

            (m.text.includes(cleanId) || m.text.includes(cleanId.replace(/^BK_?/, "")))

        );

        if (alreadyNotified) return prev;



        const roomDetail =

          hotelName && roomName

            ? `\n- **Khách sạn:** ${hotelName}\n- **Hạng phòng:** ${roomName}`

            : "";



        return [

          ...prev,

          {

            id: Date.now() + 4,

            from: "bot",

            text: `⚠️ **THÔNG BÁO HỦY ĐẶT PHÒNG**\n\nĐơn đặt phòng **#${cleanId}** đã bị hủy trên hệ thống.\n\n📌 **Lý do hủy:** *${cleanReason}*${roomDetail}\n⏳ Mã QR thanh toán PayOS của đơn này hiện đã **hết hạn hiệu lực**.\n\nNếu quý khách vẫn muốn đặt phòng hoặc cần em tư vấn thêm phòng trống chi nhánh khác, quý khách hãy nhắn ngay cho em tại đây nhé! Em luôn sẵn sàng hỗ trợ ạ! 🙏`,

          },

        ];

      });



      if (!open) {

        setBotUnreadCount((c) => c + 1);

      }

    },

    [open, activePaymentOrderId]

  );



  const toggleListening = (target: "ai" | "staff" = "ai") => {
    if (!recognitionRef.current) {
      toast({
        title: isEn ? "Voice Input Unavailable" : "Trình duyệt chưa hỗ trợ",
        description: isEn
          ? "Please use Chrome or Edge to dictate messages by voice."
          : "Vui lòng dùng trình duyệt Chrome hoặc Edge để sử dụng nhập liệu bằng giọng nói.",
      });
      return;
    }
    if (isListening) {
      wantsListeningRef.current = false;
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    } else {
      voiceTargetRef.current = target;
      voiceBaseInputRef.current = (target === "staff" ? staffInput : input).trim();
      finalTranscriptRef.current = "";
      wantsListeningRef.current = true;
      try {
        recognitionRef.current.lang = language === "en" ? "en-US" : "vi-VN";
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        wantsListeningRef.current = false;
        setIsListening(false);
      }
    }
  };



  const [sendChatMessage] = useSendChatMessageMutation();

  const [triggerGetHistory] = useLazyGetChatHistoryQuery();



  // Save messages to local cache whenever messages state changes

  useEffect(() => {

    if (messages.length > 0) {

      try {

        localStorage.setItem(cacheKey, JSON.stringify(messages));

      } catch {}

    }

  }, [messages, cacheKey]);



  const handleStartNewChat = useCallback(() => {

    const newId = crypto.randomUUID();

    try {

      localStorage.setItem(sessionKey, newId);

      localStorage.removeItem(cacheKey);

    } catch {}

    sessionIdRef.current = newId;

    historyRef.current = [];

    currentBookingIdRef.current = null;

    confirmedOrdersRef.current.clear();

    setActivePaymentOrderId(null);

    setMessages([{ id: Date.now(), from: "bot", text: t("ai.widgetGreeting") }]);

  }, [t, sessionKey, cacheKey]);



  // Restore history on component mount or when user switches account

  useEffect(() => {

    let isMounted = true;

    const curSession = getStoredSessionId(sessionKey);

    sessionIdRef.current = curSession;

    const initialMsgs = getInitialCachedMessages(cacheKey);

    setMessages(initialMsgs.length > 0 ? initialMsgs : [{ id: 1, from: "bot", text: t("ai.widgetGreeting") }]);

    historyRef.current = [];



    const fetchHistory = async () => {

      if (!curSession) {

        if (isMounted) {

          setMessages((prev) => (prev.length > 0 ? prev : [{ id: 1, from: "bot", text: t("ai.widgetGreeting") }]));

        }

        return;

      }

      try {

        const res = await triggerGetHistory(curSession).unwrap();

        const serverMsgs = res.result?.messages;

        if (isMounted && serverMsgs && serverMsgs.length > 0) {

          const restored: Message[] = serverMsgs.map((m: any, idx: number) => ({

            id: m.id || Date.now() + idx,

            from: m.role === "user" ? ("user" as const) : ("bot" as const),

            text: m.content,

            state: idx === serverMsgs.length - 1 ? res.result?.state : undefined,

          }));

          setMessages(deduplicateMessages(restored));



          historyRef.current = serverMsgs.map((m: any) => ({

            role: m.role === "user" ? ("user" as const) : ("model" as const),

            content: m.content,

          })).slice(-10);



          if (res.result?.state?.bookingId) {

            currentBookingIdRef.current = res.result.state.bookingId;

          }

          if (res.result?.state?.orderId) {

            const oId = String(res.result.state.orderId);

            const bId = res.result?.state?.bookingId;

            const isConfirmed =

              res.result?.state?.status === "CONFIRMED" ||

              restored.some((m) => m.text.includes("Chúc mừng quý khách") || m.text.includes("ghi nhận thanh toán")) ||

              getBookings().some((b) => (b.id === bId || b.id === oId) && b.status === "confirmed");



            if (isConfirmed) {

              confirmedOrdersRef.current.add(oId);

            } else if (!confirmedOrdersRef.current.has(oId)) {

              setActivePaymentOrderId(oId);

            }

          }

          return;

        }

      } catch {

        // No server history found, show default greeting if no cached messages

      }

      if (isMounted) {

        setMessages((prev) => (initialMsgs.length > 0 ? initialMsgs : [{ id: 1, from: "bot", text: t("ai.widgetGreeting") }]));

      }

    };

    fetchHistory();

    return () => {

      isMounted = false;

    };

  }, [userKey, sessionKey, cacheKey, triggerGetHistory, t]);

  // Tự động đồng bộ ngôn ngữ câu chào đầu tiên khi người dùng bấm chuyển đổi VI <-> EN
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].from === "bot" && !prev[0].state) {
        return [{ ...prev[0], text: t("ai.widgetGreeting") }];
      }
      return prev;
    });
  }, [language, t]);



  // Listen for external open events & return-to-mini-chat transition
  useEffect(() => {
    try {
      if (sessionStorage.getItem("senviet_reopen_mini_chat") === "1") {
        sessionStorage.removeItem("senviet_reopen_mini_chat");
        setMenuOpen(false);
        setStaffOpen(false);
        setIsExpanded(false);
        setOpen(true);
      }
    } catch {}
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
      if (wantsListeningRef.current) {
        wantsListeningRef.current = false;
        try { recognitionRef.current?.stop(); } catch {}
        setIsListening(false);
      }
      voiceBaseInputRef.current = "";
      finalTranscriptRef.current = "";



      // Add user message to UI

      const userMsg: Message = { id: Date.now(), from: "user", text };

      setMessages((prev) => [...prev, userMsg]);

      setInput("");

      setIsTyping(true);



      // Add to history for context

      historyRef.current = [

        ...historyRef.current,

        { role: "user" as const, content: text },

      ].slice(-10); // Keep last 10 messages



      try {

        const userInfo = user

          ? {

              name: user.name || "",

              phone: user.phone || "",

              email: user.email || "",

            }

          : undefined;



        const result = await sendChatMessage({

          message: text,

          sessionId: sessionIdRef.current,

          history: historyRef.current.slice(0, -1), // Exclude current message (sent in 'message' field)

          userInfo,

          hotelId: currentBranchHotelId,

          branchName: selectedBranch,
          userLanguage: language,

        }).unwrap();



        const reply = result.result?.reply || t("ai.genericReply");

        const state = result.result?.state;



        // Chỉ gán state hiển thị thẻ cho tin nhắn này nếu lượt phản hồi thực sự yêu cầu render thẻ (tìm phòng hoặc tạo QR thanh toán)

        const isBookingAction =

          Boolean(state && state.status !== "CANCELLED" && (

            state.cardAction === "SHOW_ROOM_OPTIONS" ||

            state.cardAction === "SHOW_PAYOS_PAYMENT" ||

            state.cardAction === "SHOW_HOTEL_RESERVATION" ||

            (state.qrUrl && state.currentStep === "PAYMENT_PROCESSING") ||

            (state.currentStep === "SELECT_ROOM" &&

              state.availableRooms &&

              state.availableRooms.length > 0 &&

              /(phòng|phong|trống|trong|giá|gia|lựa chọn|lua chon|đặt|dat)/i.test(reply))

          ));



        const validState = isBookingAction ? state : undefined;

        // Giữ nguyên state của các tin nhắn trước đó, KHÔNG xóa để thẻ không bị biến mất khi chat câu tiếp theo!

        setMessages((prev) => [

          ...prev,

          { id: Date.now() + 1, from: "bot", text: reply, state: validState },

        ]);



        // Synchronize booking to client localStorage for history & success pages

        if (state && !state.bookingId) {

          currentBookingIdRef.current = null;

          setActivePaymentOrderId(null);

        }

        if (state?.bookingId) {

          currentBookingIdRef.current = state.bookingId;

          const existing = getBookings().find((b) => b.id === state.bookingId);

          if (!existing) {

            const todayStr = toLocalDateStr();

            const tomorrowStr = toLocalDateStr(new Date(Date.now() + 86400000));

            let checkIn = state.checkIn || todayStr;

            if (checkIn < todayStr) checkIn = todayStr;

            let checkOut = state.checkOut || tomorrowStr;

            if (checkOut <= checkIn) {

              const nextDay = new Date(`${checkIn}T00:00:00`);

              nextDay.setDate(nextDay.getDate() + 1);

              checkOut = toLocalDateStr(nextDay);

            }

            const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

            const payAmount = Number(state.amountToPay || 2000);

            const roomQty = Math.max(1, state.roomQty || 1);

            const matchingRoom = (state.availableRooms || []).find((r: any) => r.roomType === (state.roomType?.id || state.roomType));

            const baseNightly = Number(matchingRoom?.pricePerNight || (state.roomType as any)?.price || 850000);

            const totalRoomAmount = baseNightly * nights * roomQty;



            // Construct services list if any

            const rawServices = state.services || [];

            const bookingServices: BookingService[] = rawServices.map((s: any, idx: number) => {

              const sInfo = (state.availableServices || []).find((as: any) => as.id === (s.id || s.serviceId));

              const sName = s.name || sInfo?.name || "Ăn sáng Buffet";

              const sPrice = Number(s.price || sInfo?.price || 150000);

              const sQty = Number(s.quantity || state.guests?.adults || 2);

              return {

                id: String(s.id || s.serviceId || `svc_${idx}`),

                name: sName,

                category: s.category || "Ẩm thực",

                quantity: sQty,

                unitPrice: sPrice,

                total: sPrice * sQty,

              };

            });

            const servicesTotal = bookingServices.reduce((sum, s) => sum + s.total, 0);

            const computedSubtotal = totalRoomAmount + servicesTotal;

            const discountAmount = Math.max(0, computedSubtotal - payAmount);

            const nightlyPrice = baseNightly;

            const roomTotal = totalRoomAmount;

            const roomTypeName = state.roomType?.name || (state.roomType?.id ? `Phòng ${state.roomType.id}` : "Phòng tiêu chuẩn");



            const roomStays: RoomStay[] = Array.from({ length: roomQty }, (_, i) => ({

              roomCode: `P.${101 + i}`,

              checkIn,

              checkOut,

              nights,

              guest: {

                adults: Number(state.guests?.adults || 2),

                children: Number(state.guests?.children || 0),

                infants: 0,

              },

              extraGuestCharge: 0,

              nightlyPrice: nightlyPrice > 0 ? nightlyPrice : payAmount,

              stayTotal: nightlyPrice > 0 ? nightlyPrice * nights : payAmount,

              services: i === 0 ? bookingServices : [],

            }));



            const roomSelections: RoomSelection[] = [

              {

                roomId: String(state.roomType?.id || "STANDARD"),

                roomName: roomTypeName,

                roomNameVi: roomTypeName,

                quantity: roomQty,

                nightlyPrice: nightlyPrice > 0 ? nightlyPrice : payAmount,

                guestForms: roomStays.map((s) => s.guest),

                includedCapacity: { adults: 2, children: 1, infants: 0 },

                checkIn,

                checkOut,

                nights,

                roomCodes: roomStays.map((s) => s.roomCode),

                stays: roomStays,

                extraAdults: 0,

                extraChildren: 0,

                extraGuestCount: 0,

                extraGuestCharge: 0,

              },

            ];



            saveBooking({

              id: state.bookingId,

              userEmail: state.guestInfo?.email || user?.email || "guest@senviet.vn",

              hotelSlug: getSlugFromHotelName(state.branch?.name),

              hotelName: state.branch?.name || "Chi nhánh Sen Việt Luxury",

              roomName: roomTypeName,

              roomSelections,

              services: bookingServices,

              checkIn,

              checkOut,

              nights,

              rooms: roomQty,

              roomPrice: nightlyPrice > 0 ? nightlyPrice : payAmount,

              roomTotal: roomTotal > 0 ? roomTotal : payAmount,

              vat: 0,

              serviceFee: 0,

              discount: discountAmount,

              total: payAmount,

              paymentMethod: "qr",

              status: state.status === "CONFIRMED" ? "confirmed" : "pending_payment",

              createdAt: new Date().toISOString(),

              guestName: state.guestInfo?.name || user?.name || "Khách hàng",

              phone: state.guestInfo?.phone || user?.phone || "",

              email: state.guestInfo?.email || user?.email || "",

              specialRequest: "",

              cancellationDeadline: "",

              holdUntil: new Date(Date.now() + 5 * 60 * 1000).toISOString(),

            });

          }

        }



        // Track order ID for payment polling (from state or parsed payos_payment block)

        const parsedBotForPolling = parseBotMessage(reply);

        const orderIdToTrack = state?.orderId || parsedBotForPolling.payosPayment?.orderId || parsedBotForPolling.payosPayment?.bookingId || state?.bookingId;

        if (parsedBotForPolling.payosPayment?.bookingId && !currentBookingIdRef.current) {

          currentBookingIdRef.current = String(parsedBotForPolling.payosPayment.bookingId);

        }

        if (state?.status === "CONFIRMED" && (state?.bookingId || orderIdToTrack)) {

          handleBookingConfirmation(String(state?.bookingId || orderIdToTrack), String(orderIdToTrack || ""));

        } else if (orderIdToTrack && state?.status !== "CONFIRMED" && !confirmedOrdersRef.current.has(String(orderIdToTrack))) {

          setActivePaymentOrderId(String(orderIdToTrack));

        }



        // Update session ID from server and persist

        if (result.result?.sessionId) {

          sessionIdRef.current = result.result.sessionId;

          try {

            localStorage.setItem(sessionKey, result.result.sessionId);

          } catch {}

        }



        // Add bot reply to history

        historyRef.current = [

          ...historyRef.current,

          { role: "model" as const, content: reply },

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

    [isTyping, sendChatMessage, t, sessionKey],

  );



  // Real-time payment check polling via PayOS backend

  useEffect(() => {

    if (!activePaymentOrderId || confirmedOrdersRef.current.has(activePaymentOrderId)) return;

    let isCancelled = false;

    const orderToCheck = activePaymentOrderId;



    const interval = setInterval(async () => {

      try {

        if (isCancelled || confirmedOrdersRef.current.has(orderToCheck)) {

          clearInterval(interval);

          return;

        }

        const res = await fetch(`${API_BASE_URL}/payment/check-order-status/${orderToCheck}`);

        if (!res.ok) return;

        const rawData = await res.json();

        const data = rawData?.result ?? rawData;

        // 1. Nếu đơn hàng thanh toán thành công

        if (data.isPaid || data.status === "PAID" || data.status === "CONFIRMED" || data.status === "CLOSED") {

          clearInterval(interval);

          if (isCancelled) return;

          const bId = data.bookingId || currentBookingIdRef.current || orderToCheck;

          handleBookingConfirmation(String(bId), String(data.orderId || orderToCheck));

          return;

        }



        // 2. Nếu đơn hàng bị hủy hoặc quá thời gian chờ thanh toán (Payment Timeout)

        const isStatusCancelled =

          data.status === "CANCELLED" ||

          data.status === "EXPIRED" ||

          (typeof data.bookingStatus === "string" && data.bookingStatus.toUpperCase().startsWith("CANCEL")) ||

          data.gatewayStatus === "CANCELLED";



        if (isStatusCancelled) {

          clearInterval(interval);

          if (isCancelled) return;

          setActivePaymentOrderId(null);

          const bId = data.bookingId || currentBookingIdRef.current || orderToCheck;

          handleBookingCancellation(

            String(bId),

            data.cancelReason || data.message || "Quá thời gian chờ thanh toán"

          );

          return;

        }

      } catch (err) {

        console.error("[ChatWidget] Payment status check error:", err);

      }

    }, 3000);



    return () => {

      isCancelled = true;

      clearInterval(interval);

    };

  }, [activePaymentOrderId, handleBookingCancellation, handleBookingConfirmation]);



  // Lắng nghe sự kiện socket và event hủy booking từ hệ thống

  useEffect(() => {

    const handleSocketBookingUpdate = (e: Event) => {

      const detail = (e as CustomEvent).detail;

      if (!detail) return;

      const bStatus = String(detail.bookingStatus || detail.status || "").toUpperCase();

      const bId = detail.id || detail.bookingId;

      if (bStatus === "CONFIRMED" || bStatus === "PAID") {

        if (bId && (String(bId) === currentBookingIdRef.current || String(bId) === activePaymentOrderId)) {

          handleBookingConfirmation(String(bId));

        }

      } else if (bStatus.startsWith("CANCEL")) {

        const reason = detail.cancellationReason || detail.reason || "Quá thời gian chờ thanh toán";

        handleBookingCancellation(String(bId), reason);

      }

    };



    const handleSocketNotification = (e: Event) => {

      const detail = (e as CustomEvent).detail;

      if (!detail) return;

      const title = String(detail.title || "").toLowerCase();

      const desc = String(detail.description || "");

      const type = String(detail.type || "").toUpperCase();



      if (type === "BOOKING_CANCELLED" || title.includes("hủy") || desc.toLowerCase().includes("bị hủy")) {

        let bId = detail.referenceId ? String(detail.referenceId) : null;

        if (!bId) {

          const match = desc.match(/#([A-Za-z0-9_]+)/);

          if (match) bId = match[1];

        }

        if (bId) {

          let reason = "Quá thời gian chờ thanh toán";

          if (desc.includes(":")) {

            reason = desc.split(":").slice(1).join(":").trim();

          }

          handleBookingCancellation(bId, reason);

        }

      }

    };



    const handleClientBookingCancelled = (e: Event) => {

      const detail = (e as CustomEvent).detail;

      if (!detail) return;

      const bId = detail.bookingId || detail.id;

      if (bId) {

        handleBookingCancellation(String(bId), detail.reason || "Người dùng yêu cầu hủy phòng");

      }

    };



    window.addEventListener("senviet_socket_booking_updated", handleSocketBookingUpdate);

    window.addEventListener("senviet_socket_notification", handleSocketNotification);

    window.addEventListener("senviet_booking_cancelled", handleClientBookingCancelled);



    return () => {

      window.removeEventListener("senviet_socket_booking_updated", handleSocketBookingUpdate);

      window.removeEventListener("senviet_socket_notification", handleSocketNotification);

      window.removeEventListener("senviet_booking_cancelled", handleClientBookingCancelled);

    };

  }, [handleBookingCancellation]);





  const lastBotMsg = messages.filter((m) => m.from === "bot").slice(-1)[0]?.text?.toLowerCase() || "";

  const isAwaitingConfirmation =

    (lastBotMsg.includes("xác nhận") || lastBotMsg.includes("thanh toán")) &&

    !lastBotMsg.includes("payos_payment");



  const quickReplies = isAwaitingConfirmation

    ? (isEn

        ? ["✅ Confirm booking", "Edit details", "Airport pickup service"]

        : ["✅ Xác nhận đặt phòng", "Chỉnh sửa thông tin", "Dịch vụ đưa đón sân bay"])

    : [

        t("ai.quickBook"),

        t("ai.quickOffer"),

        t("ai.quickLocation"),

        t("ai.quickSupport"),

      ];



  // ==================== LUỒNG 2: CHAT VỚI NHÂN VIÊN & KẾT NỐI ZALO (KIỂU CELLPHONES) ====================

  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const [staffOpen, setStaffOpen] = useState(false);

  const [isStaffExpanded, setIsStaffExpanded] = useState(false);

  const [staffMode, setStaffMode] = useState<"web" | "zalo">("web");



  // Tự động nhận diện chi nhánh từ URL trang đang xem hoặc đơn đặt phòng gần nhất (Ưu tiên Sen Việt Đà Nẵng)

  const detectedBranchName = useMemo(() => {

    try {

      const pathMatch = location.pathname.match(/\/hotels\/([^/?#]+)/);

      if (pathMatch) {

        const slug = pathMatch[1];

        const h = hotels.find((hotel) => hotel.slug === slug || String(hotel.id) === slug);

        if (h) return h.name;

      }

      const searchParams = new URLSearchParams(location.search);

      const hotelSlug = searchParams.get("hotel");

      if (hotelSlug) {

        const h = hotels.find((hotel) => hotel.slug === hotelSlug || hotel.name.toLowerCase().includes(hotelSlug.toLowerCase()) || String(hotel.id) === hotelSlug);

        if (h) return h.name;

      }

    } catch {}

    return "Tổng đài CSKH Toàn hệ thống Sen Việt";

  }, [location.pathname, location.search]);



  const [selectedBranch, setSelectedBranch] = useState<string>(() => detectedBranchName);



  const currentBranchHotelId = useMemo(() => {

    const h = hotels.find((hotel) => hotel.name === selectedBranch || hotel.name.toLowerCase().includes(selectedBranch.toLowerCase()));

    if (h?.id) return h.id;

    if (selectedBranch.includes("Sài Gòn")) return 1;

    if (selectedBranch.includes("Hà Nội")) return 2;

    if (selectedBranch.includes("Đà Nẵng")) return 3;

    if (selectedBranch.includes("Nha Trang")) return 4;

    if (selectedBranch.includes("Đà Lạt")) return 5;

    if (selectedBranch.includes("Gò Công")) return 6;

    if (selectedBranch.includes("An Nhơn")) return 7;
    if (selectedBranch.includes("Quy Nhơn")) return 8;

    return null;

  }, [selectedBranch]);



  const staffCacheKey = `senviet_staff_chat_${userKey}_${currentBranchHotelId || "all"}`;



  useEffect(() => {

    setSelectedBranch(detectedBranchName);

  }, [detectedBranchName]);



  // Kiem tra trang thai truc tuyen cua chi nhanh (hoac Tong dai CSKH Super Admin)

  useEffect(() => {

    checkBranchOnline(currentBranchHotelId);

  }, [selectedBranch, currentBranchHotelId, staffOpen]);



  useEffect(() => {

    if (staffOpen) {

      setStaffUnreadCount(0);

    }

  }, [staffOpen]);

  const [staffInput, setStaffInput] = useState("");

  const [isStaffTyping, setIsStaffTyping] = useState(false);

  const staffScrollRef = useRef<HTMLDivElement>(null);

  const processedStaffReplyIdsRef = useRef<Set<string>>(new Set());



  const getBranchInitialMessage = useCallback((branch: string): StaffMessage => {

    const isGeneral = branch.includes("Tổng đài");

    return {

      id: 1,

      from: "staff",

      senderName: isGeneral ? "Lễ tân trực tuyến Sen Việt" : `Lễ tân ${branch}`,

      branchName: branch,

      time: new Date().toLocaleTimeString("vi-VN", {

        hour: "2-digit",

        minute: "2-digit",

      }),

      text: isGeneral

        ? (isEn

            ? "Hello! Sen Viet Online Concierge is at your service 24/7. How may we assist you today?"

            : "Dạ Sen Việt xin chào quý khách! Em là nhân viên Lễ tân trực tuyến toàn hệ thống Sen Việt. Em có thể hỗ trợ thông tin phòng hoặc dịch vụ gì cho mình ạ?")

        : (isEn

            ? `Hello! You are connected directly with the Front Desk & Concierge of ${branch}. How may we assist you today?`

            : `Dạ Sen Việt xin chào quý khách! Quý khách đang kết nối trực tiếp với Bộ phận Lễ tân & CSKH (${branch}). Em có thể hỗ trợ thông tin gì cho chuyến lưu trú của quý khách ạ?`),

    };

  }, [isEn]);



  // Listen for logout event to completely reset chat state & protect privacy

  useEffect(() => {

    const handleLogout = () => {

      setOpen(false);

      setStaffOpen(false);

      setMenuOpen(false);

      const newId = crypto.randomUUID();

      sessionIdRef.current = newId;

      try {

        localStorage.setItem("senviet_chat_session_guest", newId);

        localStorage.removeItem("senviet_cached_chat_messages_guest");

      } catch {}

      setMessages([{ id: Date.now(), from: "bot", text: t("ai.widgetGreeting") }]);

      historyRef.current = [];

      confirmedOrdersRef.current.clear();

      setActivePaymentOrderId(null);

      currentBookingIdRef.current = null;

      setIsTyping(false);

      setStaffMessages([getBranchInitialMessage(selectedBranch)]);

      setStaffInput("");

      setIsStaffTyping(false);

    };



    window.addEventListener("senviet_auth_logout", handleLogout);

    return () => window.removeEventListener("senviet_auth_logout", handleLogout);

  }, [t, selectedBranch, getBranchInitialMessage]);



  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>(() => {

    try {

      const saved = localStorage.getItem(staffCacheKey);

      if (saved) {

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) return parsed;

      }

    } catch {}

    return [getBranchInitialMessage(selectedBranch)];

  });



  // Tự động chuyển đổi hộp tin nhắn khi khách đổi chi nhánh

  useEffect(() => {

    try {

      const saved = localStorage.getItem(staffCacheKey);

      if (saved) {

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {

          setStaffMessages(parsed);

          return;

        }

      }

    } catch {}

    setStaffMessages([getBranchInitialMessage(selectedBranch)]);

  }, [staffCacheKey, selectedBranch, getBranchInitialMessage]);



  useEffect(() => {

    try {

      localStorage.setItem(staffCacheKey, JSON.stringify(staffMessages));

    } catch {}

  }, [staffMessages, staffCacheKey]);



  useEffect(() => {

    if (staffOpen) {

      staffScrollRef.current?.scrollTo({

        top: staffScrollRef.current.scrollHeight,

        behavior: "smooth",

      });

    }

  }, [staffMessages, staffOpen, isStaffTyping, staffMode]);



  const customerId = user?.userId

    ? String(user.userId)

    : (() => {

        let gid = localStorage.getItem("senviet_guest_id");

        if (!gid) {

          gid = "guest_" + Math.random().toString(36).substring(2, 9);

          localStorage.setItem("senviet_guest_id", gid);

        }

        return gid;

      })();



  useEffect(() => {

    // Luôn đảm bảo khách hàng kết nối SocketIO và tham gia room cá nhân

    initCustomerSocket(null, customerId, user?.accountId, user?.email);



    const handleStaffReply = (event: Event) => {

      const customEvent = event as CustomEvent<StaffReplyPayload>;

      const reply = customEvent.detail;

      if (!reply) return;



      // Kiểm tra tin nhắn phản hồi đúng cho khách hàng này

      if (reply.customerId && String(reply.customerId) !== String(customerId)) {

        return;

      }



      setIsStaffTyping(false);



      const rId = String(reply.msgId || `${reply.customerId}_${Date.now()}_${reply.message}`);

      if (processedStaffReplyIdsRef.current.has(rId)) {

        return;

      }

      processedStaffReplyIdsRef.current.add(rId);

      if (processedStaffReplyIdsRef.current.size > 200) {

        const first = processedStaffReplyIdsRef.current.values().next().value;

        if (first) processedStaffReplyIdsRef.current.delete(first);

      }



      // 🔔 1. Phát chuông thông báo (Hospitality Chime) cho khách hàng

      playHospitalityChime();



      if (reply.branchName && reply.branchName !== "Tổng đài CSKH Toàn hệ thống Sen Việt") {

        setSelectedBranch(reply.branchName);

      }



      setStaffMessages((prev) => {

        const isDuplicate = prev.some((m) => {

          if (reply.msgId && String(m.id) === String(reply.msgId)) return true;

          return false;

        });

        if (isDuplicate) return prev;



        return [

          ...prev,

          {

            id: reply.msgId || Date.now(),

            from: "staff",

            senderName: reply.staffName || "Lễ tân Sen Việt",

            branchName: reply.branchName || selectedBranch,

            time: new Date().toLocaleTimeString("vi-VN", {

              hour: "2-digit",

              minute: "2-digit",

            }),

            text: reply.message,

          },

        ];

      });



      setIsBranchOnline(true);

      setStaffMessages((prev) => prev.map((m) => (m.from === "user" ? { ...m, isRead: true } : m)));



      // 🔔 2. Hien thi Toast thong bao noi neu khach chua mo chat

      if (!staffOpen) {

        setStaffUnreadCount((u) => u + 1);

        playHospitalityChime();

        toast({

          title: `🛎️ Nhân viên (${reply.staffName || "Lễ tân"}) phản hồi:`,

          description: reply.message.length > 70 ? reply.message.substring(0, 70) + "..." : reply.message,

          action: (

            <ToastAction

              altText="Xem trả lời"

              onClick={() => {

                setMenuOpen(false);

                setStaffOpen(true);

              }}

            >

              Mở chat

            </ToastAction>

          ),

        });

      }

    };



    // Tự động tải lịch sử tin nhắn từ PostgreSQL theo đúng chi nhánh đã chọn

    const fetchHistoryFromDb = async () => {

      try {

        const hotelQuery = currentBranchHotelId ? `&hotelId=${currentBranchHotelId}` : "";

        const res = await fetch(`${API_BASE_URL}/live-chat/messages?customerId=${customerId}${hotelQuery}`);

        if (!res.ok) return;

        const data = await res.json();

        const serverMsgs = data.result;

        if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {

          const mapped: StaffMessage[] = serverMsgs.map((m: any) => ({

            id: m.msgId || m.id,

            from: m.senderType === "CUSTOMER" ? "user" : "staff",

            senderName: m.senderName,

            branchName: selectedBranch,
          userLanguage: language,

            time: new Date(m.createdAt).toLocaleTimeString("vi-VN", {

              hour: "2-digit",

              minute: "2-digit",

            }),

            text: m.message,

            isRead: Boolean(m.isRead),

          }));

          setStaffMessages(mapped);

        }

      } catch (err) {

        console.warn("Could not load chat history from DB:", err);

      }

    };

    fetchHistoryFromDb();



    const handleStaffRead = () => {

      setStaffMessages((prev) =>

        prev.map((m) => (m.from === "user" ? { ...m, isRead: true } : m))

      );

    };



    const handleBranchOnline = (e: Event) => {

      const detail = (e as CustomEvent).detail;

      if (detail && (detail.hotelId == null || String(detail.hotelId) === String(currentBranchHotelId))) {

        setIsBranchOnline(Boolean(detail.online));

      }

    };



    window.addEventListener("senviet_staff_chat_reply", handleStaffReply);

    window.addEventListener("senviet_staff_read_messages", handleStaffRead);

    window.addEventListener("senviet_branch_online_status", handleBranchOnline);

    return () => {

      window.removeEventListener("senviet_staff_chat_reply", handleStaffReply);

      window.removeEventListener("senviet_staff_read_messages", handleStaffRead);

      window.removeEventListener("senviet_branch_online_status", handleBranchOnline);

    };

  }, [customerId, user?.accountId, user?.email, selectedBranch, currentBranchHotelId, staffOpen]);



  const sendStaffMessage = (text: string) => {

    const trimmed = text.trim();

    if (!trimmed) return;

    const nowTime = new Date().toLocaleTimeString("vi-VN", {

      hour: "2-digit",

      minute: "2-digit",

    });



    const msgId = "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);



    const userMsg: StaffMessage = {

      id: msgId,

      from: "user",

      branchName: selectedBranch,

      time: nowTime,

      text: trimmed,

      isRead: false,

    };

    setStaffMessages((prev) => [...prev, userMsg]);

    setStaffInput("");

    setIsStaffTyping(true);



    // Gửi tin nhắn thực tế qua Socket.IO tới quầy Lễ tân & Quản trị của đúng chi nhánh

    sendCustomerChatMessage({

      msgId,

      customerId: String(customerId),

      customerName: user?.name || "Khách hàng (" + (user?.phone || "Trực tuyến") + ")",

      customerPhone: user?.phone || "",

      hotelId: currentBranchHotelId,

      branchName: selectedBranch,

      message: trimmed,

      timestamp: new Date().toISOString(),

    });



    // Thông báo tiếp nhận tự động 1 lần nếu khách mới bắt đầu chat

    const hasDispatchedNotice = staffMessages.some((m) => m.from === "staff" && m.text.includes("đã tiếp nhận và kết nối"));

    if (!hasDispatchedNotice) {

      setTimeout(() => {

        setIsStaffTyping(false);

        setStaffMessages((prev) => [

          ...prev,

          {

            id: Date.now() + 1,

            from: "staff",

            senderName: "Hệ thống Lễ tân Sen Việt",

            branchName: selectedBranch,
          userLanguage: language,

            time: new Date().toLocaleTimeString("vi-VN", {

              hour: "2-digit",

              minute: "2-digit",

            }),

            text: isBranchOnline

              ? `Dạ Bộ phận Lễ tân & Chăm sóc khách hàng (${selectedBranch}) đã tiếp nhận và kết nối với anh/chị qua Socket.IO thời gian thực. Nhân viên trực ca đang xử lý và sẽ phản hồi trực tiếp ngay tại đây ạ!`

              : `Dạ hiện tại chi nhánh ${selectedBranch} đang ngoài giờ trực tuyến / nhân viên vắng mặt. Tin nhắn của anh/chị đã được ghi nhận vào hệ thống (Chưa đọc) và nhân viên trực ca sẽ phản hồi ngay khi online ạ!`,

          },

        ]);

      }, 600);

    } else {

      setTimeout(() => setIsStaffTyping(false), 800);

    }

  };



  const staffQuickTopics = isEn

    ? [

        "Refund & cancellation support",

        "Request VAT invoice",

        "Early check-in / late check-out",

        "Group booking & event inquiry",

      ]

    : [

        "Hỗ trợ hoàn tiền & hủy phòng",

        "Yêu cầu xuất hóa đơn VAT",

        "Xin nhận phòng sớm / trả phòng muộn",

        "Tư vấn đặt phòng đoàn / sự kiện",

      ];



  const handleToggleLauncher = () => {
    if (didDragFabRef.current) {
      didDragFabRef.current = false;
      return;
    }
    if (open || staffOpen) {

      setOpen(false);

      setStaffOpen(false);

      setMenuOpen(false);

    } else {

      setMenuOpen((prev) => !prev);

    }

  };



  const isAuthPage = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ].some((path) => location.pathname.startsWith(path));

  if (isAuthPage) {
    return null;
  }

  return (

    <>

      {/* Nút Floating "Liên hệ" kiểu CellphoneS */}

      <button

        onPointerDown={handleFabPointerDown}

        onClick={handleToggleLauncher}

        aria-label={isEn ? "Contact Sen Việt Support" : "Liên hệ tư vấn Sen Việt"}

        style={fabPos ? { right: `${fabPos.right}px`, bottom: `${fabPos.bottom}px`, touchAction: "none" } : { touchAction: "none" }}

        className={`fixed z-50 flex h-11 w-11 sm:h-auto sm:w-auto items-center justify-center gap-2 sm:gap-2.5 rounded-full bg-gradient-to-r from-primary via-primary to-slate-900 p-0 sm:px-5 sm:py-3.5 text-white shadow-xl shadow-black/30 ring-2 ring-gold/60 transition hover:scale-105 cursor-grab active:cursor-grabbing ${fabPos ? "" : "bottom-4 right-4 sm:bottom-6 sm:right-6"}`}

      >

        {open || staffOpen || menuOpen ? (

          <>

            <X className="h-5 w-5 text-gold" />

            <span className="hidden sm:inline text-sm font-bold tracking-wide">{isEn ? "Close" : "Đóng"}</span>

          </>

        ) : (

          <>

            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gold text-gold-foreground">

              <Headset className="h-4 w-4" />

              {(botUnreadCount + staffUnreadCount) > 0 ? (

                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-bounce">

                  {botUnreadCount + staffUnreadCount}

                </span>

              ) : (

                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">

                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />

                </span>

              )}

            </span>

            <span className="hidden sm:inline text-sm font-bold tracking-wide">{isEn ? "Support" : "Liên hệ"}</span>

          </>

        )}

      </button>



      {/* MENU 2 LUỒNG TƯ VẤN (KIỂU CELLPHONES) */}

      {menuOpen && !open && !staffOpen && (

        <div className="fixed bottom-16 sm:bottom-20 right-4 sm:right-6 z-50 w-[26rem] sm:w-[27rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gold/40 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">

          <div className="bg-gradient-to-r from-primary to-slate-900 px-4 py-3 text-white">

            <p className="text-xs font-bold uppercase tracking-wider text-gold">

              {isEn ? "Sen Việt 24/7 Support Center" : "Trung tâm Hỗ trợ Sen Việt 24/7"}

            </p>

            <p className="mt-0.5 text-xs text-white/80">

              {isEn ? "Choose your preferred channel for instant assistance" : "Chọn kênh tư vấn phù hợp với nhu cầu của quý khách"}

            </p>

          </div>



          <div className="divide-y divide-border p-2">

            {/* Lựa chọn 1: Trợ lý AI */}

            <button

              type="button"

              onClick={() => {

                setMenuOpen(false);

                setStaffOpen(false);

                setOpen(true);

                setBotUnreadCount(0);

              }}

              className="flex w-full items-start gap-3.5 rounded-xl p-3 text-left transition hover:bg-secondary/70"

            >

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/20 text-primary ring-1 ring-gold/50">

                <Bot className="h-6 w-6 text-amber-600" />

              </div>

              <div className="flex-1 min-w-0">

                <div className="flex items-center gap-1.5">

                  <span className="text-sm font-bold text-primary whitespace-nowrap">

                    {isEn ? "AI Concierge Consultation" : "Nhận tư vấn từ Trợ lý AI"}

                  </span>

                  {botUnreadCount > 0 ? (

                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 animate-pulse">

                      {botUnreadCount} {isEn ? "new" : "mới"}

                    </span>

                  ) : (

                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">

                      24/7

                    </span>

                  )}

                </div>

                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">

                  {isEn ? "Instant room availability, automated rates, promo codes & quick booking" : "Tra cứu phòng trống, báo giá tự động, săn mã giảm giá & đặt phòng nhanh"}

                </p>

              </div>

            </button>



            {/* Lựa chọn 2: Nhân viên Lễ tân & Kết nối Zalo */}

            <button

              type="button"

              onClick={() => {

                setMenuOpen(false);

                setOpen(false);

                setStaffMode("web");

                setStaffOpen(true);

              }}

              className="flex w-full items-start gap-3.5 rounded-xl p-3 text-left transition hover:bg-secondary/70"

            >

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/30">

                <MessageSquareText className="h-5 w-5" />

              </div>

              <div className="flex-1 min-w-0">

                <div className="flex items-center gap-1.5">

                  <span className="text-sm font-bold text-primary whitespace-nowrap">

                    {isEn ? "Front Desk Chat" : "Chat với Nhân viên"}

                  </span>

                  {staffUnreadCount > 0 && (

                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 animate-pulse">

                      {staffUnreadCount} {isEn ? "new" : "mới"}

                    </span>

                  )}

                </div>

                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">

                  {isEn ? "Talk directly to hotel receptionists or customer support" : "Trao đổi trực tiếp với Lễ tân chi nhánh hoặc Tổng đài CSKH"}

                </p>

              </div>

            </button>

          </div>

        </div>

      )}



      {/* CỬA SỐ LUỒNG 2: CHAT VỚI NHÂN VIÊN TRÊN WEB & KẾT NỐI ZALO (KIỂU CELLPHONES) */}

      {staffOpen && (

        <div
          style={customWidth ? { width: `${customWidth}px`, maxWidth: "calc(100vw - 1.5rem)" } : undefined}
          className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${isResizing ? "" : "transition-all duration-300 ease-in-out"} ${

            isStaffExpanded

              ? "bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[48rem] md:w-[50vw] max-w-[60rem] h-[93vh] max-h-[58rem]"

              : "bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-[30rem] h-[37rem] max-h-[85vh]"

          }`}

        >
          {/* Thanh kéo tinh chỉnh chiều rộng ở cạnh trái */}
          <div
            onMouseDown={handleStartResize}
            title={isEn ? "Drag left edge to adjust chat width" : "Kéo cạnh trái để tinh chỉnh độ rộng khung chat"}
            className="hidden sm:flex absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-50 items-center justify-center group hover:bg-gold/25 transition-colors"
          >
            <div className="h-10 w-0.5 rounded-full bg-border group-hover:bg-gold transition-colors" />
          </div>

          {/* Header Nhân viên */}

          <div className="flex items-center justify-between bg-gradient-to-r from-blue-900 via-primary to-slate-900 px-4 py-3 text-white shadow-sm">

            <div className="flex items-center gap-2.5">

              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">

                <Headset className="h-5 w-5" />

                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-emerald-400" />

              </span>

              <div>

                <div className="text-sm font-bold leading-tight flex items-center gap-2">

                  <span>{isEn ? "Sen Việt Front Desk & Concierge" : "Tư vấn viên & Lễ tân Sen Việt"}</span>

                  {isStaffExpanded && (

                    <span className="hidden sm:inline-block rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px] font-medium text-blue-200">

                      {isEn ? "Expanded mode" : "Chế độ mở rộng"}

                    </span>

                  )}

                </div>

                <div className="text-[11px] text-white/80">

                  {isEn ? "Live Support on Web" : "Hỗ trợ trực tuyến trên Web"}

                </div>

              </div>

            </div>

            <div className="flex items-center gap-1">

              <button

                type="button"

                onClick={() => {

                  setStaffOpen(false);

                  setOpen(true);

                }}

                className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-gold transition hover:bg-white/20"

                title="Chuyển sang Trợ lý AI"

              >

                🤖 AI

              </button>

              <button

                type="button"

                onClick={() => { setCustomWidth(null); setIsStaffExpanded((prev) => !prev); }}

                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"

                title={isStaffExpanded ? "Thu nhỏ về góc" : "Phóng to cửa sổ chat để đọc thoải mái hơn"}

              >

                {isStaffExpanded ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}

              </button>

              <button

                type="button"

                onClick={() => setStaffOpen(false)}

                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"

                title="Đóng cửa sổ"

              >

                <X className="h-5 w-5" />

              </button>

            </div>

          </div>



              {/* Bộ chọn chi nhánh cần hỗ trợ (Routing về 1 đầu mối) */}

              <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/30 px-3.5 py-2 text-xs">

                <span className="shrink-0 font-semibold text-muted-foreground">

                  {isEn ? "Branch:" : "Chi nhánh:"}

                </span>

                <select

                  value={selectedBranch}

                  onChange={(e) => setSelectedBranch(e.target.value)}

                  className="flex-1 truncate rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-primary outline-none focus:border-primary"

                >

                  <option value="Tổng đài CSKH Toàn hệ thống Sen Việt">

                    Tổng đài CSKH Toàn hệ thống Sen Việt

                  </option>

                  {hotels.map((h) => (

                    <option key={h.slug} value={h.name}>

                      {h.name}

                    </option>

                  ))}

                </select>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${

                  isBranchOnline ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-300"

                }`}>

                  <span className={`h-1.5 w-1.5 rounded-full ${isBranchOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />

                  {isBranchOnline ? "Online" : "Offline"}

                </span>

              </div>



              {/* Nội dung tin nhắn với Nhân viên */}

              <div

                ref={staffScrollRef}

                className={`flex-1 space-y-3 overflow-y-auto leading-relaxed transition-all ${

                  isStaffExpanded ? "px-6 py-5 text-[14.5px]" : "px-4 py-3.5 text-xs"

                }`}

              >

                {staffMessages.map((msg) =>

                  msg.from === "user" ? (

                    <div key={msg.id} className="flex justify-end">

                      <div

                        className={`w-fit space-y-1 ${

                          isStaffExpanded ? "max-w-[70%]" : "max-w-[85%]"

                        }`}

                      >

                        <div className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-xs text-primary-foreground shadow-sm">

                          {msg.text}

                      </div>

                      <div className="flex items-center justify-end gap-1 text-right text-[10px] text-muted-foreground">

                        <span>{msg.time}</span>

                        <span>·</span>

                        <span className="font-medium text-primary/75">{msg.branchName}</span>

                        <span>·</span>

                        {msg.isRead ? (

                          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold" title="Nhân viên đã đọc tin nhắn">

                            ✓✓ Đã xem

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium" title={isBranchOnline ? "Đã gửi tới quầy Lễ tân (Chưa đọc)" : "Chi nhánh hiện ngoại tuyến, tin nhắn đang chờ đọc"}>

                            ✓ Đã gửi (Chưa đọc)

                          </span>

                        )}

                      </div>

                      </div>

                    </div>

                  ) : (

                    <div

                      key={msg.id}

                      className={`space-y-1 ${

                        isStaffExpanded ? "max-w-[75%]" : "max-w-[88%]"

                      }`}

                    >

                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary">

                        <Headset className="h-3 w-3 text-blue-600" />

                        <span>{msg.senderName || "Lễ tân Sen Việt"}</span>

                        {msg.branchName && (

                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9.5px] font-medium text-blue-800">

                            {msg.branchName}

                          </span>

                        )}

                        <span className="text-muted-foreground font-normal">· {msg.time}</span>

                      </div>

                      <div className="rounded-2xl rounded-tl-sm border border-border bg-secondary/70 px-3.5 py-2.5 text-xs text-foreground shadow-sm">

                        {msg.text}

                      </div>

                    </div>

                  ),

                )}



                {isStaffTyping && (

                  <div className="flex max-w-[85%] items-center gap-2 rounded-2xl bg-secondary px-3.5 py-2 text-xs text-muted-foreground">

                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />

                    <span>{isEn ? "Front desk is typing..." : "Lễ tân đang phản hồi..."}</span>

                  </div>

                )}

              </div>



              {/* Chủ đề hỏi nhanh */}

              <div className="flex flex-wrap gap-1.5 border-t border-border bg-muted/20 px-3 py-2">

                {staffQuickTopics.map((topic) => (

                  <button

                    key={topic}

                    type="button"

                    onClick={() => sendStaffMessage(topic)}

                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"

                  >

                    {topic}

                  </button>

                ))}

              </div>



              {/* Ô nhập tin nhắn với Nhân viên */}

              <form

                onSubmit={(e) => {

                  e.preventDefault();

                  sendStaffMessage(staffInput);

                }}

                className="flex items-center gap-2 border-t border-border bg-card p-2.5"

              >

                <input

                  ref={staffInputRef}

                  value={staffInput}

                  onChange={(e) => setStaffInput(e.target.value)}

                  placeholder={isEn ? "Type a message for front desk support..." : "Nhập nội dung cần nhân viên hỗ trợ..."}

                  className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"

                />

                {recognitionRef.current && (

                  <Button

                    type="button"

                    variant="ghost"

                    size="icon"

                    onClick={() => toggleListening("staff")}

                    title={isEn ? "Voice input" : "Nhập bằng giọng nói"}

                    className={`h-9 w-9 shrink-0 rounded-full transition-colors ${

                      isListening && voiceTargetRef.current === "staff"

                        ? "bg-red-100 text-red-500 border-red-500 animate-pulse"

                        : "text-muted-foreground hover:text-primary"

                    }`}

                  >

                    <Mic className="h-4 w-4" />

                  </Button>

                )}

                <Button

                  type="submit"

                  size="icon"

                  disabled={!staffInput.trim() || isStaffTyping}

                  className="h-9 w-9 shrink-0 rounded-full"

                >

                  <Send className="h-4 w-4" />

                </Button>

              </form>

        </div>

      )}



      {/* CỬA SỔ LUỒNG 1: TRỢ LÝ AI (AI CONCIERGE) */}

      <AnimatePresence>

        {open && (

          <motion.div

            variants={chatWindowVariants}

            initial="hidden"

            animate="visible"

            exit="exit"

          style={customWidth ? { width: `${customWidth}px`, maxWidth: "calc(100vw - 1.5rem)" } : undefined}
          className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl ${isResizing ? "" : "transition-all duration-300 ease-in-out"} ${

            isExpanded

              ? "bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[48rem] md:w-[50vw] max-w-[60rem] h-[93vh] max-h-[58rem]"

              : "bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-[30rem] h-[37rem] max-h-[85vh]"

          }`}

        >
          {/* Thanh kéo tinh chỉnh chiều rộng ở cạnh trái */}
          <div
            onMouseDown={handleStartResize}
            title={isEn ? "Drag left edge to adjust chat width" : "Kéo cạnh trái để tinh chỉnh độ rộng khung chat"}
            className="hidden sm:flex absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-50 items-center justify-center group hover:bg-gold/25 transition-colors"
          >
            <div className="h-10 w-0.5 rounded-full bg-border group-hover:bg-gold transition-colors" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between gap-2 bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-sm">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{t("ai.widgetTitle")}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" title="Online" />
                  {selectedBranch && (
                    <span className="hidden sm:inline-block truncate max-w-[120px] rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-medium text-gold">
                      {formatShortBranchName(selectedBranch)}
                    </span>
                  )}
                  {isExpanded && (
                    <span className="hidden md:inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white whitespace-nowrap shrink-0">
                      {isEn ? "Half-page" : "Nửa trang"}
                    </span>
                  )}
                </div>
                <div className="text-[10px] opacity-75 truncate">Powered by Google Gemini AI</div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setStaffOpen(true);
                }}
                className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-gold transition hover:bg-white/20 whitespace-nowrap shrink-0"
                title="Chuyển sang Chat với Lễ tân / Zalo"
              >
                💬 {isEn ? "Front Desk" : "Lễ tân"}
              </button>
              <button
                onClick={handleStartNewChat}
                className="rounded-full p-1.5 text-primary-foreground/80 transition hover:bg-white/10 hover:text-white shrink-0"
                title={isEn ? "New conversation" : "Cuộc trò chuyện mới"}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => { setCustomWidth(null); setIsExpanded((prev) => !prev); }}
                className="rounded-full p-1.5 text-primary-foreground/80 transition hover:bg-white/10 hover:text-white shrink-0"
                title={isExpanded ? (isEn ? "Restore" : "Thu nhỏ") : (isEn ? "Expand half-page" : "Mở rộng nửa trang")}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <Link
                to="/chat"
                onClick={() => {
                  try { sessionStorage.setItem("senviet_chat_return_to", location.pathname + location.search); } catch {}
                  setOpen(false);
                }}
                className="rounded-full p-1.5 text-primary-foreground/80 transition hover:bg-white/10 hover:text-white shrink-0"
                title={isEn ? "Open full-page chat (Tiki style)" : "Mở trang chat riêng toàn màn hình"}
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-primary-foreground/80 transition hover:bg-white/10 hover:text-white shrink-0"
                title={isEn ? "Close" : "Đóng"}
              >
                <X className="h-4.5 w-4.5" />
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
                  <div key={m.id} className="flex justify-end">
                    <div
                      className={`w-fit rounded-2xl rounded-tr-xs bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm break-words ${
                        isExpanded ? "max-w-[70%]" : "max-w-[85%]"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              }



              // Bot message: parse text & optional booking card / payos payment / hotel reservation

              let { cleanText, bookingCard, payosPayment, hotelReservation } = parseBotMessage(m.text);



              // 1. Ánh xạ thẻ thanh toán PayOS nếu tin nhắn này có lưu thông tin thanh toán

              if (m.state?.qrUrl && m.state?.currentStep === "PAYMENT_PROCESSING" && m.state?.status !== "CANCELLED") {

                const qtyPrefix = m.state.roomQty && m.state.roomQty > 1 ? `${m.state.roomQty} x ` : "";

                payosPayment = {

                  bookingId: m.state.bookingId || "BKG_SENVIET",

                  orderId: m.state.orderId || m.state.bookingId || "N/A",

                  hotelName: m.state.branch?.name || "Chi nhánh Sen Việt Luxury",

                  roomName: qtyPrefix + "Phòng " + (m.state.roomType?.id || m.state.roomType || "STANDARD"),

                  checkIn: m.state.checkIn || "",

                  checkOut: m.state.checkOut || "",

                  customerName: m.state.guestInfo?.name || "Quý khách",

                  customerPhone: m.state.guestInfo?.phone || "",

                  services: m.state.services?.map((s: any) => s.name || s.id).join(", ") || "",

                  promotion: m.state.promoCode || "",

                  totalAmount: m.state.amountToPay || 350000,

                  qrCodeUrl: m.state.qrUrl || "",

                  checkoutUrl: m.state.checkoutUrl || ""

                };

              }



              // 2. Ánh xạ thẻ đặt phòng nhanh CHỈ KHI có chỉ định rõ ràng từ AI (cardAction === "SHOW_ROOM_OPTIONS")

              const shouldShowBookingCard =

                Boolean(

                  m.state?.cardAction === "SHOW_ROOM_OPTIONS" &&

                  m.state?.branch &&

                  m.state?.availableRooms &&

                  m.state.availableRooms.length > 0 &&

                  m.state?.currentStep !== "PAYMENT_PROCESSING" &&

                  !m.state?.qrUrl

                );



              if (shouldShowBookingCard && m.state?.branch && !bookingCard) {

                const branchId = Number(m.state.branch?.id || m.state.hotelId || 1);

                const rawName = m.state.branch?.name;

                const hotelSlug = getSlugFromHotelName(rawName, branchId);

                const hotelName = rawName || hotels.find((h) => h.slug === hotelSlug)?.name || "Khách sạn Sen Việt";

                const qtyPrefix = m.state.roomQty && m.state.roomQty > 1 ? `${m.state.roomQty} x ` : "";

                bookingCard = {

                  hotelName,

                  hotelSlug,

                  checkInDate: m.state.checkIn,

                  checkOutDate: m.state.checkOut,

                  adults: m.state.guests?.adults,

                  children: m.state.guests?.children,

                  rooms: m.state.roomQty || 1,

                  roomType: m.state.roomType?.id || m.state.roomType || "",

                  roomTypeName: qtyPrefix + "Phòng " + (m.state.roomType?.id || m.state.roomType || ""),

                  pricePerNight: m.state.availableRooms?.find((r: any) => r.roomType === (m.state.roomType?.id || m.state.roomType))?.pricePerNight || m.state.amountToPay || 0,

                  customerName: m.state.guestInfo?.name,

                  customerPhone: m.state.guestInfo?.phone,

                  roomOptions: (m.state.availableRooms && m.state.availableRooms.length > 0) ? m.state.availableRooms.map((r: any) => ({

                    type: r.roomType || "",

                    typeName: r.roomTypeName || r.roomType,

                    price: r.pricePerNight || 0

                  })) : []

                };

              }



              const hasInteractiveCard = Boolean(bookingCard || payosPayment || hotelReservation);
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl rounded-tl-xs bg-secondary px-3.5 py-2.5 text-secondary-foreground shadow-sm ${
                    hasInteractiveCard
                      ? isExpanded ? "w-full max-w-[85%]" : "w-full max-w-[94%]"
                      : isExpanded ? "w-fit max-w-[75%]" : "w-fit max-w-[88%]"
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

                          <CheckCircle2 className="h-4 w-4" /> {isEn ? "Front Desk Reservation Slip" : "Phiếu giữ phòng tại quầy"}

                        </span>

                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">

                          {isEn ? "Code" : "Mã"} #{hotelReservation.orderId || hotelReservation.bookingId}

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

                          <span>{formatStayDates(hotelReservation.checkIn, hotelReservation.checkOut, language)}</span>

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

                          <span className="text-xs font-medium text-foreground">{isEn ? "Pay at check-in:" : "Thanh toán khi nhận phòng:"}</span>

                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">

                            {formatVnd(hotelReservation.totalAmount)}

                          </span>

                        </div>



                        <div className="mt-2 rounded-lg bg-muted/60 p-2 text-[11px] text-muted-foreground sm:col-span-2">

                          📌 {isEn ? "Please settle payment directly at the front desk upon check-in at 14:00." : "Quý khách vui lòng thanh toán trực tiếp tại quầy lễ tân khi làm thủ tục check-in lúc 14:00 ngày nhận phòng."}

                        </div>

                      </div>

                    </div>

                  )}



                  {/* THẺ THANH TOÁN PAYOS / VIETQR (AI AGENT CREATED BOOKING) */}

                  {payosPayment && (() => {

                    const displayCode =

                      payosPayment.bookingId && payosPayment.bookingId !== "BKG_SENVIET"

                        ? payosPayment.bookingId

                        : payosPayment.orderId;



                    const isCardConfirmed =

                      m.state?.status === "CONFIRMED" ||

                      (payosPayment.bookingId && confirmedBookingIds.includes(String(payosPayment.bookingId))) ||

                      (payosPayment.orderId && confirmedBookingIds.includes(String(payosPayment.orderId))) ||

                      getBookings().some(

                        (b) =>

                          (b.id === payosPayment.bookingId || b.id === payosPayment.orderId) &&

                          b.status === "confirmed"

                      );



                    const isCardCancelled =

                      !isCardConfirmed &&

                      (m.state?.status === "CANCELLED" ||

                        (payosPayment.bookingId && cancelledBookingIds.includes(String(payosPayment.bookingId))) ||

                        (payosPayment.orderId && cancelledBookingIds.includes(String(payosPayment.orderId))) ||

                        getBookings().some(

                          (b) =>

                            (b.id === payosPayment.bookingId || b.id === payosPayment.orderId) &&

                            b.status === "cancelled"

                        ));



                    return (

                      <div

                        className={`mt-3 overflow-hidden rounded-xl border p-4 shadow-lg transition-colors ${

                          isCardConfirmed

                            ? "border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20"

                            : isCardCancelled

                            ? "border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20"

                            : "border-emerald-500/50 bg-card"

                        }`}

                      >

                        <div className="flex items-center justify-between border-b border-border/60 pb-2">

                          {isCardConfirmed ? (

                            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">

                              <CheckCircle2 className="h-4 w-4" /> {isEn ? "Paid & Reservation Confirmed" : "Đã thanh toán & Xác nhận giữ phòng"}

                            </span>

                          ) : isCardCancelled ? (

                            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">

                              <XCircle className="h-4 w-4" /> {isEn ? "Booking Cancelled (Hold Expired)" : "Đơn đã bị hủy (Hết hạn giữ chỗ)"}

                            </span>

                          ) : (

                            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">

                              <Clock className="h-4 w-4" /> {isEn ? "Temporary Room Hold (5 mins)" : "Đơn giữ chỗ tạm thời (5 phút)"}

                            </span>

                          )}

                          <span

                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${

                              isCardCancelled

                                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"

                                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"

                            }`}

                          >

                            {isEn ? "Code" : "Mã"} #{displayCode}

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

                              <span>{formatStayDates(payosPayment.checkIn, payosPayment.checkOut, language)}</span>

                            </div>



                            <div className="flex items-center gap-1.5">

                              <UserIcon className="h-3.5 w-3.5 text-gold shrink-0" />

                              <span>{payosPayment.customerName} · {payosPayment.customerPhone}</span>

                            </div>



                            {payosPayment.services && (

                              <div className="flex items-center gap-1.5 text-[11.5px]">

                                <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />

                                <span>{isEn ? "Add-on services:" : "Dịch vụ thêm:"} <strong className="text-foreground">{payosPayment.services}</strong></span>

                              </div>

                            )}



                            {payosPayment.promotion && (

                              <div className="flex items-center gap-1.5 text-[11.5px]">

                                <Tag className="h-3.5 w-3.5 text-emerald-500 shrink-0" />

                                <span>{isEn ? "Promotion:" : "Ưu đãi:"} <strong className="text-emerald-600 dark:text-emerald-400">{payosPayment.promotion}</strong></span>

                              </div>

                            )}



                            <div

                              className={`mt-2 flex items-center justify-between rounded-lg px-2.5 py-1.5 ${

                                isCardCancelled

                                  ? "bg-rose-500/10 text-muted-foreground"

                                  : "bg-emerald-500/10 text-foreground"

                              }`}

                            >

                              <span className="text-xs font-medium">{isEn ? "Total payment:" : "Tổng thanh toán:"}</span>

                              <span

                                className={`text-sm font-bold ${

                                  isCardCancelled

                                    ? "text-rose-600 dark:text-rose-400 line-through opacity-80"

                                    : "text-emerald-600 dark:text-emerald-400"

                                }`}

                              >

                                {formatVnd(payosPayment.totalAmount)}

                              </span>

                            </div>



                            {isCardConfirmed ? (

                              <div className="mt-2.5">

                                <Button

                                  asChild

                                  size="sm"

                                  className="w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"

                                >

                                  <Link to={`/booking-success/${displayCode}`} onClick={() => setOpen(false)}>

                                    {isEn ? "View Booking Confirmation" : "Xem phiếu xác nhận đặt phòng"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />

                                  </Link>

                                </Button>

                              </div>

                            ) : isCardCancelled ? (

                              <div className="mt-2.5">

                                <Button

                                  onClick={() => {

                                    const prompt = `Em muốn đặt lại phòng ${payosPayment.roomName} tại ${payosPayment.hotelName} từ ${payosPayment.checkIn} đến ${payosPayment.checkOut}`;

                                    send(prompt);

                                  }}

                                  size="sm"

                                  className="w-full rounded-xl bg-amber-600 font-semibold text-white shadow-sm hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"

                                >

                                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> {isEn ? "Rebook this room" : "Đặt lại phòng này"}

                                </Button>

                              </div>

                            ) : (

                              <div className="mt-2.5 space-y-1.5">

                                <Button

                                  onClick={async () => {

                                    const checkId = payosPayment.orderId !== "N/A" ? payosPayment.orderId : payosPayment.bookingId;

                                    try {

                                      const res = await fetch(`${API_BASE_URL}/payment/check-order-status/${checkId}`);

                                      if (res.ok) {

                                        const raw = await res.json();

                                        const d = raw?.result ?? raw;

                                        if (d.isPaid || d.status === "PAID" || d.status === "CONFIRMED") {

                                          handleBookingConfirmation(

                                            String(d.bookingId || payosPayment.bookingId),

                                            String(d.orderId || payosPayment.orderId)

                                          );

                                          return;

                                        }

                                      }

                                      toast({ title: "Đang kiểm tra giao dịch", description: "Hệ thống đang đồng bộ giao dịch từ ngân hàng, vui lòng đợi vài giây sau khi chuyển khoản..." });

                                    } catch {

                                      toast({ title: "Lỗi kiểm tra", description: "Không thể kiểm tra trạng thái lúc này, vui lòng thử lại.", variant: "destructive" });

                                    }

                                  }}

                                  size="sm"

                                  className="w-full rounded-xl bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"

                                >

                                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> {isEn ? "Check payment status" : "Kiểm tra thanh toán ngay"}

                                </Button>

                                {payosPayment.checkoutUrl && (

                                  <Button

                                    asChild

                                    variant="outline"

                                    size="sm"

                                    className="w-full rounded-xl border-emerald-500/40 text-xs font-medium text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"

                                  >

                                    <a href={payosPayment.checkoutUrl} target="_blank" rel="noopener noreferrer">

                                      {isEn ? "Open PayOS Payment Gateway" : "Mở cổng thanh toán PayOS"} <ExternalLink className="ml-1.5 h-3 w-3" />

                                    </a>

                                  </Button>

                                )}

                              </div>

                            )}

                          </div>



                          {/* QR Code PayOS */}

                          {payosPayment.qrCodeUrl && (

                            <div className="text-center">

                              <div

                                className={`relative inline-block rounded-xl border-2 border-dashed p-2 shadow-inner overflow-hidden ${

                                  isCardConfirmed

                                    ? "border-emerald-500 bg-emerald-500/10"

                                    : isCardCancelled

                                    ? "border-rose-400/40 bg-muted/40"

                                    : "border-emerald-500/40 bg-white"

                                }`}

                              >

                                <img

                                  src={

                                    payosPayment.qrCodeUrl.startsWith("http")

                                      ? payosPayment.qrCodeUrl

                                      : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payosPayment.qrCodeUrl)}`

                                  }

                                  alt="Mã QR PayOS"

                                  className={`h-44 w-44 object-contain mx-auto ${

                                    isCardCancelled || isCardConfirmed ? "opacity-20 grayscale" : ""

                                  }`}

                                />

                                {isCardConfirmed && (

                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/85 backdrop-blur-[1px] p-2 text-center">

                                    <CheckCircle2 className="h-9 w-9 text-emerald-500 mb-1" />

                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">

                                      Đã thanh toán thành công

                                    </p>

                                    <p className="text-[10.5px] text-muted-foreground mt-0.5 max-w-[150px] leading-tight">

                                      Phòng của quý khách đã được xác nhận giữ chỗ trên hệ thống.

                                    </p>

                                  </div>

                                )}

                                {isCardCancelled && (

                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-[1px] p-2 text-center">

                                    <AlertTriangle className="h-7 w-7 text-rose-500 mb-1" />

                                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">

                                      Mã QR đã hết hạn

                                    </p>

                                    <p className="text-[10.5px] text-muted-foreground mt-0.5 max-w-[140px] leading-tight">

                                      Đơn phòng đã bị hủy. Bấm "Đặt lại phòng này" để tạo đơn mới.

                                    </p>

                                  </div>

                                )}

                              </div>

                              <p

                                className={`mt-1.5 text-[11px] flex items-center justify-center gap-1 ${

                                  isCardConfirmed

                                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"

                                    : isCardCancelled

                                    ? "text-rose-600 dark:text-rose-400 font-medium"

                                    : "text-muted-foreground"

                                }`}

                              >

                                {isCardConfirmed ? (

                                  <>

                                    <CheckCircle2 className="h-3.5 w-3.5" /> Đã xác nhận thanh toán PayOS

                                  </>

                                ) : isCardCancelled ? (

                                  <>

                                    <XCircle className="h-3.5 w-3.5" /> Giao dịch giữ chỗ đã đóng

                                  </>

                                ) : (

                                  <>

                                    <QrCode className="h-3.5 w-3.5 text-emerald-500" /> Tự động xác nhận ngay sau khi quét mã

                                  </>

                                )}

                              </p>

                            </div>

                          )}

                        </div>

                      </div>

                    );

                  })()}





                  {/* THẺ ĐẶT PHÒNG TƯƠNG TÁC (AI AGENT ACTION CARD) */}

                  {bookingCard && (

                    <div className="mt-3 overflow-hidden rounded-xl border border-gold/40 bg-card p-3 shadow-md">

                      <div className="flex items-center justify-between border-b border-border/60 pb-2">

                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold">

                          <Sparkles className="h-3.5 w-3.5 fill-gold text-gold" /> {isEn ? "Quick Booking Card" : "Thẻ đặt phòng nhanh"}

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

                              {formatStayDates(bookingCard.checkInDate, bookingCard.checkOutDate, language)}

                            </span>

                          </div>

                        )}

                      </div>



                      {/* Nếu AI trả về danh sách nhiều loại phòng (như khi hỏi phòng còn trống): hiển thị danh sách chọn nhanh */}

                      {bookingCard.roomOptions && bookingCard.roomOptions.length > 0 ? (

                        <div className="mt-3 space-y-2 border-t border-border/50 pt-2.5">

                          <p className="text-[11px] font-medium text-foreground">{isEn ? "Select a room category to book:" : "Chọn hạng phòng để đặt nhanh:"}</p>

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

                                    <span className="text-[10px] font-normal text-muted-foreground"> / {isEn ? "night" : "đêm"}</span>

                                  </div>

                                </div>

                                <Button

                                  asChild

                                  size="sm"

                                  className="h-7 rounded-lg bg-gold px-3 text-xs font-semibold text-gold-foreground shadow-sm hover:bg-gold/90"

                                >

                                  <Link

                                    to={`/hotels/${bookingCard.hotelSlug}?roomType=${opt.type}&checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&adults=${bookingCard.adults || 2}&children=${bookingCard.children || 0}&rooms=${bookingCard.rooms || 1}`}

                                    onClick={(e) =>
                                      handleGuestProtectedBooking(
                                        e,
                                        `/hotels/${bookingCard.hotelSlug}?roomType=${opt.type}&checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&adults=${bookingCard.adults || 2}&children=${bookingCard.children || 0}&rooms=${bookingCard.rooms || 1}`
                                      )
                                    }

                                  >

                                    {isEn ? "Book now" : "Đặt ngay"} <ArrowRight className="ml-1 h-3 w-3" />

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

                                {bookingCard.adults || 2} {isEn ? "adults" : "người lớn"}

                                {bookingCard.children ? ` · ${bookingCard.children} ${isEn ? "children" : "trẻ em"}` : ""}

                                {bookingCard.rooms ? ` · ${bookingCard.rooms} ${isEn ? "rooms" : "phòng"}` : ""}

                              </span>

                            </div>



                            {bookingCard.pricePerNight && (

                              <div className={`mt-2 flex items-center justify-between border-t border-border/50 pt-2 ${isExpanded ? "sm:col-span-2" : ""}`}>

                                <span className="text-muted-foreground">{isEn ? "Reference rate:" : "Giá tham khảo:"}</span>

                                <span className="text-sm font-bold text-primary">

                                  {formatVnd(bookingCard.pricePerNight)}

                                  <span className="text-[10px] font-normal text-muted-foreground"> / {isEn ? "night" : "đêm"}</span>

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

                                to={`/checkout?hotel=${bookingCard.hotelSlug || "sen-viet-an-nhon"}&checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&room=${encodeURIComponent(bookingCard.roomTypeName || "Phòng Deluxe")}&roomType=${bookingCard.roomType || "DELUXE"}&roomPrice=${bookingCard.pricePerNight || 1200000}&adults=${bookingCard.adults || 2}&children=${bookingCard.children || 0}&rooms=${bookingCard.rooms || 1}&fullName=${encodeURIComponent(bookingCard.customerName || "")}&phone=${encodeURIComponent(bookingCard.customerPhone || "")}`}

                                onClick={(e) =>
                                  handleGuestProtectedBooking(
                                    e,
                                    `/checkout?hotel=${bookingCard.hotelSlug || "sen-viet-an-nhon"}&checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&room=${encodeURIComponent(bookingCard.roomTypeName || "Phòng Deluxe")}&roomType=${bookingCard.roomType || "DELUXE"}&roomPrice=${bookingCard.pricePerNight || 1200000}&adults=${bookingCard.adults || 2}&children=${bookingCard.children || 0}&rooms=${bookingCard.rooms || 1}&fullName=${encodeURIComponent(bookingCard.customerName || "")}&phone=${encodeURIComponent(bookingCard.customerPhone || "")}`
                                  )
                                }

                              >

                                {isEn ? "Confirm & Pay Now" : "Xác nhận & Thanh toán ngay"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />

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

                <span className="animate-pulse">{isEn ? "AI Concierge is typing a response..." : "Trợ lý AI đang soạn câu trả lời..."}</span>

              </div>

            )}

          </div>



          {/* Quick replies on 1 line */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-t border-border bg-muted/30 px-3 py-2 whitespace-nowrap">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={isTyping}
                className="shrink-0 rounded-full border border-amber-200/90 bg-amber-50/70 dark:border-amber-700/60 dark:bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-900 dark:text-amber-200 transition-all duration-150 hover:bg-amber-100/90 hover:border-amber-300 hover:text-amber-950 active:scale-95 shadow-2xs disabled:opacity-50"
              >
                💬 {q}
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

            <Button

              type="button"

              size="icon"

              variant="outline"

              onClick={() => toggleListening("ai")}

              className={`h-9 w-9 shrink-0 rounded-full transition-colors ${isListening && voiceTargetRef.current === "ai" ? 'bg-red-100 text-red-500 border-red-500 animate-pulse' : 'text-muted-foreground hover:text-gold'}`}

              title="Nhập bằng giọng nói"

            >

              <Mic className="h-4 w-4" />

            </Button>

            <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={isTyping || !input.trim()}>

              <Send className="h-4 w-4" />

            </Button>

          </form>

          </motion.div>

        )}

      </AnimatePresence>

    </>

  );

}

