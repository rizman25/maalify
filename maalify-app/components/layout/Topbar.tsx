"use client";

import { useState } from "react";
import LogoutButton from "./LogoutButton";
import NotificationPanel from "./NotificationPanel";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { AppNotification } from "@/types";
import { loadNotifPrefs } from "@/app/(dashboard)/pengaturan/PengaturanPageClient";

interface TopbarProps {
  householdName: string;
  userName: string;
  avatarUrl?: string | null;
  darkMode: boolean;
  onToggleDark: () => void;
  onMenuClick: () => void;
  onSearchClick: () => void;
  notifications: AppNotification[];
}

export default function Topbar({ householdName, userName, avatarUrl, darkMode, onToggleDark, onMenuClick, onSearchClick, notifications }: TopbarProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [notifPrefs] = useState(() => loadNotifPrefs());
  const visibleNotifications = notifications.filter(n => notifPrefs[n.type] !== false);
  const highCount = visibleNotifications.filter(n => n.urgency === "high").length;
  const badgeCount = visibleNotifications.length;

  return (
    <header className="h-14 flex-shrink-0 bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 flex items-center justify-between gap-3">
      {/* Left: logo (mobile) + household name */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="lg:hidden flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider leading-none">Keluarga</p>
          <h2 className="font-semibold text-[var(--text-primary)] leading-tight text-sm truncate">{householdName}</h2>
        </div>
      </div>

      {/* Right: dark mode + notifications + avatar + logout */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Dark mode toggle */}
        <ThemeToggle dark={darkMode} onToggle={onToggleDark} size="sm" />

        {/* Search button */}
        <button
          onClick={onSearchClick}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors"
          title="Cari (Ctrl+K)"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span>Cari</span>
          <kbd className="px-1 py-0.5 text-[10px] bg-[var(--bg-surface)] rounded border border-[var(--border)]">Ctrl K</kbd>
        </button>
        {/* Search icon only — mobile */}
        <button
          onClick={onSearchClick}
          className="sm:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          aria-label="Cari"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors relative"
            aria-label="Notifikasi"
            title="Notifikasi"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {badgeCount > 0 && (
              <span className={[
                "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center",
                highCount > 0 ? "bg-danger" : "bg-warning",
              ].join(" ")}>
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </button>
          {panelOpen && (
            <NotificationPanel
              notifications={notifications}
              onClose={() => setPanelOpen(false)}
            />
          )}
        </div>

        {/* Avatar + name (hidden on xs) */}
        <div className="hidden sm:flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">{userName}</p>
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-semibold">{initials}</span>
            )}
          </div>
        </div>

        <LogoutButton />
      </div>
    </header>
  );
}
