import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToUser } from "@/lib/push";
import { formatRupiah } from "@/lib/utils";
import { isRateLimited, WINDOW } from "@/lib/pushRateLimit";

function addDate(from: Date, frequency: string): Date {
  const d = new Date(from);
  if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else d.setDate(d.getDate() + 1);
  return d;
}

/**
 * POST /api/push/check-recurring
 * Dipanggil dari dashboard saat halaman dimuat (throttled client-side 8 jam).
 * Hitung jumlah transaksi berulang yang sudah jatuh tempo tapi belum dikonfirmasi,
 * lalu kirim push notification ke pengguna jika ada yang pending.
 * Hanya berlaku untuk role admin dan super_admin (member tidak bisa konfirmasi).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const { householdId } = await req.json();
    if (!householdId) return NextResponse.json({ ok: false });

    // Cek role — hanya admin/super_admin yang perlu konfirmasi
    const { data: membership } = await supabase
      .from("household_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("household_id", householdId)
      .single();

    if (!membership || membership.role === "member") {
      return NextResponse.json({ ok: true, skipped: "member" });
    }

    const isSuperAdmin = membership.role === "super_admin";

    // Ambil semua recurring aktif
    const { data: recurring } = await supabase
      .from("recurring_transactions")
      .select("id, type, amount, description, frequency, start_date, end_date, last_generated, is_private, user_id")
      .eq("household_id", householdId)
      .eq("is_active", true);

    if (!recurring || recurring.length === 0) {
      return NextResponse.json({ ok: true, pending: 0 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    let totalPending = 0;
    // Track item yang paling lama overdue untuk ditampilkan di notifikasi
    let topDesc = "";
    let topAmount = 0;
    let topDaysOverdue = -1;

    for (const item of recurring) {
      // Skip transaksi pribadi milik orang lain (kecuali super_admin yang lihat semua)
      if (item.is_private && item.user_id && item.user_id !== user.id && !isSuperAdmin) {
        continue;
      }

      const startDate = new Date(item.start_date + "T00:00:00");
      const endDate = item.end_date ? new Date(item.end_date + "T00:00:00") : null;

      let cursor: Date;
      if (item.last_generated) {
        cursor = addDate(new Date(item.last_generated + "T00:00:00"), item.frequency);
      } else {
        cursor = new Date(startDate);
      }

      let itemPending = 0;
      const MAX = 12;

      while (itemPending < MAX) {
        const dateStr = cursor.toISOString().split("T")[0];
        if (dateStr > todayStr) break;
        if (endDate && cursor > endDate) break;

        itemPending++;

        // Track item paling overdue (pertama dari setiap recurring = paling lama)
        if (itemPending === 1) {
          const daysOverdue = Math.floor((today.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24));
          if (daysOverdue > topDaysOverdue) {
            topDaysOverdue = daysOverdue;
            topDesc = item.description;
            topAmount = Number(item.amount);
          }
        }

        cursor = addDate(cursor, item.frequency);
      }

      totalPending += itemPending;
    }

    if (totalPending === 0) {
      return NextResponse.json({ ok: true, pending: 0 });
    }

    // Susun pesan notifikasi
    let title: string;
    let body: string;

    if (totalPending === 1) {
      title = "🔔 Konfirmasi Transaksi Berulang";
      body = `${topDesc} – Rp ${formatRupiah(topAmount)} belum dikonfirmasi`;
    } else {
      title = `🔔 ${totalPending} Transaksi Berulang Menunggu`;
      body = topDaysOverdue > 0
        ? `Tertunggak hingga ${topDaysOverdue} hari — segera konfirmasi`
        : `Segera konfirmasi di halaman Transaksi Berulang`;
    }

    // Rate limit: 1 notif per user per 4 jam (client sudah throttle 8 jam, ini server-side guard)
    const rlKey = `recurring:${user.id}`;
    if (isRateLimited(rlKey, WINDOW.RECURRING)) {
      return NextResponse.json({ ok: true, pending: totalPending, rateLimited: true });
    }

    await sendPushToUser(user.id, {
      title,
      body,
      url: "/transaksi-berulang",
    });

    return NextResponse.json({ ok: true, pending: totalPending });
  } catch (e) {
    console.error("[push/check-recurring]", e);
    return NextResponse.json({ ok: false });
  }
}
