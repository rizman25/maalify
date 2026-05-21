import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ADMIN_EMAILS = ["riza.developer25@gmail.com"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const userId = data.user.id;
      const email = data.user.email ?? "";

      // Admin email → langsung ke /admin, tidak perlu household
      if (ADMIN_EMAILS.includes(email)) {
        return NextResponse.redirect(`${origin}/admin`);
      }

      // Check if user already has a household
      const { data: existing } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (!existing) {
        // No household yet — send to onboarding to set up
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
