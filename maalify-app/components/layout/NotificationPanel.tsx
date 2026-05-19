"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { AppNotification } from "@/types";

interface Props {
  notifications: AppNotification[];
  onClose: () => void;
}

const ICON: Record<AppNotification["type"], string> = {
  debt_overdue:  "🔴",
  debt_due_soon: "🟡",
  budget_over:   "🔴",
  budget_near:   "🟡",
};

export default function NotificationPanel({ notifications, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-modal)] z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--text-primary)]">Notifikasi</span>
        {notifications.length > 0 && (
          <span className="text-xs text-[var(--text-secondary)]">{notifications.length} baru</span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-2xl mb-2">🔔</p>
          <p className="text-sm text-[var(--text-secondary)]">Semua beres, tidak ada notifikasi</p>
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
          {notifications.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => go(n.href)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--bg-elevated)] transition-colors flex items-start gap-3"
              >
                <span className="text-base mt-0.5 flex-shrink-0">{ICON[n.type]}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{n.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{n.message}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
