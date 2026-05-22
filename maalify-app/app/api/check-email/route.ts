import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ exists: false });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Pakai Auth Admin API — lebih reliable dari query public.users
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("check-email error:", error);
      return NextResponse.json({ exists: null });
    }

    const exists = data.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
    );

    return NextResponse.json({ exists });
  } catch (e) {
    console.error("check-email exception:", e);
    return NextResponse.json({ exists: null });
  }
}
