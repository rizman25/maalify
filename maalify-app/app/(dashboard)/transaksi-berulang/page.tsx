import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
  is_private: boolean;
  user_id: string | null;
  created_by: string;
  created_at: string;
  categories: { name: string; icon: string | null; color: string | null } | null;
  wallets: { name: string } | null;
}

export interface PendingItem {
  recurringId: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  scheduledDate: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  categoryName: string;
  walletName: string;
  is_private: boolean;
}

function addDate(from: Date, frequency: string): Date {
  const d = new Date(from);
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1);
  return d;
}

function getPendingDates(item: RecurringItem, today: Date): string[] {
  const todayStr = today.toISOString().split("T")[0];
  const startDate = new Date(item.start_date + "T00:00:00");
  const endDate = item.end_date ? new Date(item.end_date + "T00:00:00") : null;

  let cursor: Date;
  if (item.last_generated) {
    cursor = addDate(new Date(item.last_generated + "T00:00:00"), item.frequency);
  } else {
    cursor = new Date(startDate);
  }

  const dates: string[] = [];
  const MAX = 12;

  while (dates.length < MAX) {
    const dateStr = cursor.toISOString().split("T")[0];
    if (dateStr > todayStr) break;
    if (endDate && cursor > endDate) break;
    dates.push(dateStr);
    cursor = addDate(cursor, item.frequency);
  }

  return dates;
}

export default async function RecurringPage() {
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

  const [recurringRes, walletsRes, catsRes] = await Promise.all([
    supabase
      .from("recurring_transactions")
      .select("id, wallet_id, category_id, type, amount, description, frequency, start_date, end_date, last_generated, is_active, is_private, user_id, created_by, created_at, categories(name, icon, color), wallets(name)")
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

  const recurring = (recurringRes.data ?? []) as unknown as RecurringItem[];
  const today = new Date();

  // Hitung pending items (transaksi terjadwal yang belum dikonfirmasi)
  const pendingItems: PendingItem[] = [];
  for (const item of recurring) {
    if (!item.is_active) continue;
    const dates = getPendingDates(item, today);
    if (dates.length === 0) continue;

    const cat = Array.isArray(item.categories) ? item.categories[0] : item.categories;
    const wallet = Array.isArray(item.wallets) ? item.wallets[0] : item.wallets;

    for (const date of dates) {
      pendingItems.push({
        recurringId: item.id,
        description: item.description,
        type: item.type,
        amount: item.amount,
        scheduledDate: date,
        categoryIcon: (cat as { icon: string | null } | null)?.icon ?? null,
        categoryColor: (cat as { color: string | null } | null)?.color ?? null,
        categoryName: (cat as { name: string } | null)?.name ?? "-",
        walletName: (wallet as { name: string } | null)?.name ?? "-",
        is_private: item.is_private ?? false,
      });
    }
  }

  return (
    <RecurringPageClient
      recurring={recurring}
      pendingItems={pendingItems}
      wallets={walletsRes.data ?? []}
      categories={catsRes.data ?? []}
      householdId={householdId}
      userId={user.id}
      userRole={userRole}
    />
  );
}
