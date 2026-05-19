# Design System: Maalify

**Version:** 1.0.0
**Last Updated:** 15 Mei 2026
**Stack:** Next.js 14 + Tailwind CSS + shadcn/ui
**Color Modes:** Light + Dark

---

## 1. Visual Theme & Atmosphere

Maalify menggunakan pendekatan **"Calm Clarity"** — sebuah filosofi desain yang mengutamakan ketenangan dan kejelasan informasi. Keuangan adalah topik yang bisa menimbulkan kecemasan; desain Maalify dirancang untuk melawan hal itu dengan tampilan yang terasa aman, bersih, dan terpercaya.

**Kata-kata kunci yang menggambarkan Maalify:**
> *Trustworthy · Clean · Spacious · Focused · Calm*

**Inspirasi desain:** Linear (kejelasan UI), Notion (whitespace yang dihormati), Wise (kepercayaan finansial)

**Prinsip utama:**
- **Whitespace adalah fitur** — ruang kosong bukan pemborosan, tapi alat untuk fokus
- **Data dulu, dekorasi kemudian** — angka dan informasi selalu jadi bintang utama
- **Konsistensi di atas kreativitas** — gunakan komponen yang sama, bukan improvisasi per halaman
- **Satu aksi per layar** — tiap halaman punya satu tujuan utama yang jelas

---

## 2. Color Palette & Roles

### 2.1 Core Brand Colors

| Nama Deskriptif | Hex | Tailwind | Fungsi |
|---|---|---|---|
| **Deep Ocean Navy** | `#1E3A5F` | `[#1E3A5F]` | Warna primer brand — header, tombol utama, elemen kepercayaan |
| **Growth Green** | `#27AE60` | `[#27AE60]` | Aksen positif — income, sukses, konfirmasi, CTA sekunder |
| **Calm White** | `#FFFFFF` | `white` | Permukaan utama — background kartu, modal |
| **Mist Gray** | `#F8FAFB` | `[#F8FAFB]` | Background halaman — memberikan kedalaman tanpa gangguan |

### 2.2 Semantic Colors (Light Mode)

| Nama | Hex | Tailwind Approx | Penggunaan |
|---|---|---|---|
| **Success Green** | `#27AE60` | `green-600` | Pemasukan, konfirmasi, status positif |
| **Danger Red** | `#E74C3C` | `red-500` | Pengeluaran besar, error, hapus |
| **Warning Amber** | `#F59E0B` | `amber-400` | Budget hampir habis (80%), peringatan |
| **Info Blue** | `#2471A3` | `blue-700` | Foreign key, link, informasi netral |
| **Overdue Purple** | `#8E44AD` | `purple-700` | Hutang jatuh tempo, status kritis |

### 2.3 Neutral Scale

Gunakan skala netral untuk teks, border, dan latar. Hindari abu-abu murni — gunakan abu-abu dengan undertone navy untuk harmoni.

| Token | Hex | Penggunaan |
|---|---|---|
| `neutral-950` | `#0F172A` | Teks utama (dark, high-contrast) |
| `neutral-800` | `#1E293B` | Heading body, label form |
| `neutral-600` | `#475569` | Teks sekunder, caption, placeholder |
| `neutral-400` | `#94A3B8` | Disabled state, subtle hint |
| `neutral-200` | `#E2E8F0` | Border ringan, divider |
| `neutral-100` | `#F1F5F9` | Alternating row, hover background |
| `neutral-50`  | `#F8FAFC` | Background halaman utama |

### 2.4 Dark Mode Palette

Dark mode Maalify bukan sekadar inversi — ia menggunakan lapisan gelap yang hangat (navy-tinted) agar terasa premium, bukan dingin.

| Token | Light Mode | Dark Mode | Penggunaan |
|---|---|---|---|
| `--bg-base` | `#F8FAFB` | `#0F172A` | Background halaman |
| `--bg-surface` | `#FFFFFF` | `#1E293B` | Background kartu, modal |
| `--bg-elevated` | `#F1F5F9` | `#293548` | Hover, selected, elevated card |
| `--text-primary` | `#0F172A` | `#F1F5F9` | Teks utama |
| `--text-secondary` | `#475569` | `#94A3B8` | Teks sekunder |
| `--border` | `#E2E8F0` | `#334155` | Border komponen |
| `--brand-primary` | `#1E3A5F` | `#3B82F6` | Tombol & elemen brand (lebih cerah di dark) |
| `--brand-accent` | `#27AE60` | `#34D399` | Aksen hijau (lebih cerah di dark) |

