import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const { data: household } = membership?.household_id
    ? await supabase
        .from("households")
        .select("name")
        .eq("id", membership.household_id)
        .single()
    : { data: null };

  const householdName = household?.name ?? "Keluarga Saya";
  const userName = profile?.name ?? user.email ?? "Pengguna";
  const userRole = (membership?.role ?? "member") as "super_admin" | "admin" | "member";

  return (
    <DashboardShell householdName={householdName} userName={userName} userRole={userRole}>
      {children}
    </DashboardShell>
  );
}
