"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Project, ProjectItem, ProjectStatus } from "@/types";
import ProjectModal from "@/components/project/ProjectModal";
import ProjectItemModal from "@/components/project/ProjectItemModal";
import KontribusiModal from "@/components/project/KontribusiModal";

interface Wallet {
  id: string;
  name: string;
  type: string;
  current_balance: number;
}

interface Props {
  projects: Project[];
  wallets: Wallet[];
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
  | { kind: "kontribusi"; project: Project };

export const PROJECT_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  trip:      { label: "Trip",        emoji: "✈️" },
  wedding:   { label: "Pernikahan",  emoji: "💍" },
  property:  { label: "Properti",    emoji: "🏠" },
  purchase:  { label: "Pembelian",   emoji: "🛒" },
  education: { label: "Pendidikan",  emoji: "📚" },
  vehicle:   { label: "Kendaraan",   emoji: "🚗" },
  health:    { label: "Kesehatan",   emoji: "🏥" },
  other:     { label: "Lainnya",     emoji: "📦" },
};

export const PROJECT_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  planning:  { label: "Perencanaan", cls: "bg-blue-100 text-blue-700" },
  active:    { label: "Aktif",       cls: "bg-green-100 text-green-700" },
  completed: { label: "Selesai",     cls: "bg-[var(--bg-elevated)] text-[var(--text-secondary)]" },
  cancelled: { label: "Dibatalkan",  cls: "bg-red-100 text-red-600" },
};

function getProjectCurrentAmount(p: Project): number {
  if (p.wallets) {
    const w = Array.isArray(p.wallets) ? p.wallets[0] : p.wallets;
    return (w as { current_balance: number })?.current_balance ?? p.current_amount;
  }
  return p.current_amount;
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

export default function ProjectPageClient({
  projects, wallets, householdId, userId, userRole,
}: Props) {
  const router = useRouter();
  const canManage = userRole !== "member";
  const [view, setView] = useState<View>("list");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modal, setModal] = useState<ModalState>(null);

  const handleSaved = useCallback(() => {
    setModal(null);
    router.refresh();
  }, [router]);

  const handleItemSaved = useCallback(async () => {
    setModal(null);
    if (selectedProject) {
      await loadItems(selectedProject.id);
    }
  }, [selectedProject]);

  async function loadItems(projectId: string) {
    setLoadingItems(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data } = await supabase
      .from("project_items")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order")
      .order("created_at");
    setProjectItems(data ?? []);
    setLoadingItems(false);
  }

  async function openDetail(project: Project) {
    setSelectedProject(project);
    setView("detail");
    await loadItems(project.id);
  }

  function goBack() {
    setView("list");
    setSelectedProject(null);
    setProjectItems([]);
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
    const current = getProjectCurrentAmount(proj);
    const pct = proj.target_amount > 0 ? Math.min((current / proj.target_amount) * 100, 100) : 0;
    const days = daysLeft(proj.target_date);
    const typeInfo = PROJECT_TYPE_LABELS[proj.type] ?? PROJECT_TYPE_LABELS.other;
    const statusInfo = PROJECT_STATUS_LABELS[proj.status] ?? PROJECT_STATUS_LABELS.planning;
    const totalPlanned = projectItems.reduce((s, i) => s + i.planned_amount, 0);
    const totalPaid = projectItems.filter(i => i.is_paid).reduce((s, i) => s + (i.actual_amount ?? i.planned_amount), 0);
    const unpaidItems = projectItems.filter(i => !i.is_paid);
    const paidItems = projectItems.filter(i => i.is_paid);

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
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center text-3xl flex-shrink-0">
                {proj.cover_emoji ?? typeInfo.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-[var(--text-primary)]">{proj.name}</h1>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[var(--text-secondary)]">{typeInfo.emoji} {typeInfo.label}</span>
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
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Terkumpul</p>
                  <p className="font-financial font-bold text-xl text-brand-accent">
                    Rp {formatRupiah(current)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)]">Target</p>
                  <p className="font-financial font-semibold text-[var(--text-primary)]">
                    Rp {formatRupiah(proj.target_amount)}
                  </p>
                </div>
              </div>
              <div className="w-full h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-accent transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>{pct.toFixed(1)}% tercapai</span>
                <span>Target: {formatDate(proj.target_date)}</span>
              </div>
            </div>
          </div>

          {/* Summary chips */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-3 text-center">
              <p className="text-xs text-[var(--text-secondary)]">Total Item</p>
              <p className="font-semibold text-[var(--text-primary)] text-lg">{projectItems.length}</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-3 text-center">
              <p className="text-xs text-[var(--text-secondary)]">Sudah Dibayar</p>
              <p className="font-semibold text-success text-lg">{paidItems.length}</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-3 text-center">
              <p className="text-xs text-[var(--text-secondary)]">Total Anggaran</p>
              <p className="font-financial font-semibold text-[var(--text-primary)] text-sm">Rp {formatRupiah(totalPlanned)}</p>
            </div>
          </div>

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
                <div className="text-3xl">📋</div>
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
                      />
                    ))}
                  </div>
                )}

                {paidItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase px-1">
                      Sudah Dibayar ({paidItems.length})
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

                {/* Total row */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--bg-elevated)] mt-2">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Total Rencana</p>
                    <p className="font-financial font-semibold text-sm text-[var(--text-primary)]">Rp {formatRupiah(totalPlanned)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-secondary)]">Sudah Dibayar</p>
                    <p className="font-financial font-semibold text-sm text-success">Rp {formatRupiah(totalPaid)}</p>
                  </div>
                </div>
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
              router.refresh();
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
              router.refresh();
              if (selectedProject) loadItems(selectedProject.id);
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
            <div className="w-20 h-20 rounded-3xl bg-[var(--bg-elevated)] flex items-center justify-center text-4xl">
              🎯
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
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-2xl flex-shrink-0">
                      {proj.cover_emoji ?? typeInfo.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-semibold text-[var(--text-primary)] text-sm leading-tight line-clamp-1">{proj.name}</p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{typeInfo.emoji} {typeInfo.label}</p>
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

function ItemRow({ item, onEdit }: { item: ProjectItem; onEdit?: () => void }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] transition-colors ${item.is_paid ? "opacity-70" : ""} ${onEdit ? "hover:bg-[var(--bg-elevated)] cursor-pointer" : "cursor-default"}`}
      onClick={onEdit}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        item.is_paid ? "border-success bg-success" : "border-[var(--border)]"
      }`}>
        {item.is_paid && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.is_paid ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
          {item.name}
        </p>
        {item.is_paid && item.paid_at && (
          <p className="text-[10px] text-[var(--text-secondary)]">
            Dibayar {new Date(item.paid_at + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </p>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {item.is_paid && item.actual_amount != null ? (
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
    </div>
  );
}
