"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Info, User, Lock } from "@/lib/icons";
import { AlertTriangle, Lightbulb, Crown, Shield } from "lucide-react";

const TOC = [
  { id: "tentang",        label: "Tentang Maalify" },
  { id: "role",           label: "Sistem Role & Hak Akses" },
  { id: "dashboard",      label: "Dashboard" },
  { id: "transaksi",      label: "Transaksi" },
  { id: "berulang",       label: "Transaksi Berulang" },
  { id: "dompet",         label: "Dompet & Transfer" },
  { id: "anggaran",       label: "Anggaran" },
  { id: "tabungan",       label: "Target Tabungan" },
  { id: "hutang",         label: "Hutang & Piutang" },
  { id: "project",        label: "Project Keluarga" },
  { id: "kategori",       label: "Kategori" },
  { id: "laporan",        label: "Laporan" },
  { id: "pengaturan",     label: "Pengaturan" },
  { id: "tips",           label: "Tips & Trik" },
];

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
    <section id={id} className="scroll-mt-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      <div className="space-y-4 text-sm text-[var(--text-primary)] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-brand-primary inline-block" />
        {title}
      </h3>
      <div className="space-y-2 text-[var(--text-secondary)]">{children}</div>
    </div>
  );
}

function InfoBox({ type = "info", children }: { type?: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = {
    info:    { wrap: "bg-blue-50 border-blue-200 text-blue-800",    Icon: Info },
    warning: { wrap: "bg-amber-50 border-amber-200 text-amber-800", Icon: AlertTriangle },
    tip:     { wrap: "bg-green-50 border-green-200 text-green-800", Icon: Lightbulb },
  };
  const s = styles[type];
  return (
    <div className={cn("flex gap-3 border rounded-xl px-4 py-3 text-sm", s.wrap)}>
      <span className="flex-shrink-0 mt-0.5"><s.Icon size={16} /></span>
      <div>{children}</div>
    </div>
  );
}

function RoleRow({ feature, sa, admin, member }: { feature: string; sa: boolean | string; admin: boolean | string; member: boolean | string }) {
  const cell = (v: boolean | string) =>
    typeof v === "string" ? <span className="text-xs text-[var(--text-secondary)]">{v}</span>
    : v ? <span className="text-green-600 font-bold"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline"}}><polyline points="20 6 9 17 4 12"/></svg></span>
    : <span className="text-slate-300">—</span>;
  return (
    <tr className="border-b border-[var(--border)] last:border-0">
      <td className="py-3.5 pl-5 pr-4 text-sm text-[var(--text-primary)]">{feature}</td>
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
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
          <span className="text-[var(--text-secondary)]">{s}</span>
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
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-primary mt-2" />
          <span className="text-[var(--text-secondary)]">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PanduanPageClient() {
  const [active, setActive] = useState("tentang");
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
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page title */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Panduan Penggunaan Maalify</h1>
            <p className="text-sm text-[var(--text-secondary)]">Manual lengkap untuk semua fitur dan peran pengguna</p>
          </div>
          <a
            href="/panduan/print"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Cetak / PDF
          </a>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sticky TOC */}
        <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-6">
          <p className="text-[10px] font-bold text-[var(--text-secondary)] tracking-widest uppercase mb-3">Daftar Isi</p>
          <nav className="space-y-0.5">
            {TOC.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cn(
                  "w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors",
                  active === id
                    ? "bg-brand-primary text-white font-medium"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-12">

          {/* ── TENTANG ── */}
          <Section id="tentang" title="Tentang Maalify"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}>
            <p>
              <strong>Maalify</strong> adalah aplikasi pencatatan keuangan keluarga berbasis web yang dirancang untuk membantu seluruh anggota keluarga mengelola pemasukan, pengeluaran, tabungan, anggaran, hutang, dan project keuangan bersama dalam satu platform terpadu.
            </p>
            <p>
              Nama <em>Maalify</em> berasal dari kata Arab <strong>مال</strong> (māl) yang berarti harta atau kekayaan. Aplikasi ini dibangun dengan prinsip transparansi dan kolaborasi — setiap anggota keluarga dapat berpartisipasi aktif dalam mengelola keuangan rumah tangga sesuai peran masing-masing.
            </p>
            <SubSection title="Fitur Utama">
              <BulletList items={[
                <><strong>Dashboard Real-time</strong> — Ringkasan keuangan bulanan, grafik arus kas 3/6/12 bulan, dan insight otomatis</>,
                <><strong>Pencatatan Transaksi</strong> — Catat pemasukan dan pengeluaran dengan kategori dan lampiran</>,
                <><strong>Transaksi Berulang</strong> — Otomatisasi tagihan rutin seperti listrik, internet, cicilan</>,
                <><strong>Multi Dompet</strong> — Kelola beberapa rekening, dompet tunai, e-wallet sekaligus</>,
                <><strong>Transfer Antar Dompet</strong> — Pindahkan saldo antar dompet dengan riwayat pencatatan</>,
                <><strong>Anggaran Bulanan</strong> — Buat batas pengeluaran per kategori dan pantau realisasinya</>,
                <><strong>Target Tabungan</strong> — Tentukan tujuan menabung dengan progress bar dan top-up</>,
                <><strong>Hutang & Piutang</strong> — Lacak utang yang harus dibayar atau piutang yang akan diterima</>,
                <><strong>Project Keluarga</strong> — Rencanakan dana untuk proyek besar seperti liburan atau renovasi</>,
                <><strong>Kategori Kustom</strong> — Kelola kategori transaksi dengan ikon dan warna pilihan sendiri</>,
                <><strong>Laporan & Ekspor</strong> — Laporan PDF dan Excel untuk analisis mendalam</>,
                <><strong>Notifikasi Push</strong> — Peringatan otomatis ke perangkat saat anggaran hampir habis atau terlampaui</>,
              ]} />
            </SubSection>
            <SubSection title="Alur Mulai Menggunakan Maalify">
              <StepList steps={[
                "Daftar akun — isi nama lengkap, email, No. WhatsApp (wajib), dan password",
                "Verifikasi email jika diminta (cek kotak masuk dan klik link konfirmasi)",
                "Halaman Onboarding — pilih Buat Family Baru (jadi Super Admin) atau Bergabung ke Family (masukkan kode undangan)",
                "Masuk ke Dashboard — gunakan widget Get Started untuk panduan langkah awal",
              ]} />
            </SubSection>
            <InfoBox type="info">
              Maalify berjalan sepenuhnya di browser — tidak perlu instal aplikasi tambahan. Bisa diakses dari HP, tablet, maupun komputer.
            </InfoBox>
          </Section>

          {/* ── ROLE ── */}
          <Section id="role" title="Sistem Role & Hak Akses"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}>
            <p>
              Maalify menggunakan sistem tiga tingkat peran (<em>role</em>) untuk mengatur siapa yang bisa melihat dan mengubah data keuangan keluarga. Setiap family (rumah tangga) memiliki minimal satu <Badge color="amber">Super Admin</Badge>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={18} className="text-amber-600" />
                  <Badge color="amber">Super Admin</Badge>
                </div>
                <p className="text-xs text-amber-800">Pemilik family. Memiliki akses penuh ke seluruh fitur termasuk manajemen anggota, laporan, dan data sensitif.</p>
              </div>
              <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-blue-600" />
                  <Badge color="blue">Admin</Badge>
                </div>
                <p className="text-xs text-blue-800">Dapat mengelola transaksi, anggaran, hutang, dan laporan. Tidak bisa mengubah keanggotaan atau pengaturan family.</p>
              </div>
              <div className="border border-slate-200 bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User size={18} className="text-slate-500" />
                  <Badge color="slate">Member</Badge>
                </div>
                <p className="text-xs text-slate-700">Anggota biasa. Bisa mencatat transaksi, melihat tabungan, anggaran, dan project. Tidak bisa mengakses data hutang atau laporan penuh.</p>
              </div>
            </div>

            <SubSection title="Bagaimana Role Ditetapkan?">
              <div className="space-y-3">
                {/* Super Admin */}
                <div className="flex gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Crown size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-amber-800 text-sm">Super Admin</span>
                      <Badge color="amber">Otomatis saat buat family</Badge>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Role ini diberikan secara otomatis kepada orang yang <strong>pertama kali membuat family di halaman onboarding</strong> setelah mendaftar. Satu family hanya punya satu Super Admin. Role ini tidak bisa dialihkan ke anggota lain.
                    </p>
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                      <span className="flex-shrink-0 mt-0.5">→</span>
                      <span>Biasanya kepala keluarga atau orang yang pertama mengajak anggota lain bergabung.</span>
                    </div>
                  </div>
                </div>

                {/* Admin */}
                <div className="flex gap-4 p-4 rounded-xl border border-blue-200 bg-blue-50">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Shield size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-blue-800 text-sm">Admin</span>
                      <Badge color="blue">Dipromosikan oleh Super Admin</Badge>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Awalnya semua anggota baru bergabung sebagai Member. Super Admin bisa <strong>mempromosikan Member menjadi Admin</strong> kapan saja melalui halaman Pengaturan → tab Family → tombol ubah role di sebelah nama anggota.
                    </p>
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-blue-700">
                      <span className="flex-shrink-0 mt-0.5">→</span>
                      <span>Cocok untuk pasangan atau anggota dewasa yang ikut mengelola keuangan keluarga secara aktif.</span>
                    </div>
                  </div>
                </div>

                {/* Member */}
                <div className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><User size={18} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-700 text-sm">Member</span>
                      <Badge color="slate">Default saat bergabung</Badge>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Setiap orang yang <strong>bergabung via kode undangan atau link WhatsApp</strong> secara otomatis masuk sebagai Member. Member bisa mencatat transaksi sendiri dan melihat ringkasan keuangan keluarga, namun tidak mengakses data hutang atau laporan penuh.
                    </p>
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="flex-shrink-0 mt-0.5">→</span>
                      <span>Cocok untuk anak remaja atau anggota keluarga yang hanya perlu mencatat pengeluaran pribadi mereka.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3.5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                  <Lock size={13} /> Sistem Privasi Bersama / Pribadi
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">
                  Maalify menerapkan sistem privasi <strong>Bersama</strong> dan <strong>Pribadi</strong> di beberapa fitur utama:
                </p>
                <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5" /><span><strong>Dompet</strong> — Pilih Bersama (terlihat semua anggota) atau Pribadi (hanya pemilik) saat membuat dompet. Default: Bersama.</span></li>
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5" /><span><strong>Transaksi</strong> — Mengikuti visibilitas dompet yang dipilih. Transaksi di dompet Pribadi hanya terlihat oleh pemiliknya.</span></li>
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5" /><span><strong>Anggaran</strong> — Toggle kunci di form anggaran untuk memilih Bersama atau Pribadi. Default: Bersama.</span></li>
                  <li className="flex items-start gap-2"><span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5" /><span><strong>Transaksi Berulang</strong> — Pilih Bersama atau Pribadi saat membuat berulang.</span></li>
                </ul>
                <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                  <strong>Super Admin</strong> selalu dapat melihat semua data termasuk yang bersifat Pribadi milik anggota lain — untuk keperluan rekonsiliasi dan laporan keuangan keluarga.
                </p>
              </div>
            </SubSection>

            <SubSection title="Cara Mengundang Anggota Baru">
              <StepList steps={[
                "Buka Pengaturan → tab Family",
                "Salin Kode Undangan atau klik tombol \"Undang via WhatsApp\"",
                "Bagikan kode/link ke anggota keluarga",
                "Anggota baru mendaftar (isi nama, email, No. WhatsApp, dan password) → setelah login, pilih \"Bergabung ke Family\" di halaman onboarding → masukkan kode undangan",
                "Anggota langsung bergabung sebagai Member dan diarahkan ke dashboard",
                "Jika perlu, Super Admin bisa ubah role-nya menjadi Admin dari daftar anggota",
              ]} />
              <InfoBox type="info">
                Nomor WhatsApp <strong>wajib diisi</strong> saat pendaftaran — digunakan untuk keperluan notifikasi dan verifikasi di masa mendatang.
              </InfoBox>
            </SubSection>

            <SubSection title="Tabel Hak Akses Lengkap">
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-elevated)]">
                    <tr>
                      <th className="text-left py-4 pl-5 pr-4 font-semibold text-[var(--text-primary)]">Fitur / Aksi</th>
                      <th className="py-4 px-5 text-center font-semibold text-amber-600">Super Admin</th>
                      <th className="py-4 px-5 text-center font-semibold text-blue-600">Admin</th>
                      <th className="py-4 px-5 text-center font-semibold text-slate-500">Member</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Dashboard</td></tr>
                    <RoleRow feature="Lihat ringkasan keuangan keluarga" sa={true} admin={true} member="Data sendiri" />
                    <RoleRow feature="Lihat hutang jatuh tempo" sa={true} admin={true} member={false} />
                    <RoleRow feature="Lihat widget dompet saya" sa={true} admin={true} member={true} />

                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Transaksi</td></tr>
                    <RoleRow feature="Lihat semua transaksi" sa={true} admin={true} member="Transaksi sendiri" />
                    <RoleRow feature="Tambah transaksi" sa={true} admin={true} member={true} />
                    <RoleRow feature="Edit / hapus transaksi sendiri" sa={true} admin={true} member={true} />
                    <RoleRow feature="Edit / hapus transaksi orang lain" sa={true} admin={true} member={false} />

                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Transaksi Berulang</td></tr>
                    <RoleRow feature="Lihat berulang Bersama + milik sendiri" sa={true} admin="Bersama + milik sendiri" member={false} />
                    <RoleRow feature="Lihat semua berulang (termasuk Pribadi anggota lain)" sa={true} admin={false} member={false} />
                    <RoleRow feature="Tambah / edit / hapus berulang" sa={true} admin={true} member={false} />

                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Dompet</td></tr>
                    <RoleRow feature="Lihat dompet Bersama + milik sendiri" sa={true} admin="Bersama + milik sendiri" member="Bersama + milik sendiri" />
                    <RoleRow feature="Lihat semua dompet (termasuk Pribadi anggota lain)" sa={true} admin={false} member={false} />
                    <RoleRow feature="Tambah / edit / hapus dompet" sa={true} admin={true} member={false} />
                    <RoleRow feature="Transfer antar dompet" sa={true} admin={true} member={false} />

                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Anggaran</td></tr>
                    <RoleRow feature="Lihat anggaran Bersama + milik sendiri" sa={true} admin="Bersama + milik sendiri" member="Bersama + milik sendiri" />
                    <RoleRow feature="Lihat semua anggaran (termasuk Pribadi anggota lain)" sa={true} admin={false} member={false} />
                    <RoleRow feature="Buat / edit / hapus anggaran" sa={true} admin={true} member={false} />

                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Tabungan</td></tr>
                    <RoleRow feature="Lihat target tabungan" sa={true} admin={true} member={true} />
                    <RoleRow feature="Buat / edit / hapus target" sa={true} admin={true} member={false} />
                    <RoleRow feature="Top-up / tarik tabungan" sa={true} admin={true} member={false} />

                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Hutang & Piutang</td></tr>
                    <RoleRow feature="Lihat data hutang" sa={true} admin={true} member={false} />
                    <RoleRow feature="Tambah / edit / hapus hutang" sa={true} admin={true} member={false} />
                    <RoleRow feature="Tandai lunas" sa={true} admin={true} member={false} />

                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Laporan</td></tr>
                    <RoleRow feature="Akses halaman laporan" sa={true} admin={true} member={false} />
                    <RoleRow feature="Export PDF / Excel" sa={true} admin={true} member={false} />

                    <tr className="bg-[var(--bg-elevated)]/40"><td colSpan={4} className="py-2 pl-5 pr-4 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Pengaturan</td></tr>
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
              Hanya ada satu <strong>Super Admin</strong> per family. Role ini otomatis diberikan ke pembuat family dan tidak bisa dipindahkan ke anggota lain. Untuk mengangkat asisten pengelola, gunakan role <strong>Admin</strong>.
            </InfoBox>
          </Section>

          {/* ── DASHBOARD ── */}
          <Section id="dashboard" title="Dashboard"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}>
            <p>
              Dashboard adalah halaman utama yang menampilkan <strong>ringkasan keuangan bulan berjalan</strong> secara real-time. Setiap data diperbarui otomatis setiap kali Anda membuka halaman.
            </p>

            <SubSection title="Kartu Ringkasan (8 Kartu)">
              <p className="text-[var(--text-secondary)] mb-2">Dashboard menampilkan <strong>8 kartu ringkasan</strong> yang dibagi menjadi dua baris: data <strong>Bersama</strong> (seluruh anggota) dan data <strong>Pribadi</strong> (hanya milik Anda).</p>
              <p className="font-medium text-[var(--text-primary)] mb-1.5">Baris Bersama:</p>
              <BulletList items={[
                <><strong>Total Saldo Bersama</strong> — Jumlah saldo dari semua dompet Bersama aktif</>,
                <><strong>Pemasukan Bersama</strong> — Total pemasukan dari dompet Bersama di bulan ini</>,
                <><strong>Pengeluaran Bersama</strong> — Total pengeluaran dari dompet Bersama di bulan ini</>,
                <><strong>Tabungan Bersih</strong> — Selisih pemasukan dikurangi pengeluaran. Hijau = surplus, merah = defisit</>,
              ]} />
              <p className="font-medium text-[var(--text-primary)] mt-3 mb-1.5">Baris Pribadi (hanya terlihat oleh Anda):</p>
              <BulletList items={[
                <><strong>Total Saldo Pribadi</strong> — Jumlah saldo dari semua dompet Pribadi milik Anda</>,
                <><strong>Pemasukan Pribadi</strong> — Total pemasukan di dompet Pribadi bulan ini</>,
                <><strong>Pengeluaran Pribadi</strong> — Total pengeluaran di dompet Pribadi bulan ini</>,
                <><strong>Tabungan Bersih Pribadi</strong> — Selisih pemasukan dan pengeluaran dari dompet Pribadi</>,
              ]} />
            </SubSection>

            <SubSection title="Grafik Arus Kas">
              <p>Grafik kombinasi (<em>ComposedChart</em>) yang menampilkan tiga data sekaligus dalam satu tampilan:</p>
              <BulletList items={[
                <><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500 mr-1 align-middle" /> <strong>Batang hijau</strong> — Pemasukan per bulan</>,
                <><span className="inline-block w-3 h-3 rounded-sm bg-red-400 mr-1 align-middle" /> <strong>Batang merah</strong> — Pengeluaran per bulan</>,
                <><span className="inline-block w-3 h-1 bg-blue-500 mr-1 align-middle" style={{display:"inline-block",borderTop:"2px dashed #3b82f6",height:0,width:"14px"}} /> <strong>Garis biru putus-putus</strong> — Saldo Bersih (pemasukan − pengeluaran)</>,
              ]} />
              <p className="mt-2 text-[var(--text-secondary)]">Gunakan <strong>dropdown periode</strong> di pojok kanan grafik untuk memilih rentang waktu:</p>
              <BulletList items={[
                <><strong>3 Bulan</strong> — Tampilkan 3 bulan terakhir</>,
                <><strong>6 Bulan</strong> — Tampilkan 6 bulan terakhir</>,
                <><strong>1 Tahun</strong> — Tampilkan 12 bulan terakhir</>,
              ]} />
              <p className="mt-2 text-[var(--text-secondary)]">Subtitle di bawah judul "Arus Kas" menyesuaikan otomatis sesuai periode yang dipilih. Hover pada grafik untuk melihat tooltip detail tiap bulan.</p>
            </SubSection>

            <SubSection title="Pengeluaran per Kategori">
              <p>Grafik donut yang memecah total pengeluaran bulan ini ke dalam kategori-kategori. Warna setiap irisan sesuai dengan warna kategori yang Anda tentukan. Hover pada irisan untuk melihat detail jumlah dan persentase.</p>
            </SubSection>

            <SubSection title="Pemasukan per Kategori">
              <p>Grafik donut serupa untuk sisi pemasukan — menampilkan proporsi tiap kategori pemasukan (gaji, bonus, penjualan, dll.) bulan ini. Kedua grafik kategori (pengeluaran dan pemasukan) tampil berdampingan di bawah grafik Arus Kas.</p>
            </SubSection>

            <SubSection title="Anggaran Bulan Ini">
              <p>Progress bar untuk setiap anggaran kategori yang sudah dibuat. Indikator warna:</p>
              <BulletList items={[
                <><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1" />Normal — penggunaan di bawah 80%</>,
                <><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1" /><strong>Hampir habis</strong> — penggunaan 80–100%</>,
                <><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1" /><strong>Melebihi!</strong> — pengeluaran sudah melampaui anggaran</>,
              ]} />
            </SubSection>

            <SubSection title="Hutang Jatuh Tempo (Admin/Super Admin)">
              <p>Daftar 5 hutang aktif yang paling dekat jatuh temponya. Akan muncul peringatan kuning jika ada hutang yang jatuh tempo dalam <strong>5 hari ke depan</strong>.</p>
            </SubSection>

            <SubSection title="Target Tabungan">
              <p>Menampilkan hingga 4 savings goal yang sedang aktif dengan progress bar berwarna. Klik <em>"Lihat semua →"</em> untuk masuk ke halaman Tabungan.</p>
            </SubSection>

            <SubSection title="Tambah Transaksi Cepat">
              <p>Tombol <strong>"+ Catat Transaksi"</strong> dan <strong>"Scan Struk"</strong> di pojok kanan atas memungkinkan pencatatan transaksi tanpa berpindah halaman. Pilih jenis (pemasukan/pengeluaran), nominal, kategori, dan dompet langsung dari dashboard.</p>
            </SubSection>

            <SubSection title="Widget Get Started">
              <p>Saat pertama kali menggunakan Maalify, akan muncul tombol <strong>Get Started!</strong> di sudut kanan bawah layar. Klik tombol tersebut untuk membuka checklist pengaturan awal:</p>
              <BulletList items={[
                "Tambah dompet pertama (Wajib)",
                "Catat transaksi pertama (Wajib)",
                "Undang anggota keluarga (Direkomendasikan)",
                "Atur anggaran bulanan",
                "Buat target tabungan",
                "Tambah transaksi berulang",
                "Tambah foto profil",
              ]} />
              <p className="mt-2 text-[var(--text-secondary)]">Checklist ini bisa disembunyikan kapan saja dengan klik <em>"Jangan tampilkan lagi"</em>. Di mobile, tombol ini dapat diakses dari menu sidebar.</p>
            </SubSection>
          </Section>

          {/* ── TRANSAKSI ── */}
          <Section id="transaksi" title="Transaksi"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>}>
            <p>
              Halaman Transaksi adalah inti dari Maalify — tempat mencatat semua arus kas keluarga. Setiap transaksi dikategorikan, dikaitkan ke dompet, dan dilacak berdasarkan tanggal.
            </p>

            <SubSection title="Cara Menambah Transaksi">
              <StepList steps={[
                "Klik tombol \"+ Tambah Transaksi\" di sudut kanan atas",
                "Pilih jenis: Pemasukan atau Pengeluaran",
                "Isi nominal (tanpa titik/koma — sistem otomatis memformat)",
                "Pilih kategori yang sesuai",
                "Pilih dompet sumber/tujuan dana",
                "Isi deskripsi singkat (contoh: \"Gaji Juli\", \"Makan siang\")",
                "Atur tanggal transaksi (default hari ini)",
                "Klik Simpan",
              ]} />
            </SubSection>

            <SubSection title="Filter & Pencarian">
              <BulletList items={[
                <><strong>Filter bulan/tahun</strong> — Lihat transaksi bulan tertentu menggunakan navigasi panah kiri/kanan</>,
                <><strong>Filter tipe</strong> — Tampilkan hanya Semua, Pemasukan, atau Pengeluaran</>,
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

            <SubSection title="Kartu Ringkasan Bulan Ini">
              <p>Di atas daftar transaksi terdapat tiga kartu: <strong>Total Pemasukan</strong>, <strong>Total Pengeluaran</strong>, dan <strong>Tabungan Bersih</strong> untuk bulan yang sedang ditampilkan.</p>
            </SubSection>

            <InfoBox type="tip">
              Gunakan deskripsi yang konsisten agar mudah dicari. Misalnya: selalu awali pengeluaran makan dengan kata "Makan" untuk memudahkan pencarian.
            </InfoBox>
          </Section>

          {/* ── BERULANG ── */}
          <Section id="berulang" title="Transaksi Berulang"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>}>
            <p>
              Transaksi Berulang (<em>recurring transactions</em>) adalah transaksi yang terjadi secara otomatis pada interval tertentu — cocok untuk tagihan rutin seperti listrik, air, internet, gaji, atau cicilan.
            </p>

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
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">Bersama</p>
                  <p className="text-xs text-[var(--text-secondary)]">Terlihat oleh semua anggota. Cocok untuk tagihan rumah tangga bersama seperti listrik, air, internet, atau cicilan keluarga.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                  <p className="font-semibold text-amber-800 text-sm mb-1 flex items-center gap-1.5">
                    <Lock size={13} className="inline" /> Pribadi
                  </p>
                  <p className="text-xs text-amber-700">Hanya terlihat oleh kamu dan Super Admin. Cocok untuk langganan personal, cicilan pribadi, atau tagihan yang tidak perlu diketahui anggota lain.</p>
                </div>
              </div>
            </SubSection>

            <SubSection title="Cara Kerja Otomatisasi">
              <BulletList items={[
                "Sistem akan memeriksa transaksi berulang yang jatuh tempo setiap kali seseorang membuka dashboard",
                "Transaksi akan dibuat secara otomatis di latar belakang tanpa perlu interaksi manual",
                "Transaksi yang sudah dibuat otomatis muncul di halaman Transaksi seperti transaksi biasa",
                "Jika tidak ada yang membuka dashboard pada hari H, transaksi tetap akan dibuat saat ada yang masuk berikutnya",
              ]} />
            </SubSection>

            <SubSection title="Menonaktifkan & Menghapus">
              <BulletList items={[
                "Klik tombol pause untuk menonaktifkan sementara tanpa menghapus",
                "Klik tombol hapus untuk menghentikan permanen — transaksi yang sudah dibuat tidak ikut terhapus",
              ]} />
            </SubSection>

            <InfoBox type="tip">
              Ideal untuk: gaji bulanan, tagihan listrik/air/internet, cicilan KPR atau kendaraan, iuran sekolah, langganan streaming.
            </InfoBox>
          </Section>

          {/* ── DOMPET ── */}
          <Section id="dompet" title="Dompet & Transfer"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>}>
            <p>
              Dompet mewakili tempat penyimpanan uang — bisa berupa rekening bank, dompet fisik, e-wallet (OVO, GoPay, Dana), atau aset kas lainnya. Setiap transaksi dikaitkan ke satu dompet sehingga saldo selalu akurat.
            </p>

            <SubSection title="Jenis Dompet">
              <BulletList items={[
                <><strong>Bank</strong> — Rekening tabungan atau giro di bank</>,
                <><strong>Tunai</strong> — Uang cash/fisik yang dipegang langsung</>,
                <><strong>E-Wallet</strong> — Dompet digital seperti OVO, GoPay, Dana, ShopeePay</>,
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
                "Isi saldo awal (saldo saat ini di rekening/dompet tersebut)",
                "Pilih visibilitas: Bersama (terlihat semua anggota) atau Pribadi (hanya kamu dan Super Admin). Default: Bersama",
                "Pilih warna identifikasi",
                "Klik Simpan",
              ]} />
            </SubSection>

            <SubSection title="Dompet Bersama vs Pribadi">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">Bersama (Default)</p>
                  <p className="text-xs text-[var(--text-secondary)]">Terlihat oleh semua anggota family. Cocok untuk rekening keluarga, kas rumah tangga, atau dompet pengeluaran bersama.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                  <p className="font-semibold text-amber-800 text-sm mb-1 flex items-center gap-1.5">
                    <Lock size={13} className="inline" /> Pribadi
                  </p>
                  <p className="text-xs text-amber-700">Hanya terlihat oleh pemilik dompet dan Super Admin. Cocok untuk rekening tabungan personal atau dompet yang tidak ingin dibagikan ke seluruh anggota.</p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">Transaksi yang dicatat ke dompet Pribadi secara otomatis hanya terlihat oleh pemiliknya — tidak perlu pengaturan tambahan per transaksi.</p>
            </SubSection>

            <SubSection title="Transfer Antar Dompet">
              <p>Fitur ini memindahkan saldo dari satu dompet ke dompet lain tanpa mempengaruhi laporan pemasukan/pengeluaran.</p>
              <StepList steps={[
                "Di halaman Dompet, klik tombol \"Transfer\"",
                "Pilih dompet asal (dari mana uang dipindah)",
                "Pilih dompet tujuan (ke mana uang dikirim)",
                "Isi nominal transfer",
                "Tambahkan catatan opsional",
                "Klik Transfer — saldo kedua dompet akan otomatis diperbarui",
              ]} />
            </SubSection>

            <InfoBox type="warning">
              Saldo dompet diperbarui otomatis saat transaksi ditambah, diedit, atau dihapus. Jangan edit saldo secara manual kecuali untuk koreksi saldo awal.
            </InfoBox>
          </Section>

          {/* ── ANGGARAN ── */}
          <Section id="anggaran" title="Anggaran"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}>
            <p>
              Anggaran memungkinkan Anda menetapkan batas pengeluaran per kategori untuk setiap bulan. Maalify akan memantau realisasi pengeluaran dan memberikan peringatan saat mendekati atau melewati batas.
            </p>

            <SubSection title="Cara Membuat Anggaran">
              <StepList steps={[
                "Buka halaman Anggaran",
                "Klik \"+ Tambah Anggaran\"",
                "Pilih bulan dan tahun yang dituju",
                "Pilih kategori (hanya kategori tipe pengeluaran yang tersedia)",
                "Isi nominal batas anggaran",
                "Pilih Visibilitas: klik ikon kunci di form untuk memilih Bersama atau Pribadi",
                "Klik Simpan",
              ]} />
            </SubSection>

            <SubSection title="Anggaran Pribadi vs Bersama">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">Bersama (Default)</p>
                  <p className="text-xs text-[var(--text-secondary)]">Terlihat oleh semua anggota. Cocok untuk anggaran keluarga seperti makan, transportasi, atau tagihan rumah yang dikelola bersama.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50">
                  <p className="font-semibold text-amber-800 text-sm mb-1 flex items-center gap-1.5">
                    <Lock size={13} className="inline" /> Pribadi
                  </p>
                  <p className="text-xs text-amber-700">Hanya terlihat oleh pemilik anggaran dan Super Admin. Cocok untuk anggaran personal seperti pakaian, hobi, atau kebutuhan individu.</p>
                </div>
              </div>
            </SubSection>

            <SubSection title="Memahami Progress Bar Anggaran">
              <BulletList items={[
                "Progress bar menunjukkan persentase penggunaan dari batas anggaran",
                "Angka di sebelah kanan menunjukkan: realisasi / batas (contoh: Rp 800.000 / Rp 1.000.000)",
                "Badge \"Hampir habis\" muncul saat penggunaan ≥ 80%",
                "Badge \"Melebihi!\" muncul saat pengeluaran sudah melampaui batas",
              ]} />
            </SubSection>

            <SubSection title="Salin Anggaran Bulan Sebelumnya">
              <p>Tombol <strong>"Salin dari bulan lalu"</strong> di bagian atas halaman menyalin semua anggaran bulan sebelumnya ke bulan berjalan — praktis untuk anggaran yang tidak banyak berubah tiap bulan.</p>
            </SubSection>

            <InfoBox type="tip">
              Mulai dengan anggaran 3–5 kategori terbesar terlebih dahulu (makanan, transportasi, tagihan). Tambahkan kategori lain setelah terbiasa memantau.
            </InfoBox>
          </Section>

          {/* ── TABUNGAN ── */}
          <Section id="tabungan" title="Target Tabungan"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12l4-4"/></svg>}>
            <p>
              Fitur Target Tabungan (<em>Savings Goals</em>) membantu keluarga menabung untuk tujuan tertentu — seperti dana darurat, liburan, beli gadget, atau uang muka rumah — dengan progress tracking yang jelas.
            </p>

            <SubSection title="Cara Membuat Target Tabungan">
              <StepList steps={[
                "Buka halaman Tabungan",
                "Klik \"+ Target Baru\"",
                "Isi nama target (contoh: \"Dana Darurat\", \"Liburan Bali\")",
                "Pilih ikon yang mewakili tujuan",
                "Pilih warna untuk identifikasi",
                "Isi nominal target (jumlah yang ingin dicapai)",
                "Tentukan deadline opsional",
                "Tambahkan deskripsi opsional",
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

            <SubSection title="Menarik Tabungan (Withdraw)">
              <StepList steps={[
                "Klik ikon detail / \"Kelola\" pada kartu goal",
                "Klik tombol \"Tarik\"",
                "Pilih dompet tujuan",
                "Isi nominal penarikan (tidak boleh melebihi saldo goal)",
                "Klik Simpan",
              ]} />
            </SubSection>

            <SubSection title="Status Goal">
              <BulletList items={[
                <><Badge color="blue">Aktif</Badge> — Goal sedang berjalan, belum tercapai</>,
                <><Badge color="green">Selesai</Badge> — Saldo sudah mencapai atau melebihi target. Sistem otomatis menandai selesai</>,
                "Filter tab di atas daftar memungkinkan beralih antara Aktif / Semua / Selesai",
              ]} />
            </SubSection>

            <InfoBox type="tip">
              Buat goal "Dana Darurat" sebesar 3–6 bulan pengeluaran rutin sebagai prioritas pertama sebelum menabung untuk tujuan lain.
            </InfoBox>
          </Section>

          {/* ── HUTANG ── */}
          <Section id="hutang" title="Hutang & Piutang"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}>
            <p>
              Fitur Hutang & Piutang membantu melacak kewajiban finansial yang belum diselesaikan, baik uang yang harus dibayar ke orang lain (<strong>Hutang</strong>) maupun uang yang akan diterima dari orang lain (<strong>Piutang</strong>).
            </p>
            <InfoBox type="warning">Fitur ini hanya dapat diakses oleh <Badge color="amber">Super Admin</Badge> dan <Badge color="blue">Admin</Badge>.</InfoBox>

            <SubSection title="Cara Menambah Hutang / Piutang">
              <StepList steps={[
                "Buka halaman Hutang & Piutang",
                "Klik \"+ Tambah\" dan pilih jenis: Hutang atau Piutang",
                "Isi nama pihak terkait (nama orang/lembaga)",
                "Isi nominal total",
                "Tentukan tanggal jatuh tempo (opsional tapi sangat disarankan)",
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
            <p>
              Project Keluarga adalah fitur perencanaan dana untuk proyek atau tujuan bersama yang membutuhkan koordinasi anggaran lebih kompleks — seperti renovasi rumah, pernikahan, perjalanan keluarga, atau pembelian aset besar.
            </p>

            <SubSection title="Perbedaan Project vs Tabungan">
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-elevated)]">
                    <tr>
                      <th className="text-left py-4 px-5 font-semibold text-[var(--text-primary)]">Aspek</th>
                      <th className="py-4 px-5 text-center font-semibold text-purple-600">Target Tabungan</th>
                      <th className="py-4 px-5 text-center font-semibold text-blue-600">Project</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[var(--border)]"><td className="py-3.5 px-5">Fokus</td><td className="py-3.5 px-5 text-center text-[var(--text-secondary)]">Menabung uang</td><td className="py-3.5 px-5 text-center text-[var(--text-secondary)]">Merencanakan pengerjaan</td></tr>
                    <tr className="border-t border-[var(--border)]"><td className="py-3.5 px-5">Kompleksitas</td><td className="py-3.5 px-5 text-center text-[var(--text-secondary)]">Sederhana</td><td className="py-3.5 px-5 text-center text-[var(--text-secondary)]">Multi-item anggaran</td></tr>
                    <tr className="border-t border-[var(--border)]"><td className="py-3.5 px-5">Kolaborasi</td><td className="py-3.5 px-5 text-center text-[var(--text-secondary)]">Individual/keluarga</td><td className="py-3.5 px-5 text-center text-[var(--text-secondary)]">Tim keluarga</td></tr>
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

          {/* ── KATEGORI ── */}
          <Section id="kategori" title="Kategori"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>}>
            <p>
              Kategori digunakan untuk mengelompokkan transaksi agar laporan dan anggaran lebih bermakna. Maalify menyediakan kategori bawaan yang siap pakai, namun Anda dapat menambah, mengubah, atau menghapus kategori sesuai kebutuhan keluarga.
            </p>

            <SubSection title="Jenis Kategori">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">Kategori Pengeluaran</p>
                  <p className="text-xs text-[var(--text-secondary)]">Digunakan saat mencatat transaksi tipe <strong>Pengeluaran</strong>. Contoh bawaan: Makan & Minum, Transportasi, Belanja, Tagihan, Kesehatan, Pendidikan, Hiburan.</p>
                </div>
                <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <p className="font-semibold text-[var(--text-primary)] text-sm mb-1">Kategori Pemasukan</p>
                  <p className="text-xs text-[var(--text-secondary)]">Digunakan saat mencatat transaksi tipe <strong>Pemasukan</strong>. Contoh bawaan: Gaji, Bonus, Freelance, Investasi, Hadiah, Lainnya.</p>
                </div>
              </div>
            </SubSection>

            <SubSection title="Cara Menambah Kategori Baru">
              <StepList steps={[
                "Buka halaman Kategori dari sidebar",
                "Klik \"+ Tambah Kategori\"",
                "Isi nama kategori (contoh: \"Olahraga\", \"Hobi\", \"Uang Sekolah\")",
                "Pilih tipe: Pengeluaran atau Pemasukan",
                "Pilih ikon yang mewakili kategori dari daftar tersedia",
                "Pilih warna identifikasi — warna ini yang akan muncul di grafik donut",
                "Klik Simpan",
              ]} />
            </SubSection>

            <SubSection title="Mengedit & Menghapus Kategori">
              <BulletList items={[
                "Klik ikon pensil di sebelah nama kategori untuk mengedit nama, ikon, atau warna",
                "Klik ikon tempat sampah untuk menghapus kategori yang tidak lagi digunakan",
                "Kategori yang sudah dipakai di transaksi <strong>tidak bisa dihapus</strong> — Anda perlu memindahkan atau menghapus transaksi terkait terlebih dahulu",
                "Kategori bawaan sistem dapat diedit namanya tetapi tidak dapat dihapus",
              ]} />
            </SubSection>

            <SubSection title="Tips Penggunaan Kategori">
              <BulletList items={[
                <><strong>Buat kategori spesifik</strong> — Daripada \"Belanja\", coba \"Belanja Bulanan\", \"Belanja Online\", \"Belanja Pakaian\" agar laporan lebih informatif</>,
                <><strong>Jangan terlalu banyak</strong> — 10–15 kategori pengeluaran sudah cukup untuk sebagian besar keluarga. Terlalu banyak justru menyulitkan konsistensi pencatatan</>,
                <><strong>Warna kontras</strong> — Pilih warna yang berbeda jauh antar kategori agar grafik donut mudah dibaca</>,
                <><strong>Sesuaikan dengan anggaran</strong> — Buat kategori yang sama persis dengan yang Anda gunakan di fitur Anggaran agar tracking lebih akurat</>,
              ]} />
            </SubSection>

            <InfoBox type="info">
              Kategori bersifat <strong>global untuk seluruh family</strong> — semua anggota menggunakan daftar kategori yang sama. Perubahan kategori oleh Admin atau Super Admin berlaku untuk semua anggota.
            </InfoBox>
          </Section>

          {/* ── LAPORAN ── */}
          <Section id="laporan" title="Laporan"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>}>
            <p>
              Halaman Laporan menyajikan analisis keuangan mendalam dan memungkinkan ekspor data ke format PDF atau Excel. Hanya tersedia untuk <Badge color="amber">Super Admin</Badge> dan <Badge color="blue">Admin</Badge>.
            </p>

            <SubSection title="Jenis Laporan">
              <BulletList items={[
                <><strong>Laporan Bulanan</strong> — Ringkasan pemasukan, pengeluaran, dan tabungan bersih per bulan</>,
                <><strong>Laporan per Kategori</strong> — Rincian pengeluaran dikelompokkan per kategori</>,
                <><strong>Laporan per Anggota</strong> — Kontribusi transaksi masing-masing anggota keluarga</>,
                <><strong>Laporan Dompet</strong> — Riwayat mutasi per dompet</>,
              ]} />
            </SubSection>

            <SubSection title="Ekspor Data">
              <BulletList items={[
                <><strong>Export PDF</strong> — Laporan terformat siap cetak, cocok untuk dokumentasi</>,
                <><strong>Export Excel (.xlsx)</strong> — Data mentah dalam spreadsheet, cocok untuk analisis lanjutan</>,
                <><strong>Scope Bersama / Pribadi</strong> — Pilih ekspor data dari dompet <em>Bersama</em> saja (kas rumah tangga) atau dari dompet <em>Pribadi</em> Anda saja (keuangan personal). Tersedia di tombol Ekspor</>,
                "Gunakan filter rentang waktu (7 hari, 1 bulan, 3 bulan, 6 bulan, 1 tahun) untuk membatasi periode data",
              ]} />
            </SubSection>

            <SubSection title="Filter & Rentang Laporan">
              <BulletList items={[
                "Filter berdasarkan rentang waktu: 7 hari, 1 bulan, 3 bulan, 6 bulan, atau 1 tahun penuh",
                "Tampilan grafik periode — perbandingan pemasukan dan pengeluaran per hari atau per bulan",
                "Breakdown kategori pengeluaran — kategori mana yang menyerap paling banyak",
                "Ringkasan Bersama / Pribadi — total aset, pemasukan, dan pengeluaran dipisah per scope",
              ]} />
            </SubSection>
          </Section>

          {/* ── PENGATURAN ── */}
          <Section id="pengaturan" title="Pengaturan"
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}>
            <p>
              Halaman Pengaturan memungkinkan setiap pengguna mengelola profil pribadi. Super Admin mendapatkan akses tambahan untuk mengatur family dan keanggotaan.
            </p>

            <SubSection title="Profil Pengguna">
              <BulletList items={[
                <><strong>Foto Profil</strong> — Upload foto avatar (maks 2MB, format JPG/PNG/WebP). Klik lingkaran foto untuk memilih file</>,
                <><strong>Nama Lengkap</strong> — Nama yang ditampilkan di seluruh aplikasi</>,
                <><strong>Email</strong> — Email login (tidak bisa diubah dari sini)</>,
                <><strong>Ganti Password</strong> — Ubah password melalui form yang tersedia</>,
              ]} />
            </SubSection>

            <SubSection title="Manajemen Family (Super Admin)">
              <BulletList items={[
                <><strong>Nama Family</strong> — Ubah nama yang mewakili keluarga Anda</>,
                <><strong>Undang Anggota</strong> — Salin kode undangan atau kirim langsung via WhatsApp. Anggota yang bergabung otomatis mendapat role Member</>,
                <><strong>Ubah Role</strong> — Promosikan Member menjadi Admin (atau turunkan kembali). Berguna untuk pasangan yang ikut aktif mengelola keuangan</>,
                <><strong>Keluarkan Anggota</strong> — Hapus anggota dari family (data transaksi mereka tetap tersimpan)</>,
              ]} />
            </SubSection>

            <SubSection title="Pindah ke Family Lain">
              <p>Jika Anda perlu berpindah ke family lain (misalnya bergabung ke family pasangan), fitur ini tersedia di halaman Pengaturan:</p>
              <StepList steps={[
                "Buka Pengaturan → cari bagian \"Pindah ke Family Lain\"",
                "Masukkan kode undangan dari family tujuan",
                "Konfirmasi perpindahan",
                "Anda akan otomatis keluar dari family lama dan masuk ke family baru sebagai Member",
              ]} />
              <InfoBox type="warning">
                Riwayat transaksi yang sudah dicatat di family lama <strong>tidak ikut berpindah</strong>. Data tetap tersimpan di family sebelumnya.
              </InfoBox>
            </SubSection>

            <SubSection title="Notifikasi Push">
              <p>Maalify dapat mengirimkan notifikasi langsung ke perangkat Anda meskipun browser sedang ditutup, selama perangkat terhubung ke internet.</p>
              <p className="mt-2 text-[var(--text-secondary)]">Notifikasi yang dikirimkan antara lain:</p>
              <BulletList items={[
                <><strong>Anggaran hampir habis</strong> — Dikirim saat pengeluaran kategori mencapai ≥80% dari batas anggaran</>,
                <><strong>Anggaran melebihi batas</strong> — Dikirim saat pengeluaran kategori melampaui batas anggaran (&gt;100%)</>,
              ]} />
              <StepList steps={[
                "Buka Pengaturan → cari bagian \"Notifikasi Push\"",
                "Klik tombol \"Aktifkan Notifikasi\"",
                "Browser akan meminta izin notifikasi — pilih Izinkan",
                "Status akan berubah menjadi \"Aktif\" — notifikasi siap diterima",
                "Untuk menonaktifkan, klik tombol \"Nonaktifkan\" di bagian yang sama",
              ]} />
              <InfoBox type="tip">
                Notifikasi push bekerja bahkan saat tab Maalify ditutup, selama browser masih berjalan di latar belakang. Untuk hasil terbaik, instal Maalify sebagai aplikasi (PWA) di perangkat Anda.
              </InfoBox>
            </SubSection>

            <SubSection title="Instal sebagai Aplikasi (PWA)">
              <p>Maalify dapat diinstal sebagai aplikasi di HP atau komputer tanpa melalui App Store/Play Store — disebut <em>Progressive Web App</em> (PWA).</p>
              <BulletList items={[
                <><strong>Android (Chrome)</strong> — Klik ikon unduh/instal di address bar, atau buka menu Chrome → \"Tambahkan ke layar utama\"</>,
                <><strong>iPhone (Safari)</strong> — Ketuk ikon Bagikan → \"Tambahkan ke Layar Utama\"</>,
                <><strong>Desktop</strong> — Klik ikon instal di address bar browser Chrome/Edge</>,
              ]} />
              <p className="mt-2 text-[var(--text-secondary)]">Setelah terinstal, Maalify berjalan seperti aplikasi native — bisa diakses dari layar utama, berjalan fullscreen, dan mendukung notifikasi push.</p>
              <p className="mt-2 text-[var(--text-secondary)]">Klik ikon <strong>unduh/instal</strong> di header aplikasi untuk membuka panduan langkah demi langkah sesuai perangkat Anda.</p>
            </SubSection>

            <SubSection title="Keluar (Logout)">
              <p>Tombol <strong>Logout</strong> tersedia di bagian bawah sidebar (desktop) atau menu (mobile). Setelah logout, Anda perlu login ulang untuk mengakses data.</p>
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
                <><strong>Konsistensi kategori</strong> — Gunakan kategori yang sama untuk jenis pengeluaran yang sama setiap bulan agar laporan lebih akurat</>,
                <><strong>Saldo awal akurat</strong> — Saat pertama setup, isi saldo awal dompet sesuai saldo riil agar total aset benar</>,
                <><strong>Jangan skip transaksi kecil</strong> — Pengeluaran kecil seperti parkir, jajan, tips kalau dikumulatifkan bisa signifikan</>,
                <><strong>Manfaatkan transaksi berulang</strong> — Setup sekali, sistem otomatis mencatat setiap bulan</>,
                <><strong>Diskusikan bersama keluarga</strong> — Maalify paling efektif saat semua anggota aktif mencatat</>,
              ]} />
            </SubSection>

            <SubSection title="Shortcut Berguna">
              <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-elevated)]">
                    <tr>
                      <th className="text-left py-4 px-5 font-semibold text-[var(--text-primary)]">Aksi</th>
                      <th className="py-3 px-4 text-left font-semibold text-[var(--text-primary)]">Cara Cepat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Tambah transaksi dari mana saja", "Klik + di header atau tombol cepat di Dashboard"],
                      ["Pencarian global", "Tekan Ctrl + K (atau ⌘K di Mac) dari halaman mana saja"],
                      ["Pindah antar bulan di Transaksi", "Klik panah ← → di atas tabel transaksi"],
                      ["Salin anggaran bulan lalu", "Halaman Anggaran → \"Salin dari bulan lalu\""],
                      ["Lihat detail goal", "Klik nama/ikon goal di halaman Tabungan"],
                      ["Filter transaksi per kategori", "Dropdown kategori di atas tabel transaksi"],
                      ["Instal aplikasi di perangkat", "Klik ikon unduh di header → ikuti panduan sesuai perangkat"],
                      ["Aktifkan notifikasi push", "Pengaturan → bagian Notifikasi Push → Aktifkan"],
                    ].map(([aksi, cara], i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="py-3.5 px-5 text-[var(--text-primary)]">{aksi}</td>
                        <td className="py-3.5 px-5 text-[var(--text-secondary)]">{cara}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            <div className="mt-6 p-5 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
              <p className="font-semibold text-[var(--text-primary)] mb-1">Butuh Bantuan Lebih Lanjut?</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Jika Anda menemukan masalah atau memiliki pertanyaan yang belum tercakup di panduan ini, hubungi administrator family atau tim dukungan Maalify.
              </p>
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
}
