"use client";

import { useState, useRef, useEffect } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { formatRupiah } from "@/lib/utils";

interface DataPoint {
  label: string;
  income: number;
  expense: number;
}

type Period = "3" | "6" | "12";

const PERIOD_OPTIONS: { value: Period; label: string; subtitle: string }[] = [
  { value: "3",  label: "3 Bulan",  subtitle: "3 bulan terakhir"  },
  { value: "6",  label: "6 Bulan",  subtitle: "6 bulan terakhir"  },
  { value: "12", label: "1 Tahun",  subtitle: "12 bulan terakhir" },
];

function formatY(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const income  = payload.find((p: any) => p.dataKey === "income")?.value  ?? 0;
  const expense = payload.find((p: any) => p.dataKey === "expense")?.value ?? 0;
  const net     = payload.find((p: any) => p.dataKey === "net")?.value     ?? 0;
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xl p-3 min-w-[190px]">
      <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#27AE60] inline-block" />
            Pemasukan
          </span>
          <span className="text-xs font-semibold text-[var(--text-primary)]">Rp {formatRupiah(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E74C3C] inline-block" />
            Pengeluaran
          </span>
          <span className="text-xs font-semibold text-[var(--text-primary)]">Rp {formatRupiah(expense)}</span>
        </div>
        <div className="border-t border-[var(--border)] pt-1.5 flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <svg width="16" height="8" viewBox="0 0 16 8" className="inline-block flex-shrink-0">
              <line x1="0" y1="4" x2="16" y2="4" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" />
            </svg>
            Saldo Bersih
          </span>
          <span className={`text-xs font-semibold ${net >= 0 ? "text-[#27AE60]" : "text-[#E74C3C]"}`}>
            {net < 0 ? "-" : ""}Rp {formatRupiah(Math.abs(net))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function TrendChart({ data }: { data: DataPoint[] }) {
  const [period, setPeriod] = useState<Period>("6");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = PERIOD_OPTIONS.find(o => o.value === period)!;

  // Slice data sesuai period
  const sliced = data.slice(-parseInt(period));
  const enriched = sliced.map(d => ({ ...d, net: d.income - d.expense }));

  // MoM badge: bandingkan net bulan terakhir vs bulan sebelumnya
  const momChip = (() => {
    const last = enriched[enriched.length - 1];
    const prev = enriched[enriched.length - 2];
    if (!last || !prev) return null;
    const currNet = last.net;
    const prevNet = prev.net;
    // Butuh data di salah satu bulan agar perbandingan bermakna
    if (prevNet === 0 && currNet === 0) return null;
    if (prevNet === 0) return null; // tidak bisa hitung % dari 0
    const pct = ((currNet - prevNet) / Math.abs(prevNet)) * 100;
    // Cap tampilan agar tidak terlalu ekstrem
    const display = Math.min(Math.abs(pct), 999).toFixed(0);
    const improved = currNet > prevNet; // net naik = lebih baik
    return { display, improved, raw: pct };
  })();

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--text-primary)]">Arus Kas</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-[var(--text-secondary)]">{selected.subtitle}</p>
            {momChip && (
              <span className={[
                "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none",
                momChip.improved
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
              ].join(" ")}>
                {momChip.improved ? "↑" : "↓"} {momChip.display}% vs bln lalu
              </span>
            )}
          </div>
        </div>

        {/* Dropdown */}
        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
          >
            <span>{selected.label}</span>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden z-50">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setPeriod(opt.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[var(--bg-elevated)] ${
                    period === opt.value
                      ? "text-brand-primary font-semibold bg-brand-primary/5"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#27AE60]" />
          Pemasukan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E74C3C]" />
          Pengeluaran
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="8" viewBox="0 0 16 8">
            <line x1="0" y1="4" x2="16" y2="4" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" />
          </svg>
          Saldo Bersih
        </span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={enriched} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatY}
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-elevated)", radius: 4 }} />

          <Bar dataKey="income" name="Pemasukan" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {enriched.map((_, i) => (
              <Cell key={i} fill="#27AE60" fillOpacity={0.85} />
            ))}
          </Bar>

          <Bar dataKey="expense" name="Pengeluaran" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {enriched.map((_, i) => (
              <Cell key={i} fill="#E74C3C" fillOpacity={0.85} />
            ))}
          </Bar>

          <Line
            type="monotone"
            dataKey="net"
            name="Saldo Bersih"
            stroke="#3B82F6"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 4, fill: "#3B82F6", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#3B82F6", strokeWidth: 2, stroke: "#fff" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
