"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { RECURRING_BADGE_KEY } from "@/components/dashboard/RecurringReminderChecker";

type Role = "super_admin" | "admin" | "member";

const mainNav = [
  { label: "Dashboard",        href: "/dashboard",           roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { label: "Transaksi",        href: "/transaksi",           roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { label: "Berulang",         href: "/transaksi-berulang",  roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> },
  { label: "Dompet",           href: "/dompet",              roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg> },
  { label: "Anggaran",         href: "/anggaran",            roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { label: "Tabungan",          href: "/tabungan",            roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12l4-4"/></svg> },
  { label: "Hutang & Piutang", href: "/hutang",              roles: ["super_admin","admin"] as Role[],          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { label: "Project Keluarga", href: "/project",             roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
  { label: "Laporan",          href: "/laporan",             roles: ["super_admin","admin"] as Role[],          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg> },
];

const settingsNav = [
  { label: "Pengaturan", href: "/pengaturan", roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
  { label: "Kategori",  href: "/kategori",   roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
  { label: "Panduan",   href: "/panduan",    roles: ["super_admin","admin","member"] as Role[], icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
];

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  member: "Member",
};

const ROLE_COLOR: Record<Role, string> = {
  super_admin: "bg-amber-100 text-amber-700",
  admin: "bg-brand-primary/10 text-brand-primary",
  member: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
};

function NavItem({ href, icon, label, badge }: { href: string; icon: React.ReactNode; label: string; badge?: number }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  // derive tour ID: /transaksi → tour-nav-transaksi, /transaksi-berulang → tour-nav-transaksi-berulang
  const tourId = `tour-nav-${href.replace(/^\//, "").replace(/\//g, "-")}`;

  return (
    <Link
      href={href}
      id={tourId}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-brand-primary text-white"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className={cn(
          "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center leading-none",
          isActive ? "bg-white/30 text-white" : "bg-red-500 text-white"
        )}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

interface Props {
  userRole?: Role;
}

export default function Sidebar({ userRole = "member" }: Props) {
  const visibleMain    = mainNav.filter(item => item.roles.includes(userRole));
  const visibleSettings = settingsNav.filter(item => item.roles.includes(userRole));
  const pathname = usePathname();

  // Baca pending recurring count dari localStorage (diisi oleh RecurringReminderChecker)
  const [recurringPending, setRecurringPending] = useState(0);

  useEffect(() => {
    function readBadge() {
      try {
        const val = localStorage.getItem(RECURRING_BADGE_KEY);
        setRecurringPending(val ? parseInt(val, 10) : 0);
      } catch { /* ignore */ }
    }
    readBadge();

    // Update saat storage berubah (mis. setelah RecurringReminderChecker selesai)
    window.addEventListener("storage", readBadge);
    return () => window.removeEventListener("storage", readBadge);
  }, []);

  // Hapus badge saat user sedang di halaman berulang
  useEffect(() => {
    if (pathname.startsWith("/transaksi-berulang")) {
      try {
        localStorage.setItem(RECURRING_BADGE_KEY, "0");
        setRecurringPending(0);
      } catch { /* ignore */ }
    }
  }, [pathname]);

  return (
    <aside className="w-60 flex-shrink-0 bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-[var(--text-primary)] text-lg tracking-tight">Maalify</span>
        </div>
        {/* Role badge */}
        <span className={cn("mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full", ROLE_COLOR[userRole])}>
          {ROLE_LABEL[userRole]}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-3 mb-2">Menu Utama</p>
          {visibleMain.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              badge={item.href === "/transaksi-berulang" && userRole !== "member" ? recurringPending : undefined}
            />
          ))}
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-3 mb-2">Pengaturan</p>
          {visibleSettings.map((item) => <NavItem key={item.href} {...item} />)}
        </div>

        {/* Get Started + Install — mobile only */}
        <div className="lg:hidden space-y-0.5">
          <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-3 mb-2">Lainnya</p>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-setup-checklist"));
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span>Get Started!</span>
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-install-modal"));
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Install Aplikasi</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
