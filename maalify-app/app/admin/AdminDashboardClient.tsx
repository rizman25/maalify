"use client";

import { useState } from "react";
import Link from "next/link";

interface Stats {
  totalUsers: number; activeUsers7d: number; newUsersMonth: number;
  totalHouseholds: number; avgMembersPerHousehold: string;
  totalTx: number; txThisMonth: number; txPrevMonth: number;
  scanTotal: number; chatTotal: number; scanMonth: number; chatMonth: number;
  totalTokens: number; totalCostUsd: number; monthTokens: number; monthCostUsd: number;
  adoptionGoals: number; adoptionBudget: number; adoptionScan: number;
}

interface DailyTx { date: string; count: number; }
interface TopHousehold { id: string; name: string; created_at: string; memberCount: number; txCount: number; }
interface RecentUser { id: string; name: string; email: string; created_at: string; }

interface Props {
  stats: Stats;
  dailyTxData: DailyTx[];
  topHouseholds: TopHousehold[];
  recentUsers: RecentUser[];
  generatedAt: string;
}

function fmt(n: number) { return n.toLocaleString("id-ID"); }
function fmtUsd(n: number) { return `$${n.toFixed(4)}`; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminDashboardClient({ stats, dailyTxData, topHouseholds, recentUsers, generatedAt }: Props) {
  const [tab, setTab] = useState<"overview" | "ai" | "users" | "households">("overview");

  const txGrowth = stats.txPrevMonth > 0
    ? ((stats.txThisMonth - stats.txPrevMonth) / stats.txPrevMonth * 100).toFixed(1)
    : null;

  const maxDailyTx = Math.max(...dailyTxData.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center font-bold text-sm">M</div>
          <div>
            <p className="font-bold text-white">Maalify Admin</p>
            <p className="text-[10px] text-slate-400">SaaS Monitoring Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-500 hidden sm:block">
            Data per {new Date(generatedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
          <button onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/5 transition-colors flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
          <Link href="/dashboard" className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:bg-white/5 transition-colors">
            ← App
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Tab nav */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
          {(["overview","ai","users","households"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                tab === t ? "bg-[#1E3A5F] text-white" : "text-slate-400 hover:text-white"
              }`}>
              {t === "ai" ? "AI Usage" : t === "overview" ? "Overview" : t === "users" ? "Users" : "Households"}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Users" value={fmt(stats.totalUsers)} sub={`+${fmt(stats.newUsersMonth)} bulan ini`} color="#3B82F6" icon="👥" />
              <KpiCard label="Aktif 7 Hari" value={fmt(stats.activeUsers7d)} sub={`${stats.totalUsers > 0 ? Math.round(stats.activeUsers7d / stats.totalUsers * 100) : 0}% dari total`} color="#10B981" icon="⚡" />
              <KpiCard label="Total Households" value={fmt(stats.totalHouseholds)} sub={`avg ${stats.avgMembersPerHousehold} anggota`} color="#8B5CF6" icon="🏠" />
              <KpiCard label="Total Transaksi" value={fmt(stats.totalTx)} sub={`${fmt(stats.txThisMonth)} bulan ini`} color="#F59E0B" icon="📝" />
            </div>

            {/* Transaction trend */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-semibold text-white">Transaksi Harian</p>
                  <p className="text-xs text-slate-400 mt-0.5">30 hari terakhir</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{fmt(stats.txThisMonth)}</span>
                  {txGrowth !== null && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      parseFloat(txGrowth) >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {parseFloat(txGrowth) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(txGrowth))}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-end gap-1 h-32">
                {dailyTxData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                      {d.date.slice(5)}: {d.count}
                    </div>
                    <div className="w-full rounded-t-sm transition-all"
                      style={{ height: `${Math.max((d.count / maxDailyTx) * 100, 2)}%`, backgroundColor: i === dailyTxData.length - 1 ? "#3B82F6" : "#1E3A5F" }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-slate-500">{dailyTxData[0]?.date.slice(5)}</p>
                <p className="text-[10px] text-slate-500">{dailyTxData[dailyTxData.length - 1]?.date.slice(5)}</p>
              </div>
            </div>

            {/* Feature Adoption */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
              <p className="font-semibold text-white mb-4">Feature Adoption</p>
              <div className="space-y-4">
                {[
                  { label: "Scan Struk AI", pct: stats.adoptionScan, color: "#10B981", icon: "📸" },
                  { label: "Anggaran Bulanan", pct: stats.adoptionBudget, color: "#F59E0B", icon: "📊" },
                  { label: "Tabungan & Goals", pct: stats.adoptionGoals, color: "#8B5CF6", icon: "🎯" },
                ].map(f => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-slate-300 flex items-center gap-2"><span>{f.icon}</span>{f.label}</span>
                      <span className="text-sm font-bold" style={{ color: f.color }}>{f.pct}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {Math.round(stats.totalHouseholds * f.pct / 100)} dari {stats.totalHouseholds} household
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AI USAGE ── */}
        {tab === "ai" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Scan Struk (total)" value={fmt(stats.scanTotal)} sub={`${fmt(stats.scanMonth)} bulan ini`} color="#10B981" icon="📸" />
              <KpiCard label="Maali Chat (total)" value={fmt(stats.chatTotal)} sub={`${fmt(stats.chatMonth)} bulan ini`} color="#3B82F6" icon="🤖" />
              <KpiCard label="Total Token" value={fmt(stats.totalTokens)} sub={`${fmt(stats.monthTokens)} bulan ini`} color="#8B5CF6" icon="⚙️" />
              <KpiCard label="Est. Biaya (total)" value={fmtUsd(stats.totalCostUsd)} sub={`${fmtUsd(stats.monthCostUsd)} bulan ini`} color="#F59E0B" icon="💰" />
            </div>

            {/* Breakdown cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                <p className="font-semibold text-white flex items-center gap-2">📸 Scan Struk</p>
                <div className="space-y-3">
                  <StatRow label="Total request" value={fmt(stats.scanTotal)} />
                  <StatRow label="Bulan ini" value={fmt(stats.scanMonth)} />
                  <StatRow label="Rata-rata/hari" value={(stats.scanTotal / 30).toFixed(1)} />
                  <StatRow label="Household pakai" value={`${stats.adoptionScan}%`} />
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                <p className="font-semibold text-white flex items-center gap-2">🤖 Maali AI Chat</p>
                <div className="space-y-3">
                  <StatRow label="Total request" value={fmt(stats.chatTotal)} />
                  <StatRow label="Bulan ini" value={fmt(stats.chatMonth)} />
                  <StatRow label="Rata-rata/hari" value={(stats.chatTotal / 30).toFixed(1)} />
                  <StatRow label="Model" value="gemini-2.0-flash-001" mono />
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
              <p className="font-semibold text-white">💰 Estimasi Biaya (OpenRouter)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Token</p>
                  <p className="text-xl font-bold text-white">{fmt(stats.totalTokens)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Biaya</p>
                  <p className="text-xl font-bold text-yellow-400">{fmtUsd(stats.totalCostUsd)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Bulan Ini Token</p>
                  <p className="text-xl font-bold text-white">{fmt(stats.monthTokens)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Bulan Ini Biaya</p>
                  <p className="text-xl font-bold text-yellow-400">{fmtUsd(stats.monthCostUsd)}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Harga: $0.075/1M input tokens · $0.30/1M output tokens · Model: google/gemini-2.0-flash-001
              </p>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard label="Total Users" value={fmt(stats.totalUsers)} color="#3B82F6" icon="👥" />
              <KpiCard label="Aktif 7 Hari" value={fmt(stats.activeUsers7d)} sub={`${stats.totalUsers > 0 ? Math.round(stats.activeUsers7d / stats.totalUsers * 100) : 0}% dari total`} color="#10B981" icon="⚡" />
              <KpiCard label="Baru Bulan Ini" value={fmt(stats.newUsersMonth)} color="#8B5CF6" icon="🆕" />
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <p className="font-semibold text-white">User Terbaru</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-5 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Nama</th>
                      <th className="text-left px-5 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Daftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm text-white font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-slate-400 font-mono">{u.email}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-400">{fmtDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── HOUSEHOLDS ── */}
        {tab === "households" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard label="Total Households" value={fmt(stats.totalHouseholds)} color="#8B5CF6" icon="🏠" />
              <KpiCard label="Avg Anggota" value={stats.avgMembersPerHousehold} sub="per household" color="#3B82F6" icon="👥" />
              <KpiCard label="Total Transaksi" value={fmt(stats.totalTx)} sub={`${fmt(stats.txThisMonth)} bulan ini`} color="#F59E0B" icon="📝" />
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <p className="font-semibold text-white">Top Households</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-5 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Household</th>
                      <th className="text-right px-5 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Anggota</th>
                      <th className="text-right px-5 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Transaksi</th>
                      <th className="text-left px-5 py-3 text-[10px] text-slate-400 uppercase tracking-wider">Dibuat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {topHouseholds.map(h => (
                      <tr key={h.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">🏠</div>
                            <span className="text-sm text-white font-medium">{h.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-slate-300">{h.memberCount}</td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-yellow-400">{fmt(h.txCount)}</td>
                        <td className="px-5 py-3.5 text-sm text-slate-400">{fmtDate(h.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: string }) {
  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function StatRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-semibold text-white ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
