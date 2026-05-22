"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Props {
  hasWallet: boolean;
  hasTransaction: boolean;
  hasMultipleMembers: boolean;
  hasBudget: boolean;
  hasGoal: boolean;
  hasRecurring: boolean;
  hasAvatar: boolean;
}

const ITEMS = [
  {
    key: "hasWallet",
    icon: "🏦",
    label: "Tambah dompet pertama",
    desc: "Kas, bank, atau e-wallet sebagai sumber dana",
    href: "/dompet",
    cta: "Tambah Dompet",
    core: true,
  },
  {
    key: "hasTransaction",
    icon: "💸",
    label: "Catat transaksi pertama",
    desc: "Pemasukan atau pengeluaran keluarga",
    href: "/transaksi",
    cta: "Catat Sekarang",
    core: true,
  },
  {
    key: "hasMultipleMembers",
    icon: "👨‍👩‍👧",
    label: "Undang anggota keluarga",
    desc: "Ajak pasangan atau anggota keluarga untuk ikut mencatat",
    href: "/pengaturan",
    cta: "Undang Sekarang",
    core: false,
  },
  {
    key: "hasBudget",
    icon: "📊",
    label: "Atur anggaran bulanan",
    desc: "Tetapkan batas pengeluaran per kategori",
    href: "/anggaran",
    cta: "Buat Anggaran",
    core: false,
  },
  {
    key: "hasGoal",
    icon: "🎯",
    label: "Buat target tabungan",
    desc: "Rencanakan tujuan keuangan keluarga",
    href: "/tabungan",
    cta: "Buat Target",
    core: false,
  },
  {
    key: "hasRecurring",
    icon: "🔄",
    label: "Tambah transaksi berulang",
    desc: "Gaji, cicilan, atau langganan bulanan",
    href: "/berulang",
    cta: "Tambah Berulang",
    core: false,
  },
  {
    key: "hasAvatar",
    icon: "🖼️",
    label: "Tambah foto profil",
    desc: "Buat profil-mu lebih personal",
    href: "/pengaturan",
    cta: "Edit Profil",
    core: false,
  },
] as const;

export default function SetupChecklist({
  hasWallet,
  hasTransaction,
  hasMultipleMembers,
  hasBudget,
  hasGoal,
  hasRecurring,
  hasAvatar,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const v = localStorage.getItem("maalify_setup_dismissed");
    if (v === "true") setDismissed(true);
  }, []);

  const statusMap: Record<string, boolean> = {
    hasWallet,
    hasTransaction,
    hasMultipleMembers,
    hasBudget,
    hasGoal,
    hasRecurring,
    hasAvatar,
  };

  const doneCount = ITEMS.filter(item => statusMap[item.key]).length;
  const total = ITEMS.length;
  const allDone = doneCount === total;

  function dismiss() {
    localStorage.setItem("maalify_setup_dismissed", "true");
    setDismissed(true);
  }

  // Don't render until mounted (avoid hydration mismatch with localStorage)
  if (!mounted) return null;
  if (dismissed) return null;

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-[var(--text-primary)]">
                {allDone ? "🎉 Setup selesai!" : "🚀 Selesaikan Setup Family-mu"}
              </p>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: allDone ? "rgba(39,174,96,0.15)" : "rgba(30,58,95,0.1)",
                  color: allDone ? "#27AE60" : "#1E3A5F",
                }}
              >
                {doneCount}/{total}
              </span>
            </div>
            {allDone ? (
              <p className="text-xs text-[var(--text-secondary)]">Semua langkah selesai. Family-mu siap digunakan!</p>
            ) : (
              <p className="text-xs text-[var(--text-secondary)]">Ikuti langkah-langkah ini untuk memaksimalkan Maalify</p>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-3 flex-shrink-0"
            title="Tutup checklist"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(doneCount / total) * 100}%`,
              backgroundColor: allDone ? "#27AE60" : "#1E3A5F",
            }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-[var(--border)]">
        {ITEMS.map(item => {
          const done = statusMap[item.key];
          return (
            <div
              key={item.key}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors"
              style={{ opacity: done ? 0.6 : 1 }}
            >
              {/* Checkbox */}
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: done ? "#27AE60" : "#CBD5E1",
                  backgroundColor: done ? "#27AE60" : "transparent",
                }}
              >
                {done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>

              {/* Icon + text */}
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: done ? "var(--text-secondary)" : "var(--text-primary)",
                    textDecoration: done ? "line-through" : "none",
                  }}
                >
                  {item.label}
                  {item.core && !done && (
                    <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">Wajib</span>
                  )}
                </p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{item.desc}</p>
              </div>

              {/* CTA */}
              {!done && (
                <Link
                  href={item.href}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors hover:opacity-80"
                  style={{ backgroundColor: "#1E3A5F", color: "white" }}
                >
                  {item.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {allDone && (
        <div className="px-5 py-4 border-t border-[var(--border)] text-center">
          <button
            onClick={dismiss}
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Tutup checklist ini
          </button>
        </div>
      )}
    </div>
  );
}
