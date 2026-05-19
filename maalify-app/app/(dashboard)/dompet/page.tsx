import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Wallet } from "@/types";
import WalletPageClient from "./WalletPageClient";

export interface TransferRecord {
  id: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  from_wallet: { id: string; name: string } | null;
  to_wallet: { id: string; name: string } | null;
}

export default async function DompetPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const householdId = membership?.household_id ?? "";
  const userRole = (membership?.role ?? "member") as "super_admin" | "admin" | "member";

  const [activeRes, inactiveRes, transfersRes] = await Promise.all([
    supabase
      .from("wallets")
      .select("*")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("created_at"),

    supabase
      .from("wallets")
      .select("*")
      .eq("household_id", householdId)
      .eq("is_active", false)
      .order("created_at"),

    supabase
      .from("transfers")
      .select("id, amount, description, date, created_at, from_wallet:from_wallet_id(id, name), to_wallet:to_wallet_id(id, name)")
      .eq("household_id", householdId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return (
    <WalletPageClient
      wallets={(activeRes.data ?? []) as Wallet[]}
      inactiveWallets={(inactiveRes.data ?? []) as Wallet[]}
      transfers={(transfersRes.data ?? []) as unknown as TransferRecord[]}
      householdId={householdId}
      userId={user.id}
      userRole={userRole}
    />
  );
}
