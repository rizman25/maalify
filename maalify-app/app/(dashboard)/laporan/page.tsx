import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LaporanPageClient from "./LaporanPageClient";

interface Props {
  searchParams: Promise<{ year?: string }>;
}

export default async function LaporanPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()));

  const { data: membership } = await supabase
    .from("household_members").select("household_id")
    .eq("user_id", user.id).limit(1).single();

  const householdId = membership?.household_id ?? "";

  const yearStart = `${year}-01-01`;
  const yearEnd   = `${year + 1}-01-01`;

  const [txRes, catRes, walletRes] = await Promise.all([
    // All transactions for the year
    supabase.from("transactions")
      .select("type, amount, date, category_id, categories(name, icon, color)")
      .eq("household_id", householdId)
      .gte("date", yearStart).lt("date", yearEnd)
      .order("date"),

    // Categories for label
    supabase.from("categories")
      .select("id, name, icon, color, type")
      .or(`household_id.eq.${householdId},household_id.is.null`),

    // Wallets current balance
    supabase.from("wallets")
      .select("name, current_balance, type")
      .eq("household_id", householdId)
      .eq("is_active", true),
  ]);

  const transactions = txRes.data ?? [];
  const pad = (n: number) => String(n).padStart(2, "0");

  // Monthly breakdown
  const monthlyMap = new Map<number, { income: number; expense: number }>();
  for (let m = 1; m <= 12; m++) monthlyMap.set(m, { income: 0, expense: 0 });

  for (const tx of transactions) {
    const m = parseInt(tx.date.substring(5, 7));
    const entry = monthlyMap.get(m)!;
    if (tx.type === "income") entry.income += Number(tx.amount);
    else entry.expense += Number(tx.amount);
  }

  const monthlyData = Array.from(monthlyMap.entries()).map(([month, val]) => ({
    month,
    label: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][month - 1],
    ...val,
    net: val.income - val.expense,
  }));

  // Totals
  const totalIncome  = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  // Category spending breakdown (expense only)
  type TxRow = typeof transactions[0];
  const catMap = new Map<string, { name: string; icon: string; color: string; amount: number }>();
  for (const tx of transactions.filter(t => t.type === "expense")) {
    const cats = tx.categories as { name: string; icon: string; color: string } | { name: string; icon: string; color: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    if (!cat) continue;
    const key = cat.name;
    const ex = catMap.get(key);
    if (ex) ex.amount += Number(tx.amount);
    else catMap.set(key, { name: cat.name, icon: cat.icon ?? "💰", color: cat.color ?? "#94A3B8", amount: Number(tx.amount) });
  }
  const categoryExpense = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount);

  // Income category breakdown
  const incCatMap = new Map<string, { name: string; icon: string; color: string; amount: number }>();
  for (const tx of transactions.filter(t => t.type === "income")) {
    const cats = tx.categories as { name: string; icon: string; color: string } | { name: string; icon: string; color: string }[] | null;
    const cat = Array.isArray(cats) ? cats[0] : cats;
    if (!cat) continue;
    const key = cat.name;
    const ex = incCatMap.get(key);
    if (ex) ex.amount += Number(tx.amount);
    else incCatMap.set(key, { name: cat.name, icon: cat.icon ?? "💰", color: cat.color ?? "#94A3B8", amount: Number(tx.amount) });
  }
  const categoryIncome = Array.from(incCatMap.values()).sort((a, b) => b.amount - a.amount);

  // Total aset
  const totalAset = (walletRes.data ?? []).reduce((s, w) => s + Number(w.current_balance), 0);

  return (
    <LaporanPageClient
      year={year}
      monthlyData={monthlyData}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      totalAset={totalAset}
      categoryExpense={categoryExpense}
      categoryIncome={categoryIncome}
      householdId={householdId}
    />
  );
}
