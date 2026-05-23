"use client";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface BudgetItem {
  id: string;
  category_id: string;
  name: string;
  customName: string | null;
  icon: string;
  color: string;
  budget: number;
  spent: number;
  isRecurring: boolean;
}

interface Props {
  mode: "add" | "edit";
  budget?: BudgetItem;
  availableCategories: Category[];
  householdId: string;
  month: number;
  year: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function AnggaranModal({
  mode, budget, availableCategories, householdId, month, year, onClose, onSaved,
}: Props) {
  const [categoryId, setCategoryId] = useState(budget?.category_id ?? availableCategories[0]?.id ?? "");
  const [customName, setCustomName] = useState(budget?.customName ?? "");
  const [amount, setAmount] = useState(budget ? String(budget.budget) : "");
  const [isRecurring, setIsRecurring] = useState(budget?.isRecurring ?? false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (mode === "add" && availableCategories.length > 0 && !categoryId) {
      setCategoryId(availableCategories[0].id);
    }
  }, [availableCategories, mode, categoryId]);

  function parseAmount(raw: string) {
    return parseInt(raw.replace(/\D/g, ""), 10) || 0;
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setAmount(digits);
  }

  async function handleSave() {
    const amt = parseAmount(amount);
    if (amt <= 0) { setError("Nominal harus lebih dari 0"); return; }
    if (mode === "add" && !categoryId) { setError("Pilih kategori"); return; }

    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (mode === "add") {
        const { error: err } = await supabase.from("budgets").insert({
          household_id: householdId,
          category_id: categoryId,
          amount: amt,
          name: customName.trim() || null,
          month,
          year,
          period: "monthly",
          is_recurring: isRecurring,
        });
        if (err) throw err;
      } else if (budget) {
        const { error: err } = await supabase.from("budgets")
          .update({ amount: amt, name: customName.trim() || null, is_recurring: isRecurring })
          .eq("id", budget.id);
        if (err) throw err;
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!budget) return;
    setDeleting(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase.from("budgets").delete().eq("id", budget.id);
      if (err) throw err;
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" style={{backdropFilter:"none",WebkitBackdropFilter:"none"}} onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh)] sm:max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {mode === "add" ? "Tambah Anggaran" : "Edit Anggaran"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Period badge + Recurring toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-secondary)]">
              {MONTHS[month - 1]} {year}
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 transition-colors ${
                isRecurring
                  ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40"
              }`}
            >
              <span className="text-sm">🔄</span>
              <span className="text-xs font-semibold">
                {isRecurring ? "Berulang" : "Sekali"}
              </span>
              {/* mini toggle */}
              <div
                className={`relative rounded-full transition-colors flex-shrink-0 ${isRecurring ? "bg-brand-primary" : "bg-[var(--border)]"}`}
                style={{ width: 28, height: 16 }}
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white shadow transition-all"
                  style={{ width: 12, height: 12, left: isRecurring ? 14 : 2 }}
                />
              </div>
            </button>
          </div>

          {/* Custom name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Nama Anggaran <span className="font-normal italic">(opsional)</span>
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={budget ? budget.name : "cth. Belanja bulanan, Jajan anak..."}
              maxLength={60}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors placeholder:text-[var(--text-secondary)]/50"
            />
          </div>

          {/* Category (add only) */}
          {mode === "add" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Kategori</label>
              {availableCategories.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] italic">Semua kategori sudah memiliki anggaran bulan ini.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                        categoryId === cat.id
                          ? "border-brand-primary bg-brand-primary/5 text-[var(--text-primary)] font-medium"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="text-base">{cat.icon ?? "💰"}</span>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category display (edit mode) */}
          {mode === "edit" && budget && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]">
              <span className="text-2xl">{budget.icon}</span>
              <div>
                <p className="font-medium text-[var(--text-primary)] text-sm">{budget.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">Kategori pengeluaran</p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Nominal Anggaran</label>
            <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-3 focus-within:border-brand-primary transition-colors bg-[var(--bg-card)]">
              <span className="text-sm text-[var(--text-secondary)] font-medium flex-shrink-0">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={amount ? Number(amount).toLocaleString("id-ID") : ""}
                onChange={handleAmountChange}
                placeholder="0"
                className="flex-1 bg-transparent text-[var(--text-primary)] font-financial text-lg font-semibold outline-none placeholder:text-[var(--text-secondary)]/40"
              />
            </div>
            {amount && Number(amount) > 0 && (
              <p className="text-xs text-[var(--text-secondary)]">Rp {formatRupiah(Number(amount))}</p>
            )}
          </div>

          {/* Current spending info (edit mode) */}
          {mode === "edit" && budget && budget.spent > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700">
                Sudah terpakai <strong>Rp {formatRupiah(budget.spent)}</strong> bulan ini
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {/* Delete section */}
          {mode === "edit" && !confirmDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full text-center text-sm text-red-500 hover:text-red-600 py-1"
            >
              Hapus Anggaran Ini
            </button>
          )}

          {confirmDelete && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <p className="text-sm text-red-700 font-medium">Hapus anggaran ini?</p>
              <p className="text-xs text-red-600">Data anggaran akan dihapus. Riwayat transaksi tidak terpengaruh.</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60"
                >
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || (mode === "add" && availableCategories.length === 0)}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
