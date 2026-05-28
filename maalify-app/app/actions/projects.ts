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
      // First time paid — create new transaction
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
    } else if (payload.isPaid && wasAlreadyPaid && hasExistingTxn && project.wallet_id) {
      // Already paid — UPDATE the existing transaction so wallet balance stays in sync.
      // The DB trigger (trg_update_balance_on_update) automatically adjusts wallet balance
      // when amount changes: reverses old amount, applies new amount.
      const updateFields: Record<string, unknown> = {
        amount: spentAmount,
        description: payload.name,
      };
      if (payload.paidAt) updateFields.date = payload.paidAt;
      await svc
        .from("transactions")
        .update(updateFields)
        .eq("id", existing.transaction_id);
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

  // Create the expense transaction with project_item_id for traceability
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
      project_item_id: itemId,
    })
    .select("id")
    .single();

  if (!txn) return;

  // Link transaction back to the project item (latest transaction pointer)
  await svc
    .from("project_items")
    .update({ transaction_id: txn.id })
    .eq("id", itemId);

  // NOTE: wallet balance is updated automatically by the DB trigger
  // trg_update_balance_on_insert on the transactions table.
  // Do NOT manually update current_balance here — that would double-deduct.
}

/**
 * Edit deskripsi / tanggal sebuah project expense transaction.
 */
export async function editProjectExpenseTx(payload: {
  txId: string;
  description: string;
  date: string;
  attachmentUrl?: string | null;
}): Promise<{ success?: true; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();
  const updates: Record<string, unknown> = {
    description: payload.description,
    date: payload.date,
  };
  if (payload.attachmentUrl !== undefined) updates.attachment_url = payload.attachmentUrl;

  const { error } = await svc.from("transactions").update(updates).eq("id", payload.txId);
  if (error) return { error: error.message };
  // Also update project_item paid_at if this is linked
  if (payload.date) {
    await svc.from("project_items")
      .update({ paid_at: payload.date })
      .eq("transaction_id", payload.txId);
  }
  return { success: true };
}

/**
 * Hapus project expense transaction dan update actual_amount item terkait.
 */
export async function deleteProjectExpenseTx(
  txId: string
): Promise<{ success?: true; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();

  // Fetch transaction details
  const { data: tx } = await svc
    .from("transactions")
    .select("id, amount, project_item_id")
    .eq("id", txId)
    .single();

  if (!tx) return { error: "Transaksi tidak ditemukan." };

  // Find linked item — check BOTH project_item_id on the transaction
  // AND transaction_id on project_items (for old transactions created before
  // the project_item_id column existed).
  const itemId = tx.project_item_id ?? null;

  // Also look up via reverse FK in case project_item_id is NULL on the transaction
  let resolvedItemId = itemId;
  if (!resolvedItemId) {
    const { data: itemByTxn } = await svc
      .from("project_items")
      .select("id")
      .eq("transaction_id", txId)
      .maybeSingle();
    resolvedItemId = itemByTxn?.id ?? null;
  }

  if (resolvedItemId) {
    const { data: item } = await svc
      .from("project_items")
      .select("id, actual_amount, planned_amount, is_paid")
      .eq("id", resolvedItemId)
      .single();

    if (item) {
      const prevActual = Number(item.actual_amount ?? 0);
      const newActual  = Math.max(0, prevActual - Number(tx.amount));
      await svc.from("project_items").update({
        actual_amount: newActual > 0 ? newActual : null,
        is_paid: newActual >= Number(item.planned_amount),
        // Always clear transaction_id to remove the FK reference before delete
        ...(newActual === 0
          ? { paid_at: null, transaction_id: null }
          : { transaction_id: null }),
      }).eq("id", item.id);
    }
  }

  // Also clear any other project_items that still reference this transaction
  // (safety net for orphaned FK references)
  await svc
    .from("project_items")
    .update({ transaction_id: null })
    .eq("transaction_id", txId);

  // Delete transaction — wallet balance auto-adjusts via DB trigger
  const { error } = await svc.from("transactions").delete().eq("id", txId);
  if (error) return { error: error.message };

  return { success: true };
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

/**
 * Catat pembayaran termin/cicilan untuk satu project item.
 * - Membuat expense transaction dari project wallet
 * - Menambah actual_amount item secara kumulatif
 * - Auto-lunas jika actual_amount >= planned_amount
 */
export async function payProjectItem(payload: {
  itemId: string;
  amount: number;
  date: string;
  note: string | null;
  userId: string;
}): Promise<{ success?: true; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();

  // Fetch item + project
  const { data: item } = await svc
    .from("project_items")
    .select("id, name, planned_amount, actual_amount, is_paid, project_id")
    .eq("id", payload.itemId)
    .single();

  if (!item) return { error: "Item tidak ditemukan." };

  const { data: project } = await svc
    .from("projects")
    .select("id, wallet_id, household_id")
    .eq("id", item.project_id)
    .single();

  if (!project || !project.wallet_id) return { error: "Project wallet tidak ditemukan." };

  // Hitung actual_amount baru (kumulatif)
  const prevActual = Number(item.actual_amount ?? 0);
  const newActual  = prevActual + payload.amount;
  const isNowPaid  = newActual >= Number(item.planned_amount);

  // Buat expense transaction dari project wallet
  await recordPaymentTransaction({
    svc,
    projectId: project.id,
    householdId: project.household_id,
    walletId: project.wallet_id,
    userId: payload.userId,
    itemId: payload.itemId,
    itemName: payload.note ? `${item.name} — ${payload.note}` : item.name,
    amount: payload.amount,
    date: payload.date,
  });

  // Update item
  await svc.from("project_items").update({
    actual_amount: newActual,
    is_paid: isNowPaid || item.is_paid, // jangan un-pay
    paid_at: isNowPaid ? payload.date : (item.is_paid ? undefined : payload.date),
  }).eq("id", payload.itemId);

  return { success: true };
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
