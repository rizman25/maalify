"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, WalletType } from "@/types";
import WalletModal from "@/components/dompet/WalletModal";
import TransferModal from "@/components/dompet/TransferModal";
import { Toast, useToast } from "@/components/ui/Toast";
import type { TransferRecord } from "./page";
import { deleteWallet, deactivateWallet, activateWallet } from "@/app/actions/wallets";
import { WalletTypeIcon, Users, Lock, Building2, ArrowRightLeft } from "@/lib/icons";
import type { WalletType as IconWalletType } from "@/lib/icons";

const TYPE_LABEL: Record<WalletType, string> = {
  cash:        "Tunai",
  bank:        "Bank",
  savings:     "Tabungan",
  ewallet:     "E-Wallet",
  credit_card: "Kartu Kredit",
};

const TYPE_DEFAULT_COLOR: Record<WalletType, string> = {
  cash:        "#27AE60",
  bank:        "#1E3A5F",
  savings:     "#F59E0B",
  ewallet:     "#8B5CF6",
  credit_card: "#EF4444",
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
  const { toast, showToast, dismissToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Wallet | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [activating, setActivating] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalAset = wallets.reduce((sum, w) => sum + Number(w.current_balance), 0);
  const totalBersama = wallets.filter(w => w.is_shared).reduce((sum, w) => sum + Number(w.current_balance), 0);
  const totalPribadi = wallets.filter(w => !w.is_shared).reduce((sum, w) => sum + Number(w.current_balance), 0);
  const countBersama = wallets.filter(w => w.is_shared).length;
  const countPribadi = wallets.filter(w => !w.is_shared).length;

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
    const walletName = wallets.find(w => w.id === walletId)?.name ?? "Dompet";
    setActivating(walletId);
    const result = await deactivateWallet(walletId);
    setActivating(null);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(`"${walletName}" berhasil dinonaktifkan.`, "success");
      router.refresh();
    }
  }

  async function handleDelete(walletId: string) {
    const walletName = wallets.find(w => w.id === walletId)?.name ?? "Dompet";
    setDeleting(true);
    const result = await deleteWallet(walletId);
    setDeleting(false);
    setConfirmDelete(null);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(`"${walletName}" berhasil dihapus.`, "success");
      router.refresh();
    }
  }

  async function handleActivate(walletId: string) {
    const walletName = inactiveWallets.find(w => w.id === walletId)?.name ?? "Dompet";
    setActivating(walletId);
    const result = await activateWallet(walletId);
    setActivating(null);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(`"${walletName}" berhasil diaktifkan.`, "success");
      router.refresh();
    }
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
      <div className="bg-brand-primary rounded-xl p-5 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs opacity-60 uppercase tracking-widest font-medium">Total Aset</p>
            <p className="font-financial text-3xl font-bold mt-0.5">
              Rp {formatRupiah(totalAset)}
            </p>
          </div>
          <p className="text-xs opacity-50">{wallets.length} dompet aktif</p>
        </div>
        <div className="h-px bg-white/10 mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={14} className="opacity-75" />
              <p className="text-xs font-medium opacity-75">Aset Bersama</p>
            </div>
            <p className="font-financial text-lg font-bold">Rp {formatRupiah(totalBersama)}</p>
            <p className="text-[10px] opacity-50 mt-0.5">{countBersama} dompet</p>
          </div>
          <div className="border-l border-white/10 pl-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Lock size={14} className="opacity-75" />
              <p className="text-xs font-medium opacity-75">Aset Pribadi</p>
            </div>
            <p className="font-financial text-lg font-bold">Rp {formatRupiah(totalPribadi)}</p>
            <p className="text-[10px] opacity-50 mt-0.5">{countPribadi} dompet</p>
          </div>
        </div>
      </div>

      {/* Wallet Grid */}
      {wallets.length === 0 ? (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] px-6 py-14 text-center space-y-4">
          {/* Illustration */}
          <div className="w-20 h-20 mx-auto rounded-2xl bg-brand-primary/8 flex items-center justify-center text-brand-primary">
            <Building2 size={36} strokeWidth={1.5} />
          </div>

          <div className="space-y-1.5">
            <p className="text-base font-bold text-[var(--text-primary)]">
              Belum ada dompet
            </p>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
              {canManage
                ? "Tambahkan dompet pertama — tunai, bank, e-wallet, atau tabungan — untuk mulai mencatat keuangan keluarga."
                : "Belum ada dompet yang ditambahkan. Minta admin atau super admin keluarga untuk menambahkan dompet."}
            </p>
          </div>

          {canManage ? (
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
              <button
                onClick={openAdd}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Tambah Dompet Sekarang
              </button>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] rounded-xl px-4 py-3 max-w-xs mx-auto">
              Kamu tidak bisa menambah dompet karena role kamu adalah <strong>Member</strong>. Hubungi admin keluarga.
            </p>
          )}

          {/* Step hints untuk admin */}
          {canManage && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2 max-w-xl mx-auto">
              {(["cash","bank","ewallet","savings","credit_card"] as const).map(wType => (
                <button
                  key={wType}
                  onClick={openAdd}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-dashed border-[var(--border)] hover:border-brand-primary hover:bg-brand-primary/5 transition-colors group"
                >
                  <WalletTypeIcon type={wType} size={20} className="text-[var(--text-secondary)] group-hover:text-brand-primary transition-colors" />
                  <span className="text-xs text-[var(--text-secondary)] group-hover:text-brand-primary font-medium transition-colors">{TYPE_LABEL[wType]}</span>
                </button>
              ))}
            </div>
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
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      <WalletTypeIcon type={wallet.type as IconWalletType} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-[var(--text-primary)] leading-tight">
                          {wallet.name}
                        </p>
                        {!wallet.is_shared && (
                          <Lock size={11} className="text-[var(--text-secondary)]" title="Dompet pribadi" />
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
                          className="w-10 h-10 rounded-xl flex items-center justify-center grayscale text-[var(--text-secondary)]"
                          style={{ backgroundColor: color + "20" }}
                        >
                          <WalletTypeIcon type={wallet.type as IconWalletType} size={20} />
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
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]">
                    <ArrowRightLeft size={14} />
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}
