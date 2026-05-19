"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { RecurringItem } from "./page";
import RecurringModal from "@/components/transaksi/RecurringModal";

interface Wallet { id: string; name: string; type: string; current_balance: number; }
interface Category { id: string; name: string; icon: string | null; color: string | null; type: string; }

interface Props {
  recurring: RecurringItem[];
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
  justGenerated: number;
}

const FREQ_LABEL: Record<string, string> = {
  monthly: "Bulanan",
  weekly:  "Mingguan",
  daily:   "Harian",
};

const FREQ_ICON: Record<string, string> = {
  monthly: "📅",
  weekly:  "📆",
  daily:   "🗓️",
};

function nextDate(item: RecurringItem): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const base = item.last_generated
    ? new Date(item.last_generated + "T00:00:00")
    : new Date(item.start_date + "T00:00:00");

  let next = new Date(base);
  if (item.frequency === "monthly") next.setMonth(next.getMonth() + 1);
  else if (item.frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setDate(next.getDate() + 1);

  if (!item.last_generated) next = new Date(item.start_date + "T00:00:00");

  if (item.end_date && next > new Date(item.end_date + "T00:00:00")) return "Selesai";
  return next.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function RecurringPageClient({
  recurring, wallets, categories, householdId, userId, justGenerated,
}: Props) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "add" | RecurringItem>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleSaved = useCallback(() => {
    setModal(null);
    router.refresh();
  }, [router]);

  async function toggleActive(item: RecurringItem) {
    setTogglingId(item.id);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase
      .from("recurring_transactions")
      .update({ is_active: !item.is_active })
      .eq("id", item.id);
    setTogglingId(null);
    router.refresh();
  }

  const active = recurring.filter(r => r.is_active);
  const inactive = recurring.filter(r => !r.is_active);

  function getCategory(item: RecurringItem) {
    const c = Array.isArray(item.categories) ? item.categories[0] : item.categories;
    return c as { name: string; icon: string | null; color: string | null } | null;
  }
  function getWallet(item: RecurringItem) {
    const w = Array.isArray(item.wallets) ? item.wallets[0] : item.wallets;
    return w as { name: string } | null;
  }

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Transaksi Berulang</h1>
            <p className="text-sm text-[var(--text-secondary)]">Otomatis tercatat sesuai jadwal</p>
          </div>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah
          </button>
        </div>

        {/* Auto-generate banner */}
        {justGenerated > 0 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span><strong>{justGenerated} transaksi</strong> berhasil dibuat otomatis dari jadwal berulang.</span>
          </div>
        )}

        {/* Empty state */}
        {recurring.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-[var(--bg-elevated)] flex items-center justify-center text-4xl">🔄</div>
            <div>
              <p className="font-semibold text-[var(--text-primary)] text-base">Belum ada transaksi berulang</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Set sekali, otomatis tercatat setiap periode</p>
            </div>
            <button onClick={() => setModal("add")} className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90">
              Tambah Pertama
            </button>
          </div>
        )}

        {/* Active list */}
        {active.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-1">
              Aktif ({active.length})
            </p>
            {active.map(item => {
              const cat = getCategory(item);
              const wallet = getWallet(item);
              const next = nextDate(item);
              const isIncome = item.type === "income";

              return (
                <div key={item.id} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20" }}
                    >
                      {cat?.icon ?? "💰"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)] text-sm">{item.description}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {cat?.name ?? "-"} · {wallet?.name ?? "-"}
                          </p>
                        </div>
                        <p className={["font-financial font-bold text-base flex-shrink-0", isIncome ? "text-success" : "text-danger"].join(" ")}>
                          {isIncome ? "+" : "-"}Rp {formatRupiah(item.amount)}
                        </p>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                          {FREQ_ICON[item.frequency]} {FREQ_LABEL[item.frequency]}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          Berikutnya: <span className="font-medium text-[var(--text-primary)]">{next}</span>
                        </span>
                        {item.end_date && (
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            s/d {new Date(item.end_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => setModal(item)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(item)}
                          disabled={togglingId === item.id}
                          className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
                        >
                          {togglingId === item.id ? "..." : "Nonaktifkan"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Inactive list */}
        {inactive.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-1">
              Nonaktif ({inactive.length})
            </p>
            {inactive.map(item => {
              const cat = getCategory(item);
              const wallet = getWallet(item);
              return (
                <div key={item.id} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4 opacity-60">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 grayscale"
                      style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20" }}
                    >
                      {cat?.icon ?? "💰"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.description}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {FREQ_LABEL[item.frequency]} · {wallet?.name ?? "-"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-financial text-sm font-semibold text-[var(--text-secondary)]">
                        Rp {formatRupiah(item.amount)}
                      </p>
                      <button
                        onClick={() => toggleActive(item)}
                        disabled={togglingId === item.id}
                        className="text-[10px] text-brand-primary hover:underline mt-0.5 disabled:opacity-50"
                      >
                        {togglingId === item.id ? "..." : "Aktifkan"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        {recurring.length > 0 && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[var(--bg-elevated)] text-xs text-[var(--text-secondary)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Transaksi berulang dibuat otomatis setiap kali kamu membuka halaman ini. Maksimal 36 periode per siklus per hari.
          </div>
        )}
      </div>

      {/* Modal */}
      {modal === "add" && (
        <RecurringModal
          wallets={wallets}
          categories={categories}
          householdId={householdId}
          userId={userId}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal && modal !== "add" && (
        <RecurringModal
          item={modal}
          wallets={wallets}
          categories={categories}
          householdId={householdId}
          userId={userId}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
