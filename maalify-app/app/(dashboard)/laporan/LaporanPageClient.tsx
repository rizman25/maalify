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
  categoryExpense, categoryIncome, householdId,
}: Props) {
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
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
            <p className="text-sm text-[var(--text-secondary)]">Ringkasan tahunan household</p>
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
              Laporan {year}
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
                contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend formatter={(v) => v === "income" ? "Pemasukan" : "Pengeluaran"} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="income" fill="#27AE60" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="expense" fill="#1E3A5F" radius={[4, 4, 0, 0]} maxBarSize={32} />
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
                      contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
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
                      contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
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
