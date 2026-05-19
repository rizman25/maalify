"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, Category, TransactionWithCategory, TransactionType } from "@/types";

interface Props {
  transaction: TransactionWithCategory | null;
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function TransaksiModal({
  transaction, wallets, categories, householdId, userId, onClose, onSaved,
}: Props) {
  const isEdit = transaction !== null;
  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(isEdit ? String(transaction.amount) : "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [walletId, setWalletId] = useState(transaction?.wallet_id ?? (wallets[0]?.id ?? ""));
  const [date, setDate] = useState(transaction?.date ?? today);
  const [note, setNote] = useState(transaction?.note ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // Auto-select first category when type changes
  useMemo(() => {
    if (!isEdit && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type]);

  function formatAmountInput(val: string) {
    const digits = val.replace(/\D/g, "");
    return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
  }

  function parseAmount(val: string) {
    return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseAmount(amount);

    if (parsedAmount <= 0) { setError("Jumlah harus lebih dari 0."); return; }
    if (!description.trim()) { setError("Deskripsi wajib diisi."); return; }
    if (!categoryId) { setError("Pilih kategori."); return; }
    if (!walletId) { setError("Pilih dompet."); return; }

    setError("");
    setLoading(true);
    const supabase = createClient();

    if (isEdit) {
      const { error: err } = await supabase
        .from("transactions")
        .update({
          type,
          amount: parsedAmount,
          description: description.trim(),
          category_id: categoryId,
          wallet_id: walletId,
          date,
          note: note.trim() || null,
        })
        .eq("id", transaction.id);

      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.from("transactions").insert({
        household_id: householdId,
        user_id: userId,
        type,
        amount: parsedAmount,
        description: description.trim(),
        category_id: categoryId,
        wallet_id: walletId,
        date,
        note: note.trim() || null,
      });

      if (err) { setError(err.message); setLoading(false); return; }
    }

    onSaved();
  }

  async function handleDelete() {
    if (!transaction) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", transaction.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Transaksi" : "Catat Transaksi"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={[
                "py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors",
                type === "expense"
                  ? "border-danger bg-red-50 text-danger"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-danger/40",
              ].join(" ")}
            >
              📤 Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={[
                "py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors",
                type === "income"
                  ? "border-success bg-green-50 text-success"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-success/40",
              ].join(" ")}
            >
              📥 Pemasukan
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Jumlah</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(amount)}
                onChange={(e) => setAmount(e.target.value.replace(/\./g, ""))}
                placeholder="0"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[var(--border)] text-lg text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "income" ? "contoh: Gaji bulan ini" : "contoh: Makan siang"}
              maxLength={200}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Kategori</label>
            <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={[
                    "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-xs transition-colors",
                    categoryId === cat.id
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                  ].join(" ")}
                >
                  <span className="text-lg">{cat.icon ?? "💰"}</span>
                  <span className="text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dompet + Tanggal (2 kolom) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Dompet</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Catatan <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Menyimpan..." : isEdit ? "Simpan" : "Catat"}
            </button>
          </div>

          {/* Delete — hanya saat edit */}
          {isEdit && (
            <div className="border-t border-[var(--border)] pt-4">
              {!showDelete ? (
                <button type="button" onClick={() => setShowDelete(true)} className="w-full text-xs text-danger hover:underline">
                  Hapus transaksi ini
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-danger font-medium">Hapus transaksi?</p>
                  <p className="text-xs text-[var(--text-secondary)]">Saldo dompet akan dikembalikan. Tindakan ini tidak dapat dibatalkan.</p>
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
  );
}
