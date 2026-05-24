import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

/**
 * Set VAPID details secara lazy — hanya saat hendak mengirim notifikasi,
 * bukan saat module di-import. Mencegah crash pada build time jika env vars
 * belum tersedia.
 */
function initVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "Push notification env vars belum di-set: VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY"
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

/**
 * Kirim push notification ke semua perangkat milik user.
 * Subscription yang expired/invalid akan otomatis dihapus dari DB.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase = createServiceClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  // Inisialisasi VAPID hanya saat benar-benar ada subscription yang akan dikirim
  initVapid();

  const staleIds: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 } // 24 jam TTL
        );
      } catch (err: any) {
        // 410 Gone = subscription tidak valid lagi
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleIds.push(sub.id);
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }
}

/**
 * Kirim push ke semua anggota household tertentu (kecuali excludeUserId).
 */
export async function sendPushToHousehold(
  householdId: string,
  payload: PushPayload,
  excludeUserId?: string
) {
  const supabase = createServiceClient();
  const { data: members } = await supabase
    .from("household_members")
    .select("user_id")
    .eq("household_id", householdId);

  if (!members) return;

  await Promise.allSettled(
    members
      .filter((m) => m.user_id !== excludeUserId)
      .map((m) => sendPushToUser(m.user_id, payload))
  );
}
