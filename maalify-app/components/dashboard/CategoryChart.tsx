"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { formatRupiah } from "@/lib/utils";

interface CategoryItem {
  name: string;
  color: string;
  amount: number;
}

const FALLBACK_COLORS = ["#1E3A5F","#27AE60","#F59E0B","#8B5CF6","#E74C3C","#2471A3"];

// Slice aktif sedikit membesar saat hover
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

export default function CategoryChart({ data, total }: { data: CategoryItem[]; total: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const enriched = data.map((d, i) => ({
    ...d,
    color: d.color && d.color !== "#E74C3C" ? d.color : FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  const active = activeIndex !== null ? enriched[activeIndex] : null;
  const activePct = active && total > 0
    ? ((active.amount / total) * 100).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Donut */}
      <div className="relative h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enriched}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={66}
              strokeWidth={2}
              stroke="var(--bg-surface)"
              activeIndex={activeIndex ?? -1}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {enriched.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                  style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center info — ganti saat hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {active ? (
            <>
              <div
                className="w-2 h-2 rounded-full mb-1"
                style={{ backgroundColor: active.color }}
              />
              <p className="text-[10px] font-semibold text-[var(--text-primary)] text-center leading-tight max-w-[80px] truncate px-1">
                {active.name}
              </p>
              <p className="font-financial text-sm font-bold text-[var(--text-primary)] mt-0.5">
                {activePct}%
              </p>
              <p className="text-[10px] text-[var(--text-secondary)]">
                Rp {formatRupiah(active.amount)}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] text-[var(--text-secondary)]">TOTAL</p>
              <p className="font-financial text-sm font-bold text-[var(--text-primary)]">
                Rp {formatRupiah(total)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-1.5">
        {enriched.map((item, i) => {
          const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0";
          const isActive = activeIndex === i;
          return (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs rounded-lg px-1 py-0.5 transition-colors"
              style={{ backgroundColor: isActive ? `${item.color}15` : "transparent" }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform"
                  style={{
                    backgroundColor: item.color,
                    transform: isActive ? "scale(1.3)" : "scale(1)",
                  }}
                />
                <span
                  className="truncate transition-colors"
                  style={{ color: isActive ? item.color : "var(--text-secondary)", fontWeight: isActive ? 600 : 400 }}
                >
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-[var(--text-secondary)]">{pct}%</span>
                <span
                  className="font-financial font-medium transition-colors"
                  style={{ color: isActive ? item.color : "var(--text-primary)" }}
                >
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
