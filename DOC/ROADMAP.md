# Development Roadmap — Maalify

**Versi:** v1.0.0
**Tanggal:** 19 Mei 2026
**Target Launch:** 12 Minggu dari kick-off
**Dokumen Terkait:** [PRD.md](./PRD.md) · [ERD.md](./ERD.md) · [SAD.md](./SAD.md) · [DESIGN.md](./DESIGN.md)

---

> **Prioritas:** `P0` = MVP (wajib ada) · `P1` = Launch (harus ada) · `P2` = Post-launch

---

## Phase 1 — Setup Project
**Durasi:** Minggu 1 · Est. 3–5 hari

Fondasi proyek yang benar di awal menghemat refactor besar di tengah jalan.

### 1.1 Inisialisasi Repository

| Task | Detail | Prioritas |
|---|---|---|
| Init Next.js 14 | `npx create-next-app@latest` dengan TypeScript + App Router + Tailwind | P0 |
| Konfigurasi ESLint + Prettier | Enforce code style seragam sejak hari pertama | P0 |
| Setup shadcn/ui | `npx shadcn-ui@latest init` — pilih tema Neutral | P0 |
| Struktur direktori | Buat folder sesuai SAD §3.3: `app/`, `components/`, `lib/`, `types/` | P0 |
| Environment variables | Setup `.env.local` + `.env.example` (tanpa secret); tambahkan ke `.gitignore` | P0 |

### 1.2 Design System Setup

Implementasikan konfigurasi dari [DESIGN.md](./DESIGN.md) sebelum menulis satu komponen pun — ini fondasi visual seluruh aplikasi.

| Task | Referensi DESIGN.md | Detail |
|---|---|---|
| Tailwind config | §9 | Copy konfigurasi lengkap: `brand`, `neutral`, `success/danger/warning`, `borderRadius`, `boxShadow` |
| Font setup | §3.1 | Install `Inter` + `JetBrains Mono` via `next/font` — Inter untuk semua teks, Mono khusus nominal uang |
| CSS variables dark mode | §2.4 | Setup `--bg-base`, `--bg-surface`, `--text-primary`, `--border` di `globals.css` |
| shadcn/ui theme | §2.1 | Override warna shadcn dengan Deep Ocean Navy (`#1E3A5F`) sebagai primary |
| Dark mode toggle | §2.4 | `darkMode: 'class'` di Tailwind — simpan preferensi di localStorage |

### 1.3 Integrasi Library

| Library | Versi | Fungsi |
|---|---|---|
| `@supabase/supabase-js` | Latest | Client Supabase (auth + db + storage) |
| `@tanstack/react-query` | 5.x | Server state, caching, background refetch |
| `zustand` | 4.x | UI state management (filter, modal, sidebar) |
| `react-hook-form` | 7.x | Form handling performant |
| `zod` | 3.x | Schema validation frontend + API |
| `recharts` | 2.x | Grafik dashboard (line, pie, bar) |
| `@sentry/nextjs` | Latest | Error tracking production |

### 1.4 Konfigurasi Supabase Project

| Task | Detail | Prioritas |
|---|---|---|
| Buat project Supabase | Region: `ap-southeast-1` (Singapore) sesuai SAD §6.1 | P0 |
| Pisahkan project Staging & Production | Dua project berbeda — env vars berbeda per environment | P0 |
| Enable Realtime | Aktifkan untuk tabel `transactions` dan `notifications` | P0 |
| Konfigurasi Storage | Buat bucket `avatars` (public) dan `receipts` (private) sesuai SAD §3.4.3 | P1 |

### 1.5 CI/CD Pipeline

| Task | Detail | Prioritas |
|---|---|---|
| Connect repo ke Vercel | Import dari GitHub, set env vars di Vercel dashboard | P0 |
| Branch strategy | `main` → production · `develop` → staging · `feature/*` → preview | P0 |
| Preview deployment | Setiap PR otomatis dapat URL preview dari Vercel | P0 |
| Setup Uptime Robot | Monitor `app.maalify.com` setiap 5 menit sesuai SAD §6.2 | P1 |

---

## Phase 2 — Authentication
**Durasi:** Minggu 1–2 · Est. 4–5 hari

Auth adalah gerbang semua fitur. Harus benar sebelum membangun apapun di atasnya.

### 2.1 Supabase Auth Setup

