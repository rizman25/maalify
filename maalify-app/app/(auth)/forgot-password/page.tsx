"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    });

    if (error) {
      setError("Gagal mengirim email. Pastikan email terdaftar.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-8 shadow-[var(--shadow-sm)] text-center">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Email terkirim!</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Cek inbox <strong className="text-[var(--text-primary)]">{email}</strong> dan klik link untuk reset password.
        </p>
        <Link href="/login" className="inline-block mt-6 text-sm text-brand-primary font-medium hover:underline">
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-8 shadow-[var(--shadow-sm)]">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Lupa password?</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Masukkan email kamu dan kami akan kirimkan link untuk reset password.
      </p>

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 focus:border-transparent"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Mengirim..." : "Kirim Link Reset"}
        </button>
      </form>

      <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
        <Link href="/login" className="text-brand-primary font-medium hover:underline">
          ← Kembali ke masuk
        </Link>
      </p>
    </div>
  );
}
