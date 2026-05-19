import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const userId = data.user.id;
      const meta = data.user.user_metadata as Record<string, string> | null;

      // Check if user already has a household
      const { data: existing } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (!existing) {
        const inviteCode = meta?.invite_code;

        if (inviteCode) {
          // Use SECURITY DEFINER RPC to bypass RLS on households table
          const { data: householdId } = await supabase
            .rpc("find_household_by_invite_code", { p_invite_code: inviteCode });

          if (householdId) {
            await supabase.from("household_members").insert({
              household_id: householdId,
              user_id: userId,
              role: "member",
            });
          } else {
            // Invalid invite code — create a default household as fallback
            await createDefaultHousehold(supabase, userId, "Keluarga Saya");
          }
        } else {
          // Create new household
          const householdName = meta?.household_name ?? "Keluarga Saya";
          await createDefaultHousehold(supabase, userId, householdName);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}

async function createDefaultHousehold(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  userId: string,
  name: string
) {
  const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data: household } = await supabase
    .from("households")
    .insert({ name, invite_code: inviteCode, created_by: userId })
    .select()
    .single();

  if (household) {
    await supabase.from("household_members").insert({
      household_id: household.id,
      user_id: userId,
      role: "admin",
    });

    await supabase.from("subscriptions").insert({
      household_id: household.id,
      plan: "free",
      status: "active",
    });
  }
}
