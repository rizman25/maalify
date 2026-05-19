import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import type { AppNotification } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const { data: household } = membership?.household_id
    ? await supabase
        .from("households")
        .select("name")
        .eq("id", membership.household_id)
        .single()
    : { data: null };

  const householdName = household?.name ?? "Keluarga Saya";
  const userName = profile?.name ?? user.email ?? "Pengguna";
  const avatarUrl = profile?.avatar_url ?? null;
  const userRole = (membership?.role ?? "member") as "super_admin" | "admin" | "member";
  const householdId = membership?.household_id ?? "";
  const userId = user.id;

  // Check if household has any wallets (for onboarding)
  const { count: walletCount } = membership?.household_id
    ? await supabase
        .from("wallets")
        .select("id", { count: "exact", head: true })
        .eq("household_id", membership.household_id)
    : { count: 0 };
  const hasWallets = (walletCount ?? 0) > 0;

  // ── Notification computation ──────────────────────────────────────────
  const notifications: AppNotification[] = [];

  if (membership?.household_id) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenDaysStr = sevenDays.toISOString().split("T")[0];

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthStr = String(currentMonth).padStart(2, "0");
    const startDate = `${currentYear}-${monthStr}-01`;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    // Debt notifications — admin/super_admin only
    if (userRole !== "member") {
      const { data: dueDebts } = await supabase
        .from("debts")
        .select("id, party_name, remaining_amount, due_date, type")
        .eq("household_id", membership.household_id)
        .eq("status", "active")
        .not("due_date", "is", null)
        .lte("due_date", sevenDaysStr);

      for (const d of dueDebts ?? []) {
        const isOverdue = (d.due_date as string) < todayStr;
        const typeLabel = d.type === "receivable" ? "Piutang" : "Hutang";
        notifications.push({
          id: `debt-${d.id}`,
          type: isOverdue ? "debt_overdue" : "debt_due_soon",
          title: isOverdue ? `${typeLabel} Jatuh Tempo` : `${typeLabel} Mendekati Jatuh Tempo`,
          message: `${d.party_name} · ${d.due_date}`,
          href: "/hutang",
          urgency: isOverdue ? "high" : "medium",
        });
      }
    }

    // Budget notifications — all roles
    const [{ data: budgets }, { data: txRows }] = await Promise.all([
      supabase
        .from("budgets")
        .select("id, category_id, amount, categories(name, icon)")
        .eq("household_id", membership.household_id)
        .eq("month", currentMonth)
        .eq("year", currentYear),
      supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("household_id", membership.household_id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lt("date", endDate),
    ]);

    const spentMap = new Map<string, number>();
    for (const tx of txRows ?? []) {
      spentMap.set(tx.category_id, (spentMap.get(tx.category_id) ?? 0) + Number(tx.amount));
    }

    for (const b of budgets ?? []) {
      const spent = spentMap.get(b.category_id) ?? 0;
      const ratio = spent / Number(b.amount);
      if (ratio < 0.8) continue;
      const cat = b.categories as unknown as { name: string; icon: string | null } | null;
      const label = `${cat?.icon ?? "📊"} ${cat?.name ?? "Kategori"}`;
      const pct = Math.round(ratio * 100);
      notifications.push({
        id: ratio >= 1 ? `budget-over-${b.id}` : `budget-near-${b.id}`,
        type: ratio >= 1 ? "budget_over" : "budget_near",
        title: ratio >= 1 ? "Anggaran Terlampaui" : "Anggaran Hampir Habis",
        message: `${label} · ${pct}% terpakai`,
        href: "/anggaran",
        urgency: ratio >= 1 ? "high" : "medium",
      });
    }
  }

  return (
    <DashboardShell
      householdName={householdName}
      userName={userName}
      avatarUrl={avatarUrl}
      userRole={userRole}
      notifications={notifications}
      hasWallets={hasWallets}
      householdId={householdId}
      userId={userId}
    >
      {children}
    </DashboardShell>
  );
}
