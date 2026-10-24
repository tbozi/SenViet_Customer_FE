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
  Mic,
  RotateCcw,
  Headset,
  PhoneCall,
  MessageSquareText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useSendChatMessageMutation, useLazyGetChatHistoryQuery } from "@/services/chatApi";
import type { ChatMessage as ChatMessageType } from "@/services/chatApi";
import { formatVnd, hotels } from "@/data/hotels";
import { sendCustomerChatMessage, initCustomerSocket, type StaffReplyPayload } from "@/lib/socket";
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
}

const SENVIET_ZALO_HOTLINE = "0989809036";
const SENVIET_ZALO_URL = `https://zalo.me/${SENVIET_ZALO_HOTLINE}`;

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

function formatReply(text: string): string {
  const safe = escapeHtml(text || "");
  return safe
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\s*[-•]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-1 space-y-0.5">$&</ul>')
    .replace(/\n/g, "<br/>");
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
  const { t } = useLanguage();
  const { user } = useAuth();
  const userKey = getUserStorageKey(user?.email);
  const sessionKey = `senviet_chat_session_${userKey}`;
  const cacheKey = `senviet_cached_chat_messages_${userKey}`;

  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "vi-VN";
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
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
        setMessages((prev) => (prev.length > 0 ? prev : [{ id: 1, from: "bot", text: t("ai.widgetGreeting") }]));
      }
    };
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [userKey, sessionKey, cacheKey, triggerGetHistory, t]);

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
        }).unwrap();

        const reply = result.result?.reply || t("ai.genericReply");
        const state = result.result?.state;

        // Add bot reply to UI
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, from: "bot", text: reply, state: state },
        ]);

        // Synchronize booking to client localStorage for history & success pages
        if (state?.bookingId) {
          currentBookingIdRef.current = state.bookingId;
          const existing = getBookings().find((b) => b.id === state.bookingId);
          if (!existing) {
            const checkIn = state.checkIn || new Date().toISOString().split("T")[0];
            const checkOut = state.checkOut || new Date(Date.now() + 86400000).toISOString().split("T")[0];
            const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
            const payAmount = Number(state.amountToPay || 2000);

            // Construct services list if any
            const rawServices = state.services || [];
            const bookingServices: BookingService[] = rawServices.map((s: any, idx: number) => ({
              id: String(s.id || s.serviceId || `svc_${idx}`),
              name: s.name || s.serviceName || "Dịch vụ phòng",
              category: s.category || "Dịch vụ",
              quantity: Number(s.quantity || 1),
              unitPrice: Number(s.price || s.unitPrice || 0),
              total: Number(s.total || (Number(s.price || s.unitPrice || 0) * Number(s.quantity || 1))),
            }));
            const servicesTotal = bookingServices.reduce((sum, s) => sum + s.total, 0);
            const roomQty = Math.max(1, state.roomQty || 1);
            const roomTotal = Math.max(0, payAmount - servicesTotal);
            const nightlyPrice = Math.round(roomTotal / (nights * roomQty));
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
              discount: 0,
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

        // Track order ID for payment polling
        if (state?.orderId && state?.status !== "CONFIRMED" && !confirmedOrdersRef.current.has(String(state.orderId))) {
          setActivePaymentOrderId(String(state.orderId));
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
        const res = await fetch(`/payment/check-order-status/${orderToCheck}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.isPaid || data.status === "PAID" || data.status === "CLOSED") {
          clearInterval(interval);
          if (isCancelled) return;
          confirmedOrdersRef.current.add(orderToCheck);
          setActivePaymentOrderId(null);
          const bId = currentBookingIdRef.current;
          if (bId) {
            updateBooking(bId, { status: "confirmed" });
          }
          const savedBooking = getBookings().find((b) => b.id === bId || b.id === orderToCheck);
          const hotelName = savedBooking?.hotelName || "Chi nhánh Sen Việt Luxury";
          const roomName = savedBooking?.roomName || "Phòng nghỉ Sen Việt";
          const nights = savedBooking?.nights || 1;
          const rooms = savedBooking?.rooms || 1;
          const checkIn = savedBooking?.checkIn || "";
          const checkOut = savedBooking?.checkOut || "";
          const totalFormatted = formatVnd(savedBooking?.total || 0);

          setMessages((prev) => {
            const alreadyNotified = prev.some(
              (m) =>
                m.text.includes("Chúc mừng quý khách") &&
                (m.text.includes(String(bId)) || m.text.includes(String(orderToCheck)))
            );
            if (alreadyNotified) return prev;
            return [
              ...prev,
              {
                id: Date.now() + 2,
                from: "bot",
                text: `🎉 **XÁC NHẬN THANH TOÁN THÀNH CÔNG!**\n\nHệ thống Sen Việt Luxury đã ghi nhận thanh toán thành công qua PayOS VietQR cho đơn đặt phòng **#${bId || orderToCheck}**!\n\n📋 **Thông tin phòng đã xác nhận:**\n- **Khách sạn:** ${hotelName}\n- **Hạng phòng:** ${roomName} (${rooms} phòng, ${nights} đêm)\n- **Thời gian lưu trú:** ${checkIn} ➔ ${checkOut}\n- **Số tiền đã thanh toán:** **${totalFormatted}** (Đã thanh toán đủ)\n- **Trạng thái đơn:** **Đã xác nhận (Confirmed)** ✅\n\nQuý khách có thể xem đầy đủ chi tiết dịch vụ, phòng và xuất hóa đơn điện tử trong mục **[Lịch sử booking](/history)**. Chúc quý khách có kỳ nghỉ tuyệt vời cùng Sen Việt Luxury!`,
              },
            ];
          });
        }
      } catch (err) {
        console.error("[ChatWidget] Payment status check error:", err);
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [activePaymentOrderId]);

  const lastBotMsg = messages.filter((m) => m.from === "bot").slice(-1)[0]?.text?.toLowerCase() || "";
  const isAwaitingConfirmation =
    (lastBotMsg.includes("xác nhận") || lastBotMsg.includes("thanh toán")) &&
    !lastBotMsg.includes("payos_payment");

  const quickReplies = isAwaitingConfirmation
    ? ["✅ Xác nhận đặt phòng", "Chỉnh sửa thông tin", "Dịch vụ đưa đón sân bay"]
    : [
        t("ai.quickBook"),
        t("ai.quickOffer"),
        t("ai.quickLocation"),
        t("ai.quickSupport"),
      ];

  // ==================== LUỒNG 2: CHAT VỚI NHÂN VIÊN & KẾT NỐI ZALO (KIỂU CELLPHONES) ====================
  const staffCacheKey = `senviet_staff_chat_${userKey}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [isStaffExpanded, setIsStaffExpanded] = useState(false);
  const [staffMode, setStaffMode] = useState<"web" | "zalo">("web");
  const [selectedBranch, setSelectedBranch] = useState<string>(
    "Tổng đài CSKH Toàn hệ thống Sen Việt",
  );
  const [staffInput, setStaffInput] = useState("");
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const staffScrollRef = useRef<HTMLDivElement>(null);
  const processedStaffReplyIdsRef = useRef<Set<string>>(new Set());

  const [staffMessages, setStaffMessages] = useState<StaffMessage[]>(() => {
    try {
      const saved = localStorage.getItem(staffCacheKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 1,
        from: "staff",
        senderName: "Lễ tân trực tuyến Sen Việt",
        branchName: "Tổng đài CSKH Toàn hệ thống Sen Việt",
        time: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: "Dạ chào anh/chị ạ! Em là chuyên viên tư vấn khách hàng của hệ thống Khách sạn Sen Việt Luxury. Anh/chị cần hỗ trợ đặt phòng đoàn, xuất hóa đơn VAT, đổi lịch lưu trú hay kết nối qua Zalo ạ?",
      },
    ];
  });

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

      const rId = String(reply.msgId || `${reply.customerId}_${reply.message}`);
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

      setStaffMessages((prev) => {
        const isDuplicate = prev.some((m) => {
          if (reply.msgId && String(m.id) === String(reply.msgId)) return true;
          return m.from === "staff" && m.text === reply.message;
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

      // 🔔 2. Hiển thị Toast thông báo nổi nếu khách chưa mở chat
      if (!staffOpen) {
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

    // Tự động tải lịch sử tin nhắn từ PostgreSQL khi khách truy cập
    const fetchHistoryFromDb = async () => {
      try {
        const res = await fetch(`/live-chat/messages?customerId=${customerId}`);
        if (!res.ok) return;
        const data = await res.json();
        const serverMsgs = data.result;
        if (Array.isArray(serverMsgs) && serverMsgs.length > 0) {
          const mapped: StaffMessage[] = serverMsgs.map((m: any) => ({
            id: m.id || m.msgId,
            from: m.senderType === "CUSTOMER" ? "user" : "staff",
            senderName: m.senderName,
            branchName: selectedBranch,
            time: new Date(m.createdAt).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            text: m.message,
          }));
          setStaffMessages(mapped);
        }
      } catch (err) {
        console.warn("Could not load chat history from DB:", err);
      }
    };
    fetchHistoryFromDb();

    window.addEventListener("senviet_staff_chat_reply", handleStaffReply);
    return () => window.removeEventListener("senviet_staff_chat_reply", handleStaffReply);
  }, [customerId, user?.accountId, user?.email, selectedBranch, staffOpen]);

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
    };
    setStaffMessages((prev) => [...prev, userMsg]);
    setStaffInput("");
    setIsStaffTyping(true);

    const targetHotel = hotels.find((h) => h.name === selectedBranch);
    const branchHotelId = targetHotel?.id || (selectedBranch.includes("Sài Gòn") ? 1 : selectedBranch.includes("Hà Nội") ? 2 : selectedBranch.includes("Đà Nẵng") ? 3 : 1);

    // Gửi tin nhắn thực tế qua Socket.IO tới quầy Lễ tân & Quản trị
    sendCustomerChatMessage({
      msgId,
      customerId: String(customerId),
      customerName: user?.name || "Khách hàng (" + (user?.phone || "Trực tuyến") + ")",
      customerPhone: user?.phone || "",
      hotelId: branchHotelId,
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
            time: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            text: `Dạ Bộ phận Lễ tân & Chăm sóc khách hàng (${selectedBranch}) đã tiếp nhận và kết nối với anh/chị qua Socket.IO thời gian thực. Nhân viên trực ca đang xử lý và sẽ phản hồi trực tiếp ngay tại đây ạ!`,
          },
        ]);
      }, 600);
    } else {
      setTimeout(() => setIsStaffTyping(false), 800);
    }
  };

  const staffQuickTopics = [
    "Hỗ trợ hoàn tiền & hủy phòng",
    "Yêu cầu xuất hóa đơn VAT",
    "Xin nhận phòng sớm / trả phòng muộn",
    "Tư vấn đặt phòng đoàn / sự kiện",
  ];

  const handleToggleLauncher = () => {
    if (open || staffOpen) {
      setOpen(false);
      setStaffOpen(false);
      setMenuOpen(false);
    } else {
      setMenuOpen((prev) => !prev);
    }
  };

  return (
    <>
      {/* Nút Floating "Liên hệ" kiểu CellphoneS */}
      <button
        onClick={handleToggleLauncher}
        aria-label="Liên hệ tư vấn Sen Việt"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary via-primary to-slate-900 px-5 py-3.5 text-white shadow-xl shadow-black/25 ring-2 ring-gold/60 transition hover:scale-105"
      >
        {open || staffOpen || menuOpen ? (
          <>
            <X className="h-5 w-5 text-gold" />
            <span className="text-sm font-bold tracking-wide">Đóng</span>
          </>
        ) : (
          <>
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <Headset className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </span>
            <span className="text-sm font-bold tracking-wide">Liên hệ</span>
          </>
        )}
      </button>

      {/* MENU 2 LUỒNG TƯ VẤN (KIỂU CELLPHONES) */}
      {menuOpen && !open && !staffOpen && (
        <div className="fixed bottom-20 right-5 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-gold/40 bg-card shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-gradient-to-r from-primary to-slate-900 px-4 py-3 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-gold">
              Trung tâm Hỗ trợ Sen Việt 24/7
            </p>
            <p className="mt-0.5 text-xs text-white/80">
              Chọn kênh tư vấn phù hợp với nhu cầu của quý khách
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
              }}
              className="flex w-full items-start gap-3.5 rounded-xl p-3 text-left transition hover:bg-secondary/70"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/20 text-primary ring-1 ring-gold/50">
                <Bot className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-primary">
                    Nhận tư vấn từ Trợ lý AI
                  </span>
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    24/7
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Tra cứu phòng trống, báo giá tự động, săn mã giảm giá & đặt phòng nhanh
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
                  <span className="text-sm font-bold text-primary">
                    Chat với Nhân viên & Zalo
                  </span>
                  <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                    Zalo OA
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Trao đổi trực tiếp với Lễ tân trên Web hoặc chuyển sang ứng dụng Zalo
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* CỬA SỐ LUỒNG 2: CHAT VỚI NHÂN VIÊN TRÊN WEB & KẾT NỐI ZALO (KIỂU CELLPHONES) */}
      {staffOpen && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 ease-in-out ${
            isStaffExpanded
              ? "bottom-3 right-3 sm:bottom-6 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[48rem] md:w-[56rem] lg:w-[62rem] h-[93vh] max-h-[58rem]"
              : "bottom-24 right-5 w-[26rem] max-w-[calc(100vw-2rem)] sm:w-[28rem] h-[37rem] max-h-[84vh]"
          }`}
        >
          {/* Header Nhân viên */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-900 via-primary to-slate-900 px-4 py-3 text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                <Headset className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-emerald-400" />
              </span>
              <div>
                <div className="text-sm font-bold leading-tight flex items-center gap-2">
                  <span>Tư vấn viên & Lễ tân Sen Việt</span>
                  {isStaffExpanded && (
                    <span className="hidden sm:inline-block rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px] font-medium text-blue-200">
                      Chế độ mở rộng
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/80">
                  Hỗ trợ trực tuyến trên Web & Zalo Official
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
                onClick={() => setIsStaffExpanded((prev) => !prev)}
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

          {/* Thanh chuyển đổi 2 chế độ: Chat trực tiếp trên Web vs Mở Zalo */}
          <div className="grid grid-cols-2 gap-1.5 border-b border-border bg-muted/40 p-2">
            <button
              type="button"
              onClick={() => setStaffMode("web")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                staffMode === "web"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-primary"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat trên Web
            </button>
            <button
              type="button"
              onClick={() => setStaffMode("zalo")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                staffMode === "zalo"
                  ? "bg-[#0068FF] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-[#0068FF]"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              Nhắn qua Zalo
            </button>
          </div>

          {staffMode === "web" ? (
            <>
              {/* Bộ chọn chi nhánh cần hỗ trợ (Routing về 1 đầu mối) */}
              <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/30 px-3.5 py-2 text-xs">
                <span className="shrink-0 font-semibold text-muted-foreground">
                  Chi nhánh:
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
              </div>

              {/* Nội dung tin nhắn với Nhân viên */}
              <div
                ref={staffScrollRef}
                className={`flex-1 space-y-3 overflow-y-auto leading-relaxed transition-all ${
                  isStaffExpanded ? "px-6 py-5 text-[14.5px]" : "px-4 py-3.5 text-xs"
                }`}
              >
                {/* Banner gợi ý chuyển sang Zalo giống CellphoneS */}
                <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50/90 p-2.5 text-[11px] text-blue-950">
                  <span>
                    💬 Muốn giữ liên lạc tiện lợi trên điện thoại? Kết nối ngay qua <strong>Zalo Sen Việt</strong>!
                  </span>
                  <a
                    href={SENVIET_ZALO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg bg-[#0068FF] px-2.5 py-1.5 font-bold text-white shadow-sm hover:bg-[#0054cc]"
                  >
                    Mở Zalo
                  </a>
                </div>

                {staffMessages.map((msg) =>
                  msg.from === "user" ? (
                    <div
                      key={msg.id}
                      className={`ml-auto space-y-1 ${
                        isStaffExpanded ? "max-w-[70%]" : "max-w-[85%]"
                      }`}
                    >
                      <div className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-xs text-primary-foreground shadow-sm">
                        {msg.text}
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground">
                        {msg.time} · {msg.branchName}
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
                    <span>Lễ tân đang phản hồi...</span>
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
                  value={staffInput}
                  onChange={(e) => setStaffInput(e.target.value)}
                  placeholder="Nhập nội dung cần nhân viên hỗ trợ..."
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!staffInput.trim() || isStaffTyping}
                  className="h-9 w-9 shrink-0 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            /* TAB 2: KẾT NỐI QUA ZALO (GIỐNG CELLPHONES) */
            <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto p-5 text-center">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-[#0068FF]">
                  Zalo Official Hỗ trợ Khách hàng
                </span>
                <h3 className="text-base font-bold text-primary">
                  Chat với Nhân viên {selectedBranch} qua Zalo
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Quét mã QR bằng ứng dụng Zalo hoặc nhấn nút bên dưới để mở khung chat Zalo trực tiếp với bộ phận Lễ tân & CSKH ({selectedBranch}).
                </p>
              </div>

              {/* Bộ chọn chi nhánh nhanh ngay trong tab Zalo */}
              <div className="w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-1.5 text-xs text-left">
                <span className="shrink-0 font-medium text-muted-foreground text-[11px]">Chi nhánh:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="flex-1 truncate rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-primary outline-none focus:border-primary"
                >
                  <option value="Tổng đài CSKH Toàn hệ thống Sen Việt">Tổng đài CSKH Toàn hệ thống</option>
                  {hotels.map((h) => (
                    <option key={h.slug} value={h.name}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="my-2 rounded-2xl border-2 border-dashed border-[#0068FF]/40 bg-white p-3.5 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `https://zalo.me/${
                      selectedBranch.includes("Sài Gòn") ? "0989809036" :
                      selectedBranch.includes("Hà Nội") ? "0989809036" :
                      selectedBranch.includes("Đà Nẵng") ? "0989809036" :
                      SENVIET_ZALO_HOTLINE
                    }`
                  )}`}
                  alt={`Zalo QR ${selectedBranch}`}
                  className="mx-auto h-36 w-36 object-contain"
                />
                <p className="mt-2 text-[11px] font-semibold text-slate-700">
                  Hotline / Zalo tiếp nhận: <span className="font-mono text-[#0068FF]">{SENVIET_ZALO_HOTLINE}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  (Đầu số Zalo OA tiếp nhận điều phối tự động về quầy Lễ tân {selectedBranch})
                </p>
              </div>

              <div className="w-full space-y-2">
                <Button
                  asChild
                  className="w-full rounded-full bg-[#0068FF] py-5 text-xs font-bold text-white shadow-lg hover:bg-[#0054cc]"
                >
                  <a
                    href={SENVIET_ZALO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Mở ứng dụng Zalo & Chat ngay
                  </a>
                </Button>
                <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Hỗ trợ đặt phòng, xuất hóa đơn VAT & giải quyết khiếu nại 24/7</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CỬA SỔ LUỒNG 1: TRỢ LÝ AI (AI CONCIERGE) */}
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
                type="button"
                onClick={() => {
                  setOpen(false);
                  setStaffOpen(true);
                }}
                className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-gold transition hover:bg-white/20"
                title="Chuyển sang Chat với Nhân viên / Zalo"
              >
                💬 Nhân viên / Zalo
              </button>
              <button
                onClick={handleStartNewChat}
                className="rounded-full p-1.5 text-primary-foreground/80 transition hover:bg-white/10 hover:text-white"
                title="Bắt đầu cuộc trò chuyện mới"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
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
              let { cleanText, bookingCard, payosPayment, hotelReservation } = parseBotMessage(m.text);

              // 1. Ánh xạ thẻ thanh toán PayOS khi AI sinh mã QR thanh toán
              if (m.state?.qrUrl || m.state?.currentStep === "PAYMENT_PROCESSING") {
                const qtyPrefix = m.state.roomQty && m.state.roomQty > 1 ? `${m.state.roomQty} x ` : "";
                payosPayment = {
                  bookingId: m.state.bookingId || "BKG_SENVIET",
                  orderId: m.state.orderCode || m.state.bookingId || "N/A",
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

              // 2. Ánh xạ thẻ xác nhận đặt phòng khi chưa thanh toán
              if (m.state?.branch && m.state?.currentStep !== "PAYMENT_PROCESSING") {
                const qtyPrefix = m.state.roomQty && m.state.roomQty > 1 ? `${m.state.roomQty} x ` : "";
                bookingCard = {
                  hotelName: m.state.branch?.name || "Chi nhánh Sen Việt",
                  hotelSlug: "sen-viet",
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
                  roomOptions: (m.state.currentStep === "SELECT_ROOM" && m.state.availableRooms) ? m.state.availableRooms.map((r: any) => ({
                    type: r.roomType || "",
                    typeName: r.roomTypeName || r.roomType,
                    price: r.pricePerNight || 0
                  })) : []
                };
              }

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
                          <Clock className="h-4 w-4" /> Đơn giữ chỗ tạm thời (5 phút)
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
                                to={`/checkout?hotel=${bookingCard.hotelSlug || "sen-viet-an-nhon"}&checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&room=${encodeURIComponent(bookingCard.roomTypeName || "Phòng Deluxe")}&roomType=${bookingCard.roomType || "DELUXE"}&roomPrice=${bookingCard.pricePerNight || 1200000}&adults=${bookingCard.adults || 2}&children=${bookingCard.children || 0}&rooms=${bookingCard.rooms || 1}&fullName=${encodeURIComponent(bookingCard.customerName || "")}&phone=${encodeURIComponent(bookingCard.customerPhone || "")}`}
                                onClick={() => setOpen(false)}
                              >
                                Xác nhận & Thanh toán ngay <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={toggleListening}
              className={`h-9 w-9 shrink-0 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-500 border-red-500 animate-pulse' : 'text-muted-foreground hover:text-gold'}`}
              title="Nhập bằng giọng nói"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={isTyping || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
