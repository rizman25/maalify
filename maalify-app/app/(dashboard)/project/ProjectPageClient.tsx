"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRefresh } from "@/hooks/useRefresh";
import { formatRupiah } from "@/lib/utils";
import type { Project, ProjectItem, ProjectStatus } from "@/types";
import { Plane, Home, Target, Receipt, Car, HeartPulse, Package, ShoppingCart } from "@/lib/icons";
import type { LucideProps } from "lucide-react";
import { GraduationCap, Diamond } from "lucide-react";
import ProjectModal from "@/components/project/ProjectModal";
import ProjectItemModal from "@/components/project/ProjectItemModal";
import KontribusiModal from "@/components/project/KontribusiModal";
import ProjectItemPayModal from "@/components/project/ProjectItemPayModal";
import TransaksiModal from "@/components/transaksi/TransaksiModal";
import { syncProjectPaidItems } from "@/app/actions/projects";
import type { Category } from "@/types";

interface Wallet {
  id: string;
  name: string;
  type: string;
  current_balance: number;
}

interface Props {
  projects: Project[];
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
  userRole: string;
}

type View = "list" | "detail";
type StatusFilter = "all" | ProjectStatus;
type ModalState =
  | null
  | { kind: "create" }
  | { kind: "edit"; project: Project }
  | { kind: "item"; projectId: string; item?: ProjectItem }
  | { kind: "kontribusi"; project: Project }
  | { kind: "transaksi"; walletId: string }
  | { kind: "pay"; item: ProjectItem };

export const PROJECT_TYPE_LABELS: Record<string, { label: string; Icon: React.ComponentType<LucideProps> }> = {
  trip:      { label: "Trip",        Icon: Plane },
  wedding:   { label: "Pernikahan",  Icon: Diamond },
  property:  { label: "Properti",    Icon: Home },
  purchase:  { label: "Pembelian",   Icon: ShoppingCart },
  education: { label: "Pendidikan",  Icon: GraduationCap },
  vehicle:   { label: "Kendaraan",   Icon: Car },
  health:    { label: "Kesehatan",   Icon: HeartPulse },
  other:     { label: "Lainnya",     Icon: Package },
};

export const PROJECT_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  planning:  { label: "Perencanaan", cls: "bg-blue-100 text-blue-700" },
  active:    { label: "Aktif",       cls: "bg-green-100 text-green-700" },
  completed: { label: "Selesai",     cls: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]" },
  cancelled: { label: "Dibatalkan",  cls: "bg-red-100 text-red-600" },
};

