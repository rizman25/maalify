"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import type { Project, ProjectType, ProjectStatus } from "@/types";

interface Wallet { id: string; name: string; type: string; current_balance: number; }

interface Props {
  mode: "create" | "edit";
  project?: Project;
  householdId: string;
  userId: string;
  wallets: Wallet[];
  onClose: () => void;
  onSaved: () => void;
}

const PROJECT_TYPES: { value: ProjectType; label: string; emoji: string }[] = [
  { value: "trip",      label: "Trip",       emoji: "✈️" },
  { value: "wedding",   label: "Pernikahan", emoji: "💍" },
  { value: "property",  label: "Properti",   emoji: "🏠" },
  { value: "purchase",  label: "Pembelian",  emoji: "🛒" },
  { value: "education", label: "Pendidikan", emoji: "📚" },
  { value: "vehicle",   label: "Kendaraan",  emoji: "🚗" },
  { value: "health",    label: "Kesehatan",  emoji: "🏥" },
  { value: "other",     label: "Lainnya",    emoji: "📦" },
];

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "planning",  label: "Perencanaan" },
  { value: "active",    label: "Aktif" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

const EMOJI_OPTIONS = ["✈️","💍","🏠","🛒","📚","🚗","🏥","📦","🎯","🏖️","🎓","💼","🎪","🏕️","⛵","🎸","🌏","🏆","💡","🎁"];

function formatAmountInput(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
}

function parseAmount(val: string) {
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
}

export default function ProjectModal({ mode, project, householdId, userId, wallets, onClose, onSaved }: Props) {
  const isEdit = mode === "edit";
  const today = new Date().toISOString().split("T")[0];

  const [name, setName] = useState(project?.name ?? "");
  const [type, setType] = useState<ProjectType>(project?.type ?? "other");
  const [description, setDescription] = useState(project?.description ?? "");
  const [coverEmoji, setCoverEmoji] = useState(project?.cover_emoji ?? "");
  const [targetAmount, setTargetAmount] = useState(isEdit ? String(project!.target_amount) : "");
  const [currentAmount, setCurrentAmount] = useState(isEdit ? String(project!.current_amount) : "");
  const [targetDate, setTargetDate] = useState(project?.target_date ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "planning");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const parsedAmount = parseAmount(targetAmount);
  const parsedCurrentAmount = parseAmount(currentAmount);
  const selectedTypeInfo = PROJECT_TYPES.find(t => t.value === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Nama project wajib diisi."); return; }
    if (parsedAmount <= 0) { setError("Target dana harus lebih dari 0."); return; }
    if (!targetDate) { setError("Target tanggal wajib diisi."); return; }

    setError("");
    setLoading(true);
    const supabase = createClient();

    if (isEdit && project) {
      const { error: err } = await supabase
        .from("projects")
        .update({
          name: name.trim(),
          type,
          description: description.trim() || null,
          cover_emoji: coverEmoji || null,
          target_amount: parsedAmount,
          current_amount: parsedCurrentAmount,
          target_date: targetDate,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (err) { setError(err.message); setLoading(false); return; }

      // Sync wallet balance if project has a wallet
      if (project.wallet_id && parsedCurrentAmount !== project.current_amount) {
        await supabase
          .from("wallets")
          .update({ current_balance: parsedCurrentAmount })
          .eq("id", project.wallet_id);
      }
    } else {
      // Create dedicated wallet for this project
      const walletName = `💼 ${name.trim()}`;
      const initBalance = parsedCurrentAmount > 0 ? parsedCurrentAmount : 0;
      const { data: newWallet, error: walletErr } = await supabase
        .from("wallets")
        .insert({
          household_id: householdId,
          name: walletName,
          type: "savings",
          initial_balance: initBalance,
          current_balance: initBalance,
          currency: "IDR",
          is_active: true,
          created_by: userId,
        })
        .select("id")
        .single();

      if (walletErr || !newWallet) {
        setError(walletErr?.message ?? "Gagal membuat dompet project.");
        setLoading(false);
        return;
      }

      const { error: projErr } = await supabase.from("projects").insert({
        household_id: householdId,
        wallet_id: newWallet.id,
        name: name.trim(),
        type,
        description: description.trim() || null,
        cover_emoji: coverEmoji || null,
        target_amount: parsedAmount,
        current_amount: parsedCurrentAmount,
        target_date: targetDate,
        status,
        created_by: userId,
      });

      if (projErr) { setError(projErr.message); setLoading(false); return; }
    }

    onSaved();
  }

  async function handleDelete() {
    if (!project) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("projects").delete().eq("id", project.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Project" : "Buat Project Baru"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Emoji + Name row */}
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0">
              <p className="text-xs font-medium text-[var(--text-primary)] mb-1.5">Ikon</p>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center text-2xl hover:border-brand-primary transition-colors"
              >
                {coverEmoji || selectedTypeInfo?.emoji || "📦"}
              </button>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Nama Project</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="contoh: Trip ke Bali 2026"
                maxLength={100}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className="grid grid-cols-10 gap-1 p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
              {EMOJI_OPTIONS.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => { setCoverEmoji(em); setShowEmojiPicker(false); }}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-[var(--bg-surface)] transition-colors ${coverEmoji === em ? "bg-brand-primary/10 ring-1 ring-brand-primary" : ""}`}
                >
                  {em}
                </button>
              ))}
              {coverEmoji && (
                <button
                  type="button"
                  onClick={() => { setCoverEmoji(""); setShowEmojiPicker(false); }}
                  className="w-8 h-8 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Type grid */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Tipe Project</label>
            <div className="grid grid-cols-4 gap-2">
              {PROJECT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={[
                    "flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-[10px] font-medium transition-colors",
                    type === t.value
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                  ].join(" ")}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Target Dana</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(targetAmount)}
                onChange={(e) => setTargetAmount(e.target.value.replace(/\./g, ""))}
                placeholder="0"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[var(--border)] text-lg text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            {parsedAmount > 0 && (
              <p className="text-xs text-[var(--text-secondary)] mt-1">Rp {formatRupiah(parsedAmount)}</p>
            )}
          </div>

          {/* Saldo sudah tersedia */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Saldo Sudah Tersedia{" "}
              <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(currentAmount)}
                onChange={(e) => setCurrentAmount(e.target.value.replace(/\./g, ""))}
                placeholder="0"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            {parsedCurrentAmount > 0 && parsedAmount > 0 && (
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Progress awal: {Math.min((parsedCurrentAmount / parsedAmount) * 100, 100).toFixed(0)}% dari target
              </p>
            )}
          </div>

          {/* Target date + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Target Tanggal</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={today}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Deskripsi <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan atau tujuan project..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            />
          </div>

          {!isEdit && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 text-blue-700 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Dompet khusus untuk project ini akan dibuat otomatis.
            </div>
          )}

          {error && (
            <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Menyimpan..." : isEdit ? "Simpan" : "Buat Project"}
            </button>
          </div>

          {isEdit && (
            <div className="border-t border-[var(--border)] pt-4">
              {!showDelete ? (
                <button type="button" onClick={() => setShowDelete(true)} className="w-full text-xs text-danger hover:underline">
                  Hapus project ini
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-danger font-medium">Hapus project?</p>
                  <p className="text-xs text-[var(--text-secondary)]">Semua rincian anggaran akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowDelete(false)} className="flex-1 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">Batal</button>
                    <button type="button" onClick={handleDelete} disabled={loading} className="flex-1 py-2 text-xs rounded-lg bg-danger text-white font-medium hover:opacity-90 disabled:opacity-50">
                      {loading ? "..." : "Ya, Hapus"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
      </div>
    </div>
  );
}
