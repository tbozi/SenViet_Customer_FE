export const CHAT_SYNC_EVENT = "senviet_chat_sync";

export function escapeChatHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Format bot reply text for customer display:
 * - Converts markdown links [label](url) into clickable links (internal SPA or external)
 * - Converts bare http(s):// URLs into clickable links
 * - Converts **bold**, *italic*, and bullet lists
 */
export function formatChatReply(text: string): string {
  if (!text) return "";
  let safe = escapeChatHtml(text.trim());

  // Protect generated <a> tags from bare-URL replacement using placeholders
  const linkPlaceholders: string[] = [];
  const pushLink = (html: string) => {
    const idx = linkPlaceholders.length;
    linkPlaceholders.push(html);
    return `@@CHATLINK_${idx}@@`;
  };

  // 1. Markdown links: [label](url)
  safe = safe.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (_m, label, url) => {
    if (url.startsWith("/")) {
      return pushLink(
        `<a href="${url}" data-spa-link="${url}" class="font-semibold text-primary underline underline-offset-2 hover:text-gold transition-colors">${label}</a>`
      );
    }
    return pushLink(
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary underline underline-offset-2 hover:text-gold transition-colors">${label}</a>`
    );
  });

  // 2. Bold & Italic
  safe = safe
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^\s*\n][^*\n]*?)\*/g, "<em>$1</em>");

  // 3. Bare URLs (not already wrapped in markdown link)
  safe = safe.replace(/(https?:\/\/[^\s<>"')\]]+)/g, (url) => {
    const label = url.includes("pay.payos.vn") ? "Mở trang thanh toán PayOS ↗" : url;
    return pushLink(
      `<a href="${url}" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary underline underline-offset-2 hover:text-gold transition-colors break-all">${label}</a>`
    );
  });

  // Restore placeholders
  safe = safe.replace(/@@CHATLINK_(\d+)@@/g, (_m, idx) => linkPlaceholders[Number(idx)] || "");

  const lines = safe.split("\n");
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

/**
 * Strip raw [PAYMENT_QR: url] tags from AI text so customers never see raw dev syntax.
 */
export function stripRawPaymentQrTags(text: string): { cleanText: string; extractedQrUrl?: string } {
  if (!text) return { cleanText: "" };
  let extractedQrUrl: string | undefined;
  const cleanText = text
    .replace(/\[PAYMENT_QR:\s*(https?:\/\/[^\]]+)\]/gi, (_m, url) => {
      if (!extractedQrUrl) extractedQrUrl = String(url).trim();
      return "";
    })
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { cleanText, extractedQrUrl };
}

/**
 * Guard against showing the Quick Room Picker card when the bot is confirming a booking,
 * asking about add-on services/promo codes, or showing payment/cancellation status.
 */
export function shouldSuppressBookingCard(text: string, state?: any): boolean {
  const step = String(state?.currentStep || "").toUpperCase();
  const status = String(state?.status || "").toUpperCase();
  if (
    status === "CANCELLED" ||
    status === "CONFIRMED" ||
    step === "PAYMENT_PROCESSING" ||
    step === "COMPLETED" ||
    step === "CANCELLED" ||
    step === "CONFIRM_BOOKING"
  ) {
    return true;
  }
  return /tóm tắt thông tin|xác nhận đặt phòng|dịch vụ đi kèm|mã ưu đãi|mã khuyến mãi|thanh toán thành công|đã hủy|hủy đơn|quét mã qr/i.test(
    text || ""
  );
}

/**
 * Derive context-aware quick reply suggestions from the latest bot message & state.
 */
