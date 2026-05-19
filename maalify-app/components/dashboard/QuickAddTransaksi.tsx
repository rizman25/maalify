"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TransaksiModal from "@/components/transaksi/TransaksiModal";
import type { Wallet, Category } from "@/types";

interface Props {
  wallets: Wallet[];
  categories: Category[];
  householdId: string;
  userId: string;
}

export default function QuickAddTransaksi({ wallets, categories, householdId, userId }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Catat Transaksi
      </button>

      {open && (
        <TransaksiModal
          transaction={null}
          wallets={wallets}
          categories={categories}
          householdId={householdId}
          userId={userId}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
