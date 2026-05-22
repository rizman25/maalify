"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface Stats {
  totalUsers: number; activeUsers7d: number; newUsersMonth: number;
  totalHouseholds: number; avgMembersPerHousehold: string;
  totalTx: number; txThisMonth: number; txPrevMonth: number;
  scanTotal: number; chatTotal: number; scanMonth: number; chatMonth: number;
  totalTokens: number; totalCostUsd: number; monthTokens: number; monthCostUsd: number;
  adoptionGoals: number; adoptionBudget: number; adoptionScan: number;
  adoptionRecurring: number; adoptionTx: number; adoptionMultiMember: number; adoptionWallet: number;
}

interface DailyTx { date: string; count: number; }
interface TopHousehold { id: string; name: string; created_at: string; memberCount: number; txCount: number; }
interface RecentUser { id: string; name: string; email: string; phone: string | null; created_at: string; }

interface Props {
  stats: Stats;
  dailyTxData: DailyTx[];
  topHouseholds: TopHousehold[];
  recentUsers: RecentUser[];
  generatedAt: string;
}

function formatPhoneDisplay(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^62/, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return digits.slice(0, 3) + " " + digits.slice(3);
  return digits.slice(0, 3) + " " + digits.slice(3, 7) + " " + digits.slice(7, 11);
}

function fmt(n: number) { return n.toLocaleString("id-ID"); }
function fmtUsd(n: number) { return `$${n.toFixed(4)}`; }
function fmtDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

