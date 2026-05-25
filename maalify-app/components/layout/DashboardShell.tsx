"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import TourDriver from "@/components/onboarding/TourDriver";
import GlobalSearch from "@/components/search/GlobalSearch";
import AiChatWidget from "@/components/chat/AiChatWidget";
import SetupChecklistWidget from "@/components/dashboard/SetupChecklistWidget";
import PageTransition from "@/components/ui/PageTransition";
import { DebtReminderChecker } from "@/components/hutang/DebtReminderChecker";
import type { AppNotification } from "@/types";

interface Props {
  householdName: string;
  userName: string;
  avatarUrl?: string | null;
  userRole: "super_admin" | "admin" | "member";
  notifications: AppNotification[];
  hasWallets: boolean;
  householdId: string;
  userId: string;
  children: React.ReactNode;
}

export default function DashboardShell({ householdName, userName, avatarUrl, userRole, notifications, hasWallets, householdId, userId, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Sidebar toggle untuk tablet/desktop (lg:) — state diingat via localStorage
  const [lgSidebarOpen, setLgSidebarOpen] = useState(true);
  // Init from DOM directly — anti-FOUC script already set the class
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );
  const pathname = usePathname();

  // Baca state sidebar dari localStorage setelah mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("maalify-sidebar-open");
      setLgSidebarOpen(saved === null ? true : saved === "true");
    } catch { /* ignore */ }
  }, []);

  function toggleLgSidebar() {
    const next = !lgSidebarOpen;
    setLgSidebarOpen(next);
    try { localStorage.setItem("maalify-sidebar-open", String(next)); } catch { /* ignore */ }
  }

  // Safety net: re-sync dark class from localStorage after React hydration.
  // Necessary because React's hydration commit can remove the 'dark' class
  // that was added by the anti-FOUC script before React mounted.
  useEffect(() => {
    const saved = localStorage.getItem("maalify-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("maalify-theme", next ? "dark" : "light");
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      {/* Desktop sidebar — always in DOM on lg, width animates for smooth slide */}
      <div className={`hidden lg:block overflow-hidden flex-shrink-0 transition-[width] duration-300 ease-in-out ${lgSidebarOpen ? "w-64" : "w-0"}`}>
        <div className="w-64 h-full">
          <Sidebar userRole={userRole} onCollapse={toggleLgSidebar} />
        </div>
      </div>

      {/* Re-open sidebar button — fades in when sidebar is collapsed on lg: */}
      <button
        onClick={toggleLgSidebar}
        className={`hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-5 h-12 bg-[var(--bg-surface)] border-y border-r border-[var(--border)] rounded-r-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] shadow-sm transition-all duration-300 ${lgSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100 pointer-events-auto"}`}
        title="Tampilkan sidebar"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className="absolute left-0 inset-y-0 w-64 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar userRole={userRole} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          householdName={householdName}
          userName={userName}
          avatarUrl={avatarUrl}
          darkMode={darkMode}
          onToggleDark={toggleDark}
          onMenuClick={() => setSidebarOpen(true)}
          notifications={notifications}
          onSearchClick={() => setSearchOpen(true)}
        />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav userRole={userRole} onMenuClick={() => setSidebarOpen(true)} />

      {/* Global search modal */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Onboarding wizard — shown once for new users with no wallet */}
      {!hasWallets && (
        <OnboardingWizard
          householdId={householdId}
          userId={userId}
          userName={userName}
        />
      )}

      {/* Debt due-date reminder — fires once per 24h on app open */}
      <DebtReminderChecker householdId={householdId} />

      {/* Setup Checklist Widget */}
      <SetupChecklistWidget />

      {/* AI Chat Widget */}
      <AiChatWidget />

      {/* Onboarding Tour — spotlight tour untuk user baru */}
      <TourDriver />
    </div>
  );
}
