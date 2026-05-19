# System Architecture Document — Maalify

**Versi:** v1.0.0
**Tanggal:** 15 Mei 2026
**Status:** Draft
**Penulis:** Rizman
**Stack Utama:** Next.js 14 + Supabase + Vercel
**Dokumen Terkait:** [PRD.md](./PRD.md) · [ERD.md](./ERD.md)

---

## 1. Executive Summary

Dokumen ini mendeskripsikan arsitektur teknikal keseluruhan sistem Maalify — platform SaaS pencatatan keuangan keluarga berbasis web. Dokumen ini menjadi rujukan utama untuk tim pengembang, DevOps, dan stakeholder teknikal dalam memahami bagaimana komponen-komponen sistem berinteraksi, keputusan teknologi yang diambil, dan alasan di balik setiap pilihan arsitektur.

> **Prinsip Utama:** *Simplicity First* — pilih stack yang paling produktif untuk tim kecil, bukan yang paling kompleks. Semua komponen dapat di-scale secara independen seiring pertumbuhan pengguna.

---

## 2. Architecture Overview

### 2.1 Architectural Pattern

Maalify menggunakan pola arsitektur **Serverless Full-Stack** dengan pendekatan **Backend-as-a-Service (BaaS)**. Pilihan ini memungkinkan tim kecil untuk bergerak cepat tanpa harus mengelola infrastruktur server secara manual.

| Aspek | Keputusan | Alasan |
|---|---|---|
| Pattern | Serverless + BaaS | Minimal ops overhead, auto-scaling built-in |
| Rendering | SSR + CSR hybrid (Next.js) | SEO-friendly + interaktif seperti SPA |
| API | REST via Next.js API Routes | Simple, well-understood, cepat dikembangkan |
| Database | Managed PostgreSQL | ACID compliance, RLS built-in, familiar |
| Multi-tenant | Shared DB + RLS | Cost-efficient untuk early stage SaaS |
| Auth | JWT + Session (Supabase) | Secure, stateless, terintegrasi dengan DB |

### 2.2 Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│              Browser (React 18 + Next.js)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                   CDN & EDGE LAYER                          │
│     Vercel Edge Network · Next.js Middleware · Analytics    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  APPLICATION LAYER                          │
│   Next.js App Router · API Routes · Background Jobs        │
└──────┬───────────────────┬───────────────────┬─────────────┘
       │                   │                   │
┌──────▼──────┐  ┌─────────▼──────┐  ┌────────▼────────┐
│ Supabase    │  │  Supabase DB   │  │ Supabase        │
│ Auth        │  │  (PostgreSQL)  │  │ Storage         │
└─────────────┘  └────────────────┘  └─────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
│         Resend (Email) · Google OAuth · Sentry              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Layer-by-Layer Breakdown

### 3.1 Client Layer

Pengguna mengakses Maalify melalui browser modern. Aplikasi dirender menggunakan React 18 dengan Next.js App Router.

#### Tech Stack Frontend

| Teknologi | Versi | Fungsi |
|---|---|---|
| Next.js | 14 (App Router) | Framework React utama, SSR + CSR hybrid |
| React | 18 | UI library, Server Components + Client Components |
| Tailwind CSS | 3.x | Utility-first CSS, responsive design system |
| shadcn/ui | Latest | Komponen UI pre-built (forms, modals, tables) |
| Recharts | 2.x | Library grafik untuk dashboard (line, pie, bar chart) |
| React Query | 5.x | Server state management, caching, background refetch |
| Zustand | 4.x | Client state management (UI state, filters) |
| React Hook Form | 7.x | Form handling dan validasi yang performant |
| Zod | 3.x | Schema validation (frontend + API types) |

#### Rendering Strategy

- **Server Components (RSC):** Halaman dashboard, laporan, list transaksi — data diambil langsung di server, tidak butuh loading state.
- **Client Components:** Form input transaksi, modal, grafik interaktif — butuh event handler browser.
- **Server Actions:** Mutasi data (create/update/delete) langsung dari komponen tanpa API call manual.

---

### 3.2 CDN & Edge Layer

Vercel bertindak sebagai platform deployment sekaligus CDN global.

