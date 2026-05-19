"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";

interface Props {
  householdId: string;
  userId: string;
  userName: string;
}

type WalletType = "cash" | "bank" | "ewallet" | "savings";
type Step = 1 | 2 | 3;

const WALLET_TYPES: { id: WalletType; label: string; icon: string; desc: string }[] = [
  { id: "cash",    label: "Tunai",      icon: "💵", desc: "Uang cash / dompet fisik" },
  { id: "bank",    label: "Bank",       icon: "🏦", desc: "Rekening tabungan / giro" },
  { id: "ewallet", label: "E-Wallet",   icon: "📱", desc: "GoPay, OVO, Dana, dll" },
  { id: "savings", label: "Tabungan",   icon: "🐷", desc: "Tabungan tujuan khusus" },
];

const WALLET_SUGGESTIONS: Record<WalletType, string[]> = {
  cash:    ["Dompet Tunai", "Kas Harian", "Uang Saku"],
  bank:    ["BCA", "BRI", "Mandiri", "BNI"],
  ewallet: ["GoPay", "OVO", "Dana", "ShopeePay"],
  savings: ["Tabungan Darurat", "Dana Pendidikan", "Tabungan Liburan"],
};

const STORAGE_KEY = "maalify_onboarding_skipped";

export default function OnboardingWizard({ householdId, userId, userName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [visible, setVisible] = useState(false);

  // Wallet form state
  const [walletType, setWalletType] = useState<WalletType>("cash");
  const [walletName, setWalletName] = useState("Dompet Tunai");
  const [initialBalance, setInitialBalance] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Only show if user hasn't skipped before
    const skipped = localStorage.getItem(STORAGE_KEY);
    if (!skipped) setVisible(true);
  }, []);

  function handleSkip() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleTypeChange(type: WalletType) {
    setWalletType(type);
    setWalletName(WALLET_SUGGESTIONS[type][0]);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInitialBalance(e.target.value.replace(/\D/g, ""));
  }

  async function handleCreateWallet() {
    const balance = parseInt(initialBalance, 10) || 0;
    if (!walletName.trim()) { setError("Nama dompet harus diisi"); return; }

    setSaving(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: err } = await supabase.from("wallets").insert({
        household_id: householdId,
        created_by: userId,
        name: walletName.trim(),
        type: walletType,
        initial_balance: balance,
        current_balance: balance,
        currency: "IDR",
        is_active: true,
        is_shared: true,
      });

      if (err) throw err;
      setStep(3);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  function handleDone() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const firstName = userName.split(" ")[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-[var(--bg-surface)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-[var(--bg-elevated)]">
          <div
            className="h-full bg-brand-primary transition-all duration-500"
            style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
          />
        </div>

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div className="px-8 py-10 text-center space-y-5">
            <div className="text-5xl">👋</div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Halo, {firstName}!
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                Selamat datang di <span className="font-semibold text-brand-primary">Maalify</span>.
                Mari setup keuangan keluargamu dalam 1 langkah mudah.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs text-[var(--text-secondary)]">
              {[
                { icon: "💳", label: "Catat transaksi" },
                { icon: "📊", label: "Pantau anggaran" },
                { icon: "👨‍👩‍👧", label: "Kelola bersama" },
              ].map(f => (
                <div key={f.label} className="bg-[var(--bg-elevated)] rounded-xl py-3 px-2 space-y-1.5">
                  <span className="text-2xl">{f.icon}</span>
                  <p>{f.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Mulai Setup →
            </button>
            <button onClick={handleSkip} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Lewati untuk sekarang
            </button>
          </div>
        )}

        {/* ── Step 2: Buat Dompet ── */}
        {step === 2 && (
          <div className="px-6 py-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div>
              <p className="text-[10px] font-semibold text-[var(--text-secondary)] tracking-widest uppercase">Langkah 1 dari 1</p>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mt-1">Buat Dompet Pertama</h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Dompet adalah tempat menyimpan saldo. Kamu bisa tambah lebih banyak nanti.</p>
            </div>

            {/* Wallet type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Tipe Dompet</label>
              <div className="grid grid-cols-2 gap-2">
                {WALLET_TYPES.map(wt => (
                  <button key={wt.id} type="button" onClick={() => handleTypeChange(wt.id)}
                    className={["p-3 rounded-xl border text-left transition-all",
                      walletType === wt.id
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-[var(--border)] hover:border-brand-primary/40",
                    ].join(" ")}>
                    <span className="text-xl">{wt.icon}</span>
                    <p className="text-xs font-semibold text-[var(--text-primary)] mt-1">{wt.label}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{wt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">Nama Dompet</label>
              <input
                type="text"
                value={walletName}
                onChange={e => setWalletName(e.target.value)}
                maxLength={50}
                className="w-full border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] outline-none focus:border-brand-primary transition-colors"
              />
              {/* Suggestions */}
              <div className="flex gap-1.5 flex-wrap">
                {WALLET_SUGGESTIONS[walletType].map(s => (
                  <button key={s} type="button" onClick={() => setWalletName(s)}
                    className={["text-[10px] px-2 py-1 rounded-full border transition-colors",
                      walletName === s
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                        : "border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-primary/40",
                    ].join(" ")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial balance */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Saldo Awal <span className="font-normal italic">(opsional)</span>
              </label>
              <div className="flex items-center gap-2 border border-[var(--border)] rounded-xl px-3 py-3 focus-within:border-brand-primary transition-colors">
                <span className="text-sm text-[var(--text-secondary)] font-medium flex-shrink-0">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={initialBalance ? Number(initialBalance).toLocaleString("id-ID") : ""}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="flex-1 bg-transparent text-[var(--text-primary)] font-financial text-lg font-semibold outline-none placeholder:text-[var(--text-secondary)]/40"
                />
              </div>
              {initialBalance && (
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Saldo awal: Rp {formatRupiah(parseInt(initialBalance, 10))}
                </p>
              )}
            </div>

            {error && <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors">
                Kembali
              </button>
              <button type="button" onClick={handleCreateWallet} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity">
                {saving ? "Menyimpan..." : "Simpan & Selesai →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === 3 && (
          <div className="px-8 py-10 text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Siap digunakan!</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Dompet <span className="font-semibold text-[var(--text-primary)]">{walletName}</span> berhasil dibuat.
              </p>
            </div>

            <div className="bg-[var(--bg-elevated)] rounded-xl p-4 text-left space-y-2.5">
              <p className="text-xs font-semibold text-[var(--text-secondary)] tracking-wider uppercase">Tips memulai</p>
              {[
                { icon: "📝", text: "Catat setiap transaksi di menu Transaksi" },
                { icon: "📊", text: "Set anggaran bulanan di menu Anggaran" },
                { icon: "👨‍👩‍👧", text: "Undang anggota keluarga lewat Pengaturan → Kode Undangan" },
              ].map(tip => (
                <div key={tip.text} className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0">{tip.icon}</span>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleDone}
              className="w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Mulai Pakai Maalify
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
