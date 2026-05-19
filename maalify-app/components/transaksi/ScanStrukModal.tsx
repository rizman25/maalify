"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, Category } from "@/types";

interface ParsedStruk {
  merchant: string;
  date: string;
  total: number;
  items: { name: string; price: number }[];
  transaction_type: "income" | "expense";
  description: string;
  confidence: "high" | "medium" | "low";
}

interface Props {
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

type Step = "upload" | "analyzing" | "review" | "saving";

export default function ScanStrukModal({ wallets, categories, householdId, userId, onClose, onSaved }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Parsed result (editable)
  const [parsed, setParsed] = useState<ParsedStruk | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  const relevantCategories = categories.filter(c => c.type === txType);

  function handleFile(f: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, WEBP, HEIC, atau PDF.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Ukuran file maksimal 10MB.");
      return;
    }
    setError("");
    setFile(f);
    setIsPdf(f.type === "application/pdf");
    if (f.type !== "application/pdf") {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  async function analyze() {
    if (!file) return;
    setStep("analyzing");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/scan-struk", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analisis gagal");

      setParsed(data);
      setDescription(data.description);
      setAmount(String(data.total));
      setDate(data.date ?? new Date().toISOString().split("T")[0]);
      setTxType(data.transaction_type);
      // Auto-pick category if match found
      const matchCat = categories.find(c =>
        c.type === data.transaction_type &&
        (c.name.toLowerCase().includes("makan") || c.name.toLowerCase().includes("belanja") || c.name.toLowerCase().includes("gaji"))
      );
      setCategoryId(matchCat?.id ?? categories.find(c => c.type === data.transaction_type)?.id ?? "");
      setStep("review");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analisis gagal. Coba foto yang lebih jelas.");
      setStep("upload");
    }
  }

  async function save() {
    if (!walletId || !categoryId || !description.trim() || !amount) return;
    const numAmount = parseInt(amount.replace(/\D/g, ""), 10);
    if (!numAmount || numAmount <= 0) { setError("Nominal tidak valid"); return; }

    setStep("saving");
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: err } = await supabase.from("transactions").insert({
        household_id: householdId,
        user_id: userId,
        wallet_id: walletId,
        category_id: categoryId,
        type: txType,
        amount: numAmount,
        description: description.trim(),
        date,
        note: note.trim() || null,
        attachment_url: null,
      });

