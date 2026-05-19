"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, household_name: householdName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 shadow-sm text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#0F172A] mb-2">Cek email kamu!</h2>
        <p className="text-sm text-[#475569]">
          Kami mengirim link verifikasi ke <strong>{email}</strong>.<br />
          Klik link tersebut untuk mengaktifkan akun.
        </p>
        <Link href="/login" className="inline-block mt-6 text-sm text-[#1E3A5F] font-medium hover:underline">
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-[#0F172A] mb-6">Buat akun baru</h2>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#1E293B] mb-1.5">Nama lengkap</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-1"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1E293B] mb-1.5">Nama keluarga</label>
          <input
            type="text"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="contoh: Keluarga Budi"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-1"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1E293B] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-1"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1E293B] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-1"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1E3A5F] hover:bg-[#162D4A] text-white font-medium text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Mendaftar..." : "Buat Akun"}
        </button>
      </form>

      <p className="text-center text-xs text-[#475569] mt-6">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-[#1E3A5F] font-medium hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
