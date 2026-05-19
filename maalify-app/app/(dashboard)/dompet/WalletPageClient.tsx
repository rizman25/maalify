"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, WalletType } from "@/types";
import WalletModal from "@/components/dompet/WalletModal";
import TransferModal from "@/components/dompet/TransferModal";
import type { TransferRecord } from "./page";

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
  transfers: TransferRecord[];
  householdId: string;
  userId: string;
  userRole: "super_admin" | "admin" | "member";
}

export default function WalletPageClient({ wallets, inactiveWallets, transfers, householdId, userId, userRole }: Props) {
  const canManage = userRole !== "member";
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Wallet | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDeactivate(walletId: string) {
    setActivating(walletId);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("wallets").update({ is_active: false }).eq("id", walletId);
    setActivating(null);
    router.refresh();
  }

  async function handleDelete(walletId: string) {
    setDeleting(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.from("wallets").delete().eq("id", walletId);
    setDeleting(false);
    setConfirmDelete(null);
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
    <div className="max-w-4xl mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dompet</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Kelola dompet dan saldo keuangan keluarga
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && wallets.length >= 2 && (
            <button
              onClick={() => setTransferOpen(true)}
              className="flex items-center gap-2 px-3 py-2.5 border border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8L22 12L18 16"/><path d="M6 12H22"/><path d="M6 8L2 12L6 16"/><path d="M2 12H18" style={{display:"none"}}/>
                <line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="15" x2="22" y2="15"/>
                <polyline points="16 3 22 9 16 15"/><polyline points="8 21 2 15 8 9"/>
              </svg>
              Transfer
            </button>
          )}
          {canManage && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Dompet
            </button>
          )}
        </div>
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
          {canManage && (
            <button
              onClick={openAdd}
              className="mt-4 px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Tambah Dompet Pertama
            </button>
          )}
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
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-[var(--text-primary)] leading-tight">
                          {wallet.name}
                        </p>
                        {!wallet.is_shared && (
                          <span className="text-[10px] text-[var(--text-secondary)]" title="Dompet pribadi">🔒</span>
                        )}
                      </div>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: color + "15", color }}
                      >
                        {TYPE_LABEL[wallet.type]}
                      </span>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(wallet)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                        title="Edit dompet"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDelete(wallet.id)}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-red-50 hover:text-danger transition-colors"
                        title="Hapus dompet"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  )}
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

                {/* Confirm delete inline */}
                {canManage && confirmDelete === wallet.id && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
                    <p className="text-xs font-medium text-danger">Hapus dompet ini?</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">Transaksi yang sudah ada tidak ikut terhapus.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="flex-1 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleDelete(wallet.id)}
                        disabled={deleting}
                        className="flex-1 py-1.5 text-xs rounded-lg bg-danger text-white font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        {deleting ? "..." : "Ya, Hapus"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Deactivate button */}
                {canManage && confirmDelete !== wallet.id && (
                  <button
                    onClick={() => handleDeactivate(wallet.id)}
                    disabled={activating === wallet.id}
                    className="mt-3 w-full py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--bg-elevated)] transition-colors disabled:opacity-50"
                  >
                    {activating === wallet.id ? "..." : "Nonaktifkan"}
                  </button>
                )}
              </div>
            );
          })}

          {/* Add card */}
          {canManage && (
            <button
              onClick={openAdd}
              className="bg-[var(--bg-surface)] rounded-xl border-2 border-dashed border-[var(--border)] p-5 flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)] hover:border-brand-primary hover:text-brand-primary transition-colors min-h-[160px]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="text-sm font-medium">Tambah Dompet</span>
            </button>
          )}
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

                    {canManage && (confirmDelete === wallet.id ? (
                      <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
                        <p className="text-xs font-medium text-danger">Hapus dompet ini?</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">Transaksi yang sudah ada tidak ikut terhapus.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">Batal</button>
                          <button onClick={() => handleDelete(wallet.id)} disabled={deleting} className="flex-1 py-1.5 text-xs rounded-lg bg-danger text-white font-medium hover:opacity-90 disabled:opacity-50">
                            {deleting ? "..." : "Ya, Hapus"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => handleActivate(wallet.id)}
                          disabled={activating === wallet.id}
                          className="flex-1 py-2 rounded-lg border border-brand-primary text-brand-primary text-xs font-medium hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50"
                        >
                          {activating === wallet.id ? "..." : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(wallet.id)}
                          className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-danger hover:border-red-200 transition-colors"
                          title="Hapus dompet"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Riwayat Transfer */}
      {transfers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Riwayat Transfer</h2>
            <span className="text-xs text-[var(--text-secondary)]">15 terakhir</span>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)]">
            {transfers.map((t) => {
              const from = Array.isArray(t.from_wallet) ? t.from_wallet[0] : t.from_wallet;
              const to = Array.isArray(t.to_wallet) ? t.to_wallet[0] : t.to_wallet;
              const dateStr = new Date(t.date + "T00:00:00").toLocaleDateString("id-ID", {
                day: "numeric", month: "short", year: "numeric",
              });
              return (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 text-sm">
                    ↔️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {from?.name ?? "?"} → {to?.name ?? "?"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {dateStr}{t.description ? ` · ${t.description}` : ""}
                    </p>
                  </div>
                  <p className="font-financial text-sm font-semibold text-[var(--text-secondary)] flex-shrink-0">
                    Rp {formatRupiah(Number(t.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modals */}
      {modalOpen && (
        <WalletModal
          wallet={editTarget}
          householdId={householdId}
          userId={userId}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
      {transferOpen && (
        <TransferModal
          wallets={wallets}
          householdId={householdId}
          userId={userId}
          onClose={() => setTransferOpen(false)}
          onSaved={() => { setTransferOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
