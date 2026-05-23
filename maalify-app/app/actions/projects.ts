"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function saveProjectItem(payload: {
  projectId: string;
  itemId?: string;
  name: string;
  plannedAmount: number;
  isPaid: boolean;
  actualAmount: number | null;
  paidAt: string | null;
  userId: string;
}): Promise<{ success?: true; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();

  // Fetch project for wallet + household info
  const { data: project } = await svc
    .from("projects")
    .select("id, wallet_id, household_id")
    .eq("id", payload.projectId)
    .single();

  if (!project) return { error: "Project tidak ditemukan." };

  const spentAmount =
    payload.isPaid && payload.actualAmount && payload.actualAmount > 0
      ? payload.actualAmount
      : payload.plannedAmount;

  const itemData = {
    name: payload.name,
    planned_amount: payload.plannedAmount,
    is_paid: payload.isPaid,
    actual_amount: payload.isPaid && payload.actualAmount && payload.actualAmount > 0
      ? payload.actualAmount
      : null,
    paid_at: payload.isPaid ? payload.paidAt : null,
  };

  // ── Edit existing item ──
  if (payload.itemId) {
    const { data: existing } = await svc
      .from("project_items")
      .select("id, is_paid, transaction_id")
      .eq("id", payload.itemId)
      .single();

    const { error: updateErr } = await svc
      .from("project_items")
      .update(itemData)
      .eq("id", payload.itemId);

    if (updateErr) return { error: updateErr.message };

    // Newly marked as paid → record transaction + deduct wallet
    const wasAlreadyPaid = existing?.is_paid ?? false;
    const hasExistingTxn = existing?.transaction_id != null;

    if (payload.isPaid && !wasAlreadyPaid && !hasExistingTxn && project.wallet_id) {
      await recordPaymentTransaction({
        svc,
        projectId: payload.projectId,
        householdId: project.household_id,
        walletId: project.wallet_id,
        userId: payload.userId,
        itemId: payload.itemId,
        itemName: payload.name,
        amount: spentAmount,
        date: payload.paidAt ?? new Date().toISOString().split("T")[0],
      });
    }
  } else {
    // ── Insert new item ──
    const { data: inserted, error: insertErr } = await svc
      .from("project_items")
      .insert({
        ...itemData,
        project_id: payload.projectId,
        created_by: payload.userId,
        sort_order: 0,
      })
      .select("id")
      .single();

    if (insertErr) return { error: insertErr.message };

    // If inserted already marked as paid → record transaction + deduct wallet
    if (payload.isPaid && project.wallet_id && inserted) {
      await recordPaymentTransaction({
        svc,
        projectId: payload.projectId,
        householdId: project.household_id,
        walletId: project.wallet_id,
        userId: payload.userId,
        itemId: inserted.id,
        itemName: payload.name,
        amount: spentAmount,
        date: payload.paidAt ?? new Date().toISOString().split("T")[0],
      });
    }
  }

  return { success: true };
}

async function recordPaymentTransaction(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svc: any;
  projectId: string;
  householdId: string;
  walletId: string;
  userId: string;
  itemId: string;
  itemName: string;
  amount: number;
  date: string;
}) {
  const { svc, householdId, walletId, userId, itemId, itemName, amount, date } = params;

  // Find a usable expense category (household-specific first, then global default)
  let categoryId: string | null = null;
  const { data: hhCats } = await svc
    .from("categories")
    .select("id")
    .eq("household_id", householdId)
    .eq("type", "expense")
    .limit(1);
  if (hhCats && hhCats.length > 0) {
    categoryId = hhCats[0].id;
  } else {
    const { data: defCats } = await svc
      .from("categories")
      .select("id")
      .is("household_id", null)
      .eq("type", "expense")
      .limit(1);
    categoryId = defCats?.[0]?.id ?? null;
  }

  if (!categoryId) return; // Can't create transaction without a category

  // Create the expense transaction
  const { data: txn } = await svc
    .from("transactions")
    .insert({
      household_id: householdId,
      wallet_id: walletId,
      category_id: categoryId,
      user_id: userId,
      type: "expense",
      amount,
      description: itemName,
      date,
      visibility: "shared",
    })
    .select("id")
    .single();

  if (!txn) return;

  // Link transaction back to the project item
  await svc
    .from("project_items")
    .update({ transaction_id: txn.id })
    .eq("id", itemId);

  // Deduct wallet balance
  const { data: wallet } = await svc
    .from("wallets")
    .select("current_balance")
    .eq("id", walletId)
    .single();

  if (wallet) {
    await svc
      .from("wallets")
      .update({ current_balance: Math.max(0, wallet.current_balance - amount) })
      .eq("id", walletId);
  }
}

/**
 * Backfill: for any paid item with no transaction_id yet, create the expense
 * transaction and deduct the project wallet. Safe to call multiple times —
 * it only processes items where transaction_id IS NULL.
 */
export async function syncProjectPaidItems(
  projectId: string
): Promise<{ synced: number; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { synced: 0, error: "Sesi tidak valid." };

  const svc = service();

  const { data: project } = await svc
    .from("projects")
    .select("id, wallet_id, household_id")
    .eq("id", projectId)
    .single();

  if (!project || !project.wallet_id) return { synced: 0 };

  // Only items that are paid but have no transaction yet
  const { data: items } = await svc
    .from("project_items")
    .select("id, name, planned_amount, actual_amount, paid_at")
    .eq("project_id", projectId)
    .eq("is_paid", true)
    .is("transaction_id", null);

  if (!items || items.length === 0) return { synced: 0 };

  let synced = 0;
  for (const item of items) {
    const amount = item.actual_amount ?? item.planned_amount;
    const date = item.paid_at ?? new Date().toISOString().split("T")[0];
    await recordPaymentTransaction({
      svc,
      projectId,
      householdId: project.household_id,
      walletId: project.wallet_id,
      userId: user.id,
      itemId: item.id,
      itemName: item.name,
      amount,
      date,
    });
    synced++;
  }

  return { synced };
}

export async function deleteProjectItem(itemId: string): Promise<{ success?: true; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();
  const { error } = await svc.from("project_items").delete().eq("id", itemId);
  if (error) return { error: error.message };
  return { success: true };
}
