"use client";

import { useEffect } from "react";

const STORAGE_KEY = "maalify_debt_check_last";
const THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 jam

/**
 * Komponen invisible yang memeriksa hutang yang hampir/sudah jatuh tempo
 * dan mengirim push notification jika ada yang relevan.
 * Di-throttle 24 jam agar tidak spam — cukup sekali sehari saat buka app.
 */
export function DebtReminderChecker({ householdId }: { householdId: string }) {
  useEffect(() => {
    if (!householdId) return;

    // Throttle: jangan cek lagi kalau sudah dicek dalam 24 jam terakhir
    try {
      const last = localStorage.getItem(STORAGE_KEY);
      if (last) {
        const elapsed = Date.now() - parseInt(last, 10);
        if (elapsed < THROTTLE_MS) return;
      }
    } catch {
      return;
    }

    // Fire-and-forget
    fetch("/api/push/check-debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ householdId }),
    })
      .then((res) => {
        if (res.ok) {
          try {
            localStorage.setItem(STORAGE_KEY, Date.now().toString());
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Bukan fitur kritis — ignore network error
      });
  }, [householdId]);

  return null;
}
