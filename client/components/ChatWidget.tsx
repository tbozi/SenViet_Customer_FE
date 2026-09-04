import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
}

const CHAT_OPEN_EVENT = "senviet:open-chat";

export function openChatWidget() {
  window.dispatchEvent(new Event(CHAT_OPEN_EVENT));
}

export default function ChatWidget() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ id: 1, from: "bot", text: t("ai.widgetGreeting") }]);
  }, [t]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(CHAT_OPEN_EVENT, handler);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), from: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "bot", text: t("ai.genericReply") },
      ]);
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
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg shadow-black/20 transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <Bot className="h-4 w-4" />
            </span>
            <div className="text-sm font-semibold">{t("ai.widgetTitle")}</div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.from === "bot"
                    ? "bg-secondary text-secondary-foreground"
                    : "ml-auto bg-primary text-primary-foreground"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
            {quickReplies.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-gold hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("ai.placeholder")}
              className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
