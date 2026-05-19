# Product Requirements Document — Maalify

**Versi:** v1.0.0
**Tanggal:** 15 Mei 2026
**Status:** Draft
**Penulis:** Rizman
**Platform:** Web Application (SaaS)

---

## 1. Executive Summary

Maalify adalah platform SaaS berbasis web yang dirancang untuk membantu keluarga mengelola keuangan rumah tangga secara terstruktur, transparan, dan mudah dipahami. Sistem ini memungkinkan setiap keluarga memiliki akun sendiri dengan kemampuan multi-pengguna di dalam satu household, mencatat pemasukan dan pengeluaran, mengelola anggaran, memantau utang/pinjaman, serta melihat laporan keuangan dalam bentuk grafik dan dashboard interaktif.

> **Visi:** Menjadi solusi pencatatan keuangan keluarga #1 di Asia Tenggara — sederhana, aman, dan dapat diakses dari mana saja.

| Atribut | Detail |
|---|---|
| Nama Produk | Maalify |
| Tipe | SaaS Web Application |
| Target Pengguna | Keluarga (multi-household, multi-user) |
| Platform | Web (Desktop & Mobile Browser) |
| Bahasa | Bahasa Indonesia (utama), English (opsional) |
| Monetisasi | Freemium + Subscription bulanan/tahunan |

---

## 2. Problem Statement

Banyak keluarga di Indonesia masih mengelola keuangan secara manual menggunakan buku catatan atau spreadsheet yang tidak terstruktur. Hal ini menyebabkan berbagai masalah nyata:

- Tidak ada visibilitas real-time terhadap kondisi keuangan keluarga secara keseluruhan.
- Sulit memantau pengeluaran berlebih per kategori karena tidak ada sistem peringatan.
- Pengelolaan hutang dan cicilan dilakukan terpisah dan sering terlupakan.
- Anggota keluarga lain tidak bisa berkolaborasi mencatat secara bersamaan.
- Laporan dan analisis keuangan membutuhkan waktu lama jika dibuat manual.

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

- Mendapatkan 1.000 keluarga aktif dalam 6 bulan pertama sejak launch.
- Mencapai konversi free-to-paid sebesar 15% dalam tahun pertama.
- Mempertahankan Monthly Active User (MAU) rate di atas 70%.
- Net Promoter Score (NPS) ≥ 40 dalam 12 bulan pertama.

### 3.2 Product Goals

- Pengguna dapat mencatat transaksi dalam waktu < 30 detik.
- Dashboard menampilkan ringkasan keuangan yang dapat dipahami dalam < 1 menit.
- Sistem berjalan dengan uptime ≥ 99.5%.
- Semua halaman memuat dalam < 2 detik pada koneksi 4G.

---

## 4. Target Users & Personas

Maalify dirancang untuk keluarga yang ingin mengelola keuangan bersama secara digital. Terdapat dua tipe utama pengguna dalam satu akun keluarga (household):

### 4.1 User Personas

| | Kepala Keuangan (Admin) | Anggota Keluarga (Member) |
|---|---|---|
| **Profil** | Dewasa 25–45 tahun, bertanggung jawab atas keuangan keluarga, melek teknologi, menggunakan smartphone/laptop. | Pasangan atau anggota keluarga lain, ingin tahu kondisi keuangan, mencatat pengeluaran harian. |
| **Kebutuhan Utama** | Kontrol penuh atas budget, laporan komprehensif, manajemen akun & anggota. | Kemudahan catat transaksi cepat, lihat ringkasan, akses dashboard. |

---

## 5. Features & Requirements

> **Prioritas:** `P0` = Critical (MVP) | `P1` = High (Launch) | `P2` = Medium (Post-launch)

### 5.1 Manajemen Akun & Household

| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F-01 | Registrasi & Login | Pengguna dapat mendaftar dengan email/password. Mendukung Google OAuth. Verifikasi email wajib sebelum akses penuh. | P0 |
| F-02 | Manajemen Household | Setiap akun membuat/bergabung ke satu Household (unit keluarga). Admin dapat mengundang anggota via email atau kode undangan. | P0 |
| F-03 | Role & Permission | Dua role: Admin (akses penuh) dan Member (catat transaksi, lihat laporan). Admin dapat mengubah role anggota. | P0 |
| F-04 | Profil Pengguna | Pengguna dapat mengubah nama, foto profil, dan password. | P1 |