export function deriveContextualQuickReplies(lastBotText: string, isEn: boolean, state?: any): string[] {
  const lower = (lastBotText || "").toLowerCase();
  const step = String(state?.currentStep || "").toUpperCase();
  const status = String(state?.status || "").toUpperCase();

  if (state?.cardAction === "SHOW_PAYOS_PAYMENT" || step === "PAYMENT_PROCESSING") {
    return isEn
      ? ["I have paid", "Check payment status", "Cancel booking"]
      : ["Tôi đã thanh toán", "Kiểm tra trạng thái đơn", "Hủy đơn đặt phòng"];
  }

  if (
    status === "CONFIRMED" ||
    step === "COMPLETED" ||
    lower.includes("xác nhận thanh toán thành công") ||
    lower.includes("đặt phòng thành công")
  ) {
    return isEn
      ? ["View booking history", "Book another room", "Check-in/out policy"]
      : ["Xem lịch sử đặt phòng", "Đặt thêm phòng khác", "Chính sách nhận/trả phòng"];
  }

  if (
    status === "CANCELLED" ||
    step === "CANCELLED" ||
    lower.includes("thông báo hủy đặt phòng") ||
    lower.includes("đã bị hủy") ||
    lower.includes("đã hủy đơn")
  ) {
    return isEn
      ? ["Book a new room", "Search another branch", "Current promotions"]
      : ["Đặt phòng mới", "Tìm phòng chi nhánh khác", "Ưu đãi hiện có"];
  }

  if (lower.includes("đăng nhập tài khoản") || lower.includes("sign in to your account") || lower.includes("please sign in")) {
    return isEn
      ? ["Sign in now", "View available rooms", "Current promotions"]
      : ["Đăng nhập ngay", "Xem thêm phòng trống", "Ưu đãi hiện có"];
  }

  if (
    lower.includes("tóm tắt thông tin") ||
    lower.includes("xác nhận đặt phòng") ||
    lower.includes("giữ chỗ") ||
    lower.includes("confirm booking")
  ) {
    return isEn
      ? ["Confirm booking", "Edit details", "Apply promo code", "Cancel booking"]
      : ["Xác nhận đặt phòng", "Chỉnh sửa thông tin", "Áp dụng mã ưu đãi", "Hủy đặt phòng"];
  }

  if (
    lower.includes("mã ưu đãi") ||
    lower.includes("mã khuyến mãi") ||
    lower.includes("mã giảm giá") ||
    lower.includes("promo")
  ) {
    return isEn
      ? ["No promo code", "View available promos", "Apply DEMO2K"]
      : ["Không có mã ưu đãi", "Xem mã giảm giá hiện có", "Áp dụng mã DEMO2K"];
  }

  if (
    lower.includes("dịch vụ đi kèm") ||
    lower.includes("đăng ký thêm dịch vụ") ||
    lower.includes("thêm dịch vụ")
  ) {
    return isEn
      ? ["No, skip services", "Add breakfast buffet", "Add airport pickup", "View promo codes"]
      : ["Không, bỏ qua bước này", "Thêm Buffet sáng", "Thêm xe đưa đón sân bay", "Xem mã ưu đãi"];
  }

  if (lower.includes("phương thức thanh toán") || lower.includes("thanh toán tại khách sạn")) {
    return isEn
      ? ["Pay via QR (PayOS)", "Pay at hotel", "Edit details"]
      : ["Thanh toán QR (PayOS)", "Thanh toán tại khách sạn", "Chỉnh sửa thông tin"];
  }

  if (
    (lower.includes("standard") || lower.includes("deluxe") || lower.includes("suite") || lower.includes("family")) &&
    (lower.includes("chọn") || lower.includes("trống") || lower.includes("hạng phòng"))
  ) {
    return isEn
      ? ["Select Standard Room", "Select Deluxe Room", "Select Family Room", "Select Suite Room"]
      : ["Chọn phòng Standard", "Chọn phòng Deluxe", "Chọn phòng Family", "Chọn phòng Suite"];
  }

  return [];
}

export function getChatTypingKey(userKey: string): string {
  return `senviet_chat_typing_${userKey}`;
}

export function getChatQuickRepliesKey(userKey: string): string {
  return `senviet_chat_quick_replies_${userKey}`;
}

export function emitChatSyncEvent(): void {
  try {
    window.dispatchEvent(new Event(CHAT_SYNC_EVENT));
  } catch {}
}

export function setChatTypingState(userKey: string, typing: boolean, sessionId: string): void {
  try {
    const key = getChatTypingKey(userKey);
    if (typing) {
      localStorage.setItem(key, JSON.stringify({ typing: true, startedAt: Date.now(), sessionId }));
    } else {
      localStorage.removeItem(key);
    }
    emitChatSyncEvent();
  } catch {}
}

export function readChatTypingState(userKey: string, sessionId?: string): boolean {
  try {
    const raw = localStorage.getItem(getChatTypingKey(userKey));
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed?.typing) return false;
    // Expire stale typing indicator after 60s
    if (Date.now() - Number(parsed.startedAt || 0) > 60_000) {
      localStorage.removeItem(getChatTypingKey(userKey));
      return false;
    }
    if (sessionId && parsed.sessionId && parsed.sessionId !== sessionId) return false;
    return true;
  } catch {
    return false;
  }
}

export function saveChatQuickReplies(userKey: string, chips: string[]): void {
  try {
    localStorage.setItem(getChatQuickRepliesKey(userKey), JSON.stringify(chips || []));
    emitChatSyncEvent();
  } catch {}
}

export function readChatQuickReplies(userKey: string): string[] {
  try {
    const raw = localStorage.getItem(getChatQuickRepliesKey(userKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendChatMessageToStorage<T extends { id: number; from: string; text: string }>(
  cacheKey: string,
  msg: T
): T[] {
  try {
    const raw = localStorage.getItem(cacheKey);
    const prev: T[] = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(prev) ? prev : [];
    const last = list[list.length - 1];
    if (last && last.from === msg.from && last.text === msg.text) {
      return list;
    }
    const next = [...list, msg];
    localStorage.setItem(cacheKey, JSON.stringify(next));
    emitChatSyncEvent();
    return next;
  } catch {
    return [msg];
  }
}