function getProjectCurrentAmount(p: Project): number {
  // Gunakan current_amount (gross kontribusi), bukan wallet balance
  // wallet balance berkurang saat bayar item, tapi "terkumpul" tidak boleh berkurang
  // Fallback ke wallet balance hanya jika current_amount belum pernah diisi (= 0)
  if (p.current_amount > 0) return p.current_amount;
  if (p.wallets) {
    const w = Array.isArray(p.wallets) ? p.wallets[0] : p.wallets;
    return (w as { current_balance: number })?.current_balance ?? 0;
  }
  return 0;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function daysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface Contribution {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  from_wallet_id: string | null;
  walletName?: string;
}

interface ExpenseTx {
  id: string;
  amount: number;
  date: string;
  description: string | null;
}

export default function ProjectPageClient({
  projects, wallets, categories, householdId, userId, userRole,
}: Props) {
  const router = useRouter();
  const { refresh } = useRefresh();
  const canManage = userRole !== "member";
  const [view, setView] = useState<View>("list");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenseTxs, setExpenseTxs] = useState<ExpenseTx[]>([]);
  const [showContributions, setShowContributions] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modal, setModal] = useState<ModalState>(null);

  const handleSaved = useCallback(() => {
    setModal(null);
    refresh();
  }, [router]);

  const handleItemSaved = useCallback(async () => {
    setModal(null);
    if (selectedProject) {
      await loadItems(selectedProject.id, selectedProject.wallet_id ?? undefined);
    }
  }, [selectedProject]);

  async function loadItems(projectId: string, walletId?: string) {
    setLoadingItems(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const [itemsRes, contribRes, walletRes, expenseRes] = await Promise.all([
      supabase
        .from("project_items")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order")
        .order("created_at"),

      walletId
        ? supabase
            .from("transfers")
            .select("id, amount, date, description, from_wallet_id")
            .eq("household_id", householdId)
            .eq("to_wallet_id", walletId)
            .order("date", { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [] }),

      // Fetch project wallet initial_balance & created_at for "Setoran Awal"
      walletId
        ? supabase
            .from("wallets")
            .select("initial_balance, created_at")
            .eq("id", walletId)
            .single()
        : Promise.resolve({ data: null }),

      // Fetch expense transactions dari project wallet (Riwayat Pengeluaran)
      walletId
        ? supabase
            .from("transactions")
            .select("id, amount, date, description")
            .eq("wallet_id", walletId)
            .eq("type", "expense")
            .order("date", { ascending: false })
            .limit(200)
        : Promise.resolve({ data: [] }),
    ]);

    // Fetch wallet names (including inactive) for name lookup
    const fromIds = [...new Set((contribRes.data ?? []).map((c: { from_wallet_id: string | null }) => c.from_wallet_id).filter(Boolean))];
    let walletNameMap: Record<string, string> = {};
    if (fromIds.length > 0) {
      const { data: wData } = await supabase.from("wallets").select("id, name").in("id", fromIds as string[]);
      walletNameMap = Object.fromEntries((wData ?? []).map(w => [w.id, w.name]));
    }

    const transferContribs: Contribution[] = ((contribRes.data ?? []) as Contribution[]).map(c => ({
      ...c,
      walletName: c.from_wallet_id ? (walletNameMap[c.from_wallet_id] ?? "—") : "—",
    }));

    // Prepend synthetic "Setoran Awal" entry from wallet initial_balance (oldest, so at end of list)
    const walletData = walletRes.data as { initial_balance: number; created_at: string } | null;
    const allContribs: Contribution[] = [...transferContribs];
    if (walletData && walletData.initial_balance > 0) {
      allContribs.push({
        id: "initial-balance",
        amount: walletData.initial_balance,
        date: walletData.created_at.split("T")[0],
        description: null,
        from_wallet_id: null,
        walletName: "Setoran Awal",
      });
    }

    setProjectItems(itemsRes.data ?? []);
    setContributions(allContribs);
    setExpenseTxs((expenseRes.data ?? []) as ExpenseTx[]);
    setLoadingItems(false);

    // Backfill: deduct wallet for any paid items that have no transaction yet
    syncProjectPaidItems(projectId).then(({ synced }) => {
      if (synced > 0) refresh();
    });
  }

  async function openDetail(project: Project) {
    setSelectedProject(project);
    setView("detail");
    setShowContributions(false);
    setShowExpenses(false);
    await loadItems(project.id, project.wallet_id ?? undefined);
  }

  function goBack() {
    setView("list");
    setSelectedProject(null);
    setProjectItems([]);
    setContributions([]);
    setExpenseTxs([]);
    setShowContributions(false);
  }

  const filteredProjects = statusFilter === "all"
    ? projects
    : projects.filter(p => p.status === statusFilter);

  const statusCounts: Record<string, number> = {
    all:       projects.length,
    planning:  projects.filter(p => p.status === "planning").length,
    active:    projects.filter(p => p.status === "active").length,
    completed: projects.filter(p => p.status === "completed").length,
    cancelled: projects.filter(p => p.status === "cancelled").length,
  };

  /* ─── Detail View ─── */
  if (view === "detail" && selectedProject) {
    const proj = selectedProject;
    const walletBalance = (() => {
      if (proj.wallets) {
        const w = Array.isArray(proj.wallets) ? proj.wallets[0] : proj.wallets;
        return (w as { current_balance: number })?.current_balance ?? 0;
      }
      return 0;
    })();
    const totalPlanned = projectItems.reduce((s, i) => s + i.planned_amount, 0);
    const totalPaid = projectItems.filter(i => i.is_paid).reduce((s, i) => s + (i.actual_amount ?? i.planned_amount), 0);
    // Terkumpul = current_amount project (gross kontribusi, tidak berkurang saat bayar)
    // Saat items masih loading gunakan current_amount, setelah load bisa cross-check dengan walletBalance + totalPaid
    const current = getProjectCurrentAmount(proj);
    const pct = proj.target_amount > 0 ? Math.min((current / proj.target_amount) * 100, 100) : 0;
    const days = daysLeft(proj.target_date);
    const typeInfo = PROJECT_TYPE_LABELS[proj.type] ?? PROJECT_TYPE_LABELS.other;
    const statusInfo = PROJECT_STATUS_LABELS[proj.status] ?? PROJECT_STATUS_LABELS.planning;
    const spentPct = proj.target_amount > 0 ? Math.min((totalPaid / proj.target_amount) * 100, 100) : 0;
    const unpaidItems = projectItems.filter(i => !i.is_paid);
    // DP / Sebagian: is_paid=true TAPI actual_amount < planned_amount
    const dpItems    = projectItems.filter(i => i.is_paid && i.actual_amount != null && i.actual_amount < i.planned_amount);
    // Lunas: is_paid=true DAN actual_amount >= planned_amount (atau null = sesuai rencana)
    const paidItems  = projectItems.filter(i => i.is_paid && (i.actual_amount == null || i.actual_amount >= i.planned_amount));

    return (
      <div className="min-h-full">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Back + actions */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Kembali
            </button>
            <div className="flex gap-2">
              {proj.status === "active" || proj.status === "planning" ? (
                <button
                  onClick={() => setModal({ kind: "kontribusi", project: proj })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-accent text-white text-sm font-medium hover:bg-brand-accent/90 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Kontribusi
                </button>
              ) : null}
              {proj.wallet_id && (
                <button
                  onClick={() => setModal({ kind: "transaksi", walletId: proj.wallet_id! })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Transaksi
                </button>
              )}
              {canManage && (
                <button
                  onClick={() => setModal({ kind: "edit", project: proj })}
                  className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Project header card */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]">
                {proj.cover_emoji ? <span className="text-3xl">{proj.cover_emoji}</span> : <typeInfo.Icon size={28} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-[var(--text-primary)]">{proj.name}</h1>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><typeInfo.Icon size={12} /> {typeInfo.label}</span>
                  <span className="text-[var(--border)]">·</span>
                  <span className={`text-xs font-medium ${days < 0 ? "text-danger" : days <= 30 ? "text-warning" : "text-[var(--text-secondary)]"}`}>
                    {days < 0
                      ? `${Math.abs(days)} hari terlambat`
                      : days === 0
                      ? "Hari ini"
                      : `${days} hari lagi`}
                  </span>
                </div>
                {proj.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5">{proj.description}</p>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">{pct.toFixed(1)}% dari target</span>
                <span className="font-financial font-semibold text-[var(--text-primary)]">Rp {formatRupiah(proj.target_amount)}</span>
              </div>
              <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden relative">
                {/* Collected / funded bar */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
                {/* Spent / paid bar — overlaid in amber */}
                {spentPct > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-warning transition-all duration-500"
                    style={{ width: `${spentPct}%` }}
                  />
                )}
              </div>
              <p className="text-[10px] text-[var(--text-secondary)]">Target: {formatDate(proj.target_date)}</p>

              {/* 3-metric breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center px-2 py-2.5 rounded-xl bg-brand-accent/8">
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight mb-1">Dana Terkumpul</p>
                  <p className="font-financial font-bold text-sm text-brand-accent leading-tight">Rp {formatRupiah(current)}</p>
                </div>
                <div className="text-center px-2 py-2.5 rounded-xl bg-warning/8">
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight mb-1">Digunakan</p>
                  <p className="font-financial font-bold text-sm text-warning leading-tight">Rp {formatRupiah(totalPaid)}</p>
                </div>
                <div className="text-center px-2 py-2.5 rounded-xl bg-brand-primary/8">
                  <p className="text-[10px] text-[var(--text-secondary)] leading-tight mb-1">Dana Tersedia</p>
                  <p className="font-financial font-bold text-sm text-brand-primary leading-tight">Rp {formatRupiah(Math.max(0, current - totalPaid))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary chips — item stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-3 text-center">
              <p className="text-xs text-[var(--text-secondary)]">Total Item</p>
              <p className="font-semibold text-[var(--text-primary)] text-lg">{projectItems.length}</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-xl border border-warning/30 p-3 text-center">
              <p className="text-xs text-[var(--text-secondary)]">DP</p>
              <p className="font-semibold text-warning text-lg">{dpItems.length}</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-xl border border-success/20 p-3 text-center">
              <p className="text-xs text-[var(--text-secondary)]">Lunas</p>
              <p className="font-semibold text-success text-lg">{paidItems.length}</p>
            </div>
          </div>
          {/* Budget summary */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Total Anggaran Item</p>
              <p className="font-financial font-semibold text-sm text-[var(--text-primary)]">Rp {formatRupiah(totalPlanned)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-secondary)]">Sudah Dibayar</p>
              <p className="font-financial font-semibold text-sm text-success">Rp {formatRupiah(totalPaid)}</p>
            </div>
          </div>

          {/* Riwayat Kontribusi */}
          {contributions.length > 0 && (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowContributions(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-accent/15 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent">
                      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Riwayat Kontribusi</span>
                  <span className="text-xs bg-brand-accent/10 text-brand-accent font-medium px-2 py-0.5 rounded-full">{contributions.length}</span>
                </div>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`text-[var(--text-secondary)] transition-transform duration-200 ${showContributions ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showContributions && (
                <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                  {contributions.map(c => (
                    <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${c.id === "initial-balance" ? "bg-[var(--bg-elevated)]/50" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${c.id === "initial-balance" ? "bg-[var(--text-secondary)]/10 text-[var(--text-secondary)]" : "bg-brand-accent/10 text-brand-accent"}`}>
                        {c.id === "initial-balance" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
                            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                            {c.walletName ?? "—"}
                          </p>
                          {c.id === "initial-balance" && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] flex-shrink-0">AWAL</span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-[10px] text-[var(--text-secondary)] truncate">{c.description}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-financial text-sm font-semibold ${c.id === "initial-balance" ? "text-[var(--text-secondary)]" : "text-brand-accent"}`}>
                          +Rp {formatRupiah(c.amount)}
                        </p>
                        <p className="text-[10px] text-[var(--text-secondary)]">
                          {new Date(c.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Riwayat Pengeluaran — dari transactions (per pembayaran/termin) */}
          {expenseTxs.length > 0 && (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowExpenses(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-warning/15 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">Riwayat Pengeluaran</span>
                  <span className="text-xs bg-warning/10 text-warning font-medium px-2 py-0.5 rounded-full">{expenseTxs.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-financial text-xs font-semibold text-warning">
                    Rp {formatRupiah(expenseTxs.reduce((s, t) => s + t.amount, 0))}
                  </span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-[var(--text-secondary)] transition-transform duration-200 ${showExpenses ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </button>

              {showExpenses && (
                <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                  {expenseTxs.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-warning/10 text-warning flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.description ?? "—"}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-financial text-sm font-semibold text-warning">-Rp {formatRupiah(tx.amount)}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">
                          {new Date(tx.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Items section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Rincian Anggaran</p>
              {canManage && (
                <button
                  onClick={() => setModal({ kind: "item", projectId: proj.id })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white text-xs font-medium hover:bg-brand-primary/90 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Tambah Item
                </button>
              )}
            </div>

            {loadingItems ? (
              <div className="py-8 text-center text-sm text-[var(--text-secondary)]">Memuat...</div>
            ) : projectItems.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto"><Receipt size={24} /></div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Belum ada rincian anggaran</p>
                <p className="text-xs text-[var(--text-secondary)]">Tambahkan item seperti tiket, hotel, atau pengeluaran lain</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unpaidItems.length > 0 && (
                  <div className="space-y-2">
                    {unpaidItems.map(item => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onEdit={canManage ? () => setModal({ kind: "item", projectId: proj.id, item }) : undefined}
                        onPay={canManage ? () => setModal({ kind: "pay", item }) : undefined}
                      />
                    ))}
                  </div>
                )}

                {dpItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-semibold text-warning tracking-widest uppercase px-1">
                      DP / Belum Lunas ({dpItems.length})
                    </p>
                    {dpItems.map(item => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onEdit={canManage ? () => setModal({ kind: "item", projectId: proj.id, item }) : undefined}
                        onPay={canManage ? () => setModal({ kind: "pay", item }) : undefined}
                      />
                    ))}
                  </div>
                )}

                {paidItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-1">
                      Lunas ({paidItems.length})
                    </p>
                    {paidItems.map(item => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onEdit={canManage ? () => setModal({ kind: "item", projectId: proj.id, item }) : undefined}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {modal?.kind === "edit" && (
          <ProjectModal
            mode="edit"
            project={modal.project}
            householdId={householdId}
            userId={userId}
            wallets={wallets}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              refresh();
              goBack();
            }}
          />
        )}
        {modal?.kind === "item" && (
          <ProjectItemModal
            projectId={modal.projectId}
            item={modal.item}
            userId={userId}
            onClose={() => setModal(null)}
            onSaved={handleItemSaved}
          />
        )}
        {modal?.kind === "kontribusi" && (
          <KontribusiModal
            project={modal.project}
            wallets={wallets.filter(w => w.id !== modal.project.wallet_id)}
            userId={userId}
            householdId={householdId}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              refresh();
              if (selectedProject) loadItems(selectedProject.id, selectedProject.wallet_id ?? undefined);
            }}
          />
        )}
        {modal?.kind === "pay" && (
          <ProjectItemPayModal
            item={modal.item}
            userId={userId}
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              if (selectedProject) loadItems(selectedProject.id, selectedProject.wallet_id ?? undefined);
            }}
          />
        )}
        {modal?.kind === "transaksi" && (
          <TransaksiModal
            transaction={null}
            wallets={wallets}
            categories={categories}
            householdId={householdId}
            userId={userId}
            defaultWalletId={modal.walletId}
            forceShared
            onClose={() => setModal(null)}
            onSaved={() => {
              setModal(null);
              refresh();
              if (selectedProject) loadItems(selectedProject.id, selectedProject.wallet_id ?? undefined);
            }}
          />
        )}
      </div>
    );
  }

  /* ─── List View ─── */
  return (
    <div className="min-h-full">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Project Keluarga</h1>
            <p className="text-sm text-[var(--text-secondary)]">Rencanakan dan capai tujuan keuangan bersama</p>
          </div>
          {canManage && (
            <button
              onClick={() => setModal({ kind: "create" })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Buat Project
            </button>
          )}
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "active", "planning", "completed", "cancelled"] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                statusFilter === s
                  ? "bg-brand-primary text-white"
                  : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {s === "all" ? "Semua" : PROJECT_STATUS_LABELS[s]?.label} ({statusCounts[s] ?? 0})
            </button>
          ))}
        </div>

        {/* Projects grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Target size={40} />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)] text-base">
                {statusFilter === "all" ? "Belum ada project" : `Tidak ada project ${PROJECT_STATUS_LABELS[statusFilter]?.label.toLowerCase()}`}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Buat project pertama — trip, pernikahan, beli rumah, dan lainnya
              </p>
            </div>
            {statusFilter === "all" && canManage && (
              <button
                onClick={() => setModal({ kind: "create" })}
                className="px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90"
              >
                Buat Project Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProjects.map(proj => {
              const current = getProjectCurrentAmount(proj);
              const pct = proj.target_amount > 0 ? Math.min((current / proj.target_amount) * 100, 100) : 0;
              const days = daysLeft(proj.target_date);
              const typeInfo = PROJECT_TYPE_LABELS[proj.type] ?? PROJECT_TYPE_LABELS.other;
              const statusInfo = PROJECT_STATUS_LABELS[proj.status] ?? PROJECT_STATUS_LABELS.planning;

              return (
                <div
                  key={proj.id}
                  className={`bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer ${
                    proj.status === "cancelled" || proj.status === "completed" ? "opacity-70" : ""
                  }`}
                  onClick={() => openDetail(proj)}
                >
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center flex-shrink-0 text-[var(--text-secondary)]">
                      {proj.cover_emoji ? <span className="text-2xl">{proj.cover_emoji}</span> : <typeInfo.Icon size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-[var(--text-primary)] text-sm leading-tight line-clamp-1">{proj.name}</p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1"><typeInfo.Icon size={11} /> {typeInfo.label}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-financial font-semibold text-brand-accent">Rp {formatRupiah(current)}</span>
                      <span className="text-[var(--text-secondary)]">/ Rp {formatRupiah(proj.target_amount)}</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${proj.status === "completed" ? "bg-success" : "bg-brand-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                      <span>{pct.toFixed(0)}%</span>
                      <span className={days < 0 ? "text-danger" : days <= 30 ? "text-warning" : ""}>
                        {days < 0
                          ? `${Math.abs(days)}h terlambat`
                          : days === 0
                          ? "Hari ini"
                          : `${days}h lagi`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.kind === "create" && (
        <ProjectModal
          mode="create"
          householdId={householdId}
          userId={userId}
          wallets={wallets}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal?.kind === "edit" && (
        <ProjectModal
          mode="edit"
          project={modal.project}
          householdId={householdId}
          userId={userId}
          wallets={wallets}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ItemRow({ item, onEdit, onPay }: { item: ProjectItem; onEdit?: () => void; onPay?: () => void }) {
  const isDP = item.is_paid && item.actual_amount != null && item.actual_amount < item.planned_amount;
  const remaining = isDP ? item.planned_amount - (item.actual_amount ?? 0) : 0;
  const canPay = onPay && (!item.is_paid || isDP);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-[var(--bg-surface)] transition-colors ${
        isDP ? "border-warning/40" : item.is_paid ? "border-[var(--border)] opacity-70" : "border-[var(--border)]"
      } ${onEdit ? "hover:bg-[var(--bg-elevated)] cursor-pointer" : "cursor-default"}`}
      onClick={onEdit}
    >
      {/* Status icon */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        isDP ? "border-warning bg-warning/10" :
        item.is_paid ? "border-success bg-success" :
        "border-[var(--border)]"
      }`}>
        {isDP ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        ) : item.is_paid ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : null}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.is_paid && !isDP ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
          {item.name}
        </p>
        {isDP && item.paid_at && (
          <p className="text-[10px] text-warning">
            DP {new Date(item.paid_at + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · Sisa Rp {formatRupiah(remaining)}
          </p>
        )}
        {!isDP && item.is_paid && item.paid_at && (
          <p className="text-[10px] text-[var(--text-secondary)]">
            Lunas {new Date(item.paid_at + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        {isDP ? (
          <div>
            <p className="font-financial text-xs font-semibold text-warning">Rp {formatRupiah(item.actual_amount!)}</p>
            <p className="font-financial text-[10px] text-[var(--text-secondary)]">dari Rp {formatRupiah(item.planned_amount)}</p>
          </div>
        ) : item.is_paid && item.actual_amount != null ? (
          <div>
            <p className="font-financial text-xs font-semibold text-success">Rp {formatRupiah(item.actual_amount)}</p>
            {item.actual_amount !== item.planned_amount && (
              <p className="font-financial text-[10px] text-[var(--text-secondary)] line-through">Rp {formatRupiah(item.planned_amount)}</p>
            )}
          </div>
        ) : (
          <p className="font-financial text-sm font-semibold text-[var(--text-primary)]">Rp {formatRupiah(item.planned_amount)}</p>
        )}
      </div>

      {/* Tombol Bayar — hanya untuk unpaid/DP */}
      {canPay && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onPay!(); }}
          className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            isDP
              ? "bg-warning/10 text-warning hover:bg-warning/20"
              : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
          }`}
        >
          Bayar
        </button>
      )}
    </div>
  );
}
