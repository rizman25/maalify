"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TOC = [
  { id: "tentang",   label: "Tentang Maalify" },
  { id: "role",      label: "Sistem Role & Hak Akses" },
  { id: "dashboard", label: "Dashboard" },
  { id: "transaksi", label: "Transaksi" },
  { id: "berulang",  label: "Transaksi Berulang" },
  { id: "dompet",    label: "Dompet & Transfer" },
  { id: "anggaran",  label: "Anggaran" },
  { id: "tabungan",  label: "Target Tabungan" },
  { id: "hutang",    label: "Hutang & Piutang" },
  { id: "project",   label: "Project Keluarga" },
  { id: "laporan",   label: "Laporan" },
  { id: "pengaturan",label: "Pengaturan" },
  { id: "tips",      label: "Tips & Trik" },
];

/* ─── Primitives ─── */
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    amber:  "bg-amber-100 text-amber-700 border-amber-200",
    blue:   "bg-blue-100 text-blue-700 border-blue-200",
    slate:  "bg-slate-100 text-slate-600 border-slate-200",
    green:  "bg-green-100 text-green-700 border-green-200",
    red:    "bg-red-100 text-red-700 border-red-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <span className={cn("inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border", styles[color] ?? styles.slate)}>
      {children}
    </span>
  );
}

