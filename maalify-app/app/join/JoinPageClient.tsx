"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  inviteCode: string;
  householdId: string;
  householdName: string;
  householdDescription: string | null;
  isLoggedIn: boolean;
  userId: string | null;
}

export default function JoinPageClient({
  inviteCode, householdId, householdName, householdDescription, isLoggedIn, userId,
}: Props) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin() {
    if (!userId) return;
    setJoining(true);
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: err } = await supabase.from("household_members").insert({
        household_id: householdId,
        user_id: userId,
        role: "member",
      });

      if (err) throw err;
      router.push("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Gagal bergabung. Coba lagi.");
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-medium tracking-wide uppercase">Undangan Bergabung</p>
        </div>

        {/* Household card */}
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] p-6 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto text-3xl">
            🏠
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{householdName}</h1>
            {householdDescription && (
              <p className="text-sm text-[var(--text-secondary)] mt-1">{householdDescription}</p>
            )}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-elevated)] rounded-full">
            <span className="text-xs text-[var(--text-secondary)]">Kode:</span>
            <span className="font-mono font-bold text-sm text-[var(--text-primary)] tracking-widest">{inviteCode}</span>
          </div>
        </div>

        {/* Action */}
        {isLoggedIn ? (
          <div className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3.5 bg-brand-primary text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity text-sm"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Bergabung...
                </span>
              ) : (
                "Bergabung ke Family →"
              )}
            </button>
            <a href="/dashboard" className="block text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              Batalkan
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center text-[var(--text-secondary)]">
              Masuk atau daftar dulu untuk bergabung ke household ini.
            </p>
            <a
              href={`/register?code=${inviteCode}`}
              className="block w-full py-3.5 bg-brand-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm text-center"
            >
              Daftar Akun Baru
            </a>
            <a
              href={`/login?redirect=/join?code=${inviteCode}`}
              className="block w-full py-3 border border-[var(--border)] text-[var(--text-primary)] font-medium rounded-xl hover:bg-[var(--bg-elevated)] transition-colors text-sm text-center"
            >
              Sudah punya akun? Masuk
            </a>
          </div>
        )}

        <p className="text-center text-[10px] text-[var(--text-secondary)]">
          Kamu akan bergabung sebagai <strong>Member</strong>. Admin dapat mengubah role kapan saja.
        </p>
      </div>
    </div>
  );
}
