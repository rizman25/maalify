import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PengaturanPageClient from "./PengaturanPageClient";

export default async function PengaturanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members").select("household_id, role")
    .eq("user_id", user.id).limit(1).single();

  const householdId = membership?.household_id ?? "";
  const userRole = membership?.role ?? "member";

  type MemberRow = {
    id: string; role: string; joined_at: string;
    users: { id: string; name: string; email: string } | { id: string; name: string; email: string }[] | null;
  };

  type ActivityRow = {
    id: string;
    type: string;
    amount: number;
    description: string;
    created_at: string;
    users: { name: string } | { name: string }[] | null;
  };

  const [profileRes, householdRes, membersRes, catsRes, activityRes] = await Promise.all([
    supabase.from("users").select("id, name, email, avatar_url").eq("id", user.id).single(),

    supabase.from("households").select("id, name, description, invite_code")
      .eq("id", householdId).single(),

    supabase.from("household_members")
      .select("id, role, joined_at, users(id, name, email)")
      .eq("household_id", householdId)
      .order("joined_at"),

    supabase.from("categories")
      .select("id, name, icon, color, type, is_default, household_id")
      .or(`household_id.eq.${householdId},household_id.is.null`)
      .order("is_default", { ascending: false })
      .order("name"),

    supabase.from("transactions")
      .select("id, type, amount, description, created_at, users(name)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const members = ((membersRes.data ?? []) as unknown as MemberRow[]).map(m => {
    const u = Array.isArray(m.users) ? m.users[0] : m.users;
    return { id: m.id, role: m.role, joined_at: m.joined_at, user: u };
  });

  const activity = ((activityRes.data ?? []) as unknown as ActivityRow[]).map(a => {
    const u = Array.isArray(a.users) ? a.users[0] : a.users;
    return {
      id: a.id,
      type: a.type,
      amount: a.amount,
      description: a.description,
      created_at: a.created_at,
      actorName: u?.name ?? "Anggota",
    };
  });

  return (
    <PengaturanPageClient
      profile={profileRes.data ?? { id: user.id, name: "", email: user.email ?? "", avatar_url: null }}
      household={householdRes.data ?? { id: householdId, name: "", description: null, invite_code: "" }}
      members={members}
      categories={catsRes.data ?? []}
      activity={activity}
      householdId={householdId}
      userId={user.id}
      userRole={userRole}
    />
  );
}
