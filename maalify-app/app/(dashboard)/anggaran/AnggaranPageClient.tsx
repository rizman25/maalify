"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import AnggaranModal from "@/components/anggaran/AnggaranModal";
import { Toast, useToast } from "@/components/ui/Toast";
import { CategoryIcon } from "@/lib/icons";
import { Coins, AlertCircle, RefreshCw } from "@/lib/icons";

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
  isPrivate: boolean;
}

interface Props {
  budgets: BudgetItem[];
  availableCategories: Category[];
  allCategories: Category[];
  householdId: string;
  userId: string;
  month: number;
  year: number;
  userRole: "super_admin" | "admin" | "member";
}

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export default function AnggaranPageClient({
  budgets, availableCategories, allCategories, householdId, userId, month, year, userRole,
}: Props) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const canManage = userRole !== "member";
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editBudget, setEditBudget] = useState<BudgetItem | undefined>();

  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  function navigate(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    router.push(`/anggaran?month=${m}&year=${y}`);
  }

  const handleSaved = useCallback(() => {
    if (modalMode === "add") showToast("Anggaran berhasil ditambahkan");
    else if (modalMode === "edit") showToast("Anggaran berhasil diperbarui");
    setModalMode(null);
    setEditBudget(undefined);
    router.refresh();
  }, [router, modalMode]);

  function openEdit(b: BudgetItem) {
    setEditBudget(b);
    setModalMode("edit");
  }

  const overBudgetCount = budgets.filter(b => b.spent > b.budget).length;

  return (
    <div className="min-h-full">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Anggaran</h1>
            <p className="text-sm text-[var(--text-secondary)]">Kelola batas pengeluaran bulanan</p>
          </div>
          {canManage && (
            <button
              onClick={() => setModalMode("add")}
              disabled={availableCategories.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tambah
            </button>
          )}
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between bg-[var(--bg-surface)] rounded-xl px-4 py-3 border border-[var(--border)]">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="text-center">
            <p className="font-semibold text-[var(--text-primary)]">{MONTHS[month - 1]}</p>
            <p className="text-xs text-[var(--text-secondary)]">{year}</p>
          </div>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Summary card */}
        {budgets.length > 0 && (
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Total Anggaran</span>
              <span className="font-financial font-bold text-[var(--text-primary)]">Rp {formatRupiah(totalBudget)}</span>
            </div>

            {/* Overall progress bar */}
            <div className="space-y-1">
              <div className="w-full h-2.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                {totalBudget > 0 && (
                  <div
                    className={`h-full rounded-full transition-all ${totalSpent > totalBudget ? "bg-[var(--color-danger)]" : "bg-brand-accent"}`}
                    style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Terpakai: Rp {formatRupiah(totalSpent)}</span>
                <span className={totalRemaining < 0 ? "text-[var(--color-danger)] font-medium" : ""}>
                  {totalRemaining < 0 ? `Melebihi Rp ${formatRupiah(Math.abs(totalRemaining))}` : `Sisa: Rp ${formatRupiah(totalRemaining)}`}
                </span>
              </div>
            </div>

            {overBudgetCount > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{overBudgetCount} kategori melebihi anggaran</p>
              </div>
            )}
          </div>
        )}

        {/* Budget list */}
        {budgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Coins size={32} />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Belum ada anggaran</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Tambah anggaran untuk mengontrol pengeluaran bulan ini</p>
            </div>
            {canManage && (
              <button
                onClick={() => setModalMode("add")}
                disabled={availableCategories.length === 0}
                className="px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50"
              >
                Tambah Anggaran Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-1">
              Per Kategori ({budgets.length})
            </p>
            {budgets.map((b) => {
              const pct = b.budget > 0 ? Math.min((b.spent / b.budget) * 100, 100) : 0;
              const over = b.spent > b.budget;
              const remaining = b.budget - b.spent;

              return (
                <button
                  key={b.id}
                  onClick={() => canManage && openEdit(b)}
                  className={`w-full bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4 text-left transition-all space-y-3 ${canManage ? "hover:border-brand-primary/30 hover:shadow-sm cursor-pointer" : "cursor-default"}`}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${b.color}20`, color: b.color }}
                      >
                        <CategoryIcon slug={b.icon} size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-[var(--text-primary)] text-sm">
                            {b.customName ?? b.name}
                          </p>
                          {b.isRecurring && (
                            <span className="text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 flex items-center">
                              <RefreshCw size={9} />
                            </span>
                          )}
                          {b.isPrivate && (
                            <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 flex items-center gap-0.5">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                              Pribadi
                            </span>
                          )}
                        </div>
                        {b.customName && (
                          <p className="text-[10px] text-[var(--text-secondary)]">{b.name}</p>
                        )}
                        <p className="text-xs text-[var(--text-secondary)]">
                          Rp {formatRupiah(b.spent)} / Rp {formatRupiah(b.budget)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {over ? (
                        <span className="text-xs font-medium text-[var(--color-danger)] bg-red-50 px-2 py-1 rounded-full">
                          +Rp {formatRupiah(b.spent - b.budget)}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-secondary)]">
                          Sisa Rp {formatRupiah(remaining)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? "var(--color-danger)" : b.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                      <span>{pct.toFixed(0)}% terpakai</span>
                      {over && <span className="text-[var(--color-danger)] font-medium">Melebihi batas!</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Unbudgeted categories */}
        {availableCategories.length > 0 && budgets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-1">
              Belum Dianggarkan ({availableCategories.length})
            </p>
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border)]">
              {availableCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-secondary)]"><CategoryIcon slug={cat.icon} size={16} /></span>
                    <span className="text-sm text-[var(--text-secondary)]">{cat.name}</span>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => {
                        setEditBudget(undefined);
                        setModalMode("add");
                      }}
                      className="text-xs text-brand-primary font-medium hover:underline"
                    >
                      + Tambah
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <AnggaranModal
          mode={modalMode}
          budget={editBudget}
          availableCategories={availableCategories}
          allCategories={allCategories}
          householdId={householdId}
          userId={userId}
          month={month}
          year={year}
          onClose={() => { setModalMode(null); setEditBudget(undefined); }}
          onSaved={handleSaved}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}
