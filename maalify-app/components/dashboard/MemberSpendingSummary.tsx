"use client";

import { formatRupiah } from "@/lib/utils";

export interface MemberSpending {
  user_id: string;
  user_name: string;
  total_expense: number;
  tx_count: number;
}

interface Props {
  members: MemberSpending[];
  currentUserId: string;
  bulanNama: string;
}

const AVATAR_COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B",
  "#EF4444", "#06B6D4", "#EC4899", "#6366F1",
];

export default function MemberSpendingSummary({ members, currentUserId, bulanNama }: Props) {
  if (members.length === 0) return null;

  const maxExpense = Math.max(...members.map((m) => m.total_expense), 1);
  const totalExpense = members.reduce((s, m) => s + m.total_expense, 0);

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="font-semibold text-[var(--text-primary)]">Pengeluaran per Anggota</p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{bulanNama} · termasuk transaksi pribadi</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-2.5 py-1 rounded-lg">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Hanya kamu yang lihat ini
        </div>
      </div>

      {/* Total */}
      <div className="mt-3 mb-4 p-3 bg-[var(--bg-elevated)] rounded-lg flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">Total pengeluaran keluarga</span>
        <span className="font-financial font-semibold text-sm text-danger">
          −Rp {formatRupiah(totalExpense)}
        </span>
      </div>

      {/* Member list */}
      <div className="space-y-4">
        {members
          .sort((a, b) => b.total_expense - a.total_expense)
          .map((m, i) => {
            const isMe = m.user_id === currentUserId;
            const pct = maxExpense > 0 ? (m.total_expense / maxExpense) * 100 : 0;
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const initial = m.user_name.trim()[0]?.toUpperCase() ?? "?";
            const sharePct = totalExpense > 0
              ? Math.round((m.total_expense / totalExpense) * 100)
              : 0;

            return (
              <div key={m.user_id}>
                <div className="flex items-center gap-3 mb-1.5">
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {initial}
                  </div>

                  {/* Name + badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {m.user_name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary flex-shrink-0">
                          Kamu
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)]">
                      {m.tx_count} transaksi · {sharePct}% dari total
                    </span>
                  </div>

                  {/* Amount */}
                  <span className="font-financial text-sm font-semibold text-danger flex-shrink-0">
                    −Rp {formatRupiah(m.total_expense)}
                  </span>
                </div>

                {/* Bar */}
                <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden ml-11">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Note */}
      <p className="text-[10px] text-[var(--text-secondary)] mt-4 flex items-center gap-1">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Data di atas termasuk transaksi pribadi setiap anggota — tidak bisa dilihat oleh anggota lain
      </p>
    </div>
  );
}
