import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Wallet } from "@/types";
import WalletPageClient from "./WalletPageClient";

export default async function DompetPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const householdId = membership?.household_id ?? "";

  const { data: wallets } = await supabase
    .from("wallets")
    .select("*")
    .eq("household_id", householdId)
    .eq("is_active", true)
    .order("created_at");

  return (
    <WalletPageClient
      wallets={(wallets ?? []) as Wallet[]}
      householdId={householdId}
      userId={user.id}
    />
  );
}
