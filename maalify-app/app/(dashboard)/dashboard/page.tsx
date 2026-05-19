import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import TrendChart from "@/components/dashboard/TrendChart";
import CategoryChart from "@/components/dashboard/CategoryChart";
import Link from "next/link";

const BULAN_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users").select("name").eq("id", user.id).single();

  const { data: membership } = await supabase
    .from("household_members").select("household_id").eq("user_id", user.id).limit(1).single();

  const householdId = membership?.household_id ?? "";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad(month)}-01`;
  const monthEnd = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  const prevMonthStart = month === 1 ? `${year - 1}-12-01` : `${year}-${pad(month - 1)}-01`;

  // 6-bulan ke belakang
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const trendStart = `${sixMonthsAgo.getFullYear()}-${pad(sixMonthsAgo.getMonth() + 1)}-01`;

  const [curMonthRes, prevMonthRes, walletsRes, trendRes, catRes] = await Promise.all([
    supabase.from("transactions").select("type, amount")
      .eq("household_id", householdId).gte("date", monthStart).lt("date", monthEnd),

    supabase.from("transactions").select("type, amount")
      .eq("household_id", householdId).gte("date", prevMonthStart).lt("date", monthStart),

    supabase.from("wallets").select("current_balance").eq("household_id", householdId).eq("is_active", true),

    supabase.from("transactions").select("type, amount, date")
      .eq("household_id", householdId).gte("date", trendStart).order("date"),

    supabase.from("transactions")
      .select("amount, categories(name, color)")
      .eq("household_id", householdId).eq("type", "expense")
      .gte("date", monthStart).lt("date", monthEnd),
  ]);

  const curIncome  = (curMonthRes.data ?? []).filter(t => t.type === "income").reduce((s,t) => s + Number(t.amount), 0);
  const curExpense = (curMonthRes.data ?? []).filter(t => t.type === "expense").reduce((s,t) => s + Number(t.amount), 0);
  const prevIncome  = (prevMonthRes.data ?? []).filter(t => t.type === "income").reduce((s,t) => s + Number(t.amount), 0);
  const prevExpense = (prevMonthRes.data ?? []).filter(t => t.type === "expense").reduce((s,t) => s + Number(t.amount), 0);
  const totalAset  = (walletsRes.data ?? []).reduce((s, w) => s + Number(w.current_balance), 0);

  function pct(cur: number, prev: number) {
    if (prev === 0) return null;
    return ((cur - prev) / prev * 100).toFixed(1);
  }

  // Trend: grup per bulan (6 bulan terakhir)
  const trendMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    trendMap.set(key, { income: 0, expense: 0 });
  }
  for (const tx of trendRes.data ?? []) {
    const key = tx.date.substring(0, 7);
    if (trendMap.has(key)) {
      const entry = trendMap.get(key)!;
      if (tx.type === "income") entry.income += Number(tx.amount);
      else entry.expense += Number(tx.amount);
    }
  }
  const trendData = Array.from(trendMap.entries()).map(([key, val]) => {
    const [y, m] = key.split("-");
    return { label: BULAN_SHORT[parseInt(m) - 1], ...val };
  });

  // Kategori breakdown
  const catMap = new Map<string, { name: string; color: string; amount: number }>();
  for (const row of catRes.data ?? []) {
    const cats = row.categories as { name: string; color: string } | { name: string; color: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    if (!cat) continue;
    const existing = catMap.get(cat.name);
    if (existing) existing.amount += Number(row.amount);
    else catMap.set(cat.name, { name: cat.name, color: cat.color ?? "#94A3B8", amount: Number(row.amount) });
  }
  const categoryData = Array.from(catMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  const userName = profile?.name ?? user.email ?? "Pengguna";
  const firstName = userName.split(" ")[0];
  const bulanNama = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Selamat datang kembali, {firstName} 👋
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Berikut ringkasan keuangan keluarga {bulanNama}
          </p>
        </div>
        <Link
          href="/transaksi"
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Catat Transaksi
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="TOTAL SALDO"
          value={totalAset}
          pctChange={null}
          color="#1E3A5F"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
        />
        <SummaryCard
          label="PEMASUKAN BULAN INI"
          value={curIncome}
          pctChange={pct(curIncome, prevIncome)}
          prevLabel={`dari ${BULAN_SHORT[(month === 1 ? 12 : month - 1) - 1]} (Rp ${formatRupiah(prevIncome)})`}
          color="#27AE60"
          positive
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        />
        <SummaryCard
          label="PENGELUARAN BULAN INI"
          value={curExpense}
          pctChange={pct(curExpense, prevExpense)}
          prevLabel={`dari ${BULAN_SHORT[(month === 1 ? 12 : month - 1) - 1]} (Rp ${formatRupiah(prevExpense)})`}
          color="#E74C3C"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Trend Chart */}
        <div className="lg:col-span-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
          <p className="font-semibold text-[var(--text-primary)] mb-1">Tren Pemasukan & Pengeluaran</p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">6 bulan terakhir</p>
          <TrendChart data={trendData} />
        </div>

        {/* Category Donut */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
          <p className="font-semibold text-[var(--text-primary)] mb-1">Pengeluaran per Kategori</p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">{bulanNama}</p>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--text-secondary)]">
              Belum ada pengeluaran bulan ini
            </div>
          ) : (
            <CategoryChart data={categoryData} total={curExpense} />
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label, value, pctChange, prevLabel, color, positive, icon,
}: {
  label: string;
  value: number;
  pctChange: string | null;
  prevLabel?: string;
  color: string;
  positive?: boolean;
  icon: React.ReactNode;
}) {
  const isUp = pctChange !== null && parseFloat(pctChange) > 0;
  const isDown = pctChange !== null && parseFloat(pctChange) < 0;

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18", color }}>
          {icon}
        </div>
      </div>
      <p className="font-financial text-2xl font-bold text-[var(--text-primary)]">
        Rp {formatRupiah(value)}
      </p>
      {pctChange !== null && (
        <p className={[
          "text-xs mt-2 flex items-center gap-1",
          isUp ? (positive ? "text-success" : "text-danger") : isDown ? (positive ? "text-danger" : "text-success") : "text-[var(--text-secondary)]",
        ].join(" ")}>
          <span>
            {isUp ? "↑" : isDown ? "↓" : "→"} {Math.abs(parseFloat(pctChange))}%
          </span>
          {prevLabel && <span className="text-[var(--text-secondary)]">{prevLabel}</span>}
        </p>
      )}
    </div>
  );
}
