"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import TourModal from "@/components/onboarding/TourModal";
import GlobalSearch from "@/components/search/GlobalSearch";
import AiChatWidget from "@/components/chat/AiChatWidget";
import SetupChecklistWidget from "@/components/dashboard/SetupChecklistWidget";
import PageTransition from "@/components/ui/PageTransition";
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
  // Init from DOM directly — anti-FOUC script already set the class
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );
  const pathname = usePathname();

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
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex">
        <Sidebar userRole={userRole} />
      </div>

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

      {/* Setup Checklist Widget */}
      <SetupChecklistWidget />

      {/* AI Chat Widget */}
      <AiChatWidget />

      {/* Onboarding Tour — hanya muncul sekali untuk user baru */}
      <TourModal />
    </div>
  );
}
