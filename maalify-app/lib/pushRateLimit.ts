/**
 * In-memory rate limiter for push notification endpoints.
 *
 * Works well for the primary use-case: burst of requests within a warm
 * Vercel serverless instance (e.g. user saves multiple transactions quickly).
 * The Map is local to the instance, so cross-instance coordination is not
 * guaranteed — but client-side throttles and natural usage patterns cover
 * the cross-instance edge cases.
 */

const store = new Map<string, number>();

/**
 * Returns `true` (and does NOT update the store) if the key has been seen
 * within the last `windowMs` milliseconds.
 * Returns `false` (and records the current timestamp) otherwise.
 */
export function isRateLimited(key: string, windowMs: number): boolean {
  const last = store.get(key);
  const now = Date.now();
  if (last !== undefined && now - last < windowMs) return true;
  store.set(key, now);
  return false;
}

// ─── Convenience constants ───────────────────────────────────────────────────

export const WINDOW = {
  /** 30 seconds — subscribe endpoint abuse guard */
  SUBSCRIBE:           30 * 1000,
  /** 2 hours — "anggaran melebihi batas" per (user, category) */
  BUDGET_EXCEEDED:  2 * 60 * 60 * 1000,
  /** 4 hours — "anggaran hampir habis" per (user, category) */
  BUDGET_WARNING:   4 * 60 * 60 * 1000,
  /** 4 hours — recurring reminder per user (client already throttles at 8 h) */
  RECURRING:        4 * 60 * 60 * 1000,
  /** 20 hours — debt due date reminder per user (client throttles at 24 h) */
  DEBT_DUE:        20 * 60 * 60 * 1000,
} as const;
