"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Wallet, ArrowRightLeft, Users, BarChart2, Target, RefreshCw, Image } from "@/lib/icons";
import type { LucideProps } from "lucide-react";

type ItemIcon = React.ComponentType<LucideProps>;

const ITEMS: {
  key: string;
  Icon: ItemIcon;
  label: string;
  href: string;
  cta: string;
  core: boolean;
}[] = [
  { key: "hasWallet",           Icon: Wallet,         label: "Tambah dompet pertama",        href: "/dompet",     cta: "Tambah",   core: true  },
  { key: "hasTransaction",      Icon: ArrowRightLeft, label: "Catat transaksi pertama",       href: "/transaksi",  cta: "Catat",    core: true  },
  { key: "hasMultipleMembers",  Icon: Users,          label: "Undang anggota keluarga",       href: "/pengaturan", cta: "Undang",   core: false },
  { key: "hasBudget",           Icon: BarChart2,      label: "Atur anggaran bulanan",         href: "/anggaran",   cta: "Atur",     core: false },
  { key: "hasGoal",             Icon: Target,         label: "Buat target tabungan",          href: "/tabungan",   cta: "Buat",     core: false },
  { key: "hasRecurring",        Icon: RefreshCw,      label: "Tambah transaksi berulang",     href: "/berulang",   cta: "Tambah",   core: false },
  { key: "hasAvatar",           Icon: Image,          label: "Tambah foto profil",            href: "/pengaturan", cta: "Edit",     core: false },
];

type StatusMap = Record<string, boolean>;