| Komponen | Fungsi |
|---|---|
| Vercel Edge Network | CDN global 100+ PoP, distribusi static assets |
| Next.js Middleware | Validasi session JWT, proteksi route, redirect unauthenticated user |
| Vercel Analytics | Core Web Vitals monitoring, real-time traffic dashboard |
| Automatic HTTPS | SSL certificate otomatis, HTTP → HTTPS redirect |
| Image Optimization | Next.js `<Image>` komponen, WebP conversion, lazy loading otomatis |

---

### 3.3 Application Layer

#### Struktur Direktori (Next.js App Router)

```
maalify/
├── app/
│   ├── (auth)/              → Login, Register, Forgot Password
│   ├── (dashboard)/         → Protected routes (household required)
│   │   ├── dashboard/       → Overview & charts
│   │   ├── transactions/    → List & CRUD transaksi
│   │   ├── wallets/         → Manajemen dompet
│   │   ├── budgets/         → Budget per kategori
│   │   ├── debts/           → Hutang & piutang
│   │   └── reports/         → Laporan bulanan & export
│   └── api/                 → REST API endpoints
│       ├── transactions/
│       ├── wallets/
│       ├── categories/
│       ├── budgets/
│       └── reports/
├── components/              → Reusable UI components
├── lib/                     → Supabase client, utilities, helpers
└── types/                   → TypeScript types & Zod schemas
```

#### API Design Conventions

| Method | Pattern | Contoh | Fungsi |
|---|---|---|---|
| GET | `/api/{resource}` | `/api/transactions` | List semua resource |
| GET | `/api/{resource}/{id}` | `/api/transactions/123` | Get satu resource |
| POST | `/api/{resource}` | `/api/transactions` | Create resource baru |
| PATCH | `/api/{resource}/{id}` | `/api/transactions/123` | Update sebagian field |
| DELETE | `/api/{resource}/{id}` | `/api/transactions/123` | Hapus resource |

#### Background Jobs

Dijalankan via Supabase Edge Functions + `pg_cron`:

| Job | Jadwal | Fungsi |
|---|---|---|
| `generate_recurring_transactions` | Setiap hari 00:05 WIB | Generate transaksi dari template `recurring_transactions` |
| `check_budget_alerts` | Setiap jam | Cek pengeluaran vs budget, kirim notifikasi jika ≥ 80% |
| `send_debt_reminders` | Setiap hari 08:00 WIB | Kirim reminder email hutang H-7 dan H-1 |
| `update_debt_status` | Setiap hari 01:00 WIB | Update status hutang ke `overdue` jika lewat `due_date` |

---

### 3.4 Backend Layer (Supabase)

#### 3.4.1 Supabase Auth

| Fitur Auth | Detail |
|---|---|
| Email/Password | Registrasi dengan verifikasi email wajib sebelum akses penuh |
| Google OAuth | Login satu klik via Google, auto-create akun baru |
| JWT Token | Access token (1 jam) + Refresh token (30 hari), dirotasi otomatis |
| Session Management | Supabase JS client mengelola token refresh secara otomatis |
| Password Reset | Email magic link untuk reset password |
| RLS Integration | `auth.uid()` tersedia di setiap query PostgreSQL untuk RLS policy |

#### 3.4.2 PostgreSQL Database

| Fitur DB | Implementasi di Maalify |
|---|---|
| Row Level Security (RLS) | Setiap tabel punya policy: user hanya bisa akses data Household-nya |
| Realtime Subscriptions | Dashboard update otomatis jika anggota lain catat transaksi baru |
| Database Triggers | Auto-update `current_balance` di wallets setiap ada transaksi baru |
| pg_cron | Scheduled jobs untuk generate recurring transactions & alerts |
| Full-text Search | Pencarian transaksi by description menggunakan `tsvector` |
| Point-in-time Recovery | Backup continuous, bisa restore ke detik manapun dalam 30 hari |
| Connection Pooling | pgBouncer handle ribuan concurrent connections dengan efisien |

#### 3.4.3 Supabase Storage

| Bucket | Konten | Access Policy |
|---|---|---|
| `avatars` | Foto profil pengguna | Public read, auth write (own file only) |
| `receipts` | Lampiran bukti transaksi | Private — hanya anggota Household yang sama |

#### 3.4.4 Database Triggers (Auto-update Saldo)

