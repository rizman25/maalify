import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#1E3A5F] mb-2">Selamat datang di Maalify!</h1>
        <p className="text-[#475569]">Masuk sebagai: {user.email}</p>
        <p className="text-sm text-[#94A3B8] mt-4">Dashboard sedang dibangun — Phase 4</p>
      </div>
    </div>
  );
}