| Task | Fitur PRD | Detail |
|---|---|---|
| Email/password signup | F-01 | Verifikasi email wajib sebelum akses penuh |
| Google OAuth | F-01 | Aktifkan di Supabase Auth providers; konfigurasi Google Cloud Console |
| Email template | F-01 | Kustomisasi email verifikasi dan reset password (gunakan Resend) |
| Password reset flow | F-01 | Magic link via email — `POST /api/auth/reset-password` |

### 2.2 Next.js Auth Integration

| Task | Detail | Prioritas |
|---|---|---|
| Supabase middleware | `middleware.ts` — validasi JWT setiap request ke protected route (SAD §3.2) | P0 |
| Auth route group | `app/(auth)/login`, `app/(auth)/register`, `app/(auth)/forgot-password` | P0 |
| Protected route group | `app/(dashboard)/` — redirect ke login jika tidak ada session | P0 |
| Auth context / hook | `useUser()` hook untuk akses session di Client Components | P0 |
| Secure cookie | Simpan token di HTTP-only cookie (bukan localStorage) | P0 |

### 2.3 Manajemen Household (terikat Auth)

| Task | Fitur PRD | Tabel ERD |
|---|---|---|
| Create household saat register | F-02 | `households`, `household_members` |
| Generate invite code unik | F-02 | `households.invite_code` — UUID pendek, case-insensitive |
| Join household via kode undangan | F-02 | INSERT ke `household_members` dengan role `member` |
| Role guard middleware | F-03 | Cek `household_members.role` sebelum aksi Admin |
| Edit profil pengguna | F-04 | Update `users.name`, `users.avatar_url` |

### 2.4 Tabel yang Dibuat di Phase Ini

```sql
-- Urutan pembuatan (ikuti dependency FK)
1. users            -- dibuat otomatis oleh Supabase Auth
2. households
3. household_members
4. subscriptions    -- default 'free' saat household dibuat
```

---

## Phase 3 — Database
**Durasi:** Minggu 2–3 · Est. 5–7 hari

Buat semua skema, trigger, index, dan RLS sekaligus — lebih mudah debug sebelum ada data produksi.

### 3.1 Migrasi Skema (Urutan Pembuatan)

Ikuti urutan ini untuk menghindari error FK constraint:

```
Grup A (Auth & Household) — sudah dibuat di Phase 2
  ✓ users · households · household_members · subscriptions

Grup B (Financial Core) — buat di phase ini
  1. categories       (household_id nullable untuk default sistem)
  2. wallets
  3. budgets          (FK ke categories)
  4. debts
  5. notifications

Grup C (Transactions) — buat di phase ini
  6. recurring_transactions  (FK ke wallets, categories)
  7. transactions            (FK ke wallets, categories, recurring_transactions)
  8. transfers               (FK ke wallets 2x)
  9. debt_payments           (FK ke debts, wallets)
  10. attachments            (FK ke transactions)
```

### 3.2 Row Level Security (RLS)

Terapkan policy berikut pada setiap tabel sesuai ERD §5:

| Tabel | Policy | Keterangan |
|---|---|---|
| `wallets` | Anggota household sama | SELECT/INSERT/UPDATE/DELETE |
| `categories` | SELECT semua anggota · INSERT/UPDATE/DELETE Admin only | Kategori default: `household_id IS NULL` |
| `transactions` | Anggota household sama | Member hanya bisa UPDATE/DELETE milik sendiri |
| `budgets` | Admin only write · semua anggota read | |
| `debts` | Anggota household sama | |
| `debt_payments` | Anggota household sama | |
| `notifications` | User sendiri only | `user_id = auth.uid()` |
| `transfers` | Anggota household sama | |
| `attachments` | Via join ke transactions household | |

### 3.3 Database Triggers

Buat 5 trigger sesuai ERD §6 dan SAD §3.4.4:

| Trigger | Event | Aksi |
|---|---|---|
| `trg_update_balance_on_insert` | AFTER INSERT ON transactions | `current_balance +=/-= amount` berdasarkan type |
| `trg_update_balance_on_delete` | AFTER DELETE ON transactions | Reverse operasi sebelumnya |
| `trg_update_balance_on_update` | AFTER UPDATE ON transactions | Reverse lama, apply nilai baru |
| `trg_transfer_balance` | AFTER INSERT ON transfers | `from_wallet -= amount`, `to_wallet += amount` |
| `trg_debt_payment_reduce` | AFTER INSERT ON debt_payments | `debts.remaining_amount -= amount` |

### 3.4 Index & Performa

Buat index sesuai ERD §7:

```sql
CREATE INDEX idx_transactions_household_date ON transactions(household_id, date DESC);
CREATE INDEX idx_transactions_wallet      ON transactions(wallet_id);
CREATE INDEX idx_transactions_category    ON transactions(category_id);
CREATE INDEX idx_budgets_period           ON budgets(household_id, year, month);
CREATE INDEX idx_debts_status             ON debts(household_id, status);
CREATE INDEX idx_notifications_unread     ON notifications(user_id, is_read);
CREATE INDEX idx_wallets_household        ON wallets(household_id);
```

### 3.5 Seed Data

| Data | Detail |
|---|---|
| Kategori default sistem | Minimal 10 kategori: Makan, Transport, Belanja, Gaji, Kesehatan, dll. `household_id = NULL` |
| Subscription default | INSERT `subscriptions(plan='free', status='active')` saat household baru dibuat |
| Test household | 1 household dengan 2 user (admin + member) untuk development |

---

## Phase 4 — Dashboard
**Durasi:** Minggu 4–5 · Est. 7–10 hari

Dashboard adalah halaman yang paling sering dilihat — investasi UX di sini berdampak langsung ke retensi.

### 4.1 Layout & Navigation

Referensi: [DESIGN.md §4.4 Navigation](./DESIGN.md) · [DESIGN.md §5.3 Dashboard Layout](./DESIGN.md)

| Task | Spesifikasi | Prioritas |
|---|---|---|
| Sidebar desktop | Width 240px · Background Deep Ocean Navy `#1E3A5F` · Active item: Growth Green accent bar kiri | P0 |
| Bottom nav mobile | Muncul di `< 768px` · max 5 item · active icon warna `brand-primary` | P0 |
| Top header | Height 56px · background putih · `border-bottom` saja, tanpa shadow berlebihan | P0 |
| Dashboard grid | 3-kolom stat card (top) → full-width chart → 2-kolom → full-width table (lihat DESIGN.md §5.3) | P0 |
| Loading skeletons | Skeleton menyerupai bentuk konten nyata — bukan spinner kosong (DESIGN.md §6.3) | P0 |
| Dark mode | Toggle via `class` strategy · CSS variables `--bg-base`, `--bg-surface` sudah disiapkan di Phase 1 | P1 |

### 4.2 Dashboard Utama (F-21)

Referensi: SAD §5.2 · [DESIGN.md §4.2 Cards](./DESIGN.md) · [DESIGN.md §4.6 Badges](./DESIGN.md)

| Widget | Data Source | Spesifikasi Visual |
|---|---|---|
| Total saldo semua dompet | `SUM(wallets.current_balance)` | Stat Card · font `mono-lg` · strip Navy kiri · realtime |
| Pemasukan bulan ini | `SUM(transactions.amount WHERE type='income')` | Stat Card · strip Growth Green · angka hijau |
| Pengeluaran bulan ini | `SUM(transactions.amount WHERE type='expense')` | Stat Card · strip Danger Red |
| Grafik donat per kategori | `GROUP BY category_id` bulan ini | Recharts Donut · 8-warna palet DESIGN.md §4.7 · center: total nominal |
| 5 transaksi terbaru | `ORDER BY created_at DESC LIMIT 5` | Data table · amount right-aligned mono · income: hijau · expense: neutral-800 |
| Budget summary | `SUM(spent) / budget * 100%` per kategori | Progress bar · amber jika ≥ 80% · red jika ≥ 100% |

### 4.3 Grafik & Laporan (F-22, F-25)

Referensi: [DESIGN.md §4.7 Charts & Visualizations](./DESIGN.md)

| Fitur | Chart Type | Spesifikasi Visual |
|---|---|---|
| Tren pemasukan vs pengeluaran | Line chart | Line income: Growth Green · line expense: Navy · stroke 2.5px · area gradient 20% opacity |
| Breakdown pengeluaran | Donut chart | Stroke width 20px · 8-warna palet tetap per kategori · center text `mono-lg` |
| Saldo per dompet | Bar chart horizontal | Income bar: green · expense bar: navy · `rounded-t-sm` di ujung |

**Aturan chart (DESIGN.md §4.7):** Grid lines sangat ringan (`neutral-100`) · dot hanya muncul saat hover · animasi masuk 500ms `ease-out` saat pertama load.

### 4.4 Realtime Update

Sesuai SAD §3.4.2 — gunakan Supabase Realtime:

```typescript
// Subscribe ke perubahan transaksi household
supabase
  .channel('transactions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'transactions',
    filter: `household_id=eq.${householdId}`
  }, () => queryClient.invalidateQueries(['transactions']))
  .subscribe()
```