export default function SetupChecklistWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<StatusMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem("maalify_setup_dismissed") === "true") {
      setDismissed(true);
      return;
    }
    fetchStatus();

    // Listen for open event from sidebar (mobile)
    function handleOpenEvent() { setOpen(true); }
    window.addEventListener("open-setup-checklist", handleOpenEvent);
    return () => window.removeEventListener("open-setup-checklist", handleOpenEvent);
  }, []);

  async function fetchStatus() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) return;
      const hid = membership.household_id;

      const [walletsRes, txRes, membersRes, budgetsRes, goalsRes, recurringRes, profileRes] = await Promise.all([
        supabase.from("wallets").select("id", { count: "exact", head: true }).eq("household_id", hid).eq("is_active", true),
        supabase.from("transactions").select("id", { count: "exact", head: true }).eq("household_id", hid),
        supabase.from("household_members").select("id", { count: "exact", head: true }).eq("household_id", hid),
        supabase.from("budgets").select("id", { count: "exact", head: true }).eq("household_id", hid),
        supabase.from("savings_goals").select("id", { count: "exact", head: true }).eq("household_id", hid).eq("is_completed", false),
        supabase.from("recurring_transactions").select("id", { count: "exact", head: true }).eq("household_id", hid),
        supabase.from("users").select("avatar_url").eq("id", user.id).single(),
      ]);

      setStatus({
        hasWallet:          (walletsRes.count ?? 0) > 0,
        hasTransaction:     (txRes.count ?? 0) > 0,
        hasMultipleMembers: (membersRes.count ?? 0) > 1,
        hasBudget:          (budgetsRes.count ?? 0) > 0,
        hasGoal:            (goalsRes.count ?? 0) > 0,
        hasRecurring:       (recurringRes.count ?? 0) > 0,
        hasAvatar:          !!(profileRes.data?.avatar_url),
      });
    } finally {
      setLoading(false);
    }
  }

  function dismiss() {
    localStorage.setItem("maalify_setup_dismissed", "true");
    setDismissed(true);
    setOpen(false);
  }

  // Auto-dismiss saat semua langkah selesai
  useEffect(() => {
    if (!loading && Object.keys(status).length > 0) {
      const allComplete = ITEMS.every(item => status[item.key]);
      if (allComplete) {
        const timer = setTimeout(() => {
          localStorage.setItem("maalify_setup_dismissed", "true");
          setDismissed(true);
          setOpen(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, status]);

  if (!mounted || dismissed) return null;

  const doneCount = ITEMS.filter(item => status[item.key]).length;
  const total = ITEMS.length;
  const allDone = doneCount === total;
  const remaining = total - doneCount;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <>
      {/* Panel */}
      {open && (
        <div
          className="fixed z-[60] shadow-2xl rounded-2xl overflow-hidden bottom-[5.5rem] lg:bottom-[5.5rem]"
          style={{
            right: "1rem",
            width: "min(340px, calc(100vw - 2rem))",
            maxHeight: "75vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex-shrink-0"
            style={{ backgroundColor: "#1E3A5F" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-white">
                  {allDone ? "Setup selesai!" : "Setup Family-mu"}
                </p>
                <p className="text-[11px] text-blue-200">
                  {allDone
                    ? "Semua langkah selesai!"
                    : `${remaining} langkah lagi untuk memaksimalkan Maalify`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-blue-200 hover:text-white transition-colors ml-2 flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: allDone ? "#27AE60" : "#60A5FA",
                  }}
                />
              </div>
              <span className="text-[11px] font-bold text-white flex-shrink-0">{doneCount}/{total}</span>
            </div>
          </div>

          {/* Items list */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-5 h-5 border-2 border-[#1E3A5F] border-t-transparent rounded-full" />
              </div>
            ) : (
              <div>
                {ITEMS.map((item, idx) => {
                  const done = status[item.key] ?? false;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]"
                      style={{
                        borderBottom: idx < ITEMS.length - 1 ? "1px solid var(--border)" : "none",
                        opacity: done ? 0.55 : 1,
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          borderColor: done ? "#27AE60" : "#CBD5E1",
                          backgroundColor: done ? "#27AE60" : "transparent",
                        }}
                      >
                        {done && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>

                      {/* Icon */}
                      <div className="flex-shrink-0 text-[var(--text-secondary)]">
                        <item.Icon size={16} />
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-medium leading-tight"
                          style={{
                            color: done ? "var(--text-secondary)" : "var(--text-primary)",
                            textDecoration: done ? "line-through" : "none",
                          }}
                        >
                          {item.label}
                          {item.core && !done && (
                            <span
                              className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded"
                              style={{ backgroundColor: "#DBEAFE", color: "#1E40AF" }}
                            >
                              Wajib
                            </span>
                          )}
                        </p>
                      </div>

                      {/* CTA */}
                      {!done && (
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
                          style={{ backgroundColor: "#1E3A5F", color: "white" }}
                        >
                          {item.cta} →
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 flex-shrink-0 flex items-center justify-between"
            style={{ borderTop: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)" }}
          >
            {allDone ? (
              <button
                onClick={dismiss}
                className="text-xs font-medium w-full text-center transition-colors"
                style={{ color: "#27AE60" }}
              >
                Tutup checklist ini
              </button>
            ) : (
              <>
                <button
                  onClick={dismiss}
                  className="text-[11px] transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Jangan tampilkan lagi
                </button>
                <button
                  onClick={fetchStatus}
                  className="text-[11px] transition-colors"
                  style={{ color: "#1E3A5F" }}
                >
                  ↻ Refresh
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed z-[60] hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95
          lg:bottom-[5.5rem]"
        style={{
          right: open ? "calc(340px + 1.5rem)" : "1rem",
          backgroundColor: allDone ? "#27AE60" : "#1E3A5F",
          color: "white",
          transition: "right 0.2s ease, background-color 0.3s ease, transform 0.1s ease",
        }}
      >
        <Target size={14} />
        <span className="text-xs font-semibold whitespace-nowrap">
          {allDone ? "Setup Selesai!" : "Get Started!"}
        </span>
        {!allDone && !loading && (
          <span
            className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#E74C3C", color: "white" }}
          >
            {remaining}
          </span>
        )}
      </button>
    </>
  );
}
