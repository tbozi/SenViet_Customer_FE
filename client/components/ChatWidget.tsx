import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, type Language } from "@/lib/i18n";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  time?: string;
}

const CHAT_OPEN_EVENT = "senviet:open-chat";

export function openChatWidget() {
  window.dispatchEvent(new Event(CHAT_OPEN_EVENT));
}

// -------------------------------------------------------------
// Tri thức khách sạn Sen Việt (Knowledge Base)
// -------------------------------------------------------------
const HOTEL_KNOWLEDGE = {
  branches: [
    { name: "Sen Việt Sài Gòn", city: "Quận 1, TP. HCM", price: "1.850.000đ/đêm", highlight: "Rooftop Pool, Spa sen, view sông Sài Gòn" },
    { name: "Sen Việt Hà Nội", city: "Hoàn Kiếm, Hà Nội", price: "1.650.000đ/đêm", highlight: "Kiến trúc Indochine, kề Hồ Gươm, trà thất hoàng gia" },
    { name: "Sen Việt Đà Nẵng", city: "Ngũ Hành Sơn, Đà Nẵng", price: "1.450.000đ/đêm", highlight: "Kề biển Mỹ Khê, hồ bơi vô cực, hải sản cao cấp" },
    { name: "Sen Việt Nha Trang", city: "Trần Phú, Nha Trang", price: "1.350.000đ/đêm", highlight: "View trọn vịnh biển, thể thao biển, tour đảo" },
    { name: "Sen Việt Đà Lạt", city: "Đà Lạt, Lâm Đồng", price: "1.250.000đ/đêm", highlight: "Đồi thông sương mờ, lò sưởi ấm cúng, trà chiều" },
    { name: "Sen Việt Gò Công / An Nhơn", city: "Tiền Giang & Bình Định", price: "600.000đ - 800.000đ/đêm", highlight: "Phong vị di sản, giá ưu đãi" },
  ],
  rooms: [
    { type: "STANDARD", descVi: "Tiêu chuẩn tiện nghi (25m²), 1 giường đôi hoặc 2 đơn", price: "Từ 600.000đ - 1.200.000đ/đêm" },
    { type: "DELUXE", descVi: "Sang trọng, ban công riêng (35m²), view đẹp", price: "Từ 900.000đ - 1.800.000đ/đêm" },
    { type: "SUITE", descVi: "Thượng lưu (55m²), phòng khách riêng, bồn sục jacuzzi", price: "Từ 1.500.000đ - 3.200.000đ/đêm" },
    { type: "FAMILY", descVi: "Dành cho gia đình 4 người (65m²), 2 giường lớn", price: "Từ 1.800.000đ - 3.500.000đ/đêm" },
  ],
  promotions: [
    "SUMMERROOM: Giảm 15% (tối đa 200.000đ) tiền phòng mùa hè",
    "SPASVC: Giảm 20% các liệu trình Spa & massage",
    "TOTALSALE: Giảm 10% tổng hóa đơn đặt phòng",
  ],
  policies: {
    checkIn: "14:00",
    checkOut: "12:00",
    surcharge: "500.000đ/người/đêm cho khách vượt sức chứa tiêu chuẩn (miễn phí trẻ dưới 6 tuổi).",
  },
};

// -------------------------------------------------------------
// Hàm nhận diện ngôn ngữ thông minh
// -------------------------------------------------------------
function detectLanguage(text: string, currentLang: Language): "vi" | "en" | "zh" | "ko" | "ja" {
  // Chinese (Hanzi)
  if (/[\u4e00-\u9fa5]/.test(text)) return "zh";
  // Korean (Hangul)
  if (/[\uac00-\ud7af\u1100-\u11ff]/.test(text)) return "ko";
  // Japanese (Hiragana or Katakana)
  if (/[\u3040-\u30ff]/.test(text)) return "ja";

  // Vietnamese special characters
  const viRegex = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  if (viRegex.test(text)) return "vi";

  // Common Vietnamese words without accents
  const viWords = /\b(phong|dat|khach san|gia|bao nhieu|khuyen mai|uu dai|check in|check out|gio|o dau|cho nao|chi nhanh)\b/i;
  if (viWords.test(text)) return "vi";

  // If mostly English or ASCII
  const enWords = /\b(hotel|room|book|price|cost|discount|promo|location|where|service|check|available|cancel)\b/i;
  if (enWords.test(text)) return "en";

  // Fallback to active site language
  return currentLang;
}