- **INSERT transaksi income** → `current_balance += amount` pada wallet terkait
- **INSERT transaksi expense** → `current_balance -= amount` pada wallet terkait
- **INSERT transfer** → `from_wallet.current_balance -= amount`, `to_wallet.current_balance += amount`
- **DELETE / UPDATE transaksi** → Trigger reversal dan re-apply nilai baru
- **INSERT debt_payment** → `debts.remaining_amount -= amount` secara otomatis

---

### 3.5 External Services

| Service | Provider | Fungsi | Integrasi |
|---|---|---|---|
| Email Transaksional | Resend | Kirim alert budget, reminder hutang, welcome email | API call dari Supabase Edge Function |
| OAuth Provider | Google | Social login untuk kemudahan registrasi | Supabase Auth built-in provider |
| Error Tracking | Sentry | Monitor runtime error di frontend dan API routes | Sentry SDK di Next.js |
| Payment Gateway | Stripe | Billing langganan — **FUTURE SCOPE, belum v1** | Supabase Webhook + Stripe Events |
| Uptime Monitoring | Uptime Robot | Monitor ketersediaan endpoint publik, alert tim | External ping setiap 5 menit |

---

## 4. Security Architecture

### 4.1 Authentication & Authorization

| Layer | Mekanisme | Detail |
|---|---|---|
| Transport | HTTPS/TLS 1.3 | Semua komunikasi dienkripsi; HTTP auto-redirect ke HTTPS |
| Authentication | JWT (Supabase Auth) | Token expire 1 jam, refresh token 30 hari, rotasi otomatis |
| Authorization | Row Level Security | Database-level policy, tidak bisa di-bypass dari aplikasi |
| Middleware | Next.js Middleware | Validasi session sebelum setiap request ke protected route |
| API Routes | Server-side validation | Setiap API route validasi token dan membership Household |

### 4.2 Data Security

- **Enkripsi at-rest:** Database dan Storage Supabase dienkripsi AES-256 secara default.
- **Enkripsi in-transit:** TLS 1.3 untuk semua koneksi client-server dan server-database.
- **Password hashing:** Bcrypt dengan salt, dikelola sepenuhnya oleh Supabase Auth.
- **Input validation:** Zod schema validation di frontend dan API routes untuk cegah injection.
- **SQL injection prevention:** Semua query menggunakan Supabase client dengan parameterized queries.
- **File upload validation:** MIME type check, size limit (5MB), scan di server sebelum disimpan.
- **Environment variables:** Secret key tidak pernah di-commit ke repo; dikelola via Vercel env vars.

### 4.3 Multi-Tenant Isolation

> Maalify menggunakan **Shared Database Multi-Tenancy** dengan Row Level Security. Pendekatan ini lebih cost-efficient dibanding database-per-tenant pada skala awal, dengan isolasi data yang dijamin oleh PostgreSQL pada level query.

| Aspek | Pendekatan | Implementasi |
|---|---|---|
| Data Isolation | RLS per Household | `auth.uid() IN (SELECT user_id FROM household_members WHERE household_id = ...)` |
| API Isolation | Server-side check | Setiap API route verifikasi user adalah anggota Household yang diminta |
| Storage Isolation | Bucket + RLS | Supabase Storage policy terikat pada `household_id` file metadata |
| Migration Path | Schema-per-tenant | Jika > 10.000 tenant, pertimbangkan migrasi ke schema isolation |

---

## 5. Key Data Flows

### 5.1 Alur: User Login

| Step | Aktor | Aksi |
|---|---|---|
| 1 | User | Masukkan email + password di halaman login |
| 2 | Next.js | Submit form → `POST /api/auth/login` |
| 3 | Supabase Auth | Verifikasi credentials, generate JWT + Refresh Token |
| 4 | Next.js | Simpan token di secure HTTP-only cookie |
| 5 | Middleware | Setiap request selanjutnya: validasi cookie, decode JWT |
| 6 | User | Diarahkan ke halaman Dashboard |

### 5.2 Alur: Catat Transaksi Baru

| Step | Aktor | Aksi |
|---|---|---|
| 1 | User | Isi form transaksi (nominal, kategori, dompet, tanggal) |
| 2 | React | Validasi Zod schema di client-side sebelum submit |
| 3 | API Route | `POST /api/transactions` — validasi token, cek membership Household |
| 4 | PostgreSQL | `INSERT` ke tabel `transactions` |
| 5 | DB Trigger | Auto-update `current_balance` pada wallet terkait |
| 6 | Realtime | Supabase broadcast perubahan ke semua anggota yang sedang online |
| 7 | Dashboard | Komponen dashboard update otomatis via React Query invalidation |

