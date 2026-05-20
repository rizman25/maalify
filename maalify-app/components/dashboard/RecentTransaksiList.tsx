"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import dynamic from "next/dynamic";

const TransaksiDetailModal = dynamic(() => import("@/components/transaksi/TransaksiDetailModal"), { ssr: false });

interface RecentTx {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  visibility: string;
  user_id: string;
  categories: { name: string; icon: string; color: string } | null;
  wallets: { name: string } | null;
  users: { name: string } | null;
}

interface Props {
  transactions: RecentTx[];
  currentUserId: string;
}

export default function RecentTransaksiList({ transactions, currentUserId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
        Belum ada transaksi bulan ini
      </div>
    );
  }

  return (
    <>
      <div>
        {transactions.map((tx, i) => {
          const cat = Array.isArray(tx.categories) ? tx.categories[0] : tx.categories;
          const wallet = Array.isArray(tx.wallets) ? tx.wallets[0] : tx.wallets;
          const memberName = Array.isArray(tx.users) ? tx.users[0]?.name : tx.users?.name;
          const dateStr = new Date(tx.date + "T00:00:00").toLocaleDateString("id-ID", {
            day: "numeric", month: "short",
          });
          const isIncome = tx.type === "income";
          const isOwn = tx.user_id === currentUserId;
          const isPrivate = tx.visibility === "private";

          return (
            <button
              key={tx.id}
              onClick={() => setSelectedId(tx.id)}
              className={[
                "flex items-center gap-3 px-5 py-3.5 w-full text-left hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] transition-colors",
                i > 0 ? "border-t border-[var(--border)]" : "",
              ].join(" ")}
            >
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20" }}
              >
                {cat?.icon ?? "💸"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{tx.description}</p>
                  {isOwn && isPrivate && (
                    <span className="flex-shrink-0 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full leading-none">🔒</span>
                  )}
                  {!isPrivate && (
                    <span className="flex-shrink-0 text-[10px] text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-full leading-none">🏠</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: (cat?.color ?? "#94A3B8") + "20", color: cat?.color ?? "#94A3B8" }}
                  >
                    {cat?.name ?? "-"}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)]">{dateStr}</span>
                  {wallet?.name && (
                    <span className="text-[10px] text-[var(--text-secondary)] hidden sm:inline">{wallet.name}</span>
                  )}
                  {!isOwn && memberName && (
                    <span className="text-[10px] text-brand-primary font-medium">{memberName}</span>
                  )}
                </div>
              </div>

              {/* Amount + chevron */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className={["font-financial text-sm font-semibold", isIncome ? "text-success" : "text-danger"].join(" ")}>
                  {isIncome ? "+" : "−"}Rp {formatRupiah(Number(tx.amount))}
                </p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)] flex-shrink-0">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {selectedId && (
        <TransaksiDetailModal
          transactionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}
