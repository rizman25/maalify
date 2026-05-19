import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProjectPageClient from "./ProjectPageClient";

export default async function ProjectPage() {
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
  const userRole = membership?.role ?? "member";

  const [projectsRes, walletsRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, household_id, wallet_id, name, type, description, cover_emoji, target_amount, current_amount, target_date, status, created_by, created_at, updated_at, wallets(current_balance, name)")
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
    <ProjectPageClient
      projects={projectsRes.data ?? []}
      wallets={walletsRes.data ?? []}
      householdId={householdId}
      userId={user.id}
      userRole={userRole}
    />
  );
}