---

## Phase 5 — Fitur Utama
**Durasi:** Minggu 4–9 · Est. 3–4 minggu

Dibangun paralel setelah dashboard layout selesai. Urutan pengerjaan berdasarkan dependency antar fitur.

> **Panduan komponen** (berlaku untuk semua fitur di phase ini — referensi [DESIGN.md](./DESIGN.md)):
> - **Tombol:** Primary = Navy, Danger = hanya setelah dialog konfirmasi (§4.1)
> - **Form input:** `rounded-lg`, focus ring 2px Navy, Amount input = font mono right-aligned prefix "Rp" (§4.3)
> - **Status badge:** Pill-shaped `rounded-full`, warna bg opacity 15% (§4.6)
> - **Empty state:** SVG minimal `neutral-300` + heading + CTA button — jangan biarkan halaman kosong tanpa petunjuk (§4.8)
> - **Toast feedback:** Bottom-right desktop · 4 detik sukses · left border sesuai status (§4.9)
> - **Angka uang:** Selalu format ribuan (`1.500.000`), selalu font mono — tidak ada pengecualian (§3.3)

### 5.1 Dompet / Wallet (F-05, F-06, F-07) — Minggu 4–5

| Task | Detail | Prioritas |
|---|---|---|
| CRUD wallet | Create, edit, soft-delete wallet · `wallets.is_active = false` | P0 |
| Halaman list wallet | Card per wallet: nama, tipe (icon), saldo terkini, mata uang | P0 |
| Transfer antar dompet | Form: from_wallet, to_wallet, amount, date · INSERT ke `transfers` | P0 |
| Saldo real-time | Otomatis via DB trigger — tidak perlu kalkulasi di aplikasi | P0 |

### 5.2 Kategori Kustom (F-10) — Minggu 4–5

| Task | Detail | Prioritas |
|---|---|---|
| List kategori | Tampilkan default sistem + kustom household | P0 |
| CRUD kategori | Admin only · nama, tipe (income/expense), icon, warna | P0 |
| Guard hapus | Tidak bisa hapus kategori yang sudah dipakai transaksi | P0 |

### 5.3 Transaksi (F-08, F-09, F-11) — Minggu 5–6

| Task | Detail | Prioritas |
|---|---|---|
| Form catat transaksi | Nominal, tanggal, kategori, dompet, deskripsi, catatan — target < 30 detik | P0 |
| List transaksi | Filter: dompet, kategori, tipe, rentang tanggal · pagination cursor-based | P0 |
| Edit transaksi | Member hanya bisa edit milik sendiri · Admin bisa edit semua | P0 |
| Hapus transaksi | Soft atau hard delete · konfirmasi dialog | P0 |
| Lampiran bukti | Upload foto struk ke bucket `receipts` · max 5MB · MIME check (F-12) | P1 |
| Transaksi berulang | CRUD template `recurring_transactions` · frekuensi: harian/mingguan/bulanan (F-13) | P1 |

### 5.4 Anggaran / Budget (F-14, F-15, F-16) — Minggu 6–7

| Task | Detail | Prioritas |
|---|---|---|
| Buat budget per kategori | Admin only · nominal per bulan per kategori | P0 |
| Overview budget | Progress bar per kategori: `spent / budget * 100%` · merah di > 80% | P0 |
| Notifikasi in-app | Badge di header · list notifikasi · mark as read | P0 |
| Alert budget via job | `check_budget_alerts` Edge Function — cek setiap jam via `pg_cron` | P0 |
| Email alert budget | Kirim via Resend saat 80% dan 100% terlampaui | P1 |

### 5.5 Hutang & Pinjaman (F-17, F-18, F-19, F-20) — Minggu 7–8

| Task | Detail | Prioritas |
|---|---|---|
| Catat hutang (payable) | Nominal, pihak, jatuh tempo, deskripsi · INSERT ke `debts` | P0 |
| Catat piutang (receivable) | Sama seperti hutang, tapi `type='receivable'` | P0 |
| Catat pembayaran cicilan | INSERT `debt_payments` · trigger auto-kurangi `remaining_amount` | P0 |
| Status hutang | `active` → `settled` saat `remaining_amount = 0` · `overdue` via daily job | P0 |
| Reminder jatuh tempo | Edge Function `send_debt_reminders` — H-7 & H-1 via Resend email (F-20) | P1 |

### 5.6 Laporan Bulanan (F-23, F-24) — Minggu 8–9

