"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import type { ProjectItem } from "@/types";
import { payProjectItem } from "@/app/actions/projects";

interface Props {
  item: ProjectItem;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

function formatAmountInput(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
}

function parseAmount(val: string) {
  return parseInt(val.replace(/\./g, "").replace(/,/g, ""), 10) || 0;
}

export default function ProjectItemPayModal({ item, userId, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const prevPaid   = Number(item.actual_amount ?? 0);
  const remaining  = Number(item.planned_amount) - prevPaid;

  const [amount, setAmount]   = useState("");
  const [date, setDate]       = useState(today);
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const parsed    = parseAmount(amount);
  const afterPay  = prevPaid + parsed;
  const willLunas = parsed > 0 && afterPay >= Number(item.planned_amount);

  async function handleSave() {
    if (parsed <= 0) { setError("Jumlah harus lebih dari 0"); return; }
    if (parsed > remaining + 0.01) { setError(`Melebihi sisa tagihan (Rp ${formatRupiah(remaining)})`); return; }

    setLoading(true);
    setError("");
    const res = await payProjectItem({
      itemId: item.id,
      amount: parsed,
      date,
      note: note.trim() || null,
      userId,
    });

    if (res.error) { setError(res.error); setLoading(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Catat Pembayaran</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate max-w-[240px]">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Progress ringkasan */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Sudah dibayar</span>
              <span>Total tagihan</span>
            </div>
            <div className="flex justify-between font-financial font-semibold text-sm">
              <span className="text-warning">Rp {formatRupiah(prevPaid)}</span>
              <span className="text-[var(--text-primary)]">Rp {formatRupiah(item.planned_amount)}</span>
            </div>
            <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-warning transition-all duration-500"
                style={{ width: `${Math.min((prevPaid / Number(item.planned_amount)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Sisa: <span className="font-semibold text-[var(--text-primary)]">Rp {formatRupiah(remaining)}</span>
            </p>
          </div>

          {/* Jumlah */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Jumlah Pembayaran</label>
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(remaining))}
                  className="text-[10px] text-brand-primary hover:underline"
                >
                  Bayar lunas ({formatRupiah(remaining)})
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-3 focus-within:border-brand-primary transition-colors bg-[var(--bg-card)]">
              <span className="text-sm text-[var(--text-secondary)] font-medium flex-shrink-0">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(amount)}
                onChange={e => setAmount(e.target.value.replace(/\./g, ""))}
                placeholder="0"
                className="flex-1 bg-transparent text-[var(--text-primary)] font-financial text-lg font-semibold outline-none placeholder:text-[var(--text-secondary)]/40"
              />
            </div>

            {/* Preview setelah bayar */}
            {parsed > 0 && (
              <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                willLunas
                  ? "bg-success/5 border-success/20 text-success"
                  : "bg-brand-primary/5 border-brand-primary/20 text-brand-primary"
              }`}>
                <span>{willLunas ? "🎉 Item akan lunas" : "Sisa setelah bayar"}</span>
                <span className="font-financial font-bold">
                  {willLunas ? "Lunas" : `Rp ${formatRupiah(remaining - parsed)}`}
                </span>
              </div>
            )}
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal Pembayaran</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Catatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Catatan <span className="font-normal italic">(opsional — mis. "Termin 1", "Pelunasan")</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Termin 1"
              maxLength={100}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors placeholder:text-[var(--text-secondary)]/50"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-60 transition-colors">
            {loading ? "Menyimpan..." : willLunas ? "Bayar & Lunas" : "Catat Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
