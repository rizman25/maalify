import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TabunganPageClient from "./TabunganPageClient";

export default async function TabunganPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const householdId = membership?.household_id ?? "";
  const userRole = (membership?.role ?? "member") as "super_admin" | "admin" | "member";

  const [goalsRes, walletsRes] = await Promise.all([
    supabase
      .from("savings_goals")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false }),

    supabase
      .from("wallets")
      .select("id, name, type, current_balance")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <TabunganPageClient
      goals={goalsRes.data ?? []}
      wallets={walletsRes.data ?? []}
      householdId={householdId}
      userId={user.id}
      userRole={userRole}
    />
  );
}
