"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  income: number;
  expense: number;
}

function formatY(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return String(value);
}

function formatTooltip(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(value)}`;
}

export default function TrendChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#27AE60" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatY} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value, name) => [formatTooltip(Number(value)), name === "income" ? "Pemasukan" : "Pengeluaran"]}
          labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
          contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        />
        <Legend
          formatter={(value) => value === "income" ? "Pemasukan" : "Pengeluaran"}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Area type="monotone" dataKey="income" stroke="#27AE60" strokeWidth={2} fill="url(#colorIncome)" dot={{ r: 3, fill: "#27AE60" }} activeDot={{ r: 5 }} />
        <Area type="monotone" dataKey="expense" stroke="#1E3A5F" strokeWidth={2} fill="url(#colorExpense)" dot={{ r: 3, fill: "#1E3A5F" }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
