"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, WalletType } from "@/types";
import WalletModal from "@/components/dompet/WalletModal";

const TYPE_LABEL: Record<WalletType, string> = {
  cash: "Tunai",
  bank: "Bank",
  savings: "Tabungan",
  ewallet: "E-Wallet",
};

const TYPE_ICON: Record<WalletType, string> = {
  cash: "💵",
  bank: "🏦",
  savings: "🏧",
  ewallet: "📱",
};

const TYPE_DEFAULT_COLOR: Record<WalletType, string> = {
  cash: "#27AE60",
  bank: "#1E3A5F",
  savings: "#F59E0B",
  ewallet: "#8B5CF6",
};

interface Props {
  wallets: Wallet[];
  inactiveWallets: Wallet[];
  householdId: string;
  userId: string;
}

export default function WalletPageClient({ wallets, inactiveWallets, householdId, userId }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Wallet | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);

  const totalAset = wallets.reduce((sum, w) => sum + Number(w.current_balance), 0);

  function openAdd() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(wallet: Wallet) {
    setEditTarget(wallet);
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditTarget(null);
  }

  function handleSaved() {
    handleClose();
    router.refresh();
  }

  async function handleActivate(walletId: string) {
    setActivating(walletId);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("wallets").update({ is_active: true }).eq("id", walletId);
    setActivating(null);
    router.refresh();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dompet</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Kelola dompet dan saldo keuangan keluarga
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Dompet
        </button>
      </div>

      {/* Total Aset */}
      <div className="bg-brand-primary rounded-xl p-6 text-white">
        <p className="text-sm opacity-75">Total Aset</p>
        <p className="font-financial text-3xl font-bold mt-1">
          Rp {formatRupiah(totalAset)}
        </p>
        <p className="text-xs opacity-60 mt-2">{wallets.length} dompet aktif</p>
      </div>

      {/* Wallet Grid */}
      {wallets.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-2xl">
            🏦
          </div>
          <p className="font-medium text-[var(--text-primary)]">Belum ada dompet</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Tambahkan dompet pertama untuk mulai mencatat keuangan
          </p>
          <button
            onClick={openAdd}
            className="mt-4 px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Tambah Dompet Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet) => {
            const color = wallet.color ?? TYPE_DEFAULT_COLOR[wallet.type];
            return (
              <div
                key={wallet.id}
                className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5 hover:shadow-md transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ backgroundColor: color + "20" }}
                    >
                      {TYPE_ICON[wallet.type]}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)] leading-tight">
                        {wallet.name}
                      </p>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: color + "15", color }}
                      >
                        {TYPE_LABEL[wallet.type]}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(wallet)}
                    className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                    title="Edit dompet"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>

                {/* Balance */}
                <div>
                  <p className="text-xs text-[var(--text-secondary)] mb-0.5">Saldo saat ini</p>
                  <p
                    className="font-financial text-xl font-bold"
                    style={{ color }}
                  >
                    Rp {formatRupiah(Number(wallet.current_balance))}
                  </p>
                </div>

                {/* Initial balance info */}
                {Number(wallet.initial_balance) > 0 && (
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Saldo awal: Rp {formatRupiah(Number(wallet.initial_balance))}
                  </p>
                )}
              </div>
            );
          })}

          {/* Add card */}
          <button
            onClick={openAdd}
            className="bg-[var(--bg-surface)] rounded-xl border-2 border-dashed border-[var(--border)] p-5 flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:border-brand-primary hover:text-brand-primary transition-colors min-h-[160px]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-sm font-medium">Tambah Dompet</span>
          </button>
        </div>
      )}

      {/* Dompet Nonaktif */}
      {inactiveWallets.length > 0 && (
        <section>
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform ${showInactive ? "rotate-90" : ""}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Dompet nonaktif ({inactiveWallets.length})
          </button>

          {showInactive && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveWallets.map((wallet) => {
                const color = wallet.color ?? TYPE_DEFAULT_COLOR[wallet.type];
                return (
                  <div
                    key={wallet.id}
                    className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5 opacity-60"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg grayscale"
                          style={{ backgroundColor: color + "20" }}
                        >
                          {TYPE_ICON[wallet.type]}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)] leading-tight">
                            {wallet.name}
                          </p>
                          <span className="text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded-full">
                            Nonaktif
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="font-financial text-lg font-bold text-[var(--text-secondary)]">
                      Rp {formatRupiah(Number(wallet.current_balance))}
                    </p>

                    <button
                      onClick={() => handleActivate(wallet.id)}
                      disabled={activating === wallet.id}
                      className="mt-3 w-full py-2 rounded-lg border border-brand-primary text-brand-primary text-xs font-medium hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50"
                    >
                      {activating === wallet.id ? "Mengaktifkan..." : "Aktifkan Kembali"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Modal */}
      {modalOpen && (
        <WalletModal
          wallet={editTarget}
          householdId={householdId}
          userId={userId}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