### 2.5 Panduan Penggunaan Warna

- **Jangan gunakan warna merah untuk pengeluaran rutin** — merah hanya untuk error/bahaya. Gunakan `neutral-800` atau `red-500` hanya untuk pengeluaran yang melebihi budget.
- **Income selalu hijau** (`Success Green`) — konsisten di seluruh aplikasi.
- **Tombol primer** harus Deep Ocean Navy di light mode, bukan warna random.
- **Maksimal 3 warna per layar** — terlalu banyak warna merusak kepercayaan pengguna pada aplikasi keuangan.

---

## 3. Typography Rules

### 3.1 Font Family

```css
/* Font Stack */
--font-sans: 'Inter', 'system-ui', '-apple-system', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

**Inter** dipilih karena: keterbacaan tinggi pada angka (lebar digit seragam), banyak weight tersedia, dan terasa modern tanpa kehilangan profesionalisme. Alternatif jika Inter tidak tersedia: `Plus Jakarta Sans`.

**JetBrains Mono** digunakan khusus untuk: angka keuangan besar, kode akun, ID transaksi.

### 3.2 Type Scale

| Token | Size | Weight | Line Height | Penggunaan |
|---|---|---|---|---|
| `display-2xl` | 36px / 2.25rem | 700 Bold | 1.2 | Total saldo utama di dashboard |
| `display-xl` | 30px / 1.875rem | 700 Bold | 1.25 | Angka highlight di kartu ringkasan |
| `heading-lg` | 24px / 1.5rem | 600 SemiBold | 1.3 | Judul halaman |
| `heading-md` | 20px / 1.25rem | 600 SemiBold | 1.35 | Judul section, kartu utama |
| `heading-sm` | 16px / 1rem | 600 SemiBold | 1.4 | Sub-section, label group |
| `body-lg` | 16px / 1rem | 400 Regular | 1.6 | Body text utama |
| `body-md` | 14px / 0.875rem | 400 Regular | 1.6 | Body teks sekunder, list item |
| `body-sm` | 12px / 0.75rem | 400 Regular | 1.5 | Caption, timestamp, label kecil |
| `label` | 12px / 0.75rem | 500 Medium | 1.4 | Form label, badge text |
| `mono-lg` | 20px / 1.25rem | 500 Medium | 1.3 | Nominal transaksi besar |
| `mono-md` | 16px / 1rem | 500 Medium | 1.4 | Nominal transaksi list |
| `mono-sm` | 14px / 0.875rem | 400 Regular | 1.4 | Kode transaksi, ID |

### 3.3 Typography Rules

- **Angka keuangan selalu gunakan font mono** (`JetBrains Mono`) — ini membantu pengguna membandingkan nilai dengan mudah karena digit memiliki lebar yang seragam.
- **Heading tidak perlu ALL CAPS** — Maalify bukan brand yang berteriak; gunakan sentence case.
- **Teks sekunder bukan abu-abu gelap** — gunakan `neutral-600` (`#475569`), bukan `#999`.
- **Letter-spacing:** Heading: `-0.01em` (sedikit rapat, terasa premium). Body: `0em` (normal). Label/caption: `0.03em` (sedikit renggang, mudah dibaca pada ukuran kecil).

---

## 4. Component Styling

### 4.1 Buttons

```
Filosofi: Tombol harus jelas hierarkinya. Pengguna tidak boleh bingung apa yang harus diklik.
```

**Primary Button** — Tindakan utama (simpan, tambah transaksi)
- Background: Deep Ocean Navy (`#1E3A5F`)
- Text: Putih bersih
- Sudut: Moderately rounded (`rounded-lg`, 8px) — terasa dewasa, bukan mainan
- Padding: `px-4 py-2.5` (16px horizontal, 10px vertical)
- Hover: Navy 10% lebih gelap (`#162D4A`)
- Active: Subtle scale down (`scale-[0.98]`)
- Disabled: `opacity-50`, `cursor-not-allowed`

