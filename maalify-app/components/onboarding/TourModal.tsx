"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    icon: "👋",
    title: "Selamat datang di Maalify!",
    desc: "Aplikasi pencatatan keuangan keluarga yang cerdas. Yuk, kenalan dulu dengan fitur-fitur utamanya.",
    color: "#3B82F6",
  },
  {
    icon: "📝",
    title: "Catat Transaksi",
    desc: "Catat setiap pemasukan dan pengeluaran keluarga. Bisa juga scan struk belanja otomatis pakai AI.",
    color: "#10B981",
  },
  {
    icon: "👛",
    title: "Kelola Dompet",
    desc: "Tambahkan rekening, dompet digital, atau kas tunai. Saldo otomatis terupdate setiap transaksi.",
    color: "#8B5CF6",
  },
  {
    icon: "📊",
    title: "Atur Anggaran",
    desc: "Tetapkan batas pengeluaran per kategori setiap bulan. Dapat notifikasi kalau sudah mendekati batas.",
    color: "#F59E0B",
  },
  {
    icon: "🤝",
    title: "Hutang & Piutang",
    desc: "Lacak semua pinjam-meminjam dengan mudah. Catat jatuh tempo dan progres pembayaran.",
    color: "#EF4444",
  },
  {
    icon: "🎯",
    title: "Tabungan & Goals",
    desc: "Buat target keuangan keluarga — dana darurat, DP rumah, liburan. Pantau progresnya bersama.",
    color: "#EC4899",
  },
  {
    icon: "🤖",
    title: "AI Advisor Keuangan",
    desc: "Tanya apa saja soal keuangan keluarga — analisis pengeluaran, tips menabung, saran investasi.",
    color: "#06B6D4",
  },
];

const STORAGE_KEY = "maalify-tour-done";

export default function TourModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so dashboard loads first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function goTo(next: number) {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 150);
  }

  function handleNext() {
    if (step < STEPS.length - 1) goTo(step + 1);
    else dismiss();
  }

  function handlePrev() {
    if (step > 0) goTo(step - 1);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-surface)] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)]">

        {/* Color bar */}
        <div className="h-1.5 transition-colors duration-500" style={{ backgroundColor: current.color }} />

        {/* Content */}
        <div
          className="px-6 py-8 text-center space-y-4 transition-all duration-150"
          style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(8px)" : "translateY(0)" }}
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mx-auto transition-colors duration-500"
            style={{ backgroundColor: current.color + "20" }}
          >
            {current.icon}
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{current.title}</h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{current.desc}</p>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  backgroundColor: i === step ? current.color : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {!isFirst ? (
            <button
              onClick={handlePrev}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              ← Kembali
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="px-4 py-2.5 rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Lewati
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: current.color }}
          >
            {isLast ? "Mulai Sekarang 🚀" : "Lanjut →"}
          </button>
        </div>
      </div>
    </div>
  );
}
