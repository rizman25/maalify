import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KategoriPageClient from "./KategoriPageClient";

export default async function KategoriPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members").select("household_id, role")
    .eq("user_id", user.id).limit(1).single();

  const householdId = membership?.household_id ?? "";
  const userRole = (membership?.role ?? "member") as "super_admin" | "admin" | "member";

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, icon, color, type, is_default, household_id")
    .or(`household_id.eq.${householdId},household_id.is.null`)
    .order("is_default", { ascending: false })
    .order("name");

  return (
    <KategoriPageClient
      categories={categories ?? []}
      householdId={householdId}
      userRole={userRole}
    />
  );
}
