"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRefresh } from "@/hooks/useRefresh";
import { formatRupiah } from "@/lib/utils";
import { Toast, useToast } from "@/components/ui/Toast";
import { CategoryIcon } from "@/lib/icons";
import { Target, Home, Car, Plane, TrendingUp, HeartPulse, Wallet, Baby, Briefcase } from "@/lib/icons";
import { GraduationCap, Heart } from "lucide-react";

interface Goal {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  is_completed: boolean;
  created_at: string;
}

interface Wallet {
  id: string;
  name: string;
  type: string;
  current_balance: number;
}

interface Props {
  goals: Goal[];
  wallets: Wallet[];
  householdId: string;
  userId: string;
  userRole: "super_admin" | "admin" | "member";
}

const ICON_OPTIONS = [
  { slug: "target",      Icon: Target },
  { slug: "home",        Icon: Home },
  { slug: "plane",       Icon: Plane },
  { slug: "graduation",  Icon: GraduationCap },
  { slug: "heart",       Icon: Heart },
  { slug: "car",         Icon: Car },
  { slug: "trending-up", Icon: TrendingUp },
  { slug: "heart-pulse", Icon: HeartPulse },
  { slug: "wallet",      Icon: Wallet },
  { slug: "baby",        Icon: Baby },
  { slug: "briefcase",   Icon: Briefcase },
];
const COLOR_OPTIONS = ["#3B82F6","#10B981","#F59E0B","#EF4444","#8B5CF6","#EC4899","#06B6D4","#84CC16"];

type ModalState =
  | { type: "add" }
  | { type: "edit"; goal: Goal }
  | { type: "topup"; goal: Goal }
  | { type: "withdraw"; goal: Goal }
  | { type: "detail"; goal: Goal }
  | null;

