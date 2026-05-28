"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Verifikasi user adalah admin/super_admin di household yang memiliki wallet */
async function verifyWalletAccess(walletId: string) {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();

  const { data: wallet } = await svc
    .from("wallets")
    .select("id, household_id")
    .eq("id", walletId)
    .single();

  if (!wallet) return { error: "Dompet tidak ditemukan." };

  const { data: mem } = await svc
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", wallet.household_id)
    .single();

  if (!mem || (mem.role !== "admin" && mem.role !== "super_admin")) {
    return { error: "Tidak memiliki izin untuk mengubah dompet ini." };
  }

  return { wallet, userId: user.id };
}

export async function updateWallet(
  walletId: string,
  payload: {
    name: string;
    color: string;
    is_shared: boolean;
    current_balance: number;
    old_balance: number;
    reason?: string;
  }
): Promise<{ success?: true; error?: string }> {
  const check = await verifyWalletAccess(walletId);
  if (check.error) return { error: check.error };

  const svc = service();
  const diff = payload.current_balance - payload.old_balance;

  // Update metadata (name, color, is_shared)
  // current_balance handled below: via transaction trigger if diff ≠ 0, or directly if diff = 0
  const { error } = await svc
    .from("wallets")
    .update({
      name: payload.name,
      color: payload.color,
      is_shared: payload.is_shared,
      ...(diff === 0 ? { current_balance: payload.current_balance } : {}),
    })
    .eq("id", walletId);

  if (error) return { error: error.message };

  // Catat ke history
  await svc.from("wallet_edit_history").insert({
    wallet_id: walletId,
    user_id: check.userId,
    old_balance: payload.old_balance,
    new_balance: payload.current_balance,
    reason: payload.reason?.trim() || null,
  });

  // Jika saldo berubah → buat transaksi income/expense agar muncul di riwayat
  if (diff !== 0) {
    const householdId = check.wallet.household_id;
    const type = diff > 0 ? "income" : "expense";
    const amount = Math.abs(diff);

    // Cari kategori yang sesuai (household-specific dulu, lalu global default)
    let categoryId: string | null = null;
    const { data: hhCats } = await svc
      .from("categories")
      .select("id")
      .eq("household_id", householdId)
      .eq("type", type)
      .limit(1);
    if (hhCats && hhCats.length > 0) {
      categoryId = hhCats[0].id;
    } else {
      const { data: defCats } = await svc
        .from("categories")
        .select("id")
        .is("household_id", null)
        .eq("type", type)
        .limit(1);
      categoryId = defCats?.[0]?.id ?? null;
    }

    const description = payload.reason?.trim()
      ? `Penyesuaian Saldo: ${payload.reason.trim()}`
      : "Penyesuaian Saldo";

    if (categoryId) {
      // Insert transaction → DB trigger (trg_update_balance_on_insert) auto-adjusts wallet balance
      await svc.from("transactions").insert({
        household_id: householdId,
        wallet_id: walletId,
        category_id: categoryId,
        user_id: check.userId,
        type,
        amount,
        description,
        date: new Date().toISOString().split("T")[0],
        visibility: "shared",
      });
    }

    // Ensure exact balance (handles drift or missing category case)
    await svc
      .from("wallets")
      .update({ current_balance: payload.current_balance })
      .eq("id", walletId);
  }

  return { success: true };
}

export async function getWalletHistory(walletId: string): Promise<{
  data?: { id: string; old_balance: number; new_balance: number; reason: string | null; edited_at: string; users: { name: string } | null }[];
  error?: string;
}> {
  const check = await verifyWalletAccess(walletId);
  if (check.error) return { error: check.error };

  const { data, error } = await service()
    .from("wallet_edit_history")
    .select("id, old_balance, new_balance, reason, edited_at, users(name)")
    .eq("wallet_id", walletId)
    .order("edited_at", { ascending: false })
    .limit(20);

  if (error) return { error: error.message };
  return { data: data as unknown as { id: string; old_balance: number; new_balance: number; reason: string | null; edited_at: string; users: { name: string } | null }[] };
}

export async function saveTransfer(payload: {
  householdId: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  adminFee: number;
  description?: string;
  date: string;
  userId: string;
}): Promise<{ success?: true; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const svc = service();

  // Verifikasi membership
  const { data: mem } = await svc
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", payload.householdId)
    .single();
  if (!mem) return { error: "Tidak memiliki akses." };

  // Cek saldo cukup (amount + admin_fee)
  const { data: fromWallet } = await svc
    .from("wallets")
    .select("current_balance")
    .eq("id", payload.fromWalletId)
    .single();
  if (!fromWallet) return { error: "Dompet asal tidak ditemukan." };

  const totalDeduct = payload.amount + payload.adminFee;
  if (Number(fromWallet.current_balance) < totalDeduct) {
    return { error: "Saldo dompet asal tidak cukup (termasuk biaya admin)." };
  }

  // Insert transfer — DB trigger (handle_transfer_balance) atomically updates:
  //   from_wallet: current_balance -= amount + admin_fee
  //   to_wallet:   current_balance += amount
  // No manual balance update needed here.
  const { error: txErr } = await svc.from("transfers").insert({
    household_id: payload.householdId,
    from_wallet_id: payload.fromWalletId,
    to_wallet_id: payload.toWalletId,
    amount: payload.amount,
    admin_fee: payload.adminFee,
    description: payload.description?.trim() || null,
    date: payload.date,
    user_id: payload.userId,
  });
  if (txErr) return { error: txErr.message };

  return { success: true };
}

export async function deleteWallet(walletId: string): Promise<{ success?: true; error?: string }> {
  const check = await verifyWalletAccess(walletId);
  if (check.error) return { error: check.error };

  const { error } = await service().from("wallets").delete().eq("id", walletId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function deactivateWallet(walletId: string): Promise<{ success?: true; error?: string }> {
  const check = await verifyWalletAccess(walletId);
  if (check.error) return { error: check.error };

  const { error } = await service().from("wallets").update({ is_active: false }).eq("id", walletId);
  if (error) return { error: error.message };
  return { success: true };
}

export async function activateWallet(walletId: string): Promise<{ success?: true; error?: string }> {
  const check = await verifyWalletAccess(walletId);
  if (check.error) return { error: check.error };

  const { error } = await service().from("wallets").update({ is_active: true }).eq("id", walletId);
  if (error) return { error: error.message };
  return { success: true };
}
