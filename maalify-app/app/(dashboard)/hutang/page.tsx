import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HutangPageClient from "./HutangPageClient";

export default async function HutangPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members").select("household_id")
    .eq("user_id", user.id).limit(1).single();

  const householdId = membership?.household_id ?? "";

  const [debtsRes, walletsRes] = await Promise.all([
    supabase.from("debts")
      .select("id, type, party_name, total_amount, remaining_amount, due_date, description, status, created_at, user_id, installment_months")
      .eq("household_id", householdId)
      .order("status")
      .order("due_date", { ascending: true, nullsFirst: false }),

    supabase.from("wallets")
      .select("id, name, type, current_balance")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <HutangPageClient
      debts={debtsRes.data ?? []}
      wallets={walletsRes.data ?? []}
      householdId={householdId}
      userId={user.id}
    />
  );
}
