import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Wallet, Category, TransactionWithCategory } from "@/types";
import TransaksiPageClient from "./TransaksiPageClient";

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function TransaksiPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = new Date();
  const month = parseInt(params.month ?? String(now.getMonth() + 1));
  const year = parseInt(params.year ?? String(now.getFullYear()));

  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const householdId = membership?.household_id ?? "";

  const [txRes, walletsRes, catsRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, categories(name, icon, color), wallets(name), users(name)")
      .eq("household_id", householdId)
      .gte("date", monthStart)
      .lt("date", monthEnd)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("wallets")
      .select("id, name, type, color, current_balance")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("created_at"),

    supabase
      .from("categories")
      .select("id, name, type, icon, color")
      .or(`household_id.eq.${householdId},household_id.is.null`)
      .order("is_default", { ascending: false })
      .order("name"),
  ]);

  return (
    <TransaksiPageClient
      transactions={(txRes.data ?? []) as TransactionWithCategory[]}
      wallets={(walletsRes.data ?? []) as Wallet[]}
      categories={(catsRes.data ?? []) as Category[]}
      householdId={householdId}
      userId={user.id}
      month={month}
      year={year}
    />
  );
}
