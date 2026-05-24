"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AppNotification } from "@/types";
import { markNotificationsRead } from "@/app/actions/notifications";
import { AlertCircle, Target, RefreshCw, Bell } from "@/lib/icons";
import type { LucideProps } from "lucide-react";
import { AlertTriangle, Crown } from "lucide-react";
import { loadNotifPrefs } from "@/app/(dashboard)/pengaturan/PengaturanPageClient";

interface Props {
  notifications: AppNotification[];
  onClose: () => void;
}

const ICON: Record<AppNotification["type"], React.ComponentType<LucideProps>> = {
  debt_overdue:     AlertCircle,
  debt_due_soon:    AlertTriangle,
  budget_over:      AlertCircle,
  budget_near:      AlertTriangle,
  savings_goal_due: Target,
  recurring_due:    RefreshCw,
  role_change:      Crown,
};

export default function NotificationPanel({ notifications, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Filter notifications based on user preferences
  const [prefs] = useState(() => loadNotifPrefs());
  const filtered = notifications.filter(n => prefs[n.type] !== false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  function go(n: AppNotification) {
    // Mark single notification as read, then navigate
    startTransition(async () => {
      await markNotificationsRead([n.id]);
      onClose();
      router.push(n.href);
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markNotificationsRead(filtered.map((n) => n.id));
      onClose();
    });
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-modal)] z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Notifikasi</span>
          {filtered.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
              {filtered.length}
            </span>
          )}
        </div>
        {filtered.length > 0 && (
          <button
            onClick={markAllRead}
            disabled={isPending}
            className="text-xs text-brand-primary hover:underline disabled:opacity-50 font-medium"
          >
            {isPending ? "..." : "Tandai semua dibaca"}
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-2"><Bell size={20} /></div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Semua beres!</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Tidak ada notifikasi baru</p>
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
          {filtered.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => go(n)}
                disabled={isPending}
                className="w-full text-left px-4 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors flex items-start gap-3 disabled:opacity-50"
              >
                <span className="mt-0.5 flex-shrink-0 text-[var(--text-secondary)]">{React.createElement(ICON[n.type], { size: 16 })}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">{n.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-snug">{n.message}</p>
                </div>
                {n.urgency === "high" && (
                  <span className="flex-shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-danger" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[var(--border)] text-center">
          <p className="text-[10px] text-[var(--text-secondary)]">
            Notifikasi yang dibaca hilang selama 24 jam
          </p>
        </div>
      )}
    </div>
  );
}
