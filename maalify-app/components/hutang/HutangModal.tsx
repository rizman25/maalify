"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { TrendingDown, ArrowRightLeft } from "@/lib/icons";

interface DebtItem {
  id: string;
  type: "payable" | "receivable";
  party_name: string;
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  description: string | null;
  status: "active" | "settled" | "overdue";
  installment_months: number | null;
}

interface Props {
  mode: "add" | "edit";
  debt?: DebtItem;
  householdId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function HutangModal({ mode, debt, householdId, userId, onClose, onSaved }: Props) {
  const [type, setType] = useState<"payable" | "receivable">(debt?.type ?? "payable");
  const [partyName, setPartyName] = useState(debt?.party_name ?? "");
  const [amount, setAmount] = useState(debt ? String(debt.total_amount) : "");
  const [installmentMonths, setInstallmentMonths] = useState(
    debt?.installment_months ? String(debt.installment_months) : ""
  );
  const [dueDate, setDueDate] = useState(debt?.due_date ?? "");
  const [description, setDescription] = useState(debt?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = parseInt(amount, 10) || 0;
  const parsedMonths = parseInt(installmentMonths, 10) || 0;
  const monthlyInstallment = parsedAmount > 0 && parsedMonths > 0
    ? Math.ceil(parsedAmount / parsedMonths)
    : null;

  // Edit mode: compute from stored data
  const editMonthly = debt?.installment_months && debt.installment_months > 0
    ? Math.ceil(debt.total_amount / debt.installment_months)
    : null;
  const editPaidInstallments = editMonthly && debt
    ? Math.floor((debt.total_amount - debt.remaining_amount) / editMonthly)
    : 0;

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value.replace(/\D/g, ""));
  }

  function handleMonthsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, "");
    if (parseInt(v) > 360) return;
    setInstallmentMonths(v);
  }

  async function handleSave() {
    const amt = parseInt(amount, 10);
    if (!partyName.trim()) { setError("Nama pihak harus diisi"); return; }
    if (amt <= 0 || isNaN(amt)) { setError("Nominal harus lebih dari 0"); return; }

    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const months = parsedMonths > 0 ? parsedMonths : null;

      if (mode === "add") {
        const { error: err } = await supabase.from("debts").insert({
          household_id: householdId,
          user_id: userId,
          type,
          party_name: partyName.trim(),
          total_amount: amt,
          remaining_amount: amt,
          due_date: dueDate || null,
          description: description.trim() || null,
          status: "active",
          installment_months: months,
        });
        if (err) throw err;
      } else if (debt) {
        const { error: err } = await supabase.from("debts").update({
          party_name: partyName.trim(),
          due_date: dueDate || null,
          description: description.trim() || null,
          installment_months: months,
        }).eq("id", debt.id);
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
    if (!debt) return;
    setDeleting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase.from("debts").delete().eq("id", debt.id);
      if (err) throw err;
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" style={{backdropFilter:"none",WebkitBackdropFilter:"none"}} onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh)] sm:max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {mode === "add" ? "Catat Hutang / Piutang" : "Edit Catatan"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Type toggle (add only) */}
          {mode === "add" && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setType("payable")}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  type === "payable"
                    ? "bg-red-50 border-red-400 text-red-600"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                }`}>
                <span className="flex items-center justify-center gap-1.5"><TrendingDown size={14} /> Hutang</span>
                <p className="text-[10px] font-normal mt-0.5 opacity-70">Saya yang berhutang</p>
              </button>
              <button type="button" onClick={() => setType("receivable")}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  type === "receivable"
                    ? "bg-blue-50 border-blue-400 text-blue-600"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                }`}>
                <span className="flex items-center justify-center gap-1.5"><ArrowRightLeft size={14} /> Piutang</span>
                <p className="text-[10px] font-normal mt-0.5 opacity-70">Orang lain berhutang ke saya</p>
              </button>
            </div>
          )}

          {/* Edit mode: type badge */}
          {mode === "edit" && debt && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              debt.type === "payable" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
            }`}>
              <span className="flex items-center gap-1.5">{debt.type === "payable" ? <><TrendingDown size={14} /> Hutang</> : <><ArrowRightLeft size={14} /> Piutang</>}</span>
            </div>
          )}

          {/* Party name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {type === "payable" ? "Nama Pemberi Hutang" : "Nama Peminjam"}
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder={type === "payable" ? "cth. Bank BCA, Pak Ahmad..." : "cth. Budi, Adik..."}
              maxLength={100}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors placeholder:text-[var(--text-secondary)]/50"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {mode === "edit" ? "Total Hutang" : "Total Nominal"}
            </label>
            {mode === "edit" ? (
              <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-3 bg-[var(--bg-elevated)]">
                <span className="text-sm text-[var(--text-secondary)] font-medium">Rp</span>
                <span className="font-financial text-lg font-semibold text-[var(--text-primary)]">
                  {formatRupiah(debt!.total_amount)}
                </span>
              </div>
            ) : (
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
            )}
          </div>

          {/* Installment */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Tempo & Cicilan <span className="font-normal italic">(opsional — isi jika dicicil)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-brand-primary transition-colors bg-[var(--bg-card)] flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={installmentMonths}
                  onChange={handleMonthsChange}
                  placeholder="0"
                  className="w-full bg-transparent text-[var(--text-primary)] font-semibold text-base outline-none placeholder:text-[var(--text-secondary)]/40 text-center"
                />
              </div>
              <span className="text-sm text-[var(--text-secondary)] flex-shrink-0">bulan</span>
            </div>

            {/* Preview cicilan */}
            {mode === "add" && monthlyInstallment !== null && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/20">
                <span className="text-xs text-[var(--text-secondary)]">Cicilan per bulan</span>
                <span className="font-financial font-bold text-sm text-brand-primary">
                  Rp {formatRupiah(monthlyInstallment)}
                </span>
              </div>
            )}

            {/* Edit mode: cicilan info */}
            {mode === "edit" && debt?.installment_months && editMonthly !== null && (
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Cicilan per bulan</span>
                  <span className="font-financial font-semibold text-[var(--text-primary)]">Rp {formatRupiah(editMonthly)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Sudah dibayar</span>
                  <span className="font-medium text-[var(--text-primary)]">{editPaidInstallments} dari {debt.installment_months} cicilan</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Sisa cicilan</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {Math.max(0, debt.installment_months - editPaidInstallments)} cicilan lagi
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Tanggal Jatuh Tempo <span className="font-normal italic">(opsional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Keterangan <span className="font-normal italic">(opsional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="cth. Pinjaman untuk beli motor..."
              rows={2}
              maxLength={500}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors resize-none placeholder:text-[var(--text-secondary)]/50"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Delete */}
          {mode === "edit" && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="w-full text-center text-sm text-red-500 hover:text-red-600 py-1">
              Hapus Catatan Ini
            </button>
          )}
          {confirmDelete && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <p className="text-sm text-red-700 font-medium">Hapus catatan hutang ini?</p>
              <p className="text-xs text-red-600">Semua riwayat pembayaran juga akan dihapus.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
                  Batal
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60">
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-60 transition-colors">
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
