"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import type { Project } from "@/types";

interface Wallet { id: string; name: string; type: string; current_balance: number; }

interface Props {
  project: Project;
  wallets: Wallet[];
  userId: string;
  householdId: string;
  onClose: () => void;
  onSaved: () => void;
}

function formatAmountInput(val: string) {
  const digits = val.replace(/\D/g, "");
  return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
}

function parseAmount(val: string) {
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
}

const WALLET_TYPE_ICONS: Record<string, string> = {
  cash: "💵", bank: "🏦", savings: "🏦", ewallet: "📱",
};

export default function KontribusiModal({ project, wallets, userId, householdId, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [sourceWalletId, setSourceWalletId] = useState(wallets[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const parsedAmount = parseAmount(amount);
  const selectedWallet = wallets.find(w => w.id === sourceWalletId);

  const currentAmount = (() => {
    if (project.wallets) {
      const w = Array.isArray(project.wallets) ? project.wallets[0] : project.wallets;
      return (w as { current_balance: number })?.current_balance ?? project.current_amount;
    }
    return project.current_amount;
  })();

  const remaining = Math.max(0, project.target_amount - currentAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (parsedAmount <= 0) { setError("Jumlah kontribusi harus lebih dari 0."); return; }
    if (!sourceWalletId) { setError("Pilih dompet sumber."); return; }
    if (!project.wallet_id) { setError("Project ini belum memiliki dompet. Hubungi admin."); return; }
    if (selectedWallet && parsedAmount > selectedWallet.current_balance) {
      setError("Saldo dompet tidak cukup."); return;
    }

    setError("");
    setLoading(true);
    const supabase = createClient();

    const { error: transferErr } = await supabase.from("transfers").insert({
      household_id: householdId,
      from_wallet_id: sourceWalletId,
      to_wallet_id: project.wallet_id,
      amount: parsedAmount,
      description: note.trim() || `Kontribusi project: ${project.name}`,
      date,
      user_id: userId,
    });

    if (transferErr) { setError(transferErr.message); setLoading(false); return; }

    // Sync current_amount on project
    await supabase
      .from("projects")
      .update({
        current_amount: currentAmount + parsedAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4 py-6">
      <div className="relative bg-[var(--bg-surface)] rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)]">Kontribusi Dana</h2>
            <p className="text-xs text-[var(--text-secondary)]">{project.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Project progress summary */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Terkumpul</span>
              <span>Target</span>
            </div>
            <div className="flex justify-between font-financial font-semibold">
              <span className="text-brand-accent">Rp {formatRupiah(currentAmount)}</span>
              <span className="text-[var(--text-primary)]">Rp {formatRupiah(project.target_amount)}</span>
            </div>
            <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-accent"
                style={{ width: `${Math.min((currentAmount / project.target_amount) * 100, 100)}%` }}
              />
            </div>
            {remaining > 0 && (
              <p className="text-xs text-[var(--text-secondary)]">Kurang Rp {formatRupiah(remaining)}</p>
            )}
          </div>

          {/* Source wallet */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-2">Dompet Sumber</label>
            {wallets.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] p-3 rounded-xl bg-[var(--bg-elevated)]">
                Tidak ada dompet lain yang tersedia.
              </p>
            ) : (
              <div className="space-y-2">
                {wallets.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSourceWalletId(w.id)}
                    className={[
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left",
                      sourceWalletId === w.id
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-[var(--border)] hover:border-brand-primary/40",
                    ].join(" ")}
                  >
                    <span className="text-xl flex-shrink-0">{WALLET_TYPE_ICONS[w.type] ?? "💳"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{w.name}</p>
                      <p className="font-financial text-xs text-[var(--text-secondary)]">Rp {formatRupiah(w.current_balance)}</p>
                    </div>
                    {sourceWalletId === w.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-primary flex-shrink-0">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[var(--text-primary)]">Jumlah Kontribusi</label>
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const max = selectedWallet ? Math.min(remaining, selectedWallet.current_balance) : remaining;
                    setAmount(String(Math.round(max)));
                  }}
                  className="text-[10px] text-brand-primary hover:underline"
                >
                  Isi sisa ({formatRupiah(remaining)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] font-medium">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmountInput(amount)}
                onChange={(e) => setAmount(e.target.value.replace(/\./g, ""))}
                placeholder="0"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-[var(--border)] text-lg text-[var(--text-primary)] bg-[var(--bg-surface)] font-financial font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            {selectedWallet && parsedAmount > 0 && parsedAmount > selectedWallet.current_balance && (
              <p className="text-xs text-danger mt-1">Melebihi saldo dompet (Rp {formatRupiah(selectedWallet.current_balance)})</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
              Catatan <span className="text-[var(--text-secondary)] font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Kontribusi ${project.name}`}
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {error && (
            <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || wallets.length === 0}
              className="flex-1 py-2.5 rounded-xl bg-brand-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Mentransfer..." : "Kontribusi"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
