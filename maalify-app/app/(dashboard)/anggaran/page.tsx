import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AnggaranPageClient from "./AnggaranPageClient";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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
    .from("household_members").select("household_id, role")
    .eq("user_id", user.id).limit(1).single();

  const householdId = membership?.household_id ?? "";
  const userRole = (membership?.role ?? "member") as "super_admin" | "admin" | "member";

  const [budgetsRes, spendingRes, catsRes] = await Promise.all([
    supabase.from("budgets")
      .select("id, name, amount, category_id, is_recurring, categories(name, icon, color)")
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

  // Auto-propagate recurring budgets from any previous month if not yet present this month
  const currentCatIds = new Set((budgetsRes.data ?? []).map(b => b.category_id));
  const svc = service();
  const { data: recurringBudgets } = await svc
    .from("budgets")
    .select("category_id, amount, name, is_recurring")
    .eq("household_id", householdId)
    .eq("is_recurring", true)
    .lt("year", year)
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  // Also check recurring from earlier months in the same year
  const { data: recurringBudgetsSameYear } = await svc
    .from("budgets")
    .select("category_id, amount, name, is_recurring")
    .eq("household_id", householdId)
    .eq("is_recurring", true)
    .eq("year", year)
    .lt("month", month)
    .order("month", { ascending: false });

  const allRecurring = [...(recurringBudgetsSameYear ?? []), ...(recurringBudgets ?? [])];
  const seenCats = new Set<string>();
  const toCreate: { category_id: string; amount: number; name: string | null }[] = [];
  for (const rb of allRecurring) {
    if (!currentCatIds.has(rb.category_id) && !seenCats.has(rb.category_id)) {
      seenCats.add(rb.category_id);
      toCreate.push({ category_id: rb.category_id, amount: rb.amount, name: rb.name });
    }
  }
  if (toCreate.length > 0) {
    await svc.from("budgets").insert(
      toCreate.map(b => ({
        household_id: householdId,
        category_id: b.category_id,
        amount: b.amount,
        name: b.name,
        month,
        year,
        period: "monthly",
        is_recurring: true,
      }))
    );
    // Re-fetch after auto-create
    const { data: refreshed } = await svc
      .from("budgets")
      .select("id, name, amount, category_id, is_recurring, categories(name, icon, color)")
      .eq("household_id", householdId)
      .eq("month", month).eq("year", year);
    budgetsRes.data = refreshed;
  }

  // Hitung spending per category_id
  const spendMap = new Map<string, number>();
  for (const tx of spendingRes.data ?? []) {
    spendMap.set(tx.category_id, (spendMap.get(tx.category_id) ?? 0) + Number(tx.amount));
  }

  // Gabungkan budget dengan spending
  type BudgetRow = {
    id: string; name: string | null; amount: number; category_id: string;
    is_recurring: boolean;
    categories: { name: string; icon: string | null; color: string | null } | null;
  };
  const budgets = ((budgetsRes.data ?? []) as unknown as BudgetRow[]).map(b => {
    const cat = Array.isArray(b.categories) ? (b.categories as { name: string; icon: string | null; color: string | null }[])[0] : b.categories;
    return {
      id: b.id,
      category_id: b.category_id,
      name: cat?.name ?? "-",
      customName: b.name ?? null,
      icon: cat?.icon ?? "coins",
      color: cat?.color ?? "#94A3B8",
      budget: Number(b.amount),
      spent: spendMap.get(b.category_id) ?? 0,
      isRecurring: b.is_recurring ?? false,
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
      userRole={userRole}
    />
  );
}
