"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Wallet, WalletType } from "@/types";
import { updateWallet, deactivateWallet } from "@/app/actions/wallets";
import { formatRupiah } from "@/lib/utils";

const WALLET_TYPES: { value: WalletType; label: string; icon: string }[] = [
  { value: "cash", label: "Tunai", icon: "💵" },
  { value: "bank", label: "Bank", icon: "🏦" },
  { value: "savings", label: "Tabungan", icon: "🏧" },
  { value: "ewallet", label: "E-Wallet", icon: "📱" },
];

const TYPE_DEFAULT_COLOR: Record<WalletType, string> = {
  cash: "#27AE60",
  bank: "#1E3A5F",
  savings: "#F59E0B",
  ewallet: "#8B5CF6",
};

interface Props {
  wallet: Wallet | null;
  householdId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function WalletModal({ wallet, householdId, userId, onClose, onSaved }: Props) {
  const isEdit = wallet !== null;

  const [name, setName] = useState(wallet?.name ?? "");
  const [type, setType] = useState<WalletType>(wallet?.type ?? "cash");
  const [initialBalance, setInitialBalance] = useState(
    isEdit ? String(wallet.initial_balance) : "0"
  );
  // Edit mode: saldo saat ini yang bisa diubah
  const [currentBalance, setCurrentBalance] = useState(
    isEdit ? String(wallet.current_balance) : "0"
  );
  const [color, setColor] = useState(TYPE_DEFAULT_COLOR[wallet?.type ?? "cash"]);
  const [isShared, setIsShared] = useState(wallet?.is_shared ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeactivate, setShowDeactivate] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      setColor(TYPE_DEFAULT_COLOR[type]);
    }
  }, [type, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nama dompet wajib diisi."); return; }

    setError("");
    setLoading(true);

    if (isEdit) {
      const newBalance = parseFloat(currentBalance.replace(/\./g, "").replace(",", ".")) || 0;
      if (newBalance < 0) { setError("Saldo tidak boleh negatif."); setLoading(false); return; }

      const result = await updateWallet(wallet.id, {
        name: name.trim(),
        color,
        is_shared: isShared,
        current_balance: newBalance,
      });
      if (result.error) { setError(result.error); setLoading(false); return; }
    } else {
      const balance = parseFloat(initialBalance.replace(/\./g, "").replace(",", ".")) || 0;
      if (balance < 0) { setError("Saldo awal tidak boleh negatif."); setLoading(false); return; }

      const supabase = createClient();
      const { error: err } = await supabase.from("wallets").insert({
        household_id: householdId,
        name: name.trim(),
        type,
        initial_balance: balance,
        current_balance: balance,
        currency: "IDR",
        color,
        is_shared: isShared,
        created_by: userId,
      });
      if (err) { setError(err.message); setLoading(false); return; }
    }

    onSaved();
  }

  async function handleDeactivate() {
    if (!wallet) return;
    setLoading(true);
    const result = await deactivateWallet(wallet.id);
    if (result.error) { setError(result.error); setLoading(false); return; }
    onSaved();
  }

  function formatInput(val: string) {
    const digits = val.replace(/\D/g, "");
    return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-6">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Dompet" : "Tambah Dompet"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Nama */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Nama Dompet
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Rekening BCA, Dompet Tunai"
              maxLength={100}
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Saldo — edit: koreksi saldo saat ini | tambah: saldo awal */}
          {isEdit ? (
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
                Saldo Saat Ini
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={currentBalance === "0" ? "" : formatInput(currentBalance)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\./g, "");
                    setCurrentBalance(raw || "0");
                  }}
                  placeholder="0"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[var(--border)] text-sm font-financial font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              {parseFloat(currentBalance.replace(/\./g,"").replace(",",".")) > 0 && (
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Rp {formatRupiah(parseFloat(currentBalance.replace(/\./g,"").replace(",",".")))}
                </p>
              )}
              <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Ini koreksi manual — tidak mencatat transaksi baru
              </p>
            </div>
          ) : null}

          {/* Jenis — hanya saat tambah */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">
                Jenis Dompet
              </label>
              <div className="grid grid-cols-4 gap-2">
                {WALLET_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={[
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-colors",
                      type === t.value
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                    ].join(" ")}
                  >
                    <span className="text-xl">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saldo Awal — hanya saat tambah */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
                Saldo Awal
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialBalance === "0" ? "" : formatInput(initialBalance)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\./g, "");
                    setInitialBalance(raw || "0");
                  }}
                  placeholder="0"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          )}

          {/* Privasi Dompet */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Privasi Dompet</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setIsShared(true)}
                className={["flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-colors",
                  isShared ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40"
                ].join(" ")}>
                <span className="text-xl">👨‍👩‍👧‍👦</span>
                <span>Bersama</span>
                <span className="text-[10px] font-normal text-center leading-tight opacity-70">Semua anggota bisa lihat</span>
              </button>
              <button type="button" onClick={() => setIsShared(false)}
                className={["flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-colors",
                  !isShared ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40"
                ].join(" ")}>
                <span className="text-xl">🔒</span>
                <span>Pribadi</span>
                <span className="text-[10px] font-normal text-center leading-tight opacity-70">Hanya kamu & Super Admin</span>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-brand-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Dompet"}
            </button>
          </div>

          {/* Deactivate — hanya saat edit */}
          {isEdit && (
            <div className="border-t border-[var(--border)] pt-4">
              {!showDeactivate ? (
                <button
                  type="button"
                  onClick={() => setShowDeactivate(true)}
                  className="w-full text-xs text-danger hover:underline"
                >
                  Nonaktifkan dompet ini
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-danger font-medium">Nonaktifkan dompet?</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Dompet tidak akan muncul lagi, tapi riwayat transaksi tetap tersimpan.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeactivate(false)}
                      className="flex-1 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleDeactivate}
                      disabled={loading}
                      className="flex-1 py-2 text-xs rounded-lg bg-danger text-white font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {loading ? "..." : "Ya, Nonaktifkan"}
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
