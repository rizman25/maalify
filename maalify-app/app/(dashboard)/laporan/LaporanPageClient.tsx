"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from "recharts";
import ExportModal from "@/components/laporan/ExportModal";

interface MonthData {
  month: number;
  label: string;
  income: number;
  expense: number;
  net: number;
}

interface CatItem {
  name: string;
  icon: string;
  color: string;
  amount: number;
}

interface Props {
  year: number;
  monthlyData: MonthData[];
  totalIncome: number;
  totalExpense: number;
  totalAset: number;
  categoryExpense: CatItem[];
  categoryIncome: CatItem[];
  householdId: string;
  householdName: string;
}

const MONTHS_PANJANG = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const FALLBACK_COLORS = ["#1E3A5F","#27AE60","#F59E0B","#8B5CF6","#E74C3C","#2471A3","#F97316","#06B6D4"];

function formatY(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
  return String(v);
}

function formatTooltip(v: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(v)}`;
}

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

export default function LaporanPageClient({
  year, monthlyData, totalIncome, totalExpense, totalAset,
  categoryExpense, categoryIncome, householdId, householdName,
}: Props) {
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const net = totalIncome - totalExpense;
  const now = new Date();
  const currentYear = now.getFullYear();

  function exportLaporan() {
    const header = ["Bulan", "Pemasukan", "Pengeluaran", "Selisih"];
    const body = monthlyData.map(m => [
      MONTHS_PANJANG[m.month - 1],
      String(m.income),
      String(m.expense),
      String(m.net),
    ]);
    const footer = ["TOTAL", String(totalIncome), String(totalExpense), String(net)];
    downloadCSV([header, ...body, footer], `laporan_${year}.csv`);
  }

  function navigate(dir: -1 | 1) {
    router.push(`/laporan?year=${year + dir}`);
  }

  async function downloadPDF() {
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pageW - margin * 2;

      const navy: [number, number, number]   = [30, 58, 95];
      const green: [number, number, number]  = [39, 174, 96];
      const red: [number, number, number]    = [231, 76, 60];
      const gray: [number, number, number]   = [100, 116, 139];
      const light: [number, number, number]  = [241, 245, 249];

      const fmt = (n: number) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;

      // ── Header bar ─────────────────────────────────────────────────────
      doc.setFillColor(...navy);
      doc.rect(0, 0, pageW, 26, "F");

      // Logo box
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, 6, 13, 13, 2, 2, "F");
      doc.setTextColor(...navy);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("M", margin + 6.5, 14.5, { align: "center" });

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Maalify", margin + 17, 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 210, 235);
      doc.text(`Laporan Keuangan ${householdName} · Tahun ${year}`, margin + 17, 18.5);

      // Date
      const genDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      doc.setFontSize(7);
      doc.text(`Dibuat: ${genDate}`, pageW - margin, 20, { align: "right" });

      let y = 34;

      // ── Summary cards ──────────────────────────────────────────────────
      const cardW = (contentW - 9) / 4;
      const cards = [
        { label: "TOTAL PEMASUKAN",  value: totalIncome,         color: green },
        { label: "TOTAL PENGELUARAN",value: totalExpense,         color: red   },
        { label: "SELISIH BERSIH",   value: Math.abs(net),        color: net >= 0 ? green : red },
        { label: "TOTAL ASET",       value: totalAset,            color: navy  },
      ];
      cards.forEach((c, i) => {
        const x = margin + i * (cardW + 3);
        doc.setFillColor(...light);
        doc.roundedRect(x, y, cardW, 18, 2, 2, "F");
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray);
        doc.text(c.label, x + cardW / 2, y + 5.5, { align: "center" });
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...c.color);
        // Truncate long numbers if needed
        const valStr = c.value >= 1_000_000_000
          ? `Rp ${(c.value / 1_000_000_000).toFixed(1)}M`
          : c.value >= 1_000_000
          ? `Rp ${(c.value / 1_000_000).toFixed(1)}jt`
          : fmt(c.value);
        doc.text(valStr, x + cardW / 2, y + 13, { align: "center" });
      });
      y += 25;

      // ── Monthly table ──────────────────────────────────────────────────
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...navy);
      doc.text("Ringkasan Per Bulan", margin, y);
      y += 3;

      const bodyRows = monthlyData.map((m) => {
        const hasData = m.income > 0 || m.expense > 0;
        return [
          MONTHS_PANJANG[m.month - 1],
          m.income  > 0 ? fmt(m.income)  : "-",
          m.expense > 0 ? fmt(m.expense) : "-",
          hasData ? `${m.net >= 0 ? "+" : ""}${fmt(Math.abs(m.net))}` : "-",
        ];
      });
      bodyRows.push(["TOTAL", fmt(totalIncome), fmt(totalExpense), `${net >= 0 ? "+" : ""}${fmt(Math.abs(net))}`]);

      autoTable(doc, {
        startY: y,
        head: [["BULAN", "PEMASUKAN", "PENGELUARAN", "SELISIH"]],
        body: bodyRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8.5, cellPadding: 2.8 },
        headStyles: { fillColor: navy, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7.5 },
        columnStyles: {
          0: { halign: "left" },
          1: { halign: "right", textColor: green },
          2: { halign: "right", textColor: red },
          3: { halign: "right", fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.row.index === bodyRows.length - 1) {
            data.cell.styles.fillColor = [226, 232, 240];
            data.cell.styles.fontStyle = "bold";
          }
          if (data.column.index === 3 && data.row.index < bodyRows.length - 1) {
            const m = monthlyData[data.row.index];
            if (m && (m.income > 0 || m.expense > 0)) {
              data.cell.styles.textColor = m.net >= 0 ? green : red;
            }
          }
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 10;

      // ── Category tables ────────────────────────────────────────────────
      if (categoryExpense.length > 0 || categoryIncome.length > 0) {
        if (y > 210) { doc.addPage(); y = 20; }

        const halfW = (contentW - 6) / 2;

        // Expense categories
        if (categoryExpense.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...navy);
          doc.text("Pengeluaran per Kategori", margin, y);

          autoTable(doc, {
            startY: y + 3,
            head: [["KATEGORI", "JUMLAH", "%"]],
            body: categoryExpense.slice(0, 10).map((c) => [
              c.name,
              fmt(c.amount),
              `${totalExpense > 0 ? ((c.amount / totalExpense) * 100).toFixed(1) : "0"}%`,
            ]),
            margin: { left: margin, right: margin + halfW + 6 },
            styles: { fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: red, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
            columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
          });
        }

        // Income categories
        if (categoryIncome.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...navy);
          doc.text("Pemasukan per Kategori", margin + halfW + 6, y);

          autoTable(doc, {
            startY: y + 3,
            head: [["KATEGORI", "JUMLAH", "%"]],
            body: categoryIncome.slice(0, 10).map((c) => [
              c.name,
              fmt(c.amount),
              `${totalIncome > 0 ? ((c.amount / totalIncome) * 100).toFixed(1) : "0"}%`,
            ]),
            margin: { left: margin + halfW + 6, right: margin },
            styles: { fontSize: 8, cellPadding: 2.5 },
            headStyles: { fillColor: green, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
            columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
          });
        }
      }

      // ── Footer on every page ───────────────────────────────────────────
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(...navy);
        doc.rect(0, pageH - 9, pageW, 9, "F");
        doc.setFontSize(7);
        doc.setTextColor(180, 210, 235);
        doc.text("Maalify — Pencatatan Keuangan Keluarga", margin, pageH - 3);
        doc.text(`Halaman ${p} dari ${totalPages}`, pageW - margin, pageH - 3, { align: "right" });
      }

      doc.save(`laporan_${householdName.replace(/\s+/g, "_")}_${year}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    } finally {
      setPdfLoading(false);
    }
  }

  const topExpense = categoryExpense.slice(0, 8).map((c, i) => ({
    ...c,
    color: c.color && c.color !== "#E74C3C" ? c.color : FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  const topIncome = categoryIncome.slice(0, 5).map((c, i) => ({
    ...c,
    color: c.color && c.color !== "#E74C3C" ? c.color : FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  // Only show months that have data or up to current month if current year
  const activeMonths = year < currentYear
    ? monthlyData
    : monthlyData.filter(m => m.month <= now.getMonth() + 1);

  const bestMonth = [...activeMonths].sort((a, b) => b.net - a.net)[0];
  const worstMonth = [...activeMonths].sort((a, b) => a.net - b.net)[0];
  const avgExpense = activeMonths.length > 0
    ? activeMonths.reduce((s, m) => s + m.expense, 0) / activeMonths.filter(m => m.expense > 0).length || 0
    : 0;

  return (
    <>
    <div className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Header + Year Nav */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Laporan Keuangan</h1>
            <p className="text-sm text-[var(--text-secondary)]">Ringkasan tahunan family</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Export buttons */}
            <button
              onClick={exportLaporan}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              CSV {year}
            </button>
            <button
              onClick={downloadPDF}
              disabled={pdfLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {pdfLoading ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              )}
              PDF {year}
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary/90 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Transaksi
            </button>
            {/* Year nav */}
            <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-2 py-1.5">
              <button onClick={() => navigate(-1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="font-semibold text-[var(--text-primary)] text-sm w-12 text-center">{year}</span>
              <button onClick={() => navigate(1)} disabled={year >= currentYear}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] disabled:opacity-30 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase mb-2">Total Pemasukan</p>
            <p className="font-financial text-lg font-bold text-[var(--color-success)]">Rp {formatRupiah(totalIncome)}</p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase mb-2">Total Pengeluaran</p>
            <p className="font-financial text-lg font-bold text-[var(--color-danger)]">Rp {formatRupiah(totalExpense)}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${net >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase mb-2">Selisih</p>
            <p className={`font-financial text-lg font-bold ${net >= 0 ? "text-green-600" : "text-red-500"}`}>
              {net >= 0 ? "+" : ""}Rp {formatRupiah(Math.abs(net))}
            </p>
          </div>
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase mb-2">Total Aset</p>
            <p className="font-financial text-lg font-bold text-[var(--text-primary)]">Rp {formatRupiah(totalAset)}</p>
          </div>
        </div>

        {/* Insight chips */}
        {activeMonths.some(m => m.income > 0 || m.expense > 0) && (
          <div className="flex flex-wrap gap-2">
            {bestMonth && bestMonth.net > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-xs text-green-700">
                <span>🏆</span>
                <span>Bulan terbaik: <strong>{MONTHS_PANJANG[bestMonth.month - 1]}</strong> (+Rp {formatRupiah(bestMonth.net)})</span>
              </div>
            )}
            {avgExpense > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                <span>📊</span>
                <span>Rata-rata pengeluaran: <strong>Rp {formatRupiah(Math.round(avgExpense))}/bln</strong></span>
              </div>
            )}
            {worstMonth && worstMonth.net < 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs text-red-600">
                <span>⚠️</span>
                <span>Defisit terbesar: <strong>{MONTHS_PANJANG[worstMonth.month - 1]}</strong> (-Rp {formatRupiah(Math.abs(worstMonth.net))})</span>
              </div>
            )}
          </div>
        )}

        {/* Bar chart: monthly income vs expense */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
          <p className="font-semibold text-[var(--text-primary)] mb-1">Pemasukan vs Pengeluaran</p>
          <p className="text-xs text-[var(--text-secondary)] mb-5">Per bulan tahun {year}</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value, name) => [formatTooltip(Number(value)), name === "income" ? "Pemasukan" : "Pengeluaran"]}
                labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
                contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                itemStyle={{ color: "var(--text-secondary)" }}
              />
              <Legend formatter={(v) => v === "income" ? "Pemasukan" : "Pengeluaran"} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="income" fill="#27AE60" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" fill="#E74C3C" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly net row */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <p className="font-semibold text-[var(--text-primary)]">Ringkasan Per Bulan</p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4 px-5 py-2.5 bg-[var(--bg-elevated)]">
              {["BULAN", "PEMASUKAN", "PENGELUARAN", "SELISIH"].map((h, i) => (
                <p key={h} className={`text-[10px] font-bold text-[var(--text-secondary)] tracking-wider ${i > 0 ? "text-right" : ""}`}>{h}</p>
              ))}
            </div>
            {monthlyData.map((m) => {
              const hasData = m.income > 0 || m.expense > 0;
              const isFuture = year === currentYear && m.month > now.getMonth() + 1;
              return (
                <div key={m.month} className={`grid grid-cols-4 gap-4 px-5 py-3 items-center ${isFuture ? "opacity-30" : hasData ? "" : "opacity-50"}`}>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{MONTHS_PANJANG[m.month - 1]}</p>
                  <p className="text-sm font-financial text-right text-[var(--color-success)]">
                    {m.income > 0 ? `Rp ${formatRupiah(m.income)}` : "-"}
                  </p>
                  <p className="text-sm font-financial text-right text-[var(--color-danger)]">
                    {m.expense > 0 ? `Rp ${formatRupiah(m.expense)}` : "-"}
                  </p>
                  <p className={`text-sm font-financial font-semibold text-right ${m.net > 0 ? "text-[var(--color-success)]" : m.net < 0 ? "text-[var(--color-danger)]" : "text-[var(--text-secondary)]"}`}>
                    {hasData ? `${m.net >= 0 ? "+" : ""}Rp ${formatRupiah(Math.abs(m.net))}` : "-"}
                  </p>
                </div>
              );
            })}
            {/* Total row */}
            <div className="grid grid-cols-4 gap-4 px-5 py-3.5 items-center bg-[var(--bg-elevated)] font-semibold">
              <p className="text-sm text-[var(--text-primary)]">Total</p>
              <p className="text-sm font-financial text-right text-[var(--color-success)]">Rp {formatRupiah(totalIncome)}</p>
              <p className="text-sm font-financial text-right text-[var(--color-danger)]">Rp {formatRupiah(totalExpense)}</p>
              <p className={`text-sm font-financial text-right ${net >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                {net >= 0 ? "+" : ""}Rp {formatRupiah(Math.abs(net))}
              </p>
            </div>
          </div>
        </div>

        {/* Category breakdown: expense + income side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expense by category */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
            <p className="font-semibold text-[var(--text-primary)] mb-1">Pengeluaran per Kategori</p>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Tahun {year}</p>
            {topExpense.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-secondary)]">Belum ada pengeluaran</div>
            ) : (
              <div className="space-y-3">
                {topExpense.map((c, i) => {
                  const pct = totalExpense > 0 ? ((c.amount / totalExpense) * 100).toFixed(1) : "0";
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base flex-shrink-0">{c.icon}</span>
                          <span className="text-sm text-[var(--text-primary)] truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-[var(--text-secondary)]">{pct}%</span>
                          <span className="font-financial text-sm font-medium text-[var(--text-primary)]">Rp {formatRupiah(c.amount)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Income by category */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
            <p className="font-semibold text-[var(--text-primary)] mb-1">Pemasukan per Kategori</p>
            <p className="text-xs text-[var(--text-secondary)] mb-4">Tahun {year}</p>
            {topIncome.length === 0 ? (
              <div className="py-8 text-center text-sm text-[var(--text-secondary)]">Belum ada pemasukan</div>
            ) : (
              <div className="space-y-3">
                {topIncome.map((c) => {
                  const pct = totalIncome > 0 ? ((c.amount / totalIncome) * 100).toFixed(1) : "0";
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base flex-shrink-0">{c.icon}</span>
                          <span className="text-sm text-[var(--text-primary)] truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className="text-xs text-[var(--text-secondary)]">{pct}%</span>
                          <span className="font-financial text-sm font-medium text-[var(--text-primary)]">Rp {formatRupiah(c.amount)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Donut charts */}
        {(topExpense.length > 0 || topIncome.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topExpense.length > 0 && (
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
                <p className="font-semibold text-[var(--text-primary)] mb-4 text-sm">Porsi Pengeluaran</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={topExpense} dataKey="amount" nameKey="name" cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72} strokeWidth={2} stroke="var(--bg-surface)">
                      {topExpense.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`Rp ${formatRupiah(Number(v))}`, ""]}
                      contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                      itemStyle={{ color: "var(--text-secondary)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {topIncome.length > 0 && (
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
                <p className="font-semibold text-[var(--text-primary)] mb-4 text-sm">Porsi Pemasukan</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={topIncome} dataKey="amount" nameKey="name" cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72} strokeWidth={2} stroke="var(--bg-surface)">
                      {topIncome.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`Rp ${formatRupiah(Number(v))}`, ""]}
                      contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                      itemStyle={{ color: "var(--text-secondary)" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

      </div>
    </div>

    {exportOpen && (
      <ExportModal
        householdId={householdId}
        onClose={() => setExportOpen(false)}
      />
    )}
    </>
  );
}
