import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

const ADMIN_EMAILS = ["riza.developer25@gmail.com"];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/admin/login?denied=1");

  // Service role client untuk bypass RLS
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const monthStart = `${y}-${pad(m)}-01`;
  const prevMonthStart = m === 1 ? `${y - 1}-12-01` : `${y}-${pad(m - 1)}-01`;
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(d - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(d - 30);
  const thirtyDaysStr = thirtyDaysAgo.toISOString().split("T")[0];

  const [
    usersRes,
    activeUsersRes,
    newUsersMonthRes,
    householdsRes,
    membersRes,
    txTotalRes,
    txMonthRes,
    txPrevMonthRes,
    txDailyRes,
    aiTotalRes,
    aiMonthRes,
    topHouseholdsRes,
    recentUsersRes,
    goalsAdoptionRes,
    budgetAdoptionRes,
    scanAdoptionRes,
    recurringAdoptionRes,
    txAdoptionRes,
    membersAdoptionRes,
    walletAdoptionRes,
    loginHistoryRes,
    feedbackRes,
  ] = await Promise.all([
    // Total users
    svc.from("users").select("id", { count: "exact", head: true }),

    // Active users last 7 days (had a transaction)
    svc.from("transactions").select("user_id").gte("created_at", sevenDaysStr),

    // New users this month
    svc.from("users").select("id", { count: "exact", head: true }).gte("created_at", monthStart),

    // Total households
    svc.from("households").select("id", { count: "exact", head: true }),

    // Members per household
    svc.from("household_members").select("household_id"),

    // Total transactions
    svc.from("transactions").select("id", { count: "exact", head: true }),

    // Transactions this month
    svc.from("transactions").select("id", { count: "exact", head: true }).gte("date", monthStart),

    // Transactions prev month
    svc.from("transactions").select("id", { count: "exact", head: true })
      .gte("date", prevMonthStart).lt("date", monthStart),

    // Daily transactions last 30 days
    svc.from("transactions").select("date").gte("date", thirtyDaysStr).order("date"),

    // AI usage all time
    svc.from("ai_usage_logs").select("feature, total_tokens, estimated_cost_usd"),

    // AI usage this month
    svc.from("ai_usage_logs").select("feature, total_tokens, estimated_cost_usd").gte("created_at", monthStart),

    // Top households by transaction count
    svc.from("households")
      .select("id, name, created_at, household_members(count), transactions(count)")
      .order("created_at", { ascending: false })
      .limit(10),

    // Recent users
    svc.from("users")
      .select("id, name, email, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(10),

    // Goals adoption
    svc.from("savings_goals").select("household_id"),

    // Budget adoption
    svc.from("budgets").select("household_id"),

    // Scan struk adoption (households that used it)
    svc.from("ai_usage_logs").select("household_id").eq("feature", "scan_struk"),

    // Transaksi Berulang adoption
    svc.from("recurring_transactions").select("household_id"),

    // Transaksi adoption (household yang sudah pernah catat)
    svc.from("transactions").select("household_id"),

    // Multi member adoption (household dengan >1 anggota)
    svc.from("household_members").select("household_id"),

    // Dompet adoption
    svc.from("wallets").select("household_id").eq("is_active", true),

    // Login history
    svc.from("login_history")
      .select("id, created_at, ip_address, user_agent, users(id, name, email)")
      .order("created_at", { ascending: false })
      .limit(50),

    // Feedback
    svc.from("feedback")
      .select("id, type, message, rating, created_at, users(id, name, email)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // ── Compute stats ──────────────────────────────────────────────────────
  const totalUsers = usersRes.count ?? 0;
  const activeUserIds = new Set((activeUsersRes.data ?? []).map(r => r.user_id));
  const activeUsers7d = activeUserIds.size;
  const newUsersMonth = newUsersMonthRes.count ?? 0;
  const totalHouseholds = householdsRes.count ?? 0;

  const memberCounts = (membersRes.data ?? []).reduce((acc: Record<string, number>, r) => {
    acc[r.household_id] = (acc[r.household_id] ?? 0) + 1;
    return acc;
  }, {});
  const avgMembersPerHousehold = totalHouseholds > 0
    ? (Object.values(memberCounts).reduce((s, v) => s + v, 0) / totalHouseholds).toFixed(1)
    : "0";

  const totalTx = txTotalRes.count ?? 0;
  const txThisMonth = txMonthRes.count ?? 0;
  const txPrevMonth = txPrevMonthRes.count ?? 0;

  // Daily tx map for last 30 days
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d2 = new Date(now); d2.setDate(d2.getDate() - i);
    const key = d2.toISOString().split("T")[0];
    dailyMap.set(key, 0);
  }
  for (const tx of txDailyRes.data ?? []) {
    const k = tx.date.substring(0, 10);
    if (dailyMap.has(k)) dailyMap.set(k, (dailyMap.get(k) ?? 0) + 1);
  }
  const dailyTxData = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  // AI stats
  const aiAll   = aiTotalRes.data ?? [];
  const aiMonth = aiMonthRes.data ?? [];

  const scanTotal     = aiAll.filter(r => r.feature === "scan_struk").length;
  const chatTotal     = aiAll.filter(r => r.feature === "ai_chat").length;
  const scanMonth     = aiMonth.filter(r => r.feature === "scan_struk").length;
  const chatMonth     = aiMonth.filter(r => r.feature === "ai_chat").length;
  const totalTokens   = aiAll.reduce((s, r) => s + (r.total_tokens ?? 0), 0);
  const totalCostUsd  = aiAll.reduce((s, r) => s + Number(r.estimated_cost_usd ?? 0), 0);
  const monthTokens   = aiMonth.reduce((s, r) => s + (r.total_tokens ?? 0), 0);
  const monthCostUsd  = aiMonth.reduce((s, r) => s + Number(r.estimated_cost_usd ?? 0), 0);

  // Feature adoption
  const householdsWithGoals     = new Set((goalsAdoptionRes.data ?? []).map(r => r.household_id)).size;
  const householdsWithBudget    = new Set((budgetAdoptionRes.data ?? []).map(r => r.household_id)).size;
  const householdsWithScan      = new Set((scanAdoptionRes.data ?? []).map(r => r.household_id)).size;
  const householdsWithRecurring = new Set((recurringAdoptionRes.data ?? []).map(r => r.household_id)).size;
  const householdsWithTx        = new Set((txAdoptionRes.data ?? []).map(r => r.household_id)).size;
  const householdsWithWallet    = new Set((walletAdoptionRes.data ?? []).map(r => r.household_id)).size;

  // Multi member: household yang punya lebih dari 1 anggota
  const memberCountMap = new Map<string, number>();
  for (const r of membersAdoptionRes.data ?? []) {
    memberCountMap.set(r.household_id, (memberCountMap.get(r.household_id) ?? 0) + 1);
  }
  const householdsWithMultiMember = [...memberCountMap.values()].filter(v => v > 1).length;

  const adoptionGoals       = totalHouseholds > 0 ? Math.round((householdsWithGoals / totalHouseholds) * 100) : 0;
  const adoptionBudget      = totalHouseholds > 0 ? Math.round((householdsWithBudget / totalHouseholds) * 100) : 0;
  const adoptionScan        = totalHouseholds > 0 ? Math.round((householdsWithScan / totalHouseholds) * 100) : 0;
  const adoptionRecurring   = totalHouseholds > 0 ? Math.round((householdsWithRecurring / totalHouseholds) * 100) : 0;
  const adoptionTx          = totalHouseholds > 0 ? Math.round((householdsWithTx / totalHouseholds) * 100) : 0;
  const adoptionMultiMember = totalHouseholds > 0 ? Math.round((householdsWithMultiMember / totalHouseholds) * 100) : 0;
  const adoptionWallet      = totalHouseholds > 0 ? Math.round((householdsWithWallet / totalHouseholds) * 100) : 0;

  // Top households
  type HouseholdRow = {
    id: string; name: string; created_at: string;
    household_members: { count: number }[];
    transactions: { count: number }[];
  };
  const topHouseholds = ((topHouseholdsRes.data ?? []) as unknown as HouseholdRow[]).map(h => ({
    id: h.id,
    name: h.name,
    created_at: h.created_at,
    memberCount: Array.isArray(h.household_members) ? h.household_members.length : 0,
    txCount: Array.isArray(h.transactions) ? h.transactions.length : 0,
  }));

  return (
    <AdminDashboardClient
      stats={{
        totalUsers, activeUsers7d, newUsersMonth, totalHouseholds,
        avgMembersPerHousehold,
        totalTx, txThisMonth, txPrevMonth,
        scanTotal, chatTotal, scanMonth, chatMonth,
        totalTokens, totalCostUsd, monthTokens, monthCostUsd,
        adoptionGoals, adoptionBudget, adoptionScan,
        adoptionRecurring, adoptionTx, adoptionMultiMember, adoptionWallet,
      }}
      dailyTxData={dailyTxData}
      topHouseholds={topHouseholds}
      recentUsers={(recentUsersRes.data ?? []) as { id: string; name: string; email: string; phone: string | null; created_at: string }[]}
      loginHistory={(loginHistoryRes.data ?? []) as unknown as { id: string; created_at: string; ip_address: string; user_agent: string; users: { id: string; name: string; email: string } | null }[]}
      feedbackList={(feedbackRes.data ?? []) as unknown as { id: string; type: string; message: string; rating: number | null; image_url: string | null; created_at: string; users: { id: string; name: string; email: string } | null }[]}
      generatedAt={new Date().toISOString()}
    />
  );
}
