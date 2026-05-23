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
  payload: { name: string; color: string; is_shared: boolean; current_balance: number }
): Promise<{ success?: true; error?: string }> {
  const check = await verifyWalletAccess(walletId);
  if (check.error) return { error: check.error };

  const { error } = await service()
    .from("wallets")
    .update({ name: payload.name, color: payload.color, is_shared: payload.is_shared, current_balance: payload.current_balance })
    .eq("id", walletId);

  if (error) return { error: error.message };
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
