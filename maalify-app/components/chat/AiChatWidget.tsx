"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED = [
  "Bagaimana kondisi keuangan saya bulan ini?",
  "Kategori apa yang paling banyak saya habiskan?",
  "Apakah pengeluaran saya masih dalam anggaran?",
  "Berapa saldo total saya sekarang?",
];

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Halo! 👋 Saya **Maali**, asisten keuangan keluarga kamu.\n\nSaya bisa bantu kamu menganalisis laporan keuangan, kasih saran penghematan, atau jawab pertanyaan seputar kondisi keuangan keluarga.\n\nAda yang ingin kamu tanyakan? 😊",
      }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mendapatkan respons");
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-[9rem] lg:bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[70vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)] bg-brand-primary flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              M
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Maali</p>
              <p className="text-[10px] text-white/70">Asisten Keuangan AI</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className={["flex gap-2", msg.role === "user" ? "justify-end" : "justify-start"].join(" ")}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                    M
                  </div>
                )}
                <div className={[
                  "max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-brand-primary text-white rounded-tr-sm"
                    : "bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border)]"
                ].join(" ")}>
                  <MessageContent content={msg.content} />
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                  M
                </div>
                <div className="bg-[var(--bg-elevated)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-brand-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-brand-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-brand-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}

            {/* Suggested prompts (only on first open) */}
            {messages.length === 1 && !loading && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] text-[var(--text-secondary)] font-medium px-1">Pertanyaan yang sering ditanyakan:</p>
                {SUGGESTED.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-[var(--border)] flex-shrink-0">
            <div className="flex items-end gap-2 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] px-3 py-2 focus-within:border-brand-primary transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanyakan sesuatu..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none resize-none placeholder:text-[var(--text-secondary)] max-h-24"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="p-1.5 rounded-lg bg-brand-primary text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0 mb-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] text-center mt-1.5">Enter kirim · Shift+Enter baris baru</p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        id="tour-ai-chat"
        onClick={() => setOpen(v => !v)}
        className={[
          "fixed bottom-[5rem] lg:bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
          open ? "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] rotate-0" : "bg-brand-primary text-white hover:scale-105"
        ].join(" ")}
        aria-label="Buka asisten AI"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>
    </>
  );
}

// Render markdown-lite: bold (**text**), bullet lines
function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ");
        return (
          <p key={i} className={isBullet ? "pl-2" : ""}>
            {isBullet && <span className="mr-1 opacity-60">•</span>}
            {isBullet ? parts.map((p, j) => typeof p === "string" ? p.replace(/^[\-•]\s/, "") : p) : parts}
          </p>
        );
      })}
    </div>
  );
}
