import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership?.household_id) return NextResponse.json({ results: [] });

  const { household_id, role } = membership;
  const pattern = `%${q}%`;

  const [txRes, walletRes, debtRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, description, type, amount, date, categories(name, icon)")
      .eq("household_id", household_id)
      .ilike("description", pattern)
      .order("date", { ascending: false })
      .limit(5),

    supabase
      .from("wallets")
      .select("id, name, type, current_balance")
      .eq("household_id", household_id)
      .eq("is_active", true)
      .ilike("name", pattern)
      .limit(4),

    role !== "member"
      ? supabase
          .from("debts")
          .select("id, party_name, type, remaining_amount, status")
          .eq("household_id", household_id)
          .ilike("party_name", pattern)
          .limit(4)
      : Promise.resolve({ data: [] }),
  ]);

  type TxRow = {
    id: string; description: string; type: string;
    amount: number; date: string;
    categories: { name: string; icon: string | null } | { name: string; icon: string | null }[] | null;
  };

  const transactions = ((txRes.data ?? []) as unknown as TxRow[]).map((t) => {
    const cat = Array.isArray(t.categories) ? t.categories[0] : t.categories;
    return {
      type: "transaction" as const,
      id: t.id,
      title: t.description,
      subtitle: `${cat?.icon ?? ""} ${cat?.name ?? ""} · ${new Date(t.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`,
      amount: Number(t.amount),
      txType: t.type as "income" | "expense",
      href: `/transaksi?month=${new Date(t.date).getMonth() + 1}&year=${new Date(t.date).getFullYear()}`,
    };
  });

  const wallets = ((walletRes.data ?? []) as { id: string; name: string; type: string; current_balance: number }[]).map((w) => ({
    type: "wallet" as const,
    id: w.id,
    title: w.name,
    subtitle: w.type,
    amount: Number(w.current_balance),
    href: "/dompet",
  }));

  const debts = ((debtRes.data ?? []) as { id: string; party_name: string; type: string; remaining_amount: number; status: string }[]).map((d) => ({
    type: "debt" as const,
    id: d.id,
    title: d.party_name,
    subtitle: `${d.type === "payable" ? "Hutang" : "Piutang"} · ${d.status}`,
    amount: Number(d.remaining_amount),
    href: "/hutang",
  }));

  return NextResponse.json({ results: { transactions, wallets, debts } });
}