export default function AdminDashboardClient({ stats, dailyTxData, topHouseholds, recentUsers, generatedAt }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<"overview" | "ai" | "users" | "households">("overview");
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : true
  );

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("maalify-theme", next ? "dark" : "light");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const txGrowth = stats.txPrevMonth > 0
    ? ((stats.txThisMonth - stats.txPrevMonth) / stats.txPrevMonth * 100).toFixed(1)
    : null;

  const maxDailyTx = Math.max(...dailyTxData.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors">

      {/* ── Header ── */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center font-bold text-sm text-white">M</div>
          <div>
            <p className="font-bold text-[var(--text-primary)] text-sm">Maalify Admin</p>
            <p className="text-[10px] text-[var(--text-secondary)]">SaaS Monitoring Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
            Data per {new Date(generatedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>

          {/* Theme toggle */}
          <ThemeToggle dark={darkMode} onToggle={toggleDark} size="sm" />

          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors flex items-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>

          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            ← App
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
            title="Keluar dari admin"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Tab nav ── */}
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-xl p-1 w-fit border border-[var(--border)]">
          {(["overview","ai","users","households"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === t
                  ? "bg-brand-primary text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
              }`}>
              {t === "ai" ? "AI Usage" : t === "overview" ? "Overview" : t === "users" ? "Users" : "Households"}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Users"      value={fmt(stats.totalUsers)}      sub={`+${fmt(stats.newUsersMonth)} bulan ini`} color="#3B82F6" icon="👥" />
              <KpiCard label="Aktif 7 Hari"     value={fmt(stats.activeUsers7d)}   sub={`${stats.totalUsers > 0 ? Math.round(stats.activeUsers7d / stats.totalUsers * 100) : 0}% dari total`} color="#10B981" icon="⚡" />
              <KpiCard label="Total Households" value={fmt(stats.totalHouseholds)} sub={`avg ${stats.avgMembersPerHousehold} anggota`} color="#8B5CF6" icon="🏠" />
              <KpiCard label="Total Transaksi"  value={fmt(stats.totalTx)}         sub={`${fmt(stats.txThisMonth)} bulan ini`} color="#F59E0B" icon="📝" />
            </div>

            {/* Transaction trend chart */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">Transaksi Harian</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">30 hari terakhir</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[var(--text-primary)]">{fmt(stats.txThisMonth)}</span>
                  {txGrowth !== null && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      parseFloat(txGrowth) >= 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                    }`}>
                      {parseFloat(txGrowth) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(txGrowth))}%
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-end gap-[2px] h-32">
                {dailyTxData.map((d, i) => {
                  const heightPct = Math.max((d.count / maxDailyTx) * 100, 2);
                  return (
                    <div key={i} className="flex-1 h-full flex flex-col justify-end group relative">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none shadow-sm">
                        {d.date.slice(5)}: {d.count}
                      </div>
                      <div
                        className="w-full rounded-t-sm transition-all duration-300"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: d.count === 0
                            ? "var(--bg-elevated)"
                            : i === dailyTxData.length - 1
                            ? "#3B82F6"
                            : "#2563EB",
                          opacity: d.count === 0 ? 0.4 : 1,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-[var(--text-secondary)]">{dailyTxData[0]?.date.slice(5)}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{dailyTxData[dailyTxData.length - 1]?.date.slice(5)}</p>
              </div>
            </div>

            {/* Feature Adoption */}
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5">
              <p className="font-semibold text-[var(--text-primary)] mb-4">Feature Adoption</p>
              <div className="space-y-4">
                {[
                  { label: "Catat Transaksi",     pct: stats.adoptionTx,          color: "#3B82F6", icon: "💸" },
                  { label: "Tambah Dompet",        pct: stats.adoptionWallet,      color: "#06B6D4", icon: "🏦" },
                  { label: "Scan Struk AI",        pct: stats.adoptionScan,        color: "#10B981", icon: "📸" },
                  { label: "Anggaran Bulanan",     pct: stats.adoptionBudget,      color: "#F59E0B", icon: "📊" },
                  { label: "Tabungan & Goals",     pct: stats.adoptionGoals,       color: "#8B5CF6", icon: "🎯" },
                  { label: "Transaksi Berulang",   pct: stats.adoptionRecurring,   color: "#EC4899", icon: "🔄" },
                  { label: "Multi Member",         pct: stats.adoptionMultiMember, color: "#F97316", icon: "👨‍👩‍👧" },
                ].map(f => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                        <span>{f.icon}</span>{f.label}
                      </span>
                      <span className="text-sm font-bold" style={{ color: f.color }}>{f.pct}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                    </div>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">
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
              <KpiCard label="Scan Struk (total)"  value={fmt(stats.scanTotal)}     sub={`${fmt(stats.scanMonth)} bulan ini`}  color="#10B981" icon="📸" />
              <KpiCard label="Maali Chat (total)"  value={fmt(stats.chatTotal)}     sub={`${fmt(stats.chatMonth)} bulan ini`}  color="#3B82F6" icon="🤖" />
              <KpiCard label="Total Token"         value={fmt(stats.totalTokens)}   sub={`${fmt(stats.monthTokens)} bulan ini`} color="#8B5CF6" icon="⚙️" />
              <KpiCard label="Est. Biaya (total)"  value={fmtUsd(stats.totalCostUsd)} sub={`${fmtUsd(stats.monthCostUsd)} bulan ini`} color="#F59E0B" icon="💰" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-2">📸 Scan Struk</p>
                <div className="space-y-3">
                  <StatRow label="Total request"    value={fmt(stats.scanTotal)} />
                  <StatRow label="Bulan ini"         value={fmt(stats.scanMonth)} />
                  <StatRow label="Rata-rata/hari"    value={(stats.scanTotal / 30).toFixed(1)} />
                  <StatRow label="Household pakai"   value={`${stats.adoptionScan}%`} />
                </div>
              </div>
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
                <p className="font-semibold text-[var(--text-primary)] flex items-center gap-2">🤖 Maali AI Chat</p>
                <div className="space-y-3">
                  <StatRow label="Total request"    value={fmt(stats.chatTotal)} />
                  <StatRow label="Bulan ini"         value={fmt(stats.chatMonth)} />
                  <StatRow label="Rata-rata/hari"    value={(stats.chatTotal / 30).toFixed(1)} />
                  <StatRow label="Model"             value="gemini-2.0-flash-001" mono />
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
              <p className="font-semibold text-[var(--text-primary)]">💰 Estimasi Biaya (OpenRouter)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Token",     val: fmt(stats.totalTokens),    cls: "text-[var(--text-primary)]" },
                  { label: "Total Biaya",     val: fmtUsd(stats.totalCostUsd), cls: "text-yellow-500" },
                  { label: "Bulan Ini Token", val: fmt(stats.monthTokens),    cls: "text-[var(--text-primary)]" },
                  { label: "Bulan Ini Biaya", val: fmtUsd(stats.monthCostUsd), cls: "text-yellow-500" },
                ].map(item => (
                  <div key={item.label} className="bg-[var(--bg-elevated)] rounded-xl p-4 text-center border border-[var(--border)]">
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-1">{item.label}</p>
                    <p className={`text-xl font-bold ${item.cls}`}>{item.val}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">
                Harga: $0.075/1M input tokens · $0.30/1M output tokens · Model: google/gemini-2.0-flash-001
              </p>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard label="Total Users"   value={fmt(stats.totalUsers)}    color="#3B82F6" icon="👥" />
              <KpiCard label="Aktif 7 Hari" value={fmt(stats.activeUsers7d)} sub={`${stats.totalUsers > 0 ? Math.round(stats.activeUsers7d / stats.totalUsers * 100) : 0}% dari total`} color="#10B981" icon="⚡" />
              <KpiCard label="Baru Bulan Ini" value={fmt(stats.newUsersMonth)} color="#8B5CF6" icon="🆕" />
            </div>

            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <p className="font-semibold text-[var(--text-primary)]">User Terbaru</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                      <th className="text-left px-5 py-3 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Nama</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider hidden md:table-cell">No. HP</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Daftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {recentUsers.map(u => (
                      <tr key={u.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm text-[var(--text-primary)] font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)] font-mono">{u.email}</td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          {u.phone ? (
                            <a
                              href={`https://wa.me/${u.phone.startsWith("62") ? u.phone : "62" + u.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-sm text-green-500 hover:text-green-400 font-mono transition-colors"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.091.535 4.06 1.476 5.779L.057 23.514a.75.75 0 0 0 .93.93l5.735-1.419A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.499-5.23-1.374l-.374-.22-3.877.96.977-3.877-.22-.374A10 10 0 1 1 12 22z"/>
                              </svg>
                              +62 {formatPhoneDisplay(u.phone)}
                            </a>
                          ) : (
                            <span className="text-xs text-[var(--text-secondary)] italic">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">{fmtDate(u.created_at)}</td>
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
              <KpiCard label="Total Households" value={fmt(stats.totalHouseholds)}        color="#8B5CF6" icon="🏠" />
              <KpiCard label="Avg Anggota"      value={stats.avgMembersPerHousehold} sub="per household" color="#3B82F6" icon="👥" />
              <KpiCard label="Total Transaksi"  value={fmt(stats.totalTx)} sub={`${fmt(stats.txThisMonth)} bulan ini`} color="#F59E0B" icon="📝" />
            </div>

            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <p className="font-semibold text-[var(--text-primary)]">Top Households</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                      <th className="text-left px-5 py-3 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Household</th>
                      <th className="text-right px-5 py-3 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Anggota</th>
                      <th className="text-right px-5 py-3 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Transaksi</th>
                      <th className="text-left px-5 py-3 text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Dibuat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {topHouseholds.map(h => (
                      <tr key={h.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0">🏠</div>
                            <span className="text-sm text-[var(--text-primary)] font-medium">{h.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-[var(--text-secondary)]">{h.memberCount}</td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-yellow-500">{fmt(h.txCount)}</td>
                        <td className="px-5 py-3.5 text-sm text-[var(--text-secondary)]">{fmtDate(h.created_at)}</td>
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

/* ── Sub-components ── */

function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: string;
}) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 hover:shadow-[var(--shadow-md)] transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)] mt-1">{sub}</p>}
    </div>
  );
}

function StatRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm font-semibold text-[var(--text-primary)] ${mono ? "font-mono text-xs bg-[var(--bg-elevated)] px-2 py-0.5 rounded" : ""}`}>
        {value}
      </span>
    </div>
  );
}
