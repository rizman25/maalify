"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Mark a list of notification keys as read for the current user.
 * Notifications re-appear after 24 hours (reads older than 24h are ignored on fetch).
 */
export async function markNotificationsRead(keys: string[]) {
  if (keys.length === 0) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notification_reads").upsert(
    keys.map((key) => ({
      user_id: user.id,
      notification_key: key,
      read_at: new Date().toISOString(),
    })),
    { onConflict: "user_id,notification_key" }
  );

  revalidatePath("/", "layout");
}
