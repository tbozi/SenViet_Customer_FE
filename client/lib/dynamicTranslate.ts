const AI_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AI_URL) ||
  "http://localhost:8000";

const CACHE_PREFIX = "senviet_dyn_tr_v1_";
const VI_DIACRITIC_REGEX =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const memoryCache: Record<"vi" | "en", Map<string, string>> = {
  vi: new Map(),
  en: new Map(),
};

function loadCacheFromStorage(lang: "vi" | "en") {
  if (typeof window === "undefined") return;
  if (memoryCache[lang].size > 0) return;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${lang}`);
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string") memoryCache[lang].set(k, v);
      }
    }
  } catch {
    // ignore storage errors
  }
}

function saveCacheToStorage(lang: "vi" | "en") {
  if (typeof window === "undefined") return;
  try {
    const entries = Array.from(memoryCache[lang].entries()).slice(-400);
    localStorage.setItem(`${CACHE_PREFIX}${lang}`, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // ignore quota errors
  }
}

export async function translateDynamicTexts(
  texts: string[],
  targetLang: "vi" | "en",
): Promise<Record<string, string>> {
  loadCacheFromStorage(targetLang);
  const result: Record<string, string> = {};
  const missing: string[] = [];
  const seen = new Set<string>();

  for (const raw of texts) {
    if (!raw || !raw.trim() || seen.has(raw)) continue;
    seen.add(raw);
    const cached = memoryCache[targetLang].get(raw);
    if (cached !== undefined) {
      result[raw] = cached;
    } else {
      missing.push(raw);
    }
  }

  if (missing.length === 0) return result;

  try {
    const res = await fetch(`${AI_BASE_URL}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: missing, targetLang }),
    });
    if (res.ok) {
      const data = await res.json();
      const translations = (data?.translations || {}) as Record<string, string>;
      for (const src of missing) {
        const dst = typeof translations[src] === "string" && translations[src].trim() ? translations[src] : src;
        memoryCache[targetLang].set(src, dst);
        result[src] = dst;
      }
      saveCacheToStorage(targetLang);
      return result;
    }
  } catch {
    // AI service offline -> gracefully keep original text
  }

  for (const src of missing) {
    result[src] = src;
  }
  return result;
}

const originalTextMap = new WeakMap<Text, string>();
const translatedNodes = new Set<Text>();

function shouldSkipElement(el: Element | null): boolean {
  if (!el) return true;
  const tag = el.tagName;
  if (
    tag === "SCRIPT" ||
    tag === "STYLE" ||
    tag === "NOSCRIPT" ||
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    tag === "OPTION" ||
    tag === "CODE" ||
    tag === "PRE"
  ) {
    return true;
  }
  if (el.closest(".notranslate, [data-no-translate], [contenteditable='true']")) {
    return true;
  }
  return false;
}

export function restoreOriginalDomTexts() {
  translatedNodes.forEach((node) => {
    const orig = originalTextMap.get(node);
    if (orig !== undefined && node.isConnected) {
      node.nodeValue = orig;
    }
  });
  translatedNodes.clear();
}

export async function translateVisibleDomToEn() {
  if (typeof document === "undefined" || !document.body) return;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodesToTranslate: Text[] = [];
  const texts: string[] = [];

  let current = walker.nextNode();
  while (current) {
    const textNode = current as Text;
    const val = textNode.nodeValue || "";
    if (
      val.trim().length > 1 &&
      VI_DIACRITIC_REGEX.test(val) &&
      !shouldSkipElement(textNode.parentElement)
    ) {
      if (!originalTextMap.has(textNode)) {
        originalTextMap.set(textNode, val);
      }
      nodesToTranslate.push(textNode);
      texts.push(val);
    }
    current = walker.nextNode();
  }

  if (nodesToTranslate.length === 0) return;

  const translatedMap = await translateDynamicTexts(texts, "en");
  for (const node of nodesToTranslate) {
    if (!node.isConnected) continue;
    const orig = originalTextMap.get(node) ?? node.nodeValue ?? "";
    const translated = translatedMap[orig];
    if (translated && translated !== node.nodeValue) {
      node.nodeValue = translated;
      translatedNodes.add(node);
    }
  }
}

export function setupDynamicDomTranslationObserver(getLang: () => "vi" | "en"): () => void {
  if (typeof document === "undefined" || !document.body) return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  let isApplying = false;

  const runTranslate = async () => {
    if (isApplying || getLang() !== "en") return;
    isApplying = true;
    try {
      await translateVisibleDomToEn();
    } finally {
      isApplying = false;
    }
  };

  const observer = new MutationObserver(() => {
    if (isApplying || getLang() !== "en") return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(runTranslate, 280);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => {
    if (timer) clearTimeout(timer);
    observer.disconnect();
  };
}
