"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyRecurringAccess(recurringId: string) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();
  const { data: rec } = await svc
    .from("recurring_transactions")
    .select("id, household_id")
    .eq("id", recurringId)
    .single();

  if (!rec) return { error: "Transaksi berulang tidak ditemukan." };

  const { data: mem } = await svc
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", rec.household_id)
    .single();

  if (!mem || mem.role === "member") {
    return { error: "Tidak memiliki izin." };
  }

  return { rec, userId: user.id };
}

export async function toggleRecurringActive(
  recurringId: string,
  isActive: boolean
): Promise<{ success?: true; error?: string }> {
  const check = await verifyRecurringAccess(recurringId);
  if (check.error) return { error: check.error };

  const { error } = await service()
    .from("recurring_transactions")
    .update({ is_active: isActive })
    .eq("id", recurringId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteRecurring(
  recurringId: string
): Promise<{ success?: true; error?: string }> {
  const check = await verifyRecurringAccess(recurringId);
  if (check.error) return { error: check.error };

  const { error } = await service()
    .from("recurring_transactions")
    .delete()
    .eq("id", recurringId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function saveRecurring(payload: {
  recurringId?: string; // undefined = insert
  householdId: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryId: string;
  walletId: string;
  frequency: "daily" | "weekly" | "monthly";
  startDate: string;
  endDate: string | null;
}): Promise<{ success?: true; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();

  // Verify membership
  const { data: mem } = await svc
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", payload.householdId)
    .single();

  if (!mem || mem.role === "member") {
    return { error: "Tidak memiliki izin." };
  }

  const data = {
    type: payload.type,
    amount: payload.amount,
    description: payload.description,
    category_id: payload.categoryId,
    wallet_id: payload.walletId,
    frequency: payload.frequency,
    start_date: payload.startDate,
    end_date: payload.endDate,
  };

  if (payload.recurringId) {
    const { error } = await svc
      .from("recurring_transactions")
      .update(data)
      .eq("id", payload.recurringId);
    if (error) return { error: error.message };
  } else {
    const { error } = await svc
      .from("recurring_transactions")
      .insert({ ...data, household_id: payload.householdId, created_by: payload.userId, is_active: true });
    if (error) return { error: error.message };
  }

  return { success: true };
}
