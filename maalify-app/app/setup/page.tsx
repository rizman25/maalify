"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type WalletType = "cash" | "bank" | "savings" | "ewallet";

const WALLET_TYPES = [
  { value: "cash" as WalletType, label: "Tunai", icon: "💵", color: "#27AE60" },
  { value: "bank" as WalletType, label: "Bank", icon: "🏦", color: "#1E3A5F" },
  { value: "ewallet" as WalletType, label: "E-Wallet", icon: "📱", color: "#8B5CF6" },
  { value: "savings" as WalletType, label: "Tabungan", icon: "🏧", color: "#F59E0B" },
];

const STEPS = [
  { id: 1, label: "Dompet", icon: "🏦" },
  { id: 2, label: "Transaksi", icon: "💸" },
  { id: 3, label: "Anggota", icon: "👨‍👩‍👧" },
  { id: 4, label: "Bot WA", icon: "🤖" },
  { id: 5, label: "Panduan", icon: "📖" },
];

function formatBalanceInput(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [initLoading, setInitLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // User & household
  const [householdId, setHouseholdId] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  // Step 1 — Dompet
  const [walletType, setWalletType] = useState<WalletType>("cash");
  const [walletName, setWalletName] = useState("");
  const [walletBalance, setWalletBalance] = useState("");

  // Invite copy
  const [codeCopied, setCodeCopied] = useState(false);

  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const totalSteps = 5;

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      setUserId(user.id);
      setUserName(user.user_metadata?.name ?? "");

      const { data: membership } = await supabase
        .from("household_members")
        .select("household_id, role, households(name, invite_code)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) { router.push("/onboarding"); return; }

      const hh = membership.households as { name: string; invite_code: string } | null;
      setHouseholdId(membership.household_id);
      setUserRole(membership.role);
      setHouseholdName(hh?.name ?? "");
      setInviteCode(hh?.invite_code ?? "");
      setInitLoading(false);
    }
    init();
  }, [router]);

  async function handleCreateWallet(e: React.FormEvent) {
    e.preventDefault();
    if (!walletName.trim()) { setError("Nama dompet wajib diisi."); return; }
    setLoading(true);
    setError("");

    const supabase = createClient();
    const defaultColors: Record<WalletType, string> = {
      cash: "#27AE60", bank: "#1E3A5F", savings: "#F59E0B", ewallet: "#8B5CF6",
    };
    const balanceRaw = Number(walletBalance.replace(/\D/g, "")) || 0;

    const { error: wErr } = await supabase.from("wallets").insert({
      household_id: householdId,
      name: walletName.trim(),
      type: walletType,
      initial_balance: balanceRaw,
      current_balance: balanceRaw,
      color: defaultColors[walletType],
      is_shared: true,
      is_active: true,
      created_by: userId,
    });

    if (wErr) {
      setError("Gagal membuat dompet. " + wErr.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep(2);
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  function nextStep() {
    setError("");
    setStep(s => Math.min(s + 1, totalSteps + 1));
  }

  function finishSetup() {
    router.push("/dashboard");
  }

  // Redirect to dashboard when step exceeds total
  useEffect(() => {
    if (step > totalSteps) finishSetup();
  }, [step]);

  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8FAFB" }}>
        <div className="animate-spin w-8 h-8 border-2 border-[#1E3A5F] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .sw-wrap { background-color: #F8FAFB !important; color: #0F172A !important; }
        .sw-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1.5px solid #E2E8F0;
          background: #fff;
          font-size: 14px;
          color: #0F172A;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sw-input:focus {
          border-color: #1E3A5F;
          box-shadow: 0 0 0 2px rgba(30,58,95,0.12);
        }
        .sw-input::placeholder { color: #94A3B8; }
      `}</style>

      <div className="sw-wrap min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col gap-5">

          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2" style={{ backgroundColor: "#1E3A5F" }}>
              <span style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>M</span>
            </div>
            <p className="text-sm font-medium" style={{ color: "#1E3A5F" }}>
              Family: <span className="font-bold">{householdName}</span>
            </p>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-2" style={{ color: "#64748B" }}>
              <span>Setup awal</span>
              <span>Langkah {step} dari {totalSteps}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(step / totalSteps) * 100}%`, backgroundColor: "#1E3A5F" }}
              />
            </div>
            {/* Step dots */}
            <div className="flex justify-between mt-2">
              {STEPS.map(s => (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                    style={{
                      backgroundColor: step > s.id ? "#27AE60" : step === s.id ? "#1E3A5F" : "#E2E8F0",
                      color: step >= s.id ? "white" : "#94A3B8",
                      fontSize: "10px",
                    }}
                  >
                    {step > s.id ? "✓" : s.icon}
                  </div>
                  <span className="text-[9px]" style={{ color: step >= s.id ? "#1E3A5F" : "#94A3B8" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── STEP 1: TAMBAH DOMPET ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: "#EFF6FF" }}>🏦</div>
                <div>
                  <h2 className="font-semibold" style={{ color: "#0F172A" }}>Tambah Dompet Pertama</h2>
                  <p className="text-xs" style={{ color: "#64748B" }}>Semua transaksi butuh dompet sebagai sumber dana</p>
                </div>
              </div>

              <form onSubmit={handleCreateWallet} className="space-y-4">
                {/* Tipe dompet */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "#1E293B" }}>Jenis Dompet</label>
                  <div className="grid grid-cols-4 gap-2">
                    {WALLET_TYPES.map(wt => (
                      <button
                        key={wt.value}
                        type="button"
                        onClick={() => { setWalletType(wt.value); setWalletName(""); }}
                        className="flex flex-col items-center gap-1 p-2.5 rounded-xl border-[1.5px] transition-all"
                        style={{
                          borderColor: walletType === wt.value ? wt.color : "#E2E8F0",
                          backgroundColor: walletType === wt.value ? wt.color + "12" : "white",
                        }}
                      >
                        <span className="text-xl">{wt.icon}</span>
                        <span className="text-[10px] font-medium" style={{ color: walletType === wt.value ? wt.color : "#64748B" }}>{wt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nama dompet */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#1E293B" }}>Nama Dompet</label>
                  <input
                    className="sw-input"
                    type="text"
                    value={walletName}
                    onChange={e => setWalletName(e.target.value)}
                    placeholder={
                      walletType === "cash" ? "contoh: Dompet Harian" :
                      walletType === "bank" ? "contoh: BCA Utama" :
                      walletType === "ewallet" ? "contoh: GoPay" :
                      "contoh: Tabungan Darurat"
                    }
                    required
                  />
                </div>

                {/* Saldo awal */}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#1E293B" }}>
                    Saldo Awal <span style={{ color: "#94A3B8", fontWeight: 400 }}>(opsional)</span>
                  </label>
                  <div className="flex items-center border-[1.5px] rounded-xl overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
                    <span className="px-3 text-sm font-medium border-r" style={{ color: "#64748B", borderColor: "#E2E8F0", backgroundColor: "#F8FAFB", padding: "10px 12px" }}>Rp</span>
                    <input
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                      style={{ color: "#0F172A" }}
                      type="text"
                      inputMode="numeric"
                      value={walletBalance}
                      onChange={e => setWalletBalance(formatBalanceInput(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: "#1E3A5F" }}
                >
                  {loading ? "Menyimpan..." : "Buat Dompet & Lanjut →"}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2: TRANSAKSI / SCAN STRUK ── */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: "#FFF7ED" }}>💸</div>
                <div>
                  <h2 className="font-semibold" style={{ color: "#0F172A" }}>Catat Transaksi</h2>
                  <p className="text-xs" style={{ color: "#64748B" }}>Catat pemasukan & pengeluaran keluarga</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFB" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✍️</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0F172A" }}>Catat Manual</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Input transaksi langsung dari menu Transaksi. Pilih dompet, kategori, jumlah, dan deskripsi.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFB" }}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📸</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0F172A" }}>Scan Struk</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>Foto struk belanjaan, AI akan membaca dan mengisi transaksi secara otomatis.</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center mb-4" style={{ color: "#94A3B8" }}>Kamu bisa lakukan ini kapan saja dari dashboard</p>

              <div className="flex gap-2">
                <button
                  onClick={nextStep}
                  className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ borderColor: "#E2E8F0", color: "#64748B" }}
                >
                  Lewati
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: "#1E3A5F" }}
                >
                  Mengerti, Lanjut →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: UNDANG ANGGOTA ── */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: "#F0FBF4" }}>👨‍👩‍👧</div>
                <div>
                  <h2 className="font-semibold" style={{ color: "#0F172A" }}>Undang Anggota Keluarga</h2>
                  <p className="text-xs" style={{ color: "#64748B" }}>Bagikan kode agar keluarga bisa ikut mencatat</p>
                </div>
              </div>

              {isAdmin ? (
                <>
                  <p className="text-xs mb-3" style={{ color: "#475569" }}>Bagikan kode undangan ini kepada anggota keluarga:</p>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="flex-1 py-3 px-4 rounded-xl text-center font-mono text-lg font-bold tracking-widest border-2 border-dashed"
                      style={{ color: "#1E3A5F", borderColor: "#1E3A5F", backgroundColor: "#EFF6FF" }}
                    >
                      {inviteCode}
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="px-4 py-3 rounded-xl text-sm font-medium text-white flex-shrink-0 transition-colors"
                      style={{ backgroundColor: codeCopied ? "#27AE60" : "#1E3A5F" }}
                    >
                      {codeCopied ? "✓ Disalin!" : "Salin"}
                    </button>
                  </div>
                  <p className="text-xs mb-5" style={{ color: "#94A3B8" }}>
                    Anggota bisa join via menu <strong>Pengaturan → Gabung Family</strong> atau saat mendaftar
                  </p>
                </>
              ) : (
                <div className="py-4 text-center mb-4">
                  <p className="text-sm" style={{ color: "#475569" }}>Kamu sudah bergabung sebagai anggota family ini. Admin family dapat mengundang anggota lain.</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={nextStep}
                  className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ borderColor: "#E2E8F0", color: "#64748B" }}
                >
                  Lewati
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: "#1E3A5F" }}
                >
                  Lanjut →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: BOT WHATSAPP ── */}
          {step === 4 && (
            <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: "#F0FBF4" }}>🤖</div>
                <div>
                  <h2 className="font-semibold" style={{ color: "#0F172A" }}>Bot WhatsApp</h2>
                  <p className="text-xs" style={{ color: "#64748B" }}>Kelola keuangan langsung dari WhatsApp</p>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="p-3 rounded-xl" style={{ backgroundColor: "#F0FBF4" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#166534" }}>🔔 Notifikasi Otomatis</p>
                  <p className="text-xs" style={{ color: "#15803D" }}>Terima ringkasan harian & bulanan langsung di WhatsApp</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: "#EFF6FF" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#1E40AF" }}>💬 Catat via Chat</p>
                  <p className="text-xs" style={{ color: "#2563EB" }}>Ketik &quot;keluar 50rb makan siang&quot; → langsung tercatat</p>
                </div>
                <div className="p-3 rounded-xl" style={{ backgroundColor: "#FFF7ED" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#9A3412" }}>📊 Tanya Laporan</p>
                  <p className="text-xs" style={{ color: "#C2410C" }}>Tanya &quot;berapa total pengeluaran bulan ini?&quot; langsung dijawab</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border mb-4 flex items-center gap-2" style={{ borderColor: "#FEF3C7", backgroundColor: "#FFFBEB" }}>
                <span>🚧</span>
                <p className="text-xs" style={{ color: "#92400E" }}>Fitur Bot WA sedang dalam pengembangan. Akan segera hadir!</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={nextStep}
                  className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ borderColor: "#E2E8F0", color: "#64748B" }}
                >
                  Lewati
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: "#1E3A5F" }}
                >
                  Lanjut →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: PANDUAN ── */}
          {step === 5 && (
            <div className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: "#F5F3FF" }}>📖</div>
                <div>
                  <h2 className="font-semibold" style={{ color: "#0F172A" }}>Baca Panduan</h2>
                  <p className="text-xs" style={{ color: "#64748B" }}>Pelajari cara pakai Maalify dengan optimal</p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  { icon: "🏠", title: "Cara Mencatat Transaksi", desc: "Panduan lengkap input pemasukan & pengeluaran" },
                  { icon: "💰", title: "Mengatur Anggaran Bulanan", desc: "Tips buat budget yang realistis untuk keluarga" },
                  { icon: "👨‍👩‍👧", title: "Mengelola Anggota Family", desc: "Undang, atur peran, dan batasi akses anggota" },
                  { icon: "📊", title: "Membaca Laporan Keuangan", desc: "Cara membaca grafik dan analisis keuangan" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "#0F172A" }}>{item.title}</p>
                      <p className="text-[10px]" style={{ color: "#64748B" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/panduan"
                target="_blank"
                className="block text-center text-xs font-medium mb-4 underline"
                style={{ color: "#1E3A5F" }}
              >
                Buka Panduan Lengkap →
              </Link>

              <div className="flex gap-2">
                <button
                  onClick={finishSetup}
                  className="flex-1 py-2.5 rounded-xl text-sm border transition-colors"
                  style={{ borderColor: "#E2E8F0", color: "#64748B" }}
                >
                  Lewati
                </button>
                <button
                  onClick={finishSetup}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: "#27AE60" }}
                >
                  🎉 Masuk Dashboard!
                </button>
              </div>
            </div>
          )}

          {/* Skip semua */}
          {step < 5 && step > 1 && (
            <button
              onClick={finishSetup}
              className="text-center text-xs hover:underline"
              style={{ color: "#94A3B8" }}
            >
              Lewati semua, langsung ke dashboard
            </button>
          )}

        </div>
      </div>
    </>
  );
}
