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
  const allNotifications: AppNotification[] = [];

  if (membership?.household_id) {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const sevenDays = new Date(today);
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenDaysStr = sevenDays.toISOString().split("T")[0];
    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const thirtyDaysStr = thirtyDays.toISOString().split("T")[0];

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthStr = String(currentMonth).padStart(2, "0");
    const startDate = `${currentYear}-${monthStr}-01`;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    // Fetch all data in parallel
    const [
      dueDebtsRes,
      budgetsRes,
      txRowsRes,
      goalsRes,
      recurringRes,
      readsRes,
      userNotifsRes,
    ] = await Promise.all([
      // Debt — admin/super_admin only
      userRole !== "member"
        ? supabase
            .from("debts")
            .select("id, party_name, due_date, type")
            .eq("household_id", membership.household_id)
            .eq("status", "active")
            .not("due_date", "is", null)
            .lte("due_date", sevenDaysStr)
        : Promise.resolve({ data: [] }),

      // Budgets
      supabase
        .from("budgets")
        .select("id, category_id, amount, categories(name, icon)")
        .eq("household_id", membership.household_id)
        .eq("month", currentMonth)
        .eq("year", currentYear),

      // Transactions this month (for budget spending)
      supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("household_id", membership.household_id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lt("date", endDate),

      // Savings goals near deadline (within 30 days, not yet completed)
      supabase
        .from("savings_goals")
        .select("id, name, icon, target_amount, current_amount, deadline")
        .eq("household_id", membership.household_id)
        .eq("is_completed", false)
        .not("deadline", "is", null)
        .lte("deadline", thirtyDaysStr),

      // Recurring transactions (compute next_date in JS)
      supabase
        .from("recurring_transactions")
        .select("id, description, frequency, start_date, last_generated, end_date")
        .eq("household_id", membership.household_id)
        .eq("is_active", true)
        .lte("start_date", todayStr),

      // Already-read notifications in last 24 hours
      supabase
        .from("notification_reads")
        .select("notification_key")
        .eq("user_id", userId)
        .gte("read_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // Personal user notifications (role changes, etc.) — last 7 days
      supabase
        .from("user_notifications")
        .select("id, title, message, type, href")
        .eq("user_id", userId)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Build set of read keys
    const readKeys = new Set((readsRes.data ?? []).map((r) => r.notification_key));

    // ── Debt notifications ────────────────────────────────────────────────
    for (const d of dueDebtsRes.data ?? []) {
      const isOverdue = (d.due_date as string) < todayStr;
      const typeLabel = d.type === "receivable" ? "Piutang" : "Hutang";
      allNotifications.push({
        id: `debt-${d.id}`,
        type: isOverdue ? "debt_overdue" : "debt_due_soon",
        title: isOverdue ? `${typeLabel} Jatuh Tempo` : `${typeLabel} Mendekati Jatuh Tempo`,
        message: `${d.party_name} · ${d.due_date}`,
        href: "/hutang",
        urgency: isOverdue ? "high" : "medium",
      });
    }

    // ── Budget notifications ──────────────────────────────────────────────
    const spentMap = new Map<string, number>();
    for (const tx of txRowsRes.data ?? []) {
      spentMap.set(tx.category_id, (spentMap.get(tx.category_id) ?? 0) + Number(tx.amount));
    }
    for (const b of budgetsRes.data ?? []) {
      const spent = spentMap.get(b.category_id) ?? 0;
      const ratio = spent / Number(b.amount);
      if (ratio < 0.8) continue;
      const cat = b.categories as unknown as { name: string; icon: string | null } | null;
      const label = cat?.name ?? "Kategori";
      const pct = Math.round(ratio * 100);
      allNotifications.push({
        id: ratio >= 1 ? `budget-over-${b.id}` : `budget-near-${b.id}`,
        type: ratio >= 1 ? "budget_over" : "budget_near",
        title: ratio >= 1 ? "Anggaran Terlampaui" : "Anggaran Hampir Habis",
        message: `${label} · ${pct}% terpakai`,
        href: "/anggaran",
        urgency: ratio >= 1 ? "high" : "medium",
      });
    }

    // ── Savings goal notifications ────────────────────────────────────────
    for (const g of goalsRes.data ?? []) {
      const pct = g.target_amount > 0
        ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
        : 0;
      if (pct >= 95) continue; // nearly done — no need to warn
      const daysLeft = Math.ceil(
        (new Date(g.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const isUrgent = daysLeft <= 7;
      allNotifications.push({
        id: `goal-${g.id}`,
        type: "savings_goal_due",
        title: isUrgent ? "Target Tabungan Hampir Deadline!" : "Target Tabungan Mendekati Deadline",
        message: `${g.name} · ${pct}% tercapai · ${daysLeft} hari lagi`,
        href: "/tabungan",
        urgency: isUrgent ? "high" : "medium",
      });
    }

    // ── Recurring transaction notifications ───────────────────────────────
    function addFreq(from: Date, freq: string): Date {
      const d = new Date(from);
      if (freq === "monthly") d.setMonth(d.getMonth() + 1);
      else if (freq === "weekly") d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      return d;
    }
    const recurringToday = (recurringRes.data ?? []).filter((r) => {
      if (r.end_date && r.end_date < todayStr) return false;
      const base = r.last_generated
        ? addFreq(new Date(r.last_generated + "T00:00:00"), r.frequency)
        : new Date(r.start_date + "T00:00:00");
      return base.toISOString().split("T")[0] === todayStr;
    });
    if (recurringToday.length > 0) {
      allNotifications.push({
        id: `recurring-today-${todayStr}`,
        type: "recurring_due",
        title: "Transaksi Berulang Hari Ini",
        message: recurringToday.length === 1
          ? recurringToday[0].description
          : `${recurringToday.length} transaksi berulang dijadwalkan hari ini`,
        href: "/transaksi-berulang",
        urgency: "medium",
      });
    }

    // ── Personal user notifications (role changes, etc.) ─────────────────
    for (const n of userNotifsRes.data ?? []) {
      const notifId = `user-notif-${n.id}`;
      allNotifications.push({
        id: notifId,
        type: "role_change" as AppNotification["type"],
        title: n.title,
        message: n.message,
        href: n.href ?? "/pengaturan",
        urgency: "medium",
      });
    }

    // ── Filter out already-read notifications ─────────────────────────────
    const notifications = allNotifications.filter((n) => !readKeys.has(n.id));

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

  const notifications: AppNotification[] = [];

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

