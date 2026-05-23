import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LaporanPageClient from "./LaporanPageClient";

export type Range = "7d" | "1m" | "3m" | "6m" | "1y";
const VALID_RANGES: Range[] = ["7d", "1m", "3m", "6m", "1y"];

export interface PeriodRow {
  label: string;   // "17 Mei" (daily) or "Jan" (monthly)
  income: number;
  expense: number;
  net: number;
}

interface Props {
  searchParams: Promise<{ year?: string; range?: string }>;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

const MONTHS_SHORT  = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const MONTHS_LONG   = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAY_SHORT_ID  = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

export default async function LaporanPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();

  const rangeParam = params.range ?? "1y";
  const range: Range = VALID_RANGES.includes(rangeParam as Range) ? (rangeParam as Range) : "1y";
  const year = parseInt(params.year ?? String(now.getFullYear()));

  // ── Compute start / end dates ──────────────────────────────────────────
  let startDate: string;
  let endDate: string; // exclusive upper bound

  if (range === "7d") {
    const s = new Date(now); s.setDate(s.getDate() - 6);
    startDate = fmtDate(s);
    endDate   = fmtDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  } else if (range === "1m") {
    startDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    endDate   = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  } else if (range === "3m") {
    const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    startDate = fmtDate(s);
    endDate   = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  } else if (range === "6m") {
    const s = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    startDate = fmtDate(s);
    endDate   = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  } else {
    // 1y — full selected year
    startDate = `${year}-01-01`;
    endDate   = `${year + 1}-01-01`;
  }

  // ── Fetch ──────────────────────────────────────────────────────────────
  const { data: membership } = await supabase
    .from("household_members").select("household_id")
    .eq("user_id", user.id).limit(1).single();
  const householdId = membership?.household_id ?? "";

  const { data: household } = householdId
    ? await supabase.from("households").select("name").eq("id", householdId).single()
    : { data: null };

  const [txRes, walletRes] = await Promise.all([
    supabase.from("transactions")
      .select("type, amount, date, category_id, categories(name, icon, color)")
      .eq("household_id", householdId)
      .gte("date", startDate).lt("date", endDate)
      .order("date"),

    supabase.from("wallets")
      .select("name, current_balance, type")
      .eq("household_id", householdId)
      .eq("is_active", true),
  ]);

  const transactions = txRes.data ?? [];

  // ── Totals ─────────────────────────────────────────────────────────────
  const totalIncome  = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalAset    = (walletRes.data ?? []).reduce((s, w) => s + Number(w.current_balance), 0);

  // ── Period data ─────────────────────────────────────────────────────────
  let periodData: PeriodRow[];

  const isDaily = range === "7d" || range === "1m";

  if (isDaily) {
    // Build a map of date → { income, expense }
    const dayMap = new Map<string, { income: number; expense: number }>();

    // Pre-fill all days in range
    const cursor = new Date(startDate);
    const endD   = new Date(endDate);
    while (cursor < endD) {
      dayMap.set(fmtDate(cursor), { income: 0, expense: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const tx of transactions) {
      const entry = dayMap.get(tx.date);
      if (!entry) continue;
      if (tx.type === "income")  entry.income  += Number(tx.amount);
      else                       entry.expense += Number(tx.amount);
    }

    periodData = Array.from(dayMap.entries()).map(([date, val]) => {
      const d = new Date(date + "T00:00:00");
      const day   = d.getDate();
      const month = MONTHS_SHORT[d.getMonth()];
      const dow   = range === "7d" ? DAY_SHORT_ID[d.getDay()] + " " : "";
      return {
        label:   `${dow}${day} ${month}`,
        income:  val.income,
        expense: val.expense,
        net:     val.income - val.expense,
      };
    });
  } else {
    // Monthly grouping
    const monthMap = new Map<string, { label: string; income: number; expense: number }>();

    // Pre-fill months in range
    const sD = new Date(startDate);
    const eD = new Date(endDate);
    const cur = new Date(sD.getFullYear(), sD.getMonth(), 1);
    while (cur < eD) {
      const key = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`;
      const label = range === "1y"
        ? MONTHS_SHORT[cur.getMonth()]
        : `${MONTHS_SHORT[cur.getMonth()]} ${String(cur.getFullYear()).slice(2)}`;
      monthMap.set(key, { label, income: 0, expense: 0 });
      cur.setMonth(cur.getMonth() + 1);
    }

    for (const tx of transactions) {
      const key = tx.date.substring(0, 7); // "YYYY-MM"
      const entry = monthMap.get(key);
      if (!entry) continue;
      if (tx.type === "income")  entry.income  += Number(tx.amount);
      else                       entry.expense += Number(tx.amount);
    }

    periodData = Array.from(monthMap.values()).map(v => ({
      label:   v.label,
      income:  v.income,
      expense: v.expense,
      net:     v.income - v.expense,
    }));
  }

  // ── Category breakdown ─────────────────────────────────────────────────
  const catMap = new Map<string, { name: string; icon: string; color: string; amount: number }>();
  for (const tx of transactions.filter(t => t.type === "expense")) {
    const cats = tx.categories as { name: string; icon: string; color: string } | { name: string; icon: string; color: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    if (!cat) continue;
    const ex = catMap.get(cat.name);
    if (ex) ex.amount += Number(tx.amount);
    else catMap.set(cat.name, { name: cat.name, icon: cat.icon ?? "💰", color: cat.color ?? "#94A3B8", amount: Number(tx.amount) });
  }
  const categoryExpense = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount);

  const incCatMap = new Map<string, { name: string; icon: string; color: string; amount: number }>();
  for (const tx of transactions.filter(t => t.type === "income")) {
    const cats = tx.categories as { name: string; icon: string; color: string } | { name: string; icon: string; color: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    if (!cat) continue;
    const ex = incCatMap.get(cat.name);
    if (ex) ex.amount += Number(tx.amount);
    else incCatMap.set(cat.name, { name: cat.name, icon: cat.icon ?? "💰", color: cat.color ?? "#94A3B8", amount: Number(tx.amount) });
  }
  const categoryIncome = Array.from(incCatMap.values()).sort((a, b) => b.amount - a.amount);

  // ── Range label for display ────────────────────────────────────────────
  const rangeLabel =
    range === "7d" ? "7 Hari Terakhir" :
    range === "1m" ? `${MONTHS_LONG[now.getMonth()]} ${now.getFullYear()}` :
    range === "3m" ? "3 Bulan Terakhir" :
    range === "6m" ? "6 Bulan Terakhir" :
    `Tahun ${year}`;

  return (
    <LaporanPageClient
      range={range}
      year={year}
      rangeLabel={rangeLabel}
      periodData={periodData}
      isDaily={isDaily}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      totalAset={totalAset}
      categoryExpense={categoryExpense}
      categoryIncome={categoryIncome}
      householdId={householdId}
      householdName={household?.name ?? "Keluarga"}
    />
  );
}
