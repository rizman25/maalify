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
          <span className="text-base">✨</span>
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
          <p className="text-xs text-neutral-400">✓ Gratis selamanya</p>
          <p className="text-xs text-neutral-400">✓ Setup 2 menit</p>
          <p className="text-xs text-neutral-400">✓ Bisa diinstall di HP</p>
          <p className="text-xs text-neutral-400">✓ Tanpa kartu kredit</p>
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
                    <p className="text-[8px] text-neutral-500 mt-0.5">Pengeluaran kamu bulan ini naik 12% dari bulan lalu, terutama di kategori Belanja. Coba kurangi 10% untuk mencapai target tabungan! 💡</p>
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
                <div className="w-14 h-14 rounded-2xl bg-[#27AE60]/20 flex items-center justify-center text-3xl flex-shrink-0">📸</div>
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
                <div className="w-14 h-14 rounded-2xl bg-blue-400/20 flex items-center justify-center text-3xl flex-shrink-0">🤖</div>
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
                  <p className="text-blue-100 text-sm">Bulan ini pemasukanmu <strong className="text-white">Rp 8.200.000</strong> dengan pengeluaran <strong className="text-white">Rp 3.750.000</strong> — kamu surplus <strong className="text-[#27AE60]">Rp 4.450.000</strong> 🎉 Kategori terbesar: Belanja (Rp 1,2 Jt). Saran: alokasikan 20% surplus ke tabungan darurat!</p>
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
            {[
              { emoji: "🏦", title: "Multi Dompet", desc: "Kelola tunai, rekening bank, tabungan, dan e-wallet dalam satu dashboard. Transfer antar dompet dengan mudah." },
              { emoji: "📊", title: "Anggaran Bulanan", desc: "Tetapkan batas pengeluaran per kategori. Notifikasi otomatis saat mendekati atau melampaui batas anggaran." },
              { emoji: "💸", title: "Hutang & Piutang", desc: "Catat hutang dengan sistem cicilan. Pantau sisa, jatuh tempo, dan progres pembayaran secara real-time." },
              { emoji: "🎯", title: "Tabungan & Goals", desc: "Buat target keuangan keluarga — DP rumah, liburan, pendidikan. Tabung bersama dan pantau progressnya." },
              { emoji: "🔄", title: "Transaksi Berulang", desc: "Set gaji, tagihan, atau cicilan sekali. Otomatis tercatat sesuai jadwal bulanan atau mingguan." },
              { emoji: "📈", title: "Laporan & Analisis", desc: "Laporan visual bulanan dan tahunan. Lihat tren, kategori terbesar, dan perbandingan bulan sebelumnya." },
              { emoji: "🔍", title: "Global Search", desc: "Cari transaksi, dompet, atau hutang dalam hitungan detik dengan shortcut Ctrl+K dari mana saja." },
              { emoji: "📲", title: "Install di HP", desc: "Maalify bisa diinstall di smartphone layaknya aplikasi native — buka cepat, bekerja offline untuk navigasi dasar." },
              { emoji: "👨‍👩‍👧‍👦", title: "Multi Anggota Keluarga", desc: "Undang anggota lewat link WhatsApp atau kode unik. Role Admin dan Member dengan hak akses berbeda." },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl border border-neutral-100 p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[#1E3A5F]/5 flex items-center justify-center text-2xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-[#1E3A5F] text-lg mb-2">{f.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="cara-kerja" className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#27AE60] uppercase tracking-widest mb-3">Mudah Dimulai</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F]">Mulai dalam 3 langkah</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Daftar & Buat Household", desc: "Buat akun dan siapkan 'rumah digital' keluarga kamu. Beri nama keluarga dan undang anggota lewat kode unik atau link WhatsApp." },
              { step: "02", title: "Tambahkan Dompet", desc: "Daftarkan semua sumber dana — rekening bank, dompet tunai, e-wallet. Masukkan saldo awal masing-masing." },
              { step: "03", title: "Catat & Biarkan AI Bantu", desc: "Foto struk untuk input otomatis, atau catat manual. Tanya Maali AI kapan saja untuk saran dan analisis keuangan keluarga." },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-neutral-200 to-transparent -translate-x-6 z-0" />
                )}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-[#1E3A5F] flex items-center justify-center mb-5">
                    <span className="text-white font-bold text-xl">{s.step}</span>
                  </div>
                  <h3 className="font-bold text-[#1E3A5F] text-xl mb-3">{s.title}</h3>
                  <p className="text-neutral-500 leading-relaxed">{s.desc}</p>
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
              {[
                { icon: "👨‍👩‍👧‍👦", label: "Multi Member", desc: "Kelola bersama" },
                { icon: "🤖", label: "AI Powered", desc: "Scan & advisor" },
                { icon: "📱", label: "Bisa Diinstall", desc: "Layaknya aplikasi" },
                { icon: "🔐", label: "Aman & Private", desc: "Data terenkripsi" },
              ].map(c => (
                <div key={c.label} className="bg-white/10 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">{c.icon}</div>
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
            Gratis selamanya untuk 1 household. Tidak perlu kartu kredit.
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
            <Link href="/login" className="hover:text-neutral-700 transition-colors">Masuk</Link>
            <Link href="/register" className="hover:text-neutral-700 transition-colors">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
