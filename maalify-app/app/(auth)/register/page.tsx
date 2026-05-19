"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "create" | "join";

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border-[1.5px] border-[var(--border)] bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 focus:border-transparent";
const labelCls = "block text-xs font-medium text-[var(--text-primary)] mb-1.5";

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [phone, setPhone] = useState("");
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

    if (mode === "join" && inviteCode.trim().length < 6) {
      setError("Kode undangan tidak valid.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "62");
    const metadata =
      mode === "create"
        ? { name, household_name: householdName, phone: cleanPhone || null }
        : { name, invite_code: inviteCode.trim().toUpperCase(), phone: cleanPhone || null };

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
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
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-8 shadow-[var(--shadow-sm)] text-center">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Cek email kamu!</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Kami mengirim link verifikasi ke <strong className="text-[var(--text-primary)]">{email}</strong>.<br />
          Klik link tersebut untuk mengaktifkan akun.
        </p>
        {mode === "join" && (
          <p className="text-xs text-[var(--text-secondary)] mt-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg px-3 py-2">
            Setelah verifikasi, kamu akan otomatis bergabung ke household dengan kode <strong>{inviteCode.toUpperCase()}</strong>.
          </p>
        )}
        <Link href="/login" className="inline-block mt-6 text-sm text-brand-primary font-medium hover:underline">
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] p-8 shadow-[var(--shadow-sm)]">
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-5">Buat akun baru</h2>

      {/* Mode toggle */}
      <div className="flex bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-1 gap-1 mb-5">
        {([
          { id: "create" as Mode, label: "🏠 Buat Household Baru" },
          { id: "join" as Mode,   label: "🔗 Gabung via Kode" },
        ]).map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMode(m.id); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              mode === m.id
                ? "bg-brand-primary text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className={labelCls}>Nama lengkap</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            required
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>
            No. WhatsApp <span className="font-normal text-[var(--text-secondary)]">(opsional)</span>
          </label>
          <div className="flex items-center border-[1.5px] border-[var(--border)] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-1 bg-[var(--bg-elevated)]">
            <span className="px-3 py-2.5 bg-[var(--bg-base)] text-sm text-[var(--text-secondary)] border-r border-[var(--border)] flex-shrink-0 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.091.535 4.06 1.476 5.779L.057 23.514a.75.75 0 0 0 .93.93l5.735-1.419A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.898 0-3.68-.499-5.23-1.374l-.374-.22-3.877.96.977-3.877-.22-.374A10 10 0 1 1 12 22z"/></svg>
              +62
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="812 3456 7890"
              inputMode="numeric"
              className="flex-1 px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none bg-transparent"
            />
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1">Digunakan untuk berbagi laporan via WhatsApp</p>
        </div>

        {mode === "create" ? (
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
          </div>
        ) : (
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
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">Minta kode dari admin household yang ingin kamu ikuti</p>
          </div>
        )}

        <div>
          <label className={labelCls}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            required
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 8 karakter"
            required
            className={inputCls}
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
          {loading ? "Mendaftar..." : mode === "create" ? "Buat Akun & Household" : "Daftar & Gabung"}
        </button>
      </form>

      <p className="text-center text-xs text-[var(--text-secondary)] mt-6">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-brand-primary font-medium hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
