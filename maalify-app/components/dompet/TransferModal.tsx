"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import type { Wallet } from "@/types";
import { saveTransfer } from "@/app/actions/wallets";
const TYPE_LABEL: Record<string, string> = {
  cash: "Tunai", bank: "Bank", savings: "Tabungan", ewallet: "E-Wallet",
};

interface Props {
  wallets: Wallet[];
  householdId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

function formatAmountInput(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
}

function parseAmount(val: string) {
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
}


export default function TransferModal({ wallets, householdId, userId, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [fromId, setFromId] = useState(wallets[0]?.id ?? "");
  const [toId, setToId] = useState(wallets[1]?.id ?? wallets[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = parseAmount(amount);
  const parsedFee = parseAmount(adminFee);
  const totalDeduct = parsedAmount + parsedFee;

  const fromWallet = wallets.find(w => w.id === fromId);
  const toWallets = wallets.filter(w => w.id !== fromId);
  const effectiveToId = toId === fromId ? (toWallets[0]?.id ?? "") : toId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parsedAmount <= 0) { setError("Jumlah harus lebih dari 0."); return; }
    if (!fromId || !effectiveToId) { setError("Pilih dompet asal dan tujuan."); return; }
    if (fromId === effectiveToId) { setError("Dompet asal dan tujuan tidak boleh sama."); return; }
    if (fromWallet && totalDeduct > Number(fromWallet.current_balance)) {
      setError(`Saldo ${fromWallet.name} tidak cukup. Dibutuhkan Rp ${formatRupiah(totalDeduct)} (termasuk biaya admin).`);
      return;
    }

    setError("");
    setLoading(true);

    const result = await saveTransfer({
      householdId,
      fromWalletId: fromId,
      toWalletId: effectiveToId,
      amount: parsedAmount,
      adminFee: parsedFee,
      description: description || undefined,
      date,
      userId,
    });

    if (result.error) { setError(result.error); setLoading(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-6">
      <div className="absolute inset-0 bg-black/40" style={{backdropFilter:"none",WebkitBackdropFilter:"none"}} onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">Transfer Antar Dompet</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* From → To */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Dari Dompet</label>
              <select
                value={fromId}
                onChange={(e) => {
                  setFromId(e.target.value);
                  if (effectiveToId === e.target.value) {
                    const other = wallets.find(w => w.id !== e.target.value);
                    if (other) setToId(other.id);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>[{TYPE_LABEL[w.type] ?? w.type}] {w.name}</option>
                ))}
              </select>
              {fromWallet && (
                <p className="font-financial text-xs text-[var(--text-secondary)] mt-1">
                  Saldo: Rp {formatRupiah(Number(fromWallet.current_balance))}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 pt-5">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-secondary)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Ke Dompet</label>
              <select
                value={effectiveToId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {toWallets.map(w => (
                  <option key={w.id} value={w.id}>[{TYPE_LABEL[w.type] ?? w.type}] {w.name}</option>
                ))}
              </select>
              {(() => {
                const tw = wallets.find(w => w.id === effectiveToId);
                return tw ? (
                  <p className="font-financial text-xs text-[var(--text-secondary)] mt-1">
                    Saldo: Rp {formatRupiah(Number(tw.current_balance))}
                  </p>
                ) : null;
              })()}
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">Jumlah Transfer</label>
              {fromWallet && (
                <button type="button"
                  onClick={() => setAmount(String(Math.round(Number(fromWallet.current_balance) - parsedFee)))}
                  className="text-[10px] text-brand-primary hover:underline">
                  Semua ({formatRupiah(Number(fromWallet.current_balance))})
                </button>
              )}
            </div>
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

          {/* Admin Fee */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Biaya Admin <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(adminFee)}
                onChange={(e) => setAdminFee(e.target.value.replace(/\./g, ""))}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            {parsedFee > 0 && (
              <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                Dipotong dari dompet asal — tidak masuk ke dompet tujuan
              </p>
            )}
          </div>

          {/* Summary total deduction */}
          {parsedAmount > 0 && parsedFee > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] text-sm">
              <span className="text-[var(--text-secondary)] text-xs">Total keluar dari {fromWallet?.name ?? "dompet asal"}</span>
              <span className="font-financial font-semibold text-[var(--text-primary)]">Rp {formatRupiah(totalDeduct)}</span>
            </div>
          )}

          {/* Date */}
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

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Keterangan <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="contoh: Top up tabungan"
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Transfer tidak mempengaruhi total aset. Biaya admin akan mengurangi saldo dompet asal.
          </div>

          {error && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading || wallets.length < 2}
              className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Memproses..." : "Transfer"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
