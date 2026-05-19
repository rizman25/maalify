"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const ScanStrukModal = dynamic(() => import("@/components/transaksi/ScanStrukModal"), { ssr: false });

interface Props {
  wallets: import("@/types").Wallet[];
  categories: import("@/types").Category[];
  householdId: string;
  userId: string;
}

export default function ScanStrukButton({ wallets, categories, householdId, userId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] text-sm font-medium hover:border-brand-primary hover:text-brand-primary transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
        <span className="hidden sm:inline">Scan Struk</span>
      </button>

      {open && (
        <ScanStrukModal
          wallets={wallets}
          categories={categories}
          householdId={householdId}
          userId={userId}
          onClose={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      )}
    </>
  );
}
