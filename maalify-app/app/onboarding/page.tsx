"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "choose" | "create" | "join";

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-1 focus:border-transparent";
const labelCls = "block text-xs font-medium text-[#1E293B] mb-1.5";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("choose");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user info and verify session
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserName(data.user.user_metadata?.name ?? "");

      // If user already has a household, skip onboarding
      supabase
        .from("household_members")
        .select("id")
        .limit(1)
        .single()
        .then(({ data: m }) => {
          if (m) router.push("/dashboard");
        });
    });
  }, [router]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const generatedCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data: household, error: hErr } = await supabase
      .from("households")
      .insert({ name: householdName.trim(), invite_code: generatedCode, created_by: user.id })
      .select()
      .single();

    if (hErr || !household) {
      console.error("❌ households insert error:", hErr);
      setError(`Gagal membuat family. ${hErr?.message ?? "Coba lagi."}`);
      setLoading(false);
      return;
    }

    const { error: mErr } = await supabase.from("household_members").insert({
      household_id: household.id,
      user_id: user.id,
      role: "admin",
    });

    if (mErr) {
      setError("Gagal mendaftarkan ke family.");
      setLoading(false);
      return;
    }

    // Create free subscription
    await supabase.from("subscriptions").insert({
      household_id: household.id,
      plan: "free",
      status: "active",
    });

    router.push("/setup");
    router.refresh();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const code = inviteCode.trim().toUpperCase();
    if (code.length < 6) {
      setError("Kode undangan tidak valid.");
      setLoading(false);
      return;
    }

    // Find household by invite code
    const { data: householdId } = await supabase
      .rpc("find_household_by_invite_code", { p_invite_code: code });

    if (!householdId) {
      setError("Kode undangan tidak ditemukan. Periksa kembali.");
      setLoading(false);
      return;
    }

    const { error: mErr } = await supabase.from("household_members").insert({
      household_id: householdId,
      user_id: user.id,
      role: "member",
    });

    if (mErr) {
      setError("Gagal bergabung ke family. Mungkin kamu sudah terdaftar.");
      setLoading(false);
      return;
    }

    router.push("/setup");
    router.refresh();
  }

  return (
    <>
      <style>{`
        .ob-wrap { background-color: #F8FAFB !important; color: #0F172A !important; }
        .ob-wrap input {
          background-color: #FFFFFF !important;
          border-color: #E2E8F0 !important;
          color: #0F172A !important;
        }
        .ob-wrap input::placeholder { color: #94A3B8 !important; opacity: 1 !important; }
        .ob-wrap input:-webkit-autofill,
        .ob-wrap input:-webkit-autofill:hover,
        .ob-wrap input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
          -webkit-text-fill-color: #0F172A !important;
        }
      `}</style>

      <div className="ob-wrap min-h-screen flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md flex flex-col gap-6">

          {/* Logo */}
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
              style={{ backgroundColor: "#1E3A5F" }}
            >
              <span style={{ color: "white", fontWeight: "bold", fontSize: "20px" }}>M</span>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1E3A5F" }}>Maalify</h1>
            <p style={{ fontSize: "14px", color: "#475569", marginTop: "4px" }}>
              {userName ? `Halo, ${userName}!` : "Satu langkah lagi…"}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">

            {step === "choose" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-[#1E3A5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-[#0F172A]">Siapkan Family-mu</h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Family adalah ruang keuangan keluargamu.<br />
                    Buat baru atau bergabung ke yang sudah ada.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setStep("create")}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] border-[#E2E8F0] hover:border-[#1E3A5F] hover:bg-[#F0F5FF] transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">Buat Family Baru</p>
                      <p className="text-xs text-[#64748B] mt-0.5">Jadilah admin family keluargamu</p>
                    </div>
                    <svg className="w-4 h-4 text-[#94A3B8] ml-auto group-hover:text-[#1E3A5F] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  <button
                    onClick={() => setStep("join")}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-[1.5px] border-[#E2E8F0] hover:border-[#27AE60] hover:bg-[#F0FBF4] transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#27AE60] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">Gabung via Kode Undangan</p>
                      <p className="text-xs text-[#64748B] mt-0.5">Masukkan kode dari admin keluarga</p>
                    </div>
                    <svg className="w-4 h-4 text-[#94A3B8] ml-auto group-hover:text-[#27AE60] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}

            {step === "create" && (
              <>
                <button
                  onClick={() => { setStep("choose"); setError(""); }}
                  className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1E3A5F] transition-colors mb-5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                  </svg>
                  Kembali
                </button>

                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-[#0F172A]">Buat Family Baru</h2>
                  <p className="text-xs text-[#64748B] mt-1">Kamu akan menjadi Admin family ini.</p>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className={labelCls}>Nama keluarga</label>
                    <input
                      type="text"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      placeholder="contoh: Keluarga Budi"
                      required
                      className={inputCls}
                    />
                    <p className="text-[10px] text-[#94A3B8] mt-1">
                      Nama ini akan muncul di laporan dan undangan anggota.
                    </p>
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1E3A5F] hover:bg-[#162D4A] text-white font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Membuat..." : "Buat & Mulai"}
                  </button>
                </form>
              </>
            )}

            {step === "join" && (
              <>
                <button
                  onClick={() => { setStep("choose"); setError(""); }}
                  className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1E3A5F] transition-colors mb-5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                  </svg>
                  Kembali
                </button>

                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-[#0F172A]">Gabung via Kode Undangan</h2>
                  <p className="text-xs text-[#64748B] mt-1">Minta kode dari admin family yang ingin kamu ikuti.</p>
                </div>

                <form onSubmit={handleJoin} className="space-y-4">
                  <div>
                    <label className={labelCls}>Kode Undangan</label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="contoh: AB12CD34"
                      maxLength={12}
                      required
                      className={inputCls + " font-mono tracking-widest uppercase"}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#27AE60] hover:bg-[#219150] text-white font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Bergabung..." : "Gabung Sekarang"}
                  </button>
                </form>
              </>
            )}

          </div>

        </div>
      </div>
    </>
  );
}
