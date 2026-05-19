import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import TrendChart from "@/components/dashboard/TrendChart";
import CategoryChart from "@/components/dashboard/CategoryChart";
import QuickAddTransaksi from "@/components/dashboard/QuickAddTransaksi";
import Link from "next/link";

const BULAN_SHORT = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const BULAN_PANJANG = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

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

  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const trendStart = `${sixMonthsAgo.getFullYear()}-${pad(sixMonthsAgo.getMonth() + 1)}-01`;

  const [curMonthRes, prevMonthRes, walletsRes, trendRes, catRes, budgetsRes, debtsRes, recentTxRes, activeWalletsRes, catsRes] = await Promise.all([
    supabase.from("transactions").select("type, amount")
      .eq("household_id", householdId).gte("date", monthStart).lt("date", monthEnd),

    supabase.from("transactions").select("type, amount")
      .eq("household_id", householdId).gte("date", prevMonthStart).lt("date", monthStart),

    supabase.from("wallets").select("current_balance")
      .eq("household_id", householdId).eq("is_active", true),

    supabase.from("transactions").select("type, amount, date")
      .eq("household_id", householdId).gte("date", trendStart).order("date"),

    supabase.from("transactions")
      .select("amount, categories(name, color)")
      .eq("household_id", householdId).eq("type", "expense")
      .gte("date", monthStart).lt("date", monthEnd),

    supabase.from("budgets")
      .select("id, amount, category_id, categories(name, color)")
      .eq("household_id", householdId).eq("month", month).eq("year", year),

    supabase.from("debts")
      .select("id, type, party_name, remaining_amount, due_date, status")
      .eq("household_id", householdId).eq("status", "active")
      .order("due_date").limit(5),

    supabase.from("transactions")
      .select("id, type, amount, description, date, categories(name, icon, color), wallets(name), users(name)")
      .eq("household_id", householdId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5),

    supabase.from("wallets").select("id, name, type, current_balance, color, is_active")
      .eq("household_id", householdId).eq("is_active", true).order("name"),

    supabase.from("categories").select("id, name, icon, color, type")
      .or(`household_id.eq.${householdId},household_id.is.null`)
      .order("is_default", { ascending: false }).order("name"),
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

  // Trend 6 bulan
  const trendMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    trendMap.set(key, { income: 0, expense: 0 });
  }
  for (const tx of trendRes.data ?? []) {
    const key = tx.date.substring(0, 7);
    if (trendMap.has(key)) {
      const e = trendMap.get(key)!;
      if (tx.type === "income") e.income += Number(tx.amount);
      else e.expense += Number(tx.amount);
    }
  }
  const trendData = Array.from(trendMap.entries()).map(([key, val]) => ({
    label: BULAN_SHORT[parseInt(key.split("-")[1]) - 1], ...val,
  }));

  // Category donut
  const catMap = new Map<string, { name: string; color: string; amount: number }>();
  for (const row of catRes.data ?? []) {
    const cats = row.categories as { name: string; color: string } | { name: string; color: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    if (!cat) continue;
    const existing = catMap.get(cat.name);
    if (existing) existing.amount += Number(row.amount);
    else catMap.set(cat.name, { name: cat.name, color: cat.color ?? "#94A3B8", amount: Number(row.amount) });
  }
  const categoryData = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 6);

  // Budget dengan spending aktual
  type BudgetRow = { id: string; amount: number; category_id: string; categories: { name: string; color: string } | { name: string; color: string }[] | null };
  const budgets = ((budgetsRes.data ?? []) as unknown as BudgetRow[]).map(b => {
    const cats = b.categories;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    const spent = catMap.get(cat?.name ?? "")?.amount ?? 0;
    return { id: b.id, name: cat?.name ?? "-", color: cat?.color ?? "#94A3B8", budget: Number(b.amount), spent };
  });

  // Debts
  const debts = debtsRes.data ?? [];
  const today = now.toISOString().split("T")[0];
  const in5Days = new Date(now); in5Days.setDate(in5Days.getDate() + 5);
  const in5DaysStr = in5Days.toISOString().split("T")[0];
  const nearlyDueCount = debts.filter(d => d.due_date && d.due_date <= in5DaysStr).length;

  // Recent transactions
  type RecentTx = {
    id: string; type: string; amount: number; description: string; date: string;
    categories: { name: string; icon: string; color: string } | null;
    wallets: { name: string } | null;
    users: { name: string } | null;
  };
  const recentTx = (recentTxRes.data ?? []) as unknown as RecentTx[];
  const totalTxCount = (curMonthRes.data ?? []).length;

  const userName = profile?.name ?? user.email ?? "Pengguna";
  const firstName = userName.split(" ")[0];
  const bulanNama = BULAN_PANJANG[month - 1] + " " + year;

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 py-6">
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
        <QuickAddTransaksi
          wallets={(activeWalletsRes.data ?? []) as import("@/types").Wallet[]}
          categories={(catsRes.data ?? []) as import("@/types").Category[]}
          householdId={householdId}
          userId={user.id}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="TOTAL SALDO" value={totalAset} pctChange={null} color="#1E3A5F"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}
        />
        <SummaryCard label="PEMASUKAN BULAN INI" value={curIncome} pctChange={pct(curIncome, prevIncome)}
          prevLabel={`dari ${BULAN_SHORT[(month === 1 ? 12 : month - 1) - 1]} (Rp ${formatRupiah(prevIncome)})`}
          color="#27AE60" positive
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
        />
        <SummaryCard label="PENGELUARAN BULAN INI" value={curExpense} pctChange={pct(curExpense, prevExpense)}
          prevLabel={`dari ${BULAN_SHORT[(month === 1 ? 12 : month - 1) - 1]} (Rp ${formatRupiah(prevExpense)})`}
          color="#E74C3C"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
          <p className="font-semibold text-[var(--text-primary)] mb-1">Tren Pemasukan & Pengeluaran</p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">6 bulan terakhir</p>
          <TrendChart data={trendData} />
        </div>
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
          <p className="font-semibold text-[var(--text-primary)] mb-1">Pengeluaran per Kategori</p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">{bulanNama}</p>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-[var(--text-secondary)]">Belum ada pengeluaran</div>
          ) : (
            <CategoryChart data={categoryData} total={curExpense} />
          )}
        </div>
      </div>

      {/* Anggaran + Hutang */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Anggaran Bulan Ini */}
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-[var(--text-primary)]">Anggaran Bulan Ini</p>
            <Link href="/anggaran" className="text-xs text-brand-primary hover:underline font-medium">Lihat semua →</Link>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-4">Progress penggunaan budget per kategori</p>

          {budgets.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">Belum ada anggaran bulan ini</p>
              <Link href="/anggaran" className="text-xs text-brand-primary hover:underline mt-1 inline-block">+ Atur Anggaran</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map(b => {
                const pctUsed = b.budget > 0 ? (b.spent / b.budget) * 100 : 0;
                const isNearlyFull = pctUsed >= 80;
                const isOver = pctUsed > 100;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{b.name}</span>
                        {isOver && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-danger">Melebihi!</span>
                        )}
                        {!isOver && isNearlyFull && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Hampir habis</span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">
                        Rp {formatRupiah(b.spent)} / Rp {formatRupiah(b.budget)}
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pctUsed, 100)}%`,
                          backgroundColor: isOver ? "#E74C3C" : isNearlyFull ? "#F59E0B" : b.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Hutang Jatuh Tempo */}
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-[var(--text-primary)]">Hutang Jatuh Tempo</p>
            <Link href="/hutang" className="text-xs text-brand-primary hover:underline font-medium">Lihat semua →</Link>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mb-4">Bayar tepat waktu untuk hindari denda</p>

          {debts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">Tidak ada hutang aktif</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map(d => {
                const dueFmt = d.due_date
                  ? new Date(d.due_date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                  : "Tanpa jatuh tempo";
                const isNearDue = d.due_date && d.due_date <= in5DaysStr;
                return (
                  <div key={d.id} className="flex items-center gap-3">
                    <div className={[
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      d.type === "payable" ? "bg-red-50" : "bg-blue-50",
                    ].join(" ")}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={d.type === "payable" ? "#E74C3C" : "#2471A3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{d.party_name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Jatuh tempo · {dueFmt}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-financial text-sm font-semibold text-[var(--text-primary)]">
                        Rp {formatRupiah(Number(d.remaining_amount))}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        {d.type === "payable" ? "hutang" : "piutang"}
                      </p>
                    </div>
                  </div>
                );
              })}

              {nearlyDueCount > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <p className="text-xs text-amber-800">
                    <strong>{nearlyDueCount} hutang</strong> akan jatuh tempo dalam 5 hari ke depan
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--border)]">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Transaksi Terbaru</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{totalTxCount} transaksi tercatat bulan ini</p>
          </div>
          <Link href="/transaksi" className="text-xs text-brand-primary hover:underline font-medium">Lihat semua →</Link>
        </div>

        {recentTx.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-secondary)]">Belum ada transaksi bulan ini</div>
        ) : (
          <div>
            {recentTx.map((tx, i) => {
              const cat = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories;
              const wallet = Array.isArray(tx.wallets) ? tx.wallets[0] : tx.wallets;
              const txUser = Array.isArray(tx.users) ? tx.users[0] : tx.users;
              const dateStr = new Date(tx.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
              const isIncome = tx.type === "income";

              return (
                <div
                  key={tx.id}
                  className={["flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors", i > 0 ? "border-t border-[var(--border)]" : ""].join(" ")}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20" }}
                  >
                    {cat?.icon ?? "💸"}
                  </div>

                  {/* Deskripsi + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20", color: cat?.color ?? "#94A3B8" }}
                      >
                        {cat?.name ?? "-"}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)]">{dateStr}</span>
                      {wallet?.name && <span className="text-[10px] text-[var(--text-secondary)] hidden sm:inline">{wallet.name}</span>}
                    </div>
                  </div>

                  {/* Jumlah */}
                  <p className={["font-financial text-sm font-semibold flex-shrink-0", isIncome ? "text-success" : "text-danger"].join(" ")}>
                    {isIncome ? "+" : "-"}Rp {formatRupiah(Number(tx.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, pctChange, prevLabel, color, positive, icon }: {
  label: string; value: number; pctChange: string | null; prevLabel?: string;
  color: string; positive?: boolean; icon: React.ReactNode;
}) {
  const isUp = pctChange !== null && parseFloat(pctChange) > 0;
  const isDown = pctChange !== null && parseFloat(pctChange) < 0;
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "18", color }}>{icon}</div>
      </div>
      <p className="font-financial text-2xl font-bold text-[var(--text-primary)]">Rp {formatRupiah(value)}</p>
      {pctChange !== null && (
        <p className={["text-xs mt-2", isUp ? (positive ? "text-success" : "text-danger") : isDown ? (positive ? "text-danger" : "text-success") : "text-[var(--text-secondary)]"].join(" ")}>
          {isUp ? "↑" : isDown ? "↓" : "→"} {Math.abs(parseFloat(pctChange))}%{" "}
          {prevLabel && <span className="text-[var(--text-secondary)]">{prevLabel}</span>}
        </p>
      )}
    </div>
  );
}
