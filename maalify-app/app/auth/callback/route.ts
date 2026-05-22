import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const userId = data.user.id;

      // Log login event
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";
      await supabase.from("login_history").insert({ user_id: userId, ip_address: ip, user_agent: userAgent });

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
