"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { RecurringItem, PendingItem } from "./page";
import RecurringModal from "@/components/transaksi/RecurringModal";
import { Toast, useToast } from "@/components/ui/Toast";
import { toggleRecurringActive, confirmRecurring, skipRecurring } from "@/app/actions/recurring";
import { CategoryIcon, RefreshCw, CheckCircle2 } from "@/lib/icons";

interface Wallet { id: string; name: string; type: string; current_balance: number; }
interface Category { id: string; name: string; icon: string | null; color: string | null; type: string; }

interface Props {
  recurring: RecurringItem[];
  pendingItems: PendingItem[];
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
  userRole: "super_admin" | "admin" | "member";
}

const FREQ_LABEL: Record<string, string> = {
  monthly: "Bulanan",
  weekly:  "Mingguan",
  daily:   "Harian",
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

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function RecurringPageClient({
  recurring, pendingItems, wallets, categories, householdId, userId, userRole,
}: Props) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const canManage = userRole !== "member";
  const [modal, setModal] = useState<null | "add" | RecurringItem>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // State untuk tanggal aktual per pending item (key: `${recurringId}_${scheduledDate}`)
  const [actualDates, setActualDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(pendingItems.map(p => [`${p.recurringId}_${p.scheduledDate}`, p.scheduledDate]))
  );
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const handleSaved = useCallback(() => {
    if (modal === "add") showToast("Transaksi berulang berhasil ditambahkan");
    else if (modal) showToast("Transaksi berulang berhasil diperbarui");
    setModal(null);
    router.refresh();
  }, [router, modal]);

  async function toggleActive(item: RecurringItem) {
    setTogglingId(item.id);
    const result = await toggleRecurringActive(item.id, !item.is_active);
    setTogglingId(null);
    if (result.error) { showToast(result.error, "error"); return; }
    showToast(
      item.is_active ? "Transaksi berulang dinonaktifkan" : "Transaksi berulang diaktifkan",
      "success"
    );
    router.refresh();
  }

  async function handleConfirm(p: PendingItem) {
    const key = `${p.recurringId}_${p.scheduledDate}`;
    setProcessingKey(key);
    const result = await confirmRecurring({
      recurringId: p.recurringId,
      actualDate: actualDates[key] ?? p.scheduledDate,
      scheduledDate: p.scheduledDate,
    });
    setProcessingKey(null);
    if (result.error) { showToast(result.error, "error"); return; }
    showToast(`${p.description} — dikonfirmasi`, "success");
    router.refresh();
  }

  async function handleSkip(p: PendingItem) {
    const key = `${p.recurringId}_${p.scheduledDate}`;
    setProcessingKey(key + "_skip");
    const result = await skipRecurring({
      recurringId: p.recurringId,
      scheduledDate: p.scheduledDate,
    });
    setProcessingKey(null);
    if (result.error) { showToast(result.error, "error"); return; }
    showToast(`${p.description} — dilewati`, "success");
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
            <p className="text-sm text-[var(--text-secondary)]">Konfirmasi dan atur jadwal berulang</p>
          </div>
          {canManage && (
            <button
              onClick={() => setModal("add")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah
            </button>
          )}
        </div>

        {/* ── Menunggu Konfirmasi ── */}
        {pendingItems.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 tracking-widest uppercase">
                <RefreshCw size={12} />
                Menunggu Konfirmasi ({pendingItems.length})
              </span>
              <div className="flex-1 h-px bg-amber-200" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] -mt-1 px-1">
              Cek apakah transaksi benar-benar terjadi. Sesuaikan tanggal jika berbeda dari jadwal.
            </p>

            {pendingItems.map((p) => {
              const key = `${p.recurringId}_${p.scheduledDate}`;
              const isProcessing = processingKey === key || processingKey === key + "_skip";
              const isIncome = p.type === "income";

              return (
                <div
                  key={key}
                  className="bg-[var(--bg-surface)] rounded-2xl border-2 border-amber-200 p-4 space-y-3"
                >
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (p.categoryColor ?? "#94A3B8") + "20", color: p.categoryColor ?? "#94A3B8" }}
                    >
                      <CategoryIcon slug={p.categoryIcon} size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)] text-sm">{p.description}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {p.categoryName} · {p.walletName}
                          </p>
                        </div>
                        <p className={`font-financial font-bold text-base flex-shrink-0 ${isIncome ? "text-success" : "text-danger"}`}>
                          {isIncome ? "+" : "-"}Rp {formatRupiah(p.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          Dijadwalkan: {fmtDate(p.scheduledDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tanggal aktual */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-secondary)]">
                      Tanggal aktual terjadi
                    </label>
                    <input
                      type="date"
                      value={actualDates[key] ?? p.scheduledDate}
                      onChange={e => setActualDates(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-card)] focus:outline-none focus:border-brand-primary transition-colors"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSkip(p)}
                      disabled={isProcessing}
                      className="flex-1 py-2 text-sm rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
                    >
                      {processingKey === key + "_skip" ? "Memproses..." : "Tidak Terjadi"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirm(p)}
                      disabled={isProcessing}
                      className="flex-2 flex-1 py-2 text-sm rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                    >
                      {processingKey === key ? "Mengkonfirmasi..." : "Konfirmasi"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {recurring.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <RefreshCw size={40} />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)] text-base">Belum ada transaksi berulang</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Set sekali, konfirmasi setiap periode</p>
            </div>
            {canManage && (
              <button onClick={() => setModal("add")} className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90">
                Tambah Pertama
              </button>
            )}
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
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20", color: cat?.color ?? "#94A3B8" }}
                    >
                      <CategoryIcon slug={cat?.icon} size={20} />
                    </div>
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

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
                          <RefreshCw size={10} /> {FREQ_LABEL[item.frequency]}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">
                          Berikutnya: <span className="font-medium text-[var(--text-primary)]">{next}</span>
                        </span>
                        {item.end_date && (
                          <span className="text-[10px] text-[var(--text-secondary)]">
                            s/d {new Date(item.end_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                        {item.is_private && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Pribadi
                          </span>
                        )}
                      </div>

                      {canManage && (
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
                            {togglingId === item.id ? "Menonaktifkan..." : "Nonaktifkan"}
                          </button>
                        </div>
                      )}
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
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 grayscale"
                      style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20", color: cat?.color ?? "#94A3B8" }}
                    >
                      <CategoryIcon slug={cat?.icon} size={18} />
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
                      {canManage && (
                        <button
                          onClick={() => toggleActive(item)}
                          disabled={togglingId === item.id}
                          className="text-[10px] text-brand-primary hover:underline mt-0.5 disabled:opacity-50"
                        >
                          {togglingId === item.id ? "Mengaktifkan..." : "Aktifkan"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        {recurring.length > 0 && (
          <div className="flex items-start gap-2 p-3.5 rounded-xl bg-[var(--bg-elevated)] text-xs text-[var(--text-secondary)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Transaksi berulang perlu dikonfirmasi secara manual. Sesuaikan tanggal jika pembayaran lebih cepat atau mundur dari jadwal.
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

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}