| Task | Detail | Prioritas |
|---|---|---|
| Halaman laporan bulanan | Total pemasukan, pengeluaran, tabungan · breakdown per kategori | P0 |
| Perbandingan bulan sebelumnya | Delta pemasukan/pengeluaran vs bulan lalu (naik/turun berapa %) | P0 |
| Export PDF | Generate laporan PDF via `react-pdf` atau server-side render | P1 |
| Export Excel | Generate `.xlsx` via `exceljs` — data transaksi mentah | P1 |

### 5.7 Background Jobs (Supabase Edge Functions + pg_cron)

Sesuai SAD §3.3:

| Job | Jadwal | Fungsi |
|---|---|---|
| `generate_recurring_transactions` | Setiap hari 00:05 WIB | Generate transaksi dari template aktif |
| `check_budget_alerts` | Setiap jam | Bandingkan spending vs budget · kirim notifikasi |
| `send_debt_reminders` | Setiap hari 08:00 WIB | Email reminder H-7 & H-1 jatuh tempo hutang |
| `update_debt_status` | Setiap hari 01:00 WIB | Set `status='overdue'` jika lewat `due_date` |

---

## Phase 6 — Testing
**Durasi:** Minggu 10–11 · Est. 7–10 hari

Test bukan akhir — test adalah yang memastikan phase sebelumnya benar-benar selesai.

### 6.1 Unit Testing

| Scope | Tool | Target Coverage |
|---|---|---|
| Zod schemas (validasi form) | Vitest | 100% — semua schema ditest dengan valid + invalid input |
| Utility functions (format currency, date) | Vitest | 100% |
| Business logic (kalkulasi saldo, budget %) | Vitest | 90%+ |

### 6.2 Integration Testing

| Scope | Tool | Detail |
|---|---|---|
| API routes | Vitest + Supertest | Setiap endpoint: success case, unauthorized, invalid payload |
| Supabase RLS policies | Supabase local + Vitest | Test cross-household data leakage tidak terjadi |
| DB triggers | SQL test (pgTAP) | Verify `current_balance` update benar setelah INSERT/DELETE transaksi |

### 6.3 End-to-End Testing

| Skenario | Tool | Prioritas |
|---|---|---|
| Register → buat household → invite member | Playwright | P0 |
| Catat transaksi → cek saldo dompet update | Playwright | P0 |
| Buat budget → catat transaksi → lihat progress | Playwright | P0 |
| Catat hutang → catat cicilan → status settled | Playwright | P0 |
| Transfer antar dompet → cek dua saldo update | Playwright | P0 |
| Login Google OAuth | Playwright | P1 |
| Export laporan PDF | Playwright | P1 |

### 6.4 Performance Testing

| Metrik | Target | Tool |
|---|---|---|
| Page Load (Dashboard) | < 2 detik pada throttled 4G | Lighthouse CI |
| API Response (GET /transactions) | < 500ms P95 | k6 load test |
| Core Web Vitals | LCP < 2.5s · CLS < 0.1 · FID < 100ms | Vercel Analytics |
| DB query P99 | < 100ms | Supabase Dashboard |

### 6.5 Design & Accessibility Review

Referensi: [DESIGN.md §8 Accessibility](./DESIGN.md) · [DESIGN.md §10 Do's & Don'ts](./DESIGN.md)

| Checklist | Detail |
|---|---|
| Contrast ratio | Semua teks: minimum 4.5:1 (WCAG AA) — test dengan browser DevTools atau Polypane |
| Keyboard navigation | Seluruh alur utama (catat transaksi, buat budget, login) harus bisa dilakukan tanpa mouse |
| Focus ring | Semua elemen interaktif punya `ring-2 ring-brand-primary` saat fokus |
| Icon buttons | Semua icon-only button harus punya `aria-label` |
| Touch target | Minimum 44×44px untuk semua elemen di mobile |
| Angka keuangan | Semua nominal menggunakan font mono + format ribuan — audit seluruh halaman |
| Warna semantik | Income = hijau, error = merah — tidak ada inkonsistensi lintas halaman |
| No infinite animation | Tidak ada elemen yang bergerak sendiri tanpa interaksi pengguna |

### 6.6 Security Review

| Checklist | Detail |
|---|---|
| RLS bypass test | Coba akses data household lain dengan token user berbeda — harus 403 |

