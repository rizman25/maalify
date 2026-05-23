"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/utils";

interface TxDetail {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  date: string;
  note: string | null;
  attachment_url: string | null;
  created_at: string;
  categories: { name: string; icon: string | null; color: string | null } | null;
  wallets: { name: string; type: string } | null;
  users: { name: string } | null;
}

interface Props {
  transactionId: string;
  onClose: () => void;
}

export default function TransaksiDetailModal({ transactionId, onClose }: Props) {
  const [tx, setTx] = useState<TxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgOpen, setImgOpen] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("transactions")
        .select("id, type, amount, description, date, note, attachment_url, created_at, categories(name, icon, color), wallets(name, type), users(name)")
        .eq("id", transactionId)
        .single();
      setTx(data as TxDetail | null);
      setLoading(false);
    }
    fetch();
  }, [transactionId]);

  const cat = tx ? (Array.isArray(tx.categories) ? tx.categories[0] : tx.categories) : null;
  const wallet = tx ? (Array.isArray(tx.wallets) ? tx.wallets[0] : tx.wallets) : null;
  const txUser = tx ? (Array.isArray(tx.users) ? tx.users[0] : tx.users) : null;

  const dateStr = tx
    ? new Date(tx.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  const createdStr = tx
    ? new Date(tx.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50" onClick={onClose}>
        <div
          className="w-full sm:max-w-md bg-[var(--bg-surface)] rounded-t-2xl sm:rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-h-[calc(100vh-0px)] sm:max-h-[calc(100vh-2rem)] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
            <h2 className="font-bold text-[var(--text-primary)]">Detail Transaksi</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin" />
              </div>
            ) : !tx ? (
              <div className="py-16 text-center text-sm text-[var(--text-secondary)]">Transaksi tidak ditemukan</div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Amount hero */}
                <div className="text-center py-4">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
                    style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20" }}
                  >
                    {cat?.icon ?? (tx.type === "income" ? "💰" : "💸")}
                  </div>
                  <p className={["font-financial text-3xl font-bold", tx.type === "income" ? "text-success" : "text-danger"].join(" ")}>
                    {tx.type === "income" ? "+" : "−"}Rp {formatRupiah(Number(tx.amount))}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{tx.description}</p>
                </div>

                {/* Detail rows */}
                <div className="bg-[var(--bg-elevated)] rounded-2xl divide-y divide-[var(--border)]">
                  <DetailRow label="Jenis">
                    <span className={["text-xs font-semibold px-2.5 py-1 rounded-full", tx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-danger"].join(" ")}>
                      {tx.type === "income" ? "Pemasukan" : "Pengeluaran"}
                    </span>
                  </DetailRow>

                  <DetailRow label="Tanggal">
                    <span className="text-sm text-[var(--text-primary)]">{dateStr}</span>
                  </DetailRow>

                  {cat && (
                    <DetailRow label="Kategori">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: (cat.color ?? "#94A3B8") + "20", color: cat.color ?? "#94A3B8" }}
                        >
                          {cat.icon && <span>{cat.icon}</span>}
                          {cat.name}
                        </span>
                      </div>
                    </DetailRow>
                  )}

                  {wallet && (
                    <DetailRow label="Dompet">
                      <span className="text-sm text-[var(--text-primary)]">{wallet.name}</span>
                    </DetailRow>
                  )}

                  {txUser && (
                    <DetailRow label="Dicatat oleh">
                      <span className="text-sm text-[var(--text-primary)]">{txUser.name}</span>
                    </DetailRow>
                  )}

                  {tx.note && (
                    <DetailRow label="Catatan">
                      <span className="text-sm text-[var(--text-primary)] text-right max-w-[60%]">{tx.note}</span>
                    </DetailRow>
                  )}

                  <DetailRow label="Dibuat pada">
                    <span className="text-xs text-[var(--text-secondary)]">{createdStr}</span>
                  </DetailRow>
                </div>

                {/* Receipt photo */}
                {tx.attachment_url && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Foto Struk</p>
                    <div className="relative rounded-xl overflow-hidden border border-[var(--border)] cursor-pointer" onClick={() => setImgOpen(true)}>
                      {tx.attachment_url.endsWith(".pdf") || tx.attachment_url.includes("application/pdf") ? (
                        <a href={tx.attachment_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 hover:bg-[var(--bg-elevated)] transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">Lihat PDF Struk</p>
                            <p className="text-xs text-[var(--text-secondary)]">Klik untuk buka</p>
                          </div>
                        </a>
                      ) : (
                        <>
                          <img src={tx.attachment_url} alt="Foto struk" className="w-full max-h-52 object-cover" />
                          <div className="absolute bottom-2 right-2">
                            <span className="text-[10px] bg-black/60 text-white px-2 py-1 rounded-full">Klik untuk perbesar</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-[var(--border)] flex-shrink-0">
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors font-medium">
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen image viewer */}
      {imgOpen && tx?.attachment_url && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setImgOpen(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <img src={tx.attachment_url} alt="Struk" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-xs text-[var(--text-secondary)] font-medium flex-shrink-0">{label}</span>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}