### 5.3 Alur: Alert Budget Terlampaui

| Step | Aktor | Aksi |
|---|---|---|
| 1 | pg_cron | Job `check_budget_alerts` dijalankan setiap jam |
| 2 | PostgreSQL | Query: bandingkan `SUM(transactions.amount)` vs `budgets.amount` per kategori |
| 3 | Edge Function | Identifikasi budget yang sudah ≥ 80% terpakai |
| 4 | notifications | `INSERT` notifikasi baru ke tabel `notifications` |
| 5 | Resend API | Kirim email peringatan ke email Admin Household |
| 6 | Dashboard | Badge notifikasi muncul di header saat user buka aplikasi |

---

## 6. Infrastructure & Deployment

### 6.1 Deployment Architecture

| Komponen | Provider | Region | Plan |
|---|---|---|---|
| Frontend + API | Vercel | Global (CDN) + SIN1 (Singapore) | Pro |
| Database | Supabase | ap-southeast-1 (Singapore) | Pro |
| Storage | Supabase | ap-southeast-1 (Singapore) | Included in Pro |
| Auth | Supabase | ap-southeast-1 (Singapore) | Included in Pro |
| Email | Resend | Global | Starter (Free 3.000/mo) |
| Error Tracking | Sentry | Global | Developer (Free) |

### 6.2 CI/CD Pipeline

| Langkah | Detail |
|---|---|
| Developer push code | `git push` ke branch `feature/*` |
| GitHub PR | Buat Pull Request ke branch `main` |
| Vercel Preview | Vercel otomatis build & deploy ke URL preview unik |
| Review & Approve | Code review + QA di preview URL |
| Merge to main | PR di-merge ke branch `main` |
| Vercel Production | Auto-deploy ke production URL (`app.maalify.com`) |
| Health Check | Uptime Robot verifikasi endpoint dalam 5 menit |

### 6.3 Environment Strategy

| Environment | Branch | URL | Database |
|---|---|---|---|
| Development | `feature/*` | `localhost:3000` | Supabase local (docker) |
| Preview | any PR | `maalify-<hash>.vercel.app` | Supabase Staging project |
| Production | `main` | `app.maalify.com` | Supabase Production project |

---

## 7. Scalability & Performance

### 7.1 Performance Targets

| Metrik | Target | Strategi |
|---|---|---|
| Page Load Time | < 2s (4G) | SSR + static generation, CDN caching, image optimization |
| API Response | < 500ms P95 | DB indexes, connection pooling, server components |
| Time to Interactive | < 3s | Code splitting, lazy loading, React Suspense |
| Core Web Vitals | All Green | Next.js Image, font optimization, minimal JS bundle |
| Database Query | < 100ms P99 | Proper indexes, RLS-aware queries, pgBouncer pooling |

### 7.2 Caching Strategy

| Layer | Mekanisme | TTL | Konten |
|---|---|---|---|
| CDN | Vercel Edge Cache | Stale-while-revalidate | Static pages, assets |
| Server | Next.js Full Route Cache | Per revalidation tag | Dashboard data, reports |
| Client | React Query | 5 menit (stale time) | API responses di browser |
| Database | PostgreSQL `shared_buffers` | In-memory | Frequently accessed rows |

### 7.3 Scaling Roadmap

| Fase | Threshold | Action |
|---|---|---|
| Early Stage | 0 – 5.000 household | Current architecture, Supabase Pro cukup |
| Growth Stage | 5.000 – 50.000 household | Upgrade Supabase plan, read replicas untuk laporan |
| Scale Stage | 50.000+ household | Evaluasi schema-per-tenant, dedicated DB per region |
| Enterprise | 500.000+ household | Kubernetes, dedicated infra, custom sharding strategy |

---

## 8. Observability & Monitoring

### 8.1 Monitoring Stack

| Layer | Tool | Yang Dipantau |
|---|---|---|
| Frontend Performance | Vercel Analytics | Core Web Vitals, page load, traffic breakdown |
| Error Tracking | Sentry | JS errors, API errors, stack traces, user context |
| Database | Supabase Dashboard | Query performance, active connections, DB size |
| Uptime | Uptime Robot | HTTP endpoint check setiap 5 menit, alert via email |
| Logs | Vercel Logs | API route logs, build logs, serverless function logs |
| Alerts | Sentry + Uptime Robot | Email/Slack alert saat error spike atau downtime |

