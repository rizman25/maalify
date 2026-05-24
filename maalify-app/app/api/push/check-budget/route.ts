import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { formatRupiah } from "@/lib/utils";

/**
 * POST /api/push/check-budget
 * Dipanggil setelah transaksi expense disimpan.
 * Cek apakah budget kategori hampir habis (≥80%) atau melebihi (>100%),
 * lalu kirim push notification ke user yang menyimpan transaksi.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const { householdId, categoryId } = await req.json();
    if (!householdId || !categoryId) return NextResponse.json({ ok: false });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const pad = (n: number) => String(n).padStart(2, "0");
    const monthStart = `${year}-${pad(month)}-01`;
    const monthEnd = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;

    // Ambil budget untuk kategori ini
    const [budgetRes, spentRes, catRes] = await Promise.all([
      supabase.from("budgets")
        .select("amount")
        .eq("household_id", householdId)
        .eq("category_id", categoryId)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle(),

      supabase.from("transactions")
        .select("amount")
        .eq("household_id", householdId)
        .eq("category_id", categoryId)
        .eq("type", "expense")
        .gte("date", monthStart)
        .lt("date", monthEnd),

      supabase.from("categories")
        .select("name")
        .eq("id", categoryId)
        .maybeSingle(),
    ]);

    if (!budgetRes.data) return NextResponse.json({ ok: true }); // no budget set

    const budget = Number(budgetRes.data.amount);
    const spent = (spentRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0);
    const catName = catRes.data?.name ?? "Kategori";
    const pct = budget > 0 ? (spent / budget) * 100 : 0;

    if (pct > 100) {
      // Budget melebihi batas
      await sendPushToUser(user.id, {
        title: "⚠️ Anggaran Melebihi Batas!",
        body: `${catName}: Rp ${formatRupiah(spent)} dari Rp ${formatRupiah(budget)} (+Rp ${formatRupiah(spent - budget)})`,
        url: "/anggaran",
      });
    } else if (pct >= 80) {
      // Budget hampir habis
      await sendPushToUser(user.id, {
        title: "🔔 Anggaran Hampir Habis",
        body: `${catName}: ${pct.toFixed(0)}% terpakai (Rp ${formatRupiah(spent)} dari Rp ${formatRupiah(budget)})`,
        url: "/anggaran",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/check-budget]", e);
    return NextResponse.json({ ok: false });
  }
}
