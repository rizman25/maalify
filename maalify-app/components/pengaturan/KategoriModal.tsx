"use client";

import { useState } from "react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
  is_default: boolean;
  household_id: string | null;
}

interface Props {
  mode: "add" | "edit";
  category?: Category;
  householdId: string;
  onClose: () => void;
  onSaved: () => void;
}

const PRESET_COLORS = [
  "#1E3A5F","#27AE60","#E74C3C","#F59E0B","#8B5CF6",
  "#2471A3","#F97316","#06B6D4","#EC4899","#10B981",
  "#6366F1","#84CC16",
];

const COMMON_ICONS = [
  "🏠","🍔","🚗","👕","💊","📚","✈️","🎮","💄","🐾",
  "🎵","⚽","🍕","☕","🛒","💰","💳","🏋️","🎁","📱",
  "🔧","🌱","🏖️","🎭","📷","🚌","🍜","🥗","🧴","🪴",
];

export default function KategoriModal({ mode, category, householdId, onClose, onSaved }: Props) {
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "💰");
  const [color, setColor] = useState(category?.color ?? "#1E3A5F");
  const [type, setType] = useState<"expense" | "income">(
    (category?.type as "expense" | "income") ?? "expense"
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) { setError("Nama kategori harus diisi"); return; }
    setLoading(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (mode === "add") {
        const { error: err } = await supabase.from("categories").insert({
          household_id: householdId,
          name: name.trim(),
          icon,
          color,
          type,
          is_default: false,
        });
        if (err) throw err;
      } else if (category) {
        const { error: err } = await supabase.from("categories").update({
          name: name.trim(), icon, color,
        }).eq("id", category.id);
        if (err) throw err;
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!category) return;
    setDeleting(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase.from("categories").delete().eq("id", category.id);
      if (err) throw err;
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {mode === "add" ? "Tambah Kategori" : "Edit Kategori"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: color + "20" }}>
              {icon}
            </div>
            <div>
              <p className="font-medium text-[var(--text-primary)] text-sm">{name || "Nama kategori"}</p>
              <p className="text-xs text-[var(--text-secondary)]">{type === "expense" ? "Pengeluaran" : "Pemasukan"}</p>
            </div>
          </div>

          {/* Tipe (add only) */}
          {mode === "add" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Tipe</label>
              <div className="grid grid-cols-2 gap-2">
                {(["expense","income"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                      type === t
                        ? t === "expense" ? "bg-red-50 border-red-400 text-red-600" : "bg-green-50 border-green-400 text-green-700"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
                    }`}>
                    {t === "expense" ? "📤 Pengeluaran" : "📥 Pemasukan"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Nama</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="cth. Belanja Online, Freelance..."
              maxLength={50}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors placeholder:text-[var(--text-secondary)]/50"
            />
          </div>

          {/* Icon picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Ikon</label>
            <div className="grid grid-cols-10 gap-1.5">
              {COMMON_ICONS.map(em => (
                <button key={em} type="button" onClick={() => setIcon(em)}
                  className={`h-8 rounded-lg text-base flex items-center justify-center transition-all ${
                    icon === em ? "bg-brand-primary/10 ring-1 ring-brand-primary" : "hover:bg-[var(--bg-elevated)]"
                  }`}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Warna</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-[var(--text-primary)]" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Delete */}
          {mode === "edit" && !category?.is_default && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="w-full text-center text-sm text-red-500 hover:text-red-600 py-1">
              Hapus Kategori
            </button>
          )}
          {confirmDelete && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <p className="text-sm text-red-700 font-medium">Hapus kategori ini?</p>
              <p className="text-xs text-red-600">Transaksi yang sudah menggunakan kategori ini tidak terpengaruh.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">Batal</button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60">
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">Batal</button>
          <button type="button" onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-60 transition-colors">
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
