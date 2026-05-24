"use client";

import { useEffect } from "react";

const STORAGE_KEY = "maalify_recurring_check_last";
export const RECURRING_BADGE_KEY = "maalify_recurring_pending_count";
const THROTTLE_MS = 8 * 60 * 60 * 1000; // 8 jam

/**
 * Komponen invisible yang memeriksa pending recurring transactions
 * dan mengirim push notification jika ada yang belum dikonfirmasi.
 * Dipanggil saat dashboard mount, di-throttle 8 jam agar tidak spam.
 */
export function RecurringReminderChecker({ householdId }: { householdId: string }) {
  useEffect(() => {
    if (!householdId) return;

    // Throttle: jangan cek lagi kalau sudah dicek dalam 8 jam terakhir
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) {
        const elapsed = Date.now() - parseInt(last, 10);
        if (elapsed < THROTTLE_MS) return;
      }
    } catch {
      // localStorage tidak tersedia (SSR guard)
      return;
    }

    // Fire-and-forget — tidak perlu tunggu response
    fetch("/api/push/check-recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ householdId }),
    })
      .then(async (res) => {
        if (res.ok) {
          try {
            const json = await res.json();
            // Simpan waktu terakhir cek
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
            // Simpan pending count untuk badge di sidebar
            const count = json.pending ?? 0;
            localStorage.setItem(RECURRING_BADGE_KEY, String(count));
            // Broadcast ke tab lain (misal sidebar di tab/window lain)
            window.dispatchEvent(new StorageEvent("storage", {
              key: RECURRING_BADGE_KEY,
              newValue: String(count),
            }));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Ignore network errors — bukan fitur kritis
      });
  }, [householdId]);

  return null;
}
