"use client";

import { useState } from "react";
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
            <span className="w-5 h-0.5 bg-[#3B82F6] inline-block rounded" style={{ borderTop: "2px dashed #3B82F6", display: "inline-block", width: 16, height: 2 }} />
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
  const [_period] = useState("Bulanan");

  const enriched = data.map(d => ({ ...d, net: d.income - d.expense }));

  return (
    <div className="space-y-3">
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

          {/* Income bars */}
          <Bar dataKey="income" name="Pemasukan" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {enriched.map((_, i) => (
              <Cell key={i} fill="#27AE60" fillOpacity={0.85} />
            ))}
          </Bar>

          {/* Expense bars */}
          <Bar dataKey="expense" name="Pengeluaran" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {enriched.map((_, i) => (
              <Cell key={i} fill="#E74C3C" fillOpacity={0.85} />
            ))}
          </Bar>

          {/* Net savings line */}
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
