"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";

interface TxResult {
  type: "transaction"; id: string; title: string; subtitle: string;
  amount: number; txType: "income" | "expense"; href: string;
}
interface WalletResult {
  type: "wallet"; id: string; title: string; subtitle: string; amount: number; href: string;
}
interface DebtResult {
  type: "debt"; id: string; title: string; subtitle: string; amount: number; href: string;
}
type SearchResult = TxResult | WalletResult | DebtResult;

interface Props {
  open: boolean;
  onClose: () => void;
}

const WALLET_TYPE_LABEL: Record<string, string> = {
  cash: "Tunai", bank: "Bank", savings: "Tabungan", ewallet: "E-Wallet", credit_card: "Kartu Kredit",
};

export default function GlobalSearch({ open, onClose }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ transactions: TxResult[]; wallets: WalletResult[]; debts: DebtResult[] } | null>(null);
  const [focused, setFocused] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setFocused(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? null);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    doSearch(query);
  }, [query, doSearch]);

  // Flatten results for keyboard nav
  const flat: SearchResult[] = [
    ...(results?.transactions ?? []),
    ...(results?.wallets ?? []),
    ...(results?.debts ?? []),
  ];

  function go(href: string) {
    onClose();
    setQuery("");
    router.push(href);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused(f => Math.min(f + 1, flat.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setFocused(f => Math.max(f - 1, -1)); }
    if (e.key === "Enter" && focused >= 0 && flat[focused]) { go(flat[focused].href); }
  }

  const hasResults = results && (results.transactions.length + results.wallets.length + results.debts.length) > 0;
  const noResults = results && !hasResults && query.length >= 2;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-[var(--shadow-modal)] overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          {loading ? (
            <svg className="animate-spin flex-shrink-0 text-[var(--text-secondary)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg className="flex-shrink-0 text-[var(--text-secondary)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Cari transaksi, dompet, hutang..."
            className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-elevated)] rounded border border-[var(--border)] flex-shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">Ketik untuk mencari transaksi, dompet, atau hutang</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-60">Minimal 2 karakter</p>
            </div>
          )}

          {noResults && (
            <div className="px-4 py-8 text-center">
              <div className="mb-2 flex justify-center"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
              <p className="text-sm text-[var(--text-secondary)]">Tidak ada hasil untuk <span className="font-medium text-[var(--text-primary)]">&ldquo;{query}&rdquo;</span></p>
            </div>
          )}

          {hasResults && (
            <div className="py-2">
              {/* Transactions */}
              {results!.transactions.length > 0 && (
                <Section label="Transaksi">
                  {results!.transactions.map((t, i) => {
                    const idx = i;
                    return (
                      <ResultItem
                        key={t.id}
                        focused={focused === idx}
                        onMouseEnter={() => setFocused(idx)}
                        onClick={() => go(t.href)}
                      >
                        <div className={["w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0",
                          t.txType === "income" ? "bg-green-100 text-success" : "bg-red-100 text-danger"].join(" ")}>
                          {t.txType === "income" ? "↑" : "↓"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{t.title}</p>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{t.subtitle}</p>
                        </div>
                        <p className={["font-financial text-sm font-semibold flex-shrink-0",
                          t.txType === "income" ? "text-success" : "text-danger"].join(" ")}>
                          {t.txType === "income" ? "+" : "-"}Rp {formatRupiah(t.amount)}
                        </p>
                      </ResultItem>
                    );
                  })}
                </Section>
              )}

              {/* Wallets */}
              {results!.wallets.length > 0 && (
                <Section label="Dompet">
                  {results!.wallets.map((w, i) => {
                    const idx = (results!.transactions.length) + i;
                    return (
                      <ResultItem
                        key={w.id}
                        focused={focused === idx}
                        onMouseEnter={() => setFocused(idx)}
                        onClick={() => go(w.href)}
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{w.title}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{WALLET_TYPE_LABEL[w.subtitle] ?? w.subtitle}</p>
                        </div>
                        <p className="font-financial text-sm font-semibold text-[var(--text-primary)] flex-shrink-0">
                          Rp {formatRupiah(w.amount)}
                        </p>
                      </ResultItem>
                    );
                  })}
                </Section>
              )}

              {/* Debts */}
              {results!.debts.length > 0 && (
                <Section label="Hutang / Piutang">
                  {results!.debts.map((d, i) => {
                    const idx = (results!.transactions.length + results!.wallets.length) + i;
                    return (
                      <ResultItem
                        key={d.id}
                        focused={focused === idx}
                        onMouseEnter={() => setFocused(idx)}
                        onClick={() => go(d.href)}
                      >
                        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{d.title}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{d.subtitle}</p>
                        </div>
                        <p className="font-financial text-sm font-semibold text-danger flex-shrink-0">
                          Rp {formatRupiah(d.amount)}
                        </p>
                      </ResultItem>
                    );
                  })}
                </Section>
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[var(--border)] flex items-center gap-3 text-[10px] text-[var(--text-secondary)]">
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-[var(--bg-elevated)] rounded border border-[var(--border)]">↑↓</kbd> navigasi</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-[var(--bg-elevated)] rounded border border-[var(--border)]">↵</kbd> buka</span>
          <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-[var(--bg-elevated)] rounded border border-[var(--border)]">Esc</kbd> tutup</span>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-4 py-1.5 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultItem({ focused, onMouseEnter, onClick, children }: {
  focused: boolean; onMouseEnter: () => void; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={["w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
        focused ? "bg-[var(--bg-elevated)]" : "hover:bg-[var(--bg-elevated)]"].join(" ")}
    >
      {children}
    </button>
  );
}
