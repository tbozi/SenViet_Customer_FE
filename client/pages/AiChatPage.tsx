import { useEffect, useRef, useState, useCallback, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Send,
  Sparkles,
  Building2,
  BedDouble,
  CalendarDays,
  ArrowRight,
  QrCode,
  ExternalLink,
  User as UserIcon,
  RotateCcw,
  ShieldCheck,
  Clock,
  Loader2,
  Mic,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { formatStayDates } from "@/lib/dateTime";
import { formatVnd } from "@/data/hotels";
import { useGetPublicHotelsQuery } from "@/services/hotelApi";
import {
  useSendChatMessageMutation,
  useLazyGetChatHistoryQuery,
  type ChatMessage as ChatMessageType,
} from "@/services/chatApi";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  state?: any;
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
  roomOptions?: Array<{ type: string; typeName?: string; price: number | string }>;
}

export interface PayOSPaymentData {
  bookingId: string;
  orderId: string | number;
  hotelName: string;
  roomName: string;
  checkIn?: string;
  checkOut?: string;
  customerName?: string;
  customerPhone?: string;
  services?: string;
  promotion?: string;
  totalAmount: number;
  checkoutUrl?: string;
  qrCodeUrl?: string;
}

function getUserStorageKey(email?: string | null): string {
  const raw =
    email ||
    (typeof window !== "undefined" ? localStorage.getItem("senviet_user_email") : null) ||
    "guest";
  return raw.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
}

