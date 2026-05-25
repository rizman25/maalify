"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Wallet, Category } from "@/types";

interface StrukItem {
  name: string;
  qty: number;
  price: number;
}

interface ParsedStruk {
  merchant: string;
  date: string;
  total: number;
  items: StrukItem[];
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
  const [visibility, setVisibility] = useState<"shared" | "private">("shared");
  const [editableItems, setEditableItems] = useState<StrukItem[]>([]);

  function itemsToNote(items: StrukItem[]) {
    return items.map(i =>
      i.qty > 1
        ? `${i.name} x${i.qty} - Rp ${i.price.toLocaleString("id-ID")}`
        : `${i.name} - Rp ${i.price.toLocaleString("id-ID")}`
    ).join("\n");
  }

  function updateItem(index: number, field: "name" | "qty" | "price", value: string) {
    const updated = editableItems.map((item, i) => {
      if (i !== index) return item;
      if (field === "price") return { ...item, price: parseInt(value.replace(/\D/g, ""), 10) || 0 };
      if (field === "qty")   return { ...item, qty: Math.max(1, parseInt(value.replace(/\D/g, ""), 10) || 1) };
      return { ...item, name: value };
    });
    setEditableItems(updated);
    setNote(itemsToNote(updated));
  }

  const relevantCategories = categories.filter(c => c.type === txType);

