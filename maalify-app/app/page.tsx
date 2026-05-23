import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-[#1E3A5F] text-lg tracking-tight">Maalify</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <a href="#fitur" className="hover:text-[#1E3A5F] transition-colors">Fitur</a>
            <a href="#ai" className="hover:text-[#1E3A5F] transition-colors">AI Canggih</a>
            <a href="#cara-kerja" className="hover:text-[#1E3A5F] transition-colors">Cara Kerja</a>
            <Link href="/guide" className="hover:text-[#1E3A5F] transition-colors">Panduan</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-neutral-600 hover:text-[#1E3A5F] transition-colors hidden sm:block">
              Masuk
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-lg bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#1E3A5F]/90 transition-colors">
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Kini dilengkapi AI — Scan Struk & Asisten Keuangan
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1E3A5F] leading-tight tracking-tight max-w-3xl mx-auto">
          Keuangan Keluarga,{" "}
          <span className="text-[#27AE60]">Lebih Cerdas Bersama</span>
        </h1>

        <p className="mt-6 text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
          Maalify membantu keluarga mencatat transaksi dengan foto struk, mendapat saran dari AI,
          memantau anggaran, hutang, dan target keuangan — semua dalam satu platform.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1E3A5F] text-white font-semibold hover:bg-[#1E3A5F]/90 transition-colors text-base">
            Mulai Gratis Sekarang →
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-6 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors text-base">
            Sudah punya akun? Masuk
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
          <p className="text-xs text-neutral-400">Gratis selamanya</p>
          <p className="text-xs text-neutral-400">Setup 2 menit</p>
          <p className="text-xs text-neutral-400">Bisa diinstall di HP</p>
          <p className="text-xs text-neutral-400">Tanpa kartu kredit</p>
        </div>

        {/* Hero visual */}
        <div className="mt-14 relative max-w-4xl mx-auto">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 shadow-xl overflow-hidden">
            {/* Mock topbar */}
            <div className="bg-white border-b border-neutral-100 px-5 py-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <div className="w-3 h-3 rounded-full bg-yellow-300" />
              <div className="w-3 h-3 rounded-full bg-green-300" />
              <div className="flex-1 mx-4 h-6 rounded-md bg-neutral-100 max-w-xs" />
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-6 w-20 rounded-md bg-neutral-100" />
                <div className="h-6 w-24 rounded-md bg-[#1E3A5F]/10" />
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="flex">
              {/* Mock sidebar */}
              <div className="hidden sm:block w-44 bg-white border-r border-neutral-100 p-3 space-y-1">
                {["Dashboard","Transaksi","Dompet","Anggaran","Hutang","Tabungan","Laporan"].map((item, i) => (
                  <div key={item} className={`h-8 rounded-lg flex items-center px-3 gap-2 ${i === 0 ? "bg-[#1E3A5F]" : "bg-transparent"}`}>
                    <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${i === 0 ? "bg-white/40" : "bg-neutral-200"}`} />
                    <div className={`h-2.5 rounded flex-1 ${i === 0 ? "bg-white/40" : "bg-neutral-100"}`} style={{ maxWidth: `${55 + (i * 7) % 30}%` }} />
                  </div>
                ))}
              </div>
              {/* Mock content */}
              <div className="flex-1 p-4 space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Total Saldo", value: "Rp 24,5 Jt", color: "#3B82F6" },
                    { label: "Pemasukan", value: "Rp 8,2 Jt", color: "#27AE60" },
                    { label: "Pengeluaran", value: "Rp 3,7 Jt", color: "#E74C3C" },
                    { label: "Tabungan", value: "Rp 4,5 Jt", color: "#8B5CF6" },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-xl border border-neutral-100 p-3">
                      <p className="text-[8px] text-neutral-400 font-medium uppercase tracking-wide">{card.label}</p>
                      <p className="text-xs font-bold mt-1" style={{ color: card.color }}>{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 bg-white rounded-xl border border-neutral-100 p-3">
                    <p className="text-[9px] text-neutral-400 font-medium mb-2">Tren 6 Bulan</p>
                    <div className="flex items-end gap-1 h-12">
                      {[40,65,50,80,60,90].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: i === 5 ? "#1E3A5F" : "#E2E8F0" }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-neutral-100 p-3 space-y-1.5">
                    <p className="text-[9px] text-neutral-400 font-medium">Anggaran</p>
                    {[["Makan",75],["Belanja",45],["Hiburan",90]].map(([label, pct]) => (
                      <div key={label as string}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[8px] text-neutral-500">{label}</span>
                          <span className="text-[8px] text-neutral-500">{pct}%</span>
                        </div>
                        <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: Number(pct) >= 80 ? "#E74C3C" : "#27AE60" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* AI Chat bubble */}
                <div className="bg-white rounded-xl border border-neutral-100 p-3 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">M</div>
                  <div className="flex-1">
                    <p className="text-[8px] font-semibold text-[#1E3A5F]">Maali · Asisten AI</p>
                    <p className="text-[8px] text-neutral-500 mt-0.5">Pengeluaran kamu bulan ini naik 12% dari bulan lalu, terutama di kategori Belanja. Coba kurangi 10% untuk mencapai target tabungan!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-100 via-transparent to-green-100 rounded-3xl -z-10 blur-2xl opacity-60" />
        </div>
      </section>

      {/* ── AI Highlight ── */}
      <section id="ai" className="py-20 bg-gradient-to-br from-[#1E3A5F] to-[#0F2640]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#27AE60] uppercase tracking-widest mb-3">Kecerdasan Buatan</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Fitur AI yang Bikin Keuanganmu Lebih Mudah</h2>
            <p className="mt-4 text-blue-300 max-w-xl mx-auto">Teknologi AI membantu kamu mencatat lebih cepat dan memahami kondisi keuangan keluarga.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scan Struk */}
            <div className="bg-white/10 rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#27AE60]/20 flex items-center justify-center flex-shrink-0"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
                <div>
                  <h3 className="font-bold text-white text-xl mb-2">Scan Struk Otomatis</h3>
                  <p className="text-blue-200 text-sm leading-relaxed mb-4">
                    Foto struk belanja atau upload PDF — Maalify langsung membaca merchant, tanggal, nominal, dan item secara otomatis menggunakan AI. Tidak perlu ketik manual!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["JPG / PNG / PDF","Terbaca dalam detik","Edit sebelum simpan"].map(t => (
                      <span key={t} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-blue-200">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Maali AI */}
            <div className="bg-white/10 rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-400/20 flex items-center justify-center flex-shrink-0"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="12" y1="16" x2="12" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg></div>
                <div>
                  <h3 className="font-bold text-white text-xl mb-2">Maali — Asisten Keuangan AI</h3>
                  <p className="text-blue-200 text-sm leading-relaxed mb-4">
                    Tanya kondisi keuangan keluarga kapan saja. Maali membaca data real-time kamu dan memberikan analisis, saran penghematan, dan jawaban atas pertanyaan keuanganmu.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["Analisis otomatis","Saran hemat","Tanya bebas"].map(t => (
                      <span key={t} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-blue-200">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sample chat */}
          <div className="mt-8 bg-white/5 rounded-2xl border border-white/10 p-6 max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-blue-400 mb-4 uppercase tracking-wider">Contoh percakapan dengan Maali</p>
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="bg-[#1E3A5F] border border-white/20 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
                  <p className="text-white text-sm">Bagaimana kondisi keuangan saya bulan ini?</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-[#27AE60] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">M</div>
                <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-sm">
                  <p className="text-blue-100 text-sm">Bulan ini pemasukanmu <strong className="text-white">Rp 8.200.000</strong> dengan pengeluaran <strong className="text-white">Rp 3.750.000</strong> — kamu surplus <strong className="text-[#27AE60]">Rp 4.450.000</strong>! Kategori terbesar: Belanja (Rp 1,2 Jt). Saran: alokasikan 20% surplus ke tabungan darurat!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="fitur" className="bg-neutral-50 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#27AE60] uppercase tracking-widest mb-3">Fitur Lengkap</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">Semua yang keluarga butuhkan</h2>
            <p className="mt-4 text-neutral-500 max-w-xl mx-auto">Dari pencatatan harian sampai perencanaan jangka panjang, semua tersedia dalam satu aplikasi.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {([
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, title: "Multi Dompet", desc: "Kelola tunai, rekening bank, tabungan, dan e-wallet dalam satu dashboard. Transfer antar dompet dengan mudah." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>, title: "Anggaran Bulanan", desc: "Tetapkan batas pengeluaran per kategori. Notifikasi otomatis saat mendekati atau melampaui batas anggaran." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, title: "Hutang & Piutang", desc: "Catat hutang dengan sistem cicilan. Pantau sisa, jatuh tempo, dan progres pembayaran secara real-time." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, title: "Tabungan & Goals", desc: "Buat target keuangan keluarga — DP rumah, liburan, pendidikan. Tabung bersama dan pantau progressnya." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>, title: "Transaksi Berulang", desc: "Set gaji, tagihan, atau cicilan sekali. Otomatis tercatat sesuai jadwal bulanan atau mingguan." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: "Laporan & Analisis", desc: "Laporan visual bulanan dan tahunan. Lihat tren, kategori terbesar, dan perbandingan bulan sebelumnya." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, title: "Global Search", desc: "Cari transaksi, dompet, atau hutang dalam hitungan detik dengan shortcut Ctrl+K dari mana saja." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, title: "Install di HP", desc: "Maalify bisa diinstall di smartphone layaknya aplikasi native — buka cepat, bekerja offline untuk navigasi dasar." },
              { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, title: "Multi Anggota Keluarga", desc: "Undang anggota lewat link WhatsApp atau kode unik. Tiga tingkat role (Super Admin, Admin, Member) dengan hak akses dan privasi masing-masing." },
            ] as { icon: React.ReactNode; title: string; desc: string }[]).map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#1E3A5F]/5 flex items-center justify-center mb-4">{f.icon}</div>
                <h3 className="font-bold text-[#1E3A5F] text-lg mb-2">{f.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role & Privacy ── */}
      <section id="peran" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#27AE60] uppercase tracking-widest mb-3">Aman untuk Seluruh Keluarga</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">Peran & Privasi yang Fleksibel</h2>
            <p className="mt-4 text-neutral-500 max-w-xl mx-auto">Setiap anggota keluarga punya peran dan kontrol atas data pribadinya masing-masing.</p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {([
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
                role: "Super Admin",
                badge: "bg-amber-100 text-amber-700 border-amber-200",
                border: "border-amber-200",
                bg: "bg-amber-50",
                text: "text-amber-800",
                when: "Otomatis saat mendaftar & membuat family",
                desc: "Akses penuh ke semua fitur — transaksi, anggaran, laporan, hutang, manajemen anggota, dan melihat ringkasan pengeluaran seluruh keluarga.",
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                role: "Admin",
                badge: "bg-blue-100 text-blue-700 border-blue-200",
                border: "border-blue-200",
                bg: "bg-blue-50",
                text: "text-blue-800",
                when: "Dipromosikan oleh Super Admin",
                desc: "Bisa mengelola transaksi, anggaran, hutang, dan laporan. Cocok untuk pasangan atau anggota dewasa yang ikut aktif mengelola keuangan keluarga.",
              },
              {
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                role: "Member",
                badge: "bg-slate-100 text-slate-600 border-slate-200",
                border: "border-slate-200",
                bg: "bg-slate-50",
                text: "text-slate-700",
                when: "Default saat bergabung via undangan",
                desc: "Bisa mencatat transaksi sendiri dan melihat ringkasan keluarga. Tidak bisa akses hutang atau laporan lengkap. Cocok untuk anak atau anggota muda.",
              },
            ] as { icon: React.ReactNode; role: string; badge: string; border: string; bg: string; text: string; when: string; desc: string }[]).map((r) => (
              <div key={r.role} className={`rounded-2xl border ${r.border} ${r.bg} p-6`}>
                <div className="mb-3">{r.icon}</div>
                <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full border mb-3 ${r.badge}`}>{r.role}</span>
                <p className={`text-xs font-semibold mb-2 ${r.text}`}>{r.when}</p>
                <p className={`text-sm leading-relaxed ${r.text}`}>{r.desc}</p>
              </div>
            ))}
          </div>

          {/* Privacy callout */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
                  <h3 className="text-xl font-bold text-[#1E3A5F]">Privasi yang Dihormati</h3>
                </div>
                <p className="text-neutral-600 leading-relaxed mb-4">
                  Setiap transaksi bisa diatur sebagai <strong>Pribadi</strong> atau <strong>Bersama</strong>. Default-nya adalah Pribadi — jadi anggota seperti anak remaja tidak perlu khawatir pengeluarannya dilihat orang tua.
                </p>
                <div className="space-y-2">
                  {[
                    "Pribadi — hanya terlihat oleh yang mencatat",
                    "Bersama — terlihat semua anggota keluarga",
                    "Super Admin hanya melihat total, bukan detail privat",
                    "Data dilindungi Row Level Security (Supabase)",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="text-sm text-neutral-600">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {/* Mock private transaction */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-neutral-500">Transaksi Anak</span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">Pribadi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">Jajan kantin</span>
                    <span className="text-sm font-semibold text-red-500">−Rp 15.000</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Hanya terlihat oleh kamu</p>
                </div>
                {/* Mock shared transaction */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-neutral-500">Transaksi Keluarga</span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">Bersama</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-700">Belanja bulanan</span>
                    <span className="text-sm font-semibold text-red-500">−Rp 850.000</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Terlihat oleh semua anggota</p>
                </div>
                {/* Owner summary */}
                <div className="bg-[#1E3A5F] rounded-xl p-4">
                  <p className="text-[10px] text-blue-300 font-semibold mb-2">Summary untuk Super Admin</p>
                  <div className="space-y-1.5">
                    {[["Ayah", "Rp 1.200.000"],["Ibu", "Rp 980.000"],["Anak", "Rp 250.000"]].map(([name, amt]) => (
                      <div key={name} className="flex justify-between">
                        <span className="text-xs text-blue-200">{name}</span>
                        <span className="text-xs font-semibold text-white">{amt}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-blue-400 mt-2">Detail transaksi pribadi tidak ditampilkan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/guide#role" className="inline-flex items-center gap-2 text-sm font-medium text-[#1E3A5F] hover:underline">
              Baca panduan lengkap sistem peran →
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="cara-kerja" className="py-20 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#27AE60] uppercase tracking-widest mb-3">Mudah Dimulai</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">Mulai dalam 3 langkah</h2>
          </div>

          {/* Desktop: flex dengan connector ANTARA item agar garis nyambung */}
          <div className="hidden md:flex items-start">
            {[
              { step: "01", title: "Daftar & Buat Family", desc: "Buat akun dan siapkan 'rumah digital' keluarga kamu. Beri nama keluarga dan undang anggota lewat kode unik atau link WhatsApp." },
              { step: "02", title: "Tambahkan Dompet", desc: "Daftarkan semua sumber dana — rekening bank, dompet tunai, e-wallet. Masukkan saldo awal masing-masing." },
              { step: "03", title: "Catat & Biarkan AI Bantu", desc: "Foto struk untuk input otomatis, atau catat manual. Tanya Maali AI kapan saja untuk saran dan analisis keuangan keluarga." },
            ].map((s, i) => (
              <>
                <div key={s.step} className="flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-2xl bg-[#1E3A5F] flex items-center justify-center mb-5 relative z-10">
                    <span className="text-white font-bold text-xl">{s.step}</span>
                  </div>
                  <h3 className="font-bold text-[#1E3A5F] text-xl mb-3">{s.title}</h3>
                  <p className="text-neutral-500 leading-relaxed">{s.desc}</p>
                </div>
                {i < 2 && (
                  <div key={`connector-${i}`} className="flex-shrink-0 w-16 flex items-start" style={{ paddingTop: "31px" }}>
                    <div className="w-full h-0.5 bg-neutral-200" />
                  </div>
                )}
              </>
            ))}
          </div>

          {/* Mobile: stack vertikal */}
          <div className="flex flex-col gap-10 md:hidden">
            {[
              { step: "01", title: "Daftar & Buat Family", desc: "Buat akun dan siapkan 'rumah digital' keluarga kamu. Beri nama keluarga dan undang anggota lewat kode unik atau link WhatsApp." },
              { step: "02", title: "Tambahkan Dompet", desc: "Daftarkan semua sumber dana — rekening bank, dompet tunai, e-wallet. Masukkan saldo awal masing-masing." },
              { step: "03", title: "Catat & Biarkan AI Bantu", desc: "Foto struk untuk input otomatis, atau catat manual. Tanya Maali AI kapan saja untuk saran dan analisis keuangan keluarga." },
            ].map((s) => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-14 h-14 flex-shrink-0 rounded-2xl bg-[#1E3A5F] flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{s.step}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-[#1E3A5F] text-lg mb-2">{s.title}</h3>
                  <p className="text-neutral-500 leading-relaxed text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collaboration callout ── */}
      <section className="bg-[#1E3A5F] py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#27AE60] text-sm font-semibold uppercase tracking-widest mb-3">Untuk Seluruh Keluarga</p>
              <h2 className="text-3xl font-bold text-white mb-4">Satu akun, semua anggota keluarga</h2>
              <p className="text-blue-200 leading-relaxed mb-6">
                Suami, istri, atau anak bisa mengakses dan mencatat transaksi dari perangkat masing-masing.
                Admin mengontrol siapa yang bisa mengelola data keuangan keluarga.
              </p>
              <div className="space-y-3">
                {[
                  "Undang anggota keluarga via link WhatsApp atau kode unik",
                  "Role Super Admin, Admin, dan Member",
                  "Semua transaksi tercatat siapa yang melakukan",
                  "Foto struk tersimpan bersama transaksi",
                  "Data terlindungi dengan Row Level Security Supabase",
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#27AE60] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <p className="text-blue-100 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([
                { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: "Multi Member", desc: "Kelola bersama" },
                { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="12" y1="16" x2="12" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>, label: "AI Powered", desc: "Scan & advisor" },
                { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>, label: "Bisa Diinstall", desc: "Layaknya aplikasi" },
                { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: "Aman & Private", desc: "Data terenkripsi" },
              ] as { icon: React.ReactNode; label: string; desc: string }[]).map(c => (
                <div key={c.label} className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="flex justify-center mb-2">{c.icon}</div>
                  <p className="text-white font-semibold text-sm">{c.label}</p>
                  <p className="text-blue-300 text-xs mt-0.5">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-4">
            Mulai kelola keuangan keluarga hari ini
          </h2>
          <p className="text-neutral-500 text-lg mb-8">
            Gratis selamanya untuk 1 family. Tidak perlu kartu kredit.
          </p>
          <Link href="/register" className="inline-block px-8 py-4 rounded-xl bg-[#27AE60] text-white font-bold text-lg hover:bg-[#27AE60]/90 transition-colors">
            Daftar Sekarang — Gratis →
          </Link>
          <p className="mt-4 text-sm text-neutral-400">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[#1E3A5F] font-medium hover:underline">Masuk di sini</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-[#1E3A5F]">Maalify</span>
          </div>
          <p className="text-sm text-neutral-400">© {new Date().getFullYear()} Maalify. Platform keuangan keluarga berbasis AI.</p>
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <Link href="/guide" className="hover:text-neutral-700 transition-colors">Panduan</Link>
            <Link href="/login" className="hover:text-neutral-700 transition-colors">Masuk</Link>
            <Link href="/register" className="hover:text-neutral-700 transition-colors">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