function Section({ id, title, icon, children }: { id: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center text-[#1E3A5F] flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-neutral-800">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-[#1E3A5F] inline-block" />
        {title}
      </h3>
      <div className="space-y-2 text-neutral-500">{children}</div>
    </div>
  );
}

function InfoBox({ type = "info", children }: { type?: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = {
    info:    { wrap: "bg-blue-50 border-blue-200 text-blue-800",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
    warning: { wrap: "bg-amber-50 border-amber-200 text-amber-800", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    tip:     { wrap: "bg-green-50 border-green-200 text-green-800", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg> },
  };
  const s = styles[type];
  return (
    <div className={cn("flex gap-3 border rounded-xl px-4 py-3 text-sm", s.wrap)}>
      <span className="flex-shrink-0 mt-0.5">{s.icon}</span>
      <div>{children}</div>
    </div>
  );
}

function RoleRow({ feature, sa, admin, member }: { feature: string; sa: boolean | string; admin: boolean | string; member: boolean | string }) {
  const cell = (v: boolean | string) =>
    typeof v === "string"
      ? <span className="text-xs text-neutral-500">{v}</span>
      : v
        ? <span className="text-green-600 font-bold"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline"}}><polyline points="20 6 9 17 4 12"/></svg></span>
        : <span className="text-neutral-300">—</span>;
  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="py-3.5 pl-5 pr-4 text-sm text-neutral-700">{feature}</td>
      <td className="py-3.5 px-5 text-center">{cell(sa)}</td>
      <td className="py-3.5 px-5 text-center">{cell(admin)}</td>
      <td className="py-3.5 px-5 text-center">{cell(member)}</td>
    </tr>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 ml-1">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1E3A5F] text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
          <span className="text-neutral-500">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function BulletList({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-1.5 ml-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1E3A5F] mt-2" />
          <span className="text-neutral-500">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Main Component ─── */
export default function PanduanPublicClient() {
  const [active, setActive] = useState("tentang");
  const [mobileOpen, setMobileOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    TOC.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-[#1E3A5F] text-lg tracking-tight">Maalify</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <Link href="/#fitur" className="hover:text-[#1E3A5F] transition-colors">Fitur</Link>
            <Link href="/#cara-kerja" className="hover:text-[#1E3A5F] transition-colors">Cara Kerja</Link>
            <Link href="/guide" className="text-[#1E3A5F] font-semibold">Panduan</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/guide/print"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-[#1E3A5F] border border-neutral-200 px-3 py-1.5 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Cetak / PDF
            </Link>
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
      <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0F2640] py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold mb-5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Dokumentasi Lengkap
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Panduan Penggunaan Maalify</h1>
          <p className="text-blue-300 text-base max-w-xl">
            Manual lengkap semua fitur — dari pencatatan transaksi, manajemen anggaran, hingga sistem peran dan privasi anggota keluarga.
          </p>

          {/* Mobile TOC toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mt-6 flex items-center gap-2 text-sm text-white/80 border border-white/20 px-4 py-2 rounded-lg lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            Daftar Isi
          </button>

          {/* Mobile TOC dropdown */}
          {mobileOpen && (
            <div className="mt-3 bg-white rounded-xl border border-neutral-200 p-3 lg:hidden max-w-xs">
              {TOC.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-10 items-start">

          {/* ── Sticky TOC (desktop) ── */}
          <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-24">
            <p className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase mb-3">Daftar Isi</p>
            <nav className="space-y-0.5">
              {TOC.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={cn(
                    "w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                    active === id
                      ? "bg-[#1E3A5F] text-white font-medium"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="mt-6 p-4 bg-[#27AE60]/5 border border-[#27AE60]/20 rounded-xl">
              <p className="text-xs font-semibold text-[#1E3A5F] mb-2">Siap mencoba?</p>
              <Link href="/register" className="block text-center text-xs font-semibold px-3 py-2 rounded-lg bg-[#1E3A5F] text-white hover:bg-[#1E3A5F]/90 transition-colors">
                Daftar Gratis →
              </Link>
            </div>
          </aside>

          {/* ── Content ── */}
          <div className="flex-1 min-w-0 space-y-14">

            {/* ── TENTANG ── */}
            <Section id="tentang" title="Tentang Maalify"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}>
              <p>
                <strong>Maalify</strong> adalah aplikasi pencatatan keuangan keluarga berbasis web yang membantu seluruh anggota keluarga mengelola pemasukan, pengeluaran, tabungan, anggaran, hutang, dan project keuangan bersama dalam satu platform terpadu.
              </p>
              <p>
                Nama <em>Maalify</em> berasal dari kata Arab <strong>مال</strong> (māl) yang berarti harta atau kekayaan. Dibangun dengan prinsip transparansi dan kolaborasi — namun tetap menghormati privasi tiap anggota.
              </p>
              <SubSection title="Fitur Utama">
                <BulletList items={[
                  <><strong>Dashboard Real-time</strong> — Ringkasan keuangan bulanan, tren 6 bulan, dan insight otomatis</>,
                  <><strong>Pencatatan Transaksi</strong> — Catat pemasukan dan pengeluaran dengan kategori, visibilitas pribadi/bersama</>,
                  <><strong>Scan Struk AI</strong> — Foto struk belanja, nominal & merchant terbaca otomatis</>,
                  <><strong>Maali AI Assistant</strong> — Tanya kondisi keuangan keluarga kapan saja</>,
                  <><strong>Transaksi Berulang</strong> — Otomatisasi tagihan rutin seperti listrik, internet, cicilan</>,
                  <><strong>Multi Dompet</strong> — Kelola rekening bank, dompet tunai, e-wallet sekaligus</>,
                  <><strong>Anggaran Bulanan</strong> — Buat batas pengeluaran per kategori dan pantau realisasinya</>,
                  <><strong>Target Tabungan</strong> — Tentukan tujuan menabung dengan progress bar dan top-up</>,
                  <><strong>Hutang & Piutang</strong> — Lacak kewajiban finansial dengan sistem cicilan</>,
                  <><strong>Project Keluarga</strong> — Rencanakan dana untuk proyek besar bersama</>,
                  <><strong>Laporan & Ekspor</strong> — Laporan PDF dan Excel untuk analisis mendalam</>,
                ]} />
              </SubSection>
              <InfoBox type="info">
                Maalify berjalan sepenuhnya di browser — tidak perlu instal aplikasi tambahan. Bisa diakses dari HP, tablet, maupun komputer. Tersedia juga mode PWA untuk instalasi seperti aplikasi native.
              </InfoBox>
            </Section>

            {/* ── ROLE ── */}
            <Section id="role" title="Sistem Role & Hak Akses"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}>
              <p>
                Maalify menggunakan sistem tiga tingkat peran (<em>role</em>) untuk mengatur siapa yang bisa melihat dan mengubah data keuangan keluarga. Setiap family memiliki minimal satu <Badge color="amber">Super Admin</Badge>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <Badge color="amber">Super Admin</Badge>
                  </div>
                  <p className="text-xs text-amber-800">Pemilik family. Memiliki akses penuh ke seluruh fitur termasuk manajemen anggota, laporan, dan data sensitif.</p>
                </div>
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <Badge color="blue">Admin</Badge>
                  </div>
                  <p className="text-xs text-blue-800">Dapat mengelola transaksi, anggaran, hutang, dan laporan. Tidak bisa mengubah keanggotaan atau pengaturan family.</p>
                </div>
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <Badge color="slate">Member</Badge>
                  </div>
                  <p className="text-xs text-slate-700">Anggota biasa. Bisa mencatat transaksi, melihat tabungan, anggaran, dan project. Tidak bisa mengakses data hutang atau laporan penuh.</p>
                </div>
              </div>

              <SubSection title="Bagaimana Role Ditetapkan?">
                <div className="space-y-3">
                  <div className="flex gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-amber-800 text-sm">Super Admin</span>
                        <Badge color="amber">Otomatis saat daftar</Badge>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Diberikan secara otomatis kepada orang yang <strong>pertama kali membuat family</strong> saat mendaftar. Satu family hanya punya satu Super Admin — biasanya kepala keluarga atau orang yang pertama mengajak anggota lain.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-blue-800 text-sm">Admin</span>
                        <Badge color="blue">Dipromosikan oleh Super Admin</Badge>
                      </div>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        Super Admin bisa <strong>mempromosikan Member menjadi Admin</strong> kapan saja melalui Pengaturan → tab Family → ubah role. Cocok untuk pasangan atau anggota dewasa yang ikut mengelola keuangan secara aktif.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-700 text-sm">Member</span>
                        <Badge color="slate">Default saat bergabung</Badge>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Setiap orang yang <strong>bergabung via kode undangan atau link WhatsApp</strong> otomatis masuk sebagai Member. Cocok untuk anak remaja yang hanya perlu mencatat pengeluaran pribadi.
                      </p>
                    </div>
                  </div>
                </div>
              </SubSection>

              <SubSection title="Sistem Privasi Bersama / Pribadi">
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                    <div>
                      <p className="font-semibold text-neutral-800 text-sm mb-1">Bersama vs Pribadi di Setiap Fitur</p>
                      <ul className="space-y-1.5 text-xs text-neutral-600 mt-2">
                        <li className="flex items-start gap-2"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1E3A5F] mt-1.5" /><span><strong>Dompet</strong> — Pilih Bersama (semua anggota melihat) atau Pribadi (hanya pemilik) saat membuat dompet. Transaksi di dompet Pribadi otomatis hanya terlihat oleh pemiliknya.</span></li>
                        <li className="flex items-start gap-2"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1E3A5F] mt-1.5" /><span><strong>Anggaran</strong> — Toggle kunci di form anggaran untuk memilih Bersama atau Pribadi.</span></li>
                        <li className="flex items-start gap-2"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1E3A5F] mt-1.5" /><span><strong>Transaksi Berulang</strong> — Pilih Bersama atau Pribadi saat membuat berulang baru.</span></li>
                      </ul>
                      <p className="text-xs text-neutral-500 mt-2">
                        <strong>Super Admin</strong> selalu dapat melihat semua data termasuk yang Pribadi milik anggota lain — untuk keperluan rekonsiliasi dan laporan keluarga.
                      </p>
                    </div>
                  </div>
                </div>
              </SubSection>

              <SubSection title="Cara Mengundang Anggota Baru">
                <StepList steps={[
                  "Buka Pengaturan → tab Family",
                  "Salin Kode Undangan atau klik tombol \"Undang via WhatsApp\"",
                  "Bagikan kode/link ke anggota keluarga",
                  "Anggota mendaftar atau login, lalu masukkan kode undangan",
                  "Anggota langsung bergabung sebagai Member",
                  "Jika perlu, Super Admin bisa ubah role-nya menjadi Admin dari daftar anggota",
                ]} />
              </SubSection>

              <SubSection title="Tabel Hak Akses Lengkap">
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="text-left py-4 pl-5 pr-4 font-semibold text-neutral-700">Fitur / Aksi</th>
                        <th className="py-4 px-5 text-center font-semibold text-amber-600">Super Admin</th>
                        <th className="py-4 px-5 text-center font-semibold text-blue-600">Admin</th>
                        <th className="py-4 px-5 text-center font-semibold text-slate-500">Member</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Dashboard</td></tr>
                      <RoleRow feature="Lihat ringkasan keuangan keluarga" sa={true} admin={true} member="Data sendiri" />
                      <RoleRow feature="Lihat hutang jatuh tempo" sa={true} admin={true} member={false} />
                      <RoleRow feature="Lihat pengeluaran per anggota" sa={true} admin={false} member={false} />

                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Transaksi</td></tr>
                      <RoleRow feature="Lihat semua transaksi" sa={true} admin={true} member="Transaksi sendiri" />
                      <RoleRow feature="Tambah transaksi" sa={true} admin={true} member={true} />
                      <RoleRow feature="Atur visibilitas (Pribadi/Bersama)" sa={true} admin={true} member={true} />
                      <RoleRow feature="Edit / hapus transaksi sendiri" sa={true} admin={true} member={true} />
                      <RoleRow feature="Edit / hapus transaksi orang lain" sa={true} admin={true} member={false} />

                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Transaksi Berulang</td></tr>
                      <RoleRow feature="Lihat berulang Bersama + milik sendiri" sa={true} admin="Bersama + milik sendiri" member={false} />
                      <RoleRow feature="Lihat semua berulang (termasuk Pribadi anggota lain)" sa={true} admin={false} member={false} />
                      <RoleRow feature="Tambah / edit / hapus berulang" sa={true} admin={true} member={false} />

                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Dompet</td></tr>
                      <RoleRow feature="Lihat dompet Bersama + milik sendiri" sa={true} admin="Bersama + milik sendiri" member="Bersama + milik sendiri" />
                      <RoleRow feature="Lihat semua dompet (termasuk Pribadi anggota lain)" sa={true} admin={false} member={false} />
                      <RoleRow feature="Tambah / edit / hapus dompet" sa={true} admin={true} member={false} />
                      <RoleRow feature="Transfer antar dompet" sa={true} admin={true} member={false} />

                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Anggaran</td></tr>
                      <RoleRow feature="Lihat anggaran Bersama + milik sendiri" sa={true} admin="Bersama + milik sendiri" member="Bersama + milik sendiri" />
                      <RoleRow feature="Lihat semua anggaran (termasuk Pribadi anggota lain)" sa={true} admin={false} member={false} />
                      <RoleRow feature="Buat / edit / hapus anggaran" sa={true} admin={true} member={false} />

                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Tabungan</td></tr>
                      <RoleRow feature="Lihat target tabungan" sa={true} admin={true} member={true} />
                      <RoleRow feature="Buat / edit / hapus target" sa={true} admin={true} member={false} />
                      <RoleRow feature="Top-up / tarik tabungan" sa={true} admin={true} member={false} />

                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Hutang & Piutang</td></tr>
                      <RoleRow feature="Lihat data hutang" sa={true} admin={true} member={false} />
                      <RoleRow feature="Tambah / edit / hapus hutang" sa={true} admin={true} member={false} />
                      <RoleRow feature="Tandai lunas" sa={true} admin={true} member={false} />

                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Laporan</td></tr>
                      <RoleRow feature="Akses halaman laporan" sa={true} admin={true} member={false} />
                      <RoleRow feature="Export PDF / Excel" sa={true} admin={true} member={false} />

                      <tr className="bg-neutral-50/80"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Pengaturan</td></tr>
                      <RoleRow feature="Edit profil sendiri" sa={true} admin={true} member={true} />
                      <RoleRow feature="Undang anggota baru" sa={true} admin={false} member={false} />
                      <RoleRow feature="Ubah role anggota" sa={true} admin={false} member={false} />
                      <RoleRow feature="Keluarkan anggota" sa={true} admin={false} member={false} />
                      <RoleRow feature="Edit nama family" sa={true} admin={false} member={false} />
                    </tbody>
                  </table>
                </div>
              </SubSection>

              <InfoBox type="warning">
                Hanya ada satu <strong>Super Admin</strong> per family. Role ini otomatis diberikan ke pembuat family dan tidak bisa dipindahkan. Untuk mengangkat asisten pengelola, gunakan role <strong>Admin</strong>.
              </InfoBox>
            </Section>

            {/* ── DASHBOARD ── */}
            <Section id="dashboard" title="Dashboard"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}>
              <p>Dashboard adalah halaman utama yang menampilkan <strong>ringkasan keuangan bulan berjalan</strong> secara real-time. Data diperbarui otomatis setiap kali halaman dibuka.</p>

              <SubSection title="Kartu Ringkasan (4 Kartu Atas)">
                <BulletList items={[
                  <><strong>Total Saldo</strong> — Jumlah saldo dari semua dompet aktif family</>,
                  <><strong>Pemasukan Bulan Ini</strong> — Total pemasukan bulan berjalan + persentase perubahan dari bulan lalu</>,
                  <><strong>Pengeluaran Bulan Ini</strong> — Total pengeluaran bulan berjalan + perbandingan bulan lalu</>,
                  <><strong>Tabungan Bersih</strong> — Selisih pemasukan dikurangi pengeluaran. Hijau = surplus, merah = defisit</>,
                ]} />
              </SubSection>

              <SubSection title="Tren Pemasukan & Pengeluaran">
                <p>Grafik batang yang menampilkan perbandingan pemasukan (hijau) dan pengeluaran (merah) selama <strong>6 bulan terakhir</strong>. Gunakan untuk melihat pola keuangan dan mengidentifikasi bulan dengan pengeluaran tinggi.</p>
              </SubSection>

              <SubSection title="Pengeluaran per Kategori">
                <p>Grafik donut yang memecah total pengeluaran bulan ini ke dalam kategori-kategori. Hover pada irisan untuk melihat detail jumlah dan persentase.</p>
              </SubSection>

              <SubSection title="Anggaran Bulan Ini">
                <BulletList items={[
                  <><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1" /> Normal — penggunaan di bawah 80%</>,
                  <><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1" /><strong>Hampir habis</strong> — 80–100%</>,
                  <><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1" /><strong>Melebihi!</strong> — sudah melampaui anggaran</>,
                ]} />
              </SubSection>

              <SubSection title="Pengeluaran per Anggota (Super Admin)">
                <p>Widget khusus yang hanya terlihat oleh Super Admin, menampilkan total pengeluaran setiap anggota keluarga bulan ini. Detail transaksi pribadi anggota tetap tersembunyi — hanya totalnya yang terlihat.</p>
              </SubSection>

              <SubSection title="Hutang Jatuh Tempo (Admin/Super Admin)">
                <p>Daftar 5 hutang aktif yang paling dekat jatuh temponya. Peringatan kuning muncul jika ada hutang yang jatuh tempo dalam <strong>5 hari ke depan</strong>.</p>
              </SubSection>

              <SubSection title="Target Tabungan">
                <p>Menampilkan hingga 4 savings goal yang sedang aktif dengan progress bar. Klik <em>"Lihat semua →"</em> untuk masuk ke halaman Tabungan.</p>
              </SubSection>
            </Section>

            {/* ── TRANSAKSI ── */}
            <Section id="transaksi" title="Transaksi"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}>
              <p>Halaman Transaksi adalah inti dari Maalify — tempat mencatat semua arus kas keluarga. Setiap transaksi dikategorikan, dikaitkan ke dompet, dan dilacak berdasarkan tanggal.</p>

              <SubSection title="Cara Menambah Transaksi">
                <StepList steps={[
                  "Klik tombol \"+ Tambah Transaksi\" di sudut kanan atas",
                  "Pilih jenis: Pemasukan atau Pengeluaran",
                  "Isi nominal (tanpa titik/koma — sistem otomatis memformat)",
                  "Pilih kategori yang sesuai",
                  "Pilih dompet sumber/tujuan dana",
                  "Isi deskripsi singkat (contoh: \"Gaji Juli\", \"Makan siang\")",
                  "Atur visibilitas: Pribadi (hanya kamu) atau Bersama (semua anggota)",
                  "Atur tanggal transaksi (default hari ini)",
                  "Klik Simpan",
                ]} />
              </SubSection>

              <SubSection title="Visibilitas Transaksi">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50">
                    <p className="font-semibold text-neutral-800 text-sm mb-1">Pribadi (Default)</p>
                    <p className="text-xs text-neutral-500">Hanya kamu yang bisa melihat. Anggota lain tidak tahu transaksi ini ada. Super Admin hanya melihat totalnya, bukan detailnya.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50">
                    <p className="font-semibold text-neutral-800 text-sm mb-1">Bersama</p>
                    <p className="text-xs text-neutral-500">Terlihat oleh semua anggota family. Gunakan untuk pengeluaran keluarga bersama seperti belanja bulanan atau tagihan rumah.</p>
                  </div>
                </div>
              </SubSection>

              <SubSection title="Filter & Pencarian">
                <BulletList items={[
                  <><strong>Filter bulan/tahun</strong> — Navigasi panah kiri/kanan</>,
                  <><strong>Filter tipe</strong> — Semua, Pemasukan, atau Pengeluaran</>,
                  <><strong>Filter kategori</strong> — Fokus pada satu kategori pengeluaran</>,
                  <><strong>Pencarian teks</strong> — Cari berdasarkan deskripsi transaksi</>,
                ]} />
              </SubSection>

              <SubSection title="Edit & Hapus Transaksi">
                <BulletList items={[
                  "Klik ikon pensil di baris transaksi untuk membuka form edit",
                  "Klik ikon tempat sampah untuk menghapus — akan muncul konfirmasi",
                  "Member hanya bisa edit/hapus transaksi yang dibuat sendiri",
                  "Admin dan Super Admin bisa edit/hapus transaksi siapapun",
                ]} />
              </SubSection>

              <InfoBox type="tip">
                Gunakan deskripsi yang konsisten agar mudah dicari. Contoh: selalu awali pengeluaran makan dengan kata "Makan" untuk memudahkan pencarian.
              </InfoBox>
            </Section>

            {/* ── BERULANG ── */}
            <Section id="berulang" title="Transaksi Berulang"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>}>
              <p>Transaksi Berulang (<em>recurring transactions</em>) adalah transaksi yang terjadi otomatis pada interval tertentu — cocok untuk tagihan rutin seperti listrik, air, internet, gaji, atau cicilan.</p>

              <SubSection title="Cara Membuat Transaksi Berulang">
                <StepList steps={[
                  "Buka menu Berulang di sidebar",
                  "Klik \"+ Tambah Berulang\"",
                  "Isi nominal, kategori, dompet, dan deskripsi",
                  "Pilih Visibilitas: Bersama (semua anggota bisa lihat) atau Pribadi (hanya kamu dan Super Admin)",
                  "Pilih frekuensi: Harian, Mingguan, Bulanan, atau Tahunan",
                  "Tentukan tanggal mulai",
                  "Pilih apakah ada tanggal berakhir atau tidak",
                  "Klik Simpan",
                ]} />
              </SubSection>

              <SubSection title="Visibilitas Transaksi Berulang">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50">
                    <p className="font-semibold text-neutral-800 text-sm mb-1">Bersama</p>
                    <p className="text-xs text-neutral-500">Terlihat oleh semua anggota. Cocok untuk tagihan rumah tangga bersama seperti listrik, air, internet, atau cicilan keluarga.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="font-semibold text-amber-800 text-sm mb-1">🔒 Pribadi</p>
                    <p className="text-xs text-amber-700">Hanya terlihat oleh kamu dan Super Admin. Cocok untuk langganan personal, cicilan pribadi, atau tagihan yang tidak perlu diketahui anggota lain.</p>
                  </div>
                </div>
              </SubSection>

              <SubSection title="Cara Kerja Otomatisasi">
                <BulletList items={[
                  "Sistem memeriksa transaksi berulang yang jatuh tempo setiap kali seseorang membuka dashboard",
                  "Transaksi dibuat otomatis di latar belakang tanpa interaksi manual",
                  "Transaksi yang sudah dibuat muncul di halaman Transaksi seperti transaksi biasa",
                  "Jika tidak ada yang membuka dashboard pada hari H, transaksi tetap dibuat saat ada yang masuk berikutnya",
                ]} />
              </SubSection>

              <SubSection title="Menonaktifkan & Menghapus">
                <BulletList items={[
                  "Klik tombol pause untuk menonaktifkan sementara tanpa menghapus",
                  "Klik tombol hapus untuk menghentikan permanen — transaksi yang sudah dibuat tidak ikut terhapus",
                ]} />
              </SubSection>

              <InfoBox type="tip">
                Ideal untuk: gaji bulanan, tagihan listrik/air/internet, cicilan KPR, iuran sekolah, langganan streaming.
              </InfoBox>
            </Section>

            {/* ── DOMPET ── */}
            <Section id="dompet" title="Dompet & Transfer"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>}>
              <p>Dompet mewakili tempat penyimpanan uang — rekening bank, dompet fisik, e-wallet (OVO, GoPay, Dana), atau aset kas lainnya. Setiap transaksi dikaitkan ke satu dompet sehingga saldo selalu akurat.</p>

              <SubSection title="Jenis Dompet">
                <BulletList items={[
                  <><strong>Bank</strong> — Rekening tabungan atau giro</>,
                  <><strong>Tunai</strong> — Uang cash yang dipegang langsung</>,
                  <><strong>E-Wallet</strong> — OVO, GoPay, Dana, ShopeePay, dll.</>,
                  <><strong>Investasi</strong> — Rekening investasi, reksa dana, saham</>,
                  <><strong>Lainnya</strong> — Kategori fleksibel untuk jenis lain</>,
                ]} />
              </SubSection>

              <SubSection title="Cara Menambah Dompet">
                <StepList steps={[
                  "Buka halaman Dompet dari sidebar",
                  "Klik \"+ Tambah Dompet\"",
                  "Isi nama dompet (contoh: \"BCA Tabungan\", \"GoPay\")",
                  "Pilih jenis dompet",
                  "Isi saldo awal (saldo saat ini)",
                  "Pilih visibilitas: Bersama (terlihat semua anggota) atau Pribadi (hanya kamu dan Super Admin). Default: Bersama",
                  "Pilih warna identifikasi",
                  "Klik Simpan",
                ]} />
              </SubSection>

              <SubSection title="Dompet Bersama vs Pribadi">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50">
                    <p className="font-semibold text-neutral-800 text-sm mb-1">Bersama (Default)</p>
                    <p className="text-xs text-neutral-500">Terlihat oleh semua anggota family. Cocok untuk rekening keluarga, kas rumah tangga, atau dompet pengeluaran bersama.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="font-semibold text-amber-800 text-sm mb-1">🔒 Pribadi</p>
                    <p className="text-xs text-amber-700">Hanya terlihat oleh pemilik dan Super Admin. Cocok untuk rekening tabungan personal atau dompet yang tidak ingin dibagikan ke seluruh anggota.</p>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-2">Transaksi yang dicatat ke dompet Pribadi secara otomatis hanya terlihat oleh pemiliknya — tidak perlu pengaturan tambahan per transaksi.</p>
              </SubSection>

              <SubSection title="Transfer Antar Dompet">
                <p>Memindahkan saldo dari satu dompet ke dompet lain tanpa mempengaruhi laporan pemasukan/pengeluaran.</p>
                <StepList steps={[
                  "Di halaman Dompet, klik tombol \"Transfer\"",
                  "Pilih dompet asal dan dompet tujuan",
                  "Isi nominal transfer",
                  "Tambahkan catatan opsional",
                  "Klik Transfer — saldo kedua dompet diperbarui otomatis",
                ]} />
              </SubSection>

              <InfoBox type="warning">
                Saldo dompet diperbarui otomatis saat transaksi ditambah, diedit, atau dihapus. Jangan edit saldo secara manual kecuali untuk koreksi saldo awal.
              </InfoBox>
            </Section>

            {/* ── ANGGARAN ── */}
            <Section id="anggaran" title="Anggaran"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}>
              <p>Anggaran memungkinkan Anda menetapkan batas pengeluaran per kategori untuk setiap bulan. Maalify memantau realisasi dan memberi peringatan saat mendekati atau melewati batas.</p>

              <SubSection title="Cara Membuat Anggaran">
                <StepList steps={[
                  "Buka halaman Anggaran",
                  "Klik \"+ Tambah Anggaran\"",
                  "Pilih bulan dan tahun yang dituju",
                  "Pilih kategori (hanya kategori pengeluaran tersedia)",
                  "Isi nominal batas anggaran",
                  "Pilih Visibilitas: klik ikon kunci di form untuk memilih Bersama atau Pribadi",
                  "Klik Simpan",
                ]} />
              </SubSection>

              <SubSection title="Anggaran Pribadi vs Bersama">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50">
                    <p className="font-semibold text-neutral-800 text-sm mb-1">Bersama (Default)</p>
                    <p className="text-xs text-neutral-500">Terlihat oleh semua anggota. Cocok untuk anggaran keluarga seperti makan, transportasi, atau tagihan rumah yang dikelola bersama.</p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                    <p className="font-semibold text-amber-800 text-sm mb-1">🔒 Pribadi</p>
                    <p className="text-xs text-amber-700">Hanya terlihat oleh pemilik anggaran dan Super Admin. Cocok untuk anggaran personal seperti pakaian, hobi, atau kebutuhan individu.</p>
                  </div>
                </div>
              </SubSection>

              <SubSection title="Memahami Progress Bar Anggaran">
                <BulletList items={[
                  "Progress bar menunjukkan persentase penggunaan dari batas anggaran",
                  "Angka di sebelah kanan: realisasi / batas (contoh: Rp 800.000 / Rp 1.000.000)",
                  "Badge \"Hampir habis\" muncul saat penggunaan ≥ 80%",
                  "Badge \"Melebihi!\" muncul saat pengeluaran sudah melampaui batas",
                ]} />
              </SubSection>

              <SubSection title="Salin Anggaran Bulan Sebelumnya">
                <p>Tombol <strong>"Salin dari bulan lalu"</strong> menyalin semua anggaran bulan sebelumnya ke bulan berjalan — praktis untuk anggaran yang tidak banyak berubah tiap bulan.</p>
              </SubSection>

              <InfoBox type="tip">
                Mulai dengan anggaran 3–5 kategori terbesar terlebih dahulu (makanan, transportasi, tagihan). Tambahkan kategori lain setelah terbiasa memantau.
              </InfoBox>
            </Section>

            {/* ── TABUNGAN ── */}
            <Section id="tabungan" title="Target Tabungan"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12l4-4"/></svg>}>
              <p>Fitur Target Tabungan (<em>Savings Goals</em>) membantu keluarga menabung untuk tujuan tertentu — dana darurat, liburan, beli gadget, uang muka rumah — dengan progress tracking yang jelas.</p>

              <SubSection title="Cara Membuat Target Tabungan">
                <StepList steps={[
                  "Buka halaman Tabungan",
                  "Klik \"+ Target Baru\"",
                  "Isi nama target (contoh: \"Dana Darurat\", \"Liburan Bali\")",
                  "Pilih ikon yang mewakili tujuan",
                  "Pilih warna identifikasi",
                  "Isi nominal target",
                  "Tentukan deadline opsional",
                  "Klik Simpan",
                ]} />
              </SubSection>

              <SubSection title="Menambah Tabungan (Top-up)">
                <StepList steps={[
                  "Klik tombol \"Top-up\" pada kartu goal",
                  "Pilih dompet sumber dana",
                  "Isi nominal yang ingin ditabungkan",
                  "Tambahkan catatan opsional",
                  "Klik Simpan — saldo dompet berkurang, saldo goal bertambah",
                ]} />
              </SubSection>

              <SubSection title="Status Goal">
                <BulletList items={[
                  <><Badge color="blue">Aktif</Badge> — Goal sedang berjalan, belum tercapai</>,
                  <><Badge color="green">Selesai</Badge> — Saldo sudah mencapai atau melebihi target. Sistem otomatis menandai selesai</>,
                ]} />
              </SubSection>

              <InfoBox type="tip">
                Buat goal "Dana Darurat" sebesar 3–6 bulan pengeluaran rutin sebagai prioritas pertama sebelum menabung untuk tujuan lain.
              </InfoBox>
            </Section>

            {/* ── HUTANG ── */}
            <Section id="hutang" title="Hutang & Piutang"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}>
              <p>Fitur Hutang & Piutang membantu melacak kewajiban finansial yang belum diselesaikan — uang yang harus dibayar (<strong>Hutang</strong>) maupun yang akan diterima (<strong>Piutang</strong>).</p>
              <InfoBox type="warning">Fitur ini hanya dapat diakses oleh <Badge color="amber">Super Admin</Badge> dan <Badge color="blue">Admin</Badge>.</InfoBox>

              <SubSection title="Cara Menambah Hutang / Piutang">
                <StepList steps={[
                  "Buka halaman Hutang & Piutang",
                  "Klik \"+ Tambah\" dan pilih jenis: Hutang atau Piutang",
                  "Isi nama pihak terkait dan nominal total",
                  "Tentukan tanggal jatuh tempo",
                  "Tambahkan catatan/deskripsi",
                  "Klik Simpan",
                ]} />
              </SubSection>

              <SubSection title="Pencicilan (Partial Payment)">
                <StepList steps={[
                  "Klik ikon detail pada hutang yang ingin dicatat cicilan",
                  "Klik \"Catat Pembayaran\"",
                  "Isi nominal cicilan yang dibayarkan",
                  "Sistem otomatis menghitung sisa hutang",
                  "Jika sisa = 0, status otomatis berubah menjadi Lunas",
                ]} />
              </SubSection>

              <SubSection title="Status Hutang">
                <BulletList items={[
                  <><Badge color="blue">Aktif</Badge> — Masih ada sisa yang belum dibayar</>,
                  <><Badge color="green">Lunas</Badge> — Sudah dibayar penuh</>,
                  <><Badge color="red">Jatuh Tempo</Badge> — Melewati deadline dan belum lunas</>,
                ]} />
              </SubSection>

              <InfoBox type="tip">
                Selalu set tanggal jatuh tempo agar peringatan di dashboard muncul 5 hari sebelum deadline.
              </InfoBox>
            </Section>

            {/* ── PROJECT ── */}
            <Section id="project" title="Project Keluarga"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}>
              <p>Project Keluarga adalah fitur perencanaan dana untuk proyek besar yang membutuhkan koordinasi anggaran lebih kompleks — renovasi rumah, pernikahan, perjalanan keluarga, atau pembelian aset besar.</p>

              <SubSection title="Perbedaan Project vs Tabungan">
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="text-left py-4 px-5 font-semibold text-neutral-700">Aspek</th>
                        <th className="py-4 px-5 text-center font-semibold text-purple-600">Target Tabungan</th>
                        <th className="py-4 px-5 text-center font-semibold text-blue-600">Project</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-neutral-100"><td className="py-3.5 px-5">Fokus</td><td className="py-3.5 px-5 text-center text-neutral-500">Menabung uang</td><td className="py-3.5 px-5 text-center text-neutral-500">Merencanakan pengerjaan</td></tr>
                      <tr className="border-t border-neutral-100"><td className="py-3.5 px-5">Kompleksitas</td><td className="py-3.5 px-5 text-center text-neutral-500">Sederhana</td><td className="py-3.5 px-5 text-center text-neutral-500">Multi-item anggaran</td></tr>
                      <tr className="border-t border-neutral-100"><td className="py-3.5 px-5">Kolaborasi</td><td className="py-3.5 px-5 text-center text-neutral-500">Individual/keluarga</td><td className="py-3.5 px-5 text-center text-neutral-500">Tim keluarga</td></tr>
                    </tbody>
                  </table>
                </div>
              </SubSection>

              <SubSection title="Cara Membuat Project">
                <StepList steps={[
                  "Buka halaman Project Keluarga",
                  "Klik \"+ Buat Project\"",
                  "Isi nama project dan deskripsi",
                  "Tentukan total anggaran yang dibutuhkan",
                  "Atur deadline project",
                  "Tambahkan item-item rincian biaya",
                  "Klik Simpan",
                ]} />
              </SubSection>
            </Section>

            {/* ── LAPORAN ── */}
            <Section id="laporan" title="Laporan"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>}>
              <p>Halaman Laporan menyajikan analisis keuangan tahunan dan memungkinkan ekspor data ke PDF atau Excel. Hanya tersedia untuk <Badge color="amber">Super Admin</Badge> dan <Badge color="blue">Admin</Badge>.</p>

              <SubSection title="Isi Laporan">
                <BulletList items={[
                  <><strong>Ringkasan Tahunan</strong> — Total pemasukan, pengeluaran, tabungan bersih, dan total aset</>,
                  <><strong>Tren Bulanan</strong> — Grafik dan tabel pemasukan/pengeluaran per bulan</>,
                  <><strong>Breakdown Kategori</strong> — Pengeluaran dan pemasukan dikelompokkan per kategori</>,
                ]} />
              </SubSection>

              <SubSection title="Ekspor Data">
                <BulletList items={[
                  <><strong>Export PDF</strong> — Laporan terformat siap cetak, cocok untuk dokumentasi atau arsip</>,
                  <><strong>Export CSV/Excel</strong> — Data mentah untuk analisis lanjutan di spreadsheet</>,
                  <><strong>Scope Bersama / Pribadi</strong> — Pilih ekspor dari dompet <em>Bersama</em> saja (kas rumah tangga) atau dari dompet <em>Pribadi</em> Anda saja (keuangan personal)</>,
                  "Gunakan filter rentang waktu (7 hari, 1 bulan, 3 bulan, 6 bulan, 1 tahun) untuk membatasi periode laporan",
                ]} />
              </SubSection>

              <SubSection title="Ringkasan Bersama vs Pribadi">
                <p>Halaman laporan menampilkan ringkasan terpisah untuk data <strong>Bersama</strong> (dompet keluarga) dan <strong>Pribadi</strong> (dompet personal), sehingga mudah memantau kondisi kas bersama versus keuangan individu.</p>
              </SubSection>
            </Section>

            {/* ── PENGATURAN ── */}
            <Section id="pengaturan" title="Pengaturan"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}>
              <p>Halaman Pengaturan memungkinkan setiap pengguna mengelola profil pribadi. Super Admin mendapat akses tambahan untuk mengatur family dan keanggotaan.</p>

              <SubSection title="Profil Pengguna">
                <BulletList items={[
                  <><strong>Foto Profil</strong> — Upload foto avatar (maks 2MB, format JPG/PNG/WebP)</>,
                  <><strong>Nama Lengkap</strong> — Nama yang ditampilkan di seluruh aplikasi</>,
                  <><strong>Email</strong> — Email login (tidak bisa diubah dari sini)</>,
                  <><strong>Ganti Password</strong> — Ubah password melalui form yang tersedia</>,
                ]} />
              </SubSection>

              <SubSection title="Manajemen Family (Super Admin)">
                <BulletList items={[
                  <><strong>Nama Family</strong> — Ubah nama yang mewakili keluarga Anda</>,
                  <><strong>Undang Anggota</strong> — Salin kode undangan atau kirim langsung via WhatsApp. Anggota yang bergabung otomatis mendapat role Member</>,
                  <><strong>Ubah Role</strong> — Promosikan Member menjadi Admin atau turunkan kembali</>,
                  <><strong>Keluarkan Anggota</strong> — Hapus anggota dari family (data transaksi mereka tetap tersimpan)</>,
                ]} />
              </SubSection>
            </Section>

            {/* ── TIPS ── */}
            <Section id="tips" title="Tips & Trik"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}>

              <SubSection title="Rutinitas Harian (5 Menit)">
                <BulletList items={[
                  "Catat semua transaksi di hari yang sama agar tidak lupa",
                  "Simpan struk atau screenshot transfer sebagai referensi",
                  "Gunakan fitur Tambah Cepat di dashboard untuk input lebih efisien",
                ]} />
              </SubSection>

              <SubSection title="Rutinitas Mingguan (15 Menit)">
                <BulletList items={[
                  "Review progress anggaran — cek kategori mana yang hampir habis",
                  "Rekonsiliasi saldo dompet dengan rekening/e-wallet nyata",
                  "Update progress tabungan jika ada top-up manual",
                ]} />
              </SubSection>

              <SubSection title="Rutinitas Bulanan (30 Menit)">
                <BulletList items={[
                  "Lihat laporan bulan berjalan sebelum menutup bulan",
                  "Buat anggaran untuk bulan berikutnya (salin dari bulan ini jika tidak berubah banyak)",
                  "Evaluasi savings goal — apakah target masih realistis?",
                  "Periksa hutang yang mendekati jatuh tempo bulan depan",
                ]} />
              </SubSection>

              <SubSection title="Praktik Terbaik">
                <BulletList items={[
                  <><strong>Konsistensi kategori</strong> — Gunakan kategori yang sama untuk jenis pengeluaran yang sama agar laporan lebih akurat</>,
                  <><strong>Saldo awal akurat</strong> — Saat pertama setup, isi saldo awal dompet sesuai saldo riil agar total aset benar</>,
                  <><strong>Jangan skip transaksi kecil</strong> — Pengeluaran kecil kalau dikumulatifkan bisa signifikan</>,
                  <><strong>Manfaatkan transaksi berulang</strong> — Setup sekali, sistem otomatis mencatat setiap bulan</>,
                  <><strong>Diskusikan bersama keluarga</strong> — Maalify paling efektif saat semua anggota aktif mencatat</>,
                  <><strong>Gunakan visibilitas dengan bijak</strong> — Beri tahu anggota keluarga tentang fitur Pribadi vs Bersama agar semua nyaman menggunakan app</>,
                ]} />
              </SubSection>

              {/* CTA */}
              <div className="mt-8 p-6 bg-gradient-to-br from-[#1E3A5F] to-[#0F2640] rounded-2xl text-center">
                <p className="font-bold text-white text-lg mb-2">Siap mulai mengelola keuangan keluarga?</p>
                <p className="text-blue-300 text-sm mb-5">Gratis selamanya untuk 1 family. Setup 2 menit.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/register" className="px-6 py-2.5 rounded-xl bg-[#27AE60] text-white font-semibold text-sm hover:bg-[#27AE60]/90 transition-colors">
                    Daftar Gratis Sekarang →
                  </Link>
                  <Link href="/login" className="px-6 py-2.5 rounded-xl border border-white/20 text-white/80 font-semibold text-sm hover:bg-white/10 transition-colors">
                    Sudah punya akun? Masuk
                  </Link>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-100 py-10 mt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#1E3A5F] flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-[#1E3A5F]">Maalify</span>
          </Link>
          <p className="text-sm text-neutral-400">© {new Date().getFullYear()} Maalify. Platform keuangan keluarga berbasis AI.</p>
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <Link href="/" className="hover:text-neutral-700 transition-colors">Beranda</Link>
            <Link href="/guide" className="hover:text-neutral-700 transition-colors">Panduan</Link>
            <Link href="/login" className="hover:text-neutral-700 transition-colors">Masuk</Link>
            <Link href="/register" className="hover:text-neutral-700 transition-colors">Daftar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
