import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error && data.user) {
      const userId = data.user.id;

      // Cek apakah user sudah punya household
      const { data: existing } = await supabase
        .from("household_members")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (!existing) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Gagal verifikasi → balik ke login dengan pesan error
  return NextResponse.redirect(`${origin}/login?error=invalid_token`);
}