### 5.2 Dompet (Wallet)

| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F-05 | Multi Dompet | Setiap Household dapat membuat beberapa dompet (contoh: Dompet Utama, Tabungan, Dompet Istri). Setiap dompet memiliki saldo awal dan mata uang. | P0 |
| F-06 | Transfer Antar Dompet | Pengguna dapat memindahkan dana antar dompet dalam satu Household. Transfer tercatat sebagai transaksi khusus. | P0 |
| F-07 | Saldo Real-time | Saldo setiap dompet diperbarui otomatis setiap kali ada transaksi baru. | P0 |

### 5.3 Transaksi

| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F-08 | Catat Pemasukan | Pengguna dapat mencatat pemasukan dengan nominal, tanggal, kategori, dompet tujuan, dan catatan opsional. | P0 |
| F-09 | Catat Pengeluaran | Pengguna dapat mencatat pengeluaran dengan nominal, tanggal, kategori, dompet sumber, dan catatan opsional. | P0 |
| F-10 | Kategori Kustom | Admin dapat membuat, mengedit, dan menghapus kategori transaksi (income/expense) sesuai kebutuhan keluarga. Sistem menyediakan kategori default. | P0 |
| F-11 | Edit & Hapus Transaksi | Pengguna dapat mengedit atau menghapus transaksi yang sudah dicatat. Member hanya dapat mengedit transaksi milik sendiri. | P0 |
| F-12 | Lampiran Bukti | Pengguna dapat melampirkan foto struk/nota pada setiap transaksi (max 5MB per file). | P1 |
| F-13 | Transaksi Berulang | Pengguna dapat mengatur transaksi otomatis berulang (harian/mingguan/bulanan) untuk pengeluaran rutin seperti listrik, internet, dll. | P1 |

### 5.4 Anggaran (Budget)

| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F-14 | Buat Budget per Kategori | Admin dapat menetapkan batas anggaran untuk setiap kategori pengeluaran per periode (bulanan). | P0 |
| F-15 | Notifikasi Batas Budget | Sistem mengirim notifikasi in-app saat pengeluaran mencapai 80% dan 100% dari budget yang ditetapkan. | P0 |
| F-16 | Overview Budget | Halaman khusus menampilkan progress penggunaan budget per kategori dalam bentuk progress bar. | P0 |

### 5.5 Hutang & Pinjaman

| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F-17 | Catat Hutang (Saya Berhutang) | Pengguna dapat mencatat hutang kepada pihak lain: nominal, pemberi hutang, tanggal jatuh tempo, dan cicilan. | P0 |
| F-18 | Catat Piutang (Orang Berhutang ke Saya) | Pengguna dapat mencatat piutang dari pihak lain: nominal, debitur, tanggal jatuh tempo. | P0 |
| F-19 | Catat Pembayaran Cicilan | Setiap pembayaran cicilan tercatat dan mengurangi sisa hutang/piutang secara otomatis. | P0 |
| F-20 | Reminder Jatuh Tempo | Notifikasi otomatis H-7 dan H-1 sebelum tanggal jatuh tempo hutang. | P1 |

### 5.6 Projects & Financial Goals

| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F-26 | Buat Project | User dapat membuat project keuangan baru (Trip, Pernikahan, Beli Rumah, dll) dengan nama, tipe, target tanggal, dan total anggaran. Setiap project otomatis membuat dompet dedicated baru. | P0 |
| F-27 | Rincian Anggaran Project | Admin/Member dapat menambah item rincian anggaran per project (contoh: Tiket, Hotel, Makan) beserta nominal yang direncanakan. Setiap item bisa di-mark sebagai sudah dibayar. | P0 |
| F-28 | Kontribusi ke Project | Semua anggota household dapat melakukan top-up / kontribusi ke dompet project. Setiap kontribusi tercatat sebagai transfer dari dompet sumber ke dompet project. | P0 |
| F-29 | Tag Transaksi ke Project | Saat mencatat pengeluaran dari dompet project, transaksi otomatis ter-link ke project tersebut. User juga bisa manual tag transaksi dari dompet lain ke project. | P0 |
| F-30 | Progress Tracker | Halaman detail project menampilkan: progress bar (terkumpul vs target), countdown hari menuju target tanggal, checklist rincian anggaran, dan riwayat kontribusi anggota. | P0 |
| F-31 | Notifikasi Project | Sistem mengirim notifikasi: (1) H-30 dan H-7 sebelum target tanggal jika dana belum cukup, (2) saat project mencapai 100% target dana, (3) saat anggota melakukan kontribusi. | P1 |
| F-32 | Selesaikan / Arsip Project | Admin dapat menandai project sebagai Completed atau Cancelled. Dana sisa di dompet project bisa ditransfer balik ke dompet utama. | P0 |

