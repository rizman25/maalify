"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
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

  const [name, setName] = useState(item?.name ?? "");
  const [plannedAmount, setPlannedAmount] = useState(isEdit ? String(item!.planned_amount) : "");
  const [isPaid, setIsPaid] = useState(item?.is_paid ?? false);
  const [actualAmount, setActualAmount] = useState(isEdit && item!.actual_amount != null ? String(item!.actual_amount) : "");
  const [paidAt, setPaidAt] = useState(item?.paid_at ?? today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  const parsedPlanned = parseAmount(plannedAmount);
  const parsedActual = parseAmount(actualAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nama item wajib diisi."); return; }
    if (parsedPlanned <= 0) { setError("Anggaran harus lebih dari 0."); return; }

    setError("");
    setLoading(true);
    const supabase = createClient();

    const payload = {
      name: name.trim(),
      planned_amount: parsedPlanned,
      is_paid: isPaid,
      actual_amount: isPaid && parsedActual > 0 ? parsedActual : null,
      paid_at: isPaid ? paidAt : null,
    };

    if (isEdit && item) {
      const { error: err } = await supabase
        .from("project_items")
        .update(payload)
        .eq("id", item.id);
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase.from("project_items").insert({
        ...payload,
        project_id: projectId,
        created_by: userId,
        sort_order: 0,
      });
      if (err) { setError(err.message); setLoading(false); return; }
    }

    onSaved();
  }

  async function handleDelete() {
    if (!item) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("project_items").delete().eq("id", item.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-8 pb-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
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

          {/* Is paid toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]">
            <button
              type="button"
              onClick={() => setIsPaid(!isPaid)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isPaid ? "bg-success" : "bg-[var(--border)]"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPaid ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {isPaid ? "Sudah dibayar" : "Belum dibayar"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Tandai jika item ini sudah terbayar</p>
            </div>
          </div>

          {/* Paid details */}
          {isPaid && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
                  Jumlah Aktual <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
                </label>
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
