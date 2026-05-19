import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateRecurringTransactions } from "@/lib/generateRecurring";
import RecurringPageClient from "./RecurringPageClient";

export interface RecurringItem {
  id: string;
  wallet_id: string;
  category_id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  start_date: string;
  end_date: string | null;
  last_generated: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  categories: { name: string; icon: string | null; color: string | null } | null;
  wallets: { name: string } | null;
}

export default async function RecurringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const householdId = membership?.household_id ?? "";

  // Auto-generate pending recurring transactions
  const generated = await generateRecurringTransactions(supabase, householdId);

  const [recurringRes, walletsRes, catsRes] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select("id, wallet_id, category_id, type, amount, description, frequency, start_date, end_date, last_generated, is_active, created_by, created_at, categories(name, icon, color), wallets(name)")
      .eq("household_id", householdId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("wallets")
      .select("id, name, type, current_balance")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("name"),

    supabase
      .from("categories")
      .select("id, name, icon, color, type")
      .or(`household_id.eq.${householdId},household_id.is.null`)
      .order("is_default", { ascending: false })
      .order("name"),
  ]);

  return (
    <RecurringPageClient
      recurring={(recurringRes.data ?? []) as unknown as RecurringItem[]}
      wallets={walletsRes.data ?? []}
      categories={catsRes.data ?? []}
      householdId={householdId}
      userId={user.id}
      justGenerated={generated}
    />
  );
}