### 5.7 Laporan & Dashboard

| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| F-21 | Dashboard Utama | Menampilkan: total saldo semua dompet, pemasukan & pengeluaran bulan ini, grafik donat pengeluaran per kategori, transaksi terbaru. | P0 |
| F-22 | Grafik Tren Bulanan | Grafik garis/batang menampilkan perbandingan pemasukan vs pengeluaran per bulan selama 6–12 bulan terakhir. | P0 |
| F-23 | Laporan Bulanan | Ringkasan keuangan bulanan: total pemasukan, pengeluaran, tabungan, breakdown per kategori, dan perbandingan dengan bulan sebelumnya. | P0 |
| F-24 | Export Laporan | Pengguna dapat mengekspor laporan dalam format PDF atau Excel untuk periode yang dipilih. | P1 |
| F-25 | Grafik Donat Kategori | Visualisasi pengeluaran per kategori dalam bentuk pie/donut chart interaktif. | P0 |

---

## 6. Non-Functional Requirements

| Aspek | Requirement |
|---|---|
| **Performa** | Halaman utama load < 2s pada koneksi 4G. API response < 500ms untuk operasi CRUD. |
| **Keamanan** | HTTPS wajib. Data keuangan dienkripsi at-rest & in-transit. Row Level Security (RLS) memastikan data household terisolasi. |
| **Skalabilitas** | Arsitektur mampu mendukung 10.000+ household tanpa degradasi performa signifikan. |
| **Ketersediaan** | Uptime target ≥ 99.5% (downtime maks ~3.6 jam/bulan). Maintenance window dijadwalkan di luar jam sibuk. |
| **Kompatibilitas** | Support browser: Chrome, Firefox, Safari, Edge (2 versi terakhir). Responsive untuk layar 320px–1920px. |
| **Privasi** | Kepatuhan terhadap regulasi perlindungan data. Tidak ada data pengguna yang dijual ke pihak ketiga. |
| **Backup** | Backup database otomatis setiap 24 jam. Point-in-time recovery tersedia untuk 30 hari terakhir. |

---

## 7. Rekomendasi Tech Stack

> Rekomendasi ini dipilih berdasarkan kemudahan pengembangan, ekosistem yang matang, dan kesesuaian untuk SaaS multi-tenant dengan skala menengah.

| Layer | Teknologi | Alasan |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | React framework modern dengan SSR/SSG built-in. Optimal untuk performa dan SEO. |
| **UI Library** | Tailwind CSS + shadcn/ui | Utility-first CSS yang cepat dikembangkan. shadcn/ui menyediakan komponen profesional siap pakai. |
| **Charts** | Recharts | Library grafik berbasis React yang ringan dan mudah dikustomisasi untuk dashboard. |
| **Backend** | Next.js API Routes + Supabase Edge Functions | Serverless API yang terintegrasi dengan frontend. Minimal overhead operasional. |
| **Database** | Supabase (PostgreSQL) | PostgreSQL managed dengan Row Level Security (RLS) bawaan — ideal untuk isolasi data multi-tenant. |
| **Auth** | Supabase Auth | Mendukung email/password dan OAuth (Google). Session management otomatis. |
| **Storage** | Supabase Storage | Penyimpanan file untuk lampiran bukti transaksi dengan akses terkontrol per household. |
| **Deployment** | Vercel | Platform deployment untuk Next.js dengan CDN global, preview deployments, dan auto-scaling. |
| **Monitoring** | Vercel Analytics + Sentry | Analytics performa dan error tracking real-time untuk menjaga kualitas produksi. |

---

## 8. User Stories (MVP)

