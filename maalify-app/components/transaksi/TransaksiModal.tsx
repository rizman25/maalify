"use client";

import { useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, Category, TransactionWithCategory, TransactionType, TransactionVisibility } from "@/types";

interface Props {
  transaction: TransactionWithCategory | null;
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function TransaksiModal({
  transaction, wallets, categories, householdId, userId, onClose, onSaved,
}: Props) {
  const isEdit = transaction !== null;
  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [amount, setAmount] = useState(isEdit ? String(transaction.amount) : "");
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [walletId, setWalletId] = useState(transaction?.wallet_id ?? (wallets[0]?.id ?? ""));
  const [date, setDate] = useState(transaction?.date ?? today);
  const [note, setNote] = useState(transaction?.note ?? "");
  const [visibility, setVisibility] = useState<TransactionVisibility>(transaction?.visibility ?? "private");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  // Attachment
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(transaction?.attachment_url ?? null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // Auto-select first category when type changes
  useMemo(() => {
    if (!isEdit && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Ukuran file maksimal 5MB"); return; }
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
    setRemoveAttachment(false);
    setError("");
  }

  function handleRemoveAttachment() {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setRemoveAttachment(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function formatAmountInput(val: string) {
    const digits = val.replace(/\D/g, "");
    return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
  }

  function parseAmount(val: string) {
    return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseAmount(amount);

    if (parsedAmount <= 0) { setError("Jumlah harus lebih dari 0."); return; }
    if (!description.trim()) { setError("Deskripsi wajib diisi."); return; }
    if (!categoryId) { setError("Pilih kategori."); return; }
    if (!walletId) { setError("Pilih dompet."); return; }

    setError("");
    setLoading(true);
    const supabase = createClient();

    async function uploadAttachment(txId: string): Promise<string | null> {
      if (!attachmentFile) return null;
      const ext = attachmentFile.name.split(".").pop() ?? "jpg";
      const path = `${householdId}/${txId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("transaction-attachments")
        .upload(path, attachmentFile, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("transaction-attachments").getPublicUrl(path);
      return data.publicUrl;
    }

    if (isEdit) {
      let newUrl: string | null | undefined = undefined;
      if (attachmentFile) {
        try { newUrl = await uploadAttachment(transaction.id); }
        catch (e: unknown) { setError(e instanceof Error ? e.message : "Gagal upload foto"); setLoading(false); return; }
      } else if (removeAttachment) {
        newUrl = null;
      }

      const updates: Record<string, unknown> = {
        type, amount: parsedAmount, description: description.trim(),
        category_id: categoryId, wallet_id: walletId, date, note: note.trim() || null,
        visibility,
      };
      if (newUrl !== undefined) updates.attachment_url = newUrl;

      const { error: err } = await supabase.from("transactions").update(updates).eq("id", transaction.id);
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { data: newTx, error: err } = await supabase.from("transactions").insert({
        household_id: householdId,
        user_id: userId,
        type,
        amount: parsedAmount,
        description: description.trim(),
        category_id: categoryId,
        wallet_id: walletId,
        date,
        note: note.trim() || null,
        visibility,
      }).select("id").single();

      if (err || !newTx) { setError(err?.message ?? "Gagal menyimpan"); setLoading(false); return; }

      if (attachmentFile) {
        try {
          const url = await uploadAttachment(newTx.id);
          await supabase.from("transactions").update({ attachment_url: url }).eq("id", newTx.id);
        } catch {
          // attachment upload failed — transaction still saved, non-critical
        }
      }
    }

    onSaved();
  }

  async function handleDelete() {
    if (!transaction) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", transaction.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {isEdit ? "Edit Transaksi" : "Catat Transaksi"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={[
                "py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors",
                type === "expense"
                  ? "border-danger bg-red-50 text-danger"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-danger/40",
              ].join(" ")}
            >
              📤 Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={[
                "py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors",
                type === "income"
                  ? "border-success bg-green-50 text-success"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-success/40",
              ].join(" ")}
            >
              📥 Pemasukan
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Jumlah</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(amount)}
                onChange={(e) => setAmount(e.target.value.replace(/\./g, ""))}
                placeholder="0"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[var(--border)] text-lg text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "income" ? "contoh: Gaji bulan ini" : "contoh: Makan siang"}
              maxLength={200}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Kategori</label>
            <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={[
                    "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 text-xs transition-colors",
                    categoryId === cat.id
                      ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                  ].join(" ")}
                >
                  <span className="text-lg">{cat.icon ?? "💰"}</span>
                  <span className="text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dompet + Tanggal (2 kolom) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Dompet</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Foto Struk <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={handleFileChange}
            />
            {attachmentPreview ? (
              <div className="relative group">
                <img
                  src={attachmentPreview}
                  alt="Struk"
                  onClick={() => setViewerOpen(true)}
                  className="w-full max-h-48 object-cover rounded-xl border border-[var(--border)] cursor-zoom-in"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors" />
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-2 py-1 rounded-md"
                >
                  Perbesar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[var(--border)] rounded-xl py-5 flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-xs font-medium">Upload foto struk</span>
                <span className="text-[10px]">JPG, PNG, WebP — maks 5MB</span>
              </button>
            )}
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Catatan <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
            />
          </div>

          {/* Visibilitas */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Visibilitas</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={[
                  "py-2.5 rounded-xl text-sm font-medium border-2 transition-colors flex items-center justify-center gap-2",
                  visibility === "private"
                    ? "border-slate-400 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-500"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-slate-400",
                ].join(" ")}
              >
                🔒 Pribadi
              </button>
              <button
                type="button"
                onClick={() => setVisibility("shared")}
                className={[
                  "py-2.5 rounded-xl text-sm font-medium border-2 transition-colors flex items-center justify-center gap-2",
                  visibility === "shared"
                    ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                ].join(" ")}
              >
                🏠 Bersama
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
              {visibility === "private"
                ? "🔒 Hanya kamu yang bisa melihat transaksi ini"
                : "🏠 Semua anggota keluarga bisa melihat transaksi ini"}
            </p>
          </div>

          {error && (
            <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? "Menyimpan..." : isEdit ? "Simpan" : "Catat"}
            </button>
          </div>

          {/* Delete — hanya saat edit */}
          {isEdit && (
            <div className="border-t border-[var(--border)] pt-4">
              {!showDelete ? (
                <button type="button" onClick={() => setShowDelete(true)} className="w-full text-xs text-danger hover:underline">
                  Hapus transaksi ini
                </button>
              ) : (
                <div className="bg-red-50 rounded-xl p-4 space-y-3">
                  <p className="text-sm text-danger font-medium">Hapus transaksi?</p>
                  <p className="text-xs text-[var(--text-secondary)]">Saldo dompet akan dikembalikan. Tindakan ini tidak dapat dibatalkan.</p>
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
      </div>{/* centering wrapper */}

      {/* Image viewer lightbox — fixed, so DOM position doesn't matter */}
      {viewerOpen && attachmentPreview && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewerOpen(false)}
        >
          <img
            src={attachmentPreview}
            alt="Struk"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setViewerOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