export default function TabunganPageClient({ goals, wallets, householdId, userId, userRole }: Props) {
  const router = useRouter();
  const { refresh } = useRefresh();
  const { toast, showToast, dismissToast } = useToast();
  const [modal, setModal] = useState<ModalState>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [optimisticGoals, setOptimisticGoals] = useState<Goal[]>(goals);

  // Sync optimistic state when server data arrives after refresh()
  useEffect(() => { setOptimisticGoals(goals); }, [goals]);

  function handleContributeSaved(goalId: string, signedAmount: number) {
    setOptimisticGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const newAmount = Number(g.current_amount) + signedAmount;
      return {
        ...g,
        current_amount: newAmount,
        is_completed: newAmount >= Number(g.target_amount),
      };
    }));
    showToast(signedAmount > 0 ? "Dana berhasil ditambahkan" : "Dana berhasil ditarik");
    setModal(null);
    refresh();
  }

  const filtered = optimisticGoals.filter(g =>
    filter === "all" ? true : filter === "completed" ? g.is_completed : !g.is_completed
  );

  const totalTarget  = optimisticGoals.filter(g => !g.is_completed).reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved   = optimisticGoals.filter(g => !g.is_completed).reduce((s, g) => s + Number(g.current_amount), 0);
  const completedCount = optimisticGoals.filter(g => g.is_completed).length;

  return (
    <div className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Tabungan & Goals</h1>
            <p className="text-sm text-[var(--text-secondary)]">Target keuangan keluarga</p>
          </div>
          <button
            onClick={() => setModal({ type: "add" })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Buat Goal
          </button>
        </div>

        {/* Summary cards */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold">Total Target</p>
              <p className="font-financial text-lg font-bold text-[var(--text-primary)] mt-1">Rp {formatRupiah(totalTarget)}</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold">Total Tersimpan</p>
              <p className="font-financial text-lg font-bold text-success mt-1">Rp {formatRupiah(totalSaved)}</p>
            </div>
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-4">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold">Selesai</p>
              <p className="font-financial text-lg font-bold text-brand-primary mt-1">{completedCount} Goal</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {(["active","all","completed"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f ? "bg-brand-primary text-white" : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              {f === "active" ? "Aktif" : f === "completed" ? "Selesai" : "Semua"}
            </button>
          ))}
        </div>

        {/* Goals grid */}
        {filtered.length === 0 ? (
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
              {filter === "active" && completedCount > 0
                ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><polyline points="22 4 12 14 9 11"/></svg>
                : <Target size={32} />}
            </div>
            {filter === "active" && completedCount > 0 ? (
              <>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Semua goal sudah selesai! 🎉</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {completedCount} goal telah tercapai
                </p>
                <button onClick={() => setFilter("completed")}
                  className="mt-4 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                  Lihat goal selesai →
                </button>
              </>
            ) : filter === "completed" ? (
              <>
                <p className="text-sm font-medium text-[var(--text-primary)]">Belum ada goal yang selesai</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Selesaikan goal aktif untuk melihatnya di sini
                </p>
                {goals.filter(g => !g.is_completed).length > 0 && (
                  <button onClick={() => setFilter("active")}
                    className="mt-3 text-xs text-brand-primary hover:underline">
                    Lihat goal aktif →
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--text-primary)]">Belum ada goal</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Buat target keuangan pertama kamu</p>
                <button onClick={() => setModal({ type: "add" })}
                  className="mt-4 px-4 py-2 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90">
                  + Buat Goal
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(g => <GoalCard key={g.id} goal={g} onTopUp={() => setModal({ type: "topup", goal: g })} onEdit={() => setModal({ type: "edit", goal: g })} onDetail={() => setModal({ type: "detail", goal: g })} />)}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "add" && (
        <GoalFormModal
          householdId={householdId}
          userId={userId}
          onClose={() => setModal(null)}
          onSaved={() => { showToast("Goal berhasil dibuat"); setModal(null); refresh(); }}
        />
      )}
      {modal?.type === "edit" && (
        <GoalFormModal
          householdId={householdId}
          userId={userId}
          goal={modal.goal}
          onClose={() => setModal(null)}
          onSaved={() => { showToast("Goal berhasil diperbarui"); setModal(null); refresh(); }}
          userRole={userRole}
        />
      )}
      {modal?.type === "topup" && (
        <ContributeModal
          goal={modal.goal}
          wallets={wallets}
          userId={userId}
          mode="topup"
          onClose={() => setModal(null)}
          onSaved={handleContributeSaved}
        />
      )}
      {modal?.type === "withdraw" && (
        <ContributeModal
          goal={modal.goal}
          wallets={wallets}
          userId={userId}
          mode="withdraw"
          onClose={() => setModal(null)}
          onSaved={handleContributeSaved}
        />
      )}
      {modal?.type === "detail" && (
        <DetailModal
          goal={modal.goal}
          onClose={() => setModal(null)}
          onTopUp={() => setModal({ type: "topup", goal: modal.goal })}
          onWithdraw={() => setModal({ type: "withdraw", goal: modal.goal })}
          onEdit={() => setModal({ type: "edit", goal: modal.goal })}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />}
    </div>
  );
}

// ── Goal Card ──────────────────────────────────────────────────────────────────
function GoalCard({ goal, onTopUp, onEdit, onDetail }: {
  goal: Goal;
  onTopUp: () => void;
  onEdit: () => void;
  onDetail: () => void;
}) {
  const pct = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100));
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));

  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;

  return (
    <button onClick={onDetail} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-5 text-left hover:border-brand-primary/30 transition-all hover:shadow-sm w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: goal.color + "20", color: goal.color }}>
            <CategoryIcon slug={goal.icon} size={20} />
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)] text-sm leading-tight">{goal.name}</p>
            {goal.is_completed ? (
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Selesai</span>
            ) : daysLeft !== null ? (
              <span className={`text-[10px] font-medium ${daysLeft < 0 ? "text-danger" : daysLeft < 30 ? "text-warning" : "text-[var(--text-secondary)]"}`}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}h terlambat` : daysLeft === 0 ? "Hari ini!" : `${daysLeft} hari lagi`}
              </span>
            ) : null}
          </div>
        </div>
        <span className="text-xs font-bold" style={{ color: goal.color }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: goal.is_completed ? "#10B981" : goal.color }} />
      </div>

      {/* Amounts */}
      <div className="flex justify-between text-xs mb-4">
        <span className="text-[var(--text-secondary)]">
          Rp <span className="font-semibold text-[var(--text-primary)] font-financial">{formatRupiah(Number(goal.current_amount))}</span>
        </span>
        <span className="text-[var(--text-secondary)]">
          Target Rp <span className="font-financial">{formatRupiah(Number(goal.target_amount))}</span>
        </span>
      </div>

      {/* Action */}
      {!goal.is_completed && (
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={onTopUp}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: goal.color }}>
            + Tambah Dana
          </button>
        </div>
      )}

      {!goal.is_completed && remaining > 0 && (
        <p className="text-[10px] text-[var(--text-secondary)] mt-2 text-center">
          Kurang Rp {formatRupiah(remaining)}
        </p>
      )}
    </button>
  );
}

// ── Goal Form Modal (Add/Edit) ─────────────────────────────────────────────────
function GoalFormModal({ householdId, userId, goal, onClose, onSaved, userRole }: {
  householdId: string;
  userId: string;
  goal?: Goal;
  onClose: () => void;
  onSaved: () => void;
  userRole?: string;
}) {
  const isEdit = !!goal;
  const [name, setName] = useState(goal?.name ?? "");
  const [desc, setDesc] = useState(goal?.description ?? "");
  const [target, setTarget] = useState(goal ? String(Math.round(Number(goal.target_amount))) : "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? "target");
  const [color, setColor] = useState(goal?.color ?? "#3B82F6");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Nama goal harus diisi"); return; }
    const targetNum = parseInt(target.replace(/\D/g, ""), 10);
    if (!targetNum || targetNum <= 0) { setError("Target harus lebih dari 0"); return; }

    setSaving(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (isEdit) {
        const { error: err } = await supabase.from("savings_goals").update({
          name: name.trim(), description: desc.trim() || null,
          target_amount: targetNum, deadline: deadline || null,
          icon, color, updated_at: new Date().toISOString(),
        }).eq("id", goal.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("savings_goals").insert({
          household_id: householdId, created_by: userId,
          name: name.trim(), description: desc.trim() || null,
          target_amount: targetNum, current_amount: 0,
          deadline: deadline || null, icon, color,
        });
        if (err) throw err;
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!goal) return;
    setDeleting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase.from("savings_goals").delete().eq("id", goal.id);
      if (err) throw err;
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
    } finally { setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-6 bg-black/40">
      <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-2xl shadow-2xl max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-bold text-[var(--text-primary)]">{isEdit ? "Edit Goal" : "Buat Goal Baru"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <div className="px-5 py-5 space-y-4">
          {/* Icon & Color picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Ikon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(opt => (
                <button key={opt.slug} type="button" onClick={() => setIcon(opt.slug)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${icon === opt.slug ? "ring-2 ring-brand-primary bg-brand-primary/5 text-brand-primary" : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)]"}`}>
                  <opt.Icon size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Warna</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-[var(--text-secondary)]" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] rounded-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + "20", color }}>
              <CategoryIcon slug={icon} size={20} />
            </div>
            <p className="font-semibold text-[var(--text-primary)] text-sm">{name || "Nama Goal"}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Goal</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={60}
              placeholder="Contoh: Dana Darurat, DP Rumah..."
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Deskripsi <span className="font-normal italic">(opsional)</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} maxLength={200}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors resize-none" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Target Amount</label>
            <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-brand-primary transition-colors">
              <span className="text-sm text-[var(--text-secondary)] font-medium flex-shrink-0">Rp</span>
              <input type="text" inputMode="numeric"
                value={target ? Number(target.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                onChange={e => setTarget(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                className="flex-1 bg-transparent text-[var(--text-primary)] font-financial text-base font-semibold outline-none placeholder:text-[var(--text-secondary)]/40" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Deadline <span className="font-normal italic">(opsional)</span></label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors" />
          </div>

          {error && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {confirmDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-danger">Hapus goal ini?</p>
              <p className="text-xs text-[var(--text-secondary)]">Goal <span className="font-semibold text-[var(--text-primary)]">{goal?.name}</span> dan semua riwayat kontribusinya akan dihapus permanen.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                  Batal
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2 rounded-xl bg-danger text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 pt-1">
              {isEdit && (
                <button type="button" onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-danger text-sm hover:bg-red-50 transition-colors">
                  Hapus
                </button>
              )}
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                Batal
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                {saving ? "Menyimpan..." : isEdit ? "Simpan" : "Buat Goal"}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Contribute Modal (Top Up / Withdraw) ───────────────────────────────────────
function ContributeModal({ goal, wallets, userId, mode, onClose, onSaved }: {
  goal: Goal;
  wallets: Wallet[];
  userId: string;
  mode: "topup" | "withdraw";
  onClose: () => void;
  onSaved: (goalId: string, signedAmount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isTopUp = mode === "topup";
  const maxWithdraw = Number(goal.current_amount);

  async function handleSubmit() {
    const num = parseInt(amount.replace(/\D/g, ""), 10);
    if (!num || num <= 0) { setError("Jumlah harus lebih dari 0"); return; }
    if (!isTopUp && num > maxWithdraw) { setError(`Maksimal penarikan Rp ${formatRupiah(maxWithdraw)}`); return; }
    if (isTopUp && walletId) {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet && num > wallet.current_balance) { setError(`Saldo ${wallet.name} tidak cukup`); return; }
    }

    setSaving(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const signedAmount = isTopUp ? num : -num;
      const newBalance = Number(goal.current_amount) + signedAmount;
      const isCompleted = newBalance >= Number(goal.target_amount);

      // Primary write — modal closes after this
      const { error: contErr } = await supabase.from("savings_contributions").insert({
        goal_id: goal.id,
        wallet_id: walletId || null,
        amount: signedAmount,
        note: note.trim() || null,
        created_by: userId,
      });
      if (contErr) throw contErr;

      // Close modal & apply optimistic update immediately
      onSaved(goal.id, signedAmount);

      // Secondary writes — fire-and-forget, refresh() will re-sync anyway
      const updates: Promise<unknown>[] = [
        supabase.from("savings_goals").update({
          current_amount: newBalance,
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        }).eq("id", goal.id).then(),
      ];
      if (walletId) {
        const wallet = wallets.find(w => w.id === walletId);
        if (wallet) {
          updates.push(
            supabase.from("wallets")
              .update({ current_balance: Number(wallet.current_balance) - signedAmount })
              .eq("id", walletId).then()
          );
        }
      }
      Promise.all(updates).catch(console.error);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      setSaving(false);
    }
  }

  const pct = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-6 bg-black/40">
      <div className="bg-[var(--bg-surface)] w-full max-w-sm rounded-2xl shadow-2xl max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-bold text-[var(--text-primary)]">{isTopUp ? "Tambah Dana" : "Tarik Dana"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <div className="px-5 py-5 space-y-4">
          {/* Goal summary */}
          <div className="bg-[var(--bg-elevated)] rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: goal.color + "20", color: goal.color }}><CategoryIcon slug={goal.icon} size={16} /></div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{goal.name}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Rp {formatRupiah(Number(goal.current_amount))} / Rp {formatRupiah(Number(goal.target_amount))}</p>
              </div>
              <span className="ml-auto text-xs font-bold" style={{ color: goal.color }}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
            </div>
          </div>

          {/* Wallet selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {isTopUp ? "Ambil dari Dompet" : "Kembalikan ke Dompet"}
            </label>
            <select value={walletId} onChange={e => setWalletId(e.target.value)}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors">
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} — Rp {formatRupiah(w.current_balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Jumlah</label>
            <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-brand-primary transition-colors">
              <span className="text-sm text-[var(--text-secondary)] font-medium flex-shrink-0">Rp</span>
              <input type="text" inputMode="numeric"
                value={amount ? Number(amount.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="0"
                className="flex-1 bg-transparent text-[var(--text-primary)] font-financial text-lg font-semibold outline-none placeholder:text-[var(--text-secondary)]/40" />
            </div>
            {!isTopUp && (
              <p className="text-[10px] text-[var(--text-secondary)]">Tersimpan: Rp {formatRupiah(maxWithdraw)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Catatan <span className="font-normal italic">(opsional)</span></label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} maxLength={100}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors" />
          </div>

          {error && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Batal
            </button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: goal.color }}>
              {saving ? "Menyimpan..." : isTopUp ? "Tambah Dana" : "Tarik Dana"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────
function DetailModal({ goal, onClose, onTopUp, onWithdraw, onEdit }: {
  goal: Goal;
  onClose: () => void;
  onTopUp: () => void;
  onWithdraw: () => void;
  onEdit: () => void;
}) {
  const pct = Math.min(100, Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100));
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-6 bg-black/40">
      <div className="bg-[var(--bg-surface)] w-full max-w-sm rounded-2xl shadow-2xl max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-bold text-[var(--text-primary)]">Detail Goal</h2>
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
        <div className="px-5 py-5 space-y-4">
          {/* Icon + name */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: goal.color + "20", color: goal.color }}><CategoryIcon slug={goal.icon} size={28} /></div>
            <div>
              <p className="font-bold text-lg text-[var(--text-primary)]">{goal.name}</p>
              {goal.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{goal.description}</p>}
              {goal.is_completed && <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Selesai</span>}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Progress</span>
              <span className="font-bold" style={{ color: goal.color }}>{pct}%</span>
            </div>
            <div className="h-3 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: goal.is_completed ? "#10B981" : goal.color }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Tersimpan</p>
              <p className="font-financial font-bold text-sm text-[var(--text-primary)] mt-0.5">Rp {formatRupiah(Number(goal.current_amount))}</p>
            </div>
            <div className="bg-[var(--bg-elevated)] rounded-xl p-3">
              <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Target</p>
              <p className="font-financial font-bold text-sm text-[var(--text-primary)] mt-0.5">Rp {formatRupiah(Number(goal.target_amount))}</p>
            </div>
            {!goal.is_completed && remaining > 0 && (
              <div className="bg-[var(--bg-elevated)] rounded-xl p-3">
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Kurang</p>
                <p className="font-financial font-bold text-sm text-danger mt-0.5">Rp {formatRupiah(remaining)}</p>
              </div>
            )}
            {goal.deadline && (
              <div className="bg-[var(--bg-elevated)] rounded-xl p-3">
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Deadline</p>
                <p className="font-bold text-sm mt-0.5" style={{ color: daysLeft !== null && daysLeft < 0 ? "#EF4444" : "var(--text-primary)" }}>
                  {new Date(goal.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}
          </div>

          {!goal.is_completed && (
            <div className="flex gap-3">
              <button onClick={() => { onClose(); onWithdraw(); }}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                Tarik Dana
              </button>
              <button onClick={() => { onClose(); onTopUp(); }}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: goal.color }}>
                + Tambah Dana
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
