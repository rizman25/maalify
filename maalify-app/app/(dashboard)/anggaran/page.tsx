import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AnggaranPageClient from "./AnggaranPageClient";

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function AnggaranPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const month = parseInt(params.month ?? String(now.getMonth() + 1));
  const year  = parseInt(params.year  ?? String(now.getFullYear()));

  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = `${year}-${pad(month)}-01`;
  const nextM = month === 12 ? 1 : month + 1;
  const nextY = month === 12 ? year + 1 : year;
  const monthEnd = `${nextY}-${pad(nextM)}-01`;

  const { data: membership } = await supabase
    .from("household_members").select("household_id")
    .eq("user_id", user.id).limit(1).single();

  const householdId = membership?.household_id ?? "";

  const [budgetsRes, spendingRes, catsRes] = await Promise.all([
    supabase.from("budgets")
      .select("id, name, amount, category_id, categories(name, icon, color)")
      .eq("household_id", householdId)
      .eq("month", month).eq("year", year),

    supabase.from("transactions")
      .select("amount, category_id")
      .eq("household_id", householdId)
      .eq("type", "expense")
      .gte("date", monthStart).lt("date", monthEnd),

    supabase.from("categories")
      .select("id, name, icon, color")
      .eq("type", "expense")
      .or(`household_id.eq.${householdId},household_id.is.null`)
      .order("is_default", { ascending: false })
      .order("name"),
  ]);

  // Hitung spending per category_id
  const spendMap = new Map<string, number>();
  for (const tx of spendingRes.data ?? []) {
    spendMap.set(tx.category_id, (spendMap.get(tx.category_id) ?? 0) + Number(tx.amount));
  }

  // Gabungkan budget dengan spending
  type BudgetRow = {
    id: string; name: string | null; amount: number; category_id: string;
    categories: { name: string; icon: string | null; color: string | null } | null;
  };
  const budgets = ((budgetsRes.data ?? []) as unknown as BudgetRow[]).map(b => {
    const cat = Array.isArray(b.categories) ? (b.categories as { name: string; icon: string | null; color: string | null }[])[0] : b.categories;
    return {
      id: b.id,
      category_id: b.category_id,
      name: cat?.name ?? "-",
      customName: b.name ?? null,
      icon: cat?.icon ?? "💰",
      color: cat?.color ?? "#94A3B8",
      budget: Number(b.amount),
      spent: spendMap.get(b.category_id) ?? 0,
    };
  });

  // Category yg belum punya budget bulan ini (untuk form tambah)
  const budgetedCatIds = new Set(budgets.map(b => b.category_id));
  const availableCategories = (catsRes.data ?? []).filter(c => !budgetedCatIds.has(c.id));

  return (
    <AnggaranPageClient
      budgets={budgets}
      availableCategories={availableCategories}
      allCategories={catsRes.data ?? []}
      householdId={householdId}
      month={month}
      year={year}
    />
  );
}
