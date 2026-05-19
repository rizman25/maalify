"use client";

import { useState } from "react";

interface Props {
  householdId: string;
  onClose: () => void;
}

type TxType = "all" | "income" | "expense";

function downloadCSV(rows: string[][], filename: string) {
  const content = rows
    .map(r => r.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportModal({ householdId, onClose }: Props) {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today = now.toISOString().split("T")[0];

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [txType, setTxType] = useState<TxType>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    if (!from || !to || from > to) {
      setError("Rentang tanggal tidak valid.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      let query = supabase
        .from("transactions")
        .select("date, type, amount, description, categories(name), wallets(name), users(name)")
        .eq("household_id", householdId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (txType !== "all") {
        query = query.eq("type", txType);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      type Row = {
        date: string;
        type: string;
        amount: number;
        description: string;
        categories: { name: string } | { name: string }[] | null;
        wallets: { name: string } | { name: string }[] | null;
        users: { name: string } | { name: string }[] | null;
      };

      const rows = (data ?? []) as unknown as Row[];

      const header = ["Tanggal", "Tipe", "Jumlah", "Kategori", "Dompet", "Keterangan", "Dibuat Oleh"];
      const body = rows.map(r => {
        const cat = Array.isArray(r.categories) ? r.categories[0] : r.categories;
        const wallet = Array.isArray(r.wallets) ? r.wallets[0] : r.wallets;
        const user = Array.isArray(r.users) ? r.users[0] : r.users;
        return [
          r.date,
          r.type === "income" ? "Pemasukan" : "Pengeluaran",
          String(r.amount),
          cat?.name ?? "-",
          wallet?.name ?? "-",
          r.description,
          user?.name ?? "-",
        ];
      });

      const filename = `transaksi_${from}_sd_${to}.csv`;
      downloadCSV([header, ...body], filename);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengekspor data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Export Transaksi</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Type filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Tipe</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "all" as TxType, label: "Semua" },
                { id: "income" as TxType, label: "Pemasukan" },
                { id: "expense" as TxType, label: "Pengeluaran" },
              ]).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTxType(opt.id)}
                  className={[
                    "py-2 rounded-xl border-2 text-xs font-medium transition-colors",
                    txType === opt.id
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Dari</label>
              <input
                type="date"
                value={from}
                max={to}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Sampai</label>
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Format note */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] text-[10px] text-[var(--text-secondary)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            File CSV — bisa dibuka di Microsoft Excel atau Google Sheets. Kolom: Tanggal, Tipe, Jumlah, Kategori, Dompet, Keterangan, Dibuat Oleh.
          </div>

          {error && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Mengekspor..."
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download CSV
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