// -------------------------------------------------------------
// Bộ máy phản hồi AI đa ngôn ngữ
// -------------------------------------------------------------
function generateMultilingualResponse(query: string, lang: "vi" | "en" | "zh" | "ko" | "ja"): string {
  const q = query.toLowerCase();

  // 1. Phản hồi tiếng Việt
  if (lang === "vi") {
    if (q.includes("đặt") || q.includes("book") || q.includes("phòng")) {
      return "✨ Sen Việt hiện có 4 hạng phòng chính:\n• STANDARD: Tiêu chuẩn ấm cúng (từ 600.000đ/đêm)\n• DELUXE: Ban công view đẹp (từ 900.000đ/đêm)\n• SUITE: Cao cấp có bồn jacuzzi (từ 1.500.000đ/đêm)\n• FAMILY: Rộng rãi cho gia đình 4 người (từ 1.800.000đ/đêm)\nBạn có thể nhấn nút 'Khám phá khách sạn' trên menu hoặc chọn chi nhánh muốn đến để đặt phòng ngay!";
    }
    if (q.includes("ở đâu") || q.includes("vị trí") || q.includes("địa chỉ") || q.includes("chi nhánh")) {
      return "📍 Chuỗi khách sạn Sen Việt hiện diện tại 6 điểm đến:\n1. Sen Việt Sài Gòn (Quận 1, TP. HCM)\n2. Sen Việt Hà Nội (Hoàn Kiếm, gần Hồ Gươm)\n3. Sen Việt Đà Nẵng (Ngũ Hành Sơn, kề biển Mỹ Khê)\n4. Sen Việt Nha Trang (Đường Trần Phú, ven vịnh)\n5. Sen Việt Đà Lạt (Giữa đồi thông thơ mộng)\n6. Sen Việt Gò Công & An Nhơn (Tiền Giang & Bình Định)";
    }
    if (q.includes("ưu đãi") || q.includes("khuyến mãi") || q.includes("voucher") || q.includes("mã")) {
      return "🎁 Các mã giảm giá đang áp dụng tại Sen Việt:\n• SUMMERROOM: Giảm 15% (tối đa 200.000đ) tiền phòng\n• SPASVC: Giảm 20% dịch vụ Spa & thư giãn\n• TOTALSALE: Giảm 10% tổng hóa đơn\nBạn chỉ cần nhập mã này tại bước Checkout để được khấu trừ trực tiếp nhé!";
    }
    if (q.includes("giờ") || q.includes("check in") || q.includes("check out") || q.includes("quy định") || q.includes("chính sách")) {
      return "⏱️ Giờ quy định nhận & trả phòng của Sen Việt:\n• Giờ nhận phòng (Check-in): từ 14:00\n• Giờ trả phòng (Check-out): trước 12:00\n• Phụ thu khách vượt sức chứa: 500.000đ/người/đêm (miễn phí em bé dưới 6 tuổi).\nNếu bạn cần nhận phòng sớm hoặc trả trễ, lễ tân sẽ hỗ trợ tùy theo lượng phòng trống thực tế.";
    }
    return "Dạ chào bạn! Tôi là Trợ lý AI của Sen Việt Hotels. Tôi có thể hỗ trợ bạn tìm khách sạn, kiểm tra giá phòng, gợi ý mã ưu đãi và giải đáp mọi chính sách lưu trú. Bạn cần tôi giúp gì cụ thể ạ?";
  }

  // 2. Phản hồi tiếng Trung (Chinese)
  if (lang === "zh") {
    if (q.includes("房") || q.includes("预订") || q.includes("多少钱") || q.includes("价格")) {
      return "✨ 莲越酒店（Sen Việt）为您提供4种尊贵房型：\n• 标准房（Standard）：温馨雅致，起价约 600,000 越南盾/晚\n• 豪华房（Deluxe）：配独立阳台与优美景观，起价约 900,000 越南盾/晚\n• 豪华套房（Suite）：配客厅及水疗按摩浴缸，起价约 1,500,000 越南盾/晚\n• 家庭套房（Family）：适合4人家庭，起价约 1,800,000 越南盾/晚\n您可直接在网站顶部点击'酒店列表'挑选心仪的度假胜地！";
    }
    if (q.includes("位置") || q.includes("地址") || q.includes("在哪里") || q.includes("分店")) {
      return "📍 莲越酒店连锁网络遍布越南6大旅游胜地：\n1. 西贡莲越酒店（胡志明市第1郡市中心）\n2. 河内莲越酒店（还剑湖与老城区旁）\n3. 岘港莲越酒店（五行山美溪海滩旁）\n4. 芽庄莲越酒店（陈富沿海大道）\n5. 大叻莲越酒店（松林环抱浪漫度假地）\n6. 前江鹅贡及平定安仁分店";
    }
    if (q.includes("优惠") || q.includes("折扣") || q.includes("券") || q.includes("促销")) {
      return "🎁 莲越酒店当前有效优惠码：\n• SUMMERROOM：客房立减 15%（最高减 200,000 越南盾）\n• SPASVC：水疗及按摩理疗享 20% 折扣\n• TOTALSALE：全单总额立减 10%\n结账时在'优惠码'一栏输入即可自动抵扣！";
    }
    return "您好！我是莲越酒店（Sen Việt）智能AI顾问。我可以为您提供客房推荐、查询最新优惠、介绍酒店设施及退改政策。请问今天有什么可以协助您的？";
  }

  // 3. Phản hồi tiếng Hàn (Korean)
  if (lang === "ko") {
    if (q.includes("예약") || q.includes("객실") || q.includes("가격") || q.includes("얼마")) {
      return "✨ 센비엣 호텔(Sen Việt) 4가지 맞춤 객실 안내:\n• 스탠다드 (Standard): 아늑한 실속형 (1박 약 600,000 VND부터)\n• 디럭스 (Deluxe): 개별 발코니 및 오션/시티뷰 (1박 약 900,000 VND부터)\n• 스위트 (Suite): 자쿠지 욕조 & 프리미엄 거실 (1박 약 1,500,000 VND부터)\n• 패밀리 (Family): 4인 가족 맞춤 대형룸 (1박 약 1,800,000 VND부터)\n원하시는 지점을 선택하신 후 간편하게 온라인 예약을 진행하실 수 있습니다.";
    }
    if (q.includes("위치") || q.includes("어디") || q.includes("지점") || q.includes("주소")) {
      return "📍 센비엣 호텔은 베트남 전역 6개 주요 도시에 위치하고 있습니다:\n1. 사이공점 (호치민 1군 중심가)\n2. 하노이점 (호안끼엠 호수 & 구시가지 인근)\n3. 다낭점 (미케 비치 도보 3분)\n4. 나트랑점 (트란푸 해안 도로)\n5. 달랏점 (소나무 숲 힐링 리조트)\n6. 고꽁 & 안년 지점 (전통 문화 체험)";
    }
    if (q.includes("할인") || q.includes("프로모션") || q.includes("쿠폰") || q.includes("이벤트")) {
      return "🎁 진행 중인 센비엣 호텔 할인 코드 안내:\n• SUMMERROOM: 객실 요금 15% 할인 (최대 20만동)\n• SPASVC: 스파 & 마사지 20% 할인\n• TOTALSALE: 총 결제 금액 10% 즉시 할인\n예약 결제(Checkout) 단계에서 프로모션 코드를 입력하시면 바로 적용됩니다!";
    }
    return "안녕하세요! 센비엣 호텔 24/7 AI 컨시어지입니다. 객실 예약, 지점 위치, 특별 프로모션 및 부대시설 정보를 친절히 안내해 드립니다. 무엇을 도와드릴까요?";
  }

  // 4. Phản hồi tiếng Nhật (Japanese)
  if (lang === "ja") {
    if (q.includes("予約") || q.includes("部屋") || q.includes("料金") || q.includes("いくら")) {
      return "✨ セン・ヴィエット・ホテル（Sen Việt）の客室タイプ:\n• スタンダード（Standard）: 快適な標準客室（約600,000VND/泊〜）\n• デラックス（Deluxe）: 専用バルコニー付（約900,000VND/泊〜）\n• スイート（Suite）: ジャグジー＆リビング完備（約1,500,000VND/泊〜）\n• ファミリー（Family）: 4名様ご家族向け（約1,800,000VND/泊〜）\n公式サイトからいつでも即時予約いただけます。";
    }
    if (q.includes("場所") || q.includes("どこ") || q.includes("アクセス") || q.includes("住所")) {
      return "📍 セン・ヴィエット・ホテルはベトナム主要6都市に展開しております:\n1. ホーチミン・サイゴン（1区中心部）\n2. ハノイ（ホアンキエム湖・旧市街至近）\n3. ダナン（ミーケビーチ沿い）\n4. ニャチャン（チャンフー通り沿い）\n5. ダラット（松林のパノラマリゾート）\n6. ゴーコン＆アンニョン";
    }
    if (q.includes("割引") || q.includes("クーポン") || q.includes("プロモーション")) {
      return "🎁 現在ご利用可能な割引コード:\n• SUMMERROOM: 客室代金15%OFF（最大200,000VND）\n• SPASVC: スパ＆マッサージ20%OFF\n• TOTALSALE: 総額10%OFF\nご予約画面（Checkout）にてコードをご入力ください。";
    }
    return "こんにちは！セン・ヴィエット・ホテルのAIコンシェルジュです。客室プラン、最新の優待プロモーション、ホテル周辺のご案内など、日本語で丁寧にお応えします。";
  }

  // 5. Phản hồi tiếng Anh (English - Default)
  if (q.includes("book") || q.includes("room") || q.includes("price") || q.includes("rate") || q.includes("cost")) {
    return "✨ Sen Việt Hotels features 4 curated room categories:\n• STANDARD: Cozy and comfortable (from ~600,000 VND / night)\n• DELUXE: Private balcony with panoramic view (from ~900,000 VND / night)\n• SUITE: Lavish living space & private jacuzzi (from ~1,500,000 VND / night)\n• FAMILY: Spacious suite for up to 4 guests (from ~1,800,000 VND / night)\nYou can explore and book your preferred hotel directly on our website!";
  }
  if (q.includes("where") || q.includes("location") || q.includes("address") || q.includes("branch")) {
    return "📍 Sen Việt Hotel Collection spans 6 distinguished destinations in Vietnam:\n1. Sen Việt Saigon (District 1, Ho Chi Minh City)\n2. Sen Việt Hanoi (Near Hoan Kiem Lake, Old Quarter)\n3. Sen Việt Da Nang (My Khe Beach coastline)\n4. Sen Việt Nha Trang (Tran Phu Beach Boulevard)\n5. Sen Việt Da Lat (Pine hills retreat)\n6. Sen Việt Go Cong & An Nhon (Heritage cultural spots)";
  }
  if (q.includes("offer") || q.includes("promo") || q.includes("discount") || q.includes("voucher") || q.includes("code")) {
    return "🎁 Exclusive active promotional codes:\n• SUMMERROOM: 15% off room rates (up to 200,000 VND)\n• SPASVC: 20% off all herbal spa and wellness services\n• TOTALSALE: 10% off total booking value\nSimply enter your code at the Checkout step to claim your discount!";
  }
  if (q.includes("time") || q.includes("check in") || q.includes("check out") || q.includes("policy")) {
    return "⏱️ Hotel Policy & Timings:\n• Check-in time: from 14:00 (2:00 PM)\n• Check-out time: by 12:00 (12:00 PM)\n• Extra guest charge: 500,000 VND/guest/night (complimentary for children under 6).\nEarly check-in and late check-out can be arranged upon room availability.";
  }

  return "Welcome to Sen Việt Hotels! I am your 24/7 AI Concierge. I can assist you in English, Vietnamese, Chinese, Korean, or Japanese with room selection, rates, and amenities. What can I do for you today?";
}

