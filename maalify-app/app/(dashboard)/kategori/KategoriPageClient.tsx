"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import KategoriModal from "@/components/pengaturan/KategoriModal";
import { Toast, useToast } from "@/components/ui/Toast";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
  is_default: boolean;
  household_id: string | null;
}

interface Props {
  categories: Category[];
  householdId: string;
  userRole: "super_admin" | "admin" | "member";
}

type Filter = "all" | "expense" | "income";

export default function KategoriPageClient({ categories: initialCategories, householdId, userRole }: Props) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState<{ mode: "add" | "edit"; cat?: Category } | null>(null);

  const canManage = userRole === "admin" || userRole === "super_admin";

  const handleSaved = useCallback(() => {
    if (modal?.mode === "add") showToast("Kategori berhasil ditambahkan");
    else if (modal?.mode === "edit") showToast("Kategori berhasil diperbarui");
    setModal(null);
    router.refresh();
  }, [router, modal]);

  const filtered = categories.filter(c =>
    filter === "all" ? true : c.type === filter
  );

  const defaults = filtered.filter(c => c.is_default);
  const customs  = filtered.filter(c => !c.is_default);
  const totalCustom = categories.filter(c => !c.is_default).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kategori</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {canManage
              ? "Kelola kategori default dan buat kategori khusus"
              : "Daftar kategori yang tersedia untuk transaksi"}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setModal({ mode: "add" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Kategori
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Kategori",  value: categories.length,                        color: "text-[var(--text-primary)]" },
          { label: "Kategori Custom", value: totalCustom,                              color: "text-brand-primary" },
          { label: "Pengeluaran",     value: categories.filter(c => c.type === "expense").length, color: "text-danger" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "expense", "income"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? "bg-brand-primary text-white"
                : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {f === "all" ? "Semua" : f === "expense" ? "Pengeluaran" : "Pemasukan"}
          </button>
        ))}
      </div>

      {/* Custom categories */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <p className="text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
            Kategori Custom ({totalCustom})
          </p>
          {canManage && (
            <button
              onClick={() => setModal({ mode: "add" })}
              className="text-xs text-brand-primary hover:underline font-medium"
            >
              + Tambah
            </button>
          )}
        </div>

        {customs.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center text-2xl mx-auto mb-3">🏷️</div>
            <p className="text-sm text-[var(--text-secondary)]">Belum ada kategori custom</p>
            {canManage && (
              <button
                onClick={() => setModal({ mode: "add" })}
                className="text-xs text-brand-primary hover:underline mt-1.5 inline-block font-medium"
              >
                + Buat kategori pertama
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {customs.map(c => (
              <div
                key={c.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${canManage ? "hover:bg-[var(--bg-elevated)] cursor-pointer" : ""} transition-colors`}
                onClick={() => canManage && setModal({ mode: "edit", cat: c })}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: (c.color ?? "#94A3B8") + "20" }}
                >
                  {c.icon ?? "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Kategori custom</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  c.type === "expense" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                }`}>
                  {c.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                </span>
                {canManage && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] flex-shrink-0 ml-1">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default categories */}
      <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <p className="text-xs font-bold text-[var(--text-secondary)] tracking-widest uppercase">
            Kategori Default ({categories.filter(c => c.is_default).length})
          </p>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {defaults.length === 0 ? (
            <div className="py-6 text-center text-sm text-[var(--text-secondary)]">Tidak ada hasil</div>
          ) : (
            defaults.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: (c.color ?? "#94A3B8") + "20" }}
                >
                  {c.icon ?? "💰"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{c.name}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Bawaan sistem</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  c.type === "expense" ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                }`}>
                  {c.type === "expense" ? "Pengeluaran" : "Pemasukan"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {modal && (
        <KategoriModal
          mode={modal.mode}
          category={modal.cat}
          householdId={householdId}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}
