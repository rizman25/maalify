"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  member: "Member",
};

/**
 * Ubah role anggota household.
 * Menggunakan service role key untuk bypass RLS.
 * Mengirim notifikasi ke target user via user_notifications table.
 */
export async function changeMemberRole(
  membershipId: string,
  newRole: string,
  actorName: string
): Promise<{ success?: true; targetName?: string; roleLabelNew?: string; error?: string }> {

  // 1. Verifikasi sesi
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const validRoles = ["member", "admin", "super_admin"];
  if (!validRoles.includes(newRole)) return { error: "Role tidak valid." };

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Ambil data membership yang akan diubah
  const { data: target, error: targetErr } = await service
    .from("household_members")
    .select("id, user_id, role, household_id")
    .eq("id", membershipId)
    .single();

  if (targetErr || !target) return { error: "Anggota tidak ditemukan." };

  // 3. Verifikasi actor ada di household yang sama dengan role yang cukup
  const { data: actorMem, error: actorErr } = await service
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", target.household_id)
    .single();

  if (actorErr || !actorMem) return { error: "Kamu bukan anggota household ini." };

  const isSuperAdmin = actorMem.role === "super_admin";
  const isAdmin = actorMem.role === "admin" || isSuperAdmin;

  if (!isAdmin) return { error: "Tidak memiliki izin untuk mengubah role." };
  if (!isSuperAdmin && newRole === "super_admin") {
    return { error: "Hanya Super Admin yang bisa mengangkat Super Admin baru." };
  }
  if (actorMem.role === "admin" && target.role === "super_admin") {
    return { error: "Admin tidak bisa mengubah role Super Admin." };
  }

  // 4. Lakukan update dengan service role key (bypass RLS)
  const { error: updateErr } = await service
    .from("household_members")
    .update({ role: newRole })
    .eq("id", membershipId);

  if (updateErr) return { error: updateErr.message };

  // 5. Ambil nama target user dan nama household untuk notifikasi
  const [targetUserRes, householdRes] = await Promise.all([
    service.from("users").select("name").eq("id", target.user_id).single(),
    service.from("households").select("name").eq("id", target.household_id).single(),
  ]);

  const targetName = targetUserRes.data?.name ?? "Anggota";
  const householdName = householdRes.data?.name ?? "Family";
  const roleLabelNew = ROLE_LABEL[newRole] ?? newRole;

  // 6. Kirim notifikasi ke target user (graceful — tidak gagal jika tabel belum ada)
  try {
    await service.from("user_notifications").insert({
      user_id: target.user_id,
      title: "Peran Kamu Diubah",
      message: `${actorName} telah menjadikan kamu ${roleLabelNew} di Family ${householdName}`,
      type: "role_change",
      href: "/pengaturan",
    });
  } catch {
    // tabel user_notifications mungkin belum dibuat — abaikan
  }

  return { success: true, targetName, roleLabelNew };
}

/**
 * Hapus anggota dari household.
 * Menggunakan service role key untuk bypass RLS.
 */
export async function removeMember(
  membershipId: string
): Promise<{ success?: true; error?: string }> {
  const authSupabase = await createClient();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return { error: "Sesi tidak valid." };

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pastikan actor punya izin (admin/super_admin di household yang sama)
  const { data: target } = await service
    .from("household_members")
    .select("household_id, user_id")
    .eq("id", membershipId)
    .single();

  if (!target) return { error: "Anggota tidak ditemukan." };

  const { data: actorMem } = await service
    .from("household_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("household_id", target.household_id)
    .single();

  if (!actorMem || (actorMem.role !== "admin" && actorMem.role !== "super_admin")) {
    return { error: "Tidak memiliki izin untuk menghapus anggota." };
  }

  const { error } = await service
    .from("household_members")
    .delete()
    .eq("id", membershipId);

  if (error) return { error: error.message };

  return { success: true };
}