**Secondary Button** — Tindakan pendukung (batal, filter)
- Background: Transparan
- Border: 1.5px solid `neutral-200`
- Text: `neutral-800`
- Hover: `neutral-50` background

**Danger Button** — Aksi destruktif (hapus)
- Background: `red-500` (`#EF4444`)
- Hanya muncul setelah konfirmasi — jangan expose secara langsung
- Wajib ada dialog konfirmasi sebelum aksi final

**Ghost Button** — Aksi tersier (lihat semua, detail)
- Tidak ada border, tidak ada background
- Text: `brand-primary` dengan underline saat hover

**Icon Button** — Aksi compact (edit, hapus pada row table)
- Ukuran: 32×32px atau 36×36px
- Sudut: `rounded-md` (6px)
- Background: Transparan, hover: `neutral-100`

### 4.2 Cards & Containers

```
Filosofi: Kartu adalah unit informasi. Setiap kartu harus punya satu tanggung jawab.
```

**Surface Card** — Kartu standar (kartu statistik, kartu ringkasan)
- Background: `--bg-surface` (putih / dark-surface)
- Border: 1px solid `--border` (`neutral-200`)
- Sudut: **Gently rounded** (`rounded-xl`, 12px) — terasa modern tapi dewasa
- Shadow: Barely-there whisper shadow — `shadow-sm` (`0 1px 3px rgba(0,0,0,0.06)`) — bukan shadow yang berteriak
- Padding: `p-5` atau `p-6` (20px–24px)
- Hover (jika clickable): Shadow sedikit meningkat, border sedikit lebih gelap

**Stat Card** — Kartu angka besar (total saldo, pemasukan bulan ini)
- Sama dengan Surface Card, tapi ada accent color strip di sisi kiri (4px border-left)
- Income card: strip Growth Green
- Expense card: strip Danger Red
- Wallet card: strip Deep Ocean Navy

**Glass Card** — Untuk hero section atau highlight (hanya di halaman onboarding/landing)
- Background: `rgba(255,255,255,0.7)` dengan `backdrop-filter: blur(12px)`
- Border: 1px solid `rgba(255,255,255,0.5)`
- Hanya digunakan secara sparingly — jangan overuse

### 4.3 Form Inputs

```
Filosofi: Input form harus terasa solid dan aman — pengguna sedang memasukkan data keuangan penting.
```

**Text Input / Number Input**
- Border: 1.5px solid `neutral-200` — terlihat jelas tapi tidak agresif
- Background: Putih (light) / `--bg-surface` (dark)
- Border-radius: `rounded-lg` (8px)
- Padding: `px-3.5 py-2.5` (14px horizontal, 10px vertical)
- Focus ring: 2px ring `brand-primary` dengan offset 1px (`ring-2 ring-[#1E3A5F] ring-offset-1`)
- Error state: Border `red-400`, dengan teks error di bawah (`text-red-500 text-sm`)
- Placeholder: `neutral-400` — terasa hint, bukan teks nyata

**Select / Dropdown**
- Tampilan sama dengan Text Input
- Gunakan Radix UI Select (via shadcn/ui) untuk aksesibilitas penuh
- Custom chevron icon `neutral-500`

**Amount Input** — Khusus input nominal uang
- Font: `JetBrains Mono`, `text-xl` (`mono-lg`)
- Text alignment: Right-aligned — angka lebih mudah dibaca dari kanan
- Prefix "Rp" di sisi kiri dengan `text-neutral-500`
- Format ribuan otomatis saat user mengetik (contoh: `1.500.000`)

**Date Picker**
- Gunakan shadcn/ui Calendar component
- Hari ini: highlighted dengan background `brand-primary` ringan
- Selected: solid `brand-primary` background

### 4.4 Navigation

**Sidebar (Desktop)**
- Width: 240px (collapsed: 64px icon-only)
- Background: Deep Ocean Navy (`#1E3A5F`)
- Text: `rgba(255,255,255,0.75)` untuk item inactive
- Active item: Background `rgba(255,255,255,0.12)`, teks putih penuh, accent bar kiri `Growth Green`
- Logo area: 64px height, padding `px-5`
- Nav items: `px-3 py-2`, `rounded-lg`, gap antar item `4px`