  function handleFile(f: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
    if (!allowed.includes(f.type)) {
      setError("Format tidak didukung. Gunakan JPG, PNG, WEBP, HEIC, atau PDF.");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError("Ukuran foto terlalu besar (maks 4MB). Coba kompres foto atau pilih kualitas lebih rendah saat memotret.");
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

  function getFriendlyError(status: number, rawText: string): string {
    // Vercel / server level errors (non-JSON response)
    if (rawText.toLowerCase().includes("request entity too large") || rawText.includes("413")) {
      return "Foto terlalu besar. Coba gunakan foto dengan resolusi lebih kecil (maks 4MB).";
    }
    if (rawText.toLowerCase().includes("timeout") || rawText.includes("504") || rawText.includes("524")) {
      return "Proses analisis terlalu lama. Coba lagi beberapa saat.";
    }
    if (rawText.toLowerCase().includes("bad gateway") || rawText.includes("502")) {
      return "Server sedang bermasalah. Coba lagi beberapa saat.";
    }
    // HTTP status codes
    if (status === 401) return "Sesi habis. Silakan muat ulang halaman.";
    if (status === 413) return "Foto terlalu besar. Coba gunakan foto dengan resolusi lebih kecil (maks 4MB).";
    if (status === 422) return "Tulisan pada struk kurang terbaca. Coba foto lebih dekat dengan pencahayaan yang lebih baik.";
    if (status === 429) return "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.";
    if (status >= 500) return "Server sedang bermasalah. Coba lagi beberapa saat.";
    return rawText || "Analisis gagal. Coba foto yang lebih jelas.";
  }

  async function analyze() {
    if (!file) return;
    setStep("analyzing");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/scan-struk", { method: "POST", body: fd });

      // Coba parse JSON, tangkap jika response bukan JSON (misal error 413 dari Vercel)
      let data: { error?: string } & Partial<ParsedStruk>;
      try {
        data = await res.json();
      } catch {
        // Response bukan JSON — kemungkinan error dari Vercel/server sebelum kode kita
        const rawText = await res.text().catch(() => "");
        setError(getFriendlyError(res.status, rawText));
        setStep("upload");
        return;
      }

      if (!res.ok) {
        setError(getFriendlyError(res.status, data.error ?? ""));
        setStep("upload");
        return;
      }

      setParsed(data as ParsedStruk);
      setDescription(data.description ?? "");
      setAmount(String(data.total ?? 0));
      setDate(data.date ?? new Date().toISOString().split("T")[0]);
      setTxType(data.transaction_type ?? "expense");
      const normalizedItems: StrukItem[] = (data.items ?? []).map((i: { name: string; qty?: number; price: number }) => ({
        name: i.name,
        qty: Math.max(1, Number(i.qty) || 1),
        price: Number(i.price) || 0,
      }));
      setEditableItems(normalizedItems);
      if (normalizedItems.length > 0) {
        setNote(itemsToNote(normalizedItems));
      }
      // Auto-pick category if match found
      const matchCat = categories.find(c =>
        c.type === data.transaction_type &&
        (c.name.toLowerCase().includes("makan") || c.name.toLowerCase().includes("belanja") || c.name.toLowerCase().includes("gaji"))
      );
      setCategoryId(matchCat?.id ?? categories.find(c => c.type === data.transaction_type)?.id ?? "");
      setStep("review");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
        setError("Koneksi bermasalah. Periksa internet lalu coba lagi.");
      } else {
        setError("Analisis gagal. Coba foto yang lebih jelas dengan pencahayaan baik.");
      }
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

      // Upload foto struk ke storage
      let attachmentUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${householdId}/${userId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("transaction-attachments")
          .upload(path, file, { upsert: false });

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("transaction-attachments")
            .getPublicUrl(path);
          attachmentUrl = urlData.publicUrl;
        }
      }

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
        attachment_url: attachmentUrl,
        visibility,
      });

      if (err) throw err;
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
      setStep("review");
    }
  }

  const CONFIDENCE_LABEL = { high: "Terbaca jelas", medium: "Kemungkinan ada perbedaan", low: "Mohon periksa ulang nominal" };
  const CONFIDENCE_COLOR = { high: "text-success", medium: "text-warning", low: "text-danger" };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 pb-6 bg-black/50">
      <div className="w-full sm:max-w-lg bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-2xl max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">

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
                {(["analyzing","review","saving"].indexOf(step) > ["upload","analyzing","review"].indexOf(s)) ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : i + 1}
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
              {/* File inputs (hidden) */}
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" className="hidden" onChange={handleInputChange} />

              {/* Belum ada file: tampilkan 2 tombol pilihan */}
              {!file && (
                <div className="grid grid-cols-2 gap-3">
                  {/* Tombol Kamera */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-3 py-7 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-brand-primary hover:bg-brand-primary/5 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 group-hover:bg-brand-primary/15 flex items-center justify-center transition-colors">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Ambil Foto</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Buka kamera</p>
                    </div>
                  </button>

                  {/* Tombol Pilih File */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={["flex flex-col items-center justify-center gap-3 py-7 rounded-2xl border-2 border-dashed transition-all group",
                      isDragging ? "border-brand-primary bg-brand-primary/5" :
                      "border-[var(--border)] hover:border-brand-primary hover:bg-brand-primary/5"
                    ].join(" ")}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] group-hover:bg-brand-primary/10 flex items-center justify-center transition-colors">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] group-hover:text-brand-primary transition-colors">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Pilih File</p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Galeri / PDF</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Ada file: tampilkan preview */}
              {file && (
                <div
                  ref={dropRef}
                  className="border-2 border-dashed border-[var(--border)] rounded-xl bg-[var(--bg-elevated)]"
                >
                  <div className="p-4">
                    {isPdf ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">PDF · {(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={() => { setFile(null); setPreview(null); setError(""); }}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ) : preview ? (
                      <div className="relative">
                        <img src={preview} alt="Preview struk" className="w-full max-h-52 object-contain rounded-lg" />
                        <button onClick={() => { setFile(null); setPreview(null); setError(""); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Ganti file */}
              {file && step !== "analyzing" && (
                <div className="flex gap-3">
                  <button onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-2 text-xs text-brand-primary hover:underline flex items-center justify-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Ambil ulang
                  </button>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 text-xs text-[var(--text-secondary)] hover:underline flex items-center justify-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Ganti file
                  </button>
                </div>
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

              {/* Items preview (editable) */}
              {editableItems.length > 0 && (
                <div className="bg-[var(--bg-elevated)] rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Item Terdeteksi
                      <span className="ml-1.5 font-normal normal-case text-[var(--text-secondary)]">— bisa diedit</span>
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] pr-0.5">
                      <span className="w-9 text-center">Qty</span>
                      <span className="w-20 text-right">Harga</span>
                    </div>
                  </div>
                  {editableItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      {/* Nama item */}
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => updateItem(i, "name", e.target.value)}
                        className="flex-1 min-w-0 text-xs border border-[var(--border)] rounded-lg px-2 py-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none focus:border-brand-primary transition-colors"
                      />
                      {/* Qty */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <span className="text-[10px] text-[var(--text-secondary)]">x</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={item.qty}
                          onChange={e => updateItem(i, "qty", e.target.value)}
                          className="w-9 text-xs border border-[var(--border)] rounded-lg px-1.5 py-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none focus:border-brand-primary transition-colors text-center"
                        />
                      </div>
                      {/* Harga satuan */}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={item.price ? item.price.toLocaleString("id-ID") : ""}
                        onChange={e => updateItem(i, "price", e.target.value)}
                        className="w-20 flex-shrink-0 text-xs border border-[var(--border)] rounded-lg px-2 py-1.5 bg-[var(--bg-surface)] text-[var(--text-primary)] font-financial outline-none focus:border-brand-primary transition-colors text-right"
                      />
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

                {/* Visibility toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Visibilitas</label>
                  <div className="flex gap-2">
                    {(["shared", "private"] as const).map(v => (
                      <button key={v} onClick={() => setVisibility(v)}
                        className={["flex-1 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5",
                          visibility === v
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                        ].join(" ")}>
                        {v === "shared" ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            Bersama
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            Pribadi
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)]">
                    {visibility === "shared" ? "Terlihat oleh semua anggota household" : "Hanya terlihat oleh kamu"}
                  </p>
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
                    {relevantCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              <button onClick={() => { setStep("upload"); setParsed(null); setEditableItems([]); setNote(""); setVisibility("shared"); }}
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
