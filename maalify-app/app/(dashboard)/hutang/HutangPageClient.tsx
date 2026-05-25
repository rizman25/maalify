"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRefresh } from "@/hooks/useRefresh";
import { formatRupiah } from "@/lib/utils";
import HutangModal from "@/components/hutang/HutangModal";
import BayarModal from "@/components/hutang/BayarModal";
import { Toast, useToast } from "@/components/ui/Toast";
import { TrendingDown, ArrowRightLeft } from "@/lib/icons";

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
  due_date: string | null;
  description: string | null;
  status: "active" | "settled" | "overdue";
  created_at: string;
  installment_months: number | null;
}

interface Payment {
  id: string;
  debt_id: string;
  amount: number;
  paid_at: string;
  note: string | null;
  wallets: { name: string } | null;
}

interface Props {
  debts: DebtItem[];
  wallets: Wallet[];
  payments: Payment[];
  householdId: string;
  userId: string;
}

type Tab = "payable" | "receivable";
type ModalState = { kind: "add" } | { kind: "edit"; debt: DebtItem } | { kind: "bayar"; debt: DebtItem } | null;

export default function HutangPageClient({ debts, wallets, payments, householdId, userId }: Props) {
  const router = useRouter();
  const { refresh } = useRefresh();
  const { toast, showToast, dismissToast } = useToast();
  const [tab, setTab] = useState<Tab>("payable");
  const [modal, setModal] = useState<ModalState>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  // Group payments by debt_id
  const paymentsByDebt = payments.reduce<Record<string, Payment[]>>((acc, p) => {
    if (!acc[p.debt_id]) acc[p.debt_id] = [];
    acc[p.debt_id].push(p);
    return acc;
  }, {});

  function toggleHistory(debtId: string) {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      next.has(debtId) ? next.delete(debtId) : next.add(debtId);
      return next;
    });
  }

  function formatPayDate(dateStr: string) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  const handleSaved = useCallback(() => {
    if (modal?.kind === "add") showToast("Hutang berhasil ditambahkan");
    else if (modal?.kind === "edit") showToast("Hutang berhasil diperbarui");
    else if (modal?.kind === "bayar") showToast("Pembayaran berhasil dicatat");
    setModal(null);
    refresh();
  }, [router, modal]);

  const filtered = debts.filter(d => d.type === tab);
  const active = filtered.filter(d => d.status !== "settled");
  const settled = filtered.filter(d => d.status === "settled");

  const totalPayable = debts.filter(d => d.type === "payable" && d.status !== "settled")
    .reduce((s, d) => s + d.remaining_amount, 0);
  const totalReceivable = debts.filter(d => d.type === "receivable" && d.status !== "settled")
    .reduce((s, d) => s + d.remaining_amount, 0);

  const today = new Date().toISOString().split("T")[0];
  const in5Days = new Date(); in5Days.setDate(in5Days.getDate() + 5);
  const in5DaysStr = in5Days.toISOString().split("T")[0];

  function getStatusBadge(d: DebtItem) {
    if (d.status === "settled") return { label: "Lunas", cls: "bg-green-100 text-green-700" };
    if (d.due_date && d.due_date < today) return { label: "Terlambat", cls: "bg-red-100 text-red-600" };
    if (d.due_date && d.due_date <= in5DaysStr) return { label: "Hampir jatuh tempo", cls: "bg-amber-100 text-amber-700" };
    return { label: "Aktif", cls: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]" };
  }

  function formatDueDate(due: string | null) {
    if (!due) return "Tanpa jatuh tempo";
    return new Date(due + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  }

  const pctPaid = (d: DebtItem) => {
    if (d.total_amount === 0) return 0;
    return Math.min(((d.total_amount - d.remaining_amount) / d.total_amount) * 100, 100);
  };

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Hutang & Piutang</h1>
            <p className="text-sm text-[var(--text-secondary)]">Kelola pinjam-meminjam</p>
          </div>
          <button
            onClick={() => setModal({ kind: "add" })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Catat
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Total Hutang</p>
            <p className="font-financial text-lg font-bold text-red-500">Rp {formatRupiah(totalPayable)}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
              {debts.filter(d => d.type === "payable" && d.status !== "settled").length} catatan aktif
            </p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-xs text-[var(--text-secondary)] mb-1">Total Piutang</p>
            <p className="font-financial text-lg font-bold text-blue-500">Rp {formatRupiah(totalReceivable)}</p>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
              {debts.filter(d => d.type === "receivable" && d.status !== "settled").length} catatan aktif
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-1 gap-1">
          {(["payable", "receivable"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {t === "payable" ? "Hutang" : "Piutang"}
              {tab !== t && debts.filter(d => d.type === t && d.status !== "settled").length > 0 && (
                <span className="ml-1.5 text-[10px] bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded-full">
                  {debts.filter(d => d.type === t && d.status !== "settled").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Active debts */}
        {active.length === 0 && settled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              {tab === "payable" ? <TrendingDown size={32} /> : <ArrowRightLeft size={32} />}
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Belum ada {tab === "payable" ? "hutang" : "piutang"}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Catat {tab === "payable" ? "hutang" : "piutang"} untuk melacaknya
              </p>
            </div>
            <button onClick={() => setModal({ kind: "add" })}
              className="px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90">
              Catat Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* All-done callout — active list empty but settled exists */}
            {active.length === 0 && settled.length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-green-50 border border-green-200">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Semua {tab === "payable" ? "hutang" : "piutang"} sudah lunas!
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">Riwayat tersimpan di bawah</p>
                </div>
              </div>
            )}
            {active.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-1">
                  Aktif ({active.length})
                </p>
                {active.map(d => {
                  const badge = getStatusBadge(d);
                  const paid = pctPaid(d);
                  return (
                    <div key={d.id} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[var(--text-primary)]">{d.party_name}</p>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                          {d.description && (
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{d.description}</p>
                          )}
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Jatuh tempo: {formatDueDate(d.due_date)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-financial font-bold text-base ${tab === "payable" ? "text-red-500" : "text-blue-500"}`}>
                            Rp {formatRupiah(d.remaining_amount)}
                          </p>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            dari Rp {formatRupiah(d.total_amount)}
                          </p>
                        </div>
                      </div>

                      {/* Installment info */}
                      {d.installment_months && d.installment_months > 0 && (() => {
                        const monthly = Math.ceil(d.total_amount / d.installment_months);
                        const paidAmt = d.total_amount - d.remaining_amount;
                        const paidInstallments = Math.floor(paidAmt / monthly);
                        const remainingInstallments = Math.max(0, d.installment_months - paidInstallments);
                        return (
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-elevated)]">
                            <div className="flex-1">
                              <p className="text-[10px] text-[var(--text-secondary)]">Cicilan per bulan</p>
                              <p className="font-financial font-semibold text-sm text-[var(--text-primary)]">
                                Rp {formatRupiah(monthly)}
                              </p>
                            </div>
                            <div className="w-px h-8 bg-[var(--border)]" />
                            <div className="flex-1">
                              <p className="text-[10px] text-[var(--text-secondary)]">Sisa cicilan</p>
                              <p className="font-semibold text-sm text-[var(--text-primary)]">
                                {remainingInstallments} <span className="font-normal text-[var(--text-secondary)]">/ {d.installment_months} bulan</span>
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Progress */}
                      {d.total_amount !== d.remaining_amount && (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand-accent"
                              style={{ width: `${paid}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            Sudah dibayar {paid.toFixed(0)}% · Rp {formatRupiah(d.total_amount - d.remaining_amount)}
                          </p>
                        </div>
                      )}

                      {/* Riwayat Pembayaran */}
                      {(() => {
                        const debtPayments = paymentsByDebt[d.id] ?? [];
                        if (debtPayments.length === 0) return null;
                        const isOpen = expandedHistory.has(d.id);
                        return (
                          <div className="border-t border-[var(--border)] pt-2.5">
                            <button
                              type="button"
                              onClick={() => toggleHistory(d.id)}
                              className="w-full flex items-center justify-between text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-0.5"
                            >
                              <span className="font-medium">Riwayat Pembayaran ({debtPayments.length})</span>
                              <svg
                                width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                            {isOpen && (
                              <div className="mt-2 space-y-1.5">
                                {debtPayments.map((p) => (
                                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-elevated)]">
                                    {/* Wallet icon */}
                                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                        {p.wallets?.name ?? "—"}
                                      </p>
                                      {p.note && (
                                        <p className="text-[10px] text-[var(--text-secondary)] truncate">{p.note}</p>
                                      )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="font-financial text-xs font-semibold text-brand-accent">
                                        +Rp {formatRupiah(p.amount)}
                                      </p>
                                      <p className="text-[10px] text-[var(--text-secondary)]">{formatPayDate(p.paid_at)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => setModal({ kind: "bayar", debt: d })}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                            tab === "payable"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                        >
                          {tab === "payable" ? "Bayar" : "Terima"}
                        </button>
                        <button
                          onClick={() => setModal({ kind: "edit", debt: d })}
                          className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Settled */}
            {settled.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-1">
                  Lunas ({settled.length})
                </p>
                {settled.map(d => {
                  const debtPayments = paymentsByDebt[d.id] ?? [];
                  const isOpen = expandedHistory.has(d.id);
                  return (
                    <div key={d.id} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4 opacity-70 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--text-primary)] text-sm">{d.party_name}</p>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Lunas</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {formatDueDate(d.due_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-financial font-semibold text-sm text-[var(--text-secondary)] line-through">
                            Rp {formatRupiah(d.total_amount)}
                          </p>
                        </div>
                      </div>
                      {debtPayments.length > 0 && (
                        <div className="border-t border-[var(--border)] pt-2">
                          <button
                            type="button"
                            onClick={() => toggleHistory(d.id)}
                            className="w-full flex items-center justify-between text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-0.5"
                          >
                            <span className="font-medium">Riwayat ({debtPayments.length})</span>
                            <svg
                              width="14" height="14" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="mt-2 space-y-1.5">
                              {debtPayments.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-elevated)]">
                                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                                      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                                      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                      {p.wallets?.name ?? "—"}
                                    </p>
                                    {p.note && (
                                      <p className="text-[10px] text-[var(--text-secondary)] truncate">{p.note}</p>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="font-financial text-xs font-semibold text-brand-accent">
                                      +Rp {formatRupiah(p.amount)}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-secondary)]">{formatPayDate(p.paid_at)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.kind === "add" && (
        <HutangModal mode="add" householdId={householdId} userId={userId}
          onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.kind === "edit" && (
        <HutangModal mode="edit" debt={modal.debt} householdId={householdId} userId={userId}
          onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.kind === "bayar" && (
        <BayarModal debt={modal.debt} wallets={wallets} userId={userId}
          onClose={() => setModal(null)} onSaved={handleSaved} />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}
