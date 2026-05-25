import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { formatRupiah } from "@/lib/utils";
import { isRateLimited, WINDOW } from "@/lib/pushRateLimit";

/**
 * POST /api/push/check-debts
 * Dipanggil dari client saat app dibuka (throttled 24 jam).
 * Cek hutang (type=payable) yang hampir atau sudah melewati jatuh tempo,
 * lalu kirim push notification ke user yang bersangkutan.
 *
 * Prioritas notifikasi:
 *   1. Ada yang sudah lewat jatuh tempo (overdue)
 *   2. Jatuh tempo hari ini
 *   3. Jatuh tempo ≤ 3 hari
 *   4. Jatuh tempo ≤ 7 hari
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const { householdId } = await req.json();
    if (!householdId) return NextResponse.json({ ok: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Batas 7 hari ke depan
    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);
    const in7Str = in7.toISOString().split("T")[0];

    // Ambil hutang aktif/overdue dengan due_date yang relevan
    const { data: debts } = await supabase
      .from("debts")
      .select("id, party_name, remaining_amount, due_date, type, status")
      .eq("household_id", householdId)
      .eq("type", "payable")
      .in("status", ["active", "overdue"])
      .not("due_date", "is", null)
      .lte("due_date", in7Str)   // due_date ≤ 7 hari dari sekarang
      .gt("remaining_amount", 0)
      .order("due_date", { ascending: true });

    if (!debts || debts.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    // Klasifikasikan
    const overdue  = debts.filter(d => d.due_date < todayStr);
    const dueToday = debts.filter(d => d.due_date === todayStr);
    const in3Days  = debts.filter(d => d.due_date > todayStr && d.due_date <= (() => {
      const d = new Date(today); d.setDate(d.getDate() + 3); return d.toISOString().split("T")[0];
    })());
    const in7Days  = debts.filter(d => d.due_date > todayStr);

    // Pilih skenario paling urgent
    let title = "";
    let body  = "";

    if (overdue.length > 0) {
      const top = overdue[0];
      const daysLate = Math.ceil((today.getTime() - new Date(top.due_date + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24));
      if (overdue.length === 1) {
        title = "⚠️ Hutang Melewati Jatuh Tempo!";
        body  = `${top.party_name} – Rp ${formatRupiah(top.remaining_amount)} sudah ${daysLate} hari terlambat`;
      } else {
        title = `⚠️ ${overdue.length} Hutang Melewati Jatuh Tempo!`;
        body  = `Terlama: ${top.party_name} (${daysLate} hari) • Total ${overdue.length} hutang menunggak`;
      }
    } else if (dueToday.length > 0) {
      const top = dueToday[0];
      if (dueToday.length === 1) {
        title = "🔔 Hutang Jatuh Tempo Hari Ini";
        body  = `${top.party_name} – Rp ${formatRupiah(top.remaining_amount)} harus dibayar hari ini`;
      } else {
        title = `🔔 ${dueToday.length} Hutang Jatuh Tempo Hari Ini`;
        body  = `Termasuk: ${top.party_name} – Rp ${formatRupiah(top.remaining_amount)}`;
      }
    } else if (in3Days.length > 0) {
      const top = in3Days[0];
      const d = new Date(top.due_date + "T00:00:00");
      const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (in3Days.length === 1) {
        title = "⏰ Hutang Hampir Jatuh Tempo";
        body  = `${top.party_name} – Rp ${formatRupiah(top.remaining_amount)} dalam ${daysLeft} hari`;
      } else {
        title = `⏰ ${in3Days.length} Hutang Hampir Jatuh Tempo`;
        body  = `Terdepan: ${top.party_name} dalam ${daysLeft} hari`;
      }
    } else if (in7Days.length > 0) {
      const top = in7Days[0];
      const d = new Date(top.due_date + "T00:00:00");
      const daysLeft = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (in7Days.length === 1) {
        title = "📅 Pengingat Hutang";
        body  = `${top.party_name} – Rp ${formatRupiah(top.remaining_amount)} jatuh tempo ${daysLeft} hari lagi`;
      } else {
        title = `📅 ${in7Days.length} Hutang Jatuh Tempo Minggu Ini`;
        body  = `Terdepan: ${top.party_name} dalam ${daysLeft} hari`;
      }
    }

    if (!title) return NextResponse.json({ ok: true, count: 0 });

    // Rate limit: 1 notif per user per 20 jam (client throttle 24 jam)
    const rlKey = `debt-due:${user.id}`;
    if (isRateLimited(rlKey, WINDOW.DEBT_DUE)) {
      return NextResponse.json({ ok: true, count: debts.length, rateLimited: true });
    }

    await sendPushToUser(user.id, {
      title,
      body,
      url: "/hutang",
    });

    return NextResponse.json({ ok: true, count: debts.length });
  } catch (e) {
    console.error("[push/check-debts]", e);
    return NextResponse.json({ ok: false });
  }
}
