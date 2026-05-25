"use client";

import { useState, useRef } from "react";
import { formatRupiah } from "@/lib/utils";
import { editProjectExpenseTx, deleteProjectExpenseTx } from "@/app/actions/projects";
import { createClient } from "@/lib/supabase/client";

export interface ExpenseTx {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  attachment_url?: string | null;
  project_item_id?: string | null;
}

interface Props {
  tx: ExpenseTx;
  householdId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProjectExpenseTxModal({ tx, householdId, onClose, onSaved }: Props) {
  const [description, setDescription] = useState(tx.description ?? "");
  const [date, setDate]               = useState(tx.date);
  const [loading, setLoading]         = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError]             = useState("");

  // Receipt / attachment
  const [attachmentFile, setAttachmentFile]       = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(tx.attachment_url ?? null);
  const [removeAttachment, setRemoveAttachment]   = useState(false);
  const [viewerOpen, setViewerOpen]               = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Ukuran file maksimal 5MB"); return; }
    setAttachmentFile(file);
    setAttachmentPreview(URL.createObjectURL(file));
    setRemoveAttachment(false);
    setError("");
  }

  async function handleSave() {
    if (!description.trim()) { setError("Deskripsi wajib diisi"); return; }
    setLoading(true);
    setError("");

    let newUrl: string | null | undefined = undefined;
    if (attachmentFile) {
      try {
        const supabase = createClient();
        const ext = attachmentFile.name.split(".").pop() ?? "jpg";
        const path = `${householdId}/${tx.id}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("transaction-attachments")
          .upload(path, attachmentFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("transaction-attachments").getPublicUrl(path);
        newUrl = data.publicUrl;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Gagal upload foto");
        setLoading(false);
        return;
      }
    } else if (removeAttachment) {
      newUrl = null;
    }

    const res = await editProjectExpenseTx({
      txId: tx.id,
      description: description.trim(),
      date,
      attachmentUrl: newUrl,
    });

    if (res.error) { setError(res.error); setLoading(false); return; }
    onSaved();
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await deleteProjectExpenseTx(tx.id);
    if (res.error) { setError(res.error); setDeleting(false); return; }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Detail Pengeluaran</h2>
            <p className="font-financial text-xs text-warning font-semibold mt-0.5">-Rp {formatRupiah(tx.amount)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Keterangan</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Tanggal */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-card)] outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Nominal (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">Nominal</label>
            <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2.5 bg-[var(--bg-elevated)]">
              <span className="text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <span className="font-financial text-lg font-semibold text-[var(--text-primary)]">{formatRupiah(tx.amount)}</span>
              <span className="ml-auto text-[10px] text-[var(--text-secondary)] italic">tidak dapat diubah</span>
            </div>
          </div>

          {/* Struk / Bukti pembayaran */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              Struk / Bukti Pembayaran <span className="font-normal italic">(opsional)</span>
            </label>

            {attachmentPreview && !removeAttachment ? (
              <div className="relative">
                <img
                  src={attachmentPreview}
                  alt="Bukti pembayaran"
                  className="w-full max-h-48 object-cover rounded-xl border border-[var(--border)] cursor-pointer"
                  onClick={() => setViewerOpen(true)}
                />
                <button
                  type="button"
                  onClick={() => { setRemoveAttachment(true); setAttachmentPreview(null); setAttachmentFile(null); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[var(--border)] rounded-xl py-6 flex flex-col items-center gap-2 text-[var(--text-secondary)] hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="text-xs">Upload foto struk / bukti bayar</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Hapus */}
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)}
              className="w-full text-center text-sm text-red-500 hover:text-red-600 py-1">
              Hapus Pencatatan Ini
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2">
              <p className="text-sm text-red-700 font-medium">Hapus pencatatan ini?</p>
              <p className="text-xs text-red-600">Dana akan dikembalikan ke wallet project dan sisa tagihan item akan disesuaikan.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
                  Batal
                </button>
                <button type="button" onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-60">
                  {deleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-60 transition-colors">
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* Image viewer */}
      {viewerOpen && attachmentPreview && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setViewerOpen(false)}>
          <img src={attachmentPreview} alt="Bukti" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
