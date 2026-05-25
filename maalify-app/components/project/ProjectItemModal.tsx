"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { saveProjectItem, deleteProjectItem } from "@/app/actions/projects";
import type { ProjectItem } from "@/types";

interface Props {
  projectId: string;
  item?: ProjectItem;
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

export default function ProjectItemModal({ projectId, item, userId, onClose, onSaved }: Props) {
  const isEdit = !!item;
  const today = new Date().toISOString().split("T")[0];

  // Derive initial payStatus from existing data
  function getInitialPayStatus() {
    if (!item?.is_paid) return "unpaid";
    if (item.actual_amount != null && item.actual_amount < item.planned_amount) return "dp";
    return "paid";
  }

  const [name, setName] = useState(item?.name ?? "");
  const [plannedAmount, setPlannedAmount] = useState(isEdit ? String(item!.planned_amount) : "");
  const [payStatus, setPayStatus] = useState<"unpaid" | "dp" | "paid">(getInitialPayStatus);
  const [actualAmount, setActualAmount] = useState(isEdit && item!.actual_amount != null ? String(item!.actual_amount) : "");
  const [paidAt, setPaidAt] = useState(item?.paid_at ?? today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const isPaid = payStatus !== "unpaid";
  const parsedPlanned = parseAmount(plannedAmount);
  const parsedActual = parseAmount(actualAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nama item wajib diisi."); return; }
    if (parsedPlanned <= 0) { setError("Anggaran harus lebih dari 0."); return; }

    setError("");
    setLoading(true);

    const result = await saveProjectItem({
      projectId,
      itemId: isEdit ? item!.id : undefined,
      name: name.trim(),
      plannedAmount: parsedPlanned,
      // DP state: is_paid=true but actual < planned (convention: shows in DP section)
      isPaid: payStatus !== "unpaid",
      actualAmount: payStatus !== "unpaid" && parsedActual > 0 ? parsedActual : null,
      paidAt: payStatus !== "unpaid" ? paidAt : null,
      userId,
    });

    if (result.error) { setError(result.error); setLoading(false); return; }
    onSaved();
  }

  async function handleDelete() {
    if (!item) return;
    setLoading(true);
    const result = await deleteProjectItem(item.id);
    if (result.error) { setError(result.error); setLoading(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-6">
      <div className="absolute inset-0 bg-black/40" style={{backdropFilter:"none",WebkitBackdropFilter:"none"}} onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-sm max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Item" : "Tambah Item Anggaran"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Nama Item</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Tiket pesawat PP"
              maxLength={150}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Anggaran rencana */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Anggaran Rencana</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(plannedAmount)}
                onChange={(e) => setPlannedAmount(e.target.value.replace(/\./g, ""))}
                placeholder="0"
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            {parsedPlanned > 0 && (
              <p className="text-xs text-[var(--text-secondary)] mt-1">Rp {formatRupiah(parsedPlanned)}</p>
            )}
          </div>

          {/* Payment status — 3 state */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[var(--text-primary)]">Status Pembayaran</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["unpaid", "dp", "paid"] as const).map(s => {
                const labels = { unpaid: "Belum Bayar", dp: "DP / Sebagian", paid: "Lunas" };
                const active = payStatus === s;
                const cls = active
                  ? s === "unpaid" ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] border-brand-primary ring-1 ring-brand-primary"
                  : s === "dp"     ? "bg-warning/10 text-warning border-warning ring-1 ring-warning"
                  :                  "bg-success/10 text-success border-success ring-1 ring-success"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--text-secondary)]";
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setPayStatus(s); if (s === "unpaid") setActualAmount(""); }}
                    className={`py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${cls}`}
                  >
                    {labels[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* DP details */}
          {payStatus === "dp" && (
            <div className="space-y-3 p-3 rounded-xl bg-warning/5 border border-warning/20">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[var(--text-primary)]">Jumlah DP Dibayar</label>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatAmountInput(actualAmount)}
                    onChange={(e) => setActualAmount(e.target.value.replace(/\./g, ""))}
                    placeholder="0"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial focus:outline-none focus:ring-2 focus:ring-warning"
                  />
                </div>
                {parsedActual > 0 && parsedPlanned > 0 && (
                  <p className="text-xs mt-1 text-warning">
                    Sisa Rp {formatRupiah(Math.max(0, parsedPlanned - parsedActual))} belum dibayar
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Tanggal DP</label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-warning"
                />
              </div>
            </div>
          )}

          {/* Paid (Lunas) details */}
          {payStatus === "paid" && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-[var(--text-primary)]">
                    Jumlah Dibayar <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
                  </label>
                  {parsedPlanned > 0 && (
                    <button
                      type="button"
                      onClick={() => setActualAmount(plannedAmount)}
                      className="text-[10px] font-semibold text-brand-primary bg-brand-primary/8 hover:bg-brand-primary/15 px-2 py-1 rounded-lg transition-colors"
                    >
                      Sesuai Rencana
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatAmountInput(actualAmount)}
                    onChange={(e) => setActualAmount(e.target.value.replace(/\./g, ""))}
                    placeholder={formatAmountInput(plannedAmount) || "0"}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                {parsedActual > 0 && parsedPlanned > 0 && parsedActual !== parsedPlanned && (
                  <p className={`text-xs mt-1 ${parsedActual > parsedPlanned ? "text-danger" : "text-success"}`}>
                    {parsedActual > parsedPlanned ? "+" : ""}{formatRupiah(parsedActual - parsedPlanned)} dari rencana
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Tanggal Bayar</label>
                <input
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {loading ? "Menyimpan..." : isEdit ? "Simpan" : "Tambah"}
            </button>
          </div>

          {isEdit && (
            <div className="border-t border-[var(--border)] pt-4">
              {!showDelete ? (
                <button type="button" onClick={() => setShowDelete(true)} className="w-full text-xs text-danger hover:underline">
                  Hapus item ini
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-3 space-y-3">
                  <p className="text-sm text-danger font-medium">Hapus item?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDelete(false)} className="flex-1 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">Batal</button>
                    <button type="button" onClick={handleDelete} disabled={loading} className="flex-1 py-2 text-xs rounded-lg bg-danger text-white font-medium hover:opacity-90 disabled:opacity-50">
                      {loading ? "..." : "Ya, Hapus"}
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
