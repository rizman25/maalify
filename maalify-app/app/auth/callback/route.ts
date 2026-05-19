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

      // Cek apakah user sudah punya household
      const { data: existing } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      // Buat household hanya jika belum ada (user baru dari register)
      if (!existing) {
        const householdName = meta?.household_name ?? "Keluarga Saya";
        const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const { data: household } = await supabase
          .from("households")
          .insert({ name: householdName, invite_code: inviteCode, created_by: userId })
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
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