| Input injection | Test SQL/XSS pada semua form input |
| File upload | Upload executable + oversized file — harus ditolak |
| MIME type spoofing | Upload file .exe dengan header image/jpeg — harus ditolak |
| Env vars | Pastikan tidak ada secret yang ter-commit di repo |
| HTTPS only | Verify HTTP redirect ke HTTPS di semua environment |

---

## Phase 7 — Deployment
**Durasi:** Minggu 11–12 · Est. 5–7 hari

Deploy bukan satu langkah — ini proses bertahap dari staging ke production.

### 7.1 Staging Deployment

| Task | Detail |
|---|---|
| Deploy ke Vercel Staging | Branch `develop` → Supabase Staging project |
| Smoke test staging | Jalankan semua Playwright E2E di staging environment |
| Load test staging | k6 simulasi 100 concurrent user — pastikan response < 500ms |
| Review env vars | Pastikan semua secret production sudah diset di Vercel dashboard |

### 7.2 Production Database Setup

| Task | Detail |
|---|---|
| Jalankan semua migrasi | Urutan: Group A → B → C sesuai Phase 3 |
| Apply semua RLS policies | Verify dengan test cross-household |
| Create semua indexes | Sesuai ERD §7 |
| Seed kategori default | Minimal 10 kategori sistem (`household_id = NULL`) |
| Enable pg_cron | Jadwalkan semua 4 background jobs |
| Test DB triggers | Insert/delete transaksi manual → cek saldo terupdate |

### 7.3 Production Deployment

| Task | Detail |
|---|---|
| Merge `develop` → `main` | Via Pull Request — require approval 1 orang |
| Vercel auto-deploy | Trigger otomatis saat PR di-merge ke `main` |
| Domain setup | Point `app.maalify.com` ke Vercel deployment |
| SSL verification | Pastikan HTTPS aktif dan HTTP redirect benar |
| Sentry production | Aktifkan Sentry dengan source maps untuk stack trace akurat |

### 7.4 Post-Deploy Checklist

| Checklist | Tool |
|---|---|
| Semua halaman load tanpa error | Manual + Sentry |
| Supabase Realtime berfungsi | Test catat transaksi di dua tab berbeda |
| Email terkirim (verifikasi + alert) | Test register akun baru via Resend |
| Background jobs berjalan | Cek pg_cron logs di Supabase Dashboard |
| Uptime Robot aktif monitor | Verify notifikasi test diterima |
| Backup database aktif | Confirm PITR aktif di Supabase Dashboard |
| Lighthouse score | LCP < 2.5s · Accessibility > 90 |

### 7.5 Observability Setup (SAD §8)

| Tool | Setup |
|---|---|
| Vercel Analytics | Aktif otomatis — pantau Core Web Vitals per halaman |
| Sentry | Alert email ke tim jika error rate > 5% dalam 5 menit |
| Uptime Robot | Ping setiap 5 menit · alert jika down > 1 menit |
| Supabase Dashboard | Monitor query slow · connection pool usage · DB size |

---

## Ringkasan Timeline

| Phase | Minggu | Durasi |
|---|---|---|
| 1 · Setup Project | Minggu 1 | 3–5 hari |
| 2 · Authentication | Minggu 1–2 | 4–5 hari |
| 3 · Database | Minggu 2–3 | 5–7 hari |
| 4 · Dashboard | Minggu 4–5 | 7–10 hari |
| 5 · Fitur Utama | Minggu 4–9 | 3–4 minggu |
| 6 · Testing | Minggu 10–11 | 7–10 hari |
| 7 · Deployment | Minggu 11–12 | 5–7 hari |

**Total: ~12 minggu** sesuai PRD §10.

---

## MVP Definition of Done

Maalify v1.0 dianggap siap launch jika semua P0 berikut selesai:

- [ ] User dapat register, login (email & Google), dan buat household
- [ ] User dapat mengundang anggota keluarga via kode undangan
- [ ] User dapat membuat dompet dan melihat saldo real-time
- [ ] User dapat catat pemasukan & pengeluaran dalam < 30 detik
- [ ] User dapat transfer antar dompet
- [ ] Admin dapat set budget per kategori dan melihat progress
- [ ] User mendapat notifikasi in-app saat budget 80% & 100%
- [ ] User dapat catat hutang/piutang dan pembayaran cicilan
- [ ] Dashboard menampilkan ringkasan keuangan dengan grafik
- [ ] Semua halaman load < 2 detik pada koneksi 4G
- [ ] RLS terbukti tidak ada data leak antar household
- [ ] Uptime monitoring aktif dengan alert

---

*Maalify Roadmap v1.0.0 — 19 Mei 2026*
