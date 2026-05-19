"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, Category, TransactionWithCategory } from "@/types";
import TransaksiModal from "@/components/transaksi/TransaksiModal";

const BULAN = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

interface Props {
  transactions: TransactionWithCategory[];
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
  month: number;
  year: number;
}

type FilterType = "all" | "income" | "expense";

export default function TransaksiPageClient({
  transactions, wallets, categories, householdId, userId, month, year,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TransactionWithCategory | null>(null);

  const filtered = useMemo(() =>
    filter === "all" ? transactions : transactions.filter((t) => t.type === filter),
    [transactions, filter]
  );

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  // Grup transaksi berdasarkan tanggal
  const grouped = useMemo(() => {
    const map = new Map<string, TransactionWithCategory[]>();
    for (const tx of filtered) {
      const key = tx.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function navigateMonth(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    router.push(`/transaksi?month=${m}&year=${y}`);
  }

  function openAdd() { setEditTarget(null); setModalOpen(true); }
  function openEdit(tx: TransactionWithCategory) { setEditTarget(tx); setModalOpen(true); }
  function handleClose() { setModalOpen(false); setEditTarget(null); }
  function handleSaved() { handleClose(); router.refresh(); }

  function formatTanggal(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Transaksi</h1>
        <button
          onClick={openAdd}
          disabled={wallets.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          title={wallets.length === 0 ? "Tambahkan dompet dulu" : ""}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Catat Transaksi
        </button>
      </div>

      {/* Navigasi Bulan */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="font-semibold text-[var(--text-primary)]">
            {BULAN[month - 1]} {year}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5">
            <p className="text-xs text-[var(--text-secondary)]">Pemasukan</p>
            <p className="font-financial text-sm font-semibold text-success mt-0.5">
              +Rp {formatRupiah(totalIncome)}
            </p>
          </div>
          <div className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5">
            <p className="text-xs text-[var(--text-secondary)]">Pengeluaran</p>
            <p className="font-financial text-sm font-semibold text-danger mt-0.5">
              -Rp {formatRupiah(totalExpense)}
            </p>
          </div>
          <div className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5">
            <p className="text-xs text-[var(--text-secondary)]">Selisih</p>
            <p className={[
              "font-financial text-sm font-semibold mt-0.5",
              totalIncome - totalExpense >= 0 ? "text-success" : "text-danger",
            ].join(" ")}>
              {totalIncome - totalExpense >= 0 ? "+" : ""}Rp {formatRupiah(Math.abs(totalIncome - totalExpense))}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg w-fit">
        {(["all", "income", "expense"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              filter === f
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            ].join(" ")}
          >
            {f === "all" ? "Semua" : f === "income" ? "Pemasukan" : "Pengeluaran"}
          </button>
        ))}
      </div>

      {/* No wallet warning */}
      {wallets.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Tambahkan dompet terlebih dahulu sebelum mencatat transaksi.{" "}
          <a href="/dompet" className="font-semibold underline">Ke halaman Dompet →</a>
        </div>
      )}

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-14 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-xl">
            📋
          </div>
          <p className="font-medium text-[var(--text-primary)]">Belum ada transaksi</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {filter === "all" ? `Belum ada transaksi di ${BULAN[month - 1]} ${year}` : `Tidak ada ${filter === "income" ? "pemasukan" : "pengeluaran"} di bulan ini`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, txList]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2 px-1">
                {formatTanggal(date)}
              </p>
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                {txList.map((tx, i) => (
                  <button
                    key={tx.id}
                    onClick={() => openEdit(tx)}
                    className={[
                      "w-full flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors text-left",
                      i > 0 ? "border-t border-[var(--border)]" : "",
                    ].join(" ")}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: (tx.categories?.color ?? "#94A3B8") + "20" }}
                    >
                      {tx.categories?.icon ?? "💸"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {tx.categories?.name} · {tx.wallets?.name}
                      </p>
                    </div>
                    <p className={[
                      "font-financial text-sm font-semibold flex-shrink-0",
                      tx.type === "income" ? "text-success" : "text-danger",
                    ].join(" ")}>
                      {tx.type === "income" ? "+" : "-"}Rp {formatRupiah(Number(tx.amount))}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <TransaksiModal
          transaction={editTarget}
          wallets={wallets}
          categories={categories}
          householdId={householdId}
          userId={userId}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
