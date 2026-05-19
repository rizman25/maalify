import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import JoinPageClient from "./JoinPageClient";

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function JoinPage({ searchParams }: Props) {
  const { code } = await searchParams;

  if (!code) redirect("/login");

  const inviteCode = code.trim().toUpperCase();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Resolve household name from invite code (via RPC)
  const { data: householdId } = await supabase
    .rpc("find_household_by_invite_code", { p_invite_code: inviteCode });

  if (!householdId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Link Tidak Valid</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Kode undangan <span className="font-mono font-bold">{inviteCode}</span> tidak ditemukan atau sudah tidak aktif.
          </p>
          <a href="/dashboard" className="px-6 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            Ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  const { data: household } = await supabase
    .from("households")
    .select("name, description")
    .eq("id", householdId)
    .single();

  // If user is already a member of this household → redirect to dashboard
  if (user) {
    const { data: existing } = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", householdId)
      .eq("user_id", user.id)
      .single();

    if (existing) redirect("/dashboard");
  }

  return (
    <JoinPageClient
      inviteCode={inviteCode}
      householdId={householdId}
      householdName={household?.name ?? "Keluarga"}
      householdDescription={household?.description ?? null}
      isLoggedIn={!!user}
      userId={user?.id ?? null}
    />
  );
}
