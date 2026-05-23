"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";

interface Wallet {
  id: string;
  name: string;
  type: string;
  current_balance: number;
}

interface DebtItem {
  id: string;
  type: "payable" | "receivable";
  party_name: string;
  total_amount: number;
  remaining_amount: number;
  installment_months: number | null;
}

interface Props {
  debt: DebtItem;
  wallets: Wallet[];
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function BayarModal({ debt, wallets, userId, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value.replace(/\D/g, ""));
  }

  function setFull() {
    setAmount(String(Math.round(debt.remaining_amount)));
  }

  const monthlyInstallment = debt.installment_months && debt.installment_months > 0
    ? Math.ceil(debt.total_amount / debt.installment_months)
    : null;

  function setInstallment() {
    if (monthlyInstallment) {
      setAmount(String(Math.min(monthlyInstallment, Math.round(debt.remaining_amount))));
    }
  }

  async function handleSave() {
    const amt = parseInt(amount, 10);
    if (amt <= 0 || isNaN(amt)) { setError("Nominal harus lebih dari 0"); return; }
    if (amt > debt.remaining_amount) { setError(`Melebihi sisa (Rp ${formatRupiah(debt.remaining_amount)})`); return; }
    if (!walletId) { setError("Pilih dompet"); return; }

    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: err } = await supabase.from("debt_payments").insert({
        debt_id: debt.id,
        wallet_id: walletId,
        amount: amt,
        paid_at: paidAt,
        note: note.trim() || null,
        created_by: userId,
      });
      if (err) throw err;

      // Update remaining_amount and status on debts
      const newRemaining = debt.remaining_amount - amt;
      const { error: err2 } = await supabase.from("debts").update({
        remaining_amount: newRemaining,
        status: newRemaining <= 0 ? "settled" : "active",
      }).eq("id", debt.id);
      if (err2) throw err2;

      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const isPayable = debt.type === "payable";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" style={{backdropFilter:"none",WebkitBackdropFilter:"none"}} onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh)] sm:max-h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">
              {isPayable ? "Catat Pembayaran" : "Catat Penerimaan"}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{debt.party_name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Sisa info */}
          <div className={`flex items-center justify-between p-3 rounded-xl ${isPayable ? "bg-red-50" : "bg-blue-50"}`}>
            <span className="text-xs text-[var(--text-secondary)]">Sisa yang perlu dilunasi</span>
            <span className={`font-financial font-bold text-sm ${isPayable ? "text-red-600" : "text-blue-600"}`}>
              Rp {formatRupiah(debt.remaining_amount)}
            </span>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Nominal {isPayable ? "Dibayar" : "Diterima"}</label>
              <div className="flex gap-2">
                {monthlyInstallment !== null && (
                  <button type="button" onClick={setInstallment} className="text-xs text-brand-primary font-medium hover:underline">
                    Isi cicilan (Rp {formatRupiah(monthlyInstallment)})
                  </button>
                )}
                <button type="button" onClick={setFull} className="text-xs text-brand-primary font-medium hover:underline">
                  Bayar penuh
                </button>
              </div>
            </div>
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
          </div>

          {/* Wallet */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {isPayable ? "Bayar dari Dompet" : "Terima ke Dompet"}
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setWalletId(w.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                    walletId === w.id
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-[var(--border)] hover:border-[var(--text-secondary)]"
                  }`}
                >
                  <span className="text-[var(--text-primary)] font-medium">{w.name}</span>
                  <span className="text-xs text-[var(--text-secondary)]">Rp {formatRupiah(w.current_balance)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal</label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Catatan <span className="font-normal italic">(opsional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="cth. Transfer BCA, cicilan ke-2..."
              maxLength={200}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors placeholder:text-[var(--text-secondary)]/50"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
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