      if (err) throw err;
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
      setStep("review");
    }
  }

  const CONFIDENCE_LABEL = { high: "✅ Terbaca jelas", medium: "⚠️ Kemungkinan ada perbedaan", low: "❌ Mohon periksa ulang nominal" };
  const CONFIDENCE_COLOR = { high: "text-success", medium: "text-warning", low: "text-danger" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[var(--bg-surface)] rounded-t-2xl sm:rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Scan Struk</h2>
              <p className="text-[10px] text-[var(--text-secondary)]">Foto atau PDF struk/kuitansi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress steps */}
        <div className="flex items-center px-5 py-3 gap-2 flex-shrink-0 border-b border-[var(--border)]">
          {(["upload", "analyzing", "review"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={["w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors",
                step === s ? "bg-brand-primary text-white" :
                (["analyzing","review","saving"].indexOf(step) > ["upload","analyzing","review"].indexOf(s)) ? "bg-success text-white" :
                "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              ].join(" ")}>
                {(["analyzing","review","saving"].indexOf(step) > ["upload","analyzing","review"].indexOf(s)) ? "✓" : i + 1}
              </div>
              <span className="text-[10px] text-[var(--text-secondary)] hidden sm:block">
                {s === "upload" ? "Upload" : s === "analyzing" ? "Analisis" : "Review"}
              </span>
              {i < 2 && <div className="flex-1 h-px bg-[var(--border)] mx-1 min-w-[16px]" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">

          {/* ── STEP: UPLOAD ── */}
          {(step === "upload" || step === "analyzing") && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                ref={dropRef}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={["border-2 border-dashed rounded-xl transition-colors cursor-pointer",
                  isDragging ? "border-brand-primary bg-brand-primary/5" :
                  file ? "border-[var(--border)] bg-[var(--bg-elevated)]" :
                  "border-[var(--border)] hover:border-brand-primary/50 hover:bg-[var(--bg-elevated)]"
                ].join(" ")}
              >
                {file ? (
                  <div className="p-4">
                    {isPdf ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">PDF · {(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setError(""); }}
                          className="ml-auto p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ) : preview ? (
                      <div className="relative">
                        <img src={preview} alt="Preview struk" className="w-full max-h-52 object-contain rounded-lg" />
                        <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); setError(""); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="py-10 text-center px-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Pilih atau seret file ke sini</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">JPG, PNG, WEBP, HEIC, PDF · Maks. 10MB</p>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" className="hidden" onChange={handleInputChange} />

              {file && step !== "analyzing" && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 text-xs text-brand-primary hover:underline">
                  Ganti file
                </button>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}

              {step === "analyzing" && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-12 h-12 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Menganalisis struk...</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Gemini AI sedang membaca isi struk</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: REVIEW ── */}
          {(step === "review" || step === "saving") && parsed && (
            <div className="space-y-4">
              {/* Confidence badge */}
              <div className={["text-xs font-medium", CONFIDENCE_COLOR[parsed.confidence]].join(" ")}>
                {CONFIDENCE_LABEL[parsed.confidence]}
              </div>

              {/* Items preview (if any) */}
              {parsed.items.length > 0 && (
                <div className="bg-[var(--bg-elevated)] rounded-xl p-3 space-y-1.5 max-h-28 overflow-y-auto">
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Item Terdeteksi</p>
                  {parsed.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)] truncate flex-1">{item.name}</span>
                      <span className="font-financial font-medium text-[var(--text-primary)] ml-2 flex-shrink-0">
                        Rp {formatRupiah(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Editable form */}
              <div className="space-y-3">
                {/* Type toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Jenis Transaksi</label>
                  <div className="flex gap-2">
                    {(["expense", "income"] as const).map(t => (
                      <button key={t} onClick={() => { setTxType(t); setCategoryId(categories.find(c => c.type === t)?.id ?? ""); }}
                        className={["flex-1 py-2 rounded-xl text-xs font-semibold border transition-all",
                          txType === t
                            ? t === "income" ? "bg-success text-white border-success" : "bg-danger text-white border-danger"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                        ].join(" ")}>
                        {t === "income" ? "Pemasukan" : "Pengeluaran"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Deskripsi</label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} maxLength={100}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors" />
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Nominal</label>
                  <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-2.5 focus-within:border-brand-primary transition-colors">
                    <span className="text-sm text-[var(--text-secondary)] font-medium flex-shrink-0">Rp</span>
                    <input type="text" inputMode="numeric"
                      value={amount ? Number(amount.replace(/\D/g, "")).toLocaleString("id-ID") : ""}
                      onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 bg-transparent text-[var(--text-primary)] font-financial text-lg font-semibold outline-none" />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Tanggal</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors" />
                </div>

                {/* Wallet */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Dompet</label>
                  <select value={walletId} onChange={e => setWalletId(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors cursor-pointer">
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Kategori</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors cursor-pointer">
                    <option value="">Pilih kategori...</option>
                    {relevantCategories.map(c => <option key={c.id} value={c.id}>{c.icon ?? ""} {c.name}</option>)}
                  </select>
                </div>

                {/* Note */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Catatan <span className="font-normal italic">(opsional)</span></label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} maxLength={200}
                    placeholder="Catatan tambahan..."
                    className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors resize-none placeholder:text-[var(--text-secondary)]" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-danger">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex gap-3 flex-shrink-0">
          {step === "upload" && (
            <>
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                Batal
              </button>
              <button onClick={analyze} disabled={!file}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity">
                Analisis Struk →
              </button>
            </>
          )}

          {step === "analyzing" && (
            <button disabled className="flex-1 py-2.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-sm font-medium cursor-not-allowed">
              Menganalisis...
            </button>
          )}

          {(step === "review" || step === "saving") && (
            <>
              <button onClick={() => { setStep("upload"); setParsed(null); }}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                ← Ulang
              </button>
              <button onClick={save}
                disabled={step === "saving" || !description.trim() || !amount || !walletId || !categoryId}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                {step === "saving" ? "Menyimpan..." : "Simpan Transaksi"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
