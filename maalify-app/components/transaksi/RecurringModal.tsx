"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import type { RecurringItem } from "@/app/(dashboard)/transaksi-berulang/page";

interface Wallet { id: string; name: string; type: string; current_balance: number; }
interface Category { id: string; name: string; icon: string | null; color: string | null; type: string; }

interface Props {
  item?: RecurringItem;
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

const FREQ_OPTIONS = [
  { value: "monthly", label: "Bulanan", desc: "Setiap bulan pada tanggal yang sama" },
  { value: "weekly",  label: "Mingguan", desc: "Setiap minggu pada hari yang sama" },
  { value: "daily",   label: "Harian",   desc: "Setiap hari" },
] as const;

function formatAmountInput(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
}
function parseAmount(val: string) {
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
}

export default function RecurringModal({ item, wallets, categories, householdId, userId, onClose, onSaved }: Props) {
  const isEdit = !!item;
  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState<"income" | "expense">(item?.type ?? "expense");
  const [amount, setAmount] = useState(isEdit ? String(item!.amount) : "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? "");
  const [walletId, setWalletId] = useState(item?.wallet_id ?? (wallets[0]?.id ?? ""));
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">(item?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(item?.start_date ?? today);
  const [endDate, setEndDate] = useState(item?.end_date ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const parsedAmount = parseAmount(amount);
  const filteredCats = useMemo(() => categories.filter(c => c.type === type), [categories, type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parsedAmount <= 0) { setError("Jumlah harus lebih dari 0."); return; }
    if (!description.trim()) { setError("Deskripsi wajib diisi."); return; }
    if (!categoryId) { setError("Pilih kategori."); return; }
    if (!walletId) { setError("Pilih dompet."); return; }

    setError("");
    setLoading(true);
    const supabase = createClient();

    const payload = {
      type,
      amount: parsedAmount,
      description: description.trim(),
      category_id: categoryId,
      wallet_id: walletId,
      frequency,
      start_date: startDate,
      end_date: endDate || null,
    };

    if (isEdit && item) {
      const { error: err } = await supabase
        .from("recurring_transactions")
        .update(payload)
        .eq("id", item.id);
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.from("recurring_transactions").insert({
        ...payload,
        household_id: householdId,
        created_by: userId,
        is_active: true,
      });
      if (err) { setError(err.message); setLoading(false); return; }
    }
    onSaved();
  }

  async function handleDelete() {
    if (!item) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("recurring_transactions").delete().eq("id", item.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-8 pb-4">
      <div className="absolute inset-0 bg-black/40" style={{backdropFilter:"none",WebkitBackdropFilter:"none"}} onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Transaksi Berulang" : "Tambah Transaksi Berulang"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategoryId(""); }}
                className={["py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors",
                  type === t
                    ? t === "expense" ? "border-danger bg-red-50 text-danger" : "border-success bg-green-50 text-success"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40"
                ].join(" ")}>
                {t === "expense" ? "📤 Pengeluaran" : "📥 Pemasukan"}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Jumlah</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <input type="text" inputMode="numeric"
                value={formatAmountInput(amount)}
                onChange={e => setAmount(e.target.value.replace(/\./g, ""))}
                placeholder="0" required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[var(--border)] text-lg font-financial font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            {parsedAmount > 0 && <p className="text-xs text-[var(--text-secondary)] mt-1">Rp {formatRupiah(parsedAmount)}</p>}
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Nama / Deskripsi</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder={type === "income" ? "contoh: Gaji Bulanan" : "contoh: Tagihan Listrik"}
              maxLength={200} required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Kategori</label>
            <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredCats.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                  className={["flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-xs transition-colors",
                    categoryId === cat.id
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40"
                  ].join(" ")}>
                  <span className="text-lg">{cat.icon ?? "💰"}</span>
                  <span className="text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dompet */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Dompet</label>
            <select value={walletId} onChange={e => setWalletId(e.target.value)} required
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary">
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {/* Frekuensi */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Frekuensi</label>
            <div className="grid grid-cols-3 gap-2">
              {FREQ_OPTIONS.map(f => (
                <button key={f.value} type="button" onClick={() => setFrequency(f.value)}
                  className={["py-3 px-2 rounded-xl border-2 text-center transition-colors",
                    frequency === f.value
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-[var(--border)] hover:border-brand-primary/40"
                  ].join(" ")}>
                  <p className={["text-sm font-semibold", frequency === f.value ? "text-brand-primary" : "text-[var(--text-primary)]"].join(" ")}>
                    {f.label}
                  </p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-tight">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tanggal mulai + selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Mulai</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
                Berakhir <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
              </label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>

          {error && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah"}
            </button>
          </div>

          {isEdit && (
            <div className="border-t border-[var(--border)] pt-4">
              {!showDelete ? (
                <button type="button" onClick={() => setShowDelete(true)} className="w-full text-xs text-danger hover:underline">
                  Hapus transaksi berulang ini
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-3 space-y-3">
                  <p className="text-sm text-danger font-medium">Hapus transaksi berulang?</p>
                  <p className="text-xs text-[var(--text-secondary)]">Transaksi yang sudah dibuat tidak akan ikut terhapus.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDelete(false)} className="flex-1 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">Batal</button>
                    <button type="button" onClick={handleDelete} disabled={loading} className="flex-1 py-2 text-xs rounded-lg bg-danger text-white font-medium hover:opacity-90 disabled:opacity-50">
                      {loading ? "..." : "Ya, Hapus"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}
