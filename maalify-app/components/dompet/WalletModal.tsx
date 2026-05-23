"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Wallet, WalletType } from "@/types";
import { updateWallet, deactivateWallet, getWalletHistory } from "@/app/actions/wallets";
import { formatRupiah } from "@/lib/utils";
import { WalletTypeIcon, Users, Lock } from "@/lib/icons";
import type { WalletType as IconWalletType } from "@/lib/icons";

const WALLET_TYPES: { value: WalletType; label: string }[] = [
  { value: "cash",    label: "Tunai"    },
  { value: "bank",    label: "Bank"     },
  { value: "savings", label: "Tabungan" },
  { value: "ewallet", label: "E-Wallet" },
];

const TYPE_DEFAULT_COLOR: Record<WalletType, string> = {
  cash:    "#27AE60",
  bank:    "#1E3A5F",
  savings: "#F59E0B",
  ewallet: "#8B5CF6",
};

type HistoryItem = {
  id: string;
  old_balance: number;
  new_balance: number;
  reason: string | null;
  edited_at: string;
  users: { name: string } | null;
};

interface Props {
  wallet: Wallet | null;
  householdId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function WalletModal({ wallet, householdId, userId, onClose, onSaved }: Props) {
  const isEdit = wallet !== null;

  const [name, setName] = useState(wallet?.name ?? "");
  const [type, setType] = useState<WalletType>(wallet?.type ?? "cash");
  const [initialBalance, setInitialBalance] = useState(isEdit ? String(wallet.initial_balance) : "0");
  const [currentBalance, setCurrentBalance] = useState(isEdit ? String(wallet.current_balance) : "0");
  const [color, setColor] = useState(TYPE_DEFAULT_COLOR[wallet?.type ?? "cash"]);
  const [isShared, setIsShared] = useState(wallet?.is_shared ?? true);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) setColor(TYPE_DEFAULT_COLOR[type]);
  }, [type, isEdit]);

  async function loadHistory() {
    if (!wallet) return;
    setHistoryLoading(true);
    const result = await getWalletHistory(wallet.id);
    setHistoryLoading(false);
    if (result.data) setHistory(result.data as HistoryItem[]);
  }

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
        old_balance: Number(wallet.current_balance),
        reason: reason || undefined,
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Dompet" : "Tambah Dompet"}
          </h2>
          <div className="flex items-center gap-2">
            {/* History toggle — only in edit mode */}
            {isEdit && (
              <button
                type="button"
                onClick={() => {
                  const next = !showHistory;
                  setShowHistory(next);
                  if (next && history.length === 0) loadHistory();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  showHistory
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                Riwayat
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* ── History panel ── */}
          {isEdit && showHistory && (
            <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] space-y-3">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Riwayat Perubahan</p>
              {historyLoading && (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4">Memuat...</p>
              )}
              {!historyLoading && history.length === 0 && (
                <p className="text-xs text-[var(--text-secondary)] text-center py-4 italic">Belum ada riwayat perubahan</p>
              )}
              {!historyLoading && history.map(h => {
                const diff = h.new_balance - h.old_balance;
                return (
                  <div key={h.id} className="bg-[var(--bg-surface)] rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">{fmtDt(h.edited_at)}</span>
                      <span className={`text-xs font-semibold font-financial ${diff > 0 ? "text-success" : diff < 0 ? "text-danger" : "text-[var(--text-secondary)]"}`}>
                        {diff > 0 ? "+" : diff < 0 ? "-" : ""}Rp {formatRupiah(Math.abs(diff))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                      <span className="font-financial">Rp {formatRupiah(h.old_balance)}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      <span className="font-financial">Rp {formatRupiah(h.new_balance)}</span>
                      {h.users?.name && <span className="ml-1 text-[var(--text-secondary)]">· {h.users.name}</span>}
                    </div>
                    {h.reason && (
                      <p className="text-[11px] text-[var(--text-secondary)] italic bg-[var(--bg-elevated)] rounded-lg px-2.5 py-1.5">
                        "{h.reason}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Nama */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Nama Dompet</label>
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

            {/* Saldo saat ini — edit mode */}
            {isEdit && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Saldo Saat Ini</label>
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
            )}

            {/* Keterangan (reason) — edit mode */}
            {isEdit && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
                  Keterangan perubahan <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="cth. Koreksi saldo setelah cek fisik, Tambah uang dari gajian..."
                  maxLength={200}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            )}

            {/* Jenis — tambah mode */}
            {!isEdit && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Jenis Dompet</label>
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
                      <WalletTypeIcon type={t.value as IconWalletType} size={20} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Saldo Awal — tambah mode */}
            {!isEdit && (
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Saldo Awal</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
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
                  <Users size={20} />
                  <span>Bersama</span>
                  <span className="text-[10px] font-normal text-center leading-tight opacity-70">Semua anggota bisa lihat</span>
                </button>
                <button type="button" onClick={() => setIsShared(false)}
                  className={["flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-colors",
                    !isShared ? "border-brand-primary bg-brand-primary/5 text-brand-primary" : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40"
                  ].join(" ")}>
                  <Lock size={20} />
                  <span>Pribadi</span>
                  <span className="text-[10px] font-normal text-center leading-tight opacity-70">Hanya kamu & Super Admin</span>
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

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

            {/* Deactivate */}
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
                    <p className="text-xs text-[var(--text-secondary)]">Dompet tidak akan muncul lagi, tapi riwayat transaksi tetap tersimpan.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowDeactivate(false)}
                        className="flex-1 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
                        Batal
                      </button>
                      <button type="button" onClick={handleDeactivate} disabled={loading}
                        className="flex-1 py-2 text-xs rounded-lg bg-danger text-white font-medium hover:opacity-90 disabled:opacity-50">
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