| ID | Sebagai | Saya ingin... | Supaya... |
|---|---|---|---|
| US-01 | Admin | mendaftarkan keluarga saya ke platform | semua anggota keluarga bisa menggunakan satu akun bersama |
| US-02 | Admin | mengundang anggota keluarga | mereka bisa ikut mencatat transaksi |
| US-03 | Member | mencatat pengeluaran harian dengan cepat | saldo dompet saya selalu akurat |
| US-04 | Member | mencatat pemasukan bulanan | total pemasukan keluarga terpantau |
| US-05 | Admin | membuat beberapa dompet (Dompet Utama, Tabungan) | saldo tiap pos keuangan terpisah dan jelas |
| US-06 | Admin | menetapkan budget per kategori | pengeluaran keluarga tidak melebihi batas |
| US-07 | Member | mendapat notifikasi saat budget hampir habis | saya bisa mengontrol pengeluaran lebih baik |
| US-08 | Admin | mencatat hutang dan cicilan | saya tidak lupa membayar kewajiban |
| US-09 | Member | melihat dashboard ringkasan keuangan | saya tahu kondisi keuangan keluarga hari ini |
| US-10 | Admin | melihat laporan bulanan dengan grafik | saya bisa evaluasi pola pengeluaran keluarga |
| US-11 | Admin | membuat project "Trip ke Malang" dengan rincian anggaran | semua kebutuhan trip sudah terencana dengan jelas |
| US-12 | Member | berkontribusi ke project pernikahan keluarga | saya ikut membantu mengumpulkan dana bersama |
| US-13 | Member | melihat progress project dan berapa yang masih kurang | saya tahu harus menabung berapa lagi |
| US-14 | Admin | men-check item anggaran yang sudah dibayar | saya tahu mana yang sudah dan belum dibayarkan |

---

## 9. Out of Scope (v1.0)

Fitur berikut tidak termasuk dalam scope versi pertama dan akan dievaluasi untuk roadmap selanjutnya:

- Integrasi langsung dengan rekening bank atau dompet digital (e-wallet)
- Aplikasi mobile native (iOS/Android) — v1 hanya web responsive
- Fitur investasi dan portofolio saham/reksa dana
- Multi-currency dalam satu transaksi
- AI financial advisor / chatbot keuangan
- Laporan pajak otomatis
- Fitur splitting bill antar anggota keluarga

---

## 10. Proposed Timeline (MVP)

| Fase | Durasi | Deliverable |
|---|---|---|
| **Fase 1 — Fondasi** | Minggu 1–3 | Setup project, arsitektur, auth, manajemen household & dompet, CRUD transaksi dasar |
| **Fase 2 — Core Features** | Minggu 4–6 | Kategori kustom, budget & notifikasi, manajemen hutang/piutang |
| **Fase 3 — Dashboard & Projects** | Minggu 7–9 | Dashboard interaktif, grafik laporan bulanan, tren keuangan, Projects & Financial Goals |
| **Fase 4 — Polish & Launch** | Minggu 10–12 | QA & testing, optimasi performa, onboarding flow, soft launch |

---

## 11. Assumptions & Constraints

### Assumptions

- Pengguna memiliki akses internet yang memadai untuk menggunakan aplikasi web.
- Mata uang default adalah Rupiah (IDR); dukungan multi-mata uang di luar scope v1.
- Satu household maksimal 10 anggota pada plan Freemium.
- Pengguna bertanggung jawab atas keakuratan data yang mereka masukkan.

### Constraints

- Budget pengembangan terbatas — prioritas pada fitur P0 untuk MVP.
- Tim kecil — arsitektur harus mendukung development yang cepat dan iteratif.
- Tidak ada integrasi bank di v1 — semua input manual oleh pengguna.

---

## 12. Glossary

| Istilah | Definisi |
|---|---|
| **Household** | Unit keluarga dalam sistem; satu keluarga = satu Household. |
| **Admin** | Pengguna dengan akses penuh dalam sebuah Household. |
| **Member** | Anggota Household dengan akses terbatas (catat & lihat). |
| **Dompet** | Akun keuangan virtual dalam satu Household (rekening, tunai, tabungan, dll). |
| **Transaksi** | Setiap pencatatan pemasukan, pengeluaran, atau transfer. |
| **Budget** | Batas anggaran yang ditetapkan per kategori per periode. |
| **SaaS** | Software as a Service — perangkat lunak berbasis langganan melalui internet. |
| **RLS** | Row Level Security — fitur PostgreSQL untuk isolasi data per pengguna/tenant. |
| **MVP** | Minimum Viable Product — versi produk dengan fitur inti minimum yang siap diluncurkan. |

---

*Maalify PRD v1.0.0 — 15 Mei 2026 — Confidential*