**Bottom Navigation (Mobile)**
- Background: Putih / dark surface
- Border top: 1px solid `--border`
- Max 5 item
- Active icon: `brand-primary` color, label bold
- Badge notifikasi: `red-500` dot di sudut icon

**Top Header**
- Height: 56px desktop, 52px mobile
- Background: Putih / dark surface dengan `border-bottom`
- Tidak ada shadow berlebihan — satu border sudah cukup

### 4.5 Tables

**Data Table** (daftar transaksi)
- Header row: Background `neutral-50`, teks `neutral-600 uppercase text-xs tracking-wider`
- Body rows: Background alternatif — baris genap `neutral-50/40`, ganjil putih
- Hover row: `neutral-100`
- Border: Hanya `border-bottom` per row, tidak ada border grid penuh
- Density: Padding `py-3 px-4` per cell — tidak terlalu sesak, tidak terlalu longgar
- Angka nominal: Right-aligned, font mono
- Amount positif (income): `text-green-600 font-medium`
- Amount negatif (expense): `text-neutral-800 font-medium`

### 4.6 Badges & Chips

**Category Badge**
- Shape: **Pill-shaped** (`rounded-full`) — membedakan dari tombol kotak
- Padding: `px-2.5 py-0.5`
- Size: `text-xs` (`label` scale)
- Background: Color kategori dengan opacity 15%, teks warna penuh

**Status Badge**
- `active` → `bg-green-100 text-green-700`
- `overdue` → `bg-red-100 text-red-700`
- `settled` → `bg-neutral-100 text-neutral-600`
- `warning` → `bg-amber-100 text-amber-700`

### 4.7 Charts & Visualizations

```
Filosofi: Grafik adalah penyederhanaan — jangan tambahkan kompleksitas visual yang tidak perlu.
```

**Library:** Recharts (sudah termasuk dalam tech stack)

**Line Chart (Tren bulanan)**
- Warna line income: `Growth Green` (`#27AE60`)
- Warna line expense: Deep Ocean Navy (`#1E3A5F`)
- Stroke width: 2.5px
- Dot: 4px radius, hanya muncul saat hover
- Area fill di bawah line: Gradient transparan ke putih, opacity 20%
- Grid lines: `neutral-100`, sangat ringan — bukan kotak-kotak yang mengganggu

**Donut Chart (Pengeluaran per kategori)**
- Stroke width: 20px (ring tebal, lebih readable)
- Warna: Gunakan palet yang konsisten per kategori (assign warna per kategori, simpan di database)
- Center text: Total nominal dengan `mono-lg`
- Legend: Di bawah atau samping dengan color dot + nama + persentase

**Bar Chart (Perbandingan budget vs aktual)**
- Income bar: Growth Green
- Expense bar: Deep Ocean Navy
- Bar radius: `rounded-t-sm` di ujung atas
- Gap antar bar: 4px

**Color Palette untuk Charts (8 warna, tidak berulang):**
```
#1E3A5F  (Navy)     → Transportasi, Tagihan
#27AE60  (Green)    → Tabungan, Income
#2471A3  (Blue)     → Pendidikan, Kesehatan
#8E44AD  (Purple)   → Hiburan, Langganan
#E67E22  (Orange)   → Makan & Minum
#E74C3C  (Red)      → Darurat
#16A085  (Teal)     → Belanja
#F59E0B  (Amber)    → Lainnya
```

### 4.8 Empty States

Ketika data kosong, tampilkan ilustrasi sederhana + teks yang ramah + CTA.

- Ilustrasi: SVG minimal, monochromatic (`neutral-300`)
- Heading: `heading-md`, `neutral-600`
- Body: `body-md`, `neutral-400`
- CTA button: Primary button dengan label aksi jelas
- Contoh: *"Belum ada transaksi bulan ini"* + tombol *"Catat Transaksi Pertama"*

### 4.9 Toast & Notifications

**Toast (in-app feedback)**
- Posisi: Bottom-right desktop, bottom-center mobile
- Duration: 4 detik untuk sukses, tetap hingga dismiss untuk error
- Success: Left border `Growth Green`, ikon checkmark
- Error: Left border `Danger Red`, ikon X
- Warning: Left border `Warning Amber`, ikon segitiga
- Shape: `rounded-lg`, shadow `shadow-lg`
- Tidak boleh overlap dengan konten penting