export default function ChatWidget() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        from: "bot",
        text: t("ai.widgetGreeting"),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [t, language]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, isTyping]);

  const send = (text: string) => {
    if (!text.trim() || isTyping) return;

    const userText = text.trim();
    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), from: "user", text: userText, time: userTime },
    ]);
    setInput("");
    setIsTyping(true);

    // Phát hiện ngôn ngữ của câu hỏi và sinh câu trả lời tương ứng
    setTimeout(() => {
      const detectedLang = detectLanguage(userText, language);
      const reply = generateMultilingualResponse(userText, detectedLang);
      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "bot", text: reply, time: botTime },
      ]);
      setIsTyping(false);
    }, 600);
  };

  const quickReplies = [
    t("ai.quickBook"),
    t("ai.quickOffer"),
    t("ai.quickLocation"),
    t("ai.quickSupport"),
  ];

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="AI assistant"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-xl shadow-black/25 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[24rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-3.5 text-primary-foreground">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-sm">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  <span>{t("ai.widgetTitle")}</span>
                  <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
                </div>
                <p className="text-[11px] text-primary-foreground/75">
                  Multilingual AI · 🇻🇳 🇬🇧 🇨🇳 🇰🇷 🇯🇵
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-primary-foreground/80 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-3.5 bg-background/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    m.from === "bot"
                      ? "bg-secondary text-secondary-foreground border border-border/40"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {m.text}
                </div>
                {m.time && (
                  <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                    {m.time}
                  </span>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 rounded-2xl bg-secondary px-3.5 py-2 w-16 text-muted-foreground border border-border/40">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce" />
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
          </div>

          {/* Quick reply chips */}
          <div className="flex flex-wrap gap-1.5 border-t border-border/60 bg-card px-3.5 py-2.5">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={isTyping}
                className="rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-medium text-foreground transition hover:border-gold hover:bg-secondary hover:text-primary active:scale-95 disabled:opacity-50"
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              disabled={isTyping}
              className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-gold focus:ring-1 focus:ring-gold"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="rounded-full shrink-0 bg-gold text-gold-foreground hover:bg-gold/90 transition-transform active:scale-95"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