### 8.2 Alert Thresholds

| Kondisi | Threshold | Notifikasi |
|---|---|---|
| Downtime | Endpoint tidak response > 1 menit | Email + Slack tim |
| Error Rate Spike | > 5% request error dalam 5 menit | Sentry alert ke lead dev |
| Slow API | P95 latency > 2 detik | Sentry performance alert |
| DB Connection High | > 80% connection pool used | Supabase alert email |
| Storage Usage | > 80% quota used | Manual review bulanan |

---

## 9. Architecture Decision Records (ADR)

### ADR-001: Gunakan Supabase sebagai backend utama

**Konteks:** Tim kecil, tidak ada DevOps dedicated. Butuh auth, database, storage, realtime dalam satu paket.

**Keputusan:** Supabase menyediakan semua kebutuhan backend dengan DX yang sangat baik. PostgreSQL memberikan fondasi yang solid untuk scale ke depan. Alternatif (Firebase, PlanetScale + custom auth) lebih kompleks untuk dikonfigurasi.

**Konsekuensi:** Lock-in vendor cukup tinggi. Migration plan: Supabase menggunakan PostgreSQL standar, sehingga bisa migrasi ke PostgreSQL self-hosted jika diperlukan.

---

### ADR-002: Shared Database Multi-Tenancy dengan RLS

**Konteks:** Pilih strategi multi-tenancy: separate database, schema-per-tenant, atau shared database.

**Keputusan:** Shared DB + RLS dipilih karena (1) paling murah di early stage, (2) PostgreSQL RLS memberikan isolasi yang kuat, (3) operasional paling sederhana. Database-per-tenant terlalu mahal untuk ratusan household kecil.

**Konsekuensi:** Perlu migrasi jika ada household enterprise yang butuh dedicated resource. Migration path sudah direncanakan di scalability roadmap.

---

### ADR-003: Next.js App Router (bukan Pages Router)

**Konteks:** Next.js 14 memperkenalkan App Router yang berbeda signifikan dari Pages Router.

**Keputusan:** App Router dipilih karena (1) React Server Components mengurangi JS bundle yang dikirim ke client, (2) Streaming dan Suspense built-in, (3) Ini masa depan Next.js — investasi jangka panjang.

**Konsekuensi:** Learning curve lebih tinggi, ekosistem library belum semua kompatibel. Mitigasi: gunakan adapter/wrapper untuk library yang belum support RSC.

---

### ADR-004: REST API (bukan GraphQL atau tRPC)

**Konteks:** Pilih API paradigma untuk komunikasi frontend-backend.

**Keputusan:** REST dipilih karena (1) Tim familiar dengan REST, (2) Supabase sudah punya PostgREST built-in untuk CRUD sederhana, (3) Kompleksitas GraphQL tidak justified untuk scope v1.

**Konsekuensi:** Untuk query kompleks (laporan lintas tabel), REST bisa verbose. Solusi: gunakan Supabase client langsung di Server Components untuk query kompleks.

---

## 10. Disaster Recovery & Business Continuity

### 10.1 Backup Strategy

| Data | Backup Method | Retention | RTO |
|---|---|---|---|
| PostgreSQL | Supabase PITR (continuous) | 30 hari | < 1 jam |
| Storage files | Supabase Storage redundancy | 30 hari | < 2 jam |
| Environment Config | Vercel env vars + Git repo | Indefinite | < 30 menit |
| Source Code | GitHub (main + tags) | Indefinite | < 15 menit |

### 10.2 Incident Response

| Severity | Definisi | Response Time | Escalation |
|---|---|---|---|
| P0 - Critical | Aplikasi tidak bisa diakses sama sekali | < 15 menit | Immediate — semua tim |
| P1 - High | Fitur utama tidak berfungsi (transaksi) | < 1 jam | Lead dev + PM |
| P2 - Medium | Fitur sekunder terganggu | < 4 jam | Lead dev |
| P3 - Low | Bug minor, UI issue | < 24 jam | Developer yang tersedia |

---

*Maalify SAD v1.0.0 — 15 Mei 2026 — Confidential*