---

## 5. Layout Principles

### 5.1 Grid System

**Desktop (≥1024px)**
- Container max-width: `1280px`, centered
- Sidebar: 240px fixed
- Content area: Fluid
- Column grid: 12-column, `gap-6` (24px)

**Tablet (768px–1023px)**
- Sidebar collapsed ke icon-only (64px) atau bottom nav
- Column grid: 8-column

**Mobile (< 768px)**
- No sidebar — bottom navigation
- Single column layout
- Full-width cards dengan `px-4` margin

### 5.2 Spacing System

Gunakan Tailwind spacing scale secara konsisten. Hindari angka arbitrary.

| Token | px | Penggunaan |
|---|---|---|
| `space-1` | 4px | Gap antara icon dan label |
| `space-2` | 8px | Gap dalam komponen kecil |
| `space-3` | 12px | Gap antar elemen dalam kartu |
| `space-4` | 16px | Padding internal kartu kecil |
| `space-5` | 20px | Padding internal kartu standar |
| `space-6` | 24px | Gap antar kartu, padding section |
| `space-8` | 32px | Gap antar section besar |
| `space-12` | 48px | Margin atas heading halaman |
| `space-16` | 64px | Padding halaman atas |

### 5.3 Dashboard Layout

```
┌─────────────────────────────────────────────┐
│  Sidebar (240px)  │  Header (56px)           │
│                   ├─────────────────────────┤
│  [Logo]           │  Page Title              │
│                   │                         │
│  Navigation       │  [Stat] [Stat] [Stat]   │  ← 3 kolom stat card
│  items            │                         │
│                   │  [Chart: Tren 6 bulan]  │  ← Full width
│                   │                         │
│                   │  [Budget]  [Hutang]     │  ← 2 kolom
│                   │                         │
│                   │  [Transaksi Terbaru]    │  ← Full width table
└─────────────────────────────────────────────┘
```

**Stat cards (top row):** 3 kolom — Total Saldo, Pemasukan Bulan Ini, Pengeluaran Bulan Ini

### 5.4 Whitespace Philosophy

- **Never cram** — lebih baik scroll daripada sesak
- Padding dalam kartu minimal `p-5` (20px), idealnya `p-6` (24px)
- Gap antar kartu minimal `gap-4` (16px), idealnya `gap-6` (24px)
- Section spacing: `mb-8` atau `mb-12` antar section besar
- Breathing room di sekitar heading halaman: `mb-6` sebelum konten pertama

---

## 6. Motion & Interaction

```
Filosofi: Animasi harus memperjelas, bukan menghibur. Setiap animasi harus punya tujuan.
```

### 6.1 Duration & Easing

| Jenis | Duration | Easing | Penggunaan |
|---|---|---|---|
| Micro | 100ms | `ease-out` | Hover state, focus ring |
| Short | 150ms | `ease-out` | Tombol aktif, badge toggle |
| Medium | 200ms | `ease-in-out` | Modal open/close, dropdown |
| Long | 300ms | `ease-in-out` | Page transition, drawer |
| Chart | 500ms | `ease-out` | Chart render pertama kali |

### 6.2 Transition Rules

- **Hover:** `transition-colors duration-150` — perubahan warna terasa responsif
- **Modal open:** Fade in + scale up dari 95% ke 100% (`duration-200`)
- **Sidebar collapse:** Width transition `duration-300`
- **Loading state:** Skeleton shimmer `duration-1500 repeat-infinite`
- **Angka counter:** Animate dari 0 ke nilai aktual saat dashboard pertama load (satu kali saja)
- **Tidak ada animasi berulang** yang terjadi tanpa interaksi pengguna — tidak ada elemen yang bergerak sendiri

### 6.3 Loading States

- **Skeleton loader** (bukan spinner) untuk konten yang butuh fetch data — skeleton menyerupai bentuk konten nyata
- **Button loading:** Ganti teks dengan spinner kecil + text "Menyimpan..." saat submit form
- **Page transition:** Subtle fade, bukan slide yang dramatik

---

## 7. Iconography

