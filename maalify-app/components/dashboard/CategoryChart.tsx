"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatRupiah } from "@/lib/utils";

interface CategoryItem {
  name: string;
  color: string;
  amount: number;
}

const FALLBACK_COLORS = ["#1E3A5F","#27AE60","#F59E0B","#8B5CF6","#E74C3C","#2471A3"];

export default function CategoryChart({ data, total }: { data: CategoryItem[]; total: number }) {
  const enriched = data.map((d, i) => ({
    ...d,
    color: d.color && d.color !== "#E74C3C" ? d.color : FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <div className="flex flex-col gap-3">
      {/* Donut */}
      <div className="relative h-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enriched}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={64}
              strokeWidth={2}
              stroke="var(--bg-surface)"
            >
              {enriched.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`Rp ${formatRupiah(Number(value))}`, ""]}
              contentStyle={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--text-primary)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
              itemStyle={{ color: "var(--text-secondary)" }}
              labelStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-xs text-[var(--text-secondary)]">TOTAL</p>
          <p className="font-financial text-sm font-bold text-[var(--text-primary)]">
            Rp {formatRupiah(total)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {enriched.map((item) => {
          const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0";
          return (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[var(--text-secondary)] truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-[var(--text-secondary)]">{pct}%</span>
                <span className="font-financial font-medium text-[var(--text-primary)]">
                  Rp {formatRupiah(item.amount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
