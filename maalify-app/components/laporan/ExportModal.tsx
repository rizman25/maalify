"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";

interface Props {
  householdId: string;
  onClose: () => void;
}

type TxType  = "all" | "income" | "expense";
type Format  = "csv" | "pdf" | "excel";

type TxRow = {
  date: string;
  type: string;
  amount: number;
  description: string;
  categories: { name: string } | { name: string }[] | null;
  wallets:    { name: string } | { name: string }[] | null;
  users:      { name: string } | { name: string }[] | null;
};

function unpack<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function downloadCSV(rows: string[][], filename: string) {
  const content = rows
    .map(r => r.map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export default function ExportModal({ householdId, onClose }: Props) {
  const now        = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const today      = now.toISOString().split("T")[0];

  const [from,    setFrom]    = useState(firstOfMonth);
  const [to,      setTo]      = useState(today);
  const [txType,  setTxType]  = useState<TxType>("all");
  const [format,  setFormat]  = useState<Format>("csv");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function fetchRows() {
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

    if (txType !== "all") query = query.eq("type", txType);

    const { data, error: err } = await query;
    if (err) throw err;
    return (data ?? []) as unknown as TxRow[];
  }

  async function handleExport() {
    if (!from || !to || from > to) { setError("Rentang tanggal tidak valid."); return; }
    setError(""); setLoading(true);
    try {
      const rows = await fetchRows();
      const label = from === to ? from : `${from}_sd_${to}`;

      if (format === "csv") {
        const header = ["Tanggal","Tipe","Jumlah","Kategori","Dompet","Keterangan","Dibuat Oleh"];
        const body   = rows.map(r => [
          r.date,
          r.type === "income" ? "Pemasukan" : "Pengeluaran",
          String(r.amount),
          unpack(r.categories)?.name ?? "-",
          unpack(r.wallets)?.name    ?? "-",
          r.description,
          unpack(r.users)?.name      ?? "-",
        ]);
        downloadCSV([header, ...body], `transaksi_${label}.csv`);

      } else if (format === "pdf") {
        const { default: jsPDF }    = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Laporan Transaksi", 14, 16);
        doc.setFontSize(9);
        doc.text(`Periode: ${from} s/d ${to}  |  Diekspor: ${today}`, 14, 23);

        const totalIncome  = rows.filter(r => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
        const totalExpense = rows.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);
        doc.text(`Pemasukan: Rp ${formatRupiah(totalIncome)}   Pengeluaran: Rp ${formatRupiah(totalExpense)}   Selisih: Rp ${formatRupiah(Math.abs(totalIncome - totalExpense))}`, 14, 30);

        autoTable(doc, {
          startY: 36,
          head: [["No","Tanggal","Deskripsi","Kategori","Dompet","Tipe","Jumlah"]],
          body: rows.map((r, i) => [
            i + 1,
            r.date,
            r.description,
            unpack(r.categories)?.name ?? "-",
            unpack(r.wallets)?.name    ?? "-",
            r.type === "income" ? "Pemasukan" : "Pengeluaran",
            `${r.type === "income" ? "+" : "-"}Rp ${formatRupiah(Number(r.amount))}`,
          ]),
          styles:      { fontSize: 8 },
          headStyles:  { fillColor: [30, 58, 95] },
          columnStyles: { 6: { halign: "right" } },
        });

        doc.save(`transaksi_${label}.pdf`);

      } else {
        const XLSX = await import("xlsx");
        const sheetData = [
          ["Tanggal","Tipe","Jumlah","Kategori","Dompet","Keterangan","Dibuat Oleh"],
          ...rows.map(r => [
            r.date,
            r.type === "income" ? "Pemasukan" : "Pengeluaran",
            r.type === "income" ? Number(r.amount) : -Number(r.amount),
            unpack(r.categories)?.name ?? "-",
            unpack(r.wallets)?.name    ?? "-",
            r.description,
            unpack(r.users)?.name      ?? "-",
          ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws["!cols"] = [{ wch: 12 },{ wch: 12 },{ wch: 16 },{ wch: 18 },{ wch: 16 },{ wch: 30 },{ wch: 18 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transaksi");
        XLSX.writeFile(wb, `transaksi_${label}.xlsx`);
      }

      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal mengekspor data");
    } finally {
      setLoading(false);
    }
  }

  const FORMAT_OPTS: { id: Format; label: string; icon: string; color: string }[] = [
    { id: "csv",   label: "CSV",   icon: "📄", color: "text-[var(--text-primary)]" },
    { id: "excel", label: "Excel", icon: "📊", color: "text-green-700" },
    { id: "pdf",   label: "PDF",   icon: "📕", color: "text-red-600" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-8 pb-4">
      <div className="absolute inset-0 bg-black/40" style={{backdropFilter:"none",WebkitBackdropFilter:"none"}} onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-sm max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">Export Transaksi</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <div className="px-6 py-5 space-y-4">
          {/* Format selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTS.map(opt => (
                <button key={opt.id} type="button" onClick={() => setFormat(opt.id)}
                  className={["py-2.5 rounded-xl border-2 text-xs font-medium transition-colors flex flex-col items-center gap-0.5",
                    format === opt.id
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                  ].join(" ")}>
                  <span className="text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Tipe Transaksi</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "all" as TxType, label: "Semua" },
                { id: "income" as TxType, label: "Pemasukan" },
                { id: "expense" as TxType, label: "Pengeluaran" },
              ]).map(opt => (
                <button key={opt.id} type="button" onClick={() => setTxType(opt.id)}
                  className={["py-2 rounded-xl border-2 text-xs font-medium transition-colors",
                    txType === opt.id
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                  ].join(" ")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Dari</label>
              <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Sampai</label>
              <input type="date" value={to} min={from} max={today} onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
          </div>

          {/* Format info */}
          <div className="px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] text-[10px] text-[var(--text-secondary)]">
            {format === "csv"   && "CSV — bisa dibuka langsung di Excel / Google Sheets."}
            {format === "excel" && "Excel (.xlsx) — file native Excel dengan format angka."}
            {format === "pdf"   && "PDF — siap cetak, termasuk ringkasan pemasukan & pengeluaran."}
          </div>

          {error && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
              Batal
            </button>
            <button type="button" onClick={handleExport} disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? "Mengekspor..." : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download {format.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
