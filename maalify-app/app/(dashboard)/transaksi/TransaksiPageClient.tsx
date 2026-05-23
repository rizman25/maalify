"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, Category, TransactionWithCategory } from "@/types";
import TransaksiModal from "@/components/transaksi/TransaksiModal";
import ScanStrukModal from "@/components/transaksi/ScanStrukModal";
import { Toast, useToast } from "@/components/ui/Toast";
import { CategoryIcon, Lock, Home, AlertCircle, Receipt, Search } from "@/lib/icons";

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
  const { toast, showToast, dismissToast } = useToast();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterWallet, setFilterWallet] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TransactionWithCategory | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const totalIncome  = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const hasActiveFilter = filterType !== "all" || filterWallet !== "all" || filterCategory !== "all" || search !== "";

  function clearFilters() {
    setFilterType("all");
    setFilterWallet("all");
    setFilterCategory("all");
    setSearch("");
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transactions.filter(t => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterWallet !== "all" && t.wallet_id !== filterWallet) return false;
      if (filterCategory !== "all" && t.category_id !== filterCategory) return false;
      if (q && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [transactions, filterType, filterWallet, filterCategory, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, TransactionWithCategory[]>();
    for (const tx of filtered) {
      if (!map.has(tx.date)) map.set(tx.date, []);
      map.get(tx.date)!.push(tx);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function navigateMonth(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    clearFilters();
    router.push(`/transaksi?month=${m}&year=${y}`);
  }

  function openAdd() { setEditTarget(null); setModalOpen(true); }
  function openEdit(tx: TransactionWithCategory) { setEditTarget(tx); setModalOpen(true); }
  function handleClose() { setModalOpen(false); setEditTarget(null); }
  function handleSaved() {
    const isEdit = editTarget !== null;
    handleClose();
    showToast(isEdit ? "Transaksi berhasil diperbarui" : "Transaksi berhasil dicatat");
    router.refresh();
  }

  function formatTanggal(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long",
    });
  }

  // Categories that appear in current month's transactions (for relevant filter)
  const usedCategoryIds = useMemo(() => new Set(transactions.map(t => t.category_id)), [transactions]);
  const relevantCategories = categories.filter(c => usedCategoryIds.has(c.id));

  // Wallets that appear in current month's transactions
  const usedWalletIds = useMemo(() => new Set(transactions.map(t => t.wallet_id)), [transactions]);
  const relevantWallets = wallets.filter(w => usedWalletIds.has(w.id));

  return (
    <div className="max-w-3xl mx-auto space-y-5 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] shrink-0">Transaksi</h1>
        <div className="flex items-center gap-2">
          {/* Scan Struk */}
          {wallets.length === 0 ? (
            <Link
              id="tour-scan"
              href="/dompet"
              className="flex items-center gap-1.5 px-2.5 py-2.5 sm:px-3 border border-amber-300 bg-amber-50 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-100 transition-colors"
              title="Tambahkan dompet dulu di halaman Dompet"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span className="hidden sm:inline whitespace-nowrap">Scan Struk</span>
            </Link>
          ) : (
            <button
              id="tour-scan"
              onClick={() => setScanOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-2.5 sm:px-3 border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm font-medium rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span className="hidden sm:inline whitespace-nowrap">Scan Struk</span>
            </button>
          )}

          {/* Catat Transaksi */}
          {wallets.length === 0 ? (
            <Link
              id="tour-catat"
              href="/dompet"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
              title="Tambahkan dompet dulu di halaman Dompet"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Tambah Dompet Dulu
            </Link>
          ) : (
            <button
              id="tour-catat"
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Catat Transaksi
            </button>
          )}
        </div>
      </div>

      {/* Navigasi Bulan + Summary */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigateMonth(-1)}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="font-semibold text-[var(--text-primary)]">{BULAN[month - 1]} {year}</span>
          <button onClick={() => navigateMonth(1)}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5">
            <p className="text-xs text-[var(--text-secondary)]">Pemasukan</p>
            <p className="font-financial text-sm font-semibold text-success mt-0.5">+Rp {formatRupiah(totalIncome)}</p>
          </div>
          <div className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5">
            <p className="text-xs text-[var(--text-secondary)]">Pengeluaran</p>
            <p className="font-financial text-sm font-semibold text-danger mt-0.5">-Rp {formatRupiah(totalExpense)}</p>
          </div>
          <div className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5">
            <p className="text-xs text-[var(--text-secondary)]">Selisih</p>
            <p className={["font-financial text-sm font-semibold mt-0.5", totalIncome - totalExpense >= 0 ? "text-success" : "text-danger"].join(" ")}>
              {totalIncome - totalExpense >= 0 ? "+" : ""}Rp {formatRupiah(Math.abs(totalIncome - totalExpense))}
            </p>
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="space-y-2.5">
        {/* Search bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari deskripsi transaksi..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filter */}
          <div className="flex gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg">
            {(["all", "income", "expense"] as FilterType[]).map((f) => (
              <button key={f} onClick={() => setFilterType(f)}
                className={["px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  filterType === f ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                ].join(" ")}>
                {f === "all" ? "Semua" : f === "income" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>

          {/* Wallet filter */}
          {relevantWallets.length > 1 && (
            <select
              value={filterWallet}
              onChange={e => setFilterWallet(e.target.value)}
              className={["px-3 py-2 rounded-lg border text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors cursor-pointer",
                filterWallet !== "all" ? "border-brand-primary text-brand-primary" : "border-[var(--border)]"
              ].join(" ")}
            >
              <option value="all">Semua Dompet</option>
              {relevantWallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}

          {/* Category filter */}
          {relevantCategories.length > 1 && (
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className={["px-3 py-2 rounded-lg border text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors cursor-pointer",
                filterCategory !== "all" ? "border-brand-primary text-brand-primary" : "border-[var(--border)]"
              ].join(" ")}
            >
              <option value="all">Semua Kategori</option>
              {relevantCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {hasActiveFilter && (
            <button onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-danger border border-red-200 hover:bg-red-50 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Reset
            </button>
          )}

          {/* Result count */}
          {hasActiveFilter && (
            <span className="text-xs text-[var(--text-secondary)] ml-auto">
              {filtered.length} dari {transactions.length} transaksi
            </span>
          )}
        </div>
      </div>

      {/* No wallet — inline callout */}
      {wallets.length === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Belum ada dompet</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Kamu perlu menambahkan minimal satu dompet sebelum bisa mencatat transaksi.
            </p>
          </div>
          <Link
            href="/dompet"
            className="flex-shrink-0 px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
          >
            Buat Dompet →
          </Link>
        </div>
      )}

      {/* Transaction List */}
      {filtered.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-14 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
            {hasActiveFilter ? <Search size={22} /> : <Receipt size={22} />}
          </div>
          <p className="font-medium text-[var(--text-primary)]">
            {hasActiveFilter ? "Tidak ada transaksi yang cocok" : "Belum ada transaksi"}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {hasActiveFilter
              ? "Coba ubah filter atau kata kunci pencarian"
              : `Belum ada transaksi di ${BULAN[month - 1]} ${year}`}
          </p>
          {hasActiveFilter && (
            <button onClick={clearFilters}
              className="mt-3 text-xs text-brand-primary hover:underline">
              Reset filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, txList]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2 px-1">
                {formatTanggal(date)}
              </p>
              <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                {txList.map((tx, i) => {
                  const isOwn = tx.user_id === userId;
                  const isPrivate = tx.visibility === "private";
                  const memberName = !isOwn ? (tx.users?.name ?? "Anggota") : null;
                  return (
                    <button key={tx.id}
                      onClick={() => isOwn ? openEdit(tx) : undefined}
                      className={["w-full flex items-center gap-4 px-4 py-3.5 transition-colors text-left",
                        i > 0 ? "border-t border-[var(--border)]" : "",
                        isOwn ? "hover:bg-[var(--bg-elevated)] cursor-pointer" : "cursor-default opacity-90",
                      ].join(" ")}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: (tx.categories?.color ?? "#94A3B8") + "20", color: tx.categories?.color ?? "#94A3B8" }}>
                        <CategoryIcon slug={tx.categories?.icon} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {tx.description}
                          </p>
                          {/* Visibility badge */}
                          {isOwn && isPrivate && (
                            <span className="flex-shrink-0 text-slate-400 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-1.5 py-0.5 rounded-full leading-none flex items-center">
                              <Lock size={9} />
                            </span>
                          )}
                          {!isPrivate && (
                            <span className="flex-shrink-0 text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full leading-none flex items-center">
                              <Home size={9} />
                            </span>
                          )}
                          {tx.attachment_url && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-brand-primary">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {tx.categories?.name} · {tx.wallets?.name}
                          {memberName && <span className="ml-1 text-brand-primary">· {memberName}</span>}
                        </p>
                      </div>
                      <p className={["font-financial text-sm font-semibold flex-shrink-0",
                        tx.type === "income" ? "text-success" : "text-danger"].join(" ")}>
                        {tx.type === "income" ? "+" : "-"}Rp {formatRupiah(Number(tx.amount))}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scan Struk Modal */}
      {scanOpen && (
        <ScanStrukModal
          wallets={wallets}
          categories={categories}
          householdId={householdId}
          userId={userId}
          onClose={() => setScanOpen(false)}
          onSaved={() => { setScanOpen(false); showToast("Transaksi dari struk berhasil disimpan"); router.refresh(); }}
        />
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
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}
