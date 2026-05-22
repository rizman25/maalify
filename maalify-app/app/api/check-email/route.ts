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

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error("check-email error:", error);
      return NextResponse.json({ exists: null }); // null = unknown
    }

    return NextResponse.json({ exists: !!data });
  } catch (e) {
    console.error("check-email exception:", e);
    return NextResponse.json({ exists: null });
  }
}