**Library:** Lucide Icons (sudah terintegrasi dengan shadcn/ui)

**Ukuran standar:**
- Navigation icon: 20×20px
- Inline icon (dalam teks/button): 16×16px
- Feature icon (dalam kartu kosong): 48×48px dengan container 64×64px background `neutral-100`

**Style:** Outline (bukan solid/filled) untuk konsistensi dengan karakter Clean & Minimal Maalify

**Kategori icon yang direkomendasikan:**
| Fungsi | Icon |
|---|---|
| Pemasukan | `TrendingUp` (hijau) |
| Pengeluaran | `TrendingDown` (merah) |
| Dompet | `Wallet` |
| Transfer | `ArrowLeftRight` |
| Budget | `Target` |
| Hutang | `Receipt` |
| Laporan | `BarChart2` |
| Notifikasi | `Bell` |
| Pengaturan | `Settings` |
| Tambah | `Plus` |
| Edit | `Pencil` |
| Hapus | `Trash2` |
| Filter | `SlidersHorizontal` |
| Ekspor | `Download` |

**Jangan gunakan:** emoji sebagai icon fungsional dalam UI (boleh di kategori label sebagai visual dekoratif)

---

## 8. Accessibility (a11y)

- **Contrast ratio:** Minimum 4.5:1 untuk teks normal, 3:1 untuk teks besar — wajib WCAG AA
- **Focus visible:** Semua elemen interaktif harus memiliki focus ring yang jelas (ring-2 ring-brand-primary)
- **Keyboard navigation:** Seluruh aplikasi harus bisa digunakan dengan keyboard saja
- **Screen reader:** Semua icon button harus punya `aria-label`, semua form input harus punya `<label>`
- **Color blindness:** Jangan andalkan warna saja — selalu gunakan icon/teks untuk menyampaikan makna (contoh: status badge harus ada ikon + teks + warna)
- **Touch target:** Minimum 44×44px untuk semua elemen interaktif di mobile

---

## 9. Tailwind CSS Config Reference

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',  // Toggle dark mode via class
  theme: {
    extend: {
      colors: {
        brand: {
          primary:  '#1E3A5F',  // Deep Ocean Navy
          accent:   '#27AE60',  // Growth Green
          'primary-dark': '#3B82F6',  // Brand primary in dark mode
          'accent-dark':  '#34D399',  // Brand accent in dark mode
        },
        neutral: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          400: '#94A3B8',
          600: '#475569',
          800: '#1E293B',
          950: '#0F172A',
        },
        success: '#27AE60',
        danger:  '#E74C3C',
        warning: '#F59E0B',
        info:    '#2471A3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'card': '12px',   // Surface card
        'btn':  '8px',    // Buttons
        'input':'8px',    // Form inputs
        'badge':'9999px', // Pill badges
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)',
        'modal':   '0 20px 60px rgba(0,0,0,0.12)',
      },
    },
  },
}
```

---

## 10. Do's & Don'ts

### ✅ Do

- Gunakan font mono (`JetBrains Mono`) untuk semua nominal keuangan
- Berikan ruang napas (whitespace) yang cukup antar elemen
- Tampilkan empty state yang informatif dan actionable
- Gunakan skeleton loader, bukan spinner untuk konten yang di-fetch
- Konsisten dengan spacing scale Tailwind (jangan angka arbitrary)
- Income → selalu hijau, error → selalu merah — jaga konsistensi semantik warna
- Tambah `aria-label` pada semua icon-only button

### ❌ Don't

- Jangan gunakan lebih dari 3 warna berbeda dalam satu kartu
- Jangan gunakan shadow yang terlalu tebal pada kartu standar
- Jangan animasikan elemen tanpa interaksi pengguna (no infinite animations)
- Jangan gunakan ALL CAPS untuk heading atau body text
- Jangan tampilkan angka tanpa format ribuan (tampilkan `1.500.000` bukan `1500000`)
- Jangan gunakan warna merah untuk semua pengeluaran — hanya untuk yang melebihi budget
- Jangan buat halaman yang tidak punya hierarchy visual yang jelas

---

*Dokumen ini adalah living document. Update setiap kali ada keputusan desain baru yang disepakati tim.*

*Maalify Design System v1.0.0 — 15 Mei 2026*