function getSlugFromHotelName(name?: string, branchId?: number): string {
  if (branchId === 1) return "sen-viet-sai-gon";
  if (branchId === 2) return "sen-viet-ha-noi";
  if (branchId === 3) return "sen-viet-da-nang";
  if (branchId === 4) return "sen-viet-nha-trang";
  if (branchId === 5) return "sen-viet-da-lat";
  if (branchId === 6) return "sen-viet-go-cong";
  if (branchId === 7) return "sen-viet-an-nhon";
  if (branchId === 8) return "sen-viet-quy-nhon";
  if (!name) return "sen-viet-an-nhon";
  const lower = name.toLowerCase();
  if (lower.includes("sài gòn") || lower.includes("sai gon")) return "sen-viet-sai-gon";
  if (lower.includes("hà nội") || lower.includes("ha noi")) return "sen-viet-ha-noi";
  if (lower.includes("đà nẵng") || lower.includes("da nang")) return "sen-viet-da-nang";
  if (lower.includes("nha trang")) return "sen-viet-nha-trang";
  if (lower.includes("đà lạt") || lower.includes("da lat")) return "sen-viet-da-lat";
  if (lower.includes("gò công") || lower.includes("go cong")) return "sen-viet-go-cong";
  if (lower.includes("quy nhơn") || lower.includes("quy nhon")) return "sen-viet-quy-nhon";
  return "sen-viet-an-nhon";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function parseBotMessage(rawText: string) {
  let cleanText = rawText;
  let bookingCard: BookingCardData | undefined;
  let payosPayment: PayOSPaymentData | undefined;

  const payosRegex = /```(?:json)?(?::payos_payment)?\s*(\{[\s\S]*?"(?:checkoutUrl|qrCodeUrl)"[\s\S]*?\})\s*```/;
  const payosMatch = cleanText.match(payosRegex);
  if (payosMatch) {
    try {
      const parsed = JSON.parse(payosMatch[1]);
      payosPayment = {
        bookingId: parsed.bookingId || "BKG_SENVIET",
        orderId: parsed.orderId || parsed.bookingId || "N/A",
        hotelName: parsed.hotelName || "Chi nhánh Sen Việt Luxury",
        roomName: parsed.roomName || "Phòng nghỉ",
        checkIn: parsed.checkIn || "",
        checkOut: parsed.checkOut || "",
        customerName: parsed.customerName || "Quý khách",
        customerPhone: parsed.customerPhone || "",
        services: parsed.services || "",
        promotion: parsed.promotion || "",
        totalAmount: Number(parsed.totalAmount || parsed.amount || 2000),
        checkoutUrl: parsed.checkoutUrl,
        qrCodeUrl: parsed.qrCodeUrl,
      };
      cleanText = cleanText.replace(payosMatch[0], "").trim();
    } catch {}
  }

  const bookingRegex = /```(?:json)?(?::booking_card)?\s*(\{[\s\S]*?(?:"hotel"|"hotelSlug"|"hotelName")[\s\S]*?\})\s*```/;
  const bookingMatch = cleanText.match(bookingRegex);
  if (bookingMatch) {
    try {
      const parsed = JSON.parse(bookingMatch[1]);
      bookingCard = {
        hotelName: parsed.hotelName || parsed.hotel || "Sen Việt Luxury",
        hotelSlug: parsed.hotelSlug || getSlugFromHotelName(parsed.hotelName || parsed.hotel),
        roomType: parsed.roomType || "DELUXE",
        roomTypeName: parsed.roomTypeName || "Phòng Cao Cấp",
        checkInDate: parsed.checkInDate || parsed.checkIn || "",
        checkOutDate: parsed.checkOutDate || parsed.checkOut || "",
        adults: parsed.adults || 2,
        children: parsed.children || 0,
        rooms: typeof parsed.rooms === "number" ? parsed.rooms : 1,
        pricePerNight: parsed.pricePerNight || 1200000,
        customerName: parsed.customerName || "",
        customerPhone: parsed.customerPhone || "",
        roomOptions: Array.isArray(parsed.roomOptions) ? parsed.roomOptions : undefined,
      };
      cleanText = cleanText.replace(bookingMatch[0], "").trim();
    } catch {}
  }

  cleanText = cleanText.replace(/```(?:json)?(?::\w+)?[\s\S]*?```/g, "").trim();
  cleanText = cleanText.replace(/```[\s\S]*$/g, "").trim();

  return { cleanText, bookingCard, payosPayment };
}

export default function AiChatPage() {
  const { t, language } = useLanguage();
  const isEn = language === "en";
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // ĐỒNG BỘ 100% SESSION KEY & CACHE KEY VỚI POPUP CHATWIDGET GÓC PHẢI
  const userKey = getUserStorageKey(user?.email);
  const sessionKey = `senviet_chat_session_${userKey}`;
  const cacheKey = `senviet_cached_chat_messages_${userKey}`;

  const [sendChatMessage] = useSendChatMessageMutation();
  const [triggerGetHistory] = useLazyGetChatHistoryQuery();
  const { data: publicHotels = [] } = useGetPublicHotelsQuery();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [{ id: 1, from: "bot", text: t("ai.widgetGreeting") }];
  });
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<ChatMessageType[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wantsListeningRef = useRef(false);
  const voiceBaseInputRef = useRef("");
  const finalTranscriptRef = useRef("");

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
      setInput(combined);
    };

    rec.onend = () => {
      if (wantsListeningRef.current) {
        voiceBaseInputRef.current = (inputRef.current?.value || "").trim();
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
      wantsListeningRef.current = false;
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        toast({
          title: isEn ? "Microphone Access Denied" : "Chưa cấp quyền Micro",
          description: isEn
            ? "Please allow microphone access in your browser to use voice input."
            : "Quý khách vui lòng cấp quyền Micro trên trình duyệt để nhập bằng giọng nói nhé ạ.",
          variant: "destructive",
        });
      }
    };

    recognitionRef.current = rec;
    return () => {
      wantsListeningRef.current = false;
      try { rec.abort(); } catch {}
    };
  }, [language, isEn, toast]);

  const toggleListening = () => {
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
      voiceBaseInputRef.current = input.trim();
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

  const handleReturnToMiniChat = () => {
    try {
      sessionStorage.setItem("senviet_reopen_mini_chat", "1");
    } catch {}
    let returnTo = "/";
    try {
      const saved = sessionStorage.getItem("senviet_chat_return_to");
      if (saved && saved !== "/chat") returnTo = saved;
    } catch {}
    navigate(returnTo);
  };

  const sessionIdRef = useRef<string>(
    (() => {
      try {
        const saved = localStorage.getItem(sessionKey);
        if (saved && saved.trim()) return saved.trim();
      } catch {}
      const newId = crypto.randomUUID();
      try {
        localStorage.setItem(sessionKey, newId);
      } catch {}
      return newId;
    })()
  );

  // Tự động đồng bộ lịch sử từ server và localStorage khi chuyển từ Popup sang trang /chat
  useEffect(() => {
    let isMounted = true;
    const curSession = localStorage.getItem(sessionKey) || sessionIdRef.current;
    sessionIdRef.current = curSession;

    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {}

    const fetchServerHistory = async () => {
      if (!curSession) return;
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
          setMessages(restored);
          historyRef.current = serverMsgs
            .map((m: any) => ({
              role: m.role === "user" ? ("user" as const) : ("model" as const),
              content: m.content,
            }))
            .slice(-10);
        }
      } catch {}
    };
    fetchServerHistory();
    return () => {
      isMounted = false;
    };
  }, [userKey, sessionKey, cacheKey, triggerGetHistory]);

  // Tự động cập nhật câu chào đầu tiên khi đổi ngôn ngữ VI <-> EN
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].from === "bot" && !prev[0].state) {
        return [{ ...prev[0], text: t("ai.widgetGreeting") }];
      }
      return prev;
    });
  }, [language, t]);

  useEffect(() => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(messages));
    } catch {}
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, cacheKey]);

  const handleStartNewChat = () => {
    const newId = crypto.randomUUID();
    try {
      localStorage.setItem(sessionKey, newId);
      localStorage.removeItem(cacheKey);
    } catch {}
    sessionIdRef.current = newId;
    historyRef.current = [];
    setMessages([{ id: Date.now(), from: "bot", text: t("ai.widgetGreeting") }]);
  };

  const handleBookFromCard = useCallback(
    (targetUrl: string) => {
      if (!user) {
        toast({
          title: isEn ? "Login Required to Book" : "Yêu cầu đăng nhập để đặt phòng",
          description: isEn
            ? "Guests may browse and inquire freely. Please sign in to confirm your room reservation."
            : "Khách vãng lai có thể tra cứu thông tin tự do. Quý khách vui lòng đăng nhập tài khoản để tiến hành đặt và giữ phòng nhé ạ! 🌸",
        });
        navigate("/login", { state: { from: targetUrl } });
        return;
      }
      navigate(targetUrl);
    },
    [user, isEn, navigate, toast]
  );

  const send = async (msgText: string) => {
    const trimmed = msgText.trim();
    if (!trimmed || isTyping) return;
    if (wantsListeningRef.current) {
      wantsListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
    }
    voiceBaseInputRef.current = "";
    finalTranscriptRef.current = "";
    setInput("");
    const userMsg: Message = { id: Date.now(), from: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    historyRef.current = [
      ...historyRef.current,
      { role: "user" as const, content: trimmed },
    ].slice(-10);

    try {
      const userInfo = user
        ? {
            name: user.name || "",
            phone: user.phone || "",
            email: user.email || "",
          }
        : undefined;

      const result = await sendChatMessage({
        message: trimmed,
        sessionId: sessionIdRef.current,
        history: historyRef.current.slice(0, -1),
        userInfo,
        userLanguage: language,
      }).unwrap();

      const reply = result.result?.reply || t("ai.genericReply");
      const state = result.result?.state;

      const isBookingAction = Boolean(
        state &&
          state.status !== "CANCELLED" &&
          (state.cardAction === "SHOW_ROOM_OPTIONS" ||
            state.cardAction === "SHOW_PAYOS_PAYMENT" ||
            state.cardAction === "SHOW_HOTEL_RESERVATION" ||
            (state.qrUrl && state.currentStep === "PAYMENT_PROCESSING") ||
            (state.currentStep === "SELECT_ROOM" &&
              state.availableRooms &&
              state.availableRooms.length > 0))
      );

      if (result.result?.sessionId) {
        sessionIdRef.current = result.result.sessionId;
        try {
          localStorage.setItem(sessionKey, result.result.sessionId);
        } catch {}
      }

      historyRef.current = [
        ...historyRef.current,
        { role: "model" as const, content: reply },
      ].slice(-10);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "bot", text: reply, state: isBookingAction ? state : undefined },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: "bot",
          text: isEn
            ? "Our AI service is experiencing high traffic. Please call hotline 1900 6868 for immediate assistance."
            : "Dạ hệ thống Trợ lý AI đang có lưu lượng truy cập cao trong giây lát. Quý khách vui lòng liên hệ hotline 1900 6868 để được hỗ trợ tức thì ạ! 🌸",
        },
      ]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const quickPrompts = [
    t("ai.quickBook"),
    t("ai.quickOffer"),
    t("ai.quickLocation"),
    t("ai.quickSupport"),
  ];

  return (
    <main className="container max-w-7xl py-5 sm:py-6">
      {/* Main Container - 2 Columns (Tiki style) */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-0 rounded-3xl border border-border bg-card shadow-xl overflow-hidden min-h-[82vh]">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-border bg-muted/20 p-5">
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold text-gold-foreground shadow-md">
                <Bot className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="font-bold text-base text-primary leading-tight truncate">
                  {t("ai.widgetTitle")}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{isEn ? "Active 24/7 · Synced" : "Trực tuyến 24/7 · Đồng bộ"}</span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {isEn
                  ? `Explore ${publicHotels.length} Branch${publicHotels.length === 1 ? "" : "es"}`
                  : `Hệ thống ${publicHotels.length} Chi nhánh`}
              </p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {publicHotels.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => send(isEn ? `Check available rooms at ${h.name}` : `Kiểm tra phòng trống tại ${h.name}`)}
                    className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70 transition flex items-center justify-between gap-2 group"
                  >
                    <span className="truncate">{h.name}</span>
                    <span className="text-[10px] text-muted-foreground group-hover:text-primary shrink-0">
                      {h.provinceName || h.address}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                {isEn ? "Suggested Questions" : "Câu hỏi gợi ý nhanh"}
              </p>
              <div className="space-y-2">
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="w-full text-left rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 text-xs font-medium text-amber-950 dark:text-amber-200 transition hover:bg-amber-100 truncate"
                  >
                    💬 {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5 text-xs text-muted-foreground space-y-2">
            <p className="flex items-center gap-1.5 font-semibold text-primary">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{isEn ? "Guest & Member Policy" : "Chính sách Khách hàng"}</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              {user
                ? (isEn
                    ? `Signed in as ${user.name || user.email}. You can book and hold rooms directly.`
                    : `Đã đăng nhập (${user.name || user.email}). Quý khách có thể đặt và giữ phòng trực tiếp.`)
                : (isEn
                    ? "Guest mode: Feel free to inquire about rooms & rates. Sign in is required when confirming a booking."
                    : "Khách vãng lai: Tự do hỏi thăm thông tin phòng & giá. Khi đặt phòng thực tế, hệ thống sẽ yêu cầu đăng nhập.")}
            </p>
          </div>
        </aside>

        {/* Right Chat Column */}
        <section className="flex flex-col h-[82vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3.5 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold text-gold-foreground lg:hidden">
                <Bot className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-base font-bold text-primary flex items-center gap-2 truncate">
                  <span className="truncate">{isEn ? "Live AI Consultation" : "Tư vấn Trực tuyến cùng AI Agent"}</span>
                  <span className="hidden sm:inline-block rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                    Google Gemini AI
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground truncate">
                  {isEn ? "Instant room search, live rates & booking assistance" : "Tra cứu phòng trống, kiểm tra giá và đặt phòng trực tiếp"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:inline-block whitespace-nowrap">
                {isEn ? "Mode:" : "Chế độ:"}{" "}
                <strong className="text-primary">
                  {user ? (isEn ? "Member" : "Thành viên") : (isEn ? "Guest (Inquiry)" : "Khách vãng lai")}
                </strong>
              </span>
              <button
                type="button"
                onClick={handleStartNewChat}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-primary"
                title={isEn ? "New conversation" : "Làm mới hội thoại"}
                aria-label={isEn ? "New conversation" : "Làm mới hội thoại"}
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleReturnToMiniChat}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-primary"
                title={isEn ? "Minimize back to mini chat" : "Thu nhỏ về ô chat góc phải"}
                aria-label={isEn ? "Minimize back to mini chat" : "Thu nhỏ về ô chat góc phải"}
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-muted/10">
            {messages.map((m) => {
              const isUser = m.from === "user";
              let { cleanText, bookingCard, payosPayment } = !isUser
                ? parseBotMessage(m.text)
                : { cleanText: m.text, bookingCard: undefined, payosPayment: undefined };

              // Đồng bộ render thẻ từ m.state giống hệt ChatWidget.tsx
              if (!isUser && m.state) {
                if (m.state.qrUrl && m.state.currentStep === "PAYMENT_PROCESSING" && m.state.status !== "CANCELLED") {
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
                    checkoutUrl: m.state.checkoutUrl || "",
                  };
                }

                const shouldShowBookingCard = Boolean(
                  m.state.cardAction === "SHOW_ROOM_OPTIONS" &&
                    m.state.branch &&
                    m.state.availableRooms &&
                    m.state.availableRooms.length > 0 &&
                    m.state.currentStep !== "PAYMENT_PROCESSING" &&
                    !m.state.qrUrl
                );

                if (shouldShowBookingCard && m.state.branch && !bookingCard) {
                  const branchId = Number(m.state.branch?.id || m.state.hotelId || 1);
                  const rawName = m.state.branch?.name;
                  const hotelSlug = getSlugFromHotelName(rawName, branchId);
                  const hotelName = rawName || publicHotels.find((h) => Number(h.id) === branchId)?.name || "Khách sạn Sen Việt";
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
                    pricePerNight:
                      m.state.availableRooms?.find((r: any) => r.roomType === (m.state.roomType?.id || m.state.roomType))
                        ?.pricePerNight ||
                      m.state.amountToPay ||
                      0,
                    customerName: m.state.guestInfo?.name,
                    customerPhone: m.state.guestInfo?.phone,
                    roomOptions:
                      m.state.availableRooms && m.state.availableRooms.length > 0
                        ? m.state.availableRooms.map((r: any) => ({
                            type: r.roomType || "",
                            typeName: r.roomTypeName || r.roomType,
                            price: r.pricePerNight || 0,
                          }))
                        : [],
                  };
                }
              }

              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-3`}>
                  {!isUser && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-sm mt-1">
                      <Bot className="h-4.5 w-4.5" />
                    </span>
                  )}
                  <div
                    className={`max-w-[88%] md:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                        : "border border-border bg-card text-foreground shadow-xs rounded-tl-xs"
                    }`}
                  >
                    {cleanText && (
                      <div
                        dangerouslySetInnerHTML={{ __html: isUser ? escapeHtml(cleanText) : formatReply(cleanText) }}
                        className="prose prose-sm max-w-none dark:prose-invert [&_li]:my-0.5 [&_ul]:my-1.5 [&_p]:my-1 break-words"
                      />
                    )}

                    {/* PayOS Payment Card */}
                    {payosPayment && (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/50 bg-card p-4 shadow-lg">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            <Clock className="h-4 w-4" /> {isEn ? "Temporary Room Hold (5 mins)" : "Đơn giữ chỗ tạm thời (5 phút)"}
                          </span>
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {isEn ? "Code" : "Mã"} #{payosPayment.bookingId || payosPayment.orderId}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 font-semibold text-primary">
                              <Building2 className="h-3.5 w-3.5 text-gold shrink-0" />
                              <span className="truncate">{payosPayment.hotelName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <BedDouble className="h-3.5 w-3.5 text-gold shrink-0" />
                              <span className="font-medium text-foreground">{payosPayment.roomName}</span>
                            </div>
                            {(payosPayment.checkIn || payosPayment.checkOut) && (
                              <div className="flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
                                <span>{formatStayDates(payosPayment.checkIn, payosPayment.checkOut, language)}</span>
                              </div>
                            )}
                            {payosPayment.customerName && (
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="h-3.5 w-3.5 text-gold shrink-0" />
                                <span>{payosPayment.customerName} {payosPayment.customerPhone ? `· ${payosPayment.customerPhone}` : ""}</span>
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-foreground">
                              <span className="text-xs font-medium">{isEn ? "Total payment:" : "Tổng thanh toán:"}</span>
                              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                {formatVnd(payosPayment.totalAmount)}
                              </span>
                            </div>
                            {payosPayment.checkoutUrl && (
                              <Button asChild variant="outline" size="sm" className="w-full mt-2 rounded-xl text-xs">
                                <a href={payosPayment.checkoutUrl} target="_blank" rel="noopener noreferrer">
                                  {isEn ? "Open PayOS Payment Gateway" : "Mở cổng thanh toán PayOS"} <ExternalLink className="ml-1.5 h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
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
                                  className="h-40 w-40 object-contain mx-auto"
                                />
                              </div>
                              <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                                <QrCode className="h-3.5 w-3.5 text-emerald-500" />
                                {isEn ? "Auto-confirmed after scanning" : "Tự động xác nhận ngay sau khi quét mã"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Booking Card if returned by AI */}
                    {bookingCard && (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-gold/40 bg-card p-4 shadow-md">
                        <div className="flex items-center justify-between border-b border-border/60 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4" /> {isEn ? "Quick Booking Card" : "Thẻ Đặt Phòng Nhanh"}
                          </span>
                          <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold text-gold">
                            {bookingCard.hotelName}
                          </span>
                        </div>

                        {(bookingCard.checkInDate || bookingCard.checkOutDate) && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 text-gold shrink-0" />
                            <span>{formatStayDates(bookingCard.checkInDate, bookingCard.checkOutDate, language)}</span>
                          </div>
                        )}

                        {bookingCard.roomOptions && bookingCard.roomOptions.length > 0 ? (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium">
                              {isEn ? "Select a room category to book:" : "Chọn hạng phòng để đặt nhanh:"}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {bookingCard.roomOptions.map((opt) => (
                                <div
                                  key={opt.type}
                                  className="flex items-center justify-between rounded-xl border border-border p-2.5 bg-background gap-2"
                                >
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-primary truncate">{opt.typeName || opt.type}</p>
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                      {typeof opt.price === "number" ? formatVnd(opt.price) : opt.price}
                                      <span className="text-[10px] font-normal text-muted-foreground"> / {isEn ? "night" : "đêm"}</span>
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleBookFromCard(
                                        `/hotels/${bookingCard.hotelSlug}?roomType=${opt.type}&checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&adults=${bookingCard.adults || 2}&children=${bookingCard.children || 0}&rooms=${bookingCard.rooms || 1}`
                                      )
                                    }
                                    className="h-7 text-xs rounded-lg bg-gold text-gold-foreground hover:bg-gold/90 shrink-0"
                                  >
                                    {isEn ? "Book now" : "Đặt ngay"} <ArrowRight className="ml-1 h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-border gap-3">
                            <div>
                              <p className="font-bold text-sm text-primary">{bookingCard.roomTypeName || (isEn ? "Standard Room" : "Phòng tiêu chuẩn")}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatVnd(bookingCard.pricePerNight || 1200000)} / {isEn ? "night" : "đêm"}
                              </p>
                            </div>
                            <Button
                              onClick={() =>
                                handleBookFromCard(
                                  `/checkout?hotel=${bookingCard.hotelSlug}&checkIn=${bookingCard.checkInDate || ""}&checkOut=${bookingCard.checkOutDate || ""}&roomType=${bookingCard.roomType || "DELUXE"}`
                                )
                              }
                              className="rounded-xl text-xs bg-gold text-gold-foreground hover:bg-gold/90 font-semibold shrink-0"
                            >
                              {isEn ? "Confirm & Pay Now" : "Xác nhận & Thanh toán ngay"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-gold">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                </span>
                <span className="animate-pulse">
                  {isEn ? "AI Concierge is typing a response..." : "Trợ lý AI đang soạn câu trả lời..."}
                </span>
              </div>
            )}
          </div>

          {/* Quick Prompts Bar on 1 line */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-border bg-muted/30 px-4 py-2.5 whitespace-nowrap">
            {quickPrompts.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={isTyping}
                className="shrink-0 rounded-full border border-amber-300/80 bg-amber-50/90 dark:border-amber-700/60 dark:bg-amber-950/40 px-3.5 py-1 text-xs font-medium text-amber-950 dark:text-amber-200 transition hover:bg-amber-100 disabled:opacity-50"
              >
                💬 {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card p-4"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              disabled={isTyping}
              className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-50"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={toggleListening}
              className={`h-11 w-11 shrink-0 rounded-2xl transition-colors ${
                isListening
                  ? "bg-red-100 text-red-600 border-red-500 animate-pulse dark:bg-red-950/60 dark:text-red-400"
                  : "text-muted-foreground hover:text-gold"
              }`}
              title={isListening ? (isEn ? "Stop voice input" : "Nhấn để dừng ghi âm") : (isEn ? "Voice input" : "Nhập bằng giọng nói")}
              aria-label={isEn ? "Voice input" : "Nhập bằng giọng nói"}
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={isTyping || !input.trim()}
              className="h-11 w-11 shrink-0 rounded-2xl bg-gold text-gold-foreground hover:bg-gold/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
