import Link from "next/link";
import { Metadata } from "next";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Panduan Maalify — Cetak / PDF",
};

export default function PanduanPrintPage() {
  return (
    <>
      {/* ── Print stylesheet + toolbar ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 10.5pt;
          line-height: 1.65;
          color: #1a1a2e;
          background: #f5f5f5;
        }

        /* ── Toolbar (no-print) ── */
        .toolbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 999;
          background: #1E3A5F;
          color: white;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(0,0,0,.25);
        }
        .toolbar-left { display: flex; align-items: center; gap: 12px; }
        .toolbar-logo { font-weight: 700; font-size: 15px; letter-spacing: -0.3px; }
        .toolbar-hint { color: #93C5FD; font-size: 12px; }
        .toolbar-btn {
          background: #27AE60;
          color: white;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }
        .toolbar-btn-ghost {
          background: rgba(255,255,255,.12);
          color: white;
          border: none;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .toolbar-btn-ghost:hover { background: rgba(255,255,255,.2); }

        /* ── Document wrapper ── */}
        .doc-wrap {
          margin-top: 60px;
          padding: 32px 16px 60px;
        }

        /* ── A4 page simulation ── */
        .page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 20px;
          box-shadow: 0 2px 16px rgba(0,0,0,.12);
          padding: 20mm 22mm;
          position: relative;
        }

        /* ── Cover page ── */
        .cover {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
          min-height: 257mm;
          background: white;
        }
        .cover-top { width: 100%; }
        .cover-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 60px;
        }
        .cover-logo-box {
          width: 40px; height: 40px;
          background: #1E3A5F;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 18px;
        }
        .cover-logo-name { font-weight: 800; font-size: 22px; color: #1E3A5F; letter-spacing: -0.5px; }
        .cover-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          color: #27AE60;
          margin-bottom: 14px;
        }
        .cover-title {
          font-size: 34px;
          font-weight: 800;
          color: #1E3A5F;
          line-height: 1.2;
          letter-spacing: -0.5px;
          margin-bottom: 20px;
        }
        .cover-subtitle {
          font-size: 13px;
          color: #64748B;
          line-height: 1.7;
          max-width: 420px;
          margin-bottom: 36px;
        }
        .cover-divider {
          width: 60px; height: 4px;
          background: #27AE60;
          border-radius: 2px;
          margin-bottom: 36px;
        }
        .cover-meta {
          font-size: 10px;
          color: #94A3B8;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .cover-bottom {
          width: 100%;
          padding-top: 24px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .cover-footer-left { font-size: 9px; color: #94A3B8; }
        .cover-toc-preview {
          font-size: 9px;
          color: #64748B;
          text-align: right;
        }
        .cover-toc-preview strong { display: block; color: #1E3A5F; margin-bottom: 4px; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; }

        /* ── Table of Contents page ── */
        .toc-title {
          font-size: 18px;
          font-weight: 800;
          color: #1E3A5F;
          margin-bottom: 6px;
          letter-spacing: -0.3px;
        }
        .toc-subtitle { font-size: 10px; color: #94A3B8; margin-bottom: 28px; }
        .toc-section { margin-bottom: 6px; }
        .toc-group-label {
          font-size: 7.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #94A3B8;
          margin: 18px 0 8px;
        }
        .toc-item {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dotted #E2E8F0;
        }
        .toc-item-main { display: flex; align-items: center; gap: 8px; }
        .toc-num {
          font-size: 9px;
          font-weight: 700;
          color: #27AE60;
          width: 16px;
          flex-shrink: 0;
        }
        .toc-label { font-size: 10.5px; color: #1E3A5F; font-weight: 500; }
        .toc-sub {
          padding: 3px 0 3px 24px;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          border-bottom: 1px dotted #F1F5F9;
        }
        .toc-sub-label { font-size: 9.5px; color: #64748B; }
        .toc-dots { flex: 1; border-bottom: 1px dotted #CBD5E1; margin: 0 8px; min-width: 20px; }
        .toc-page { font-size: 9px; color: #94A3B8; font-weight: 600; }

        /* ── Section header ── */
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 2px solid #E2E8F0;
        }
        .section-num {
          width: 30px; height: 30px;
          background: #1E3A5F;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 800; font-size: 12px;
          flex-shrink: 0;
        }
        .section-title { font-size: 17px; font-weight: 800; color: #1E3A5F; letter-spacing: -0.3px; }

        /* ── Sub section ── */
        .subsection { margin: 18px 0 12px; }
        .subsection-title {
          font-size: 11px;
          font-weight: 700;
          color: #1E3A5F;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .subsection-bar {
          width: 3px; height: 14px;
          background: #27AE60;
          border-radius: 2px;
          flex-shrink: 0;
        }

        /* ── Body text ── */
        p { font-size: 10.5pt; color: #334155; line-height: 1.7; margin-bottom: 8px; }
        strong { font-weight: 700; color: #1E3A5F; }
        em { font-style: italic; color: #475569; }

        /* ── Role cards ── */
        .role-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 14px 0; }
        .role-card { padding: 12px; border-radius: 10px; border: 1px solid; }
        .role-card-sa { background: #FFFBEB; border-color: #FDE68A; }
        .role-card-admin { background: #EFF6FF; border-color: #BFDBFE; }
        .role-card-member { background: #F8FAFC; border-color: #E2E8F0; }
        .role-card-icon { font-size: 18px; margin-bottom: 5px; }
        .role-card-badge {
          display: inline-block;
          font-size: 8px; font-weight: 700;
          padding: 2px 7px;
          border-radius: 99px;
          border: 1px solid;
          margin-bottom: 5px;
        }
        .badge-sa { background: #FEF3C7; color: #92400E; border-color: #FDE68A; }
        .badge-admin { background: #DBEAFE; color: #1E40AF; border-color: #93C5FD; }
        .badge-member { background: #F1F5F9; color: #475569; border-color: #CBD5E1; }
        .badge-green { background: #DCFCE7; color: #166534; border-color: #86EFAC; }
        .badge-red { background: #FEE2E2; color: #991B1B; border-color: #FCA5A5; }
        .role-card p { font-size: 9px; line-height: 1.5; margin: 0; }
        .role-card-sa p { color: #92400E; }
        .role-card-admin p { color: #1E40AF; }
        .role-card-member p { color: #475569; }
        .role-when { font-size: 8.5px; font-weight: 600; margin-bottom: 4px; }

        /* ── Role assignment boxes ── */
        .role-assign { display: flex; gap: 10px; padding: 10px 12px; border-radius: 10px; border: 1px solid; margin-bottom: 8px; }
        .role-assign-sa { background: #FFFBEB; border-color: #FDE68A; }
        .role-assign-admin { background: #EFF6FF; border-color: #BFDBFE; }
        .role-assign-member { background: #F8FAFC; border-color: #E2E8F0; }
        .role-assign-icon { font-size: 20px; flex-shrink: 0; line-height: 1; }
        .role-assign-title { font-size: 10px; font-weight: 700; margin-bottom: 2px; }
        .role-assign-sa .role-assign-title { color: #92400E; }
        .role-assign-admin .role-assign-title { color: #1E40AF; }
        .role-assign-member .role-assign-title { color: #374151; }
        .role-assign p { font-size: 9px; line-height: 1.5; margin: 0; }
        .role-assign-sa p { color: #92400E; }
        .role-assign-admin p { color: #1E40AF; }
        .role-assign-member p { color: #475569; }

        /* ── Privacy box ── */
        .privacy-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 14px; margin: 12px 0; }
        .privacy-box-title { font-size: 10px; font-weight: 700; color: #1E3A5F; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .privacy-box p { font-size: 9.5px; margin: 0; color: #475569; }

        /* ── Access table ── */
        .access-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9pt; }
        .access-table th { background: #F8FAFC; padding: 7px 10px; text-align: left; font-size: 8.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 2px solid #E2E8F0; }
        .access-table th.col-sa { color: #B45309; text-align: center; }
        .access-table th.col-admin { color: #1D4ED8; text-align: center; }
        .access-table th.col-member { color: #475569; text-align: center; }
        .access-table td { padding: 6px 10px; font-size: 9pt; color: #334155; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
        .access-table td.center { text-align: center; }
        .access-table .group-row td { background: #F8FAFC; font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94A3B8; padding: 5px 10px; }
        .check { color: #16A34A; font-weight: 900; font-size: 11px; }
        .dash { color: #CBD5E1; font-size: 11px; }
        .partial { font-size: 8px; color: #64748B; }

        /* ── Step list ── */
        .step-list { list-style: none; margin: 8px 0; }
        .step-item { display: flex; gap: 10px; margin-bottom: 6px; align-items: flex-start; }
        .step-num {
          width: 18px; height: 18px; flex-shrink: 0;
          background: #1E3A5F;
          border-radius: 99px;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 8px; font-weight: 700;
          margin-top: 1px;
        }
        .step-text { font-size: 10pt; color: #475569; line-height: 1.55; }

        /* ── Bullet list ── */
        .bullet-list { list-style: none; margin: 8px 0; }
        .bullet-item { display: flex; gap: 8px; margin-bottom: 5px; align-items: flex-start; }
        .bullet-dot {
          width: 6px; height: 6px; flex-shrink: 0;
          background: #1E3A5F; border-radius: 99px;
          margin-top: 6px;
        }
        .bullet-text { font-size: 10pt; color: #475569; line-height: 1.55; }

        /* ── Infobox ── */
        .infobox { display: flex; gap: 10px; padding: 10px 12px; border-radius: 8px; border: 1px solid; margin: 12px 0; }
        .infobox-info { background: #EFF6FF; border-color: #BFDBFE; color: #1E40AF; }
        .infobox-warning { background: #FFFBEB; border-color: #FDE68A; color: #92400E; }
        .infobox-tip { background: #F0FDF4; border-color: #BBF7D0; color: #166534; }
        .infobox-icon { font-size: 13px; flex-shrink: 0; line-height: 1.4; }
        .infobox p { font-size: 9.5pt; margin: 0; line-height: 1.55; }
        .infobox-info p { color: #1E40AF; }
        .infobox-warning p { color: #92400E; }
        .infobox-tip p { color: #166534; }

        /* ── Visibility cards ── */
        .visibility-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
        .visibility-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; }
        .visibility-card-title { font-size: 10px; font-weight: 700; color: #1E3A5F; margin-bottom: 4px; }
        .visibility-card p { font-size: 9px; color: #475569; margin: 0; line-height: 1.5; }

        /* ── Comparison table ── */
        .cmp-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 10px 0; }
        .cmp-table th { background: #F8FAFC; padding: 8px 12px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748B; border-bottom: 2px solid #E2E8F0; }
        .cmp-table td { padding: 7px 12px; color: #475569; border-bottom: 1px solid #F1F5F9; }
        .cmp-table td:first-child { font-weight: 600; color: #1E3A5F; }

        /* ── Shortcut table ── */
        .shortcut-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 10px 0; }
        .shortcut-table th { background: #F8FAFC; padding: 8px 12px; text-align: left; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748B; border-bottom: 2px solid #E2E8F0; }
        .shortcut-table td { padding: 7px 12px; border-bottom: 1px solid #F1F5F9; color: #475569; }
        .shortcut-table td:first-child { font-weight: 500; color: #1E3A5F; }

        /* ── Section page number header ── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 8px;
          border-bottom: 1px solid #E2E8F0;
          font-size: 8px;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* ── Tips grid ── */
        .tips-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 12px 0; }
        .tips-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; }
        .tips-card-title { font-size: 9.5px; font-weight: 700; color: #1E3A5F; margin-bottom: 8px; display: flex; align-items: center; gap: 5px; }

        /* ── PRINT MEDIA ── */
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white; margin: 0; }
          .toolbar { display: none !important; }
          .doc-wrap { margin-top: 0; padding: 0; }
          .page {
            width: 100%;
            box-shadow: none;
            margin: 0;
            padding: 18mm 20mm;
            page-break-after: always;
            min-height: auto;
          }
          .page:last-child { page-break-after: avoid; }
          @page {
            size: A4;
            margin: 0;
          }
        }

        @media screen and (max-width: 240mm) {
          .page { width: 100%; }
        }
      `}</style>

      {/* ── Toolbar (screen only) ── */}
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="toolbar-logo">📄 Maalify — Panduan PDF</span>
          <span className="toolbar-hint">Tekan Ctrl+P (Windows) atau ⌘+P (Mac) → Simpan sebagai PDF</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/guide" className="toolbar-btn-ghost">
            ← Kembali
          </Link>
          <PrintButton />
        </div>
      </div>

      <div className="doc-wrap">

        {/* ══════════════════════════════════════════
            HALAMAN 1 — COVER
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="cover">
            <div className="cover-top">
              {/* Logo */}
              <div className="cover-logo">
                <div className="cover-logo-box">M</div>
                <span className="cover-logo-name">Maalify</span>
              </div>

              {/* Title */}
              <div className="cover-label">Dokumentasi Resmi · Versi 1.0</div>
              <div className="cover-title">Panduan Lengkap<br />Penggunaan Maalify</div>
              <div className="cover-divider" />
              <div className="cover-subtitle">
                Manual komprehensif untuk semua pengguna Maalify — mulai dari pencatatan transaksi harian,
                manajemen anggaran keluarga, sistem peran dan privasi anggota, hingga pelaporan keuangan tahunan.
              </div>

              {/* Meta */}
              <div className="cover-meta">
                <span>📅 Terakhir diperbarui: Mei 2026</span>
                <span>🌐 maalify.app/panduan</span>
                <span>📧 Platform keuangan keluarga berbasis AI</span>
              </div>
            </div>

            {/* Bottom */}
            <div className="cover-bottom">
              <div className="cover-footer-left">
                <div style={{ fontWeight: 700, color: "#1E3A5F", marginBottom: 3 }}>Maalify</div>
                <div>© 2026 Maalify. Seluruh hak dilindungi.</div>
                <div>Dokumen ini boleh dibagikan untuk keperluan internal family.</div>
              </div>
              <div className="cover-toc-preview">
                <strong>Daftar Isi</strong>
                <div>1. Tentang Maalify</div>
                <div>2. Sistem Role &amp; Hak Akses</div>
                <div>3. Dashboard</div>
                <div>4. Transaksi</div>
                <div>5. Transaksi Berulang</div>
                <div>6. Dompet &amp; Transfer</div>
                <div>7. Anggaran · Tabungan · Hutang</div>
                <div>8. Project · Laporan · Pengaturan</div>
                <div>9. Tips &amp; Trik</div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 2 — DAFTAR ISI
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Daftar Isi</span>
          </div>

          <div className="toc-title">Daftar Isi</div>
          <div className="toc-subtitle">Panduan Penggunaan Maalify · Edisi Lengkap 2026</div>

          {[
            {
              num: "1", label: "Tentang Maalify",
              subs: ["Latar Belakang & Filosofi", "Daftar Fitur Utama", "Persyaratan Penggunaan"],
            },
            {
              num: "2", label: "Sistem Role & Hak Akses",
              subs: ["Tiga Tingkat Peran", "Kapan Role Ditetapkan", "Privasi Transaksi", "Cara Mengundang Anggota", "Tabel Hak Akses Lengkap"],
            },
            {
              num: "3", label: "Dashboard",
              subs: ["Kartu Ringkasan", "Grafik Tren 6 Bulan", "Anggaran & Pengeluaran per Kategori", "Widget Super Admin"],
            },
            {
              num: "4", label: "Transaksi",
              subs: ["Cara Menambah Transaksi", "Visibilitas Pribadi vs Bersama", "Filter & Pencarian", "Edit & Hapus"],
            },
            {
              num: "5", label: "Transaksi Berulang",
              subs: ["Cara Membuat", "Cara Kerja Otomatisasi", "Menonaktifkan & Menghapus"],
            },
            {
              num: "6", label: "Dompet & Transfer",
              subs: ["Jenis Dompet", "Cara Menambah Dompet", "Transfer Antar Dompet"],
            },
            {
              num: "7", label: "Anggaran",
              subs: ["Cara Membuat Anggaran", "Membaca Progress Bar", "Salin Bulan Sebelumnya"],
            },
            {
              num: "8", label: "Target Tabungan",
              subs: ["Cara Membuat Goal", "Top-up & Withdraw", "Status Goal"],
            },
            {
              num: "9", label: "Hutang & Piutang",
              subs: ["Cara Menambah", "Pencicilan", "Status Hutang"],
            },
            {
              num: "10", label: "Project Keluarga",
              subs: ["Project vs Tabungan", "Cara Membuat Project"],
            },
            {
              num: "11", label: "Laporan",
              subs: ["Isi Laporan Tahunan", "Export PDF & Excel"],
            },
            {
              num: "12", label: "Pengaturan",
              subs: ["Profil Pengguna", "Manajemen Household (Super Admin)"],
            },
            {
              num: "13", label: "Tips & Trik",
              subs: ["Rutinitas Harian, Mingguan, Bulanan", "Praktik Terbaik"],
            },
          ].map((item) => (
            <div key={item.num} className="toc-section">
              <div className="toc-item">
                <div className="toc-item-main">
                  <span className="toc-num">{item.num}.</span>
                  <span className="toc-label">{item.label}</span>
                </div>
                <div className="toc-dots" />
              </div>
              {item.subs.map((s) => (
                <div key={s} className="toc-sub">
                  <span className="toc-sub-label">— {s}</span>
                  <div className="toc-dots" />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 3 — BAB 1: TENTANG MAALIFY
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Bab 1 · Tentang Maalify</span>
          </div>

          <div className="section-header">
            <div className="section-num">1</div>
            <div className="section-title">Tentang Maalify</div>
          </div>

          <p>
            <strong>Maalify</strong> adalah aplikasi pencatatan keuangan keluarga berbasis web yang membantu seluruh anggota keluarga mengelola pemasukan, pengeluaran, tabungan, anggaran, hutang, dan project keuangan bersama dalam satu platform terpadu yang aman dan mudah digunakan.
          </p>
          <p>
            Nama <em>Maalify</em> berasal dari kata Arab <strong>مال</strong> (māl) yang berarti harta atau kekayaan. Aplikasi ini dibangun dengan dua prinsip utama: <strong>transparansi keluarga</strong> dan <strong>privasi individu</strong> — setiap anggota bisa berpartisipasi aktif tanpa harus mengorbankan privasi keuangan pribadinya.
          </p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Fitur Utama</div>
            <ul className="bullet-list">
              {[
                ["Dashboard Real-time", "Ringkasan keuangan bulanan, tren 6 bulan, dan insight otomatis"],
                ["Pencatatan Transaksi", "Catat pemasukan dan pengeluaran dengan kategori, visibilitas pribadi/bersama, dan lampiran"],
                ["Scan Struk AI", "Foto struk belanja — merchant, tanggal, nominal terbaca otomatis oleh AI"],
                ["Maali AI Assistant", "Tanya kondisi keuangan keluarga kapan saja, dapatkan saran hemat"],
                ["Transaksi Berulang", "Otomatisasi tagihan rutin: listrik, internet, gaji, cicilan"],
                ["Multi Dompet", "Kelola rekening bank, dompet tunai, e-wallet sekaligus"],
                ["Transfer Antar Dompet", "Pindahkan saldo dengan riwayat pencatatan lengkap"],
                ["Anggaran Bulanan", "Buat batas pengeluaran per kategori, pantau realisasinya"],
                ["Target Tabungan", "Tentukan tujuan menabung dengan progress bar dan top-up"],
                ["Hutang & Piutang", "Lacak kewajiban finansial dengan sistem cicilan"],
                ["Project Keluarga", "Rencanakan dana untuk proyek besar bersama"],
                ["Laporan & Ekspor", "Laporan tahunan dalam format PDF dan Excel"],
              ].map(([title, desc]) => (
                <li key={title} className="bullet-item">
                  <span className="bullet-dot" />
                  <span className="bullet-text"><strong>{title}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Persyaratan Penggunaan</div>
            <ul className="bullet-list">
              {[
                "Browser modern: Chrome, Firefox, Safari, atau Edge versi terbaru",
                "Koneksi internet untuk sinkronisasi data real-time",
                "Akun email untuk registrasi dan login",
                "Tidak perlu instalasi — berjalan sepenuhnya di browser (tersedia mode PWA untuk HP)",
              ].map((item) => (
                <li key={item} className="bullet-item">
                  <span className="bullet-dot" />
                  <span className="bullet-text">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="infobox infobox-info">
            <span className="infobox-icon">ℹ️</span>
            <p>Maalify bisa diinstall di smartphone layaknya aplikasi native melalui fitur PWA (Progressive Web App). Buka di browser HP → menu "Tambahkan ke Layar Utama".</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 4 — BAB 2: SISTEM ROLE (halaman 1)
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Bab 2 · Sistem Role &amp; Hak Akses</span>
          </div>

          <div className="section-header">
            <div className="section-num">2</div>
            <div className="section-title">Sistem Role &amp; Hak Akses</div>
          </div>

          <p>
            Maalify menggunakan sistem tiga tingkat peran (<em>role</em>) untuk mengatur siapa yang bisa melihat dan mengubah data keuangan keluarga. Sistem ini dirancang agar fleksibel — cukup ketat untuk melindungi data, namun cukup terbuka agar setiap anggota bisa berpartisipasi.
          </p>

          <div className="role-cards">
            <div className="role-card role-card-sa">
              <div className="role-card-icon">👑</div>
              <span className="role-card-badge badge-sa">Super Admin</span>
              <div className="role-when" style={{ color: "#92400E" }}>Otomatis saat membuat family</div>
              <p>Akses penuh ke seluruh fitur termasuk laporan, hutang, manajemen anggota, dan ringkasan pengeluaran seluruh keluarga.</p>
            </div>
            <div className="role-card role-card-admin">
              <div className="role-card-icon">🛡️</div>
              <span className="role-card-badge badge-admin">Admin</span>
              <div className="role-when" style={{ color: "#1E40AF" }}>Dipromosikan oleh Super Admin</div>
              <p>Mengelola transaksi, anggaran, hutang, dan laporan. Tidak bisa mengubah keanggotaan atau pengaturan family.</p>
            </div>
            <div className="role-card role-card-member">
              <div className="role-card-icon">👤</div>
              <span className="role-card-badge badge-member">Member</span>
              <div className="role-when" style={{ color: "#475569" }}>Default saat bergabung via undangan</div>
              <p>Mencatat transaksi sendiri, melihat ringkasan keluarga. Tidak akses hutang atau laporan penuh. Cocok untuk anak.</p>
            </div>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Kapan Role Ditetapkan?</div>
            <div className="role-assign role-assign-sa">
              <span className="role-assign-icon">👑</span>
              <div>
                <div className="role-assign-title">Super Admin — Otomatis saat mendaftar &amp; membuat family</div>
                <p>Diberikan kepada orang yang pertama kali membuat family saat registrasi. Satu family hanya punya satu Super Admin — biasanya kepala keluarga atau orang yang pertama mengajak anggota lain. Role ini tidak bisa dipindahkan.</p>
              </div>
            </div>
            <div className="role-assign role-assign-admin">
              <span className="role-assign-icon">🛡️</span>
              <div>
                <div className="role-assign-title">Admin — Dipromosikan oleh Super Admin</div>
                <p>Semua anggota baru bergabung sebagai Member. Super Admin bisa mempromosikan Member menjadi Admin melalui Pengaturan → tab Household → ubah role. Cocok untuk pasangan atau anggota dewasa yang ikut aktif mengelola keuangan.</p>
              </div>
            </div>
            <div className="role-assign role-assign-member">
              <span className="role-assign-icon">👤</span>
              <div>
                <div className="role-assign-title">Member — Default saat bergabung via kode undangan</div>
                <p>Setiap orang yang bergabung lewat kode undangan atau link WhatsApp otomatis masuk sebagai Member. Cocok untuk anak remaja yang hanya perlu mencatat pengeluaran pribadi tanpa akses ke data keuangan keluarga secara penuh.</p>
              </div>
            </div>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Privasi Transaksi</div>
            <div className="privacy-box">
              <div className="privacy-box-title">🔒 Sistem Visibilitas Transaksi</div>
              <p>Setiap transaksi memiliki pengaturan visibilitas yang bisa dipilih saat mencatat:</p>
            </div>
            <div className="visibility-grid">
              <div className="visibility-card">
                <div className="visibility-card-title">🔒 Pribadi (Default)</div>
                <p>Hanya terlihat oleh orang yang mencatat transaksi. Anggota lain tidak tahu transaksi ini ada. Super Admin hanya melihat total pengeluaran, bukan detail transaksinya.</p>
              </div>
              <div className="visibility-card">
                <div className="visibility-card-title">🏠 Bersama</div>
                <p>Terlihat oleh semua anggota family. Gunakan untuk pengeluaran keluarga bersama seperti belanja bulanan, tagihan rumah, atau pengeluaran yang perlu diketahui semua anggota.</p>
              </div>
            </div>
            <div className="infobox infobox-tip" style={{ marginTop: 8 }}>
              <span className="infobox-icon">💡</span>
              <p>Default "Pribadi" membuat anggota seperti anak remaja merasa aman menggunakan Maalify — pengeluaran jajan atau keperluan pribadi tidak akan terlihat oleh orang tua, kecuali mereka memilih berbagi.</p>
            </div>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Mengundang Anggota Baru</div>
            <ol className="step-list">
              {[
                "Buka Pengaturan → tab Household",
                "Salin Kode Undangan atau klik tombol \"Undang via WhatsApp\"",
                "Bagikan kode/link ke anggota keluarga",
                "Anggota mendaftar atau login, lalu masukkan kode undangan",
                "Anggota langsung bergabung sebagai Member",
                "Jika perlu, Super Admin bisa ubah role-nya menjadi Admin dari daftar anggota",
              ].map((step, i) => (
                <li key={i} className="step-item">
                  <span className="step-num">{i + 1}</span>
                  <span className="step-text">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 5 — BAB 2: TABEL HAK AKSES
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Bab 2 · Tabel Hak Akses</span>
          </div>

          <div className="subsection" style={{ marginTop: 0 }}>
            <div className="subsection-title"><span className="subsection-bar" /> Tabel Hak Akses Lengkap</div>
            <table className="access-table">
              <thead>
                <tr>
                  <th>Fitur / Aksi</th>
                  <th className="col-sa">Super Admin</th>
                  <th className="col-admin">Admin</th>
                  <th className="col-member">Member</th>
                </tr>
              </thead>
              <tbody>
                <tr className="group-row"><td colSpan={4}>Dashboard</td></tr>
                <tr><td>Lihat ringkasan keuangan keluarga</td><td className="center check">✓</td><td className="center check">✓</td><td className="center partial">Data sendiri</td></tr>
                <tr><td>Lihat hutang jatuh tempo</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>
                <tr><td>Lihat pengeluaran per anggota (summary)</td><td className="center check">✓</td><td className="center dash">—</td><td className="center dash">—</td></tr>

                <tr className="group-row"><td colSpan={4}>Transaksi</td></tr>
                <tr><td>Lihat semua transaksi</td><td className="center check">✓</td><td className="center check">✓</td><td className="center partial">Transaksi sendiri</td></tr>
                <tr><td>Tambah transaksi</td><td className="center check">✓</td><td className="center check">✓</td><td className="center check">✓</td></tr>
                <tr><td>Atur visibilitas (Pribadi / Bersama)</td><td className="center check">✓</td><td className="center check">✓</td><td className="center check">✓</td></tr>
                <tr><td>Edit / hapus transaksi sendiri</td><td className="center check">✓</td><td className="center check">✓</td><td className="center check">✓</td></tr>
                <tr><td>Edit / hapus transaksi orang lain</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>

                <tr className="group-row"><td colSpan={4}>Dompet</td></tr>
                <tr><td>Lihat semua dompet</td><td className="center check">✓</td><td className="center check">✓</td><td className="center check">✓</td></tr>
                <tr><td>Tambah / edit / hapus dompet</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>
                <tr><td>Transfer antar dompet</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>

                <tr className="group-row"><td colSpan={4}>Anggaran</td></tr>
                <tr><td>Lihat anggaran</td><td className="center check">✓</td><td className="center check">✓</td><td className="center check">✓</td></tr>
                <tr><td>Buat / edit / hapus anggaran</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>

                <tr className="group-row"><td colSpan={4}>Tabungan</td></tr>
                <tr><td>Lihat target tabungan</td><td className="center check">✓</td><td className="center check">✓</td><td className="center check">✓</td></tr>
                <tr><td>Buat / edit / hapus target</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>
                <tr><td>Top-up / tarik tabungan</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>

                <tr className="group-row"><td colSpan={4}>Hutang &amp; Piutang</td></tr>
                <tr><td>Lihat data hutang</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>
                <tr><td>Tambah / edit / hapus hutang</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>
                <tr><td>Tandai lunas / catat cicilan</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>

                <tr className="group-row"><td colSpan={4}>Laporan</td></tr>
                <tr><td>Akses halaman laporan</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>
                <tr><td>Export PDF / Excel</td><td className="center check">✓</td><td className="center check">✓</td><td className="center dash">—</td></tr>

                <tr className="group-row"><td colSpan={4}>Pengaturan</td></tr>
                <tr><td>Edit profil sendiri</td><td className="center check">✓</td><td className="center check">✓</td><td className="center check">✓</td></tr>
                <tr><td>Undang anggota baru</td><td className="center check">✓</td><td className="center dash">—</td><td className="center dash">—</td></tr>
                <tr><td>Ubah role anggota</td><td className="center check">✓</td><td className="center dash">—</td><td className="center dash">—</td></tr>
                <tr><td>Keluarkan anggota dari family</td><td className="center check">✓</td><td className="center dash">—</td><td className="center dash">—</td></tr>
                <tr><td>Edit nama family</td><td className="center check">✓</td><td className="center dash">—</td><td className="center dash">—</td></tr>
              </tbody>
            </table>
          </div>

          <div className="infobox infobox-warning">
            <span className="infobox-icon">⚠️</span>
            <p>Hanya ada satu <strong>Super Admin</strong> per family. Role ini otomatis diberikan ke pembuat family dan tidak bisa dipindahkan. Untuk mengangkat asisten pengelola, gunakan role <strong>Admin</strong>.</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 6 — BAB 3 & 4: DASHBOARD & TRANSAKSI
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Bab 3–4 · Dashboard &amp; Transaksi</span>
          </div>

          <div className="section-header">
            <div className="section-num">3</div>
            <div className="section-title">Dashboard</div>
          </div>

          <p>Dashboard adalah halaman utama yang menampilkan <strong>ringkasan keuangan bulan berjalan</strong> secara real-time. Data diperbarui otomatis setiap kali halaman dibuka.</p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> 4 Kartu Ringkasan</div>
            <ul className="bullet-list">
              {[
                ["Total Saldo", "Jumlah saldo dari semua dompet aktif family"],
                ["Pemasukan Bulan Ini", "Total pemasukan bulan berjalan + persentase perubahan dari bulan lalu"],
                ["Pengeluaran Bulan Ini", "Total pengeluaran + perbandingan bulan lalu"],
                ["Tabungan Bersih", "Selisih pemasukan dikurangi pengeluaran. Hijau = surplus, merah = defisit"],
              ].map(([t, d]) => (
                <li key={t} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text"><strong>{t}</strong> — {d}</span></li>
              ))}
            </ul>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Widget Lainnya</div>
            <ul className="bullet-list">
              {[
                "Tren Pemasukan & Pengeluaran — grafik batang 6 bulan terakhir",
                "Pengeluaran per Kategori — grafik donut bulan ini",
                "Anggaran Bulan Ini — progress bar per kategori (hijau < 80%, kuning 80–100%, merah > 100%)",
                "Hutang Jatuh Tempo — 5 hutang terdekat (hanya Admin/Super Admin)",
                "Pengeluaran per Anggota — total per orang tanpa detail transaksi privat (hanya Super Admin)",
                "Target Tabungan — progress hingga 4 goal aktif",
              ].map((item) => (
                <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text">{item}</span></li>
              ))}
            </ul>
          </div>

          <div className="section-header" style={{ marginTop: 24 }}>
            <div className="section-num">4</div>
            <div className="section-title">Transaksi</div>
          </div>

          <p>Halaman Transaksi adalah inti dari Maalify — tempat mencatat semua arus kas keluarga. Setiap transaksi dikategorikan, dikaitkan ke dompet, dan dilacak berdasarkan tanggal.</p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Menambah Transaksi</div>
            <ol className="step-list">
              {[
                "Klik tombol \"+ Tambah Transaksi\" di sudut kanan atas",
                "Pilih jenis: Pemasukan atau Pengeluaran",
                "Isi nominal (tanpa titik/koma — sistem otomatis memformat)",
                "Pilih kategori yang sesuai dari daftar",
                "Pilih dompet sumber/tujuan dana",
                "Isi deskripsi singkat (contoh: \"Gaji Juli\", \"Makan siang\")",
                "Atur visibilitas: 🔒 Pribadi atau 🏠 Bersama (default: Pribadi)",
                "Atur tanggal transaksi (default hari ini)",
                "Klik Simpan — saldo dompet diperbarui otomatis",
              ].map((s, i) => (
                <li key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-text">{s}</span></li>
              ))}
            </ol>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Filter & Pencarian</div>
            <ul className="bullet-list">
              {[
                "Filter bulan/tahun — navigasi panah kiri/kanan",
                "Filter tipe — Semua, Pemasukan, atau Pengeluaran",
                "Filter kategori — fokus pada satu kategori pengeluaran",
                "Pencarian teks — cari berdasarkan deskripsi transaksi",
              ].map((item) => (
                <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text">{item}</span></li>
              ))}
            </ul>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Edit & Hapus Transaksi</div>
            <ul className="bullet-list">
              {[
                "Klik ikon pensil (✏️) untuk membuka form edit",
                "Klik ikon tempat sampah (🗑️) untuk menghapus — muncul konfirmasi",
                "Member hanya bisa edit/hapus transaksi milik sendiri",
                "Admin dan Super Admin bisa edit/hapus transaksi siapapun",
              ].map((item) => (
                <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text">{item}</span></li>
              ))}
            </ul>
          </div>

          <div className="infobox infobox-tip">
            <span className="infobox-icon">💡</span>
            <p>Gunakan deskripsi yang konsisten agar mudah dicari. Contoh: selalu awali pengeluaran makan dengan kata "Makan" sehingga filter teks bekerja lebih efektif.</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 7 — BAB 5 & 6: BERULANG & DOMPET
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Bab 5–6 · Transaksi Berulang &amp; Dompet</span>
          </div>

          <div className="section-header">
            <div className="section-num">5</div>
            <div className="section-title">Transaksi Berulang</div>
          </div>

          <p>Transaksi Berulang adalah transaksi yang dibuat otomatis pada interval tertentu — cocok untuk tagihan rutin seperti listrik, air, internet, gaji, atau cicilan bulanan.</p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Membuat Transaksi Berulang</div>
            <ol className="step-list">
              {[
                "Buka menu Berulang di sidebar",
                "Klik \"+ Tambah Berulang\"",
                "Isi nominal, kategori, dompet, dan deskripsi",
                "Pilih frekuensi: Harian, Mingguan, Bulanan, atau Tahunan",
                "Tentukan tanggal mulai",
                "Pilih apakah ada tanggal berakhir atau tidak",
                "Klik Simpan",
              ].map((s, i) => (
                <li key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-text">{s}</span></li>
              ))}
            </ol>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Kerja Otomatisasi</div>
            <ul className="bullet-list">
              {[
                "Sistem memeriksa transaksi berulang yang jatuh tempo setiap kali seseorang membuka dashboard",
                "Transaksi dibuat otomatis di latar belakang tanpa interaksi manual",
                "Transaksi yang sudah dibuat muncul di halaman Transaksi seperti transaksi biasa",
                "Klik ikon pause (⏸) untuk menonaktifkan sementara tanpa menghapus",
                "Klik hapus untuk menghentikan permanen — transaksi yang sudah dibuat tidak ikut terhapus",
              ].map((item) => (
                <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text">{item}</span></li>
              ))}
            </ul>
          </div>

          <div className="infobox infobox-tip">
            <span className="infobox-icon">💡</span>
            <p>Ideal untuk: gaji bulanan, tagihan listrik/air/internet, cicilan KPR atau kendaraan, iuran sekolah, langganan streaming.</p>
          </div>

          <div className="section-header" style={{ marginTop: 24 }}>
            <div className="section-num">6</div>
            <div className="section-title">Dompet &amp; Transfer</div>
          </div>

          <p>Dompet mewakili tempat penyimpanan uang — rekening bank, dompet fisik, e-wallet (OVO, GoPay, Dana), atau aset kas lainnya. Setiap transaksi dikaitkan ke satu dompet sehingga saldo selalu akurat.</p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Jenis Dompet</div>
            <ul className="bullet-list">
              {[
                ["Bank", "Rekening tabungan atau giro di bank"],
                ["Tunai", "Uang cash yang dipegang langsung"],
                ["E-Wallet", "OVO, GoPay, Dana, ShopeePay, dll."],
                ["Investasi", "Rekening investasi, reksa dana, saham"],
                ["Lainnya", "Kategori fleksibel untuk jenis lain"],
              ].map(([t, d]) => (
                <li key={t} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text"><strong>{t}</strong> — {d}</span></li>
              ))}
            </ul>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Menambah Dompet</div>
            <ol className="step-list">
              {[
                "Buka halaman Dompet dari sidebar",
                "Klik \"+ Tambah Dompet\"",
                "Isi nama dompet (contoh: \"BCA Tabungan\", \"GoPay\")",
                "Pilih jenis dompet",
                "Isi saldo awal (saldo saat ini di rekening/dompet tersebut)",
                "Pilih warna identifikasi",
                "Klik Simpan",
              ].map((s, i) => (
                <li key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-text">{s}</span></li>
              ))}
            </ol>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Transfer Antar Dompet</div>
            <p>Transfer memindahkan saldo dari satu dompet ke dompet lain <strong>tanpa mempengaruhi laporan pemasukan/pengeluaran</strong>.</p>
            <ol className="step-list">
              {[
                "Di halaman Dompet, klik tombol \"Transfer\"",
                "Pilih dompet asal dan dompet tujuan",
                "Isi nominal transfer dan catatan opsional",
                "Klik Transfer — saldo kedua dompet diperbarui otomatis",
              ].map((s, i) => (
                <li key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-text">{s}</span></li>
              ))}
            </ol>
          </div>

          <div className="infobox infobox-warning">
            <span className="infobox-icon">⚠️</span>
            <p>Saldo dompet diperbarui otomatis saat transaksi ditambah, diedit, atau dihapus. Jangan edit saldo secara manual kecuali untuk koreksi saldo awal pertama kali.</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 8 — BAB 7, 8, 9: ANGGARAN, TABUNGAN, HUTANG
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Bab 7–9 · Anggaran, Tabungan, Hutang</span>
          </div>

          <div className="section-header">
            <div className="section-num">7</div>
            <div className="section-title">Anggaran</div>
          </div>

          <p>Anggaran memungkinkan penetapan batas pengeluaran per kategori untuk setiap bulan. Maalify memantau realisasi dan memberi peringatan saat mendekati atau melewati batas.</p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Membuat Anggaran</div>
            <ol className="step-list">
              {["Buka halaman Anggaran", "Klik \"+ Tambah Anggaran\"", "Pilih bulan dan tahun", "Pilih kategori pengeluaran", "Isi nominal batas anggaran", "Klik Simpan"].map((s, i) => (
                <li key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-text">{s}</span></li>
              ))}
            </ol>
            <div className="infobox infobox-tip" style={{ marginTop: 8 }}>
              <span className="infobox-icon">💡</span>
              <p>Gunakan tombol "Salin dari bulan lalu" untuk menyalin anggaran bulan sebelumnya — praktis jika anggaran tidak banyak berubah.</p>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <div className="section-num">8</div>
            <div className="section-title">Target Tabungan</div>
          </div>

          <p>Target Tabungan (<em>Savings Goals</em>) membantu keluarga menabung untuk tujuan tertentu dengan progress tracking yang jelas.</p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Membuat Target &amp; Top-up</div>
            <ol className="step-list">
              {["Buka halaman Tabungan → klik \"+ Target Baru\"", "Isi nama, ikon, warna, dan nominal target", "Tentukan deadline opsional → klik Simpan", "Untuk menambah saldo: klik \"Top-up\" pada kartu goal", "Pilih dompet sumber dana dan isi nominal", "Klik Simpan — saldo dompet berkurang, saldo goal bertambah"].map((s, i) => (
                <li key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-text">{s}</span></li>
              ))}
            </ol>
            <div className="infobox infobox-tip" style={{ marginTop: 8 }}>
              <span className="infobox-icon">💡</span>
              <p>Buat goal "Dana Darurat" sebesar 3–6 bulan pengeluaran rutin sebagai prioritas pertama sebelum menabung untuk tujuan lain.</p>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <div className="section-num">9</div>
            <div className="section-title">Hutang &amp; Piutang</div>
          </div>

          <div className="infobox infobox-warning" style={{ marginBottom: 10 }}>
            <span className="infobox-icon">⚠️</span>
            <p>Fitur ini hanya dapat diakses oleh <strong>Super Admin</strong> dan <strong>Admin</strong>.</p>
          </div>

          <p>Membantu melacak kewajiban finansial — uang yang harus dibayar (<strong>Hutang</strong>) maupun yang akan diterima (<strong>Piutang</strong>).</p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Menambah &amp; Mencicil</div>
            <ol className="step-list">
              {[
                "Buka halaman Hutang → klik \"+ Tambah\" → pilih jenis Hutang atau Piutang",
                "Isi nama pihak terkait, nominal total, dan tanggal jatuh tempo",
                "Untuk mencatat cicilan: klik detail hutang → \"Catat Pembayaran\"",
                "Isi nominal cicilan — sistem otomatis menghitung sisa",
                "Jika sisa = 0, status otomatis berubah menjadi Lunas",
              ].map((s, i) => (
                <li key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-text">{s}</span></li>
              ))}
            </ol>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Status Hutang</div>
            <ul className="bullet-list">
              <li className="bullet-item"><span className="bullet-dot" /><span className="bullet-text"><span className="role-card-badge badge-admin" style={{ fontSize: 8, padding: "1px 7px" }}>Aktif</span> — Masih ada sisa yang belum dibayar</span></li>
              <li className="bullet-item"><span className="bullet-dot" /><span className="bullet-text"><span className="role-card-badge badge-green" style={{ fontSize: 8, padding: "1px 7px" }}>Lunas</span> — Sudah dibayar penuh</span></li>
              <li className="bullet-item"><span className="bullet-dot" /><span className="bullet-text"><span className="role-card-badge badge-red" style={{ fontSize: 8, padding: "1px 7px" }}>Jatuh Tempo</span> — Melewati deadline dan belum lunas</span></li>
            </ul>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 9 — BAB 10, 11, 12: PROJECT, LAPORAN, PENGATURAN
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Bab 10–12 · Project, Laporan, Pengaturan</span>
          </div>

          <div className="section-header">
            <div className="section-num">10</div>
            <div className="section-title">Project Keluarga</div>
          </div>

          <p>Project Keluarga adalah fitur perencanaan dana untuk proyek besar yang membutuhkan koordinasi anggaran lebih kompleks — renovasi rumah, pernikahan, perjalanan keluarga, atau pembelian aset besar.</p>

          <table className="cmp-table">
            <thead>
              <tr><th>Aspek</th><th>Target Tabungan</th><th>Project</th></tr>
            </thead>
            <tbody>
              <tr><td>Fokus</td><td>Menabung uang</td><td>Merencanakan pengerjaan</td></tr>
              <tr><td>Kompleksitas</td><td>Sederhana</td><td>Multi-item anggaran</td></tr>
              <tr><td>Kolaborasi</td><td>Individual / keluarga</td><td>Tim keluarga</td></tr>
            </tbody>
          </table>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Cara Membuat Project</div>
            <ol className="step-list">
              {["Buka halaman Project Keluarga", "Klik \"+ Buat Project\"", "Isi nama project, deskripsi, dan total anggaran", "Atur deadline project", "Tambahkan item-item rincian biaya", "Klik Simpan"].map((s, i) => (
                <li key={i} className="step-item"><span className="step-num">{i + 1}</span><span className="step-text">{s}</span></li>
              ))}
            </ol>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <div className="section-num">11</div>
            <div className="section-title">Laporan</div>
          </div>

          <p>Halaman Laporan menyajikan analisis keuangan tahunan dan ekspor data. Hanya tersedia untuk <strong>Super Admin</strong> dan <strong>Admin</strong>.</p>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Isi Laporan &amp; Ekspor</div>
            <ul className="bullet-list">
              {[
                "Ringkasan tahunan: total pemasukan, pengeluaran, tabungan bersih, total aset",
                "Tren bulanan: grafik dan tabel pemasukan/pengeluaran per bulan",
                "Breakdown kategori: pengeluaran dan pemasukan dikelompokkan per kategori",
                "Export PDF — laporan terformat siap cetak untuk dokumentasi atau arsip",
                "Export CSV/Excel — data mentah untuk analisis lanjutan di spreadsheet",
                "Gunakan filter tahun di pojok kanan atas untuk memilih periode laporan",
              ].map((item) => (
                <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text">{item}</span></li>
              ))}
            </ul>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <div className="section-num">12</div>
            <div className="section-title">Pengaturan</div>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Profil Pengguna (semua role)</div>
            <ul className="bullet-list">
              {[
                "Foto Profil — upload avatar (maks 2MB, format JPG/PNG/WebP)",
                "Nama Lengkap — nama yang ditampilkan di seluruh aplikasi",
                "Email — email login (tidak bisa diubah dari sini)",
                "Ganti Password — ubah password melalui form yang tersedia",
              ].map((item) => (
                <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text">{item}</span></li>
              ))}
            </ul>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Manajemen Household (Super Admin)</div>
            <ul className="bullet-list">
              {[
                "Nama Household — ubah nama yang mewakili keluarga",
                "Undang Anggota — salin kode undangan atau kirim via WhatsApp",
                "Ubah Role — promosikan Member menjadi Admin atau turunkan kembali",
                "Keluarkan Anggota — hapus anggota (data transaksi mereka tetap tersimpan)",
              ].map((item) => (
                <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text">{item}</span></li>
              ))}
            </ul>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            HALAMAN 10 — BAB 13: TIPS & TRIK + PENUTUP
        ══════════════════════════════════════════ */}
        <div className="page">
          <div className="page-header">
            <span>Maalify — Panduan Penggunaan</span>
            <span>Bab 13 · Tips &amp; Trik</span>
          </div>

          <div className="section-header">
            <div className="section-num">13</div>
            <div className="section-title">Tips &amp; Trik</div>
          </div>

          <div className="tips-grid">
            <div className="tips-card">
              <div className="tips-card-title">⚡ Harian (5 Menit)</div>
              <ul className="bullet-list">
                {["Catat transaksi di hari yang sama", "Simpan struk sebagai referensi", "Gunakan Tambah Cepat di dashboard"].map(item => (
                  <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text" style={{ fontSize: "8.5pt" }}>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="tips-card">
              <div className="tips-card-title">📅 Mingguan (15 Menit)</div>
              <ul className="bullet-list">
                {["Review progress anggaran", "Rekonsiliasi saldo dompet", "Update progress tabungan"].map(item => (
                  <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text" style={{ fontSize: "8.5pt" }}>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="tips-card">
              <div className="tips-card-title">📊 Bulanan (30 Menit)</div>
              <ul className="bullet-list">
                {["Review laporan bulan berjalan", "Buat anggaran bulan depan", "Evaluasi savings goal", "Periksa hutang jatuh tempo"].map(item => (
                  <li key={item} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text" style={{ fontSize: "8.5pt" }}>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Praktik Terbaik</div>
            <ul className="bullet-list">
              {[
                ["Konsistensi kategori", "Gunakan kategori yang sama untuk jenis pengeluaran yang sama setiap bulan agar laporan lebih akurat"],
                ["Saldo awal akurat", "Saat pertama setup, isi saldo awal dompet sesuai saldo riil agar total aset benar"],
                ["Jangan skip transaksi kecil", "Pengeluaran kecil (parkir, jajan, tips) kalau dikumulatifkan sebulan bisa mencapai ratusan ribu"],
                ["Manfaatkan transaksi berulang", "Setup sekali untuk gaji dan tagihan rutin — sistem otomatis mencatat setiap bulan"],
                ["Gunakan visibilitas dengan bijak", "Beri tahu anggota keluarga tentang fitur Pribadi vs Bersama agar semua nyaman menggunakan app"],
                ["Diskusikan bersama keluarga", "Maalify paling efektif saat semua anggota aktif mencatat dan review bersama setiap bulan"],
              ].map(([t, d]) => (
                <li key={t} className="bullet-item"><span className="bullet-dot" /><span className="bullet-text"><strong>{t}</strong> — {d}</span></li>
              ))}
            </ul>
          </div>

          <div className="subsection">
            <div className="subsection-title"><span className="subsection-bar" /> Shortcut Berguna</div>
            <table className="shortcut-table">
              <thead><tr><th>Aksi</th><th>Cara Cepat</th></tr></thead>
              <tbody>
                {[
                  ["Tambah transaksi dari mana saja", "Klik + di header atau tombol cepat di Dashboard"],
                  ["Pindah antar bulan di Transaksi", "Klik panah ← → di atas tabel transaksi"],
                  ["Salin anggaran bulan lalu", "Halaman Anggaran → \"Salin dari bulan lalu\""],
                  ["Lihat detail goal tabungan", "Klik nama/ikon goal di halaman Tabungan"],
                  ["Filter transaksi per kategori", "Dropdown kategori di atas tabel transaksi"],
                  ["Cari transaksi global", "Tekan Ctrl+K (Windows) / ⌘+K (Mac) dari mana saja"],
                ].map(([a, c]) => (
                  <tr key={a}><td>{a}</td><td>{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Penutup */}
          <div style={{ marginTop: 24, padding: "16px 20px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #BBF7D0" }}>
            <div style={{ fontWeight: 700, color: "#166534", fontSize: "10.5pt", marginBottom: 6 }}>
              🎉 Selamat Menggunakan Maalify!
            </div>
            <p style={{ color: "#166534", fontSize: "9.5pt", margin: 0, lineHeight: 1.6 }}>
              Panduan ini mencakup semua fitur yang tersedia di Maalify saat ini. Untuk pertanyaan yang belum tercakup atau masalah teknis, kunjungi <strong>maalify.app/panduan</strong> untuk versi online yang selalu diperbarui, atau hubungi tim dukungan melalui halaman kontak.
            </p>
          </div>

          {/* Document footer */}
          <div style={{ position: "absolute", bottom: "18mm", left: "22mm", right: "22mm", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: 8 }}>
            <span style={{ fontSize: "7.5px", color: "#94A3B8" }}>Maalify — Platform Keuangan Keluarga Berbasis AI</span>
            <span style={{ fontSize: "7.5px", color: "#94A3B8" }}>© 2026 Maalify · maalify.app · Panduan v1.0</span>
          </div>
        </div>

      </div>
    </>
  );
}
